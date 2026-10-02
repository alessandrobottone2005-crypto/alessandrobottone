// Le timeline scrivono questi numeri; il Canvas unico li legge senza render React per fotogramma.
import { ScrollTrigger } from '@/lib/gsap'
import { movimento } from '@/config/movimento'
import type { Ingombro } from '@/components/computer/inquadratura'
import { INGOMBRO, LENTE, PUPILLA, SPESSORE } from './geometria'
import type { Punto } from './sguardo'

export type Lato = 'sopra' | 'destra' | 'sinistra'

export const percorso = {
  header: { opacity: 0, rotazione: 0, scala: 1, inclinazione: 0 },
  // vicino: 0 = fine dell’header, 1 = camera ferma davanti allo schermo.
  // sbircia: nascondino nella sosta (uscita 0 = nascosto dietro il monitor, 1 = sbucato dal lato)
  // zoom: 0 = inquadratura larga (monitor, tastiera e mouse, computer spento), 1 = vicina allo schermo acceso;
  // lo anima GSAP all’accensione, non lo scroll
  computer: { vicino: 0, zoom: 0, sbircia: { lato: 'destra' as Lato, uscita: 0 } },
  // ologramma: 0 = logo, 1 = avatar olografico al posto del logo nel chi sono
  biografia: { uscita: 0, ologramma: 0 },
  guarda: null as Punto | null,
  // 0 header → 1 computer → 2 biografia → 3 contatti; scritto da leggiPosa.
  stazione: 0,
}

export const limita = (n: number) => Math.min(1, Math.max(0, n))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const morbido = (t: number) => t * t * (3 - 2 * t)
/** misura del volto quando l’header lo consegna al portfolio */
export const larghezzaLogoCentro = () => Math.min(innerWidth * 0.42, innerHeight * 0.36, 380)
const larghezzaLogoContatti = () => Math.min(innerWidth * 0.82, innerHeight * 0.76)

export type Posa = {
  x: number
  y: number
  larghezza: number
  /** gradi attorno all’asse verticale */
  rotazione: number
  opacity: number
  fase: string
  /** z nella scena della camera reale (0 = piano del volto); la misura in pixel resta `larghezza` */
  z?: number
  /** inclinazione della testa sul piano della vista, in gradi */
  rollio?: number
}

// Parti del volto in frazioni della sua larghezza, misurate dal centro (y verso il basso).
const W = INGOMBRO.larghezza
const CX = W / 2,
  CY = INGOMBRO.altezza / 2
const bordo = SPESSORE.occhio / 2
const VOLTO = {
  /** cima del naso: il punto più alto del volto */
  alto: -CY / W,
  lenteAlto: (LENTE.cy - LENTE.ry - bordo - CY) / W,
  lenteCentro: (LENTE.cy - CY) / W,
  lenteBasso: (LENTE.cy + LENTE.ry + bordo - CY) / W,
  /** distanza dall’asse al bordo interno di una lente */
  lenteInterno: (CX - (LENTE.cx + LENTE.rx + bordo)) / W,
  occhioAlto: (PUPILLA.cy - PUPILLA.ry - CY) / W,
  occhioBasso: (PUPILLA.cy + PUPILLA.ry - CY) / W,
  occhioInterno: (CX - (PUPILLA.cx + PUPILLA.rx)) / W,
}
const V = movimento.computer.volto
const S = movimento.computer.sbircia

type Punto3 = { x: number; y: number; larghezza: number; z: number; rollio: number }
const monitor: Ingombro = { sinistra: 0, destra: 0, alto: 0, basso: 0, profondita: 0 }
const telefono = (w: number) => w < 768

/**
 * Proiezione del monitor e distanza della camera: le registra inquadratura.ts quando arriva il codice 3d,
 * così three.js resta fuori dal bundle iniziale. Prima di allora il volto resta al centro.
 */
export const misureScena = {
  proiettaMonitor: null as null | ((stazione: number, larghezza: number, altezza: number, out: Ingombro) => boolean),
  cameraZ: 0,
}
const proiettaMonitor = (s: number, w: number, h: number, out: Ingombro) => misureScena.proiettaMonitor?.(s, w, h, out) ?? false

