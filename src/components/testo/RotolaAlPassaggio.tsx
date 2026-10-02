// testo di link e pulsanti che “rotola” al passaggio (come k95.it): le lettere salgono una dopo l’altra
// e al loro posto arriva una copia identica dal basso. motion anima solo lo spostamento delle lettere.
//
// uso:
//   <a href="…"><RotolaAlPassaggio testo="instagram" /></a>
//   → si attiva da solo con il passaggio del mouse o il focus da tastiera sul link/pulsante che lo contiene.
//   <RotolaAlPassaggio testo="email" attivo={sopra} />
//   → oppure lo comandi tu (utile per sincronizzare più copie, o per farlo rotolare al tocco su mobile).
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

type Props = {
  testo: string
  /** se presente comanda il rotolamento; se manca, ascolta il link o pulsante che lo contiene */
  attivo?: boolean
  /** ritardo tra una lettera e la successiva, in secondi */
  sfalsamento?: number
  className?: string
}

const ease = [0.16, 1, 0.3, 1] as const
const INTERATTIVO = 'a, button, [role="button"]'

export function RotolaAlPassaggio({ testo, attivo, sfalsamento = 0.022, className }: Props) {
  const ridotto = useReducedMotion()
  const radice = useRef<HTMLSpanElement>(null)
  const [sopra, setSopra] = useState(false)
  const comandato = attivo !== undefined

  // senza comando esterno: ascolta il link o pulsante più vicino
  useEffect(() => {
    if (comandato) return
    const el = radice.current?.closest<HTMLElement>(INTERATTIVO)
    if (!el) return
    const entra = (e: PointerEvent) => e.pointerType === 'mouse' && setSopra(true)
    const esce = (e: PointerEvent) => e.pointerType === 'mouse' && setSopra(false)
    // su touch rotola al tocco
    const tocca = (e: PointerEvent) => e.pointerType !== 'mouse' && setSopra((s) => !s)
    const focus = () => el.matches(':focus-visible') && setSopra(true)
    const blur = () => setSopra(false)
    el.addEventListener('pointerenter', entra)
    el.addEventListener('pointerleave', esce)
    el.addEventListener('pointerdown', tocca)
    el.addEventListener('focus', focus)
    el.addEventListener('blur', blur)
    return () => {
      el.removeEventListener('pointerenter', entra)
      el.removeEventListener('pointerleave', esce)
      el.removeEventListener('pointerdown', tocca)
      el.removeEventListener('focus', focus)
      el.removeEventListener('blur', blur)
    }
  }, [comandato])

  const su = (comandato ? attivo : sopra) && !ridotto
  const lettere = [...testo]

  return (
    // ogni lettera ha un margine sopra e sotto dentro il ritaglio: discendenti (g) e accenti della copia
    // nascosta non entrano nel riquadro; il margine negativo tiene l’ingombro di una riga
    <span ref={radice} className={`relative -my-[0.15em] inline-flex overflow-hidden align-bottom ${className ?? ''}`}>
      {/* testo vero, una volta sola, per gli screen reader */}
      <span className="sr-only">{testo}</span>
      <span aria-hidden="true" className="inline-flex whitespace-pre">
        {lettere.map((lettera, i) => (
          <motion.span
            key={i}
            className="relative inline-block py-[0.15em]"
            initial={false}
            animate={{ y: su ? '-100%' : '0%' }}
            transition={{ duration: 0.45, ease, delay: i * sfalsamento }}
          >
            {lettera}
            {/* la copia che arriva dal basso */}
            <span className="absolute top-full left-0 py-[0.15em]">{lettera}</span>
          </motion.span>
        ))}
      </span>
    </span>
  )
}
