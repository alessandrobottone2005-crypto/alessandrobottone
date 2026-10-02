// base comune di Bottone e BottoneIcona (figma: button_atoms e icon button_atoms).
// stati di figma:
//   default  (riposo)          → fondo bianco, contenuto nero
//   overlay  (mouse o focus)   → fondo nero, contenuto bianco, bagliore bianco sotto
//   active   (premuto)         → come overlay, più un bordo bianco
//   disabled                   → fondo grigio, contenuto bianco, nessuna reazione
// il nero entra a cerchio dal punto in cui arriva il cursore: è un secondo strato con una copia
// del contenuto, ritagliato con clip-path. motion anima il riempimento, css il bagliore e il bordo,
// Magnetico solo lo spostamento dell’involucro.
import { motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { Magnetico } from '@/components/interazioni/Magnetico'
import { media, movimento } from '@/config/movimento'

export type Bersaglio = RefObject<HTMLElement | null>

const ease = [0.16, 1, 0.3, 1] as const

export type PropsBase = {
  /** link esterno (nuova scheda); se manca è un pulsante */
  href?: string
  onClick?: () => void
  disattivato?: boolean
  /** piccolo suggerimento che compare sopra al passaggio del mouse o con il focus */
  suggerimento?: string
  /** avvisa quale bottone ha il mouse (o il focus) sopra, per esempio per far guardare il volto */
  onSopra?: (bersaglio: Bersaglio | null) => void
  /** etichetta per gli screen reader (obbligatoria se il contenuto è solo un’icona) */
  etichetta?: string
  /** classi dell’involucro esterno: servono per la larghezza (es. "w-full md:w-auto") */
  className?: string
  /** spostamento magnetico massimo in pixel */
  magnete?: number
  /** pulsante a due stati (es. audio attivo/muto): diventa aria-pressed */
  premuto?: boolean
}

type Props = PropsBase & {
  /** classi di forma e misura del bottone (altezza, padding, raggio, testo) */
  forma: string
  /** spessore del bordo quando è premuto (1.5px per i bottoni, 2px per gli icon button) */
  bordo: string
  /** disegna il contenuto; `sopra` = copia bianca dentro il riempimento nero; `rotola` = mouse sopra */
  contenuto: (sopra: boolean, rotola: boolean) => ReactNode
}

export function BaseBottone({
  href,
  onClick,
  disattivato = false,
  suggerimento,
  onSopra,
  etichetta,
  className,
  magnete,
  premuto,
  forma,
  bordo,
  contenuto,
}: Props) {
  const ridotto = useReducedMotion()
  const el = useRef<HTMLElement>(null)
  const timerTocco = useRef(0)
  const [attivo, setAttivo] = useState(false)
  const [origine, setOrigine] = useState({ x: 50, y: 50 })
  // su touch non c’è passaggio del mouse: il valore non cambia durante la visita
  const [tocco] = useState(() => !matchMedia(media.mouse).matches)
  const inVista = useInView(el, { once: true, amount: 0.8 })
  const idSuggerimento = useId()
  useEffect(() => () => clearTimeout(timerTocco.current), [])

  // punto d’ingresso (o d’uscita) del cursore, in percentuale del bottone
  const punto = (e: PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    setOrigine({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  const accendi = (si: boolean) => {
    setAttivo(si)
    onSopra?.(si ? el : null)
  }

  const eventi = disattivato
    ? {}
    : {
        onPointerEnter: (e: PointerEvent) => {
          if (e.pointerType !== 'mouse') return
          punto(e)
          accendi(true)
        },
        onPointerLeave: (e: PointerEvent) => {
          if (e.pointerType !== 'mouse') return
          punto(e)
          accendi(false)
        },
        // su touch: il nero entra dal punto toccato ed esce poco dopo
        onPointerDown: (e: PointerEvent) => {
          if (e.pointerType === 'mouse') return
          punto(e)
          accendi(true)
          clearTimeout(timerTocco.current)
          timerTocco.current = window.setTimeout(() => accendi(false), 450)
        },
        onFocus: (e: FocusEvent<HTMLElement>) => {
          if (!e.currentTarget.matches(':focus-visible')) return
          setOrigine({ x: 50, y: 50 })
          accendi(true)
        },
        onBlur: () => accendi(false),
      }

  // su touch il testo rotola una volta quando il bottone entra in vista
  const rotola = !disattivato && (attivo || (tocco && inVista))
  const riempimento = ridotto
    ? { opacity: attivo ? 1 : 0 }
    : { clipPath: `circle(${attivo ? 150 : 0}% at ${origine.x}% ${origine.y}%)` }

  const classi =
    'relative isolate flex items-center justify-center overflow-hidden ' +
    forma +
    (disattivato ? ' cursor-default bg-grigio text-bianco' : ' bg-bianco text-nero')

  const interno = (
    <>
      {contenuto(false, rotola)}
      {!disattivato && (
        <>
          <motion.span
            aria-hidden="true"
            className={'pointer-events-none absolute inset-0 flex items-center justify-center bg-nero text-bianco ' + forma}
            initial={false}
            animate={riempimento}
            transition={{ duration: ridotto ? movimento.durata.ridotta : 0.55, ease }}
          >
            {contenuto(true, rotola)}
          </motion.span>
          {/* bordo dello stato “premuto” */}
          <span
            aria-hidden="true"
            className={
              'pointer-events-none absolute inset-0 rounded-[inherit] border-bianco opacity-0 transition-opacity duration-200 group-active/bottone:opacity-100 ' +
              bordo
            }
          />
        </>
      )}
    </>
  )

  return (
    <Magnetico className={'group/bottone relative ' + (className ?? '')} massimo={disattivato ? 0 : magnete}>
      {/* bagliore: fuori dal bottone (che ritaglia il contenuto), si accende con il mouse sopra o premendo */}
      {!disattivato && (
        <span
          aria-hidden="true"
          className={
            'pointer-events-none absolute inset-0 rounded-pillola shadow-bagliore transition-opacity duration-300 ease-entrata group-active/bottone:opacity-100 ' +
            (attivo ? 'opacity-100' : 'opacity-0')
          }
        />
      )}

      {href && !disattivato ? (
        <a
          ref={el as RefObject<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={etichetta}
          className={classi}
          {...eventi}
        >
          {interno}
        </a>
      ) : (
        <button
          ref={el as RefObject<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          disabled={disattivato}
          aria-label={etichetta}
          aria-pressed={premuto}
          aria-describedby={suggerimento ? idSuggerimento : undefined}
          className={classi}
          {...eventi}
        >
          {interno}
        </button>
      )}

      {suggerimento && (
        <motion.span
          id={idSuggerimento}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-pillola bg-bianco px-3 py-1.5 text-etichetta whitespace-nowrap text-nero"
          initial={false}
          animate={{ opacity: attivo && !tocco ? 1 : 0, y: attivo && !tocco ? 0 : 6 }}
          transition={{ duration: movimento.durata.micro, ease }}
        >
          {suggerimento}
        </motion.span>
      )}
    </Magnetico>
  )
}
