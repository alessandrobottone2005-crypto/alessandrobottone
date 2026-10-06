// nome e cognome in metallo (claude.md §6.2): le lettere dom restano come sagoma invisibile, animata da gsap
// come sempre (entrata, raccolta in alto a destra); qui ogni lettera 3d si posa sulla sua sagoma a ogni fotogramma.
// Canvas leggero a parte: deve vedersi da subito e restare sopra le sezioni, senza nebbia né post-produzione.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { use, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { caricaLogo } from '@/components/volto/modelloLogo'
import { sguardo } from '@/components/volto/sguardo'
import { gsap } from '@/lib/gsap'
import { media } from '@/config/movimento'
import { caricaFontNome } from './fontNome'
import { limitaFrame, qualita } from '@/components/volto/qualita'

// letture delle preferenze create una volta (si aggiornano da sole)
const mouse = matchMedia(media.mouse)
const normale = matchMedia(media.normale)

const CAMPO = 12
const DISTANZA = 30
// misure in em: il json ha 1000 unità di risoluzione e l’em vale 1e5/72 unità, quindi 0,72 → 1 em
const TAGLIA = 0.72
const PROFONDITA = 0.11
const SMUSSO = { spessore: 0.03, misura: 0.018 }
const ALTEZZA_X = 0.36

type Misura = { x: number; base: number; taglio: number; em: number; ok: boolean }

export default function Nome3D({ radice }: { radice: RefObject<HTMLElement | null> }) {
  const font = use(caricaFontNome())
  const { modello } = use(caricaLogo())
  return (
    <Canvas
      frameloop="demand"
      dpr={qualita.valori.dpr}
      camera={{ fov: CAMPO, position: [0, 0, DISTANZA], near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.AgXToneMapping }}
      onCreated={({ gl }) => (gl.localClippingEnabled = true)}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <QualitaNome />
      <Ambiente />
      <directionalLight position={[-4, 6, 6]} intensity={2.2} />
      <directionalLight position={[5, -2, 4]} intensity={0.6} />
      <Lettere radice={radice} font={font} modello={modello.scene} />
    </Canvas>
  )
}

function QualitaNome() {
  const setDpr = useThree((s) => s.setDpr)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const aggiorna = () => { setDpr(qualita.valori.dpr); invalidate() }
    aggiorna()
    return qualita.ascolta(aggiorna)
  }, [setDpr, invalidate])
  return null
}

