// unica fonte per tutti i testi fissi del sito (claude.md §13).
// tutto in minuscolo, apostrofi tipografici (’).

export const sito = {
  nome: 'alessandro',
  cognome: 'bottone',
  titolo: 'alessandro bottone — designer',
  titoloAssente: 'zzz… torna qui',
  descrizione:
    'alessandro bottone, designer di napoli: branding, illustrazione e 3d.',

  link: {
    instagram: 'https://www.instagram.com/ale.bottone.designer/',
    behance: 'https://www.behance.net/alessanbottone1',
  },
  email: 'alessandrobottone2005@gmail.com',

  // testo pubblicato così com’è: non riscrivere (claude.md §2.6)
  chiSono: [
    'sono alessandro bottone, graphic e brand designer con un percorso di 7 anni di esperienza maturata tra studio e attività sul campo. attualmente frequento il corso di design della comunicazione alla iuad per affinare ulteriormente la mia metodologia progettuale.',
    'nell’ultimo anno ho scelto di ampliare i miei orizzonti creativi esplorando attivamente l’illustrazione e nuove contaminazioni visive, integrando la precisione strategica del branding con la forza espressiva del disegno.',
    'il mio obiettivo è tradurre i valori e la visione dei clienti in sistemi d’identità solidi, maturi e dal forte impatto contemporaneo.',
  ],

  // titoli nascosti (solo screen reader) delle quattro sezioni
  sezioni: {
    header: 'alessandro bottone',
    portfolio: 'portfolio',
    chiSono: 'chi sono',
    contatti: 'contatti',
  },

  etichette: {
    emailCopiata: 'indirizzo email copiato',
    copiata: 'copiata',
    logo: 'logo di alessandro bottone',
    navigazione: 'navigazione principale',
    tornaInizio: 'alessandro bottone — torna all’inizio',
  },

  // etichette dei tre pulsanti dei contatti
  contatti: {
    instagram: 'instagram',
    behance: 'behance',
    email: 'email',
    copyright: (anno: number) => `© ${anno} alessandro bottone. tutti i diritti riservati.`,
  },
  // il computer del portfolio: menu e finestre in stile finder 1984, tutto in minuscolo
  computer: {
    schermo: 'computer del portfolio: cartelle dei progetti divise per disciplina',
    scrivania: 'scrivania',
    menu: { volto: 'menu del volto', archivio: 'archivio', vista: 'vista', speciale: 'speciale' },
    voci: {
      informazioni: 'informazioni',
      apri: 'apri',
      chiudi: 'chiudi',
      perIcona: 'per icona',
      perNome: 'per nome',
      riordina: 'riordina',
    },
    colonne: { nome: 'nome', anno: 'anno', discipline: 'discipline' },
    chiudiFinestra: (titolo: string) => `chiudi ${titolo}`,
    aperta: (titolo: string) => `finestra aperta: ${titolo}`,
    chiusa: (titolo: string) => `finestra chiusa: ${titolo}`,
    avvio: 'accensione del computer',
    copertina: (titolo: string) => `copertina di ${titolo}`,
    // crediti obbligatori del modello (cc by): autore e link vanno completati prima di pubblicare
    crediti: {
      modello: 'modello 3d del computer: autore da indicare · licenza cc by 4.0',
      modelloLink: '',
      ambiente: 'sala di cemento: autore da indicare · licenza da verificare',
      ambienteLink: '',
      carattere: 'carattere chicagoflf di robin casady · dominio pubblico',
    },
  },
  // testi dei blocchi dei progetti (etichette per screen reader e messaggi)
  blocchi: {
    immagine: (titolo: string, n: number) => `immagine ${n} di ${titolo}`,
    paginaPrecedente: 'pagina precedente',
    paginaSuccessiva: 'pagina successiva',
    schermoIntero: 'schermo intero',
    esciSchermoIntero: 'esci dallo schermo intero',
    pdf: (titolo: string) => `documento di ${titolo}, sfogliabile`,
    pdfErrore: 'impossibile aprire il documento',
    modello: (titolo: string) => `modello 3d di ${titolo}, ruotabile`,
    ripristinaVista: 'ripristina la vista',
    riproduci: 'riproduci il video',
    pausa: 'metti in pausa',
    audioSi: 'attiva l’audio',
    audioNo: 'disattiva l’audio',
    avanzamento: 'avanzamento del video',
    video: (titolo: string) => `video di ${titolo}`,
  },
} as const

// ingresso nel sito (docs/audio.md): il pulsante che sblocca lo scroll e avvia l’audio
export const ingresso = {
  pulsante: 'inizia a scrollare',
} as const

// pulsante dell’audio, fisso in basso a destra
export const audio = {
  attiva: 'attiva audio',
  disattiva: 'disattiva audio',
} as const
