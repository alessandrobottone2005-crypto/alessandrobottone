// davanti al computer acceso (docs/audio.md): la musica si abbassa e si sente la ventola; fuori dalla sosta, o a
// computer spento, la musica torna al sottofondo e la ventola si ferma. Legge soltanto lo stato del computer e la posa:
// un controllo sul ticker di GSAP, come l’accensione in Portfolio.tsx (i refresh di ScrollTrigger non chiamano onUpdate).
import { useEffect } from 'react'
import { leggiFase } from '@/components/computer/stato'
import { percorso } from '@/components/volto/percorso'
import { audio as A, media } from '@/config/movimento'
import { audio, type SuonoAttivo } from '@/lib/audio/motore'
import { gsap } from '@/lib/gsap'

export function AudioComputer() {
  useEffect(() => {
    const mq = matchMedia(media.ridotto)
    let dentro = false
    let ventola: SuonoAttivo | null = null
    let conta = 0
    let portfolioInVista = false

    const imposta = (si: boolean) => {
      if (si === dentro) return
      dentro = si
      audio.abbassaMusica(si)
      if (si) ventola = audio.suona('ventola', { ciclo: true, volume: A.volume.ventola })
      else {
        ventola?.ferma()
        ventola = null
      }
    }

    const controlla = () => {
      if (!audio.avviato) return
      let davanti: boolean
      if (mq.matches) {
        // movimento ridotto: computer fermo, basta che la sezione occupi il centro dello schermo (letto ogni 10 tick)
        if (conta++ % 10 === 0) {
          const r = document.getElementById('portfolio')?.getBoundingClientRect()
          portfolioInVista = Boolean(r && r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2)
        }
        davanti = portfolioInVista
      } else davanti = percorso.computer.vicino >= 0.999 && percorso.stazione < 1.001
      imposta(davanti && leggiFase() === 'acceso')
    }
    gsap.ticker.add(controlla)
    return () => {
      gsap.ticker.remove(controlla)
      imposta(false)
    }
  }, [])
  return null
}
