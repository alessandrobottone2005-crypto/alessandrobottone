// pulsante dell’audio (docs/audio.md): BottoneIcona di figma fisso in basso a destra, dopo l’ingresso.
// aria-pressed = audio attivo; la scelta resta tra le visite (motore.ts, localStorage).
import { motion, useReducedMotion } from 'motion/react'
import { Volume2, VolumeX } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { BottoneIcona } from '@/components/bottoni/BottoneIcona'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { movimento } from '@/config/movimento'
import { audio as testi } from '@/config/sito'
import { audio } from '@/lib/audio/motore'

const leggiMuto = () => audio.muto

export function PulsanteAudio() {
  const { pronto, entrato } = useAvvio()
  const ridotto = useReducedMotion()
  const muto = useSyncExternalStore(audio.ascolta, leggiMuto)
  if (!pronto || !entrato) return null

  return (
    <motion.div
      // margini di almeno 16px, anche dentro la safe area di iOS
      className="fixed right-[max(1rem,calc(env(safe-area-inset-right)+0.5rem))] bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-40 md:right-8 md:bottom-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ridotto ? movimento.durata.ridotta : 0.8, delay: ridotto ? 0 : 0.4 }}
    >
      <BottoneIcona
        icona={muto ? <VolumeX aria-hidden="true" size={22} strokeWidth={1.75} /> : <Volume2 aria-hidden="true" size={22} strokeWidth={1.75} />}
        etichetta={muto ? testi.attiva : testi.disattiva}
        premuto={!muto}
        dimensione="medium"
        magnete={6}
        onClick={() => {
          // con un link diretto il primo clic può essere proprio questo: il motore nasce qui
          void audio.avvia()
          audio.impostaMuto(!muto)
        }}
      />
    </motion.div>
  )
}
