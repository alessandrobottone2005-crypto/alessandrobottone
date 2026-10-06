// Dove sta il computer e come lo inquadra la camera, senza dipendere da React.
// La camera reale resta ferma: si muove il «mondo» (sala e computer), così il volto,
// misurato in pixel sul piano z = 0, non cambia mai scala.
// Lo usano la scena 3d, l’interfaccia posata sullo schermo e la versione con movimento ridotto.
import { Matrix4, Quaternion, Vector3, MathUtils } from 'three'
import { movimento } from '@/config/movimento'
import sala from '@/components/volto/stazioniSala.json'
import misure from './misureComputer.json'
import { misureScena, percorso } from '@/components/volto/percorso'

const C = movimento.computer
// Campo 40°: si vede la sala in profondità. La distanza tiene il piano del volto identico a prima (20 · tan 9°).
export const CAMPO = sala.campo
export const CAMERA = new Vector3(0, 0, sala.distanza)
const tangente = Math.tan(MathUtils.degToRad(CAMPO / 2))

// Blender (x, y, z) → sito (x, z, −y)
export const daBlender = ([x, y, z]: number[]) => new Vector3(x, z, -y)
const punto = (n: 'header' | 'computer' | 'biografia' | 'contatti') => daBlender(sala[n].punto)
const occhioDi = (n: 'header' | 'biografia' | 'contatti') => daBlender(sala[n].occhio)

// Postazione completa alta 3,1 u; origine a pavimento, CRT rivolto verso −x nel GLB derivato.
export const COMPUTER = {
  posizione: punto('computer'),
  scala: misure.scala,
  // un quarto di giro porta il CRT verso l’inizio della sala
  rotazioneY: Math.PI / 2,
}

// Piano condiviso da DOM, bagliore e luce: quattro angoli davanti alla curvatura del CRT.
// Ordine: alto sinistra, alto destra, basso destra, basso sinistra. Misure generate da prepara-computer.
const angoliModello = misure.vetro.map((v) => new Vector3().fromArray(v))
const destraVetro = angoliModello[1].clone().sub(angoliModello[0])
const suVetro = angoliModello[0].clone().sub(angoliModello[3])
export const VETRO = {
  angoli: angoliModello,
  centro: angoliModello.reduce((s, v) => s.add(v), new Vector3()).multiplyScalar(0.25),
  larghezza: destraVetro.length(),
  altezza: suVetro.length(),
  normale: destraVetro.clone().cross(suVetro).normalize(),
}
export const matriceVetro = new Matrix4().makeBasis(destraVetro.normalize(), suVetro.normalize(), VETRO.normale).setPosition(VETRO.centro)

export const matriceComputer = new Matrix4().compose(
  COMPUTER.posizione,
  new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), COMPUTER.rotazioneY),
  new Vector3().setScalar(COMPUTER.scala),
)
/** angoli e centro del vetro nelle coordinate dell’edificio */
const angoliSchermo = angoliModello.map((v) => v.clone().applyMatrix4(matriceComputer))
export const centroSchermo = angoliSchermo.reduce((s, v) => s.add(v), new Vector3()).multiplyScalar(0.25)
const larghezzaVetro = angoliSchermo[0].distanceTo(angoliSchermo[1])
const altezzaVetro = angoliSchermo[0].distanceTo(angoliSchermo[3])
const normaleSchermo = VETRO.normale.clone().transformDirection(matriceComputer)

const puntatoreTouch = matchMedia('(pointer: coarse)')
export const telefono = (larghezza: number) => larghezza < 768 || (puntatoreTouch.matches && larghezza < 1024 && innerHeight < 500)

/** distanza della camera dallo schermo nella sosta */
function distanzaSosta(aspetto: number, mobile: boolean) {
  // telefono: la camera supera la cornice, il vetro riempie l’altezza
  if (mobile) return (altezzaVetro / (2 * tangente)) * 0.9
  return Math.max(altezzaVetro / (2 * tangente * C.altezzaSchermo), larghezzaVetro / (2 * tangente * aspetto * C.larghezzaSchermo))
}

type Scatola = { min: Vector3; max: Vector3 }
const scatola = (b: { min: number[]; max: number[] }): Scatola => ({ min: new Vector3().fromArray(b.min), max: new Vector3().fromArray(b.max) })
const MONITOR = scatola(misure.monitor)
export const MOUSE = scatola(misure.mouse)
const POSTAZIONE = scatola(misure.postazione)
const angoliDi = (b: Scatola) =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
    new Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(matriceComputer),
  )
const angoliMonitor = angoliDi(MONITOR)
const angoliMouse = angoliDi(MOUSE)

/**
 * Inquadratura larga (computer spento): scrivania e accessori con spazio sopra il monitor per il volto,
 * vista un po’ dall’alto. La distanza è la minima che fa stare tutti gli angoli nella frazione di vista voluta.
 */
