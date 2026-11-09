import { arredondar2 } from '@/utils/format'
import { getDescontoItem } from '@/utils/notaCalculos'

// Rateio de frete/seguro/outras despesas proporcional ao valor LÍQUIDO de cada item.
// O último item absorve a diferença de centavos, para a soma dos rateios fechar no total.
// Também recalcula o valor líquido do item (bruto - desconto) e o custo final unitário.
export const comRateioCompra = (produtosList, frete, seguro, outras) => {
  const lista = produtosList ?? []
  const liquidos = lista.map(it => {
    const bruto = (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0)
    return Math.max(0, bruto - getDescontoItem(it))
  })
  const base = liquidos.reduce((s, v) => s + v, 0)

  const acumulado = { frete: 0, seguro: 0, outras: 0 }
  const result = lista.map((it, i) => {
    const liquido = liquidos[i]
    const proporcao = base > 0 ? liquido / base : 0
    const rateioFrete = arredondar2((Number(frete) || 0) * proporcao)
    const rateioSeguro = arredondar2((Number(seguro) || 0) * proporcao)
    const rateioOutras = arredondar2((Number(outras) || 0) * proporcao)
    acumulado.frete += rateioFrete
    acumulado.seguro += rateioSeguro
    acumulado.outras += rateioOutras
    return { ...it, valorTotal: arredondar2(liquido), rateioFrete, rateioSeguro, rateioOutras }
  })

  if (result.length > 0 && base > 0) {
    const ultimo = result.length - 1
    result[ultimo] = {
      ...result[ultimo],
      rateioFrete: arredondar2(result[ultimo].rateioFrete + arredondar2((Number(frete) || 0) - acumulado.frete)),
      rateioSeguro: arredondar2(result[ultimo].rateioSeguro + arredondar2((Number(seguro) || 0) - acumulado.seguro)),
      rateioOutras: arredondar2(result[ultimo].rateioOutras + arredondar2((Number(outras) || 0) - acumulado.outras)),
    }
  }

  return result.map(it => {
    const qtd = Number(it.quantidade) || 0
    const custoTotalItem = arredondar2(it.valorTotal + it.rateioFrete + it.rateioSeguro + it.rateioOutras)
    return { ...it, custoFinal: qtd > 0 ? arredondar2(custoTotalItem / qtd) : 0 }
  })
}
