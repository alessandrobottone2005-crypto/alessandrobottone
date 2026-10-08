// Documento verticale: un solo scroll per la scheda, canvas solo vicino alla lettura.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Minus, Plus } from 'lucide-react'
import { sito } from '@/config/sito'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
const T = sito.archivio

export default function Pdf({ file, titolo }: { file: string; titolo: string }) {
  const radice = useRef<HTMLElement>(null)
  const ancora = useRef<{ numero: number; offset: number } | null>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [rapporti, setRapporti] = useState<number[]>([])
  const [larghezza, setLarghezza] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pagina, setPagina] = useState(1)
  const [errore, setErrore] = useState(false)
  const [tentativo, setTentativo] = useState(0)

  useEffect(() => {
    const el = radice.current!
    const osserva = new ResizeObserver(([entry]) => setLarghezza(Math.floor(entry.contentRect.width)))
    osserva.observe(el)
    return () => osserva.disconnect()
  }, [])

  useEffect(() => {
    if (!pdf) return
    let annullato = false
    const misura = async () => {
      const dimensioni: number[] = []
      // Misura ogni pagina: documenti con pagine miste non saltano durante lo scroll.
      for (let i = 1; i <= pdf.numPages; i++) {
        const p = await pdf.getPage(i)
        if (annullato) return
        const v = p.getViewport({ scale: 1 })
        dimensioni.push(v.height / v.width)
      }
      if (!annullato) setRapporti(dimensioni)
    }
    void misura().catch(() => { if (!annullato) setErrore(true) })
    return () => { annullato = true }
  }, [pdf])

  useEffect(() => {
    const el = radice.current
    const root = el?.closest('.archivio-scroll')
    if (!el || !root || !rapporti.length) return
    let frame = 0
    const aggiorna = () => {
      frame = 0
      const y = root.getBoundingClientRect().top + (el.querySelector('.pdf-barra')?.getBoundingClientRect().height ?? 0) + 1
      const pagine = [...el.querySelectorAll<HTMLElement>('[data-pdf-pagina]')]
      const attuale = pagine.find((p) => p.getBoundingClientRect().bottom > y) ?? pagine.at(-1)
      if (attuale) setPagina(Number(attuale.dataset.pdfPagina))
    }
    const pianifica = () => { if (!frame) frame = requestAnimationFrame(aggiorna) }
    root.addEventListener('scroll', pianifica, { passive: true })
    aggiorna()
    return () => { root.removeEventListener('scroll', pianifica); cancelAnimationFrame(frame) }
  }, [rapporti, larghezza, zoom])

  const cambiaZoom = (valore: number) => {
    const root = radice.current?.closest('.archivio-scroll')
    const p = radice.current?.querySelector<HTMLElement>(`[data-pdf-pagina="${pagina}"]`)
    if (root && p) ancora.current = { numero: pagina, offset: p.getBoundingClientRect().top - root.getBoundingClientRect().top }
    setZoom(valore)
  }
  useLayoutEffect(() => {
    const a = ancora.current
    const root = radice.current?.closest('.archivio-scroll')
    const p = radice.current?.querySelector<HTMLElement>(`[data-pdf-pagina="${a?.numero}"]`)
    if (a && root && p) root.scrollTop += p.getBoundingClientRect().top - root.getBoundingClientRect().top - a.offset
    ancora.current = null
  }, [zoom])

  const riprova = () => { setErrore(false); setPdf(null); setRapporti([]); setTentativo((n) => n + 1) }
  const w = Math.max(1, Math.floor(larghezza * zoom))
  return <figure ref={radice} className="pdf-documento" aria-label={sito.blocchi.pdf(titolo)}>
    <div className="pdf-barra">
      <div className="archivio-zoom">
        <button type="button" aria-label={T.diminuisci} disabled={zoom <= 1} onClick={() => cambiaZoom(Math.max(1, zoom - .25))}><Minus size={18} aria-hidden="true" /></button>
        <output aria-label={T.zoom}>{Math.round(zoom * 100)}%</output>
        <button type="button" aria-label={T.aumenta} disabled={zoom >= 3} onClick={() => cambiaZoom(Math.min(3, zoom + .25))}><Plus size={18} aria-hidden="true" /></button>
      </div>
      <button type="button" className="archivio-comando" aria-label={T.adatta} onClick={() => cambiaZoom(1)}><span className="archivio-etichetta-lunga" aria-hidden="true">{T.adatta}</span><span className="archivio-etichetta-breve" aria-hidden="true">{T.adattaBreve}</span></button>
      {rapporti.length > 0 && <span className="pdf-posizione">{T.pagina(pagina, rapporti.length)}</span>}
      <a href={file} target="_blank" rel="noreferrer">{T.originale}</a>
    </div>
    {errore ? <div className="archivio-errore" role="status"><p>{T.errore}</p><button type="button" onClick={riprova}>{T.riprova}</button></div> :
      <Document suspense={false} key={tentativo} file={file} onLoadSuccess={setPdf} onItemClick={({ pageNumber }) => {
        radice.current?.querySelector(`[data-pdf-pagina="${pageNumber}"]`)?.scrollIntoView({ block: 'start' })
      }} externalLinkTarget="_blank" externalLinkRel="noopener noreferrer" onLoadError={() => setErrore(true)} loading={<p className="pdf-attesa" role="status">{T.caricamento}</p>} error={null}>
        {!rapporti.length && pdf && <p className="pdf-attesa" role="status">{T.caricamento}</p>}
        <div className="pdf-pagine" tabIndex={zoom > 1 ? 0 : undefined} aria-label={zoom > 1 ? `${T.zoom} ${Math.round(zoom * 100)}%` : undefined}>
          {larghezza > 0 && rapporti.map((rapporto, i) => <Pagina key={i} numero={i + 1} larghezza={w} altezza={Math.round(w * rapporto)} />)}
        </div>
      </Document>}
  </figure>
}

function Pagina({ numero, larghezza, altezza }: { numero: number; larghezza: number; altezza: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vicina, setVicina] = useState(false)
  const [errore, setErrore] = useState(false)
  const [tentativo, setTentativo] = useState(0)
  useEffect(() => {
    const el = ref.current!
    const observer = new IntersectionObserver(([e]) => setVicina(e.isIntersecting), { root: el.closest('.archivio-scroll'), rootMargin: '1000px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className="pdf-pagina" data-pdf-pagina={numero} style={{ width: larghezza, height: altezza }}>
    {errore ? <div className="archivio-errore" role="status"><p>{T.errore}</p><button type="button" onClick={() => { setErrore(false); setTentativo((n) => n + 1) }}>{T.riprova}</button></div> : vicina ?
      <Page suspense={false} key={tentativo} pageNumber={numero} width={larghezza} devicePixelRatio={Math.min(devicePixelRatio, 2, 4096 / Math.max(larghezza, altezza))} renderTextLayer renderAnnotationLayer onRenderError={() => setErrore(true)} onLoadError={() => setErrore(true)} loading={<p className="pdf-attesa">{T.caricamento}</p>} />
      : null}
  </div>
}
