// Postazione Macintosh poggiata sul pavimento della sala, nel fascio di luce della fessura. Il vetro si illumina all’accensione;
// l’interfaccia vera è DOM posato sopra lo schermo (components/computer/Interfaccia.tsx).
// Spento, con la camera ferma, il mouse si illumina appena a impulsi: invita a cliccare per accendere.
import { useFrame, useThree } from '@react-three/fiber'
import { riscaldamento } from './riscaldamento'
import { use, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { movimento } from '@/config/movimento'
import { matriceComputer, matriceVetro, MOUSE, VETRO } from '@/components/computer/inquadratura'
import { accendibile, dallaScena, leggiFase } from '@/components/computer/stato'
import { caricaComputer } from './modelloComputer'

const INVITO = movimento.computer.invito

/**
 * Guscio del mouse: triangoli nelle parti misurate prima dell’ottimizzazione (guscio, pulsante, fondo).
 * Il join del GLB può cambiare i nomi delle mesh: si selezionano nello spazio della postazione.
 */
function guscioDelMouse(scena: THREE.Object3D) {
  scena.updateMatrixWorld(true)
  const dentro = new THREE.Box3(MOUSE.min, MOUSE.max).expandByScalar(0.001)
  const ingombro = new THREE.Box3()
  const punti: number[] = []
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const centro = new THREE.Vector3()
  scena.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    o.geometry.computeBoundingBox()
    ingombro.copy(o.geometry.boundingBox!).applyMatrix4(o.matrixWorld)
    if (!dentro.intersectsBox(ingombro)) return
    const pos = o.geometry.getAttribute('position') as THREE.BufferAttribute
    const indice = o.geometry.getIndex()
    const n = indice ? indice.count : pos.count
    for (let i = 0; i < n; i += 3) {
      for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, indice ? indice.getX(i + k) : i + k).applyMatrix4(o.matrixWorld)
      centro.copy(v[0]).add(v[1]).add(v[2]).multiplyScalar(1 / 3)
      if (dentro.containsPoint(centro)) for (const p of v) punti.push(p.x, p.y, p.z)
    }
  })
  if (!punti.length) return null
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(punti, 3))
  // gonfiato dal suo centro: il guscio avvolge il mouse senza combattere con la sua superficie
  geometria.computeBoundingBox()
  const c = geometria.boundingBox!.getCenter(new THREE.Vector3())
  geometria.translate(-c.x, -c.y, -c.z).scale(1.06, 1.12, 1.06)
  const materiale = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
  const mesh = new THREE.Mesh(geometria, materiale)
  mesh.position.copy(c)
  mesh.visible = false
  return mesh
}

/** `fermo`: movimento ridotto, il vetro si accende senza dissolvenza */
export function ComputerNellaScena({ fermo = false }: { fermo?: boolean }) {
  const originale = use(caricaComputer())
  useEffect(() => void riscaldamento.pronti.add('computer'), [])
  const scena = useMemo(() => {
    if (!originale) return null
    const copia = originale.clone(true)
    copia.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = o.receiveShadow = true
    })
    return copia
  }, [originale])
  // la mappa d’ombra del sole si disegna una volta sola (Sala.tsx): se il computer arriva dopo, va ridisegnata
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    // eslint-disable-next-line react/immutability -- renderer di Three.js, non stato React
    if (scena) gl.shadowMap.needsUpdate = true
  }, [gl, scena])
  const vetro = useMemo(() => {
    const geometria = new THREE.PlaneGeometry(VETRO.larghezza, VETRO.altezza)
    // Bagliore del tubo: bianco caldo dei fosfori, appena sopra la soglia del Bloom così la cornice ne riceve l’alone.
    const materiale = new THREE.MeshBasicMaterial({ color: '#e7e1d1', transparent: true, opacity: 0, toneMapped: false })
    materiale.color.multiplyScalar(1.35)
    const mesh = new THREE.Mesh(geometria, materiale)
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(matriceVetro)
    return mesh
  }, [])
  const guscio = useMemo(() => (scena && !fermo ? guscioDelMouse(scena) : null), [scena, fermo])
  useEffect(
    () => () => {
      guscio?.geometry.dispose()
      ;(guscio?.material as THREE.Material | undefined)?.dispose()
    },
    [guscio],
  )
  const luce = useMemo(() => {
    // Luce dello schermo sulla tastiera e sulla scrivania, davanti al piano condiviso del vetro.
    const l = new THREE.PointLight('#efe7d4', 0, 3, 2)
    l.position.copy(VETRO.centro).addScaledVector(VETRO.normale, 0.2)
    return l
  }, [])
  useEffect(
    () => () => {
      vetro.geometry.dispose()
      ;(vetro.material as THREE.Material).dispose()
      luce.dispose()
    },
    [vetro, luce],
  )
  useFrame(({ clock }, delta) => {
    if (guscio) {
      // impulso breve e morbido, poi pausa: lampeggia appena, in bianco (la scena è in b/n)
      const g = guscio.material as THREE.MeshBasicMaterial
      const fase = (clock.elapsedTime / INVITO.periodo) % 1
      const impulso = accendibile() ? Math.pow(Math.sin(Math.PI * Math.min(1, fase / 0.55)), 2) * INVITO.intensita : 0
      // eslint-disable-next-line react/immutability -- materiale di Three.js, aggiornato fuori dal render React
      g.opacity = THREE.MathUtils.damp(g.opacity, impulso, 12, Math.min(delta, 0.05))
      // eslint-disable-next-line react/immutability
      guscio.visible = g.opacity > 0.003
    }
    const meta = leggiFase() === 'spento' ? 0 : 1
    const m = vetro.material as THREE.MeshBasicMaterial
    // eslint-disable-next-line react/immutability -- materiale e luce di Three.js, aggiornati fuori dal render React
    m.opacity = fermo ? meta : THREE.MathUtils.damp(m.opacity, meta, meta ? 6 : 10, Math.min(delta, 0.05))
    // eslint-disable-next-line react/immutability
    luce.intensity = m.opacity * 0.8
    dallaScena()
  }, -0.8)
  return (
    <group matrixAutoUpdate={false} matrix={matriceComputer}>
      {scena && <primitive object={scena} dispose={null} />}
      <primitive object={vetro} />
      {guscio && <primitive object={guscio} />}
      <primitive object={luce} />
    </group>
  )
}
