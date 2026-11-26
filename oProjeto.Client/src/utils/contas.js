// Regras comuns de Contas a Pagar, Contas a Pagar Avulsas e Contas a Receber.
import { arredondar2 } from '@/utils/format'
import { toDateInput, hojeISO } from '@/utils/date'

// Situações de uma parcela: rótulo do selo, texto do filtro e cores
export const SITUACOES = {
  PENDENTE: { label: 'Pendente', filtro: 'Pendentes', bg: '#fff7ed', color: '#c2410c' },
  PARCIAL: { label: 'Parcial', filtro: 'Parciais', bg: '#eff6ff', color: '#2563eb' },
  PAGA: { label: 'Paga', filtro: 'Pagas', bg: '#ecfdf5', color: '#047857' },
  RECEBIDO: { label: 'Recebido', filtro: 'Recebidas', bg: '#ecfdf5', color: '#047857' },
  VENCIDA: { label: 'Vencida', filtro: 'Vencidas', bg: '#fef2f2', color: '#b91c1c' },
  CANCELADA: { label: 'Cancelada', filtro: 'Canceladas', bg: '#f1f5f9', color: '#64748b' },
}

// Dias entre duas datas 'AAAA-MM-DD' (0 se fim <= inicio)
export const diasEntre = (inicio, fim) => {
  if (!inicio || !fim) return 0
  const a = new Date(`${toDateInput(inicio)}T00:00:00`)
  const b = new Date(`${toDateInput(fim)}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.max(0, Math.round((b - a) / 86400000))
}

// Situação real da parcela, considerando valores e vencimento.
//  quitada    'PAGA' (contas a pagar) ou 'RECEBIDO' (contas a receber)
//  campoPago  'valorPago' ou 'valorRecebido'
export const situacaoConta = (r, { quitada = 'PAGA', campoPago = 'valorPago' } = {}) => {
  const situacao = String(r.situacao ?? '').toUpperCase()
  const original = Number(r.valorOriginal) || 0
  const pago = Number(r[campoPago]) || 0

  if (situacao === 'CANCELADA') return 'CANCELADA'
  if (situacao === quitada || (original > 0 && pago >= original)) return quitada
  if (situacao === 'PARCIAL' || (pago > 0 && pago < original)) return 'PARCIAL'
  if (situacao === 'VENCIDA') return 'VENCIDA'

  const vencimento = toDateInput(r.dataVencimento)
  if (vencimento && vencimento < hojeISO()) return 'VENCIDA'
  return 'PENDENTE'
}

// Valores da baixa (pagamento/recebimento) — mesma regra do servidor:
// em atraso: multa (uma vez) + juros proporcionais aos dias (percentual ao mês);
// no prazo: desconto. Os percentuais vêm da condição de pagamento, gravados na parcela.
export const calcularBaixa = (conta, dataBaixa) => {
  const original = Number(conta?.valorOriginal ?? conta?.valorTotal ?? 0) || 0
  const pDesc = Number(conta?.percentualDesconto) || 0
  const pJuros = Number(conta?.percentualJuros) || 0
  const pMulta = Number(conta?.percentualMulta) || 0

  const vencimento = toDateInput(conta?.dataVencimento)
  const diasAtraso = diasEntre(vencimento, dataBaixa)
  const diasAntecipacao = diasEntre(dataBaixa, vencimento)
  const atrasado = diasAtraso > 0

  const desconto = atrasado ? 0 : arredondar2(original * pDesc / 100)
  const multa = atrasado ? arredondar2(original * pMulta / 100) : 0
  const juros = atrasado ? arredondar2(original * pJuros / 100 * diasAtraso / 30) : 0
  const valorFinal = arredondar2(original - desconto + juros + multa)

  return { original, desconto, juros, multa, valorFinal, diasAtraso, diasAntecipacao, atrasado, pDesc, pJuros, pMulta }
}
