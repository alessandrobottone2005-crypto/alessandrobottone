// node scripts/verifiche/verifica-navigazione.mjs [url] [cartella risultati]
// Verifica build reali via CDP: navigazione, focus, finestre conservate, resize e fallback WebGL.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { apriChrome, attesa, entra } from '../lib/chrome.mjs'
const url = process.argv[2] ?? 'http://127.0.0.1:4173/'
const out = process.argv[3] ?? join(import.meta.dirname, '../../verifiche/risultati/navigazione')
mkdirSync(out, { recursive: true })
const risultati = []
const casi = [
  { nome: 'desktop' },
  { nome: 'telefono', telefono: true, cpu: 1 },
  { nome: 'ridotto', telefono: true, cpu: 1, ridotto: true },
  { nome: 'webgl-assente', telefono: true, cpu: 1, senzaWebGL: true },
  { nome: 'ridotto-webgl-assente', telefono: true, cpu: 1, ridotto: true, senzaWebGL: true },
  { nome: 'rete-lenta', telefono: true, cpu: 1, lenta: true },
  { nome: 'progetto-diretto', telefono: true, cpu: 1, diretto: true },
]
for (const caso of casi) {
  const b = await apriChrome(caso)
  const check = async (js, messaggio) => assert.ok(await b.valuta(js), `${caso.nome}: ${messaggio}`)
  const tasto = async (key, code = key, windowsVirtualKeyCode = key === 'Enter' ? 13 : key === 'Escape' ? 27 : key === 'Tab' ? 9 : 40) => {
    await b.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode, ...(key === 'Enter' ? { text: '\r' } : {}) })
    await b.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode })
  }
  const foto = async (nome) => writeFileSync(join(out, `${caso.nome}-${nome}.png`), Buffer.from((await b.cmd('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  const vai = async (id) => {
    await b.clic(`a[href="#${id}"]`)
    await b.aspetta(`document.activeElement.id === ${JSON.stringify(id)}`)
    if (id === 'portfolio') await b.aspetta(`!!document.querySelector('[data-mac][data-fase="acceso"]:not([inert])')`)
  }
  try {
    if (caso.lenta) {
      await b.cmd('Network.enable')
      await b.cmd('Network.emulateNetworkConditions', { offline: false, latency: 200, downloadThroughput: 400000, uploadThroughput: 200000 })
    }
    await b.cmd('Page.navigate', { url: caso.diretto ? `${url}progetti/dont-look-medusa` : url })
    await entra(b)
    await b.aspetta(`document.querySelectorAll('.navigazione-sezioni a').length === 3`)
    await check(`[...document.querySelectorAll('.navigazione-sezioni a')].every(a => a.getBoundingClientRect().height >= 44)`, 'bersagli touch da 44px')
    if (caso.diretto) await b.aspetta(`!!document.querySelector('[data-mac]:not([inert]) [role="dialog"]')`)
    if (caso.nome === 'desktop') {
      await b.valuta(`scrollTo(0, document.querySelector('#portfolio > div').getBoundingClientRect().top + scrollY + innerHeight * 1.6)`)
      await b.aspetta(`getComputedStyle(document.querySelector('button[aria-label="accendi il computer"]')).visibility === 'visible'`)
      await b.valuta(`document.querySelector('button[aria-label="accendi il computer"]').focus({preventScroll:true})`)
      await tasto('Enter')
      await b.aspetta(`!!document.querySelector('[data-mac][data-fase="avvio"]')`)
    }
    await vai('portfolio')
    await attesa(250)
    await foto('computer')
    if (caso.telefono) await check(`document.querySelector('.mac-barra').getBoundingClientRect().top >= document.querySelector('.navigazione-sezioni').getBoundingClientRect().bottom`, 'Finder libero sotto navbar')
    if (!caso.diretto) {
      await b.valuta(`document.querySelector('[data-icona="cartella:illustrazione"]').focus({preventScroll:true})`)
      await tasto('Enter')
      await b.aspetta(`!!document.querySelector('[role="dialog"]')`)
      await b.valuta(`document.querySelector('[data-icona="file:dont-look-medusa"]').focus({preventScroll:true})`)
      await tasto('Enter')
      await b.aspetta(`location.pathname === '/progetti/dont-look-medusa' && document.querySelectorAll('[role="dialog"]').length === 2`)
      await b.valuta(`document.querySelector('[data-mac]').dataset.provaConservazione = 'si'`)
    }
    const rotta = await b.valuta('location.pathname')
    const finestre = await b.valuta(`document.querySelectorAll('[role="dialog"]').length`)
    await vai('chi-sono')
    await check(`Math.abs(document.getElementById('chi-sono').getBoundingClientRect().top) < 3`, 'inizio biografia')
    await vai('contatti')
    await check(`[...document.querySelectorAll('#contatti [data-entrata]')].every(e => Number(getComputedStyle(e).opacity) > .99 && e.getBoundingClientRect().top >= 0 && e.getBoundingClientRect().bottom <= innerHeight + 1)`, 'contatti visibili prima del focus')
    await foto('contatti')
    if (caso.nome === 'desktop') {
      await b.cmd('Browser.grantPermissions', { origin: new URL(url).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] })
      await b.clic('#contatti button')
      await b.aspetta(`document.querySelector('#contatti button').textContent.includes('copiata')`)
    }
    await vai('portfolio')
    assert.equal(await b.valuta('location.pathname'), rotta, 'rotta conservata')
    assert.equal(await b.valuta(`document.querySelectorAll('[role="dialog"]').length`), finestre, 'finestre conservate')
    if (!caso.diretto) await check(`document.querySelector('[data-mac]').dataset.provaConservazione === 'si'`, 'Finder non rimontato')
    if (caso.nome === 'telefono') {
      for (const [width, height] of [[390, 730], [844, 390], [390, 844]]) {
        await b.cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 3, mobile: true })
        await attesa(1700)
        await vai('portfolio')
        await check(`document.documentElement.scrollWidth <= innerWidth`, 'nessun overflow orizzontale')
        await check(`document.querySelector('.mac-barra').getBoundingClientRect().top >= document.querySelector('.navigazione-sezioni').getBoundingClientRect().bottom`, 'Finder libero dopo resize')
        await foto(`viewport-${width}-${height}`)
        assert.equal(await b.valuta(`document.querySelectorAll('[role="dialog"]').length`), finestre, 'finestre dopo rotazione')
      }
    }
    if (!caso.senzaWebGL) assert.deepEqual(b.errori, [], 'nessuna eccezione runtime')
    risultati.push({ caso: caso.nome, esito: 'ok', erroriAttesiWebGL: caso.senzaWebGL ? b.errori.length : 0 })
    console.log(`${caso.nome}: ok`)
  } catch (errore) {
    await foto('errore').catch(() => {})
    risultati.push({ caso: caso.nome, esito: 'errore', dettaglio: String(errore), errori: b.errori })
    console.error(`${caso.nome}: ${errore}`)
    process.exitCode = 1
  } finally { await b.chiudi() }
}
writeFileSync(join(out, 'risultati.json'), JSON.stringify(risultati, null, 2))
