// Modello Blender con materiale PBR e shape key, condiviso lungo tutto il percorso.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, use, useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { APERTURA, SGUARDO_MAX } from './geometria'
import { leggiPosa, percorso, type Posa } from './percorso'
import { sguardo } from './sguardo'
import { caricaLogo } from './modelloLogo'
import { useVolto } from './VoltoContext'
import { gsap } from '@/lib/gsap'
import { avviaGlitch, casoGlitch, glitch, zonaLogo } from '@/lib/glitch'
import { movimento } from '@/config/movimento'
import { LuciTeatro } from './LuciTeatro'
import { CameraImmersiva } from './CameraImmersiva'
import { Rifinitura } from './Rifinitura'
import { scenaImmersiva } from './scenaImmersiva'
import { Sala, salaAttiva } from './Sala'
import { CAMERA, CAMPO } from '@/components/computer/inquadratura'
import { ComputerNellaScena } from './ComputerNellaScena'
import { Mondo } from './Mondo'
import { Ologramma } from './Ologramma'
import { PolvereNelFascio } from './PolvereNelFascio'
import { effettoAttivo } from './cinema'
import { LIVELLI, limitaFrame, qualita } from './qualita'
import { PARTI_DA_RISCALDARE, riscaldamento } from './riscaldamento'

// glitch del logo: le fasce orizzontali del modello scivolano di lato a scatti (spostamento nei vertici,
// in unità della vista). x = ampiezza, y = fasce per unità, z = scarto delle fasce, w = seme; x = 0 a riposo.
const glitchLogo = { value: new THREE.Vector4() }

/** il sole della fessura serve al computer; il volto resta illuminato dai suoi fari. In più, le fasce del glitch */
function senzaSole(m: THREE.Material) {
  if (m.userData.senzaSole) return
  m.userData.senzaSole = true
  // gli #include si espandono dopo onBeforeCompile: si sostituisce il blocco delle luci già espanso
  const luci = THREE.ShaderChunk.lights_fragment_begin.replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', luci)
    shader.uniforms.uGlitchLogo = glitchLogo
    shader.vertexShader = shader.vertexShader.replace('void main() {', 'uniform vec4 uGlitchLogo;\nvoid main() {').replace(
      '#include <project_vertex>',
      /* glsl */ `#include <project_vertex>
      if (uGlitchLogo.x > 0.0) {
        float fascia = floor(mvPosition.y * uGlitchLogo.y + uGlitchLogo.z);
        float scelta = fract(sin(fascia * 78.233 + uGlitchLogo.w) * 43758.5453);
        float verso = fract(sin(fascia * 12.9898 + uGlitchLogo.w * 1.7) * 43758.5453) - 0.5;
        mvPosition.x += step(0.5, scelta) * verso * uGlitchLogo.x;
        gl_Position = projectionMatrix * mvPosition;
      }`,
    )
  }
  m.customProgramCacheKey = () => 'volto-senza-sole-glitch'
}

function morph(mesh: THREE.Mesh, nome: string, valore: number) {
  const indice = mesh.morphTargetDictionary?.[nome]
  if (indice !== undefined && mesh.morphTargetInfluences) mesh.morphTargetInfluences[indice] = valore
}

export type Controllo3D = { rotazione: number; scala: number }
type Props = {
  riferimento?: RefObject<Element | null>
  controllo?: RefObject<Controllo3D>
  attivo?: boolean
}

