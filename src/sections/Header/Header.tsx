// Dal segno al volume: il Canvas globale prende il posto dell’SVG nella terza fase.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAvvio } from '@/components/preloader/AvvioContext'
import { NomeMetallo } from '@/components/nome/NomeMetallo'
import { NomePesoVariabile } from '@/components/testo/NomePesoVariabile'
import { TestoCheRotola } from '@/components/testo/TestoCheRotola'
import { Volto } from '@/components/volto/Volto'
import { larghezzaLogoCentro, percorso } from '@/components/volto/percorso'
import { disciplineVisibili, webDesignAttivo } from '@/config/discipline'
import { media, movimento, volto as misure } from '@/config/movimento'
import { sito } from '@/config/sito'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { tornaA } from '@/lib/scroll'
import { FINESTRA, ID_MATITA } from './misure'
import { Tavola } from './Tavola'

// etichette delle fasi (web design solo se attivo in config/discipline.ts) e il loro inizio nella timeline 0–100
const FASI = disciplineVisibili.map((d) => (d === 'web design' ? 'web' : d))
const INIZI = FASI.map((_, i) => i * 25)
// senza la fase web la timeline salta i suoi 17 punti (75→92): il finale arriva subito dopo il 3d, stesso ritmo
const SALTO = webDesignAttivo ? 0 : movimento.header.inizioNomeCompatto - 75
const FINE = 100 - SALTO
const INIZIO_FINALE = movimento.header.inizioNomeCompatto - SALTO

