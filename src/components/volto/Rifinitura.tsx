// Post-produzione della scena: occlusione ambientale, volume (nebbia e polvere nel fascio), profondità di campo,
// bagliore e alone, striscia anamorfica, vignetta, AgX, colore da pellicola, aberrazione e grana (cinema.ts).
// È anche il render finale del Canvas della home: un solo passaggio sulla scena, niente doppio disegno.
import { Bloom, ChromaticAberration, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, BloomEffect, DepthOfFieldEffect, KernelSize, ToneMappingMode } from 'postprocessing'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { HalfFloatType, NoToneMapping, Vector2, Vector3, type ToneMapping as TipoToneMapping } from 'three'
import { centroSchermo } from '@/components/computer/inquadratura'
import { cinema, effettoAttivo } from './cinema'
import { EffettoColore, EffettoStriscia } from './effettiCinema'
import { NebbiaComposizione, NebbiaPassaggio, useNebbia } from './NebbiaVolumetrica'
import { percorso } from './percorso'
import { qualita } from './qualita'
import { scenaImmersiva } from './scenaImmersiva'

// ?effetti=0 mostra la scena senza post-produzione, per il confronto.
const effettiAttivi = new URLSearchParams(location.search).get('effetti') !== '0'
// pulviscolo nel fascio della fessura; ?polvere=0.02 per provarne altri valori
const POLVERE = Number(new URLSearchParams(location.search).get('polvere') ?? 0.008)
// ?senza=ao,nebbia,bagliore,vignetta più quelli di cinema.ts esclude i singoli effetti (prove in sviluppo)
const con = effettoAttivo

/** `sala`: c’è la sala (polvere nel fascio); `fermo`: movimento ridotto, nessuna animazione del volume */
export function Rifinitura({ sala, fermo = false }: { sala: boolean; fermo?: boolean }) {
  return effettiAttivi ? <Catena sala={sala} fermo={fermo} /> : null
}

const morbido = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function Catena({ sala, fermo }: { sala: boolean; fermo: boolean }) {
  // AgX lo applica l’effetto di tonalità: il renderer non deve applicarlo una seconda volta
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    const prima: TipoToneMapping = gl.toneMapping
    // renderer di Three.js: oggetto mutabile per natura, non stato React
    // eslint-disable-next-line react/immutability
    gl.toneMapping = NoToneMapping
    return () => {
      gl.toneMapping = prima
    }
  }, [gl])
  const nebbia = useNebbia(sala ? POLVERE : 0, fermo, con('striscia') ? cinema.nettezzaFascio : 0)

  // profondità di campo: il fuoco va dal volto allo schermo del computer durante la discesa, poi torna al volto
  const camera = useThree((s) => s.camera)
  const fuoco = useMemo(
    () => new DepthOfFieldEffect(camera, { focusRange: cinema.fuoco.intervallo, bokehScale: cinema.fuoco.bokeh, resolutionScale: 0.5 }),
    [camera],
  )
  const bersaglio = useMemo(() => new Vector3(), [])
  const schermo = useMemo(() => new Vector3(), [])
  useEffect(() => {
    // eslint-disable-next-line react/immutability -- effetto di postprocessing, non stato React
    fuoco.target = bersaglio
    const aggiorna = () => (fuoco.bokehScale = qualita.livello >= 2 ? cinema.fuoco.bokeh : cinema.fuoco.bokehBasso)
    aggiorna()
    return qualita.ascolta(aggiorna)
  }, [fuoco, bersaglio])
  useEffect(() => () => fuoco.dispose(), [fuoco])
  useFrame(({ camera }) => {
    const s = percorso.stazione
    // il computer entra a fuoco presto: computer e volto dietro il monitor nitidi, sala lontana sfocata
    const verso = morbido(0.05, 0.45, s) * (1 - morbido(1, 1.35, s))
    schermo.copy(centroSchermo).applyMatrix4(scenaImmersiva.mondo)
    bersaglio.copy(scenaImmersiva.logo).lerp(schermo, verso)
    // eslint-disable-next-line react/immutability -- effetto di postprocessing, non stato React
    fuoco.cocMaterial.focusRange = cinema.fuoco.intervallo + (cinema.fuoco.intervalloComputer - cinema.fuoco.intervallo) * verso
    scenaImmersiva.fuoco = camera.position.distanceTo(bersaglio)
  })

  // alone (halation) e striscia anamorfica: leggono il bagliore già sfocato
  const alone = useMemo(
    () =>
      new BloomEffect({
        mipmapBlur: true,
        luminanceThreshold: cinema.alone.soglia,
        intensity: cinema.alone.intensita,
        radius: cinema.alone.raggio,
        kernelSize: KernelSize.LARGE,
      }),
    [],
  )
  const striscia = useMemo(() => new EffettoStriscia(alone.texture), [alone])
  const colore = useMemo(() => new EffettoColore(), [])
  useEffect(
    () => () => {
      alone.dispose()
      striscia.dispose()
      colore.dispose()
    },
    [alone, striscia, colore],
  )
  const offset = useMemo(() => new Vector2(cinema.aberrazione, cinema.aberrazione * 0.6), [])

  return (
    <EffectComposer multisampling={4} frameBufferType={HalfFloatType}>
      <>{con('ao') && <N8AO halfRes aoRadius={1.6} distanceFalloff={0.6} intensity={2.2} quality="medium" />}</>
      <>{con('nebbia') && <NebbiaPassaggio oggetto={nebbia.passaggio} />}</>
      <>{con('nebbia') && <NebbiaComposizione oggetto={nebbia.composizione} />}</>
      <>{con('fuoco') && <primitive object={fuoco} dispose={null} />}</>
      <>{con('bagliore') && <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.35} />}</>
      <>{con('alone') && <primitive object={alone} dispose={null} />}</>
      <>{con('alone') && con('striscia') && <primitive object={striscia} dispose={null} />}</>
      <>{con('vignetta') && <Vignette offset={cinema.vignetta.offset} darkness={cinema.vignetta.darkness} />}</>
      <ToneMapping mode={ToneMappingMode.AGX} />
      <>{con('colore') && <primitive object={colore} dispose={null} />}</>
      <>{con('aberrazione') && <ChromaticAberration offset={offset} radialModulation modulationOffset={0.3} />}</>
      <>{con('grana') && <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={cinema.grana} />}</>
    </EffectComposer>
  )
}
