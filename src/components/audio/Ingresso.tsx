// ingresso nel sito (docs/audio.md): a preloader finito compare «inizia a scrollare». Finché non si preme lo scroll
// resta bloccato come nel preloader; il gesto avvia l’audio (i browser lo chiedono) e libera la pagina.
// Con un link diretto a un progetto l’ingresso è già fatto: l’audio parte al primo clic o tasto nella pagina.
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Bottone } from '@/components/bottoni/Bottone'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { movimento } from '@/config/movimento'
import { ingresso } from '@/config/sito'
import { audio } from '@/lib/audio/motore'

const ease = [0.16, 1, 0.3, 1] as const

export function Ingresso() {
  const { pronto, entrato, setEntrato } = useAvvio()
  const ridotto = useReducedMotion()
  const involucro = useRef<HTMLDivElement>(null)
  const mostra = pronto && !entrato

  // la musica si scarica solo a preloader finito: non rallenta il caricamento
  useEffect(() => {
    if (pronto) audio.precarica()
  }, [pronto])

  // il pulsante prende il focus (senza l’anello: è il primo elemento, non arriva dalla tastiera)
  useEffect(() => {
    if (!mostra) return
    const pulsante = involucro.current?.querySelector('button')
    pulsante?.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
  }, [mostra])

  // safari su iphone a volte scorre anche con la pagina in overflow: hidden; finché non si entra il trascinamento è fermo
  useEffect(() => {
    if (entrato) return
    const blocca = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault()
    }
    addEventListener('touchmove', blocca, { passive: false })
    return () => removeEventListener('touchmove', blocca)
  }, [entrato])

  // link diretto: nessun pulsante, l’audio aspetta il primo gesto vero nella pagina
  useEffect(() => {
    if (!pronto || !entrato || audio.avviato) return
    const avvia = () => {
      void audio.avvia()
      smetti()
    }
    const eventi = ['click', 'keydown', 'touchend'] as const
    const smetti = () => eventi.forEach((e) => removeEventListener(e, avvia, true))
    eventi.forEach((e) => addEventListener(e, avvia, true))
    return smetti
  }, [pronto, entrato])

  const entra = () => {
    // prima l’audio, dentro il gesto; poi la pagina si libera
    void audio.avvia()
    setEntrato(true)
  }

  const transizione = { duration: ridotto ? movimento.durata.ridotta : 0.7, ease }
  return (
    <AnimatePresence>
      {mostra && (
        <motion.div
          ref={involucro}
          key="ingresso"
          // su telefono il cognome sta in basso al centro: il pulsante sale sopra di lui
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+7rem)] left-1/2 z-40 -translate-x-1/2 md:bottom-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))]"
          initial={ridotto ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={ridotto ? { opacity: 1 } : { opacity: 1, y: 0 }}
          // esce scendendo e sfumando, mentre la pagina comincia a muoversi
          exit={ridotto ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.94, transition: { duration: 0.5, ease } }}
          transition={transizione}
        >
          <Bottone testo={ingresso.pulsante} dimensione="big" onClick={entra} className="block w-max" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
