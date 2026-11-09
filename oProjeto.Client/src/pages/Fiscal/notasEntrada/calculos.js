import { arredondar2 } from '@/utils/format'

export const getDescontoItem = it => Number(it?.descontoValor ?? it?.desconto ?? 0) || 0

// Valor unitário JÁ com o desconto abatido (o desconto sai do valor unitário)
// descontoValor é o desconto TOTAL do item (desconto por unidade x quantidade).
export const getUnitarioLiquido = it => {
  const unit = Number(it?.valorUnitario) || 0
  const qtd = Number(it?.quantidade) || 0
  if (qtd > 0) return Math.max(unit - getDescontoItem(it) / qtd, 0)   // exato, sem depender do %
  const perc = Number(it?.descontoPercentual) || 0                    // ex.: item de pedido ainda sem quantidade
  return Math.max(unit * (1 - perc / 100), 0)
}

export const valorProdutosCalc = lista =>
  (lista ?? []).reduce((acc, it) => acc + (Number(it.valorTotal) || 0), 0)

export const somaDescontosItens = lista =>
  (lista ?? []).reduce((acc, it) => acc + getDescontoItem(it), 0)

// vp (soma dos itens) já vem com os descontos abatidos do valor unitário; não subtrair de novo
export const valorTotalCalc = (vp, vf, vs, od) =>
  arredondar2(vp + (Number(vf) || 0) + (Number(vs) || 0) + (Number(od) || 0))

// Rateia frete/seguro/outras despesas proporcionalmente ao valor de cada item
// e calcula o valor unitário líquido e o custo final unitário.
export const comRateio = (lista, valorFrete, valorSeguro, outrasDespesas) => {
  const totalProdutos = valorProdutosCalc(lista)
  return (lista ?? []).map(it => {
    const proporcao = totalProdutos > 0 ? (Number(it.valorTotal) || 0) / totalProdutos : 0
    const rateioFrete = (Number(valorFrete) || 0) * proporcao
    const rateioSeguro = (Number(valorSeguro) || 0) * proporcao
    const rateioOutras = (Number(outrasDespesas) || 0) * proporcao
    const valorUnitarioLiquido = getUnitarioLiquido(it)
    const qtd = Number(it.quantidade) || 0
    const custoFinal = qtd > 0
      ? valorUnitarioLiquido + (rateioFrete + rateioSeguro + rateioOutras) / qtd
      : valorUnitarioLiquido
    return { ...it, valorUnitarioLiquido, rateioFrete, rateioSeguro, rateioOutras, custoFinal }
  })
}