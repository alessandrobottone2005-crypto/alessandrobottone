// Disegni a pixel scritti come testo: '#' inchiostro, '.' carta, spazio trasparente.
// Ogni riga diventa pochi rettangoli: nitidi a qualsiasi scala, nessun file e nessuna licenza esterna.
export function PixelSvg({ righe, className }: { righe: readonly string[]; className?: string }) {
  const larghezza = Math.max(...righe.map((r) => r.length))
  const rett: { x: number; y: number; w: number; c: '#' | '.' }[] = []
  righe.forEach((riga, y) => {
    let x = 0
    while (x < riga.length) {
      const c = riga[x]
      let w = 1
      while (riga[x + w] === c) w++
      if (c === '#' || c === '.') rett.push({ x, y, w, c })
      x += w
    }
  })
  return (
    <svg viewBox={`0 0 ${larghezza} ${righe.length}`} aria-hidden="true" shapeRendering="crispEdges" className={className}>
      {rett.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.c === '#' ? '#000' : '#fff'} />
      ))}
    </svg>
  )
}
