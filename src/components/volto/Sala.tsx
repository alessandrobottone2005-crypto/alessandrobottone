// Sala di cemento realistica: luce cotta in Blender (lightmap), cemento PBR, pavimento bagnato con riflessi veri,
// sole in tempo reale solo per ciò che si muove (computer e volto). La muove Mondo.tsx insieme al computer.
import { MeshReflectorMaterial } from '@react-three/drei/core/MeshReflectorMaterial'
import { useFrame, useThree } from '@react-three/fiber'
import { use, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { COMPUTER } from '@/components/computer/inquadratura'
import { DIREZIONE_SOLE, INTENSITA_LUCE } from './luceSala'
import { caricaSala, type RisorseSala } from './modelloSala'
import { scenaImmersiva } from './scenaImmersiva'
import { cinema } from './cinema'
import dati from './stazioniSala.json'
import { qualita } from './qualita'
import { riscaldamento } from './riscaldamento'

// ?ambiente=0 spegne la sala per il confronto.
export const salaAttiva = new URLSearchParams(location.search).get('ambiente') !== '0'

/** pareti e pavimento: la luce del sole e dei fari è già nella lightmap (diffusa) o nei riflessi; qui nessuna luce diretta */
function soloRiflessi(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <lights_fragment_end>',
    '#include <lights_fragment_end>\n reflectedLight.directDiffuse = vec3(0.0);\n reflectedLight.directSpecular = vec3(0.0);',
  )
}

