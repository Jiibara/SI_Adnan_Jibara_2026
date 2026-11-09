import { ConfirmDialog } from '@/components/UI'

// "Fechar sem salvar?" — ligado ao retorno do useModalGuard.
export default function ConfirmFechar({ guard }) {
  return (
    <ConfirmDialog
      open={guard.confirming}
      icon="❓" title="Fechar sem salvar?"
      message="Tem certeza que quer fechar? Tudo será apagado."
      confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
      onClose={guard.cancelClose} onConfirm={guard.confirmClose}
    />
  )
}
