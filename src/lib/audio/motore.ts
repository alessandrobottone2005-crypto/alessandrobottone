// Motore audio del sito: un solo AudioContext, tre bus (musica, effetti, computer) e un volume generale.
// Parte solo dopo un gesto dell’utente (il pulsante «inizia a scrollare»); muto/attivo è ricordato.
// Interfaccia condivisa da ingresso, glitch e computer: i suoni si chiamano per nome con `suona()`.
// Riempito dall’agente audio (docs/audio.md).

export type Bus = 'musica' | 'effetti' | 'computer'
export type NomeSuono =
  // glitch (logo, ologramma, camera)
  | 'glitch'
  // computer
  | 'accensione'
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

export const audio = {
  get avviato() {
    return stato.avviato
  },
  get muto() {
    return stato.muto
  },
  /** da chiamare dentro un gesto dell’utente (clic, tocco, tasto): crea il contesto e avvia la musica */
  async avvia() {
    stato.avviato = true
    avvisa()
  },
  impostaMuto(muto: boolean) {
    stato.muto = muto
    try {
      localStorage.setItem(CHIAVE_MUTO, muto ? '1' : '0')
    } catch {
      /* archivio non disponibile: la scelta vale per questa visita */
    }
    avvisa()
  },
  /** abbassa la musica (uso del computer) o la riporta al volume di sottofondo */
  abbassaMusica(_si: boolean) {},
  suona(_nome: NomeSuono, _opzioni?: OpzioniSuono): SuonoAttivo | null {
    return null
  },
  ascolta(a: () => void) {
    ascoltatori.add(a)
    return () => {
      ascoltatori.delete(a)
    }
  },
}
