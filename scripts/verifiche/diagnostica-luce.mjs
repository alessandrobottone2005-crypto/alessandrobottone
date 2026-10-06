// Confronti fotografici dello stesso tratto, senza cambiare i valori di produzione.
// node scripts/verifiche/diagnostica-luce.mjs [url] [cartella risultati]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { apriChrome, attesa, entra } from '../lib/chrome.mjs'
const base = process.argv[2] ?? 'http://127.0.0.1:4173/'
const out = process.argv[3] ?? join(import.meta.dirname, '../../verifiche/risultati/luce')
mkdirSync(out, { recursive: true })
for (const senza of (process.argv[4] === 'base' ? [''] : ['', 'colore', 'nebbia', 'bagliore,alone,striscia', 'tonalita'])) {
  const b = await apriChrome({ telefono: true, cpu: 1 })
  try {
    const url = new URL(base)
    url.searchParams.set('qualita', '1')
    // Solo per le fotografie: ferma le variazioni casuali in ogni variante, compresa la base.
    url.searchParams.set('senza', ['respiro', 'glitch', 'grana', senza].filter(Boolean).join(','))
    await b.cmd('Page.navigate', { url: url.href })
    await entra(b)
    await attesa(5000)
    await b.valuta(`scrollTo(0, document.querySelector('#portfolio > div').getBoundingClientRect().top + scrollY + innerHeight * .35)`)
    await attesa(1500)
    const nome = senza || 'catena-completa'
    writeFileSync(join(out, `${nome}.png`), Buffer.from((await b.cmd('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
    console.log(nome, await b.valuta(`JSON.stringify({scrollY, fase:document.querySelector('[data-logo-continuo]')?.dataset.fase})`), b.errori)
  } finally { await b.chiudi() }
}
