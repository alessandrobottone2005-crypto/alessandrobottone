// Motore audio del sito: un solo AudioContext, tre bus (musica, effetti, computer) e un volume generale.
// Parte solo dopo un gesto dell’utente (il pulsante «inizia a scrollare»); muto/attivo è ricordato.
// Interfaccia condivisa da ingresso, glitch e computer: i suoni si chiamano per nome con `suona()`.
// File in public/audio/ (npm run prepara-audio), parametri in movimento.audio; dettagli in docs/audio.md.
import { audio as A } from '@/config/movimento'

export type Bus = 'musica' | 'effetti' | 'computer'
export type NomeSuono =
  // glitch (logo, ologramma, camera)
  | 'glitch'
  // computer
  | 'accensione'
  | 'accordo'
  | 'ventola'
  | 'disco'
  | 'clic'
  | 'floppy'
  | 'spegnimento'
export type OpzioniSuono = { volume?: number; velocita?: number; bus?: Bus; ciclo?: boolean }
/** suono in ciclo (ventola): si ferma con `ferma()` */
export type SuonoAttivo = { ferma: (dissolvenza?: number) => void }

type Stato = { avviato: boolean; muto: boolean }
const CHIAVE_MUTO = 'audio:muto'

function leggiMuto() {
  try {
    return localStorage.getItem(CHIAVE_MUTO) === '1'
  } catch {
    return false
  }
}

const stato: Stato = { avviato: false, muto: leggiMuto() }
const ascoltatori = new Set<() => void>()
const avvisa = () => ascoltatori.forEach((a) => a())

// ---------- file ----------

/** i file di ogni suono (senza estensione); `glitch` ne sceglie uno a caso */
const FILE: Record<NomeSuono | 'musica', string[]> = {
  musica: ['musica'],
  glitch: ['glitch-1', 'glitch-2', 'glitch-3', 'glitch-4'],
  accensione: ['accensione'],
  accordo: ['accordo'],
  ventola: ['ventola'],
  disco: ['disco'],
  clic: ['clic'],
  floppy: ['floppy'],
  spegnimento: ['spegnimento'],
}
const BUS_DI: Record<NomeSuono, Bus> = {
  glitch: 'effetti',
  accensione: 'computer',
  accordo: 'computer',
  ventola: 'computer',
  disco: 'computer',
  clic: 'computer',
  floppy: 'computer',
  spegnimento: 'computer',
}

/** opus (più leggero) dove il browser lo dichiara sicuro, altrimenti aac; se la decodifica fallisce si prova l’altro */
function estensioni() {
  const opus = typeof Audio === 'function' && new Audio().canPlayType('audio/webm; codecs="opus"') === 'probably'
  return opus ? ['webm', 'm4a'] : ['m4a', 'webm']
}

// byte scaricati (si può scaricare prima di avere il contesto) e buffer decodificati
const scaricati = new Map<string, Promise<{ dati: ArrayBuffer; ext: string } | null>>()
const decodificati = new Map<string, Promise<AudioBuffer | null>>()
const pronti = new Map<string, AudioBuffer>()

function scarica(file: string, ext = estensioni()[0]) {
  const chiave = `${file}.${ext}`
  let p = scaricati.get(chiave)
  if (!p) {
    p = fetch(`/audio/${chiave}`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((dati) => (dati ? { dati, ext } : null))
      .catch(() => null)
    scaricati.set(chiave, p)
  }
  return p
}

function decodifica(file: string) {
  let p = decodificati.get(file)
  if (!p) {
    p = (async () => {
      for (const ext of estensioni()) {
        const scarico = await scarica(file, ext)
        if (!scarico || !ctx) continue
        try {
          // decodeAudioData consuma i byte: si passa una copia, così il secondo tentativo resta possibile
          const buffer = await ctx.decodeAudioData(scarico.dati.slice(0))
          pronti.set(file, buffer)
          return buffer
        } catch {
          /* formato non decodificabile qui: si prova l’altro */
        }
      }
      return null
    })()
    decodificati.set(file, p)
  }
  return p
}

// ---------- grafo ----------

let ctx: AudioContext | null = null
let generale: GainNode | null = null
const bus = {} as Record<Bus, GainNode>
/** sotto il bus musica: si abbassa quando si usa il computer */
let abbassamento: GainNode | null = null
let musica: AudioBufferSourceNode | null = null
let abbassata = false
let sospensione = 0
let cicliAttivi = 0

const db = (d: number) => 10 ** (d / 20)

function creaContesto() {
  const Contesto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Contesto) return null
  const c = new Contesto({ latencyHint: 'playback' })
  generale = c.createGain()
  generale.gain.value = stato.muto ? 0 : 1
  generale.connect(c.destination)
  abbassamento = c.createGain()
  abbassamento.gain.value = abbassata ? db(A.abbassaDb) : 1
  abbassamento.connect(generale)
  bus.musica = c.createGain()
  bus.musica.gain.value = 0
  bus.musica.connect(abbassamento)
  bus.effetti = c.createGain()
  bus.effetti.gain.value = A.volume.effetti
  bus.effetti.connect(generale)
  bus.computer = c.createGain()
  bus.computer.gain.value = A.volume.computer
  bus.computer.connect(generale)
  return c
}

