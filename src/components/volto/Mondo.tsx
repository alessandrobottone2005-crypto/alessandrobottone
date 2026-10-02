// Sala e computer si muovono insieme: la camera reale resta ferma e il volto non cambia scala.
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import type { Group } from 'three'
import { matriceMondo, telefono } from '@/components/computer/inquadratura'
import { percorso } from './percorso'
import { scenaImmersiva } from './scenaImmersiva'

/** `stazione` fissa l’inquadratura (movimento ridotto: davanti allo schermo acceso); altrimenti segue lo scroll e lo zoom */
export function Mondo({ stazione, children }: { stazione?: number; children: ReactNode }) {
  const gruppo = useRef<Group>(null)
  const size = useThree((s) => s.size)
  // Dopo VoltoAnimato (−1), che con leggiPosa aggiorna la stazione del fotogramma.
  useFrame(() => {
    const g = gruppo.current
    if (!g) return
    matriceMondo(stazione ?? percorso.stazione, size.width / size.height, telefono(size.width), g.matrix, stazione === undefined ? percorso.computer.zoom : 1)
    // subito: riflessi del pavimento e volume leggono la posizione di questo fotogramma, non del precedente
    g.updateMatrixWorld(true)
    scenaImmersiva.mondo.copy(g.matrixWorld)
  }, -0.9)
  return (
    <group ref={gruppo} matrixAutoUpdate={false}>
      {children}
    </group>
  )
}
