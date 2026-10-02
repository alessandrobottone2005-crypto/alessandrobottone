// Glitch casuali del sito: il pianificatore sceglie ogni tanto un bersaglio (logo, ologramma o camera)
// e lo annuncia; chi disegna il bersaglio ascolta e anima il disturbo, il motore audio lo fa sentire.
// Rari e brevi (12–25 s, 0,2–0,5 s, mai più di 3 lampi al secondo), spenti con movimento ridotto
// e con la scheda nascosta. Riempito dall’agente glitch (docs/animazioni.md).

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

export const glitch = {
  emetti(g: Omit<Glitch, 'inizio'>) {
    const completo = { ...g, inizio: performance.now() }
    glitchAttivi[g.bersaglio] = completo
    ascoltatori.forEach((a) => a(completo))
  },
  ascolta(a: (g: Glitch) => void) {
    ascoltatori.add(a)
    return () => {
      ascoltatori.delete(a)
    }
  },
  /** avanzamento 0–1 del glitch in corso sul bersaglio, null se fermo */
  avanzamento(bersaglio: BersaglioGlitch, ora = performance.now()) {
    const g = glitchAttivi[bersaglio]
    if (!g) return null
    const t = (ora - g.inizio) / 1000 / g.durata
    if (t >= 1) {
      delete glitchAttivi[bersaglio]
      return null
    }
    return { t, intensita: g.intensita }
  },
}
