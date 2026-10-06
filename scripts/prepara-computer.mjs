// Originali intatti → copia derivata senza marchi e con CRT spento → GLB web + misure condivise.
import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { Box3, Matrix4, Vector3 } from 'three'
import sharp from 'sharp'

const radice = join(import.meta.dirname, '..')
const originale = join(radice, 'sorgenti/computer/originali/ScrivaniaComputer.glb')
const derivato = join(radice, 'sorgenti/computer/export/Postazione.glb')
const destinazione = join(radice, 'public/computer/computer.glb')
const misure = join(radice, 'src/components/computer/misureComputer.json')
const io = new NodeIO()
const documento = await io.read(originale)
const root = documento.getRoot()
const buffer = root.listBuffers()[0]

// Rettangoli UV dei marchi fotografati nelle superfici. Si suddividono i triangoli lungo
// questi bordi e si assegna solo alla zona del marchio un materiale neutro campionato
// dalla superficie adiacente: geometria e texture originali restano intatte altrove.
// UV glTF: origine in alto a sinistra. [u min, v min, u max, v max, campione u, campione v].
const marchi = {
  hello_4: [[0.321, 0.46, 0.353, 0.499, 0.366, 0.48]],
  'Apple-0': [[0.03, 0.155, 0.067, 0.215, 0.086, 0.21], [0.493, 0.23, 0.529, 0.313, 0.55, 0.30], [0.899, 0.292, 0.944, 0.4, 0.87, 0.34]],
  Macintosh_2: [[0.397, 0.382, 0.422, 0.425, 0.439, 0.41]],
  'Macintosh-128K-retro': [[0.108, 0.715, 0.377, 0.779, 0.4, 0.73]],
  klava_2_1: [[0.105, 0.198, 0.16, 0.318, 0.09, 0.34]],
  klava_2: [[0.105, 0.198, 0.16, 0.318, 0.09, 0.34]],
  decal_2: [[0.27, 0.19, 0.76, 0.65, 0.9, 0.25], [0.34, 0.172, 0.57, 0.19, 0.9, 0.25]],
}

// Taglio di un poligono, interpolando tutti gli attributi (posizione, normale, UV).
function taglia(poligono, asse, bordo, maggiore, uvOffset) {
  const dentro = [], fuori = []
  for (let i = 0; i < poligono.length; i++) {
    const a = poligono[i], b = poligono[(i + 1) % poligono.length]
    const da = (a[uvOffset + asse] - bordo) * (maggiore ? 1 : -1)
    const db = (b[uvOffset + asse] - bordo) * (maggiore ? 1 : -1)
    ;(da >= 0 ? dentro : fuori).push(a)
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db)
      const v = a.map((x, k) => x + (b[k] - x) * t)
      dentro.push(v); fuori.push(v)
    }
  }
  return [dentro, fuori]
}
function triangola(poligono, out) {
  for (let i = 1; i < poligono.length - 1; i++) out.push(poligono[0], poligono[i], poligono[i + 1])
}
function primitivaDa(vertici, attributi, materiale) {
  const p = documento.createPrimitive().setMaterial(materiale)
  let offset = 0
  for (const [semantica, a] of attributi) {
    const size = a.getElementSize()
    const dati = vertici.flatMap((v) => v.slice(offset, offset + size))
    p.setAttribute(semantica, documento.createAccessor().setBuffer(buffer).setType(a.getType()).setArray(new Float32Array(dati)))
    offset += size
  }
  // Nessun indice: weld/optimize ricostruisce i vertici condivisi.
  return p
}

