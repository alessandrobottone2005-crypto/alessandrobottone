// umore globale dei volti: si addormentano dopo un po’ senza input, si svegliano al primo movimento,
// dormono quando la scheda del browser non è attiva (con titolo e favicon “addormentati”).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { media, movimento } from '@/config/movimento'
import { sito } from '@/config/sito'
import { avviaSguardo } from './sguardo'

type Umore = 'dorme' | 'naturale'
export type Azione = 'battito' | 'occhiolino' | 'sorriso'

type Valore = {
  umore: Umore
  ridotto: boolean
  setUmore: (u: Umore) => void
  /** fa compiere un’azione a tutti i volti visibili */
  azione: (a: Azione) => void
  ascoltaAzioni: (fn: (a: Azione) => void) => () => void
}

const Contesto = createContext<Valore | null>(null)

const FAVICON = { sveglio: '/volto/favicon.png', dorme: '/volto/favicon-dorme.png' }
const INPUT = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

function impostaFavicon(href: string) {
  const link = document.querySelector<HTMLLinkElement>('link#favicon')
  if (link) link.href = href
}

export function VoltoProvider({ children }: { children: ReactNode }) {
  const [umore, setUmoreState] = useState<Umore>('naturale')
  const [ridotto, setRidotto] = useState(() => matchMedia(media.ridotto).matches)
  const umoreRef = useRef(umore)
  const ascoltatori = useRef(new Set<(a: Azione) => void>())

  const setUmore = useCallback((u: Umore) => {
    umoreRef.current = u
    setUmoreState(u)
  }, [])

  const azione = useCallback((a: Azione) => ascoltatori.current.forEach((fn) => fn(a)), [])
  const ascoltaAzioni = useCallback((fn: (a: Azione) => void) => {
    ascoltatori.current.add(fn)
    return () => void ascoltatori.current.delete(fn)
  }, [])

  useEffect(() => avviaSguardo(), [])
  useEffect(() => {
    const mq = matchMedia(media.ridotto)
    const aggiorna = () => setRidotto(mq.matches)
    mq.addEventListener('change', aggiorna)
    return () => mq.removeEventListener('change', aggiorna)
  }, [])

  // risveglio: prima si aprono gli occhi, poi il battito. il battito va chiesto quando i volti
  // hanno già ricevuto il nuovo umore (subito dopo, li troverebbe ancora addormentati e lo ignorerebbero)
  const risveglio = useRef(0)
  const sveglia = useCallback(() => {
    setUmore('naturale')
    clearTimeout(risveglio.current)
    risveglio.current = window.setTimeout(() => azione('battito'), 400)
  }, [azione, setUmore])
  useEffect(() => () => clearTimeout(risveglio.current), [])

  // sonno dopo qualche secondo senza input; al primo movimento si sveglia con un battito
  useEffect(() => {
    let timer = 0
    // Anche il primo input deve armare il timer, prima dei 250 ms di attività.
    let ultimo = -Infinity
    const addormenta = () => setUmore('dorme')
    const input = () => {
      const ora = performance.now()
      if (umoreRef.current === 'dorme' && !document.hidden) sveglia()
      // non serve riavviare il timer a ogni pixel del mouse
      if (ora - ultimo < 250) return
      ultimo = ora
      clearTimeout(timer)
      timer = window.setTimeout(addormenta, movimento.volto.sonnoDopo * 1000)
    }
    input()
    INPUT.forEach((e) => addEventListener(e, input, { passive: true }))
    return () => {
      clearTimeout(timer)
      INPUT.forEach((e) => removeEventListener(e, input))
    }
  }, [sveglia, setUmore])

  // scheda non attiva: titolo e favicon con gli occhi chiusi
  useEffect(() => {
    let titolo = document.title
    const cambia = () => {
      if (document.hidden) {
        titolo = document.title
        document.title = sito.titoloAssente
        impostaFavicon(FAVICON.dorme)
        setUmore('dorme')
      } else {
        document.title = titolo
        impostaFavicon(FAVICON.sveglio)
        sveglia()
      }
    }
    document.addEventListener('visibilitychange', cambia)
    return () => document.removeEventListener('visibilitychange', cambia)
  }, [sveglia, setUmore])

  const valore = useMemo(() => ({ umore, ridotto, setUmore, azione, ascoltaAzioni }), [umore, ridotto, setUmore, azione, ascoltaAzioni])
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVolto() {
  const valore = useContext(Contesto)
  if (!valore) throw new Error('useVolto va usato dentro <VoltoProvider>')
  return valore
}
