// prepara l’audio del sito (docs/audio.md): dagli originali in sorgenti/audio/ (fuori da git) crea in public/audio/
// la base musicale in loop e i suoni brevi, ciascuno in due formati: .webm (opus) e .m4a (aac, per safari).
//   npm run prepara-audio                       → legge sorgenti/audio/
//   npm run prepara-audio -- <cartella>         → legge gli originali da un’altra cartella (es. un worktree)
// serve ffmpeg (/opt/homebrew/bin/ffmpeg o nel PATH). L’accordo d’avvio è sintetizzato qui: nessun file di partenza.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const radice = path.resolve(import.meta.dirname, '..')
const sorgenti = path.resolve(process.argv[2] ?? path.join(radice, 'sorgenti/audio'))
const uscita = path.join(radice, 'public/audio')
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg'
const SR = 44100

// aac di macos (AudioToolbox) se c’è, altrimenti quello di ffmpeg
const encoder = execFileSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' })
const AAC = /\baac_at\b/.test(encoder) ? 'aac_at' : 'aac'

// ---------- lettura e scrittura ----------

/** decodifica in canali float a 44,1 kHz */
function leggi(file, canali = 1) {
  const p = path.join(sorgenti, file)
  if (!fs.existsSync(p)) throw new Error(`manca l’originale ${p} (vedi sorgenti/audio/README.md)`)
  const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', p, '-ac', String(canali), '-ar', String(SR), '-f', 'f32le', '-'], {
    maxBuffer: 1 << 30,
  })
  const tutto = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4)
  return Array.from({ length: canali }, (_, c) => Float32Array.from({ length: tutto.length / canali }, (_, i) => tutto[i * canali + c]))
}

/** scrive .webm e .m4a; restituisce i byte */
function scrivi(nome, ch, { opus, aac }) {
  const n = ch[0].length
  const inter = new Float32Array(n * ch.length)
  for (let i = 0; i < n; i++) for (let c = 0; c < ch.length; c++) inter[i * ch.length + c] = ch[c][i]
  const tmp = path.join(os.tmpdir(), `prepara-audio-${nome}.f32`)
  fs.writeFileSync(tmp, Buffer.from(inter.buffer))
  const ingresso = ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', String(ch.length), '-i', tmp]
  const webm = path.join(uscita, `${nome}.webm`)
  const m4a = path.join(uscita, `${nome}.m4a`)
  execFileSync(FFMPEG, [...ingresso, '-c:a', 'libopus', '-b:a', opus, '-map_metadata', '-1', webm])
  execFileSync(FFMPEG, [...ingresso, '-c:a', AAC, '-b:a', aac, '-movflags', '+faststart', '-map_metadata', '-1', m4a])
  fs.rmSync(tmp)
  const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0)
  console.log(`  ${nome}: ${(n / SR).toFixed(2)} s · webm ${kb(webm)} kB · m4a ${kb(m4a)} kB`)
}

// ---------- operazioni sul segnale ----------

const sec = (s) => Math.round(s * SR)
const taglia = (ch, da, a) => ch.map((x) => x.slice(sec(da), a === undefined ? undefined : sec(a)))

/** dissolvenze d’entrata e d’uscita (secondi), curva morbida */
function dissolvi(ch, entrata, uscitaS) {
  for (const x of ch) {
    const e = sec(entrata), u = sec(uscitaS)
    for (let i = 0; i < e && i < x.length; i++) x[i] *= Math.sin(((i / e) * Math.PI) / 2) ** 2
    for (let i = 0; i < u && i < x.length; i++) x[x.length - 1 - i] *= Math.sin(((i / u) * Math.PI) / 2) ** 2
  }
  return ch
}

/** porta il picco a `db` dBFS */
function normalizzaPicco(ch, db = -1) {
  let p = 0
  for (const x of ch) for (const v of x) p = Math.max(p, Math.abs(v))
  const g = 10 ** (db / 20) / (p || 1)
  return ch.map((x) => x.map((v) => v * g))
}

/** porta il livello medio (rms) a `db` dBFS, poi limita il picco a -1 */
function normalizzaRms(ch, db) {
  let s = 0, n = 0
  for (const x of ch)
    for (const v of x) {
      s += v * v
      n++
    }
  const g = 10 ** (db / 20) / Math.sqrt(s / n || 1)
  const out = ch.map((x) => x.map((v) => v * g))
  let p = 0
  for (const x of out) for (const v of x) p = Math.max(p, Math.abs(v))
  return p > 0.89 ? normalizzaPicco(out, -1) : out
}

