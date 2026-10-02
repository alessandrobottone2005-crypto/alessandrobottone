// tutte le durate e le lunghezze di scroll del sito, in un posto solo.
// puoi cambiare questi numeri senza toccare il resto del codice.
// durate in secondi, lunghezze in vh (100 = un’altezza dello schermo).

export const movimento = {
  // curve di animazione (claude.md §4)
  ease: {
    entrata: 'expo.out',
    transizione: 'power3.inOut',
  },

  durata: {
    micro: 0.25,
    standard: 0.7,
    grande: 1.4,
    // con movimento ridotto: solo dissolvenze brevi
    ridotta: 0.2,
  },

  // quanto l’animazione “insegue” lo scroll (più alto = più morbido)
  scrub: {
    desktop: 1.2,
    mobile: 0.7,
  },

  // scroll fluido: più basso = più morbido e lento
  lenis: {
    lerp: 0.085,
  },

  preloader: {
    minimo: 1.6,
    massimo: 6,
    breve: 0.8,
  },

  header: {
    pinDesktop: 400,
    pinMobile: 300,
    // percentuale dell’header in cui nome e cognome iniziano a raccogliersi nella navbar
    inizioNomeCompatto: 92,
  },

  computer: {
    // scroll in cui la camera scende verso il computer a terra fino allo schermo (vh)
    avvicinamento: 100,
    // scroll con la camera ferma davanti allo schermo acceso: qui il computer si usa (vh)
    sosta: 120,
    // a che punto dell’avvicinamento il computer si accende, e sotto quale si spegne tornando su
    accendiDa: 0.9,
    spegniSotto: 0.6,
    // durata dell’avvio (s): prima volta e accensioni successive
    avvio: 2.2,
    avvioBreve: 0.7,
    // quanto spazio occupa lo schermo nella sosta su desktop/tablet (frazione della vista)
    altezzaSchermo: 0.5,
    larghezzaSchermo: 0.6,
    // il volto dietro il monitor (vedi docs/computer.md)
    volto: {
      // larghezza del volto rispetto al monitor visto dalla camera: sbucando è più grande del monitor
      fattore: 1.25,
      // nascosto si allontana dietro il monitor e, visto da qui, resta più stretto del monitor
      fattoreNascosto: 0.86,
      // spazio tra il retro del monitor e il volto (unità della scena; il monitor è profondo ≈ 2,3)
      distacco: 0.5,
      // tratto dell’avvicinamento (0–1) in cui il volto lascia il centro e va dietro il monitor
      versoDa: 0.3,
      versoA: 0.55,
      // da qui alla sosta si abbassa e si nasconde
      nascondiDa: 0.85,
      // margine tra il bordo del monitor e le lenti, in frazione della larghezza del volto
      margine: 0.03,
    },
    // nascondino nella sosta: il volto sbuca dai lati in cui si vedono gli occhi (latiDisponibili in percorso.ts:
    // destra/sinistra su desktop, sopra e sopra spostato su tablet verticale, nessuno su telefono),
    // mai dallo stesso lato due volte di fila
    sbircia: {
      uscita: 0.9,
      rientro: 0.7,
      // secondi fuori, poi secondi nascosto prima del lato successivo
      restaMin: 4,
      restaMax: 8,
      nascostoMin: 1.4,
      nascostoMax: 3,
      // inclinazione della testa sbucando di lato (gradi)
      rollio: 9,
      // sbucando di lato: altezza delle lenti lungo il monitor (0 = bordo alto, 1 = bordo basso visibile)
      altezza: 0.38,
      // schermi stretti senza spazio ai lati: destra e sinistra diventano «sopra, spostato» (frazione del volto)
      spostamento: 0.16,
    },
  },

  chiSono: {
    pin: 150,
    versoContatti: 100,
    // scroll (in unità del pin) in cui il logo si rompe nell’ologramma e, all’uscita, si ricompone
    scambio: 14,
  },

  // avatar a punti del chi sono (video di Google Flow, vedi docs/volto.md)
  avatar: {
    // fotogrammi nell’atlante public/avatar/giro.webp (li stampa npm run prepara-avatar)
    fotogrammi: 24,
    // inclinazione massima del piano per su e giù (gradi)
    inclinazioneMax: 11,
    // quanto in fretta la testa raggiunge il cursore (più alto = più rapido)
    smorzamento: 6,
    // secondi senza mouse prima che si guardi intorno da solo
    autonomoDopo: 2,
  },

  volto: {
    battitoMin: 3,
    battitoMax: 7,
    sonnoDopo: 8,
  },

  blocchi: {
    // pdf: durata del giro di pagina, in secondi
    giroPagina: 0.8,
  },

  magnetismo: {
    pulsanti: 12,
  },
} as const

// breakpoint (claude.md §10)
export const media = {
  mobile: '(max-width: 767px)',
  daTablet: '(min-width: 768px)',
  mouse: '(hover: hover) and (pointer: fine)',
  ridotto: '(prefers-reduced-motion: reduce)',
  normale: '(prefers-reduced-motion: no-preference)',
} as const

// dimensioni del volto nelle varie scene
export const volto = {
  preloader: 'max(30vmin, 12rem)',
  header: 'min(86vw, 104svh)',
} as const

// audio (docs/audio.md): volumi da 0 a 1, tempi in secondi
export const audio = {
  volume: {
    // musica di sottofondo
    musica: 0.35,
    effetti: 0.5,
    computer: 0.55,
    // la ventola davanti al computer e l’accordo d’avvio, dentro il bus del computer
    ventola: 0.35,
    accordo: 0.6,
  },
  /** musica abbassata mentre si usa il computer, in dB */
  abbassaDb: -10,
  rampaAbbassa: 0.8,
  entrataMusica: 2,
  dissolvenzaMuto: 0.3,
  entrataCiclo: 0.8,
  uscitaCiclo: 0.6,
  /** l’accordo suona quando lo schermo si illumina, dopo il relè e la ventola */
  ritardoAccordo: 0.9,
  /** durata esatta dei file in ciclo (il codificatore aggiunge qualche ms di silenzio in fondo): vanno
   * aggiornate se cambiano in scripts/prepara-audio.mjs */
  cicli: { musica: 92.16, ventola: 6 },
} as const