/** dove sta il volto sbucando da `lato`; null se da lì non si vedono gli occhi */
function sbucato(lato: Lato, m: Ingombro, w: number, h: number, dietro: number): Punto3 | null {
  const L = V.fattore * (m.destra - m.sinistra)
  const g = V.margine * L
  const cx = (m.sinistra + m.destra) / 2
  // sopra: le lenti appena sopra il monitor; se manca spazio, almeno gli occhi interi nella vista
  const ySopra = Math.max(m.alto - g - VOLTO.lenteBasso * L, g - VOLTO.occhioAlto * L)
  const sopraOk = ySopra + VOLTO.occhioBasso * L <= m.alto
  if (lato !== 'sopra') {
    const verso = lato === 'destra' ? 1 : -1
    const bordo = lato === 'destra' ? m.destra : w - m.sinistra
    // la lente esce tutta oltre il bordo del monitor senza uscire dalla vista; se non c’è spazio
    // per entrambe le cose, resta intera nella vista e il suo bordo interno torna dietro il monitor
    const da = Math.min(bordo + g + VOLTO.lenteInterno * L, w - g - L / 2)
    const y = m.alto + S.altezza * (Math.min(m.basso, h) - m.alto) - VOLTO.lenteCentro * L
    if (da + VOLTO.occhioInterno * L >= bordo)
      return { x: lato === 'destra' ? da : w - da, y, larghezza: L, z: dietro, rollio: -verso * S.rollio }
    // schermi stretti: sopra, spostato verso quel lato
    if (!sopraOk) return null
    return { x: cx + verso * S.spostamento * L, y: ySopra, larghezza: L, z: dietro, rollio: -verso * S.rollio * 0.6 }
  }
  return sopraOk ? { x: cx, y: ySopra, larghezza: L, z: dietro, rollio: 0 } : null
}

/** lati da cui il volto può sbucare nella sosta, per la vista attuale (nessuno su telefono) */
export function latiDisponibili(): Lato[] {
  const w = document.documentElement.clientWidth,
    h = innerHeight
  if (telefono(w) || !proiettaMonitor(1, w, h, monitor)) return []
  const dietro = monitor.profondita - V.distacco
  return (['sopra', 'destra', 'sinistra'] as const).filter((l) => sbucato(l, monitor, w, h, dietro))
}

/**
 * Il volto dietro il monitor per la stazione `s` (0–1): durante la discesa sporge sopra il monitor,
 * arrivato davanti allo schermo acceso si nasconde e gioca a nascondino. Nell’inquadratura larga
 * (computer spento) resta sporgente come nella discesa. null se il monitor non è in vista.
 */
function dietroIlMonitor(s: number, vicino: number, w: number, h: number): Punto3 | null {
  if (!proiettaMonitor(s, w, h, monitor)) return null
  const m = monitor
  const largo = m.destra - m.sinistra
  const dietro = m.profondita - V.distacco
  // discesa: grande, con lenti e occhi sopra il bordo del monitor
  const L = V.fattore * largo
  const g = V.margine * L
  const discesa = {
    x: (m.sinistra + m.destra) / 2,
    y: Math.max(m.alto - g - VOLTO.lenteBasso * L, g - VOLTO.occhioAlto * L),
    larghezza: L,
    z: dietro,
    rollio: 0,
  }
  // nascosto: arretra finché, visto da qui, sta tutto dietro il monitor (stessa misura reale, più lontano)
  const Ln = V.fattoreNascosto * largo
  const nascosto = {
    x: discesa.x,
    y: Math.max((m.alto + Math.min(m.basso, h)) / 2, m.alto + g - VOLTO.alto * Ln),
    larghezza: Ln,
    z: misureScena.cameraZ - (misureScena.cameraZ - dietro) * (V.fattore / V.fattoreNascosto),
    rollio: 0,
  }
  // si nasconde solo avvicinandosi allo schermo acceso: da lontano (zoom 0) sporge sopra il monitor
  const zoom = morbido(limita(percorso.computer.zoom))
  const posa = misto(discesa, nascosto, morbido(limita((vicino - V.nascondiDa) / (1 - V.nascondiDa))) * zoom)
  // nascondino: solo fermi davanti allo schermo (su telefono l’interfaccia copre tutto)
  const sb = percorso.computer.sbircia
  const fuori = sb.uscita * limita((vicino - 0.97) / 0.03)
  const verso = fuori > 0 && !telefono(w) ? sbucato(sb.lato, m, w, h, dietro) : null
  return verso ? misto(posa, verso, fuori) : posa
}

