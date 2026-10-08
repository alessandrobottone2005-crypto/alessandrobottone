import { useLayoutEffect, useState, type RefObject } from 'react'

/** Attende anche l’altezza dei PDF ricostruiti quando si torna da contatti. */
export function usePosizioneProgetto(area: RefObject<HTMLDivElement | null>, chiave: string, aperto: boolean) {
  const [posizioni] = useState(() => new Map<string, number>())
  const [focusSalvati] = useState(() => new Set<string>())
  const destinazione = posizioni.get(chiave) ?? 0
  useLayoutEffect(() => {
    const el = area.current
    if (!aperto || !el) return
    const y = posizioni.get(chiave) ?? 0
    let ripristina = y > 0
    let timer = 0
    let frameFocus = 0
    const observer = new ResizeObserver(() => applica())
    const termina = () => { ripristina = false; observer.disconnect(); clearTimeout(timer) }
    const applica = () => {
      el.scrollTop = y
      if (el.scrollHeight - el.clientHeight >= y - 1) {
        termina()
        if (focusSalvati.has(chiave)) frameFocus = requestAnimationFrame(() => el.querySelector<HTMLElement>('.archivio-contatti button')?.focus({ preventScroll: true }))
      }
    }
    const registra = () => { if (!ripristina) posizioni.set(chiave, el.scrollTop) }
    const interrompi = () => { termina(); registra() }
    const ricordaFocus = (e: FocusEvent) => {
      if ((e.target as Element).closest('.archivio-contatti')) focusSalvati.add(chiave)
      else focusSalvati.delete(chiave)
    }
    if (ripristina) {
      observer.observe(el)
      if (el.firstElementChild) observer.observe(el.firstElementChild)
      timer = window.setTimeout(termina, 15000)
    }
    applica()
    el.addEventListener('focusin', ricordaFocus)
    el.addEventListener('scroll', registra, { passive: true })
    el.addEventListener('wheel', interrompi, { passive: true })
    el.addEventListener('touchstart', interrompi, { passive: true })
    return () => {
      termina()
      cancelAnimationFrame(frameFocus)
      el.removeEventListener('focusin', ricordaFocus)
      el.removeEventListener('scroll', registra)
      el.removeEventListener('wheel', interrompi)
      el.removeEventListener('touchstart', interrompi)
    }
  }, [area, chiave, aperto, posizioni, focusSalvati])
  return destinazione > 0
}