/** riflessi neutri generati in codice, nessuna hdri da scaricare */
function Ambiente() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const stanza = new RoomEnvironment()
    const mappa = pmrem.fromScene(stanza, 0.04).texture
    // scena di Three.js: oggetto mutabile per natura, non stato React
    // eslint-disable-next-line react/immutability
    scene.environment = mappa
    scene.environmentIntensity = 0.75
    return () => {
      scene.environment = null
      mappa.dispose()
      stanza.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function materialeDelLogo(modello: THREE.Object3D) {
  let trovato: THREE.MeshStandardMaterial | undefined
  modello.traverse((o) => {
    if (!trovato && o instanceof THREE.Mesh) trovato = o.material as THREE.MeshStandardMaterial
  })
  return trovato ?? new THREE.MeshStandardMaterial({ color: '#b8b5b0', metalness: 1, roughness: 0.45 })
}

function Lettere({ radice, font, modello }: { radice: RefObject<HTMLElement | null>; font: Font; modello: THREE.Object3D }) {
  const invalidate = useThree((s) => s.invalidate)
  const { size } = useThree()
  const misure = useRef<Misura[]>([])
  const stati = useRef<{ rx: number; ry: number; z: number }[]>([])
  const pronto = useRef(false)
  const inMovimento = useRef(false)
  const gruppi = useRef<(THREE.Group | null)[]>([])

  // le sagome dom non cambiano: si leggono una volta, quando il Canvas nasce
  const lettere = useMemo(() => {
    const elementi = [...(radice.current?.querySelectorAll<HTMLElement>('[data-lettera]') ?? [])]
    const base = materialeDelLogo(modello)
    const geometrie = new Map<string, { geometria: THREE.BufferGeometry; avanzamento: number }>()
    return elementi.map((el) => {
      const carattere = el.dataset.carattere ?? ''
      let g = geometrie.get(carattere)
      if (!g) {
        const glifo = (font.data.glyphs as Record<string, { ha: number }>)[carattere]
        const avanzamento = ((glifo?.ha ?? 0) * TAGLIA) / font.data.resolution
        const geometria = new THREE.ExtrudeGeometry(font.generateShapes(carattere, TAGLIA), {
          depth: PROFONDITA,
          bevelEnabled: true,
          bevelThickness: SMUSSO.spessore,
          bevelSize: SMUSSO.misura,
          bevelOffset: -SMUSSO.misura,
          bevelSegments: 4,
          curveSegments: 6,
        })
        // perno al centro della lettera, faccia davanti a z = 0
        geometria.translate(-avanzamento / 2, -ALTEZZA_X, -(PROFONDITA + SMUSSO.spessore))
        g = { geometria, avanzamento }
        geometrie.set(carattere, g)
      }
      const materiale = base.clone()
      materiale.onBeforeCompile = () => {}
      materiale.customProgramCacheKey = () => 'nome-3d'
      const piano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      materiale.clippingPlanes = [piano]
      return { el, base: el.querySelector<HTMLElement>('[data-base]'), ...g, materiale, piano }
    })
    // oxlint-disable-next-line react/preserve-manual-memoization
  }, [radice, font, modello])

  useEffect(
    () => () => {
      new Set(lettere.map((l) => l.geometria)).forEach((g) => g.dispose())
      lettere.forEach((l) => l.materiale.dispose())
      delete radice.current?.dataset.nome3d
    },
    [lettere, radice],
  )

  // lettura delle sagome sul ticker di gsap, subito dopo le sue animazioni. il layout si legge solo quando può
  // essere cambiato: scroll, ridimensionamento, cursore, animazioni gsap delle lettere (più 1,5s di coda per lo scrub)
  useEffect(() => {
    let firma = ''
    let sporco = true
    const richiedi = limitaFrame(invalidate)
    let fontPx = 0
    let stilePrecedente = ''
    const larghezze = new Map<HTMLElement, number>()
    const parole = [...(radice.current?.querySelectorAll<HTMLElement>('[data-parola-nome]') ?? [])]
    let finoA = performance.now() + 4000
    const elementi = lettere.map((l) => l.el)
    const sveglia = () => (finoA = performance.now() + 1500)
    const puntatore = () => { if (mouse.matches && normale.matches) sporco = true }
    const ridimensiona = () => {
      fontPx = 0
      stilePrecedente = ''
      larghezze.clear()
      sveglia()
    }
    addEventListener('resize', ridimensiona)
    addEventListener('scroll', sveglia, { passive: true })
    addEventListener('pointermove', puntatore, { passive: true })
    const resize = new ResizeObserver(ridimensiona)
    if (radice.current) resize.observe(radice.current)
    document.fonts.ready.then(ridimensiona)
    const tick = () => {
      if (document.hidden) return
      const ora = performance.now()
      if (ora > finoA && !gsap.isTweening(elementi)) {
        if ((sporco || inMovimento.current) && richiedi()) sporco = false
        return
      }
      // Nessuna misura DOM se GSAP non ha cambiato né parole né lettere.
      const stile = parole.map((p) => p?.style.cssText).join('|') + elementi.map((e) => e.style.transform).join('|')
      if (stile && stile === stilePrecedente) {
        if ((sporco || inMovimento.current) && richiedi()) sporco = false
        return
      }
      stilePrecedente = stile
      let nuova = ''
      const maschere = new Map<HTMLElement, DOMRect>()
      misure.current = lettere.map(({ el, base }) => {
        if (!fontPx) fontPx = parseFloat(getComputedStyle(el).fontSize)
        const r = el.getBoundingClientRect()
        const b = base?.getBoundingClientRect()
        const genitore = el.parentElement
        let m = genitore ? maschere.get(genitore) : undefined
        if (genitore && !m) { m = genitore.getBoundingClientRect(); maschere.set(genitore, m) }
        const larghezza = larghezze.get(el) ?? el.offsetWidth
        larghezze.set(el, larghezza)
        const ok = Boolean(b && m && larghezza)
        const em = ok ? fontPx * (r.width / larghezza) : 0
        const misura = { x: r.left, base: b?.top ?? 0, taglio: m?.bottom ?? 0, em, ok }
        nuova += `${misura.x.toFixed(1)},${misura.base.toFixed(1)},${misura.taglio.toFixed(1)},${em.toFixed(2)};`
        return misura
      })
      const { punto, tocco } = sguardo.get()
      if (mouse.matches && !tocco && punto) nuova += `${punto.x},${punto.y}`
      if (nuova !== firma || inMovimento.current) sporco = true
      if (sporco && richiedi()) sporco = false
      firma = nuova
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      resize.disconnect()
      removeEventListener('resize', ridimensiona)
      removeEventListener('scroll', sveglia)
      removeEventListener('pointermove', puntatore)
    }
  }, [lettere, invalidate, radice])

  useFrame((_, delta) => {
    const unita = (2 * DISTANZA * Math.tan(THREE.MathUtils.degToRad(CAMPO / 2))) / size.height
    const { punto, tocco } = sguardo.get()
    const reagisce = mouse.matches && normale.matches && !tocco && punto
    let movimento = false
    lettere.forEach((l, i) => {
      const g = gruppi.current[i],
        m = misure.current[i]
      if (!g || !m) return
      g.visible = m.ok && m.em > 0.5
      if (!g.visible) return
      const scala = m.em * unita
      const cx = m.x + (l.avanzamento * m.em) / 2,
        cy = m.base - ALTEZZA_X * m.em
      // le lettere vicine al cursore si girano verso di lui, avanzano e prendono la luce
      let ry = 0,
        rx = 0,
        z = 0
      if (reagisce) {
        const dx = punto.x - cx,
          dy = punto.y - cy
        const raggio = Math.max(m.em * 2.4, 140)
        const t = Math.max(0, 1 - Math.hypot(dx, dy) / raggio) ** 2
        ry = THREE.MathUtils.clamp(dx / raggio, -1, 1) * 0.8 * t
        rx = THREE.MathUtils.clamp(dy / raggio, -1, 1) * 0.8 * t
        z = 0.35 * t
      }
      const s = (stati.current[i] ??= { rx: 0, ry: 0, z: 0 })
      s.rx = THREE.MathUtils.damp(s.rx, rx, 8, delta)
      s.ry = THREE.MathUtils.damp(s.ry, ry, 8, delta)
      s.z = THREE.MathUtils.damp(s.z, z, 8, delta)
      if (Math.abs(s.rx - rx) + Math.abs(s.ry - ry) + Math.abs(s.z - z) > 1e-3) movimento = true
      g.position.set((cx - size.width / 2) * unita, -(cy - size.height / 2) * unita, s.z * scala)
      g.rotation.set(s.rx, s.ry, 0)
      g.scale.setScalar(scala)
      // la maschera dom taglia le lettere che salgono: qui la stessa riga diventa un piano di taglio
      l.piano.constant = (m.taglio - size.height / 2) * unita
    })
    inMovimento.current = movimento
    const sagoma = radice.current
    if (!pronto.current && misure.current.some((m) => m.ok) && sagoma) {
      pronto.current = true
      // attributo dom fuori dal render React: le lettere dom diventano trasparenti
      // eslint-disable-next-line react/immutability
      sagoma.dataset.nome3d = 'pronto'
    }
  })

  return (
    <>
      {lettere.map((l, i) => (
        <group key={i} ref={(g) => void (gruppi.current[i] = g)}>
          <mesh geometry={l.geometria} material={l.materiale} />
        </group>
      ))}
    </>
  )
}
