import { arredondar2 } from '@/utils/format'
import { getUnitarioLiquido } from '@/utils/notaCalculos'

// Rateio de frete/seguro/outras despesas por item (proporcional ao valor do item),
// valor unitário líquido (desconto já abatido) e custo final unitário.
export const comRateioSaida = (produtos, valorProdutos, valorFrete, valorSeguro, outrasDespesas) =>
  (produtos ?? []).map(item => {
    const proporcao = valorProdutos > 0 ? (Number(item.valorTotal) || 0) / valorProdutos : 0
    const rateioFrete = arredondar2((Number(valorFrete) || 0) * proporcao)
    const rateioSeguro = arredondar2((Number(valorSeguro) || 0) * proporcao)
    const rateioOutras = arredondar2((Number(outrasDespesas) || 0) * proporcao)
    const valorUnitarioLiquido = getUnitarioLiquido(item)
    const qtd = Number(item.quantidade) || 0
    const custoFinal = qtd > 0
      ? arredondar2(valorUnitarioLiquido + (rateioFrete + rateioSeguro + rateioOutras) / qtd)
      : valorUnitarioLiquido
    return { ...item, valorUnitarioLiquido, rateioFrete, rateioSeguro, rateioOutras, custoFinal }
  })
