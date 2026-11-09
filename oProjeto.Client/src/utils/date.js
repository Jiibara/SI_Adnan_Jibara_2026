// Datas trafegam como 'AAAA-MM-DD' (ISO) e são exibidas como 'DD/MM/AAAA'.
// Tudo usa o fuso LOCAL (toISOString converte para UTC e pode virar o dia).
const pad = n => String(n).padStart(2, '0')

export const toDateInput = v => (v ? String(v).slice(0, 10) : '')

export const dateToISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const hojeISO = () => dateToISO(new Date())

export const formatarDataBR = v => {
  const iso = toDateInput(v)
  if (!iso || iso.length !== 10) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export const addDias = (dataISO, dias) => {
  if (!dataISO) return null
  const d = new Date(`${dataISO}T00:00:00`)
  d.setDate(d.getDate() + (Number(dias) || 0))
  return d
}

// 'DD/MM/AAAA' -> 'AAAA-MM-DD' (ou null se a data não existir)
export const parseDataBR = value => {
  const m = String(value ?? '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, dia, mes, ano] = m
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia))
  if (d.getFullYear() !== Number(ano) || d.getMonth() !== Number(mes) - 1 || d.getDate() !== Number(dia)) return null
  return `${ano}-${mes}-${dia}`
}
