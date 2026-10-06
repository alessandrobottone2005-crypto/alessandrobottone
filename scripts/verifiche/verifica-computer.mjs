// node scripts/verifiche/verifica-computer.mjs [url build] [cartella risultati]
// Geometria del GLB finale + accensione reale, viewport, ritorno e fallback del modello.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import { Box3, Matrix4, Vector3 } from 'three'
import sharp from 'sharp'
import { apriChrome, attesa, entra } from '../lib/chrome.mjs'

const radice = join(import.meta.dirname, '../..')
const url = process.argv[2] ?? 'http://127.0.0.1:4173/'
const out = process.argv[3] ?? join(radice, 'verifiche/risultati/test-macintosh/computer')
mkdirSync(out, { recursive: true })
const misure = JSON.parse(readFileSync(join(radice, 'src/components/computer/misureComputer.json'), 'utf8'))
const modello = join(radice, 'public/computer/computer.glb')
assert.ok(statSync(modello).size < 2 * 1024 * 1024, 'GLB web sotto 2 MiB')
const d = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder }).read(modello)
const completa = new Box3(), mouse = new Box3(new Vector3().fromArray(misure.mouse.min), new Vector3().fromArray(misure.mouse.max)).expandByScalar(0.001)
const centro = new Vector3()
let mouseTriangoli = 0, triangoli = 0
for (const n of d.getRoot().listNodes()) {
  const matrice = new Matrix4().fromArray(n.getWorldMatrix())
  for (const p of n.getMesh()?.listPrimitives() ?? []) {
    const pos = p.getAttribute('POSITION'), indice = p.getIndices()
    for (let i = 0; i < pos.getCount(); i++) completa.expandByPoint(new Vector3().fromArray(pos.getElement(i, [])).applyMatrix4(matrice))
    const count = indice?.getCount() ?? pos.getCount()
    for (let i = 0; i < count; i += 3) {
      centro.set(0, 0, 0)
      for (let k = 0; k < 3; k++) centro.add(new Vector3().fromArray(pos.getElement(indice ? indice.getScalar(i + k) : i + k, [])).applyMatrix4(matrice))
      centro.multiplyScalar(1 / 3)
      if (mouse.containsPoint(centro)) mouseTriangoli++
      triangoli++
    }
    assert.deepEqual(p.getMaterial().getEmissiveFactor(), [0, 0, 0], 'nessun materiale rimane acceso nel GLB')
  }
}
assert.ok(mouseTriangoli > 10, 'guscio del mouse presente dopo join e Meshopt')
assert.ok(Math.abs(completa.min.y * misure.scala) < 0.01, 'appoggio a pavimento')
assert.ok(Math.abs((completa.max.y - completa.min.y) * misure.scala - 3.1) < 0.01, 'altezza postazione 3,1 u')
for (const t of d.getRoot().listTextures()) {
  const m = await sharp(t.getImage()).metadata()
  assert.ok(m.width <= 1024 && m.height <= 1024, 'texture <=1024 px')
  assert.equal(m.format, 'webp', 'texture WebP')
}
const risultati = [{ caso: 'asset', esito: 'ok', bytes: statSync(modello).size, triangoli, mouseTriangoli }]
console.log(`asset: ok (${triangoli} triangoli; ${mouseTriangoli} nel mouse)`)
const casi = [
  { nome: 'desktop-monitor', width: 1440, height: 900, accensione: 'monitor' },
  { nome: 'desktop-tastiera', width: 1440, height: 900, accensione: 'tastiera' },
  { nome: 'tablet-mouse', width: 820, height: 1180, accensione: 'mouse' },
  { nome: 'telefono-mouse', telefono: true, cpu: 1, accensione: 'mouse' },
  { nome: 'telefono-orizzontale', telefono: true, cpu: 1, width: 844, height: 390, accensione: 'monitor' },
  { nome: 'ridotto-desktop', width: 1440, height: 900, ridotto: true },
  { nome: 'modello-assente', width: 1440, height: 900, senzaModello: true, accensione: 'monitor' },
]
for (const caso of casi) {
  const b = await apriChrome(caso)
  const foto = async (nome) => writeFileSync(join(out, `${caso.nome}-${nome}.png`), Buffer.from((await b.cmd('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  try {
    if (caso.senzaModello) {
      await b.cmd('Network.enable')
      await b.cmd('Network.setBlockedURLs', { urls: ['*/computer/computer.glb'] })
    }
    await b.cmd('Page.navigate', { url })
    await entra(b)
    if (!caso.ridotto) {
      await b.valuta(`scrollTo(0, document.querySelector('#portfolio > div').getBoundingClientRect().top + scrollY + innerHeight * 1.6)`)
      await b.aspetta(`getComputedStyle(document.querySelector('button[aria-label="accendi il computer"]')).visibility === 'visible'`)
      await attesa(400)
      await foto('spento')
      const sel = caso.accensione === 'mouse' ? 'button[aria-hidden="true"][data-cursore="accendi"]' : 'button[aria-label="accendi il computer"]'
      if (caso.accensione === 'tastiera') {
        await b.valuta(`document.querySelector(${JSON.stringify(sel)}).focus({preventScroll:true})`)
        await b.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
        await b.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
      } else if (caso.telefono) {
        const punto = await b.valuta(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()`)
        await b.cmd('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...punto, id: 1 }] })
        await b.cmd('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      } else await b.clic(sel)
      await b.aspetta(`!!document.querySelector('[data-mac][data-fase="avvio"]')`)
    } else await b.clic('a[href="#portfolio"]')
    await b.aspetta(`!!document.querySelector('[data-mac][data-fase="acceso"]:not([inert])')`)
    if (caso.accensione === 'tastiera') assert.ok(await b.valuta(`document.querySelector('[data-mac]').contains(document.activeElement)`), 'focus portato nel Finder')
    const schermo = await b.valuta(`(() => { const r = document.querySelector('[data-mac]').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,tel:!!document.querySelector('[data-mac][data-telefono]')} })()`)
    if (caso.telefono) {
      assert.ok(schermo.tel && Math.abs(schermo.w - schermo.vw) < 2 && Math.abs(schermo.h - schermo.vh) < 2, 'Finder a tutta vista su telefono')
    } else assert.ok(schermo.x > 0 && schermo.y > 0 && schermo.x + schermo.w < schermo.vw && schermo.y + schermo.h < schermo.vh, 'cornice visibile su desktop/tablet')
    await foto('acceso')
    await b.clic('a[href="#header"]')
    await b.aspetta(`document.activeElement.id === 'header'`)
    await b.clic('a[href="#portfolio"]')
    await b.aspetta(`!!document.querySelector('[data-mac][data-fase="acceso"]:not([inert])')`)
    assert.deepEqual(b.errori, [], 'nessuna eccezione runtime')
    risultati.push({ caso: caso.nome, esito: 'ok', schermo })
    console.log(`${caso.nome}: ok`)
  } catch (errore) {
    await foto('errore').catch(() => {})
    risultati.push({ caso: caso.nome, esito: 'errore', dettaglio: String(errore), errori: b.errori })
    console.error(`${caso.nome}: ${errore}`)
    process.exitCode = 1
  } finally { await b.chiudi() }
}
writeFileSync(join(out, 'risultati.json'), JSON.stringify(risultati, null, 2) + '\n')