/** il contesto gira solo con l’audio attivo e la scheda in vista; altrimenti si spegne con una breve dissolvenza */
function aggiornaContesto() {
  if (!ctx || !generale) return
  const suona = !stato.muto && !document.hidden
  const ora = ctx.currentTime
  clearTimeout(sospensione)
  generale.gain.cancelScheduledValues(ora)
  generale.gain.setValueAtTime(generale.gain.value, ora)
  if (suona) {
    void ctx.resume()
    generale.gain.linearRampToValueAtTime(1, ora + A.dissolvenzaMuto)
  } else {
    generale.gain.linearRampToValueAtTime(0, ora + A.dissolvenzaMuto)
    // a volume zero il contesto si ferma: niente lavoro inutile e la musica riprende dallo stesso punto
    sospensione = window.setTimeout(() => void ctx?.suspend(), A.dissolvenzaMuto * 1000 + 50)
  }
}

async function avviaMusica() {
  const buffer = await decodifica(FILE.musica[0])
  if (!ctx || !buffer || musica) return
  musica = ctx.createBufferSource()
  musica.buffer = buffer
  // ciclo esatto: il file finisce sul battere da cui riparte (scripts/prepara-audio.mjs); il riempimento
  // finale dei codificatori resta fuori dal ciclo
  musica.loop = true
  musica.loopStart = 0
  musica.loopEnd = Math.min(buffer.duration, A.cicli.musica)
  musica.connect(bus.musica)
  musica.start()
  const ora = ctx.currentTime
  bus.musica.gain.cancelScheduledValues(ora)
  bus.musica.gain.setValueAtTime(0, ora)
  bus.musica.gain.linearRampToValueAtTime(A.volume.musica, ora + A.entrataMusica)
}

function sorgente(buffer: AudioBuffer, nome: NomeSuono, o: OpzioniSuono, inizio = 0) {
  const c = ctx!
  const s = c.createBufferSource()
  s.buffer = buffer
  s.playbackRate.value = o.velocita ?? 1
  const g = c.createGain()
  g.gain.value = o.volume ?? 1
  s.connect(g).connect(bus[o.bus ?? BUS_DI[nome]])
  if (o.ciclo) {
    s.loop = true
    const ciclo = A.cicli[nome as keyof typeof A.cicli]
    if (ciclo) s.loopEnd = Math.min(buffer.duration, ciclo)
  }
  s.start(c.currentTime + inizio)
  return { s, g }
}

// ---------- interfaccia pubblica ----------

