// npm run misura-fluidita -- [url] [telefono]
// misura la fluidità del percorso con google chrome (gpu vera del mac, senza finestra):
// scorre la pagina a velocità costante e registra la durata di ogni fotogramma per tratto.
// "telefono" = viewport 390×844 con cpu rallentata 4×: solo un’indicazione, non equivale a un telefono vero.
import { writeFileSync } from 'node:fs'
import { apriChrome, attesa, entra } from '../lib/chrome.mjs'

const url = process.argv[2] ?? 'http://localhost:4173/'
const telefono = process.argv[3] === 'telefono'
// Anche il percorso di ritorno, con Finder e bagliore già attivi.
const acceso = process.argv.includes('--computer-acceso')
const browser = await apriChrome({ telefono })
const { cmd, valuta } = browser
try {
await cmd('Page.navigate', { url })
await browser.aspetta(`document.querySelector('main')?.getAttribute('aria-busy') === 'false'`)
const prontoMs = await valuta('performance.now()')
await valuta(`(() => {
  window.__misuraIngresso = { attivo: true, prima: 0, tempi: [] };
  const c = window.__misuraIngresso;
  const tick = t => { if (!c.attivo) return; if (c.prima) c.tempi.push([t - c.prima, 'ingresso']); c.prima = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
})()`)
await entra(browser)
if (acceso) {
  await browser.clic('a[href="#portfolio"]')
  await browser.aspetta(`!!document.querySelector('[data-mac][data-fase="acceso"]:not([inert])')`)
  await browser.clic('a[href="#header"]')
  await browser.aspetta(`document.activeElement.id === 'header'`)
}
await valuta('scrollTo(0, 100)')
await attesa(150)
if (!await valuta('scrollY > 0')) throw new Error('scroll ancora bloccato: misura annullata')
await valuta('scrollTo(0, 0)')
await attesa(2500) // identica attesa nelle due build; esclude il caricamento iniziale dalla misura di scroll

const ingresso = await valuta(`(() => { const c = window.__misuraIngresso; c.attivo = false; return c.tempi })()`)
const percorso = await valuta(`new Promise((fine) => {
  const totale = document.documentElement.scrollHeight - innerHeight
  const durata = Math.max(12000, (totale / innerHeight) * 1400) // ≈ 0,7 schermi al secondo
  const fotogrammi = []
  let inizio = 0, prima = 0
  const tratto = () => {
    const host = document.querySelector('[data-logo-continuo]')
    const fase = host?.dataset.fase ?? 'header'
    if (fase === 'header') return Number(host?.style.opacity || 0) > 0.01 ? 'header 3d' : 'header 2d'
    if (fase === 'computer') return document.querySelector('[data-mac]')?.hasAttribute('inert') ? 'discesa' : 'sosta computer'
    if (fase === 'verso-computer') return 'discesa'
    if (fase === 'verso-contatti') return 'contatti'
    return fase === 'biografia' ? 'chi sono' : fase
  }
  const passo = (t) => {
    if (!inizio) { inizio = prima = t; requestAnimationFrame(passo); return }
    fotogrammi.push([t - prima, tratto()])
    prima = t
    const p = Math.min(1, (t - inizio) / durata)
    scrollTo(0, p * totale)
    if (p < 1) requestAnimationFrame(passo)
    else fine(fotogrammi)
  }
  requestAnimationFrame(passo)
})`)

const risultato = [...ingresso, ...percorso]
const perTratto = new Map()
for (const [dt, t] of risultato) (perTratto.get(t) ?? perTratto.set(t, []).get(t)).push(dt)
const righe = [...perTratto].map(([t, dts]) => {
  const ordinati = [...dts].sort((a, b) => b - a)
  const media = dts.reduce((s, x) => s + x, 0) / dts.length
  const peggiore = ordinati.slice(0, Math.max(1, Math.round(dts.length / 100)))
  return {
    tratto: t,
    fotogrammi: dts.length,
    'fps medi': +(1000 / media).toFixed(1),
    'fps 1% peggiore': +(1000 / (peggiore.reduce((s, x) => s + x, 0) / peggiore.length)).toFixed(1),
    'oltre 33 ms': dts.filter((x) => x > 33).length,
    'più lungo (ms)': +ordinati[0].toFixed(0),
  }
})
console.log(`\n${telefono ? 'telefono emulato (cpu 4× più lenta)' : 'desktop 1440×900'}${acceso ? ' · computer già acceso' : ''} — ${url}`)
console.table(righe)
if (process.env.MISURA_OUTPUT) writeFileSync(process.env.MISURA_OUTPUT, JSON.stringify({
  url, telefono, acceso, data: new Date().toISOString(), prontoMs, attesaDopoIngressoMs: 2650,
  browser: await cmd('Browser.getVersion'), errori: browser.errori, righe, fotogrammi: risultato,
}, null, 2))
} finally { await browser.chiudi() }
