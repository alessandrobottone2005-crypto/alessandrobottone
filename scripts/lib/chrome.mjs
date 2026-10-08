// Chrome/CDP già installato: nessuna dipendenza aggiuntiva. Una sessione isolata per ogni prova.
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const attesa = (ms) => new Promise((r) => setTimeout(r, ms))
export async function apriChrome({ telefono = false, width = telefono ? 390 : 1440, height = telefono ? 844 : 900, cpu = telefono ? 4 : 1, ridotto = false, senzaWebGL = false } = {}) {
  const profilo = mkdtempSync(join(tmpdir(), 'portfolio-chrome-'))
  const porta = 9400 + Math.floor(Math.random() * 400)
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${profilo}`,
    '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
    ...(senzaWebGL ? ['--disable-webgl'] : []), `--window-size=${width},${height}`, 'about:blank',
  ], { stdio: 'ignore' })
  let erroreAvvio
  chrome.on('error', (e) => { erroreAvvio = e })
  let ws
  const attese = new Map()
  const chiudi = async () => {
    for (const a of attese.values()) { clearTimeout(a.timer); a.reject(new Error('sessione chiusa')) }
    attese.clear()
    ws?.close()
    if (chrome.exitCode === null) {
      const uscito = new Promise((r) => chrome.once('exit', r))
      chrome.kill()
      await Promise.race([uscito, attesa(2000)])
    }
    // I processi figli di Chrome possono completare le scritture dopo l’uscita del processo principale.
    for (let tentativo = 0; tentativo < 10; tentativo++) {
      try { rmSync(profilo, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); break }
      catch (e) { if (tentativo === 9) console.warn('profilo temporaneo ancora occupato:', profilo, e.code); else await attesa(300) }
    }
  }
  try {
    let pagina
    for (let i = 0; i < 60 && !pagina; i++) {
      if (erroreAvvio) throw erroreAvvio
      await attesa(250)
      try { pagina = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === 'page') } catch { /* avvio */ }
    }
    if (!pagina) throw new Error('Chrome non disponibile')
    ws = new WebSocket(pagina.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const errori = []
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data)
      if (d.method === 'Runtime.exceptionThrown') errori.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text)
      const a = attese.get(d.id)
      if (!a) return
      clearTimeout(a.timer)
      attese.delete(d.id)
      if (d.error) a.reject(new Error(JSON.stringify(d.error)))
      else a.resolve(d.result)
    }
    const cmd = (method, params = {}) => new Promise((resolve, reject) => {
      const i = ++id
      const timer = setTimeout(() => { attese.delete(i); reject(new Error(`timeout CDP: ${method}`)) }, 90000)
      attese.set(i, { resolve, reject, timer })
      ws.send(JSON.stringify({ id: i, method, params }))
    })
    const valuta = async (expression) => {
      const r = await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
      return r.result?.value
    }
    const aspetta = async (expression, timeout = 30000) => {
      const fine = Date.now() + timeout
      while (Date.now() < fine) {
        if (await valuta(expression)) return
        await attesa(100)
      }
      throw new Error(`condizione non raggiunta: ${expression}`)
    }
    const clic = async (selettore) => {
      const p = await valuta(`(() => {
        const el = document.querySelector(${JSON.stringify(selettore)}); if (!el) throw new Error('elemento assente');
        const r = el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};
      })()`)
      await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', ...p, button: 'left', clickCount: 1 })
      await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', ...p, button: 'left', clickCount: 1 })
    }
    await cmd('Runtime.enable')
    await cmd('Page.enable')
    await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: telefono ? 3 : 2, mobile: telefono })
    await cmd('Emulation.setTouchEmulationEnabled', { enabled: telefono })
    await cmd('Emulation.setCPUThrottlingRate', { rate: cpu })
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: ridotto ? 'reduce' : 'no-preference' }] })
    return { cmd, valuta, aspetta, clic, chiudi, errori }
  } catch (e) { await chiudi(); throw e }
}

export async function entra(browser) {
  const { aspetta, valuta, cmd } = browser
  await aspetta(`!!document.querySelector('.ingresso-rapido') || !!document.querySelector('dialog.archivio[open]') || !!document.querySelector('.navigazione-sezioni')`)
  const p = await valuta(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('inizia a scrollare'));
    if (!b) return null; const r = b.getBoundingClientRect(); return { x:r.x+r.width/2,y:r.y+r.height/2 };
  })()`)
  if (p) {
    await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', ...p, button: 'left', clickCount: 1 })
    await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', ...p, button: 'left', clickCount: 1 })
  }
  await aspetta(`!!document.querySelector('dialog.archivio[open]') || (!!document.querySelector('.navigazione-sezioni') && !document.querySelector('main').inert && !document.documentElement.classList.contains('scroll-fermo'))`)
}
