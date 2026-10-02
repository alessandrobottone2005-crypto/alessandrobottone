// Glitch casuali del sito: il pianificatore sceglie ogni tanto un bersaglio (logo, ologramma o camera)
// e lo annuncia; chi disegna il bersaglio ascolta e anima il disturbo, il motore audio lo fa sentire.
// Rari e brevi (12–25 s, 0,2–0,5 s, mai più di 3 lampi al secondo), spenti con movimento ridotto,
// con la scheda nascosta e mentre si usa il computer acceso (docs/animazioni.md#glitch).
import { leggiFase } from '@/components/computer/stato'
import { percorso } from '@/components/volto/percorso'
import { movimento, media } from '@/config/movimento'
import { audio } from '@/lib/audio/motore'

export type BersaglioGlitch = 'logo' | 'ologramma' | 'camera'
export type Glitch = {
  bersaglio: BersaglioGlitch
  /** secondi */
  durata: number
  /** 0–1 */
  intensita: number
  /** performance.now() di inizio */
  inizio: number
}

const ascoltatori = new Set<(g: Glitch) => void>()

/** glitch in corso per bersaglio: chi disegna lo legge a ogni fotogramma senza passare da React */
export const glitchAttivi: Partial<Record<BersaglioGlitch, Glitch>> = {}

/** dove sta il logo sullo schermo (pixel), scritto da Volto3D durante un suo glitch: la post-produzione lo sdoppia lì */
export const zonaLogo = { x: 0, y: 0, larghezza: 0 }

let ultimoInizio = -Infinity
const ridotto = () => matchMedia(media.ridotto).matches
// un oggetto per bersaglio, riusato: niente allocazioni per fotogramma (chi lo legge non lo conserva)
const avanzamenti: Record<BersaglioGlitch, { t: number; intensita: number }> = {
  logo: { t: 0, intensita: 0 },
  ologramma: { t: 0, intensita: 0 },
  camera: { t: 0, intensita: 0 },
}

export const glitch = {
  emetti(g: Omit<Glitch, 'inizio'>) {
    // movimento ridotto: nessun glitch, nemmeno chiesto a mano
    if (ridotto()) return
    // mai due disturbi più vicini di 1/lampiMax di secondo, su qualunque bersaglio: niente raffiche di lampi
    const ora = performance.now()
    if (ora - ultimoInizio < 1000 / movimento.glitch.lampiMax) return
    ultimoInizio = ora
    const completo = { ...g, inizio: ora }
    glitchAttivi[g.bersaglio] = completo
    ascoltatori.forEach((a) => a(completo))
  },
  ascolta(a: (g: Glitch) => void) {
    ascoltatori.add(a)
    return () => {
      ascoltatori.delete(a)
    }
  },
  /** avanzamento 0–1 del glitch in corso sul bersaglio, null se fermo (oggetto riusato: leggerlo subito) */
  avanzamento(bersaglio: BersaglioGlitch, ora = performance.now()) {
    const g = glitchAttivi[bersaglio]
    if (!g) return null
    const t = (ora - g.inizio) / 1000 / g.durata
    if (t >= 1) {
      delete glitchAttivi[bersaglio]
      return null
    }
    const a = avanzamenti[bersaglio]
    a.t = Math.max(0, t)
    a.intensita = g.intensita
    return a
  },
  /** forza 0–1 del disturbo in questo istante: intensità × inviluppo (entrata secca, uscita breve); 0 se fermo */
  forza(bersaglio: BersaglioGlitch, ora = performance.now()) {
    const a = glitch.avanzamento(bersaglio, ora)
    if (!a) return 0
    return a.intensita * Math.min(1, a.t / 0.08) * Math.min(1, (1 - a.t) / 0.2)
  },
  /**
   * numero intero che cambia `alSecondo` volte al secondo durante il glitch: il seme degli scatti.
   * Per ciò che cambia la luminosità si usa `semeLuce`, limitato a 3 lampi al secondo.
   */
  seme(bersaglio: BersaglioGlitch, alSecondo: number = movimento.glitch.scatti, ora = performance.now()) {
    const g = glitchAttivi[bersaglio]
    if (!g) return 0
    // parte da un valore diverso a ogni glitch, così i disegni non si ripetono
    return Math.floor(((ora - g.inizio) / 1000) * alSecondo) + (Math.floor(g.inizio) % 997)
  },
  /** seme di ciò che cambia la luminosità: al massimo 2 cambi per lampo, `lampiMax` lampi al secondo */
  semeLuce(bersaglio: BersaglioGlitch, ora = performance.now()) {
    return glitch.seme(bersaglio, movimento.glitch.lampiMax * 2, ora)
  },
  /** c’è almeno un glitch in corso (per tenere vivo il Canvas su `demand`) */
  get attivo() {
    return Object.keys(glitchAttivi).length > 0
  },
}

