// parametri della resa «cinema» della scena 3d (claude.md §6, docs/ambiente-3d.md).
// ogni effetto si spegne con ?senza=fuoco,polvere,grana,alone,aberrazione,striscia,colore,respiro per i confronti.
export const cinema = {
  // profondità di campo: il fuoco segue il protagonista (volto, poi schermo del computer);
  // vicino al computer la zona nitida si allarga a tutto il computer (scala ×4) e al volto dietro il monitor
  fuoco: { intervallo: 3.2, intervalloComputer: 7, bokeh: 3.2, bokehBasso: 1.8 },
  // polvere nel fascio della fessura
  polvere: { quante: 9000, misura: 0.006, luce: 1.1, scintillio: 0.75 },
  // grana pellicola (dopo la tonalità), alone attorno alle luci, aberrazione ai bordi
  grana: 0.09,
  alone: { soglia: 0.82, intensita: 0.12, raggio: 0.85 },
  aberrazione: 0.0011,
  // striscia orizzontale (anamorfica) sulle luci più forti
  striscia: { intensita: 0.32, lunghezza: 0.16 },
  // raggi più netti nel volume
  nettezzaFascio: 0.6,
  // colore: bianco e nero noir (solo la scena 3d: schermo del computer e ui restano fuori)
  colore: { saturazione: 0, curva: 0.15, neri: 0 },
  noir: { gamma: 1.35, soglia: 0.015 },
  vignetta: { offset: 0.26, darkness: 0.68 },
  // la luce della fessura: arancione caldo, l’unico colore della scena (il colore finale tiene solo questa tinta)
  sole: { colore: '#ff7a24', tonalita: 24, ampiezza: 26 },
  // camera: respiro steadicam (unità della scena, gradi) e inerzia delle pose
  respiro: { posizione: 0.035, rotazione: 0.18, velocita: 0.22 },
} as const

const senza = new Set((new URLSearchParams(location.search).get('senza') ?? '').split(','))
export const effettoAttivo = (nome: string) => !senza.has(nome)
