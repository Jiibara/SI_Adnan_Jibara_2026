import { arredondar2 } from '@/utils/format'
import { addDias, dateToISO } from '@/utils/date'

export const parcelasDaCondicao = c => c?.parcelas ?? c?.Parcelas ?? []

// Gera as parcelas a partir da condição de pagamento.
// Cada parcela guarda o percentual da condição (ex.: 25) e a ÚLTIMA absorve a
// diferença de centavos do arredondamento, para a soma fechar no total da nota.
export const montarParcelas = ({ configuradas, valorTotal, dataEmissao, formaPagamentos }) => {
  const geradas = configuradas.map(p => {
    const percentualOriginal = Number(p.percentual ?? p.Percentual) || 0
    const valor = arredondar2(valorTotal * percentualOriginal / 100)
    const dias = Number(p.dias ?? p.Dias) || 0
    const numeroParcela = p.numeroParcela ?? p.NumeroParcela
    const codFormaPagamento = p.codFormaPagamento ?? p.CodFormaPagamento
    const venc = addDias(dataEmissao, dias)
    const formaNome = formaPagamentos.find(f => String(f.codFormaPagamento) === String(codFormaPagamento))?.formaPagamento ?? ''
    return { numeroParcela, vencimento: venc ? dateToISO(venc) : '', percentual: percentualOriginal, valor, codFormaPagamento, formaNome }
  })

  const totalGerado = arredondar2(geradas.reduce((s, p) => s + (Number(p.valor) || 0), 0))
  const diferenca = arredondar2(valorTotal - totalGerado)
  if (geradas.length > 0 && diferenca !== 0) {
    const ultima = geradas.length - 1
    geradas[ultima] = { ...geradas[ultima], valor: arredondar2(geradas[ultima].valor + diferenca) }
  }
  return geradas
}