function misto(a: Punto3, b: Punto3, t: number): Punto3 {
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    larghezza: mix(a.larghezza, b.larghezza, t),
    z: mix(a.z, b.z, t),
    rollio: mix(a.rollio, b.rollio, t),
  }
}

export function leggiPosa(): Posa {
  const w = document.documentElement.clientWidth,
    h = innerHeight
  const header = document.querySelector<HTMLElement>('[data-logo-header]')?.getBoundingClientRect()
  const c = percorso.header
  const posa: Posa = { x: w / 2, y: h / 2, larghezza: larghezzaLogoCentro(), rotazione: -12, opacity: 1, fase: 'verso-computer', z: 0, rollio: 0 }
  const portfolio = ScrollTrigger.getById('portfolio-computer')
  const inPortfolio = portfolio && scrollY >= portfolio.start - 1
  if (!inPortfolio) {
    percorso.stazione = 0
    if (!header) return { ...posa, opacity: 0 }
    return {
      x: header.left + header.width / 2,
      y: header.top + header.height / 2,
      larghezza: header.width * c.scala,
      rotazione: c.rotazione,
      opacity: c.opacity,
      fase: 'header',
    }
  }

  const vicino = limita(percorso.computer.vicino)
  percorso.stazione = vicino
  // il volto lascia il centro e scivola dietro il computer mentre la camera scende verso lo schermo
  const dietro = dietroIlMonitor(vicino, vicino, w, h)
  const p = dietro ? morbido(limita((vicino - V.versoDa) / (V.versoA - V.versoDa))) : 0
  if (dietro) Object.assign(posa, misto({ ...posa, z: 0, rollio: 0 }, dietro, p))
  posa.rotazione = -12 * (1 - p)
  if (vicino >= 0.999) posa.fase = 'computer'

  const sezione = document.getElementById('chi-sono')?.getBoundingClientRect()
  const bio = document.querySelector<HTMLElement>('[data-logo-biografia]')?.getBoundingClientRect()
  if (sezione && bio && sezione.top < h && vicino >= 0.999) {
    const ingresso = morbido(limita((h - sezione.top) / h))
    // parte da dove si trova davanti allo schermo, anche se sta sbucando
    const da = dietroIlMonitor(1, 1, w, h) ?? { ...posa, z: 0, rollio: 0 }
    posa.x = mix(da.x, bio.left + bio.width / 2, ingresso)
    posa.y = mix(da.y, h / 2, ingresso)
    posa.larghezza = mix(da.larghezza, bio.width, ingresso)
    posa.z = mix(da.z, 0, ingresso)
    posa.rollio = mix(da.rollio, 0, ingresso)
    posa.rotazione = mix(0, -8, ingresso)
    posa.fase = 'biografia'
    const uscita = morbido(percorso.biografia.uscita)
    percorso.stazione = 1 + ingresso + uscita
    posa.x = mix(posa.x, w / 2, uscita)
    posa.y = mix(posa.y, h / 2, uscita)
    posa.larghezza = mix(posa.larghezza, larghezzaLogoContatti(), uscita)
    posa.rotazione *= 1 - uscita
    if (uscita > 0) posa.fase = 'verso-contatti'
    const contatti = document.querySelector<HTMLElement>('[data-logo-contatti]')?.getBoundingClientRect()
    if (uscita >= 0.999 && contatti) {
      posa.y = Math.min(h / 2, contatti.top + contatti.height / 2)
      posa.fase = 'contatti'
    }
  }
  return posa
}
