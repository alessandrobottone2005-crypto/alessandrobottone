// Campioni locali a cache fredda: stessa macchina, viewport e tempo d’osservazione prima/dopo.
import { apriChrome, attesa } from '../lib/chrome.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
const base = process.argv[2] ?? 'http://127.0.0.1:4173/'
const destinazione = process.argv[3] ?? 'verifiche/risultati/accesso-rapido/misure.json'
const risposta = await fetch(base)
if (!risposta.ok) throw Error(`anteprima non disponibile: ${risposta.status}`)
const risultati = []
for (const path of ['/', '/progetti']) {
 const b = await apriChrome()
 try {
  await b.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `window.__draws=0; for(const C of [WebGLRenderingContext,WebGL2RenderingContext]) for(const k of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const f=C.prototype[k];if(f)C.prototype[k]=function(...a){window.__draws++;return f.apply(this,a)}}` })
  await b.cmd('Page.navigate', { url: new URL(path, base).href })
  await attesa(15000)
  const prima = await b.valuta('window.__draws')
  await attesa(2000)
  const campione = await b.valuta(`({resources:performance.getEntriesByType('resource').map(r=>({url:r.name.split('/').slice(3).join('/'),bytes:r.transferSize})),canvases:document.querySelectorAll('canvas').length,draws2s:window.__draws-${prima}})`)
  if (!campione.resources.length || b.errori.length) throw Error(`campione non valido: ${b.errori.join(', ')}`)
  risultati.push({ path, ...campione })
 } finally { await b.chiudi() }
}
mkdirSync(dirname(destinazione), { recursive: true })
writeFileSync(destinazione, JSON.stringify(risultati, null, 2))
console.log(risultati.map(({resources,...r})=>({...r,richieste:resources.length,byte:resources.reduce((s,a)=>s+a.bytes,0)})))
