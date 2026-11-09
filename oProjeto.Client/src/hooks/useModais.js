import { useState } from 'react'

// Controla vários modais por nome: modal('fornecedor') devolve { open, onClose }.
export default function useModais() {
  const [abertos, setAbertos] = useState({})
  const abrir = k => setAbertos(a => ({ ...a, [k]: true }))
  const fechar = k => setAbertos(a => ({ ...a, [k]: false }))
  const isOpen = k => !!abertos[k]
  const modal = k => ({ open: isOpen(k), onClose: () => fechar(k) })
  const algumAberto = Object.values(abertos).some(Boolean)
  return { abrir, fechar, isOpen, modal, algumAberto }
}
