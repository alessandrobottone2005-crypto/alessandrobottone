// Preriscaldamento incrementale durante l’header 2d: un upload o un oggetto da compilare per tick.
// Dopo l’arrivo di sala, computer e avatar, pochi render preparano anche la post-produzione.
// Non trattiene l’ingresso: se l’utente raggiunge subito il 3d, il rendering normale ha precedenza.
export const riscaldamento = {
  /** true per i pochi fotogrammi del preriscaldamento: volto e avatar si disegnano anche se nascosti */
  attivo: false,
  fatto: false,
  pronti: new Set<string>(),
}
export const PARTI_DA_RISCALDARE = ['sala', 'computer', 'avatar'] as const
