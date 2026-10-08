// Movimento ridotto: stessa stanza e stesso computer, inquadratura ferma davanti allo schermo acceso.
// Nessun volto, volume e polvere fermi: la scena si disegna solo quando cambia qualcosa.
import { useAvvio } from '@/components/preloader/AvvioContext'
import { Canvas } from '@react-three/fiber'
import { Component, Suspense, type ReactNode } from 'react'
import * as THREE from 'three'
import { CAMERA, CAMPO } from '@/components/computer/inquadratura'
import { Rifinitura } from './Rifinitura'
import { Sala, salaAttiva } from './Sala'
import { ComputerNellaScena } from './ComputerNellaScena'
import { Mondo } from './Mondo'
import { PolvereNelFascio } from './PolvereNelFascio'
import { effettoAttivo } from './cinema'

class Protetta extends Component<{ children: ReactNode }, { rotto: boolean }> {
  state = { rotto: false }
  static getDerivedStateFromError() { return { rotto: true } }
  componentDidCatch(errore: unknown) { console.warn('scena ferma non disponibile:', errore) }
  render() { return this.state.rotto ? null : this.props.children }
}

export default function ScenaRidotta() {
  return <Protetta><Scena /></Protetta>
}

function Scena() {
  const { scenaAttiva } = useAvvio()
  return (
    <Canvas
      shadows={salaAttiva && 'percentage'}
      frameloop={scenaAttiva ? 'demand' : 'never'}
      dpr={[1, 1.5]}
      camera={{ fov: CAMPO, position: CAMERA.toArray(), near: 0.5, far: 200 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.AgXToneMapping }}
      className="absolute! inset-0"
      aria-hidden="true"
    >
      <Mondo stazione={1}>
        {salaAttiva && (
          <Suspense fallback={null}>
            <Sala fermo />
          </Suspense>
        )}
        {salaAttiva && effettoAttivo('polvere') && <PolvereNelFascio fermo />}
        <Suspense fallback={null}>
          <ComputerNellaScena fermo />
        </Suspense>
      </Mondo>
      <Rifinitura sala={salaAttiva} fermo />
    </Canvas>
  )
}