/** casuale deterministico 0–1 da un intero (stessi scatti per tutto lo stesso istante) */
export const casoGlitch = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const tra = ([a, b]: readonly [number, number]) => a + Math.random() * (b - a)

/** chi è in vista adesso e può disturbarsi; vuoto se ora non si deve disturbare */
function bersagliInVista() {
  const scelti: [BersaglioGlitch, number][] = []
  const host = document.querySelector<HTMLElement>('[data-logo-continuo]')
  if (!host) return scelti
  const scena = Number(host.style.opacity || 0) > 0.5
  const fase = host.dataset.fase ?? ''
  // non disturbare chi usa il computer: acceso e camera davanti allo schermo (sosta, finestra di un progetto)
  const computerInUso = leggiFase() !== 'spento' && (fase === 'computer' || (fase === 'verso-computer' && percorso.computer.vicino > 0.9))
  if (computerInUso || !scena) return scelti
  const pesi = movimento.glitch.pesi
  const sezione = document.getElementById('chi-sono')?.getBoundingClientRect()
  const chiSonoInVista = !!sezione && sezione.top < innerHeight && sezione.bottom > 0
  if (percorso.biografia.ologramma > 0.5 && chiSonoInVista) scelti.push(['ologramma', pesi.ologramma])
  // il logo c’è finché non si schiaccia nel passaggio all’ologramma
  if (percorso.biografia.ologramma < 0.3) scelti.push(['logo', pesi.logo])
  scelti.push(['camera', pesi.camera])
  return scelti
}

function scegli(scelti: [BersaglioGlitch, number][]) {
  let r = Math.random() * scelti.reduce((s, [, p]) => s + p, 0)
  for (const [b, p] of scelti) if ((r -= p) <= 0) return b
  return scelti[scelti.length - 1][0]
}

/**
 * Avvia il pianificatore (la home lo monta con la scena 3d). Aspetta l’ingresso (audio avviato),
 * si ferma con scheda nascosta e movimento ridotto, riprende da capo quando tornano le condizioni.
 * Ogni glitch, anche chiesto a mano, si sente: suono lungo quanto il disturbo.
 */
export function avviaGlitch() {
  const G = movimento.glitch
  const mq = matchMedia(media.ridotto)
  let timer = 0

  const ferma = () => {
    clearTimeout(timer)
    timer = 0
  }
  const puo = () => audio.avviato && !document.hidden && !mq.matches
  const programma = (secondi: number) => {
    ferma()
    if (puo()) timer = window.setTimeout(scatta, secondi * 1000)
  }
  const scatta = () => {
    timer = 0
    if (!puo()) return
    const scelti = bersagliInVista()
    if (!scelti.length) return programma(tra(G.riprova))
    const bersaglio = scegli(scelti)
    glitch.emetti({
      bersaglio,
      durata: tra(G.durata),
      // a tutto schermo un po’ più contenuto
      intensita: tra(G.intensita) * (bersaglio === 'camera' ? G.camera : 1),
    })
    programma(tra(G.intervallo))
  }
  // suono: stessa durata del disturbo visivo (in ciclo e fermato alla fine, qualunque sia la lunghezza del campione)
  const smettiDiAscoltare = glitch.ascolta((g) => {
    const suono = audio.suona('glitch', {
      volume: tra(G.volume) * (0.6 + 0.4 * g.intensita),
      velocita: tra(G.velocita),
      bus: 'effetti',
      ciclo: true,
    })
    if (suono) window.setTimeout(() => suono.ferma(0.04), g.durata * 1000)
  })
  const cambia = () => {
    if (mq.matches || document.hidden) {
      ferma()
      // un glitch in corso si spegne subito
      for (const b of Object.keys(glitchAttivi) as BersaglioGlitch[]) delete glitchAttivi[b]
    } else if (!timer) programma(tra(G.intervallo))
  }
  const smettiAudio = audio.ascolta(() => {
    if (audio.avviato && !timer) programma(tra(G.intervallo))
  })
  mq.addEventListener('change', cambia)
  document.addEventListener('visibilitychange', cambia)
  programma(tra(G.intervallo))
  if (import.meta.env.DEV) (window as unknown as { __glitch: typeof glitch }).__glitch = glitch
  return () => {
    ferma()
    smettiDiAscoltare()
    smettiAudio()
    mq.removeEventListener('change', cambia)
    document.removeEventListener('visibilitychange', cambia)
  }
}
