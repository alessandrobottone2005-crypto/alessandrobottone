// «dediche»: cartella pubblica con i disegni inviati dal paint, visibili subito a tutti.
// Elenco a pagine (più recenti prima); ogni voce si apre; «segnala» la nasconde dopo qualche segnalazione.
import { useEffect, useRef, useState } from 'react'
import { sito } from '@/config/sito'
import { ascoltaNuove, dedicheAppena, elencaDediche, ErroreDediche, segnalaDedica, type Pagina, type Voce } from './clientDediche'
import { clic } from './suoni'

const testi = sito.app.dediche

const dataLeggibile = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** le dediche inviate in questa visita stanno in testa alla prima pagina anche se l’elenco è ancora in cache */
function conAppena(p: Pagina): Pagina {
  if (p.pagina !== 1) return p
  const nuove = dedicheAppena().filter((v) => !p.voci.some((x) => x.id === v.id))
  return nuove.length ? { ...p, voci: [...nuove, ...p.voci], totale: p.totale + nuove.length } : p
}

export default function Dediche() {
  const [pagina, setPagina] = useState(1)
  const [dati, setDati] = useState<Pagina | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [aperta, setAperta] = useState<Voce | null>(null)
  const [segnalate, setSegnalate] = useState<Set<string>>(() => new Set())
  // la voce aperta: tornando all’elenco il fuoco torna lì
  const ultimaAperta = useRef<string | null>(null)
  const radice = useRef<HTMLDivElement>(null)

  // ogni «aggiorna» (o una dedica appena inviata) rilegge l’elenco saltando la cache
  const [aggiornamento, setAggiornamento] = useState(0)
  useEffect(() => {
    let vivo = true
    elencaDediche(pagina, aggiornamento > 0)
      .then((d) => {
        if (!vivo) return
        setDati(conAppena(d))
        setErrore(null)
      })
      .catch((e) => {
        if (vivo) setErrore(e instanceof ErroreDediche && e.codice === 'non-configurato' ? testi.nonAttive : testi.errore)
      })
    return () => {
      vivo = false
    }
  }, [pagina, aggiornamento])

  // una dedica appena inviata dal paint: si torna alla prima pagina e la si vede subito
  useEffect(
    () =>
      ascoltaNuove(() => {
        setAperta(null)
        setPagina(1)
        setAggiornamento((n) => n + 1)
      }),
    [],
  )

  const apri = (v: Voce) => {
    clic()
    ultimaAperta.current = v.id
    setAperta(v)
    requestAnimationFrame(() => radice.current?.querySelector<HTMLElement>('.dediche-indietro')?.focus())
  }
  const chiudi = () => {
    clic()
    setAperta(null)
    requestAnimationFrame(() => {
      radice.current?.querySelector<HTMLElement>(`[data-voce="${ultimaAperta.current}"]`)?.focus()
    })
  }
  const segnala = async (v: Voce) => {
    clic()
    setSegnalate((s) => new Set(s).add(v.id))
    // il pulsante si disattiva: il fuoco passa a «indietro» invece di perdersi
    requestAnimationFrame(() => radice.current?.querySelector<HTMLElement>('.dediche-indietro')?.focus())
    try {
      await segnalaDedica(v.id)
    } catch {
      /* la segnalazione non è arrivata: nessun danno, si può riprovare ricaricando */
    }
  }

  if (aperta) {
    const nome = aperta.nome || testi.anonimo
    return (
      // esc torna all’elenco prima di chiudere la finestra
      <div
        ref={radice}
        className="app-dediche"
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          e.preventDefault()
          e.stopPropagation()
          chiudi()
        }}
      >
        <div className="dediche-barra">
          <button type="button" className="app-pulsante dediche-indietro" onClick={chiudi}>
            {testi.indietro}
          </button>
          <button type="button" className="app-pulsante" disabled={segnalate.has(aperta.id)} onClick={() => segnala(aperta)}>
            {testi.segnala}
          </button>
        </div>
        <figure className="dediche-dettaglio">
          <img src={aperta.immagine} alt={testi.disegno(nome)} width={512} height={342} className="dediche-disegno" />
          <figcaption>
            {aperta.dedica && <p className="dediche-testo">{aperta.dedica}</p>}
            <p className="dediche-firma">
              — {nome} · <span className="cifre-tabellari">{dataLeggibile(aperta.data)}</span>
            </p>
          </figcaption>
        </figure>
        <p aria-live="polite" className="dediche-avviso">
          {segnalate.has(aperta.id) ? testi.segnalata : ''}
        </p>
      </div>
    )
  }

  return (
    <div ref={radice} className="app-dediche">
      <div className="dediche-barra">
        <span className="cifre-tabellari">{dati && dati.pagine > 1 ? testi.pagina(dati.pagina, dati.pagine) : ''}</span>
        <button
          type="button"
          className="app-pulsante"
          onClick={() => {
            clic()
            setAggiornamento((n) => n + 1)
          }}
        >
          {testi.aggiorna}
        </button>
      </div>
      {errore ? (
        <p className="dediche-avviso">{errore}</p>
      ) : !dati ? (
        <p className="dediche-avviso">{sito.app.caricamento}</p>
      ) : dati.voci.length === 0 ? (
        <p className="dediche-avviso">{testi.vuota}</p>
      ) : (
        <ul className="dediche-griglia">
          {dati.voci.map((v) => {
            const nome = v.nome || testi.anonimo
            return (
              <li key={v.id}>
                <button type="button" className="dediche-voce" data-voce={v.id} aria-label={testi.apri(nome, v.dedica)} data-segnalata={segnalate.has(v.id) || undefined} onClick={() => apri(v)}>
                  <img src={v.immagine} alt="" width={512} height={342} loading="lazy" className="dediche-disegno" />
                  <span className="dediche-anteprima">{v.dedica || '…'}</span>
                  <span className="dediche-firma">— {nome}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {dati && dati.pagine > 1 && (
        <div className="dediche-pagine">
          <button
            type="button"
            className="app-pulsante"
            disabled={pagina <= 1}
            onClick={() => {
              clic()
              setPagina((p) => p - 1)
            }}
          >
            {testi.precedenti}
          </button>
          <button
            type="button"
            className="app-pulsante"
            disabled={pagina >= dati.pagine}
            onClick={() => {
              clic()
              setPagina((p) => p + 1)
            }}
          >
            {testi.successive}
          </button>
        </div>
      )}
    </div>
  )
}