export const audio = {
  get avviato() {
    return stato.avviato
  },
  get muto() {
    return stato.muto
  },
  /** a preloader finito: scarica la musica (non la decodifica: senza contesto non si può) */
  precarica() {
    void scarica(FILE.musica[0])
  },
  /** da chiamare dentro un gesto dell’utente (clic, tocco, tasto): crea il contesto e avvia la musica */
  async avvia() {
    // già avviato: un nuovo gesto serve solo a far ripartire un contesto rimasto sospeso dal browser
    if (stato.avviato) return aggiornaContesto()
    stato.avviato = true
    // il contesto nasce e riparte in modo sincrono dentro il gesto (safari e chrome lo richiedono)
    ctx = creaContesto()
    if (!ctx) return avvisa()
    void ctx.resume()
    document.addEventListener('visibilitychange', aggiornaContesto)
    aggiornaContesto()
    avvisa()
    // i suoni brevi pesano pochi kB: si preparano subito, la musica parte appena decodificata
    Object.entries(FILE).forEach(([nome, file]) => nome !== 'musica' && file.forEach((f) => void decodifica(f)))
    await avviaMusica()
  },
  impostaMuto(muto: boolean) {
    stato.muto = muto
    try {
      localStorage.setItem(CHIAVE_MUTO, muto ? '1' : '0')
    } catch {
      /* archivio non disponibile: la scelta vale per questa visita */
    }
    aggiornaContesto()
    avvisa()
  },
  /** abbassa la musica (uso del computer) o la riporta al volume di sottofondo */
  abbassaMusica(si: boolean) {
    abbassata = si
    if (!ctx || !abbassamento) return
    const ora = ctx.currentTime
    abbassamento.gain.cancelScheduledValues(ora)
    abbassamento.gain.setValueAtTime(abbassamento.gain.value, ora)
    abbassamento.gain.setTargetAtTime(si ? db(A.abbassaDb) : 1, ora, A.rampaAbbassa / 3)
  },
  /**
   * riproduce un suono per nome. I suoni brevi partono solo se già pronti (in ritardo non hanno senso) e non
   * a volume zero; quelli in ciclo partono appena caricati e restano fermabili subito.
   */
  suona(nome: NomeSuono, opzioni: OpzioniSuono = {}): SuonoAttivo | null {
    if (!ctx) return null
    const elenco = FILE[nome]
    const file = elenco[Math.floor(Math.random() * elenco.length)]
    const o = nome === 'glitch' && opzioni.velocita === undefined ? { ...opzioni, velocita: 0.85 + Math.random() * 0.3 } : opzioni

    if (o.ciclo) {
      let fermato = false
      let attivo: ReturnType<typeof sorgente> | null = null
      void decodifica(file).then((b) => {
        if (!b || fermato || !ctx) return
        attivo = sorgente(b, nome, o)
        cicliAttivi++
        // entrata morbida: un ciclo non deve partire con un colpo
        const ora = ctx.currentTime
        attivo.g.gain.setValueAtTime(0, ora)
        attivo.g.gain.linearRampToValueAtTime(o.volume ?? 1, ora + A.entrataCiclo)
      })
      return {
        ferma(dissolvenza = A.uscitaCiclo) {
          fermato = true
          if (!attivo || !ctx) return
          const ora = ctx.currentTime
          attivo.g.gain.cancelScheduledValues(ora)
          attivo.g.gain.setValueAtTime(attivo.g.gain.value, ora)
          attivo.g.gain.linearRampToValueAtTime(0, ora + dissolvenza)
          attivo.s.stop(ora + dissolvenza + 0.05)
          attivo = null
          cicliAttivi--
        },
      }
    }

    if (stato.muto || document.hidden) return null
    const buffer = pronti.get(file)
    if (!buffer) {
      void decodifica(file)
      return null
    }
    const { s, g } = sorgente(buffer, nome, o)
    // l’accensione porta con sé l’accordo d’avvio, quando lo schermo si illumina
    if (nome === 'accensione') {
      const accordo = pronti.get(FILE.accordo[0])
      if (accordo) sorgente(accordo, 'accordo', { volume: A.volume.accordo }, A.ritardoAccordo)
    }
    return {
      ferma(dissolvenza = 0.05) {
        if (!ctx) return
        const ora = ctx.currentTime
        g.gain.cancelScheduledValues(ora)
        g.gain.setValueAtTime(g.gain.value, ora)
        g.gain.linearRampToValueAtTime(0, ora + dissolvenza)
        s.stop(ora + dissolvenza + 0.02)
      },
    }
  },
  ascolta(a: () => void) {
    ascoltatori.add(a)
    return () => {
      ascoltatori.delete(a)
    }
  },
  /** solo per le verifiche (docs/audio.md): stato del contesto, musica e cicli in corso */
  get diagnosi() {
    return {
      contesto: ctx?.state ?? null,
      musica: musica?.buffer?.duration ?? null,
      abbassata,
      cicli: cicliAttivi,
    }
  },
}
