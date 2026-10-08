// blocco modello 3d (claude.md §6.5): un <Canvas> dedicato, montato solo quando il blocco arriva in vista
// e in pausa quando esce. si ruota trascinando (con inerzia), gira da solo finché non lo si tocca,
// zoom limitato, niente spostamento laterale. luci con lightformer, nessuna hdri scaricata da internet.
// da drei solo i due pezzi che servono (importarlo intero porterebbe con sé decine di componenti inutili)
import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas } from '@react-three/fiber'
import { RotateCcw } from 'lucide-react'
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import * as THREE from 'three'
import { Magnetico } from '@/components/interazioni/Magnetico'
import { Luci, useModello } from '@/components/volto/tre'
import { media } from '@/config/movimento'
import { sito } from '@/config/sito'

type Props = { file: string; titolo: string }

let supportaWebGL: boolean | undefined
function haWebGL() {
  if (supportaWebGL !== undefined) return supportaWebGL
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    supportaWebGL = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { supportaWebGL = false }
  return supportaWebGL
}

export default function Modello3D(props: Props) {
  const [disponibile] = useState(haWebGL)
  return disponibile ? <ModelloInterattivo {...props} /> : <div className="archivio-errore" data-modello-fallback role="status">
    <p>{sito.archivio.modelloNonDisponibile}</p>
    <a href={props.file} target="_blank" rel="noreferrer">{sito.archivio.modelloOriginale}</a>
  </div>
}

function ModelloInterattivo({ file, titolo }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const controlli = useRef<ComponentRef<typeof OrbitControls>>(null)
  const [montato, setMontato] = useState(false)
  const [visibile, setVisibile] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [giraDaSolo, setGiraDaSolo] = useState(true)
  const [progresso, setProgresso] = useState(0)
  const ridotto = useMemo(() => matchMedia(media.ridotto).matches, [])
  const mobile = useMemo(() => matchMedia(media.mobile).matches, [])

  // il canvas nasce solo quando il blocco si avvicina allo schermo; fuori vista si ferma
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setVisibile(e.isIntersecting)
        if (e.isIntersecting) setMontato(true)
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(box.current!)
    return () => io.disconnect()
  }, [])

  const ripristina = () => {
    controlli.current?.reset()
    setGiraDaSolo(true)
  }

  return (
    <figure
      ref={box}
      aria-label={sito.blocchi.modello(titolo)}
      data-cursore="ruota"
      data-no-trascina
      className="relative aspect-4/5 overflow-hidden rounded-card border border-grigio bg-nero md:aspect-video"
    >
      {montato && (
        <Canvas
          frameloop={visibile ? 'always' : 'never'}
          dpr={[1, mobile ? 1.5 : 2]}
          camera={{ fov: 35, position: [0, 0.4, 4.2], near: 0.1, far: 50 }}
          gl={{ antialias: true, alpha: true }}
          aria-hidden="true"
        >
          <Luci risoluzione={mobile ? 64 : 128} />
          <ambientLight intensity={0.15} />
          <Suspense fallback={null}>
            <Modello file={file} alProgresso={setProgresso} alCaricamento={() => setPronto(true)} />
          </Suspense>
          <OrbitControls
            ref={controlli}
            makeDefault
            enablePan={false}
            enableDamping={!ridotto}
            dampingFactor={0.08}
            rotateSpeed={0.7}
            minDistance={2.6}
            maxDistance={7}
            autoRotate={giraDaSolo && !ridotto}
            autoRotateSpeed={1.2}
            onStart={() => setGiraDaSolo(false)}
          />
        </Canvas>
      )}

      {/* barra di caricamento: sottile linea che si riempie */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-1/2 h-px overflow-hidden bg-grigio transition-opacity duration-300"
        style={{ opacity: pronto ? 0 : 1 }}
      >
        <div
          className="absolute inset-0 origin-left bg-bianco transition-transform duration-300 ease-entrata"
          style={{ transform: `scaleX(${montato ? (pronto ? 1 : progresso) : 0})` }}
        />
      </div>

      {/* tre stati: a riposo, al passaggio (attratto dal cursore, freccia che gira), premuto */}
      <Magnetico massimo={6} className="absolute right-3 bottom-3 md:right-4 md:bottom-4">
        <button
          type="button"
          onClick={ripristina}
          aria-label={sito.blocchi.ripristinaVista}
          className="group flex size-12 items-center justify-center rounded-pillola border border-grigio bg-nero/70 text-bianco transition-[transform,opacity] duration-300 ease-entrata hover:scale-105 focus-visible:scale-105 active:scale-95"
          style={{ opacity: giraDaSolo ? 0.5 : 1 }}
        >
          <RotateCcw size={18} strokeWidth={1.5} aria-hidden="true" className="transition-transform duration-500 ease-entrata group-hover:-rotate-90 group-focus-visible:-rotate-90" />
        </button>
      </Magnetico>
    </figure>
  )
}

/** il modello, centrato e scalato perché stia sempre nell’inquadratura, con un’ombra leggera sotto */
function Modello({ file, alProgresso, alCaricamento }: { file: string; alProgresso: (p: number) => void; alCaricamento: () => void }) {
  const { scene } = useModello(file, alProgresso)

  const { oggetto, base } = useMemo(() => {
    const copia = scene.clone(true)
    const scatola = new THREE.Box3().setFromObject(copia)
    const misura = scatola.getSize(new THREE.Vector3())
    copia.scale.multiplyScalar(2 / Math.max(misura.x, misura.y, misura.z, 1e-6))
    copia.updateMatrixWorld(true)
    scatola.setFromObject(copia)
    const centro = scatola.getCenter(new THREE.Vector3())
    copia.position.sub(centro)
    return { oggetto: copia, base: scatola.min.y - centro.y }
  }, [scene])

  useEffect(alCaricamento, [alCaricamento])

  return (
    <>
      <primitive object={oggetto} />
      <ContactShadows position={[0, base - 0.02, 0]} opacity={0.45} scale={5} blur={2.4} far={2} frames={1} />
    </>
  )
}
