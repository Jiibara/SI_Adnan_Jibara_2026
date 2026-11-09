import { arredondar2 } from '@/utils/format'

// Cálculos comuns às notas de entrada e de saída.

// Desconto TOTAL do item (R$)
export const getDescontoItem = it => Number(it?.descontoValor ?? it?.desconto ?? 0) || 0

// Valor unitário JÁ com o desconto abatido (o desconto sai do valor unitário).
// descontoValor é o desconto TOTAL do item (desconto por unidade x quantidade).
export const getUnitarioLiquido = it => {
  const unit = Number(it?.valorUnitario) || 0
  const qtd = Number(it?.quantidade) || 0
  if (qtd > 0) return Math.max(unit - getDescontoItem(it) / qtd, 0)   // exato, sem depender do %
  const perc = Number(it?.descontoPercentual) || 0                    // ex.: item de pedido ainda sem quantidade
  return Math.max(unit * (1 - perc / 100), 0)
}

// Devolve os itens com valorUnitarioLiquido calculado (para exibir na grade)
export const comUnitarioLiquido = lista =>
  (lista ?? []).map(it => ({ ...it, valorUnitarioLiquido: getUnitarioLiquido(it) }))

// Soma dos itens (cada item já com o desconto abatido)
export const valorProdutosCalc = lista =>
  (lista ?? []).reduce((acc, it) => acc + (Number(it.valorTotal) || 0), 0)

export const somaDescontosItens = lista =>
  (lista ?? []).reduce((acc, it) => acc + getDescontoItem(it), 0)

// vp (soma dos itens) já vem com os descontos abatidos; não subtrair de novo
export const valorTotalCalc = (vp, vf, vs, od) =>
  arredondar2(vp + (Number(vf) || 0) + (Number(vs) || 0) + (Number(od) || 0))
