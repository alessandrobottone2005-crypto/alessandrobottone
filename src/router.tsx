// La home resta montata; /progetti e /progetti/:slug aprono l’archivio nel top layer.
import { Navigate, Route, Routes, useParams } from 'react-router'
import { trovaProgetto } from './lib/progetti'

// un indirizzo di progetto inesistente torna alla home (anche prima che il computer si accenda)
function ProgettoEsistente() {
  const { slug } = useParams()
  return trovaProgetto(slug) ? null : <Navigate to="/" replace />
}

export function RotteModali() {
  return (
    <Routes>
      <Route path="/" element={null} />
      <Route path="/progetti" element={null} />
      <Route path="/progetti/:slug" element={<ProgettoEsistente />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