export function Header() {
  const { pronto, entrato, voltoHeader } = useAvvio()
  const palco = useRef<HTMLDivElement>(null)
  const nome = useRef<HTMLDivElement>(null)
  const ritornoInizio = useRef<HTMLAnchorElement>(null)
  const [fase, setFase] = useState(-1)
  const faseRef = useRef(-1)
  const [ridotto, setRidotto] = useState(() => matchMedia(media.ridotto).matches)
  const [guardaGiu, setGuardaGiu] = useState(false)
  useEffect(() => {
    const mq = matchMedia(media.ridotto),
      cambia = () => setRidotto(mq.matches)
    mq.addEventListener('change', cambia)
    return () => mq.removeEventListener('change', cambia)
  }, [])
  useEffect(() => {
    if (!pronto || ridotto) return
    let ritorno = 0
    const id = setInterval(() => {
      if (scrollY > 10) return
      setGuardaGiu(true)
      ritorno = window.setTimeout(() => setGuardaGiu(false), 1400)
    }, 5200)
    return () => {
      clearInterval(id)
      clearTimeout(ritorno)
    }
  }, [pronto, ridotto])
  useGSAP(
    () => {
      const q = gsap.utils.selector(palco)
      const lettere = nome.current!.querySelectorAll('[data-lettera]')
      if (ridotto) {
        gsap.set(lettere, { yPercent: 0, y: 0 })
        gsap.set(q('[data-volto-svg]'), { opacity: 1 })
        return
      }
      if (!pronto) {
        gsap.set(lettere, { yPercent: 140, y: 0 })
        gsap.set(q('[data-volto-svg]'), { opacity: 0 })
        return
      }
      gsap.set(q('[data-volto-svg]'), { opacity: 1 })
      gsap.to(lettere, {
        yPercent: 0,
        y: 0,
        duration: movimento.durata.grande,
        ease: movimento.ease.entrata,
        stagger: 0.035,
      })
    },
    { dependencies: [pronto, ridotto], scope: palco },
  )

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ mobile: media.mobile, desktop: media.daTablet, ridotto: media.ridotto }, (ctx) => {
        const { mobile, ridotto: conRidotto } = ctx.conditions as Record<string, boolean>
        const parole = [...nome.current!.querySelectorAll<HTMLElement>('[data-parola-nome]')]
        const fontPiccolo = mobile ? 18 : 20
        const metaNome = {
          // La quota percentuale compensa anche la larghezza variabile delle lettere al passaggio del mouse.
          x: (i: number) => mobile ? nome.current!.clientWidth / 2 - 16 : i === 0 ? nome.current!.clientWidth - 64 : 0,
          xPercent: (i: number) => mobile ? -50 : i === 0 ? -100 : 0,
          y: (i: number, el: HTMLElement) => ((mobile ? 24 : 32) + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0)) + i * fontPiccolo * 1.05 - el.offsetTop,
          scale: () => fontPiccolo / parseFloat(getComputedStyle(nome.current!).fontSize),
        }
        gsap.set(parole, { transformOrigin: 'right top' })
        gsap.set(ritornoInizio.current, { autoAlpha: 0 })
        if (conRidotto) {
          // Senza movimento il nome scorre con l’header; alla sua uscita diventa subito piccolo.
          const aggiorna = (compatto: boolean) => {
            gsap.set(nome.current, { position: compatto ? 'fixed' : 'absolute' })
            gsap.set(parole, compatto ? metaNome : { x: 0, xPercent: 0, y: 0, scale: 1 })
            gsap.set(ritornoInizio.current, { autoAlpha: compatto ? 1 : 0 })
          }
          ScrollTrigger.create({
            trigger: palco.current,
            start: 'bottom top',
            onUpdate: (st) => aggiorna(st.scroll() >= st.start),
            onRefresh: (st) => aggiorna(st.scroll() >= st.start),
          })
          return
        }
        gsap.set(nome.current, { position: 'fixed' })
        const q = gsap.utils.selector(palco),
          spostamento = q('[data-spostamento]')[0],
          rumore = q('[data-rumore]')[0]
        // La preferenza può cambiare prima del nuovo render React.
        if (!spostamento || !rumore) return
        const c = percorso.header
        gsap.set(c, { opacity: 0, rotazione: 0, scala: 1, inclinazione: 0 })
        gsap.set(
          q(
            '[data-schizzi] [data-disegna], [data-griglia] [data-disegna], [data-finestra] [data-disegna], [data-cornice]',
          ),
          { drawSVG: '0%' },
        )
        gsap.set(q('[data-campione]'), { scale: 0, transformOrigin: '50% 50%' })
        let seme = 3
        const tremolio = setInterval(() => {
          if (Number(spostamento.getAttribute('scale')) > 0.3)
            rumore.setAttribute('seed', String((seme = (seme % 9) + 1)))
        }, 120)
        const aggiornaFiltro = () => {
          const attivo = Number(spostamento.getAttribute('scale')) > 0.05
          q('[data-volto-svg] svg > g, [data-schizzi]').forEach((el) =>
            attivo ? el.setAttribute('filter', `url(#${ID_MATITA})`) : el.removeAttribute('filter'),
          )
        }
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'header-racconto',
            refreshPriority: 30,
            trigger: palco.current,
            pin: true,
            start: 'top top',
            // pin proporzionale alla timeline: ogni fase dura lo stesso scroll anche senza la fase web
            end: `+=${((mobile ? movimento.header.pinMobile : movimento.header.pinDesktop) * FINE) / 100}%`,
            scrub: mobile ? movimento.scrub.mobile : movimento.scrub.desktop,
            invalidateOnRefresh: true,
            onUpdate: (st) => {
              const t = st.progress * FINE
              const prossima = t < 1.2 ? -1 : INIZI.findLastIndex((inizio) => t >= inizio)
              if (faseRef.current !== prossima) { faseRef.current = prossima; setFase(prossima) }
            },
          },
        })
        FASI.forEach((f, i) => tl.addLabel(f, INIZI[i]))
        tl.fromTo(q('[data-interfaccia]'), { opacity: 0 }, { opacity: 1, duration: 2, immediateRender: false }, 0.5)
        tl.to(spostamento, { attr: { scale: 6 }, duration: 12, onUpdate: aggiornaFiltro }, 3)
        tl.to(q('[data-schizzi] [data-disegna]'), { drawSVG: '100%', duration: 6, stagger: 0.8 }, 4)
        tl.to(spostamento, { attr: { scale: 0 }, duration: 6, onUpdate: aggiornaFiltro }, 25)
        tl.to(q('[data-schizzi]'), { opacity: 0, duration: 6 }, 26)
        tl.to(q('[data-volto-box]'), { scale: 0.78, duration: 8, ease: 'power1.inOut' }, 25)
        tl.to(q('[data-griglia] [data-disegna]'), { drawSVG: '100%', duration: 6, stagger: 0.5 }, 28)
        tl.to(q('[data-rispetto]'), { opacity: 1, duration: 4 }, 36)
        tl.to(q('[data-campione]'), { scale: 1, duration: 3, stagger: 1, ease: 'back.out(2)' }, 39)
        tl.to([q('[data-griglia]'), q('[data-campioni]')], { opacity: 0, duration: 4 }, 50)
        tl.to(q('[data-volto-box]'), { scale: 1, duration: 6, ease: 'power1.inOut' }, 50)
        tl.to(c, { opacity: 1, duration: 4 }, 56)
        tl.to(q('[data-volto-svg]'), { opacity: 0, duration: 4 }, 56)
        tl.to(c, { inclinazione: 1, duration: 4 }, 58)
        tl.to(c, { rotazione: -35, duration: 12, ease: 'power1.inOut' }, 60)
        if (webDesignAttivo) {
          // 04 web design: il volto arretra dentro una finestra del browser disegnata, il puntatore clicca il pulsante
          tl.to(c, { rotazione: -12, scala: 0.52, duration: 8, ease: 'power1.inOut' }, 75)
          tl.to(q('[data-tavola]'), { scale: 0.52, duration: 8, ease: 'power1.inOut' }, 75)
          tl.to(q('[data-cornice]'), { drawSVG: '100%', duration: 5 }, 78)
          tl.to(
            q('[data-finestra] [data-contenuto-finestra] [data-disegna]'),
            { drawSVG: '100%', duration: 3, stagger: 0.4 },
            80,
          )
          const pulsante = { x: FINESTRA.x + FINESTRA.w - 52, y: FINESTRA.y + FINESTRA.h - 27 }
          tl.fromTo(
            q('[data-puntatore]'),
            { opacity: 0, x: pulsante.x - 70, y: pulsante.y - 50 },
            { opacity: 1, x: pulsante.x, y: pulsante.y, duration: 4, ease: 'power2.out', immediateRender: false },
            84,
          )
          tl.to(q('[data-puntatore]'), { scale: 0.8, duration: 0.6, yoyo: true, repeat: 1, transformOrigin: '0 0' }, 88.5)
          tl.to(q('[data-pulsante]'), { fillOpacity: 1, duration: 0.6, yoyo: true, repeat: 1 }, 88.5)
        } else {
          // senza la fase web il volto torna frontale insieme al finale
          tl.to(c, { rotazione: -12, duration: 8, ease: 'power1.inOut' }, INIZIO_FINALE)
        }
        tl.to(q('[data-tavola]'), { opacity: 0, duration: 5 }, INIZIO_FINALE)
        tl.to(
          c,
          {
            scala: () => larghezzaLogoCentro() / (voltoHeader.current?.getBoundingClientRect().width || innerWidth),
            duration: 8,
            ease: 'power2.inOut',
          },
          INIZIO_FINALE,
        )
        // Le stesse parole si raccolgono nell’angolo; il portal resta fuori dai contenitori con pin.
        tl.to(
          parole,
          { ...metaNome, duration: 100 - movimento.header.inizioNomeCompatto, ease: 'power2.inOut' },
          INIZIO_FINALE,
        )
        tl.set(ritornoInizio.current, { autoAlpha: 1 }, FINE)
        tl.to(q('[data-interfaccia]'), { opacity: 0, duration: 2 }, FINE - 2)
        return () => clearInterval(tremolio)
      })
      return () => mm.revert()
    },
    { scope: palco, dependencies: [ridotto], revertOnUpdate: true },
  )

  return (
    <section id="header" tabIndex={-1} aria-label={sito.sezioni.header} className="relative z-20 outline-none">
      <h1 className="sr-only">{sito.nome} {sito.cognome}</h1>
      {createPortal(
        <>
          <div
            ref={nome}
            data-nome
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-40 flex h-svh flex-col justify-between px-4 pt-[calc(var(--safe-top)+24px)] pb-8 text-[clamp(2.5rem,min(10vw,14svh),9rem)] leading-[.85] tracking-[-.04em] md:px-8 md:pt-[calc(var(--safe-top)+96px)]"
          >
            <span data-parola-nome className="self-center md:self-start">
              <NomePesoVariabile testo={sito.nome} className="block" pesoMin={900} pesoMax={900} />
            </span>
            <span data-parola-nome className="self-center md:self-end">
              <NomePesoVariabile testo={sito.cognome} className="block" pesoMin={900} pesoMax={900} />
            </span>
          </div>
          {!ridotto && <NomeMetallo radice={nome} />}
          {pronto && entrato && (
            <nav aria-label={sito.etichette.navigazione} className="navigazione-sezioni">
              {([['portfolio', sito.sezioni.portfolio], ['chi-sono', sito.sezioni.chiSono], ['contatti', sito.sezioni.contatti]] as const).map(([id, testo]) => (
                <a key={id} href={`#${id}`} onClick={(e) => {
                  e.preventDefault()
                  tornaA(id, true)
                }}>{testo}</a>
              ))}
            </nav>
          )}
          <div className="ritorno-inizio pointer-events-none fixed z-40">
            <a
              ref={ritornoInizio}
              href="#header"
              aria-label={sito.etichette.tornaInizio}
              className="pointer-events-auto invisible block h-12 w-28 rounded-sm opacity-0 transition-shadow hover:shadow-[0_1px_0_var(--color-bianco)] focus-visible:shadow-[0_1px_0_var(--color-bianco)] active:opacity-70"
              onClick={(e) => {
                e.preventDefault()
                tornaA('header', true)
              }}
            />
          </div>
        </>,
        document.body,
      )}
      <div ref={palco} className="relative h-svh overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div data-volto-box className="relative">
            <div data-logo-header ref={voltoHeader}>
              <div data-volto-svg>
                <Volto
                  dimensione={misure.header}
                  etichetta={sito.etichette.logo}
                  guarda={guardaGiu ? { x: innerWidth / 2, y: innerHeight * 1.2 } : undefined}
                />
              </div>
              {!ridotto && (
                <div data-tavola className="pointer-events-none absolute inset-0 z-20">
                  <Tavola className="h-full w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div
          data-interfaccia
          aria-hidden={fase < 0}
          className="pointer-events-none absolute left-4 bottom-[18svh] z-30 text-[clamp(1.5rem,4vw,4rem)] leading-none font-semibold tracking-[-.03em] opacity-0 md:left-8 md:bottom-[21svh]"
        >
          <TestoCheRotola testo={fase >= 0 ? FASI[fase] : ''} />
        </div>
      </div>
    </section>
  )
}
