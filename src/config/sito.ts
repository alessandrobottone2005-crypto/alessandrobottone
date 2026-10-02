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
    // si accende con un clic sul monitor o sul mouse 3d (o Invio sul pulsante invisibile sopra il monitor)
    accensione: {
      pulsante: 'accendi il computer',
      // parola del cursore del sito sopra monitor e mouse
      cursore: 'accendi',
      // il saluto scritto in corsivo pixel durante l’avvio (disegnato, qui per gli screen reader)
      saluto: 'hello',
    },
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
  // applicazioni sulla scrivania del computer (docs/computer.md#applicazioni)
  app: {
    caricamento: 'caricamento…',
    errore: 'l’applicazione non si apre. riprova più tardi.',
    scacchi: {
      nome: 'scacchi',
      scacchiera: 'scacchiera: frecce per muoversi, invio per scegliere',
      livello: 'livello',
      facile: 'facile',
      medio: 'medio',
      nuova: 'nuova partita',
      tocca: 'tocca a te: muovi i bianchi',
      pensa: 'il computer pensa…',
      scacco: 'scacco!',
      vinto: 'scaccomatto: hai vinto!',
      perso: 'scaccomatto: vince il computer',
      patta: (motivo: string) => `patta: ${motivo}`,
      motivi: {
        stallo: 'stallo',
        materiale: 'materiale insufficiente',
        ripetizione: 'tripla ripetizione',
        cinquanta: 'regola delle cinquanta mosse',
      },
      promozione: 'promuovi il pedone a',
      annulla: 'annulla',
      pezzi: { p: 'pedone', n: 'cavallo', b: 'alfiere', r: 'torre', q: 'regina', k: 're' },
      colori: { w: 'bianco', b: 'nero' },
      casa: (casa: string, pezzo?: string) => (pezzo ? `${casa}, ${pezzo}` : `${casa}, vuota`),
      mossaComputer: (mossa: string) => `il computer muove: ${mossa}`,
    },
    paint: {
      nome: 'paint',
      tela: 'tela da disegno: trascina per disegnare; da tastiera frecce per muoversi, invio per disegnare',
      strumenti: 'strumenti',
      strumento: {
        matita: 'matita',
        pennello: 'pennello',
        gomma: 'gomma',
        linea: 'linea',
        rettangolo: 'rettangolo',
        pieno: 'rettangolo pieno',
        secchiello: 'secchiello',
      },
      spessore: 'spessore',
      trama: 'trama',
      trame: ['nero', 'bianco', 'grigio', 'grigio chiaro', 'grigio scuro', 'righe', 'colonne', 'diagonali', 'mattoni', 'puntini'],
      annulla: 'annulla',
      cancella: 'cancella tutto',
      dedica: 'dedica',
      dedicaSegnaposto: 'scrivi una dedica breve',
      campoNome: 'nome (facoltativo, pubblico)',
      invia: 'invia',
      invio: 'invio…',
      inviata: 'dedica inviata: la trovi nella cartella dediche',
      vuota: 'prima disegna qualcosa',
      errori: {
        'non-configurato': 'le dediche non sono ancora attive. riprova tra qualche giorno.',
        'troppi-invii': 'hai già inviato tante dediche: riprova tra un’ora.',
        doppione: 'questa dedica è già arrivata.',
        generico: 'invio non riuscito. riprova più tardi.',
      },
      caratteri: (n: number, max: number) => `${n}/${max}`,
    },
    dediche: {
      nome: 'dediche',
      vuota: 'nessuna dedica, per ora. disegnane una con paint.',
      nonAttive: 'le dediche non sono ancora attive.',
      errore: 'le dediche non si caricano. riprova più tardi.',
      precedenti: 'più recenti',
      successive: 'meno recenti',
      pagina: (n: number, di: number) => `pagina ${n} di ${di}`,
      aggiorna: 'aggiorna',
      indietro: 'indietro',
      segnala: 'segnala',
      segnalata: 'grazie: segnalazione inviata.',
      anonimo: 'anonimo',
      disegno: (nome: string) => `disegno di ${nome}`,
      apri: (nome: string, dedica: string) => `apri la dedica di ${nome}${dedica ? `: ${dedica}` : ''}`,
    },
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
