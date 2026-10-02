import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { validaProgetti } from './scripts/valida-progetti.ts'
import { sito } from './src/config/sito.ts'
import { archivioMemoria, gestisci } from './api/dediche.ts'

// controlla tutti i progetti: in build si ferma con un messaggio chiaro, in sviluppo avvisa nel terminale
function controllaProgetti(): Plugin {
  const controlla = () => validaProgetti().errori
  return {
    name: 'controlla-progetti',
    buildStart() {
      const errori = controlla()
      if (errori.length) this.error(`\n\nci sono problemi nei progetti:\n\n${errori.join('\n')}\n`)
    },
    configureServer(server) {
      const avvisa = (percorso?: string) => {
        if (percorso && !percorso.includes('/src/content/progetti/')) return
        const errori = controlla()
        if (errori.length) server.config.logger.error(`\nci sono problemi nei progetti:\n${errori.join('\n')}\n`)
      }
      avvisa()
      server.watcher.on('add', avvisa).on('change', avvisa).on('unlink', avvisa)
    },
  }
}

// computer (cc by) e sala (licenza da verificare): senza autore e link la build avvisa (sorgenti/*/README.md)
function controllaCrediti(): Plugin {
  return {
    name: 'controlla-crediti',
    buildStart() {
      const { modello, modelloLink } = sito.computer.crediti
      if (!modelloLink || modello.includes('da indicare'))
        this.warn('crediti del computer incompleti: indica autore e link sketchfab in src/config/sito.ts prima di pubblicare')
      const { ambiente, ambienteLink } = sito.computer.crediti
      if (!ambienteLink || ambiente.includes('da indicare'))
        this.warn('crediti della sala incompleti: indica autore, link e licenza in src/config/sito.ts prima di pubblicare')
    },
  }
}

// /api/dediche in sviluppo: lo stesso gestore della funzione vercel, con le dediche in memoria (niente google)
function dedicheFinte(): Plugin {
  return {
    name: 'dediche-finte',
    apply: 'serve',
    configureServer(server) {
      const archivio = archivioMemoria()
      server.middlewares.use('/api/dediche', async (req, res) => {
        const parti: Buffer[] = []
        for await (const parte of req) parti.push(parte as Buffer)
        const headers = new Headers()
        for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
        const richiesta = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
          method: req.method,
          headers,
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(parti),
        })
        const risposta = await gestisci(richiesta, archivio)
        res.statusCode = risposta.status
        risposta.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await risposta.arrayBuffer()))
      })
    },
  }
}

// precarica il file di outfit (caratteri latini), così il testo non cambia font dopo il caricamento
function precaricaFont(): Plugin {
  const nome = /outfit-latin-wght-normal.*\.woff2$/
  return {
    name: 'precarica-font',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        let href = '/node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2'
        if (ctx.bundle) {
          const file = Object.keys(ctx.bundle).find((f) => nome.test(f))
          if (!file) return
          href = `/${file}`
        }
        return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href, crossorigin: '' }, injectTo: 'head-prepend' }]
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), controllaProgetti(), controllaCrediti(), precaricaFont(), dedicheFinte()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  // librerie dei blocchi e del 3d (scaricate solo quando servono): le preparo subito, così in sviluppo
  // vite non le scopre a metà navigazione ricaricando la pagina con due copie di react
  optimizeDeps: {
    include: [
      'react-pdf',
      'page-flip/dist/js/page-flip.module.js',
      // scacchi: caricato solo all’apertura dell’app, senza questa voce in sviluppo il primo import fallisce
      'chess.js',
      '@react-three/fiber',
      '@react-three/drei/core/OrbitControls',
      '@react-three/drei/core/ContactShadows',
      'three/examples/jsm/loaders/GLTFLoader.js',
      'three/examples/jsm/libs/meshopt_decoder.module.js',
    ],
  },
  build: {
    // nessuna immagine “incollata” dentro il codice: i file restano separati e si scaricano solo quando servono
    assetsInlineLimit: 0,
  },
})
