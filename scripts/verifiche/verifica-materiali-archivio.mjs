// Errori di rete, riprova, pagine lontane e modello 3d dell’archivio; solo lettura.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { apriChrome } from '../lib/chrome.mjs'
const base = process.argv[2] ?? 'http://127.0.0.1:4173/'
const b = await apriChrome({ ridotto: true })
const risultati = []
const naviga = async (slug) => {
  await b.cmd('Page.navigate', { url: `${base}progetti/${slug}` })
  await b.aspetta(`!!document.querySelector('.archivio[open]')`)
  await b.aspetta(`!!document.querySelector('.archivio-progetto')`)
  const pdf = await b.valuta(`!!document.querySelector('[data-blocco=pdf]')`)
  if (pdf) await b.valuta(`document.querySelector('[data-blocco=pdf]').scrollIntoView({block:'start'})`)
}
try {
  await b.cmd('Network.enable')
  await b.cmd('Network.setBlockedURLs', { urls: ['*.pdf'] })
  await naviga('lorenzo')
  await b.aspetta(`!!document.querySelector('.pdf-documento .archivio-errore')`)
  await b.cmd('Network.setBlockedURLs', { urls: [] })
  await b.valuta(`document.querySelector('.pdf-documento .archivio-errore').scrollIntoView({block:'center'})`)
  await b.clic('.pdf-documento .archivio-errore button')
  await b.aspetta(`document.querySelectorAll('[data-pdf-pagina]').length > 0`, 60000)
  await b.valuta(`document.querySelector('.pdf-documento').scrollIntoView({block:'start'})`)
  await b.aspetta(`document.querySelector('[data-pdf-pagina="1"] canvas')?.width > 0`)
  // Il controllo è raggiungibile con un vero clic, senza copertura della barra di navigazione.
  assert.ok(await b.valuta(`(() => { const e=document.querySelector('.pdf-barra button[aria-label="aumenta zoom"]'); const r=e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)) })()`))
  await b.clic('.pdf-barra button[aria-label="aumenta zoom"]')
  await b.aspetta(`document.querySelector('.pdf-barra output')?.textContent === '125%'`)
  await b.clic('.pdf-barra button[aria-label="adatta alla larghezza"]')
  await b.aspetta(`document.querySelector('.pdf-barra output')?.textContent === '100%'`)
  const n = await b.valuta(`document.querySelectorAll('[data-pdf-pagina]').length`)
  await b.valuta(`document.querySelector('[data-pdf-pagina="${n}"]').scrollIntoView({block:'start'})`)
  await b.aspetta(`!!document.querySelector('[data-pdf-pagina="${n}"] canvas') && !document.querySelector('[data-pdf-pagina="1"] canvas')`)
  risultati.push({ caso: 'pdf errore, riprova, zoom reale e rilascio canvas', esito: 'ok', pagine: n })
  await b.cmd('Network.setBlockedURLs', { urls: ['*copertina*.webp'] })
  await naviga('dont-look-medusa')
  await b.aspetta(`!!document.querySelector('.archivio-progetto > .archivio-errore')`)
  await b.cmd('Network.setBlockedURLs', { urls: [] })
  await b.clic('.archivio-progetto > .archivio-errore button')
  await b.aspetta(`document.querySelector('.archivio-copertina img')?.naturalWidth > 0`)
  risultati.push({ caso: 'immagine errore e riprova', esito: 'ok' })
  await naviga('cuphead-mugman-art-toys')
  await b.aspetta(`document.querySelectorAll('[data-pdf-pagina]').length > 0`, 60000)
  await b.valuta(`document.querySelector('[data-cursore="ruota"]').scrollIntoView({block:'center'})`)
  await b.aspetta(`document.querySelector('[data-cursore="ruota"] canvas')?.width > 0`, 60000)
  await b.aspetta(`getComputedStyle(document.querySelector('[data-cursore="ruota"] > div.pointer-events-none')).opacity === '0'`, 60000)
  await b.clic('[data-cursore="ruota"] button')
  risultati.push({ caso: 'presentazione e modello 3d caricati, ripristino vista', esito: 'ok' })
  await naviga('serena-brancale')
  await b.aspetta(`document.querySelectorAll('[data-pdf-pagina]').length > 0`, 60000)
  risultati.push({ caso: 'terzo brand book', esito: 'ok', pagine: await b.valuta(`document.querySelectorAll('[data-pdf-pagina]').length`) })
  assert.deepEqual(b.errori, [])
} catch (e) { risultati.push({ esito: 'errore', dettaglio: String(e), errori: b.errori }); process.exitCode = 1 }
finally { await b.chiudi() }
const out=join(import.meta.dirname, '../../verifiche/risultati/archivio')
mkdirSync(out,{recursive:true})
writeFileSync(join(out,'materiali.json'),JSON.stringify(risultati,null,2))
console.log(JSON.stringify(risultati,null,2))
