// Suoni delle applicazioni del computer (motore in src/lib/audio/motore.ts).
import { audio } from '@/lib/audio/motore'

/** tasto del mouse: ogni scelta dell’utente dentro le applicazioni */
export const clic = () => void audio.suona('clic')
/** il disco lavora: apertura di un’applicazione */
export const disco = () => void audio.suona('disco')
/** il floppy scrive: salvataggio o invio */
export const floppy = () => void audio.suona('floppy')
