// Stato leggero per i ticker esterni a React; non riguarda i modelli nei progetti.
const ascoltatori = new Set<(attiva: boolean) => void>()
export const attivitaScena = {
  attiva: false,
  imposta(attiva: boolean) {
    if (attiva === this.attiva) return
    this.attiva = attiva
    ascoltatori.forEach((fn) => fn(attiva))
  },
  ascolta(fn: (attiva: boolean) => void) {
    ascoltatori.add(fn)
    return () => { ascoltatori.delete(fn) }
  },
}
