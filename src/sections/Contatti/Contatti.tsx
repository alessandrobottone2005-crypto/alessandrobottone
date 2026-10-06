// Contatti: il volto 3d continuo e tre pulsanti. La pagina finisce qui.
// GSAP anima soltanto l’ingresso dei pulsanti.
// i pulsanti sono il Bottone di figma (misura big, solo testo): stati e micro-interazioni sono dentro il componente.
import { useEffect, useRef, useState } from 'react'
import { Bottone } from '@/components/bottoni/Bottone'
import type { Bersaglio } from '@/components/bottoni/BaseBottone'
import { Volto } from '@/components/volto/Volto'
import { percorso } from '@/components/volto/percorso'
import { useVolto } from '@/components/volto/VoltoContext'
import { media, movimento } from '@/config/movimento'
import { sito } from '@/config/sito'
import { copiaNegliAppunti } from '@/lib/appunti'
import { gsap, useGSAP } from '@/lib/gsap'

// a tutta larghezza su mobile; su desktop stessa larghezza minima, così "email" → "copiata" non sposta la riga
const larghezza = 'block w-full md:w-auto md:min-w-44'

export function Contatti() {
  const sezione = useRef<HTMLElement>(null)
  const { azione } = useVolto()
  const [guardato, setGuardato] = useState<Bersaglio | null>(null)
  const [copiata, setCopiata] = useState(false)
  const [annuncio, setAnnuncio] = useState('')
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  // Il volto è già presente: entrano soltanto i pulsanti al passaggio dalla biografia.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ ridotto: media.ridotto, normale: media.normale }, (ctx) => {
        const ridotto = ctx.conditions?.ridotto
        gsap.fromTo(
          '[data-entrata]',
          { opacity: 0, y: ridotto ? 0 : 24 },
          {
            opacity: 1,
            y: 0,
            duration: ridotto ? movimento.durata.ridotta : movimento.durata.standard,
            stagger: ridotto ? 0 : 0.08,
            ease: movimento.ease.entrata,
            scrollTrigger: { id: 'contatti-ingresso', trigger: sezione.current, start: 'top 65%', toggleActions: 'play none none reverse' },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: sezione },
  )

  useEffect(() => {
    if (!guardato) {
      percorso.guarda = null
      return
    }
    const r = guardato.current?.getBoundingClientRect()
    if (r) percorso.guarda = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    return () => {
      percorso.guarda = null
    }
  }, [guardato])

  const copia = async () => {
    const riuscito = await copiaNegliAppunti(sito.email)
    // ultima riserva: se non si può copiare, si apre il programma di posta
    if (!riuscito) {
      location.href = `mailto:${sito.email}`
      return
    }
    setCopiata(true)
    setAnnuncio(sito.etichette.emailCopiata)
    azione('occhiolino')
    azione('sorriso')
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setCopiata(false)
      setAnnuncio('')
    }, 2000)
  }

  return (
    <section
      id="contatti"
      tabIndex={-1}
      ref={sezione}
      aria-labelledby="titolo-contatti"
      className="relative flex min-h-svh flex-col items-center justify-center gap-[max(3rem,9svh)] px-4 pt-24 pb-[max(3rem,env(safe-area-inset-bottom))] md:px-8"
    >
      {/* fascia scura in basso: pulsanti e copyright leggibili sopra il fascio di luce della sala */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[45svh] bg-linear-to-t from-nero/85 via-nero/45 to-transparent" />
      <h2 id="titolo-contatti" className="sr-only">
        {sito.sezioni.contatti}
      </h2>

      <div data-logo-contatti className="aspect-[247.41/180] w-[min(82vw,76svh)] text-bianco">
        <div className="hidden motion-reduce:block">
          <Volto guarda={guardato ?? undefined} dimensione="100%" />
        </div>
      </div>

      <div className="relative z-20 flex w-full flex-col items-center gap-6">
        <ul className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:gap-4">
          <li data-entrata className="w-full md:w-auto">
            <Bottone
              href={sito.link.instagram}
              testo={sito.contatti.instagram}
              onSopra={setGuardato}
              className={larghezza}
            />
          </li>
          <li data-entrata className="w-full md:w-auto">
            <Bottone href={sito.link.behance} testo={sito.contatti.behance} onSopra={setGuardato} className={larghezza} />
          </li>
          <li data-entrata className="w-full md:w-auto">
            <Bottone
              testo={copiata ? sito.etichette.copiata : sito.contatti.email}
              suggerimento={sito.email}
              onClick={copia}
              onSopra={setGuardato}
              className={larghezza}
            />
          </li>
        </ul>
        <p data-entrata className="text-center text-sm leading-relaxed text-bianco">
          {sito.contatti.copyright(new Date().getFullYear())}
        </p>
      </div>

      {/* annuncio per gli screen reader quando l’email è copiata */}
      <p role="status" aria-live="polite" className="sr-only">
        {annuncio}
      </p>
    </section>
  )
}
