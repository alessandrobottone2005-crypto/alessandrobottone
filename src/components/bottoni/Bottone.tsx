// bottone a pillola con testo (figma: button_atoms, misure small / medium / big).
// il testo rotola al passaggio; se cambia (es. "email" → "copiata") la nuova parola sale al posto della vecchia.
// small (44px) soddisfa il minimo WCAG 2.2 per i bersagli touch; medium (48px) e big (56px) lo superano.
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { RotolaAlPassaggio } from '@/components/testo/RotolaAlPassaggio'
import { movimento } from '@/config/movimento'
import { BaseBottone, type PropsBase } from './BaseBottone'

export type MisuraBottone = 'small' | 'medium' | 'big'

const FORMA: Record<MisuraBottone, string> = {
  small: 'h-11 w-full px-[18px] text-bottone-s rounded-pillola',
  medium: 'h-12 w-full px-6 text-bottone-m rounded-pillola',
  big: 'h-14 w-full px-8 text-bottone-l rounded-pillola',
}

const ease = [0.16, 1, 0.3, 1] as const

type Props = PropsBase & {
  testo: string
  dimensione?: MisuraBottone
}

export function Bottone({ testo, dimensione = 'big', ...props }: Props) {
  const ridotto = useReducedMotion()

  return (
    <BaseBottone
      {...props}
      forma={FORMA[dimensione]}
      bordo="border-[1.5px]"
      contenuto={(sopra, rotola) => (
        <span className="relative inline-flex overflow-hidden py-[0.1em]" aria-hidden={sopra || undefined}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={testo}
              className="inline-flex"
              initial={ridotto ? { opacity: 0 } : { y: '110%' }}
              animate={ridotto ? { opacity: 1 } : { y: '0%' }}
              exit={ridotto ? { opacity: 0 } : { y: '-110%' }}
              transition={{ duration: ridotto ? movimento.durata.ridotta : 0.5, ease }}
            >
              <RotolaAlPassaggio testo={testo} attivo={rotola} />
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    />
  )
}