export default function Volto3D({ riferimento, controllo, attivo = true }: Props) {
  const risorse = use(caricaLogo())
  const edificio = !riferimento && salaAttiva
  return (
    <Canvas
      shadows={edificio && 'percentage'}
      frameloop="demand"
      dpr={riferimento ? [1, 1.5] : qualita.valori.dpr}
      // home: campo 40° (si vede la sala); laboratorio: la vista frontale di sempre
      camera={riferimento ? { fov: 18, position: [0, 0, 20], near: 1, far: 60 } : { fov: CAMPO, position: CAMERA.toArray(), near: 0.5, far: 200 }}
      // l’anti-aliasing lo fa già il composer (msaa): niente doppio lavoro
      gl={{ antialias: Boolean(riferimento), alpha: true, toneMapping: THREE.AgXToneMapping }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <LuciTeatro />
      {!riferimento && <CameraImmersiva />}
      {!riferimento && (
        <Mondo>
          {edificio && <Suspense fallback={null}><Sala /></Suspense>}
          {edificio && effettoAttivo('polvere') && <PolvereNelFascio />}
          <Suspense fallback={null}><ComputerNellaScena /></Suspense>
        </Mondo>
      )}
      <Rifinitura sala={edificio} />
      <RenderVisibile attivo={attivo} laboratorio={Boolean(riferimento)} />
      {!riferimento && <QualitaAdattiva />}
      {!riferimento && <Riscaldamento />}
      {!riferimento && <PianificatoreGlitch />}
      <VoltoAnimato riferimento={riferimento} controllo={controllo} modello={risorse.modello.scene} />
      {!riferimento && <Suspense fallback={null}><Ologramma /></Suspense>}
    </Canvas>
  )
}

// La scena resta viva per sguardo e battiti, ma non disegna prima del passaggio al 3d o in background.
function RenderVisibile({ attivo, laboratorio }: { attivo: boolean; laboratorio: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let visibile = false
    const richiedi = limitaFrame(invalidate)
    const tick = () => {
      const ora = attivo && !document.hidden && (laboratorio || riscaldamento.attivo || percorso.header.opacity > 0.001)
      if ((ora || ora !== visibile) && richiedi()) visibile = ora
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [attivo, laboratorio, invalidate])
  return null
}

/** la risoluzione interna segue i fotogrammi reali: scende se non regge i 60fps, risale quando c’è margine */
function QualitaAdattiva() {
  const setDpr = useThree((s) => s.setDpr)
  const campione = useRef({ inizio: 0, frame: 0, buoni: 0, lenti: 0, cambio: 0 })
  useEffect(() => qualita.ascolta((l) => setDpr(LIVELLI[l].dpr)), [setDpr])
  useEffect(() => {
    const reset = () => Object.assign(campione.current, { inizio: 0, frame: 0, buoni: 0, lenti: 0 })
    document.addEventListener('visibilitychange', reset)
    return () => document.removeEventListener('visibilitychange', reset)
  }, [])
  useFrame(() => {
    const c = campione.current
    const ora = performance.now()
    if (qualita.bloccata || document.hidden || riscaldamento.attivo || percorso.header.opacity <= 0.001) {
      Object.assign(c, { inizio: 0, frame: 0, buoni: 0, lenti: 0 })
      return
    }
    if (!c.inizio) { c.inizio = ora; return }
    c.frame++
    const durata = ora - c.inizio
    if (durata < 1000) return
    const fps = c.frame * 1000 / durata
    c.buoni = fps >= 58 ? c.buoni + durata : 0
    c.lenti = fps < 52 ? c.lenti + durata : 0
    if (c.lenti >= 2000 && ora - c.cambio >= 3000 && qualita.livello > 0) {
      qualita.imposta(qualita.livello - 1)
      Object.assign(c, { cambio: ora, buoni: 0, lenti: 0 })
    } else if (c.buoni >= 12000 && ora - c.cambio >= 15000 && qualita.livello < 3) {
      qualita.imposta(qualita.livello + 1)
      Object.assign(c, { cambio: ora, buoni: 0, lenti: 0 })
    }
    c.inizio = ora
    c.frame = 0
  })
  return null
}

/** Prepara le risorse man mano che arrivano, senza aspettare il download dell’intera scena. */
function Riscaldamento() {
  const { gl, scene, camera, invalidate } = useThree()
  useEffect(() => {
    let annullato = false
    let compilando = false
    let firma = ''
    let fotogrammi = 0
    const viste = new Set<THREE.Texture>()
    const coda: THREE.Texture[] = []
    let shader: THREE.Object3D[] = []
    riscaldamento.fatto = false
    riscaldamento.attivo = false
    const tick = () => {
      if (riscaldamento.fatto) return gsap.ticker.remove(tick)
      if (annullato || document.hidden) return
      // Un salto diretto ha precedenza: la preparazione non trattiene mai ingresso o scroll.
      if (percorso.header.opacity > 0.001) {
        riscaldamento.attivo = false
        riscaldamento.fatto = true
        return
      }
      const nuova = [...riscaldamento.pronti].sort().join(',')
      if (nuova !== firma && !compilando) {
        firma = nuova
        shader = []
        scene.traverse((o) => {
          const materiali = (o as THREE.Mesh).material
          if (materiali) shader.push(o)
          for (const m of Array.isArray(materiali) ? materiali : materiali ? [materiali] : [])
            for (const valore of Object.values(m)) if (valore instanceof THREE.Texture && !viste.has(valore)) {
              viste.add(valore)
              coda.push(valore)
            }
        })
        return
      }
      // Un solo upload per tick: anche il pulsante d’ingresso può ricevere eventi tra due texture.
      const texture = coda.shift()
      if (texture) { gl.initTexture(texture); return }
      if (compilando) return
      const oggetto = shader.shift()
      if (oggetto) {
        // Un oggetto per tick, con le luci della scena finale e compilazione parallela se supportata.
        compilando = true
        void gl.compileAsync(oggetto, camera, scene).catch(() => {}).finally(() => { compilando = false })
        return
      }
      const pronti = PARTI_DA_RISCALDARE.every((p) => riscaldamento.pronti.has(p) || (p === 'sala' && !salaAttiva))
      if (!pronti || compilando) return
      riscaldamento.attivo = true
      invalidate()
      if (++fotogrammi > 4) {
        riscaldamento.attivo = false
        riscaldamento.fatto = true
      }
    }
    gsap.ticker.add(tick)
    return () => {
      annullato = true
      riscaldamento.attivo = false
      gsap.ticker.remove(tick)
    }
  }, [gl, scene, camera, invalidate])
  return null
}

function VoltoAnimato({
  riferimento,
  controllo,
  modello,
}: Pick<Props, 'riferimento' | 'controllo'> & { modello: THREE.Group }) {
  const { umore, ascoltaAzioni } = useVolto()
  const gruppo = useRef<THREE.Group>(null)
  const hostRef = useRef<HTMLElement | null>(null)
  const { camera, size } = useThree()
  const azioni = useRef({ battito: -10, occhiolino: -10, sorriso: -10 })
  const stato = useRef({
    aperture: [0.5, 0.5],
    x: 0,
    y: 0,
    sorriso: 0,
    inclinazioneX: 0,
    inclinazioneY: 0,
    prossimo: 0,
  })
  const parti = useMemo(() => {
    // Mesh.clone separa i pesi morph; geometrie, texture e materiali restano in cache.
    const scena = modello.clone(true)
    scena.updateMatrixWorld(true)
    const box = new THREE.Box3()
    const punto = new THREE.Vector3()
    scena.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      o.frustumCulled = false
      senzaSole(o.material as THREE.Material)
      // I bounding box dei morph includono tutte le pose: misuriamo solo quella neutra.
      const posizioni = o.geometry.getAttribute('position')
      for (let i = 0; i < posizioni.count; i++)
        box.expandByPoint(punto.fromBufferAttribute(posizioni, i).applyMatrix4(o.matrixWorld))
    })
    const oggetto = (nome: string) => {
      const o = scena.getObjectByName(nome)
      if (!o) throw new Error(`parte del logo mancante: ${nome}`)
      return o
    }
    const centro = box.getCenter(new THREE.Vector3())
    scena.position.sub(centro)
    const occhi = ['sx', 'dx'].map((lato) => {
      const sguardo = oggetto(`sguardo_${lato}`)
      return {
        sguardo,
        riposo: sguardo.position.clone(),
        pupilla: oggetto(`pupilla_${lato}`) as THREE.Mesh,
        palpebra: oggetto(`palpebra_${lato}`) as THREE.Mesh,
      }
    })
    return {
      scena,
      occhi,
      testa: oggetto('testa'),
      sorriso: oggetto('sorriso') as THREE.Mesh,
      larghezza: box.max.x - box.min.x,
    }
  }, [modello])
  useEffect(
    () =>
      ascoltaAzioni((a) => {
        azioni.current[a] = performance.now() / 1000
      }),
    [ascoltaAzioni],
  )
  useFrame((_, delta) => {
    const g = gruppo.current
    if (!g) return
    const r = riferimento?.current?.getBoundingClientRect(),
      c = controllo?.current
    const posa: Posa =
      r && c
        ? {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            larghezza: r.width * c.scala,
            rotazione: c.rotazione,
            opacity: 1,
            fase: 'laboratorio',
          }
        : leggiPosa()
    const ora = performance.now() / 1000,
      s = stato.current,
      a = azioni.current
    const host = (hostRef.current ??= document.querySelector<HTMLElement>('[data-logo-continuo]'))
    if (host) {
      if (host.dataset.fase !== posa.fase) host.dataset.fase = posa.fase
      if (host.dataset.umore !== umore) host.dataset.umore = umore
      const apertura = s.aperture[0].toFixed(3)
      if (host.dataset.apertura !== apertura) host.dataset.apertura = apertura
      const opacity = String(posa.opacity)
      if (host.style.opacity !== opacity) host.style.opacity = opacity
      const grana = posa.opacity > 0.5 && effettoAttivo('grana')
      if (document.documentElement.hasAttribute('data-grana-webgl') !== grana)
        document.documentElement.toggleAttribute('data-grana-webgl', grana)
    }
    g.visible = (posa.opacity > 0.001 || (riscaldamento.attivo && !riferimento)) && !document.hidden
    if (!g.visible) return
    // pixel → scena alla profondità della posa (dietro il computer il volto si allontana, la misura in pixel resta)
    const z = posa.z ?? 0
    const unita = riferimento
      ? (40 * Math.tan(THREE.MathUtils.degToRad(9))) / size.height
      : (2 * (CAMERA.z - z) * Math.tan(THREE.MathUtils.degToRad(CAMPO / 2))) / size.height
    g.position.set((posa.x - size.width / 2) * unita, -(posa.y - size.height / 2) * unita, z)
    g.scale.setScalar((posa.larghezza * unita) / parti.larghezza)
    const { punto, scorre, tocco } = sguardo.get()
    const target = percorso.guarda ?? punto
    const dorme = umore === 'dorme'
    const vx = target ? target.x - posa.x : 0,
      vy = target ? target.y - posa.y : 0,
      distanza = Math.hypot(vx, vy) || 1
    const forza = SGUARDO_MAX * Math.min(1, distanza / Math.max(posa.larghezza, 240))
    const dx = dorme ? 0 : (vx / distanza) * forza,
      dy = dorme ? 0 : tocco && scorre && !percorso.guarda ? SGUARDO_MAX : (vy / distanza) * forza
    s.x = THREE.MathUtils.damp(s.x, dx, 7, delta)
    s.y = THREE.MathUtils.damp(s.y, dy, 7, delta)
    s.inclinazioneX = THREE.MathUtils.damp(s.inclinazioneX, dorme ? 0 : (vy / size.height) * 0.16, 4, delta)
    s.inclinazioneY = THREE.MathUtils.damp(s.inclinazioneY, dorme ? 0 : (vx / size.width) * 0.22, 4, delta)
    g.rotation.set(
      s.inclinazioneX,
      THREE.MathUtils.degToRad(posa.rotazione) + s.inclinazioneY,
      THREE.MathUtils.degToRad(posa.rollio ?? 0),
    )
    // nel chi sono il logo lascia il posto all’avatar: si schiaccia in una riga, come un tubo che si spegne
    const scambio = riferimento ? 0 : percorso.biografia.ologramma
    if (scambio > 0) {
      const via = THREE.MathUtils.smoothstep(scambio, 0.05, 0.4)
      g.scale.y *= Math.max(0.01, 1 - via)
      if (via >= 0.999) g.visible = false
    }
    if (!s.prossimo) s.prossimo = ora + 4
    if (ora > s.prossimo) {
      if (!dorme) a.battito = ora
      s.prossimo =
        ora + movimento.volto.battitoMin + Math.random() * (movimento.volto.battitoMax - movimento.volto.battitoMin)
    }
    const battito = ora - a.battito,
      occhiolino = ora - a.occhiolino,
      sorride = ora - a.sorriso < 1.4
    // occhiolino con l’occhio destro, o con quello che si vede quando sbuca da sinistra del monitor
    const sb = percorso.computer.sbircia
    const ammicca = !riferimento && posa.fase === 'computer' && sb.lato === 'sinistra' && sb.uscita > 0.5 ? 0 : 1
    for (let i = 0; i < 2; i++) {
      const chiuso = (battito >= 0 && battito < 0.22) || (i === ammicca && occhiolino >= 0 && occhiolino < 0.48)
      s.aperture[i] = THREE.MathUtils.damp(
        s.aperture[i],
        // sorridendo gli occhi si stringono un poco, come nel logo 2d: si capisce anche quando la bocca è nascosta
        dorme || chiuso ? 0 : sorride ? APERTURA.sorride : APERTURA.naturale,
        dorme ? 3 : chiuso ? 45 : 20,
        delta,
      )
      const occhio = parti.occhi[i]
      const chiusura = 1 - s.aperture[i] / APERTURA.naturale
      morph(occhio.palpebra, 'chiusura', chiusura)
      morph(occhio.pupilla, 'chiusura', chiusura)
      occhio.sguardo.position.set(
        occhio.riposo.x + (s.x / SGUARDO_MAX) * 0.09,
        occhio.riposo.y - (s.y / SGUARDO_MAX) * 0.05,
        occhio.riposo.z,
      )
    }
    s.sorriso = THREE.MathUtils.damp(s.sorriso, sorride ? 1 : 0, 6, delta)
    morph(parti.sorriso, 'sorriso_ampio', s.sorriso)
    const sonno = 1 - s.aperture[0] / APERTURA.naturale
    parti.testa.rotation.set(dorme ? sonno * (0.1 + Math.sin(ora * 2) * 0.012) : 0, 0, dorme ? sonno * 0.055 : 0)
    scenaImmersiva.logo.copy(g.position)
    scenaImmersiva.scala = g.scale.x
    if (riferimento) camera.lookAt(0, 0, 0)
    else glitchDelLogo(g, posa, unita)
  }, -1)
  return (
    <group ref={gruppo} dispose={null}>
      <primitive object={parti.scena} dispose={null} />
    </group>
  )
}