const L = C.larga
const angoliLarga = angoliDi({
  min: POSTAZIONE.min,
  max: new Vector3(POSTAZIONE.max.x, POSTAZIONE.max.y + L.testa, POSTAZIONE.max.z),
})
const miraLarga = angoliLarga.reduce((s, v) => s.add(v), new Vector3()).multiplyScalar(1 / 8)
const versoLarga = new Vector3(0, 0, 1)
  .applyAxisAngle(new Vector3(1, 0, 0), -MathUtils.degToRad(L.elevazione))
  .applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(L.lato))
const destraLarga = new Vector3(0, 1, 0).cross(versoLarga).normalize()
const suLarga = versoLarga.clone().cross(destraLarga)
const distanzaLargaCache = new Map<string, number>()
function distanzaLarga(aspetto: number, mobile: boolean) {
  const chiave = `${aspetto.toFixed(3)}${mobile}`
  let d = distanzaLargaCache.get(chiave)
  if (d !== undefined) return d
  const r = mobile ? L.riempieTelefono : L.riempie
  const v = new Vector3()
  d = 0
  for (const a of angoliLarga) {
    v.subVectors(a, miraLarga)
    const profondo = v.dot(versoLarga)
    d = Math.max(
      d,
      profondo + Math.abs(v.dot(destraLarga)) / (tangente * aspetto * r.larghezza),
      profondo + Math.abs(v.dot(suLarga)) / (tangente * r.altezza),
    )
  }
  distanzaLargaCache.set(chiave, d)
  return d
}

const liscio = (t: number) => {
  const v = MathUtils.clamp(t, 0, 1)
  return v * v * (3 - 2 * v)
}
function cubica(a: Vector3, b: Vector3, c: Vector3, d: Vector3, t: number, out: Vector3) {
  const u = 1 - t
  return out
    .copy(a)
    .multiplyScalar(u * u * u)
    .addScaledVector(b, 3 * u * u * t)
    .addScaledVector(c, 3 * u * t * t)
    .addScaledVector(d, t * t * t)
}

const tmp = { a: new Vector3(), b: new Vector3(), c: new Vector3(), d: new Vector3(), e: new Vector3(), f: new Vector3(), g: new Vector3() }
const H = { occhio: occhioDi('header'), mira: punto('header') }
const B = { occhio: occhioDi('biografia'), mira: punto('biografia') }
const K = { occhio: occhioDi('contatti'), mira: punto('contatti') }
// sopra la scrivania: la postazione nel fascio di luce, poi discesa verso il Macintosh.
const ALTO = { occhio: COMPUTER.posizione.clone().add(new Vector3(0, 12, 13)), mira: miraLarga.clone() }

/**
 * Camera «virtuale» dentro la sala per ogni punto del racconto.
 * stazione: 0 header → 1 sosta davanti al computer → 2 biografia → 3 contatti.
 * zoom: nella sosta, 0 = inquadratura larga (spento), 1 = davanti allo schermo (acceso).
 */
function occhioEMira(stazione: number, aspetto: number, mobile: boolean, zoom: number, occhio: Vector3, mira: Vector3) {
  const z = MathUtils.clamp(zoom, 0, 1)
  const vicino = tmp.e.copy(centroSchermo).addScaledVector(normaleSchermo, distanzaSosta(aspetto, mobile))
  const lontano = tmp.f.copy(miraLarga).addScaledVector(versoLarga, distanzaLarga(aspetto, mobile))
  const sosta = { occhio: vicino.lerp(lontano, 1 - z), mira: tmp.g.copy(miraLarga).lerp(centroSchermo, z) }
  const s = MathUtils.clamp(stazione, 0, 3)
  if (s <= 0.5) {
    // dall’header indietreggia e si alza: il computer appare a terra nel fascio
    const t = liscio(s / 0.5)
    cubica(H.occhio, tmp.a.copy(H.occhio).add(new Vector3(0, 1, 6)), tmp.b.copy(ALTO.occhio).add(new Vector3(0, 2, -4)), ALTO.occhio, t, occhio)
    mira.lerpVectors(H.mira, ALTO.mira, liscio(t * 1.25))
    return
  }
  if (s <= 1) {
    // scende fino allo schermo
    const t = liscio((s - 0.5) / 0.5)
    cubica(ALTO.occhio, tmp.a.copy(ALTO.occhio).add(new Vector3(0, -4, -1)), tmp.b.copy(sosta.occhio).add(new Vector3(0, 3, 4)), sosta.occhio, t, occhio)
    mira.lerpVectors(ALTO.mira, sosta.mira, t)
    return
  }
  if (s <= 2) {
    // si rialza e si gira verso la parete della biografia
    const t = liscio(s - 1)
    cubica(sosta.occhio, tmp.a.copy(sosta.occhio).add(new Vector3(0, 4, 7)), tmp.b.copy(B.occhio).add(new Vector3(4, 0, -6)), B.occhio, t, occhio)
    mira.lerpVectors(sosta.mira, B.mira, t)
    return
  }
  const t = liscio(s - 2)
  occhio.lerpVectors(B.occhio, K.occhio, t)
  mira.lerpVectors(B.mira, K.mira, t)
}

