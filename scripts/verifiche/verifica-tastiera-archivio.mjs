import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { apriChrome } from '../lib/chrome.mjs'
const base = process.argv[2] ?? 'http://127.0.0.1:4173/'
const b = await apriChrome({ ridotto: true, senzaWebGL: true })
const risultati = []
const tasto = async (key, n) => {
  await b.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: n })
  await b.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: n })
}
try {
  await b.cmd('Page.navigate', { url: `${base}progetti/dont-look-medusa` })
  await b.aspetta(`document.querySelector('.archivio-copertina img')?.naturalWidth > 0`)
  await b.clic('.archivio-copertina')
  await b.aspetta(`!!document.querySelector('.archivio-lente[open]')`)
  await b.clic('.archivio-lente button[aria-label="aumenta zoom"]')
  await b.aspetta(`document.querySelector('.archivio-lente output')?.textContent === '150%'`)
  await b.aspetta(`document.querySelector('.archivio-lente-area').scrollWidth > document.querySelector('.archivio-lente-area').clientWidth`)
  await b.aspetta(`document.querySelector('.archivio-lente-area').scrollHeight > document.querySelector('.archivio-lente-area').clientHeight`)
  await b.valuta(`document.querySelector('.archivio-lente-area').focus()`)
  await tasto('ArrowRight', 39)
  await b.aspetta(`document.querySelector('.archivio-lente-area').scrollLeft > 0`)
  await tasto('ArrowDown', 40)
  await b.aspetta(`document.querySelector('.archivio-lente-area').scrollTop > 0`)
  risultati.push({ caso: 'ingrandimento e spostamento immagine da tastiera', esito: 'ok' })
  await tasto('Escape', 27)
  await b.aspetta(`!document.querySelector('.archivio-lente')`)
  assert.equal(await b.valuta('location.pathname'), '/progetti/dont-look-medusa')
  await b.cmd('Page.navigate', { url: `${base}progetti/cuphead-mugman-art-toys` })
  await b.aspetta(`!!document.querySelector('[data-modello-fallback]')`)
  assert.ok(await b.valuta(`document.querySelector('[data-modello-fallback] a').href.endsWith('.glb')`))
  await b.valuta(`document.querySelector('[data-blocco=pdf]').scrollIntoView({block:'start'})`)
  await b.aspetta(`document.querySelectorAll('[data-pdf-pagina]').length > 0`, 60000)
  risultati.push({ caso: 'modello senza WebGL: alternativa leggibile e presentazione PDF', esito: 'ok' })
} catch (e) { risultati.push({ esito: 'errore', dettaglio: String(e) }); process.exitCode = 1 }
finally { await b.chiudi() }
writeFileSync(new URL('../../verifiche/risultati/archivio/tastiera-fallback.json', import.meta.url), JSON.stringify(risultati, null, 2))
console.log(JSON.stringify(risultati))
