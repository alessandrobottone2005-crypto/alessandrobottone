// Il testo resta identico. Il volto globale arriva nella colonna, si rompe nell’avatar olografico
// (Ologramma.tsx) e, all’uscita, si ricompone per raggiungere i contatti.
import { useEffect, useRef, useState } from 'react'
import { percorso } from '@/components/volto/percorso'
import { media, movimento } from '@/config/movimento'
import { sito } from '@/config/sito'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'

export function ChiSono() {
  const palco = useRef<HTMLDivElement>(null)
  const [dimensioni, setDimensioni] = useState(() => [innerWidth, innerHeight])
  useEffect(() => {
    let timer = 0
    const ridimensiona = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        setDimensioni((vecchie) => {
          // Le barre del browser mobile non devono ricreare il pin a ogni piccolo cambio di altezza.
          if (innerWidth < 768 && vecchie[0] === innerWidth && Math.abs(vecchie[1] - innerHeight) < vecchie[1] * 0.2)
            return vecchie
          return [innerWidth, innerHeight]
        })
      }, 200)
    }
    addEventListener('resize', ridimensiona, { passive: true })
    return () => {
      clearTimeout(timer)
      removeEventListener('resize', ridimensiona)
    }
  }, [])
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [dimensioni])
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ normale: media.normale, ridotto: media.ridotto }, (ctx) => {
        if (ctx.conditions?.ridotto) return
        const q = gsap.utils.selector(palco),
          testo = q<HTMLElement>('[data-testo]')[0]
        let uscita: gsap.core.Tween | undefined
        const split = SplitText.create(q('[data-paragrafo]'), {
          type: 'words',
          aria: 'none',
          autoSplit: true,
          onSplit: (self) => {
            uscita?.scrollTrigger?.kill()
            uscita?.kill()
            // Su schermi troppo bassi il testo resta in flusso normale, senza parole fuori dal pin
            // (su telefono conta anche l’avatar sopra il testo: si misura tutta la griglia).
            const contenuto = testo.parentElement ?? testo
            const pin = contenuto.getBoundingClientRect().height < innerHeight * 0.86 && innerHeight > 500
            gsap.set(percorso.biografia, { uscita: 0, ologramma: 0 })
            const scambio = movimento.chiSono.scambio
            const tl = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                id: 'biografia-racconto',
                refreshPriority: 10,
                trigger: pin ? palco.current : testo,
                pin: pin ? palco.current : false,
                start: pin ? 'top top' : 'top 85%',
                end: pin ? `+=${movimento.chiSono.pin + movimento.chiSono.versoContatti}%` : 'bottom 35%',
                scrub: innerWidth < 768 ? movimento.scrub.mobile : movimento.scrub.desktop,
                invalidateOnRefresh: true,
              },
            })
            tl.fromTo(
              self.words,
              { opacity: 0.315 },
              { opacity: 1, duration: 1.5, stagger: { amount: movimento.chiSono.pin - 1.5 } },
              0,
            )
            if (pin) {
              // il logo arriva già in colonna all’inizio del pin: qui diventa ologramma e, prima del volo, torna logo
              tl.to(percorso.biografia, { ologramma: 1, duration: scambio }, 1)
              tl.to(percorso.biografia, { ologramma: 0, duration: scambio }, movimento.chiSono.pin - scambio)
              tl.to(
                percorso.biografia,
                { uscita: 1, duration: movimento.chiSono.versoContatti, ease: 'power2.inOut' },
                movimento.chiSono.pin,
              )
              tl.to(
                testo,
                { opacity: 0, y: -32, duration: movimento.chiSono.versoContatti * 0.55 },
                movimento.chiSono.pin + movimento.chiSono.versoContatti * 0.1,
              )
            } else {
              // senza pin: ologramma mentre il testo scorre, logo di nuovo prima dell’uscita
              tl.to(percorso.biografia, { ologramma: 1, duration: scambio }, 0)
              tl.to(percorso.biografia, { ologramma: 0, duration: scambio }, movimento.chiSono.pin - scambio)
              uscita = gsap.to(percorso.biografia, {
                uscita: 1,
                ease: 'none',
                scrollTrigger: {
                  id: 'biografia-uscita',
                  trigger: palco.current,
                  start: 'bottom 25%',
                  end: 'bottom top',
                  scrub: movimento.scrub.mobile,
                },
              })
            }
            return tl
          },
        })
        return () => {
          uscita?.scrollTrigger?.kill()
          uscita?.kill()
          split.revert()
        }
      })
      return () => mm.revert()
    },
    { scope: palco, dependencies: dimensioni, revertOnUpdate: true },
  )

  return (
    <section tabIndex={-1} id="chi-sono" aria-labelledby="titolo-chi-sono" className="relative z-20">
      <h2 id="titolo-chi-sono" className="sr-only">
        {sito.sezioni.chiSono}
      </h2>
      <div ref={palco} className="flex min-h-svh items-center px-4 pt-[var(--nav-bottom)] pb-12 md:px-8 md:py-24 lg:px-12">
        {/* telefono: avatar centrato sopra il testo; da 768px avatar a sinistra e testo a destra */}
        <div className="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-8">
          <div
            data-logo-biografia
            className="aspect-[4/5] w-[min(52vw,30svh)] justify-self-center md:col-span-5 md:w-full md:max-w-[48svh] md:justify-self-start"
          >
            {/* movimento ridotto o 3d non disponibile: l’avatar fermo, in palette, con le righe di scansione */}
            <div className="relative hidden size-full motion-reduce:block in-data-volto-riserva:block">
              <div
                className="size-full bg-bianco"
                style={{
                  maskImage: 'url(/avatar/fermo.webp)',
                  maskMode: 'luminance',
                  maskSize: '100% 100%',
                }}
              />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_2px,var(--color-nero)_2px_3px)] opacity-60" />
            </div>
          </div>
          <div
            data-testo
            className="relative z-20 flex flex-col gap-[1.1em] text-[clamp(1rem,1.95svh,1.125rem)] leading-[1.3] font-light md:col-span-7 md:col-start-6 md:text-[length:clamp(1.125rem,min(2.6vw,3.5svh),2.5rem)] lg:col-span-6 lg:col-start-7"
          >
            {sito.chiSono.map((paragrafo, i) => (
              <p key={i}>
                <span className="sr-only">{paragrafo}</span>
                <span data-paragrafo aria-hidden="true">
                  {paragrafo}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