const vista = new Matrix4()
const occhio = new Vector3()
const mira = new Vector3()
const alto = new Vector3(0, 1, 0)
const cameraReale = new Matrix4().makeTranslation(CAMERA.x, CAMERA.y, CAMERA.z)

/**
 * trasformazione del mondo che fa vedere alla camera reale ciò che vedrebbe la camera virtuale;
 * `zoom` di norma è quello corrente (percorso.computer.zoom)
 */
export function matriceMondo(stazione: number, aspetto: number, mobile: boolean, out: Matrix4, zoom = percorso.computer.zoom) {
  occhioEMira(stazione, aspetto, mobile, zoom, occhio, mira)
  vista.lookAt(occhio, mira, alto).setPosition(occhio)
  return out.copy(cameraReale).multiply(vista.invert())
}

const mondo = new Matrix4()
const proiezione = new Matrix4()
const p = new Vector3()

/** i quattro angoli del vetro in pixel della vista: [x0,y0, x1,y1, x2,y2, x3,y3]; false se dietro la camera */
export function proiettaSchermo(stazione: number, larghezza: number, altezza: number, out: number[], zoom = percorso.computer.zoom) {
  const aspetto = larghezza / altezza
  matriceMondo(stazione, aspetto, telefono(larghezza), mondo, zoom)
  proiezione.makePerspective(-tangente * aspetto, tangente * aspetto, tangente, -tangente, 1, 60)
  for (let i = 0; i < 4; i++) {
    // coordinate della camera reale (che guarda verso −z dall’alto z = 20)
    p.copy(angoliSchermo[i]).applyMatrix4(mondo).sub(CAMERA)
    if (p.z > -0.1) return false
    p.applyMatrix4(proiezione)
    out[i * 2] = (p.x * 0.5 + 0.5) * larghezza
    out[i * 2 + 1] = (0.5 - p.y * 0.5) * altezza
  }
  return true
}

/** rettangolo del monitor in pixel della vista; `profondita` = z del suo punto più lontano nella scena della camera reale */
export type Ingombro = { sinistra: number; destra: number; alto: number; basso: number; profondita: number }

/** proietta il monitor come proiettaSchermo proietta il vetro; false se una parte è dietro la camera */
export function proiettaMonitor(stazione: number, larghezza: number, altezza: number, out: Ingombro) {
  return proiettaAngoli(angoliMonitor, stazione, larghezza, altezza, out)
}
/** rettangolo del mouse 3d in pixel della vista: zona da toccare per accendere il computer */
export function proiettaMouse(stazione: number, larghezza: number, altezza: number, out: Ingombro) {
  return proiettaAngoli(angoliMouse, stazione, larghezza, altezza, out)
}

function proiettaAngoli(angoli: Vector3[], stazione: number, larghezza: number, altezza: number, out: Ingombro) {
  const aspetto = larghezza / altezza
  matriceMondo(stazione, aspetto, telefono(larghezza), mondo)
  proiezione.makePerspective(-tangente * aspetto, tangente * aspetto, tangente, -tangente, 1, 60)
  out.sinistra = out.alto = out.profondita = Infinity
  out.destra = out.basso = -Infinity
  for (const angolo of angoli) {
    p.copy(angolo).applyMatrix4(mondo)
    out.profondita = Math.min(out.profondita, p.z)
    p.sub(CAMERA)
    if (p.z > -0.1) return false
    p.applyMatrix4(proiezione)
    const x = (p.x * 0.5 + 0.5) * larghezza,
      y = (0.5 - p.y * 0.5) * altezza
    out.sinistra = Math.min(out.sinistra, x)
    out.destra = Math.max(out.destra, x)
    out.alto = Math.min(out.alto, y)
    out.basso = Math.max(out.basso, y)
  }
  return true
}

// il volto (percorso.ts, nel bundle iniziale) si posa dietro il monitor con queste misure
misureScena.proiettaMonitor = proiettaMonitor
misureScena.cameraZ = CAMERA.z

/** misura in pixel del vetro durante la sosta: diventa la risoluzione dell’interfaccia */
export function misuraSosta(larghezza: number, altezza: number) {
  const q: number[] = []
  // sempre a computer acceso, davanti allo schermo
  if (!proiettaSchermo(1, larghezza, altezza, q, 1)) return { larghezza: 640, altezza: 540 }
  return {
    larghezza: Math.round(Math.hypot(q[2] - q[0], q[3] - q[1])),
    altezza: Math.round(Math.hypot(q[6] - q[0], q[7] - q[1])),
  }
}

/**
 * matrix3d CSS che porta un rettangolo w×h (origine in alto a sinistra) sui quattro punti q.
 * Omografia quadrato → quadrilatero (Heckbert), scalata sulla misura dell’elemento.
 */
export function omografia(w: number, h: number, q: number[]) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9
  const g = (dx3 * dy2 - dx2 * dy3) / den
  const hh = (dx1 * dy3 - dx3 * dy1) / den
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1]
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(',')})`
}
