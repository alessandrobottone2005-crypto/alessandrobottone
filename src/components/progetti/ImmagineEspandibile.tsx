import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minus, Plus, X } from 'lucide-react'
import { sito } from '@/config/sito'

const T = sito.archivio
// Le dimensioni già lette riservano lo spazio anche tornando da un’altra pagina.
const dimensioniNote = new Map<string, { width: number; height: number }>()
export function ImmagineEspandibile({ src, alt, copertina = false, prioritaria = false }: { src: string; alt: string; copertina?: boolean; prioritaria?: boolean }) {
  const [dimensioni, setDimensioni] = useState(() => dimensioniNote.get(src))
  const dialog = useRef<HTMLDialogElement>(null)
  const aprente = useRef<HTMLButtonElement>(null)
  const [aperta, setAperta] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [errore, setErrore] = useState(false)
  const [tentativo, setTentativo] = useState(0)
  useEffect(() => {
    if (!aperta) return
    const el = dialog.current!
    const pulsante = aprente.current
    el.showModal()
    return () => { el.close(); pulsante?.focus({ preventScroll: true }) }
  }, [aperta])
  if (errore) return <div className="archivio-errore" role="status"><p>{T.errore}</p><button type="button" onClick={() => { setErrore(false); setTentativo((n) => n + 1) }}>{T.riprova}</button></div>
  return <>
    <button ref={aprente} type="button" className={`archivio-immagine ${copertina ? 'archivio-copertina' : ''}`} aria-label={T.ingrandisci(alt)} onClick={() => { setZoom(1); setAperta(true) }}>
      <img key={tentativo} src={src} alt={alt} loading={copertina || prioritaria ? 'eager' : 'lazy'} width={dimensioni?.width} height={dimensioni?.height} onLoad={(e) => {
        const img = e.currentTarget
        const misura = { width: img.naturalWidth, height: img.naturalHeight }
        dimensioniNote.set(src, misura)
        setDimensioni(misura)
      }} decoding="async" onError={() => setErrore(true)} />
      <span className="archivio-ingrandisci" aria-hidden="true"><Maximize2 size={20} /></span>
    </button>
    {aperta && <dialog ref={dialog} className="archivio archivio-lente" data-mac aria-label={alt} onKeyDown={(e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setAperta(false)
    }} onCancel={(e) => { e.preventDefault(); e.stopPropagation(); setAperta(false) }}>
      <header className="archivio-barra">
        <div className="archivio-zoom">
          <button type="button" aria-label={T.diminuisci} disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - .5))}><Minus size={18} /></button>
          <output aria-label={T.zoom}>{Math.round(zoom * 100)}%</output>
          <button type="button" aria-label={T.aumenta} disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, z + .5))}><Plus size={18} /></button>
        </div>
        <button type="button" className="archivio-comando" onClick={() => setAperta(false)}><X size={18} aria-hidden="true" />{T.chiudiImmagine}</button>
      </header>
      <div className="archivio-lente-area" data-lenis-prevent tabIndex={0} aria-label={alt}>
        <div style={{ width: `${zoom * 100}%`, minHeight: `${zoom * 100}%` }}><img src={src} alt={alt} style={{ maxHeight: `${zoom * 82}dvh` }} /></div>
      </div>
    </dialog>}
  </>
}
