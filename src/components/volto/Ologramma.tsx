// Avatar a punti del chi sono: prende il posto del logo nella colonna della biografia.
// I fotogrammi vengono dal video generato con Google Flow (scripts/prepara-avatar.mjs): il cursore sceglie
// quanto è girata la testa, verso destra gli stessi fotogrammi specchiati; su e giù inclinano appena il piano.
// Senza mouse si guarda intorno da solo.
import { useFrame, useThree } from '@react-three/fiber'
import { use, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { movimento } from '@/config/movimento'
import { percorso } from './percorso'
import { sguardo } from './sguardo'
import { useVolto } from './VoltoContext'
import { frammento, vertice } from './ologramma.glsl'
import { riscaldamento } from './riscaldamento'
import { casoGlitch, glitch } from '@/lib/glitch'

// atlante: celle 4×2, tre fotogrammi per cella (uno per canale)
const GRIGLIA = new THREE.Vector2(4, 2)

function carica() {
  return new THREE.TextureLoader().loadAsync('/avatar/giro.webp').then((t) => {
    t.colorSpace = THREE.SRGBColorSpace
    // punti nitidi: niente mipmap che li impastino
    t.generateMipmaps = false
    t.minFilter = THREE.LinearFilter
    return t
  })
}
let caricamento: ReturnType<typeof carica> | undefined
const caricaAvatar = () => (caricamento ??= carica())

// luce che si somma alla scena senza toccare l’alfa del buffer (altrimenti il riquadro del piano si vede)
const somma = {
  blending: THREE.CustomBlending,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
} as const
const morbido = (t: number) => t * t * (3 - 2 * t)
/** uniform di Three.js, aggiornate per fotogramma fuori dal render React */
function imposta(mesh: THREE.Mesh, valori: Record<string, unknown>) {
  const uniformi = (mesh.material as THREE.ShaderMaterial).uniforms
  for (const nome in valori) uniformi[nome].value = valori[nome]
}

export function Ologramma() {
  const atlante = use(caricaAvatar())
  const { umore } = useVolto()
  const { size } = useThree()
  const gruppo = useRef<THREE.Group>(null)
  useEffect(() => void riscaldamento.pronti.add('avatar'), [])
  const stato = useRef({ giro: 0, inclinazione: 0, ultimoPunto: null as { x: number; y: number } | null, fermoDa: 0 })

  const busto = useMemo(() => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1.25),
      new THREE.ShaderMaterial({
        vertexShader: vertice,
        fragmentShader: frammento,
        uniforms: {
          uAtlante: { value: atlante },
          uGriglia: { value: GRIGLIA },
          uFotogramma: { value: 0 },
          uSpecchio: { value: 0 },
          uColore: { value: new THREE.Color('#c9c5c0') },
          uComparsa: { value: 0 },
          uTempo: { value: 0 },
          uGlitch: { value: 0 },
          uSeme: { value: 0 },
          uSemeLuce: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        ...somma,
      }),
    )
    mesh.frustumCulled = false
    return mesh
  }, [atlante])

  // risorse locali liberate allo smontaggio; la texture resta in cache per il ritorno
  useEffect(
    () => () => {
      busto.geometry.dispose()
      ;(busto.material as THREE.Material).dispose()
    },
    [busto],
  )

  useFrame((_, delta) => {
    const g = gruppo.current
    if (!g) return
    const scambio = percorso.biografia.ologramma
    const disegna = (scambio > 0.001 || riscaldamento.attivo) && !document.hidden
    // il layout si legge solo quando serve (e prima delle scritture del fotogramma: priorità -1.5)
    const box = disegna ? document.querySelector<HTMLElement>('[data-logo-biografia]')?.getBoundingClientRect() : undefined
    g.visible = disegna && !!box
    if (!g.visible || !box) return

    const ora = performance.now() / 1000,
      s = stato.current,
      a = movimento.avatar
    const unita = (40 * Math.tan(THREE.MathUtils.degToRad(9))) / size.height
    const cx = box.left + box.width / 2,
      cy = box.top + box.height / 2
    // dove guarda: il cursore, oppure un giro lento quando il mouse è fermo o c’è il tocco
    const { punto, tocco } = sguardo.get()
    const target = percorso.guarda ?? punto
    if (target !== s.ultimoPunto) {
      s.ultimoPunto = target
      s.fermoDa = ora
    }
    const autonomo = !target || tocco || ora - s.fermoDa > a.autonomoDopo
    let giro: number, inclinazione: number
    if (umore === 'dorme') {
      giro = 0
      inclinazione = 0.7
    } else if (autonomo) {
      giro = Math.sin(ora * 0.37) * 0.6 + Math.sin(ora * 0.13 + 1.3) * 0.4
      inclinazione = Math.sin(ora * 0.29 + 0.7) * 0.35
    } else {
      // misurato fino al bordo dello schermo da quel lato: l’avatar sta di lato e lo spazio non è simmetrico
      const vx = target.x - cx,
        occhi = box.top + box.height * 0.3,
        vy = target.y - occhi
      giro = vx / (0.8 * Math.max(box.width / 2, vx < 0 ? cx : size.width - cx))
      inclinazione = vy / Math.max(box.height / 2, vy < 0 ? occhi : size.height - occhi)
    }
    const k = autonomo ? a.smorzamento * 0.4 : a.smorzamento
    s.giro = THREE.MathUtils.damp(s.giro, THREE.MathUtils.clamp(giro, -1, 1), k, delta)
    s.inclinazione = THREE.MathUtils.damp(s.inclinazione, THREE.MathUtils.clamp(inclinazione, -1, 1), k, delta)

    g.position.set(
      (cx - size.width / 2) * unita,
      -(cy - size.height / 2) * unita - s.inclinazione * box.height * unita * 0.035,
      0,
    )
    g.scale.setScalar(box.width * unita)
    g.rotation.x = THREE.MathUtils.degToRad(a.inclinazioneMax) * s.inclinazione

    // glitch (src/lib/glitch.ts): a scatti salta a un altro fotogramma, il piano trema; il resto lo fa lo shader
    const forza = glitch.forza('ologramma')
    const seme = forza > 0 ? glitch.seme('ologramma') : 0
    const salto = forza > 0 && casoGlitch(seme + 0.7) > 0.55
    if (forza > 0) g.position.x += (casoGlitch(seme + 0.8) - 0.5) * 0.05 * box.width * unita * forza
    imposta(busto, {
      // fotogramma più vicino: niente dissolvenze, quindi niente punti doppi
      uFotogramma: salto
        ? Math.floor(casoGlitch(seme + 0.9) * a.fotogrammi)
        : Math.round(Math.abs(s.giro) * (a.fotogrammi - 1)),
      uSpecchio: (s.giro > 0) !== (salto && casoGlitch(seme + 1.1) > 0.5) ? 1 : 0,
      uComparsa: morbido(THREE.MathUtils.clamp((scambio - 0.3) / 0.6, 0, 1)),
      uTempo: ora % 1000,
      uGlitch: forza,
      uSeme: seme % 997,
      uSemeLuce: forza > 0 ? glitch.semeLuce('ologramma') % 997 : 0,
    })
  }, -1.5)

  return (
    <group ref={gruppo} visible={false}>
      <primitive object={busto} />
    </group>
  )
}
