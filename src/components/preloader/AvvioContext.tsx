// L’interfaccia è indipendente dalla preparazione della scena, richiesta soltanto entrando nell’esperienza.
import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useLocation } from 'react-router'
import { attivitaScena } from '@/lib/attivitaScena'

type Valore = {
  pronto: boolean
  setPronto: (p: boolean) => void
  preparaScena: boolean
  setPreparaScena: (p: boolean) => void
  entrato: boolean
  setEntrato: (e: boolean) => void
  esperienzaRichiesta: boolean
  richiediEsperienza: () => void
  scenaAttiva: boolean
  ingressoVisibile: boolean
  voltoHeader: RefObject<HTMLDivElement | null>
}
const Contesto = createContext<Valore | null>(null)
export function AvvioProvider({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation()
  const [pronto, setPronto] = useState(false)
  const [preparaScena, setPreparaScena] = useState(false)
  const [entrato, setEntrato] = useState(false)
  const [richiesta, setRichiesta] = useState(() => pathname === '/' && ['#header', '#portfolio', '#chi-sono', '#contatti'].includes(hash))
  // I frammenti sono destinazioni della home: anche un collegamento diretto può richiedere la scena.
  const destinazioneHome = pathname === '/' && ['#header', '#portfolio', '#chi-sono', '#contatti'].includes(hash)
  const esperienzaRichiesta = richiesta || destinazioneHome
  const ingressoVisibile = pathname === '/' && !destinazioneHome
  const scenaAttiva = pathname === '/laboratorio' || (esperienzaRichiesta && destinazioneHome)
  useLayoutEffect(() => {
    attivitaScena.imposta(scenaAttiva)
  }, [scenaAttiva, destinazioneHome])
  const voltoHeader = useRef<HTMLDivElement>(null)
  const valore = useMemo(() => ({ pronto, setPronto, preparaScena, setPreparaScena, entrato, setEntrato,
    esperienzaRichiesta, richiediEsperienza: () => setRichiesta(true), scenaAttiva, ingressoVisibile, voltoHeader,
  }), [pronto, preparaScena, entrato, esperienzaRichiesta, scenaAttiva, ingressoVisibile])
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAvvio() {
  const valore = useContext(Contesto)
  if (!valore) throw new Error('useAvvio va usato dentro <AvvioProvider>')
  return valore
}
