// pulsante dell’audio: Bottone di testo nella navbar (sopra, non più in basso a destra).
// aria-pressed = audio attivo; la scelta resta tra le visite (motore.ts, localStorage).
import { useSyncExternalStore } from 'react'
import { Bottone } from '@/components/bottoni/Bottone'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { audio as testi } from '@/config/sito'
import { audio } from '@/lib/audio/motore'

const leggiAttivo = () => audio.avviato && !audio.muto

type Props = {
  className?: string
}

export function PulsanteAudio({ className }: Props) {
  const { pronto, entrato } = useAvvio()
  const attivo = useSyncExternalStore(audio.ascolta, leggiAttivo)
  if (!pronto || !entrato) return null

  return (
    <Bottone
      testo={attivo ? testi.on : testi.off}
      etichetta={attivo ? testi.disattiva : testi.attiva}
      premuto={attivo}
      dimensione="small"
      className={className}
      onClick={() => {
        // con un link diretto il primo clic può essere proprio questo: il motore nasce qui
        void audio.avvia()
        audio.impostaMuto(attivo)
      }}
    />
  )
}
