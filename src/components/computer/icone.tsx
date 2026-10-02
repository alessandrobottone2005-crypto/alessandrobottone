// Icone 1-bit su griglia 32×32, disegnate a pixel come quelle del Finder 1984.
import { useVoltoPixel } from './voltoPixel'

const pixel = { shapeRendering: 'crispEdges' as const }

export function IconaCartella() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" style={pixel}>
      <path d="M1 7H12L14 9H31V28H1Z" fill="#000" />
      <path d="M2 8H11.6L13.6 10H30V27H2Z" fill="#fff" />
      <rect x="2" y="11" width="28" height="1" fill="#000" />
    </svg>
  )
}

/** documento con l’angolo piegato; dentro, la copertina del progetto a colori */
export function IconaDocumento({ copertina }: { copertina?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" style={pixel}>
      <path d="M5 1H21L28 8V31H5Z" fill="#000" />
      <path d="M6 2H20V9H27V30H6Z" fill="#fff" />
      <path d="M21 2.5L26.5 8H21Z" fill="#fff" />
      {copertina && <image href={copertina} x="8" y="11" width="17" height="17" preserveAspectRatio="xMidYMid slice" />}
    </svg>
  )
}

/** scacchi: una scacchiera vista dall’alto con un pedone */
export function IconaScacchi() {
  const scure = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) if ((r + c) % 2) scure.push(<rect key={`${r}${c}`} x={4 + c * 6} y={6 + r * 6} width="6" height="6" fill="#000" />)
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" style={pixel}>
      <rect x="3" y="5" width="26" height="26" fill="#000" />
      <rect x="4" y="6" width="24" height="24" fill="#fff" />
      {scure}
      <path d="M14 0H18V1H19V4H18V5H19V7H20V9H21V11H11V9H12V7H13V5H14V4H13V1H14Z" fill="#000" />
      <path d="M15 1H17V4H15ZM14 6H18V8H14ZM13 9H19V10H13Z" fill="#fff" />
    </svg>
  )
}

/** paint: un foglio con uno scarabocchio e la matita */
export function IconaPaint() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" style={pixel}>
      <path d="M3 3H23V31H3Z" fill="#000" />
      <path d="M4 4H22V30H4Z" fill="#fff" />
      <path d="M6 24H8V22H10V20H12V22H14V24H16V26H14V25H12V23H10V25H8V26H6Z" fill="#000" />
      <path d="M27 1H31V5H30V6H29V7H28V8H27V9H26V10H25V11H24V12H23V13H22V14H21V15H20V16H19V17H18V18H15V15H16V14H17V13H18V12H19V11H20V10H21V9H22V8H23V7H24V6H25V5H26V4H27Z" fill="#000" />
      <path d="M28 2H30V4H28ZM27 4H28V5H27ZM26 5H27V6H26ZM25 6H26V7H25ZM24 7H25V8H24ZM23 8H24V9H23ZM22 9H23V10H22ZM21 10H22V11H21ZM20 11H21V12H20ZM19 12H20V13H19ZM18 13H19V14H18ZM17 14H18V15H17Z" fill="#fff" />
    </svg>
  )
}

/** dediche: una cartella con un cuore */
export function IconaDediche() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" style={pixel}>
      <path d="M1 7H12L14 9H31V28H1Z" fill="#000" />
      <path d="M2 8H11.6L13.6 10H30V27H2Z" fill="#fff" />
      <rect x="2" y="11" width="28" height="1" fill="#000" />
      <path d="M12 14H15V15H17V14H20V15H21V19H20V20H19V21H18V22H17V23H15V22H14V21H13V20H12V19H11V15H12Z" fill="#000" />
    </svg>
  )
}

/** il «mac felice» dell’avvio: un computer compatto con il volto sullo schermo */
export function MacFelice() {
  const volto = useVoltoPixel(18)
  return (
    <svg viewBox="0 0 32 42" aria-hidden="true" style={pixel} className="mac-felice">
      <rect x="2" y="1" width="28" height="35" fill="#000" />
      <rect x="3" y="2" width="26" height="33" fill="#fff" />
      <rect x="6" y="5" width="20" height="17" fill="#000" />
      <rect x="7" y="6" width="18" height="15" fill="#fff" />
      {volto && <image href={volto} x="7" y="5" width="18" height="18" style={{ imageRendering: 'pixelated' }} />}
      <rect x="16" y="28" width="9" height="1" fill="#000" />
      <rect x="2" y="36" width="28" height="5" fill="#000" />
      <rect x="3" y="36" width="26" height="4" fill="#fff" />
    </svg>
  )
}
