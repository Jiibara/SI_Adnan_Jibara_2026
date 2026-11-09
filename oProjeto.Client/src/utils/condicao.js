// Regras das parcelas de uma Condição de Pagamento (percentual, dias e forma de pagamento).
// Os percentuais podem vir como texto (campo do formulário) ou número.

// Divide 100% em `qtd` parcelas iguais; a última absorve a diferença de centavos.
// Mantém dias e forma já escolhidos nas parcelas antigas.
export const gerarParcelasIguais = (qtd, antigas = []) => {
  const base = parseFloat((100 / qtd).toFixed(2))
  const ajuste = parseFloat((100 - base * (qtd - 1)).toFixed(2))
  return Array.from({ length: qtd }, (_, i) => ({
    parcela: i + 1,
    percentual: String(i === qtd - 1 ? ajuste : base),
    dias: antigas[i]?.dias ?? (i + 1) * 30,
    codFormaPagamento: antigas[i]?.codFormaPagamento ?? '',
  }))
}

export const somaPercentuais = parcelas =>
  (parcelas ?? []).reduce((s, p) => s + (parseFloat(p.percentual) || 0), 0)

export const percentuaisFecham100 = parcelas => Math.abs(somaPercentuais(parcelas) - 100) < 0.01

// true quando algum prazo não é maior que o da parcela anterior
export const diasForaDeOrdem = parcelas =>
  (parcelas ?? []).some((p, i, arr) => i > 0 && parseInt(p.dias) <= parseInt(arr[i - 1].dias))
