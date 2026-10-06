import { useEffect, useState } from 'react'

export function useModalGuard({ isOpen, isDirty, onClose, onSave, onDiscard, paused = false }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => { if (isOpen) setConfirming(false) }, [isOpen])

  const attemptClose = () => (isDirty ? setConfirming(true) : onClose())
  const confirmClose = () => { setConfirming(false); onDiscard?.(); onClose() }
  const cancelClose = () => setConfirming(false)

  useEffect(() => {
    if (!isOpen || paused) return

    const handler = (e) => {
      if (confirming) {
        if (e.key === 'Escape') { e.preventDefault(); cancelClose() }
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); confirmClose() }
        return
      }

      if (e.key === 'Escape') { e.preventDefault(); attemptClose() }

      if (e.key === 'Enter' && onSave && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        onSave()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, isDirty, confirming, onSave, onDiscard, paused])

  return { confirming, attemptClose, confirmClose, cancelClose }
}