/** somma `b` dentro `a` a partire da `t` secondi, con guadagno */
function mescola(a, b, t = 0, g = 1) {
  const o = sec(t)
  const n = Math.max(a[0].length, o + b[0].length)
  return a.map((x, c) => {
    const y = new Float32Array(n)
    y.set(x)
    const z = b[Math.min(c, b.length - 1)]
    for (let i = 0; i < z.length; i++) y[o + i] += z[i] * g
    return y
  })
}

/**
 * ciclo senza giunta: tiene `durata` secondi da `inizio` e, nei primi `dissolvenza` secondi, mescola a potenza costante
 * il suono che verrebbe subito dopo la fine. Così l’ultimo campione prosegue naturalmente nel primo.
 */
function cicla(ch, inizio, durata, dissolvenza) {
  const s = sec(inizio), l = sec(durata), f = sec(dissolvenza)
  return ch.map((x) => {
    if (s + l + f > x.length) throw new Error('originale troppo corto per il ciclo')
    const y = x.slice(s, s + l)
    for (let i = 0; i < f; i++) {
      const t = i / f
      y[i] = x[s + i] * Math.sin((t * Math.PI) / 2) + x[s + l + i] * Math.cos((t * Math.PI) / 2)
    }
    return y
  })
}

// ---------- base musicale ----------

/**
 * trova il ciclo musicale: battute da 4 tempi a `bpm`, `battute` di lunghezza. Sceglie l’inizio (su una battuta)
 * dove la sezione di partenza somiglia di più a quella d’arrivo, poi affina la lunghezza di qualche millisecondo
 * con la correlazione dei campioni, così il taglio cade esattamente sul battere.
 */
function cicloMusicale(ch, { bpm, battute, dissolvenza }) {
  const mono = ch[0].map((v, i) => (v + ch[1][i]) / 2)
  const battuta = (60 / bpm) * 4
  const lunghezza = battute * battuta
  // inviluppo per sedicesimi: descrive il groove della battuta
  const passo = sec(battuta / 16)
  const inv = new Float32Array(Math.floor(mono.length / passo))
  for (let i = 0; i < inv.length; i++) {
    let s = 0
    for (let j = 0; j < passo; j++) s += mono[i * passo + j] ** 2
    inv[i] = Math.sqrt(s / passo)
  }
  const confronta = (a, b, n) => {
    let s = 0
    for (let i = 0; i < n; i++) s += Math.abs(inv[a + i] - inv[b + i])
    return s
  }
  const totale = mono.length / SR
  let migliore = { inizio: 0, d: Infinity }
  for (let b = 0; b * battuta + lunghezza + 4 * battuta < totale; b++) {
    const a = Math.round((b * battuta * SR) / passo)
    const z = Math.round(((b * battuta + lunghezza) * SR) / passo)
    // due battute prima e dopo il taglio
    const d = confronta(a - 32 < 0 ? a : a - 32, z - 32 < 0 ? z : z - 32, 64)
    if (d < migliore.d) migliore = { inizio: b * battuta, d }
  }
  // affina: lunghezza ±25 ms con la correlazione dei campioni intorno al taglio
  const s = sec(migliore.inizio), w = sec(0.4)
  let l = sec(lunghezza), best = -Infinity
  for (let k = -sec(0.025); k <= sec(0.025); k++) {
    const L = sec(lunghezza) + k
    let c = 0
    for (let i = 0; i < w; i += 2) c += mono[s + i] * mono[s + L + i]
    if (c > best) {
      best = c
      l = L
    }
  }
  console.log(`  ciclo: inizio ${migliore.inizio.toFixed(3)} s, ${battute} battute = ${(l / SR).toFixed(3)} s`)
  return cicla(ch, migliore.inizio, l / SR, dissolvenza)
}

// ---------- accordo d’avvio (originale, sintetizzato) ----------

/**
 * accordo d’avvio del computer, originale: si bemolle maggiore con nona e settima, aperto, voci di sinusoidi con poche
 * armoniche e un leggero battimento; attacco morbido, coda lunga. Non imita nessun suono di sistema esistente.
 */
