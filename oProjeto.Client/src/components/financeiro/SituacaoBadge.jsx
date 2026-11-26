import { SITUACOES } from '@/utils/contas'

// Selo colorido com a situação da parcela (Pendente, Paga, Vencida...)
export default function SituacaoBadge({ situacao }) {
  const s = SITUACOES[situacao] ?? SITUACOES.PENDENTE
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 7, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}
