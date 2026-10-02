// npm run genera-favicon
// versione vettoriale delle favicon (sveglio e addormentato) dalla stessa geometria del componente <Volto />.
// il sito usa le favicon dal render 3d (npm run genera-favicon-3d): queste restano come riserva in sorgenti/.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { APERTURA, svgStatico } from '../src/components/volto/geometria.ts'

const cartella = join(import.meta.dirname, '..', 'sorgenti', 'logo', 'favicon-svg')
const sfondo = '#141414'

const sveglio = svgStatico({ apertura: APERTURA.naturale, sfondo })
const dorme = svgStatico({ apertura: APERTURA.dorme, sfondo })

writeFileSync(join(cartella, 'favicon.svg'), sveglio)
writeFileSync(join(cartella, 'favicon-dorme.svg'), dorme)
// per safari e ios, che preferiscono un png (nel sito c’è quella 3d)
await sharp(Buffer.from(sveglio)).resize(180).png().toFile(join(cartella, 'apple-touch-icon.png'))

console.log('favicon vettoriali create in sorgenti/logo/favicon-svg/')
