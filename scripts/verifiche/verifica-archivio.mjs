// Flussi reali dell’archivio a tutta vista, sulla build locale. Nessun invio di dediche.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { apriChrome, attesa, entra } from '../lib/chrome.mjs'

const url = process.argv[2] ?? 'http://127.0.0.1:4173/'
const out = join(import.meta.dirname, '../../verifiche/risultati/archivio')
mkdirSync(out, { recursive: true })
const risultati = []
const casi = [
  { nome: 'desktop' },
  { nome: 'telefono', telefono: true, cpu: 1 },
  { nome: 'tablet', width: 820, height: 1180, ridotto: true },
  { nome: 'senza-webgl', senzaWebGL: true, ridotto: true },
]
for (const caso of casi.filter(c => !process.env.CASO || c.nome === process.env.CASO)) {
  const b = await apriChrome(caso)
  const check = async (js, motivo) => assert.ok(await b.valuta(js), `${caso.nome}: ${motivo}`)
  const foto = async (nome) => writeFileSync(join(out, `${caso.nome}-${nome}.png`), Buffer.from((await b.cmd('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  const key = async (key, code = key, virtual = key === 'Enter' ? 13 : key === 'Escape' ? 27 : 9) => {
    await b.cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtual, ...(key === 'Enter' ? { text: '\r' } : {}) })
    await b.cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtual })
  }
  const premi = async (testo, root = '.archivio[open]') => b.valuta(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(root)} + ' button')].find(e => (e.getAttribute('aria-label') === ${JSON.stringify(testo)} || e.textContent.trim() === ${JSON.stringify(testo)} || (${JSON.stringify(root)} === '.navigazione-sezioni' && e.textContent.includes(${JSON.stringify(testo)})))); if (!b) throw Error('pulsante assente: ' + ${JSON.stringify(testo)}); b.click() })()`)
  try {
    await b.cmd('Page.navigate', { url: caso.nome === 'desktop' ? url : `${url}progetti` })
    if (caso.nome === 'desktop') {
      await entra(b)
      await premi('progetti', '.navigazione-sezioni')
      await b.aspetta(`!!document.querySelector('dialog.archivio[open]')`)
      await premi('torna al computer')
      await b.aspetta(`!!document.querySelector('.mac-schermo[data-fase="acceso"]:not([inert])')`)
      await b.aspetta(`!document.querySelector('main').inert && !!document.querySelector('.navigazione-sezioni')`)
      await attesa(500)
      // Apri scacchi e identifica il DOM: deve sopravvivere all’archivio.
      await b.valuta(`document.querySelector('[data-icona="app:scacchi"]').focus({preventScroll:true})`)
      await key('Enter')
      await b.aspetta(`!!document.querySelector('.mac-finestra [data-casa]')`)
      await b.valuta(`document.querySelector('.mac-finestra').dataset.conservata = 'si'`)
      await b.valuta(`document.querySelector('[data-icona="progetti"]').focus({preventScroll:true})`)
      await b.aspetta(`document.activeElement.dataset.icona === 'progetti'`)
      await key('Enter')
    }
    await b.aspetta(`!!document.querySelector('dialog.archivio[open]') && document.querySelectorAll('[data-progetto]').length === 9`)
    await attesa(600)
    const colonne = caso.nome === 'telefono' ? 1 : caso.nome === 'tablet' ? 2 : 3
    await check(`getComputedStyle(document.querySelector('.archivio-griglia')).gridTemplateColumns.split(' ').length === ${colonne}`, 'numero di colonne')
    await check(`document.querySelector('dialog.archivio').getBoundingClientRect().width === innerWidth`, 'finestra a tutta larghezza')
    await check(`document.querySelector('.archivio-scroll').scrollWidth <= document.querySelector('.archivio-scroll').clientWidth + 1`, 'assenza overflow orizzontale')
    await check(`document.activeElement.closest('dialog.archivio') !== null`, 'focus nell’archivio')
    await b.aspetta(`[...document.querySelectorAll('.archivio-anteprima img')].slice(0,3).every(i => i.complete && i.naturalWidth)`)
    await foto('archivio')
    await premi('illustrazione')
    await check(`document.querySelectorAll('[data-progetto]').length === 5`, 'filtro illustrazione')
    await b.valuta(`document.querySelector('.archivio-scroll').scrollTop = 250`)
    await attesa(100)
    const posizione = await b.valuta(`document.querySelector('.archivio-scroll').scrollTop`)
    await b.valuta(`document.querySelector('[data-progetto="dont-look-medusa"]').click()`)
    await b.aspetta(`location.pathname.endsWith('/dont-look-medusa') && !!document.querySelector('.archivio-copertina img')`)
    await b.aspetta(`document.querySelector('.archivio-copertina img').complete`)
    await foto('illustrazione')
    await b.clic('.archivio-copertina')
    await b.aspetta(`!!document.querySelector('.archivio-lente[open]')`)
    await b.clic('.archivio-lente button[aria-label="aumenta zoom"]')
    await check(`document.querySelector('.archivio-lente output').textContent === '150%'`, 'zoom immagine')
    await key('Escape')
    await b.aspetta(`!document.querySelector('.archivio-lente')`)
    await check(`location.pathname.endsWith('/dont-look-medusa')`, 'Esc chiude solo l’immagine')
    await key('Escape')
    await b.aspetta(`location.pathname === '/progetti' && document.querySelectorAll('[data-progetto]').length === 5`)
    await check(`Math.abs(document.querySelector('.archivio-scroll').scrollTop - ${posizione}) < 3`, 'posizione archivio ripristinata: attesa ' + posizione + ', attuale ' + await b.valuta(`document.querySelector('.archivio-scroll').scrollTop`))
    await check(`document.activeElement.dataset.progetto === 'dont-look-medusa'`, 'focus restituito alla copertina')
    await b.valuta('history.forward()')
    await b.aspetta(`location.pathname.endsWith('/dont-look-medusa')`)
    await premi('torna all’archivio')
    await b.aspetta(`location.pathname === '/progetti'`)
    await premi('branding')
    await check(`document.querySelectorAll('[data-progetto]').length === 3`, 'filtro branding')
    await b.valuta(`document.querySelector('[data-progetto="dai-tre-fuochi"]').click()`)
    await b.aspetta(`!!document.querySelector('[data-blocco=pdf]')`)
    await b.valuta(`document.querySelector('[data-blocco=pdf]').scrollIntoView({block:'start'})`)
    await b.aspetta(`document.querySelectorAll('[data-pdf-pagina]').length > 2`, 60000)
    await b.valuta(`document.querySelector('.pdf-documento').scrollIntoView({block:'start'})`)
    await b.aspetta(`document.querySelectorAll('.pdf-pagina canvas').length > 0`)
    await attesa(400)
    const numPagine = await b.valuta(`document.querySelectorAll('[data-pdf-pagina]').length`)
    await check(`document.querySelectorAll('.pdf-pagina canvas').length < ${numPagine}`, 'PDF non disegnato tutto insieme')
    await foto('pdf')
    await b.valuta(`document.querySelector('.pdf-barra button[aria-label="aumenta zoom"]').click()`)
    await b.aspetta(`document.querySelector('.pdf-barra output')?.textContent === '125%'`)
    await check(`document.querySelector('.pdf-barra output')?.textContent === '125%'`, 'zoom PDF')
    await premi('adatta alla larghezza')
    await b.aspetta(`document.querySelector('.pdf-barra output')?.textContent === '100%'`)
    const yHome = await b.valuta('scrollY')
    await b.valuta(`document.querySelector('[data-pdf-pagina="${Math.min(6, numPagine)}"]').scrollIntoView({block:'start'})`)
    await b.aspetta(`document.querySelector('.pdf-posizione')?.textContent.startsWith('pagina ${Math.min(6, numPagine)} ')`)
    await check(`scrollY === ${yHome}`, 'scroll PDF non sposta la home')
    await check(`document.querySelector('.archivio-scroll').scrollWidth <= document.querySelector('.archivio-scroll').clientWidth + 1`, 'adatta ripristina larghezza')
    await premi('torna all’archivio')
    await b.aspetta(`location.pathname === '/progetti'`)
    await premi('tutti')
    // Ogni scheda apre titolo e copertina corretti; la navigazione resta nello stesso dialog.
    const slugs = await b.valuta(`[...document.querySelectorAll('[data-progetto]')].map(e => e.dataset.progetto)`)
    for (const slug of slugs) {
      await b.valuta(`document.querySelector('[data-progetto="${slug}"]').click()`)
      await b.aspetta(`location.pathname === '/progetti/${slug}' && !!document.querySelector('.archivio-copertina img')`)
      await premi('torna all’archivio')
      await b.aspetta(`location.pathname === '/progetti'`)
    }
    if (caso.nome === 'telefono') {
      await b.cmd('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 3, mobile: true })
      await attesa(500)
      await check(`document.querySelector('.archivio-scroll').clientHeight > 150`, 'contenuti accessibili dopo rotazione')
      await check(`document.querySelector('.archivio-scroll').scrollWidth <= document.querySelector('.archivio-scroll').clientWidth + 1`, 'nessun overflow dopo rotazione')
    }
    await premi('torna al computer')
    await b.aspetta(`location.pathname === '/' && !document.querySelector('dialog.archivio[open]') && !document.documentElement.classList.contains('scroll-fermo')`)
    await b.aspetta(`!!document.querySelector('.mac-schermo[data-fase="acceso"]:not([inert])')`)
    if (caso.nome === 'desktop') await check(`!!document.querySelector('.mac-finestra[data-conservata="si"]')`, 'scacchi conservati')
    await b.aspetta(`!!document.querySelector('.navigazione-sezioni') && !document.querySelector('main').inert`)
    await premi('contatti', '.navigazione-sezioni')
    await b.aspetta(`document.activeElement.id === 'contatti'`)
    // Il collegamento diretto deve ignorare l’ingresso e funzionare anche dopo un refresh.
    await b.cmd('Page.navigate', { url: `${url}progetti/inktober` })
    await b.aspetta(`!!document.querySelector('dialog.archivio[open] .archivio-copertina')`)
    await check(`![...document.querySelectorAll('button')].some(b => b.textContent.includes('inizia a scrollare'))`, 'link diretto senza accensione')
    await b.cmd('Page.reload')
    await b.aspetta(`!!document.querySelector('dialog.archivio[open] .archivio-copertina')`)
    await premi('torna all’archivio')
    await b.aspetta(`location.pathname === '/progetti' && document.querySelectorAll('[data-progetto]').length === 9`)
    if (!caso.senzaWebGL) assert.deepEqual(b.errori, [], 'nessuna eccezione runtime')
    risultati.push({ caso: caso.nome, esito: 'ok', paginePDF: numPagine })
    console.log(`${caso.nome}: ok`)
  } catch (e) {
    await foto('errore').catch(() => {})
    risultati.push({ caso: caso.nome, esito: 'errore', dettaglio: String(e), errori: b.errori })
    console.error(`${caso.nome}: ${e}`)
  } finally { await b.chiudi() }
}
writeFileSync(join(out, 'risultati.json'), JSON.stringify(risultati, null, 2))
if (risultati.some(r => r.esito !== 'ok')) process.exitCode = 1
