// Postazione Macintosh ottimizzata (npm run prepara-computer): un solo download, condiviso
// tra scena principale e versione con movimento ridotto. Se fallisce, l’interfaccia resta in 2d.
import type { Group } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const MODELLO = '/computer/computer.glb'
let caricamento: Promise<Group | null> | undefined
export function caricaComputer() {
  return (caricamento ??= new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync(MODELLO)
    .then((g) => g.scene)
    .catch((errore: unknown) => {
      console.warn('computer 3d non disponibile:', errore)
      return null
    }))
}
