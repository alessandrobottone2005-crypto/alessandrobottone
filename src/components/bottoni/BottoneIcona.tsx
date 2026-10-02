// bottone rotondo con sola icona (figma: icon button_atoms, misure small / medium / big).
// l’etichetta è obbligatoria: è il nome che leggono gli screen reader.
// l’icona è una di figma (per nome) oppure un elemento già pronto (es. lucide, che segue currentColor).
// attenzione: small (40px) è sotto l’area toccabile minima su mobile (48px, claude.md §12).
import type { ReactElement } from 'react'
import { Icona, type TipoIcona } from '@/components/icone/Icona'
import { BaseBottone, type PropsBase } from './BaseBottone'

export type MisuraBottoneIcona = 'small' | 'medium' | 'big'

const FORMA: Record<MisuraBottoneIcona, string> = {
  small: 'size-10 rounded-pillola',
  medium: 'size-12 rounded-pillola',
  big: 'size-14 rounded-pillola',
}

type Props = Omit<PropsBase, 'etichetta' | 'suggerimento'> & {
  icona: TipoIcona | ReactElement
  etichetta: string
  dimensione?: MisuraBottoneIcona
}

export function BottoneIcona({ icona, dimensione = 'medium', className, ...props }: Props) {
  return (
    <BaseBottone
      {...props}
      className={'inline-block ' + (className ?? '')}
      forma={FORMA[dimensione]}
      bordo="border-2"
      contenuto={() =>
        typeof icona === 'string' ? <Icona tipo={icona} misura={dimensione === 'small' ? 16 : 24} /> : icona
      }
    />
  )
}