/**
 * Glitch del logo (src/lib/glitch.ts): piccoli salti a scatti di posizione, rotazione e altezza, fasce che
 * scivolano (vertici) e, in post-produzione, lo sdoppiamento attorno al logo. Scritto dopo la posa del fotogramma
 * e dopo le coordinate condivise (fari, fuoco): al fotogramma dopo il logo torna esattamente com’era.
 */
function glitchDelLogo(g: THREE.Group, posa: Posa, unita: number) {
  const forza = glitch.forza('logo')
  glitchLogo.value.x = 0
  if (forza <= 0 || !g.visible) {
    zonaLogo.larghezza = 0
    return
  }
  const seme = glitch.seme('logo'),
    caso = casoGlitch
  const larghezza = posa.larghezza * unita
  // uno scatto su due il logo salta; le fasce cambiano a ogni scatto
  const salta = caso(seme) > 0.45 ? forza : 0
  g.position.x += (caso(seme + 0.1) - 0.5) * 0.09 * larghezza * salta
  g.position.y += (caso(seme + 0.2) - 0.5) * 0.04 * larghezza * salta
  g.rotation.z += (caso(seme + 0.3) - 0.5) * 0.08 * salta
  g.scale.y *= 1 + (caso(seme + 0.4) - 0.5) * 0.12 * salta
  glitchLogo.value.set(0.14 * larghezza * forza, (6 + caso(seme + 0.5) * 10) / larghezza, caso(seme + 0.6), seme % 113)
  zonaLogo.x = posa.x
  zonaLogo.y = posa.y
  zonaLogo.larghezza = posa.larghezza
}

/** pianificatore dei glitch (solo home) e Canvas tenuto vivo finché un glitch è in corso */
function PianificatoreGlitch() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => avviaGlitch(), [])
  useEffect(() => {
    const richiedi = limitaFrame(invalidate)
    const tick = () => {
      if (glitch.attivo) richiedi()
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [invalidate])
  return null
}