function accordo() {
  const durata = 3.2
  const n = sec(durata)
  const y = new Float32Array(n)
  const hz = (m) => 440 * 2 ** ((m - 69) / 12)
  // sib2 fa3 re4 la4 do5
  const note = [46, 53, 62, 69, 72]
  note.forEach((m, k) => {
    const ritardo = k * 0.018 // leggero arpeggio, come una mano sul tasto
    for (const [armonica, peso] of [[1, 1], [2, 0.32], [3, 0.12], [4, 0.05]]) {
      for (const scordo of [-0.0016, 0.0016]) {
        const f = hz(m) * armonica * (1 + scordo)
        const d = sec(ritardo)
        for (let i = d; i < n; i++) {
          const t = (i - d) / SR
          const att = Math.min(1, t / 0.012)
          // le armoniche alte si spengono prima: il suono si scurisce mentre svanisce
          const dec = Math.exp(-t * (1.1 + armonica * 0.55))
          y[i] += Math.sin(2 * Math.PI * f * t) * peso * att * dec * (k === 0 ? 1.2 : 0.8)
        }
      }
    }
  })
  return dissolvi(normalizzaPicco([y], -3), 0, 0.4)
}

// ---------- elenco dei file ----------

fs.mkdirSync(uscita, { recursive: true })
console.log(`originali da ${sorgenti}`)
const effetto = { opus: '48k', aac: '64k' }

// musica: monume (pixabay), ciclo di 48 battute a 125 bpm, stereo
console.log('musica')
scrivi('musica', normalizzaPicco(cicloMusicale(leggi('monume-techno-570702.mp3', 2), { bpm: 125, battute: 48, dissolvenza: 0.06 }), -1), {
  opus: '96k',
  aac: '128k',
})

console.log('computer')
// ventola: ohrpilot, ciclo di 6 s con dissolvenza incrociata di 1 s
scrivi('ventola', normalizzaRms(cicla(leggi('freesound-181995.mp3'), 1, 6, 1), -20), effetto)
// disco: crinkem, i primi 2,6 s di lettura
scrivi('disco', dissolvi(normalizzaPicco(taglia(leggi('freesound-493891.mp3'), 0, 2.6)), 0.01, 0.5), effetto)
// clic: pixeliota, solo il colpo
scrivi('clic', dissolvi(normalizzaPicco(taglia(leggi('freesound-678248.mp3'), 0.27, 0.6)), 0.002, 0.08), effetto)
// floppy: asiekierka, accesso breve
scrivi('floppy', dissolvi(normalizzaPicco(leggi('freesound-628247.mp3')), 0.005, 0.1), effetto)
// accensione: relè (bassmosphere) e poi la ventola che parte (justeluis)
{
  const rele = normalizzaPicco(leggi('freesound-384701.mp3'), -3)
  const avvio = dissolvi(normalizzaRms(taglia(leggi('freesound-185049.mp3'), 0, 4.2), -22), 0.15, 1.2)
  scrivi('accensione', normalizzaPicco(mescola(rele, avvio, 0.08)), effetto)
}
// spegnimento: relè e la ventola che rallenta (supersnd)
{
  const rele = normalizzaPicco(leggi('freesound-384701.mp3'), -4)
  const giu = dissolvi(normalizzaRms(leggi('freesound-331424.mp3'), -22), 0.02, 0.6)
  scrivi('spegnimento', normalizzaPicco(mescola(rele, giu, 0.03)), effetto)
}
// accordo d’avvio sintetizzato
scrivi('accordo', accordo(), effetto)

console.log('glitch')
// quattro disturbi brevi: tadaizm, readeonly (statico), flying_deer_fx, melbourne34
scrivi('glitch-1', dissolvi(normalizzaPicco(leggi('freesound-458065.mp3')), 0.003, 0.05), effetto)
scrivi('glitch-2', dissolvi(normalizzaPicco(leggi('freesound-47646.mp3')), 0.003, 0.05), effetto)
scrivi('glitch-3', dissolvi(normalizzaPicco(taglia(leggi('freesound-369145.mp3'), 0, 0.6)), 0.003, 0.12), effetto)
scrivi('glitch-4', dissolvi(normalizzaPicco(taglia(leggi('freesound-511583.mp3'), 0, 0.5)), 0.003, 0.1), effetto)
console.log(`fatto: ${uscita}`)
