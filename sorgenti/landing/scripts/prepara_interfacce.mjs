// Ritaglia soltanto acquisizioni reali della landing; nessuna grafica del Finder viene ridisegnata.
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import sharp from 'sharp'

const base = resolve(import.meta.dirname, '..')
const dir = join(base, 'interfacce')
const capture = JSON.parse(await readFile(join(dir, 'acquisizione.json'), 'utf8'))
const target = { width: 640, height: 517 }
async function crop(file, output, clip = capture.clip, viewport = capture.viewport) {
  const input = sharp(join(dir, file))
  const info = await input.metadata()
  const sx = info.width / viewport[0], sy = info.height / viewport[1]
  const left = Math.max(0, Math.round(clip.x * sx)), top = Math.max(0, Math.round(clip.y * sy))
  const width = Math.min(info.width - left, Math.round(clip.width * sx))
  const height = Math.min(info.height - top, Math.round(clip.height * sy))
  await input.extract({ left, top, width, height }).resize(target.width, target.height, { fit: 'fill', kernel: 'nearest' }).png().toFile(join(dir, output))
}
const files = await readdir(dir)
const states = ['desktop', 'illustrazione', 'branding', '3d', 'paint', 'scacchi', 'progetto']
for (const name of states) {
  const source = files.includes(`${name}-pagina.jpg`) ? `${name}-pagina.jpg` : `${name}-pagina.png`
  await crop(source, `${name}.png`)
}
await sharp({ create: { ...target, channels: 3, background: '#161614' } }).png().toFile(join(dir, 'spento.png'))
const boot = JSON.parse(await readFile(join(dir, 'avvio-acquisizione.json'), 'utf8'))
const bootFrames = []
// L'avvio viene normalizzato a 24 fps scegliendo l'acquisizione reale più vicina.
for (let frame = 0; frame < 110; frame++) {
  const t = frame / 24
  const shot = boot.reduce((best, candidate) => Math.abs(candidate.time - t) < Math.abs(best.time - t) ? candidate : best)
  const filename = `boot-${String(frame).padStart(3, '0')}.png`
  await crop(shot.file, filename, shot.clip, shot.viewport)
  bootFrames.push(filename)
}
// Atlante incorporabile nel .blend: nessun percorso esterno per la riproduzione.
const names = ['spento.png', ...bootFrames, ...states.map(s => `${s}.png`)]
const columns = 10, rows = Math.ceil(names.length / columns)
await sharp({ create: { width: columns * target.width, height: rows * target.height, channels: 3, background: '#161614' } })
  .composite(await Promise.all(names.map(async (name, index) => ({ input: await readFile(join(dir, name)), left: (index % columns) * target.width, top: Math.floor(index / columns) * target.height }))))
  .png().toFile(join(dir, 'schermo-atlante.png'))
const manifest = { ...target, columns, rows, tiles: names.length, bootStart: 1, bootFrames: bootFrames.length,
  states: { spento: 0, ...Object.fromEntries(states.map((s, i) => [s, 1 + bootFrames.length + i])) },
  acquisition: 'Schermate native della landing locale, 6 ottobre 2026; ritaglio e normalizzazione a 24 fps.' }
await writeFile(join(dir, 'schermo.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log('Interfacce pronte:', manifest)