// la macchia di sole della fessura sulle superfici: luce cotta tinta d’arancione dentro il fascio (cinema.ts)
const coloreSole = new THREE.Color(cinema.sole.colore)
const lumSole = 0.2126 * coloreSole.r + 0.7152 * coloreSole.g + 0.0722 * coloreSole.b
const uniformiSole = {
  versoSala: { value: new THREE.Matrix4() },
  tintaSole: { value: new THREE.Vector3(coloreSole.r / lumSole, coloreSole.g / lumSole, coloreSole.b / lumSole) },
  direzioneSole: { value: DIREZIONE_SOLE.clone() },
  soffitto: { value: dati.soffitto },
  fessura: { value: dati.fessura },
}
function soleArancione(shader: THREE.WebGLProgramParametersWithUniforms) {
  Object.assign(shader.uniforms, uniformiSole)
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform mat4 versoSala;\nvarying vec3 vSala;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvSala = (versoSala * modelMatrix * vec4(transformed, 1.)).xyz;')
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform vec3 tintaSole; uniform vec3 direzioneSole; uniform float soffitto; uniform float fessura;
       varying vec3 vSala;
       float nelFascio(vec3 q) {
         vec3 alto = q - direzioneSole * ((soffitto - q.y) / -direzioneSole.y);
         return 1. - smoothstep(fessura * .8, fessura * 1.08, abs(alto.x));
       }`,
    )
    .replace(
      '#include <lights_fragment_end>',
      '#include <lights_fragment_end>\n reflectedLight.indirectDiffuse *= mix(vec3(1.), tintaSole, nelFascio(vSala));',
    )
}

/** riflesso del pavimento come luce aggiunta, non come tinta: più forte sul bagnato e di taglio (Fresnel) */
function pavimentoBagnato(materiale: THREE.MeshStandardMaterial) {
  const originale = materiale.onBeforeCompile.bind(materiale)
  materiale.onBeforeCompile = (shader, renderer) => {
    originale(shader, renderer)
    soloRiflessi(shader)
    soleArancione(shader)
    shader.fragmentShader = shader.fragmentShader.replace(
      'diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength);',
      `float bagnato = 1.0 - smoothstep(0.08, 0.55, reflectorRoughnessFactor);
       float fresnel = 0.04 + 0.96 * pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 5.0);
       totalEmissiveRadiance += newMerge.rgb * mixStrength * mix(0.3, 1.0, bagnato) * mix(0.4, 1.0, fresnel);`,
    )
  }
  materiale.customProgramCacheKey = () => 'pavimento-bagnato-sole'
  materiale.needsUpdate = true
}

/** la compressione Meshopt quantizza posizioni e normali e mette la scala nel nodo: torna a float e coordinate reali */
function geometriaVera(mesh: THREE.Mesh) {
  const g = mesh.geometry.clone()
  for (const nome of Object.keys(g.attributes)) {
    const a = g.getAttribute(nome)
    if (a instanceof THREE.BufferAttribute && !a.normalized && a.array instanceof Float32Array) continue
    const valori = new Float32Array(a.count * a.itemSize)
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) valori[i * a.itemSize + k] = a.getComponent(i, k)
    g.setAttribute(nome, new THREE.BufferAttribute(valori, a.itemSize))
  }
  mesh.updateWorldMatrix(true, false)
  return g.applyMatrix4(mesh.matrixWorld)
}

export function Sala({ fermo = false }: { fermo?: boolean }) {
  const risorse = use(caricaSala())
  return risorse ? <Stanza risorse={risorse} fermo={fermo} /> : null
}

function Stanza({ risorse, fermo }: { risorse: RisorseSala; fermo: boolean }) {
  const { gl, scene } = useThree()
  const parti = useMemo(() => {
    let pareti: THREE.Mesh | undefined
    let pavimento: THREE.Mesh | undefined
    risorse.scena.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      if ((o.material as THREE.Material).name === 'cemento_pavimento') pavimento = o
      else pareti = o
    })
    if (!pareti || !pavimento) throw new Error('sala incompleta')
    const sorgente = pareti.material as THREE.MeshStandardMaterial
    const materialePareti = sorgente.clone()
    Object.assign(materialePareti, { lightMap: risorse.luce.sala, lightMapIntensity: INTENSITA_LUCE, metalness: 0, envMapIntensity: 0.6 })
    materialePareti.onBeforeCompile = (shader) => {
      soloRiflessi(shader)
      soleArancione(shader)
    }
    materialePareti.customProgramCacheKey = () => 'pareti-sala-sole'
    const muri = new THREE.Mesh(geometriaVera(pareti), materialePareti)
    // la luce della sala è già cotta: le ombre in tempo reale servono solo al computer (vedi il piano sotto)
    muri.receiveShadow = true
    // il pavimento guarda in alto (+y); il riflettore di drei vuole la normale locale +z
    const geometriaPavimento = geometriaVera(pavimento).rotateX(Math.PI / 2)
    const p = pavimento.material as THREE.MeshStandardMaterial
    return { muri, materialePareti, geometriaPavimento, pavimento: { map: p.map, normalMap: p.normalMap, roughnessMap: p.roughnessMap } }
  }, [risorse])

  const sole = useMemo(() => {
    // tempo reale solo per gli oggetti che si muovono: la fessura (ombra del soffitto) delimita il fascio
    const l = new THREE.DirectionalLight(cinema.sole.colore, 5.5 / lumSole)
    l.castShadow = true
    l.shadow.mapSize.set(2048, 2048)
    l.shadow.bias = -0.0004
    l.shadow.normalBias = 0.04
    const c = l.shadow.camera
    c.left = c.bottom = -9
    c.right = c.top = 9
    c.near = 1
    c.far = 80
    l.target.position.copy(COMPUTER.posizione)
    l.position.copy(COMPUTER.posizione).addScaledVector(DIREZIONE_SOLE, -40)
    return l
  }, [])

  // ambiente per i riflessi di volto, computer e cemento: la sala stessa vista dal computer, una volta sola
  const ambiente = useMemo(() => {
    const scena = new THREE.Scene()
    // riflessi neutri: le pareti senza la tinta arancione del sole, così volto e computer restano in b/n
    const neutro = parti.materialePareti.clone()
    neutro.onBeforeCompile = soloRiflessi
    neutro.customProgramCacheKey = () => 'pareti-sala'
    const copia = new THREE.Mesh(parti.muri.geometry, neutro)
    copia.position.copy(COMPUTER.posizione).negate().setY(-2)
    scena.add(copia)
    const pmrem = new THREE.PMREMGenerator(gl)
    const rt = pmrem.fromScene(scena, 0.02, 0.1, 200)
    pmrem.dispose()
    neutro.dispose()
    return rt
  }, [gl, parti])

  useEffect(() => {
    const prima = { env: scene.environment, intensita: scene.environmentIntensity }
    // scena di Three.js: oggetto mutabile per natura, non stato React
    // eslint-disable-next-line react/immutability
    scene.environment = ambiente.texture
    scene.environmentIntensity = 0.55
    return () => {
      scene.environment = prima.env
      scene.environmentIntensity = prima.intensita
    }
  }, [scene, ambiente])

  useEffect(
    () => () => {
      parti.materialePareti.dispose()
      parti.muri.geometry.dispose()
      parti.geometriaPavimento.dispose()
      sole.dispose()
      ambiente.dispose()
    },
    [parti, sole, ambiente],
  )

  // il sole è fermo rispetto a sala e computer (si muovono insieme): la mappa d’ombra si disegna una volta
  // (e quando cambiano gli oggetti), a ogni fotogramma si aggiorna solo la sua matrice
  useEffect(() => {
    riscaldamento.pronti.add('sala')
    const prima = gl.shadowMap.autoUpdate
    // eslint-disable-next-line react/immutability -- renderer di Three.js, non stato React
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    // il computer può arrivare dopo la sala: un secondo aggiornamento quando è in scena
    const id = window.setTimeout(() => (gl.shadowMap.needsUpdate = true), 1500)
    return () => {
      clearTimeout(id)
      gl.shadowMap.autoUpdate = prima
    }
  }, [gl])
  const [riflesso, setRiflesso] = useState(() => (fermo ? 1024 : qualita.valori.riflesso))
  useEffect(() => (fermo ? undefined : qualita.ascolta(() => setRiflesso(qualita.valori.riflesso))), [fermo])

  // i riflessi seguono l’orientamento della sala mentre il mondo ruota
  const rotazione = useMemo(() => new THREE.Matrix4(), [])
  useFrame((stato) => {
    uniformiSole.versoSala.value.copy(scenaImmersiva.mondo).invert()
    rotazione.extractRotation(scenaImmersiva.mondo)
    stato.scene.environmentRotation.setFromRotationMatrix(rotazione)
    sole.updateMatrixWorld()
    // la camera d’ombra ruota con la sala: con l’alto del mondo (0,1,0) la mappa disegnata una volta
    // verrebbe letta ruotata attorno al fascio mentre la discesa inclina la sala (macchie sul computer)
    sole.shadow.camera.up.set(0, 1, 0).transformDirection(scenaImmersiva.mondo)
    sole.shadow.updateMatrices(sole)
  }, -0.85)

  return (
    <>
      <primitive object={parti.muri} />
      <mesh geometry={parti.geometriaPavimento} rotation-x={-Math.PI / 2} receiveShadow>
        <MeshReflectorMaterial
          ref={(m: THREE.MeshStandardMaterial | null) => {
            if (m && !m.userData.bagnato) {
              m.userData.bagnato = true
              pavimentoBagnato(m)
            }
          }}
          map={parti.pavimento.map}
          normalMap={parti.pavimento.normalMap}
          roughnessMap={parti.pavimento.roughnessMap}
          lightMap={risorse.luce.pavimento}
          lightMapIntensity={INTENSITA_LUCE}
          envMapIntensity={0.25}
          metalness={0}
          roughness={1}
          resolution={riflesso}
          blur={[320, 90]}
          mixBlur={1.6}
          mixStrength={2.6}
          mixContrast={1}
          mirror={0}
          depthScale={0}
        />
      </mesh>
      {/* ombra del computer sul pavimento: solo lui proietta ombre, il resto è nella luce cotta */}
      <mesh position={[COMPUTER.posizione.x, 0.012, COMPUTER.posizione.z]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <shadowMaterial transparent opacity={0.62} depthWrite={false} />
      </mesh>
      <primitive object={sole} />
      <primitive object={sole.target} />
    </>
  )
}