for (const [nome, regioni] of Object.entries(marchi)) {
  const materiale = root.listMaterials().find((m) => m.getName() === nome)
  if (!materiale?.getBaseColorTexture()) throw new Error(`materiale del marchio assente: ${nome}`)
  const { data, info } = await sharp(materiale.getBaseColorTexture().getImage()).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  for (const [u0, v0, u1, v1, su, sv] of regioni) {
    const index = (Math.floor(sv * info.height) * info.width + Math.floor(su * info.width)) * info.channels
    const linearizza = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
    const neutro = documento.createMaterial(`${nome}-senza-marchio`).setBaseColorFactor([
      linearizza(data[index]), linearizza(data[index + 1]), linearizza(data[index + 2]), 1,
    ]).setMetallicFactor(0).setRoughnessFactor(materiale.getRoughnessFactor()).setDoubleSided(materiale.getDoubleSided())
    for (const mesh of root.listMeshes()) for (const p of [...mesh.listPrimitives()]) {
      if (p.getMaterial() !== materiale || !p.getAttribute('TEXCOORD_0')) continue
      const attributi = p.listSemantics().map((s) => [s, p.getAttribute(s)])
      const uvOffset = attributi.slice(0, attributi.findIndex(([s]) => s === 'TEXCOORD_0')).reduce((s, [, a]) => s + a.getElementSize(), 0)
      const indice = p.getIndices()
      const count = indice?.getCount() ?? p.getAttribute('POSITION').getCount()
      const esterno = [], coperto = []
      for (let i = 0; i < count; i += 3) {
        let poligono = [0, 1, 2].map((k) => attributi.flatMap(([, a]) => a.getElement(indice ? indice.getScalar(i + k) : i + k, [])))
        for (const [asse, bordo, maggiore] of [[0, u0, true], [0, u1, false], [1, v0, true], [1, v1, false]]) {
          const [dentro, fuori] = taglia(poligono, asse, bordo, maggiore, uvOffset)
          triangola(fuori, esterno)
          poligono = dentro
          if (!poligono.length) break
        }
        triangola(poligono, coperto)
      }
      if (!coperto.length) continue
      mesh.removePrimitive(p)
      if (esterno.length) mesh.addPrimitive(primitivaDa(esterno, attributi, materiale))
      mesh.addPrimitive(primitivaDa(coperto, attributi, neutro))
      p.dispose()
    }
  }
}
// La stampa sul foglio resta un foglio, ma senza la mela; nessun oggetto della postazione viene tolto.
root.listMaterials().find((m) => m.getName() === 'apple_2').setBaseColorTexture(null).setBaseColorFactor([0.55, 0.52, 0.45, 1])
for (const nome of ['hello', 'Material.002']) {
  const m = root.listMaterials().find((m) => m.getName() === nome)
  m.setBaseColorTexture(null).setEmissiveTexture(null).setEmissiveFactor([0, 0, 0]).setBaseColorFactor([0.008, 0.01, 0.009, 1]).setMetallicFactor(0).setRoughnessFactor(0.28)
}

const nodi = root.listNodes()
function scatola(lista) {
  const b = new Box3()
  for (const n of lista) {
    const matrice = new Matrix4().fromArray(n.getWorldMatrix())
    for (const p of n.getMesh()?.listPrimitives() ?? []) {
      const a = p.getAttribute('POSITION')
      for (let i = 0; i < a.getCount(); i++) b.expandByPoint(new Vector3().fromArray(a.getElement(i, [])).applyMatrix4(matrice))
    }
  }
  if (b.isEmpty()) throw new Error('ingombro del modello vuoto')
  return b
}
const floor = scatola(nodi).min.y
const scena = root.listScenes()[0]
const postazione = documento.createNode('postazione-macintosh').setRotation([0, 1, 0, 0]).setTranslation([0, -floor, 0])
for (const n of [...scena.listChildren()]) { scena.removeChild(n); postazione.addChild(n) }
scena.addChild(postazione)
const tondo = (v) => +v.toFixed(6)
const box = (b) => ({ min: b.min.toArray().map(tondo), max: b.max.toArray().map(tondo) })
const seleziona = (test) => nodi.filter((n) => test(n.getName()))
const completa = scatola(nodi)
const monitor = scatola(seleziona((n) => /^(Cube\.(000|002|003|006|007|008|009|013|014)|Cylinder(\.001)?_|Plane\.00[3-9]_hello)/.test(n)))
const mouse = scatola(seleziona((n) => /^(Cube\.001_|Plane(\.001)?_Apple-0)/.test(n)))
const tastiera = scatola(seleziona((n) => /^(knopki|korpus2|Cube\.01[012]_)/.test(n)))
// Piano appena davanti al punto più convesso del CRT; conserva l'inclinazione del vetro.
const normalizza = ([x, y, z]) => [-x, y - floor, -z].map(tondo)
const vetro = [normalizza([0.151, 1.142, 0.114]), normalizza([0.151, 1.142, -0.114]), normalizza([0.160, 0.958, -0.114]), normalizza([0.160, 0.958, 0.114])]
const geometria = { fonte: 'macintosh 128k · kreems · cc by 4.0', scala: tondo(3.1 / (completa.max.y - completa.min.y)), postazione: box(completa), monitor: box(monitor), mouse: box(mouse), tastiera: box(tastiera), vetro }
mkdirSync(join(radice, 'sorgenti/computer/export'), { recursive: true })
mkdirSync(join(radice, 'public/computer'), { recursive: true })
await io.write(derivato, documento)
execFileSync(join(radice, 'node_modules/.bin/gltf-transform'), ['optimize', derivato, destinazione, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024', '--instance', 'false'], { stdio: 'inherit' })
writeFileSync(misure, JSON.stringify(geometria, null, 2) + '\n')
const mb = (f) => (statSync(f).size / 1024 / 1024).toFixed(2)
console.log(`\npostazione pronta: ${mb(originale)} MB → ${mb(destinazione)} MB; altezza nella sala 3,1 u`)
if (statSync(destinazione).size > 2 * 1024 * 1024) console.warn('attenzione: il modello web supera 2 MB')
