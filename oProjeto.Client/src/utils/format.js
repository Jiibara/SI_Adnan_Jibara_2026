export const fmtMoney = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const fmtPercent = v =>
  (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const arredondar2 = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100
export const arredondar4 = v => Math.round((Number(v) + Number.EPSILON) * 10000) / 10000
