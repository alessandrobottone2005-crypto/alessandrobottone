// Tela 1-bit del paint: un byte per pixel (1 = inchiostro), trame 8×8, linee, rettangoli,
// riempimento e png a 1 bit con palette dei fosfori (pochi kB, codificato qui: niente librerie).
export const LARGHEZZA = 512
export const ALTEZZA = 342

export type Bitmap = Uint8Array

/** trame 8×8 in stile 1984: una riga = un byte, bit alto = pixel a sinistra */
export const TRAME: number[][] = [
  [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff], // nero
  [0, 0, 0, 0, 0, 0, 0, 0], // bianco
  [0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55, 0xaa, 0x55], // grigio
  [0x88, 0x00, 0x22, 0x00, 0x88, 0x00, 0x22, 0x00], // grigio chiaro
  [0x77, 0xff, 0xdd, 0xff, 0x77, 0xff, 0xdd, 0xff], // grigio scuro
  [0xff, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00], // righe
  [0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88], // colonne
  [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80], // diagonali
  [0xff, 0x80, 0x80, 0x80, 0xff, 0x08, 0x08, 0x08], // mattoni
  [0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x01], // puntini
]

export const nuovaTela = (): Bitmap => new Uint8Array(LARGHEZZA * ALTEZZA)
export const inTrama = (trama: number[], x: number, y: number) => ((trama[y & 7] >> (7 - (x & 7))) & 1) as 0 | 1
export const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < LARGHEZZA && y < ALTEZZA

/** valore da scrivere in un punto: un numero fisso (0/1) o la trama */
export type Inchiostro = 0 | 1 | number[]
const valore = (ink: Inchiostro, x: number, y: number) => (typeof ink === 'number' ? ink : inTrama(ink, x, y))

/** punta quadrata di lato `lato`, centrata */
export function punta(t: Bitmap, x: number, y: number, lato: number, ink: Inchiostro) {
  const r0 = -Math.floor((lato - 1) / 2)
  for (let dy = r0; dy < r0 + lato; dy++)
    for (let dx = r0; dx < r0 + lato; dx++) {
      const px = x + dx
      const py = y + dy
      if (dentro(px, py)) t[py * LARGHEZZA + px] = valore(ink, px, py)
    }
}

/** linea di bresenham con la punta data */
export function linea(t: Bitmap, x0: number, y0: number, x1: number, y1: number, lato: number, ink: Inchiostro) {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    punta(t, x0, y0, lato, ink)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}

export function rettangolo(t: Bitmap, x0: number, y0: number, x1: number, y1: number, lato: number, pieno: Inchiostro | null, bordo: Inchiostro) {
  const [ax, bx] = x0 < x1 ? [x0, x1] : [x1, x0]
  const [ay, by] = y0 < y1 ? [y0, y1] : [y1, y0]
  if (pieno !== null)
    for (let y = Math.max(0, ay); y <= Math.min(ALTEZZA - 1, by); y++)
      for (let x = Math.max(0, ax); x <= Math.min(LARGHEZZA - 1, bx); x++) t[y * LARGHEZZA + x] = valore(pieno, x, y)
  linea(t, ax, ay, bx, ay, lato, bordo)
  linea(t, bx, ay, bx, by, lato, bordo)
  linea(t, bx, by, ax, by, lato, bordo)
  linea(t, ax, by, ax, ay, lato, bordo)
}

/** secchiello: prima trova la zona dello stesso valore (4 vicini), poi la riempie con la trama */
export function riempi(t: Bitmap, x: number, y: number, ink: Inchiostro) {
  if (!dentro(x, y)) return
  const bersaglio = t[y * LARGHEZZA + x]
  const zona = new Uint8Array(t.length)
  const pila = [y * LARGHEZZA + x]
  zona[pila[0]] = 1
  while (pila.length) {
    const i = pila.pop()!
    const px = i % LARGHEZZA
    const vicini = [px > 0 ? i - 1 : -1, px < LARGHEZZA - 1 ? i + 1 : -1, i - LARGHEZZA, i + LARGHEZZA]
    for (const v of vicini)
      if (v >= 0 && v < t.length && !zona[v] && t[v] === bersaglio) {
        zona[v] = 1
        pila.push(v)
      }
  }
  for (let i = 0; i < t.length; i++) if (zona[i]) t[i] = valore(ink, i % LARGHEZZA, Math.floor(i / LARGHEZZA))
}

export const vuota = (t: Bitmap) => !t.some((v) => v === 1)

/** due colori dei fosfori: carta e inchiostro */
export const CARTA = [0xe7, 0xe1, 0xd1] as const
export const INCHIOSTRO = [0x16, 0x16, 0x14] as const

export function disegna(ctx: CanvasRenderingContext2D, t: Bitmap, immagine: ImageData) {
  const d = immagine.data
  for (let i = 0; i < t.length; i++) {
    const c = t[i] ? INCHIOSTRO : CARTA
    d[i * 4] = c[0]
    d[i * 4 + 1] = c[1]
    d[i * 4 + 2] = c[2]
    d[i * 4 + 3] = 255
  }
  ctx.putImageData(immagine, 0, 0)
}

// ---------------------------------------------------------------- png 1-bit

const TABELLA_CRC = (() => {
  const tab = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tab[n] = c >>> 0
  }
  return tab
})()

function crc32(dati: Uint8Array) {
  let c = 0xffffffff
  for (const b of dati) c = TABELLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function blocco(tipo: string, dati: Uint8Array) {
  const out = new Uint8Array(12 + dati.length)
  const vista = new DataView(out.buffer)
  vista.setUint32(0, dati.length)
  for (let i = 0; i < 4; i++) out[4 + i] = tipo.charCodeAt(i)
  out.set(dati, 8)
  vista.setUint32(8 + dati.length, crc32(out.subarray(4, 8 + dati.length)))
  return out
}

async function comprimi(dati: Uint8Array) {
  // 'deflate' di CompressionStream è il formato zlib richiesto da IDAT
  const flusso = new Blob([dati as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(flusso).arrayBuffer())
}

/** png indicizzato a 1 bit (indice 0 = carta, 1 = inchiostro), come data url */
export async function pngDaTela(t: Bitmap) {
  const perRiga = LARGHEZZA / 8
  const grezzo = new Uint8Array((perRiga + 1) * ALTEZZA)
  for (let y = 0; y < ALTEZZA; y++) {
    const base = y * (perRiga + 1) // primo byte della riga: filtro 0
    for (let x = 0; x < LARGHEZZA; x++) if (t[y * LARGHEZZA + x]) grezzo[base + 1 + (x >> 3)] |= 0x80 >> (x & 7)
  }
  const ihdr = new Uint8Array(13)
  const v = new DataView(ihdr.buffer)
  v.setUint32(0, LARGHEZZA)
  v.setUint32(4, ALTEZZA)
  ihdr.set([1, 3, 0, 0, 0], 8) // 1 bit, palette, compressione, filtro, niente interlacciamento
  const parti = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocco('IHDR', ihdr),
    blocco('PLTE', new Uint8Array([...CARTA, ...INCHIOSTRO])),
    blocco('IDAT', await comprimi(grezzo)),
    blocco('IEND', new Uint8Array()),
  ]
  const blob = new Blob(parti as BlobPart[], { type: 'image/png' })
  return new Promise<string>((ok, ko) => {
    const lettore = new FileReader()
    lettore.onload = () => ok(lettore.result as string)
    lettore.onerror = () => ko(lettore.error)
    lettore.readAsDataURL(blob)
  })
}
