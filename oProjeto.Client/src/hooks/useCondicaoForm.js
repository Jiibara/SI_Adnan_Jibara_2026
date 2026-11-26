import { useState } from 'react'
import { CONDICAO_EMPTY } from '@/constants/cadastros'
import { gerarParcelasIguais, somaPercentuais, percentuaisFecham100, diasForaDeOrdem } from '@/utils/condicao'

// Estado do formulário de Condição de Pagamento (nome, percentuais e parcelas).
// Usado na tela de Condições e na consulta de condição dos cadastros (Fornecedor, Cliente).
// Use com <CondicaoCampos ctrl={...} />.
export default function useCondicaoForm() {
  const [form, setForm] = useState(CONDICAO_EMPTY)
  const [original, setOriginal] = useState(CONDICAO_EMPTY)
  const [numParcelasInput, setNumParcelasInput] = useState('1')

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const updParcela = (i, k, v) => setForm(p => ({
    ...p,
    parcelas: p.parcelas.map((x, idx) => idx === i ? { ...x, [k]: v } : x),
  }))

  const gerarParcelas = n => {
    const qtd = parseInt(n) || 0
    if (qtd < 1) return
    setForm(p => ({ ...p, numeroParcelas: qtd, parcelas: gerarParcelasIguais(qtd, p.parcelas ?? []) }))
  }

  const alterarNumParcelas = v => {
    setNumParcelasInput(String(v))
    if (v !== '') gerarParcelas(v)
  }

  // carrega uma condição do banco (ou limpa, sem argumento)
  const carregar = (row = null) => {
    const f = row
      ? {
          ...row,
          parcelas: (row.parcelas ?? []).map((p, i) => ({
            parcela: p.numeroParcela ?? i + 1,
            percentual: String(p.percentual ?? 0),
            dias: p.dias ?? (i + 1) * 30,
            codFormaPagamento: String(p.codFormaPagamento ?? ''),
          })),
        }
      : CONDICAO_EMPTY
    setForm(f)
    setOriginal(f)
    setNumParcelasInput(row ? String(row.numeroParcelas ?? '') : '1')
  }

  const totalPercentual = somaPercentuais(form.parcelas)
  const totalOk = percentuaisFecham100(form.parcelas)
  const foraDeOrdem = diasForaDeOrdem(form.parcelas)

  // mensagem do primeiro problema encontrado, ou null
  const erro = () => {
    if (!form.condicaoPagamento?.trim()) return 'Informe a condição de pagamento.'
    if (!totalOk) return `Total dos percentuais é ${totalPercentual.toFixed(2)}%. Deve ser 100%.`
    if (foraDeOrdem) return 'Os dias das parcelas devem estar em ordem crescente.'
    return null
  }

  // formato esperado pela API
  const payload = () => ({
    ...form,
    parcelas: form.parcelas.map(p => ({
      numeroParcela: parseInt(p.parcela) || 0,
      percentual: parseFloat(p.percentual) || 0,
      dias: parseInt(p.dias) || 0,
      codFormaPagamento: parseInt(p.codFormaPagamento) || 0,
    })),
  })

  return {
    form, upd, updParcela, numParcelasInput, alterarNumParcelas, carregar,
    totalPercentual, totalOk, foraDeOrdem, erro, payload,
    isDirty: JSON.stringify(form) !== JSON.stringify(original),
  }
}
