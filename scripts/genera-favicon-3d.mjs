// npm run genera-favicon-3d -- [url] [cartella di uscita, per provarle prima di sostituirle]
// crea le favicon dal render 3d vero del sito: il logo metallico davanti alla sala, inquadratura dei contatti.
// serve il sito acceso (npm run build && npm run preview); usa google chrome senza finestra con la gpu del mac.
// sveglio: puntatore al centro del logo (sguardo dritto); dorme: nessun input finché si addormenta.
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const url = process.argv[2] ?? 'http://localhost:4173/'
const cartella = process.argv[3] ?? join(import.meta.dirname, '..', 'public', 'volto')
const [w, h] = [1440, 900]
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const attesa = (ms) => new Promise((r) => setTimeout(r, ms))

async function scatta(sveglio) {
  const porta = 9400 + Math.floor(Math.random() * 400)
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'favicon-'))}`, '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' })
  let pagina
  for (let i = 0; i < 60 && !pagina; i++) {
    await attesa(250)
    try { pagina = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === 'page') } catch { /* chrome si sta avviando */ }
  }
  const ws = new WebSocket(pagina.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const attese = new Map()
  ws.onmessage = (m) => { const d = JSON.parse(m.data); attese.get(d.id)?.(d); attese.delete(d.id) }
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; attese.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  const valuta = async (expression) => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

  await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: false })
  await cmd('Page.navigate', { url })
  for (let i = 0; i < 80; i++) {
    await attesa(250)
    if (await valuta(`document.querySelector('main')?.getAttribute('aria-busy') === 'false'`)) break
  }
  await attesa(3000) // modelli scaricati dopo il preloader
  // fino in fondo, a passi, così le timeline arrivano ai contatti
  await valuta(`new Promise(async (fine) => { const fondo = document.documentElement.scrollHeight - innerHeight; for (let y = scrollY; y < fondo; y += innerHeight / 3) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)) } scrollTo(0, fondo); fine() })`)
  // solo il logo nella sala: via pulsanti, copyright, nome fisso, grana dom e cursore
  await valuta(`document.head.insertAdjacentHTML('beforeend', '<style>#contatti ul, #contatti p, .z-40, .grana, .z-\\\\[100\\\\] { visibility: hidden !important }</style>')`)
  await attesa(3000)
  const logo = await valuta(`(() => { const r = document.querySelector('[data-logo-contatti]').getBoundingClientRect(); return { x: innerWidth / 2, y: Math.min(innerHeight / 2, r.top + r.height / 2), l: r.width } })()`)
  if (sveglio) {
    // il puntatore sul logo lo tiene sveglio e con lo sguardo dritto
    for (let i = 0; i < 6; i++) {
      await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: logo.x + (i % 2), y: logo.y })
      await attesa(400)
    }
    await attesa(1500)
  } else {
    await attesa(11000) // sonno dopo 8 secondi senza input (movimento.volto.sonnoDopo)
  }
  // scatto intero (il ritaglio di chrome perde il canvas webgl), poi un quadrato attorno al logo
  // con un po’ di sala sopra e sotto; ×2 per la densità dei pixel
  const r = await cmd('Page.captureScreenshot', { format: 'png' })
  ws.close()
  chrome.kill()
  const lato = Math.round(logo.l * 1.25 * 2)
  const sinistra = Math.round(logo.x * 2 - lato / 2)
  const alto = Math.min(h * 2 - lato, Math.max(0, Math.round(logo.y * 2 - lato / 2)))
  // un po’ più di luce: il metallo scuro deve leggersi anche a 16px
  return sharp(Buffer.from(r.result.data, 'base64')).extract({ left: sinistra, top: alto, width: lato, height: lato }).linear(1.35, 0).toBuffer()
}

const sveglio = await scatta(true)
const dorme = await scatta(false)
await sharp(sveglio).resize(96, 96, { kernel: 'lanczos3' }).png().toFile(join(cartella, 'favicon.png'))
await sharp(dorme).resize(96, 96, { kernel: 'lanczos3' }).png().toFile(join(cartella, 'favicon-dorme.png'))
await sharp(sveglio).resize(180, 180, { kernel: 'lanczos3' }).png().toFile(join(cartella, 'apple-touch-icon.png'))
console.log(`favicon 3d create in ${cartella}`)
process.exit(0)
