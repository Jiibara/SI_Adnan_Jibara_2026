import { useMemo, useState } from 'react'
import { toDateInput } from '@/utils/date'

const VAZIO = { parceiro: '', situacao: '', tipo: '', vencInicial: '', vencFinal: '' }

// Filtros das telas de contas (parceiro, situação, tipo e período de vencimento).
// As linhas precisam ter codParceiro, nomeParceiro e situacaoAtual.
// Use com <FiltrosContas ctrl={...} />.
export default function useFiltrosContas(linhas) {
  const [filtros, setFiltros] = useState(VAZIO)

  const upd = (k, v) => setFiltros(f => ({ ...f, [k]: v }))
  const limpar = () => setFiltros(VAZIO)
  const ativos = Object.values(filtros).some(Boolean)

  // parceiros presentes nas contas, para o select
  const parceiros = useMemo(() => {
    const mapa = new Map()
    linhas.forEach(r => { if (r.codParceiro && !mapa.has(r.codParceiro)) mapa.set(r.codParceiro, r.nomeParceiro) })
    return [...mapa.entries()]
      .sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'pt-BR'))
      .map(([value, label]) => ({ value, label }))
  }, [linhas])

  const filtradas = useMemo(() => linhas.filter(r => {
    if (filtros.parceiro && String(r.codParceiro) !== String(filtros.parceiro)) return false
    if (filtros.situacao && r.situacaoAtual !== filtros.situacao) return false
    if (filtros.tipo && r.tipoNota !== filtros.tipo) return false
    const vencimento = toDateInput(r.dataVencimento)
    if (filtros.vencInicial && vencimento < filtros.vencInicial) return false
    if (filtros.vencFinal && vencimento > filtros.vencFinal) return false
    return true
  }), [linhas, filtros])

  return { filtros, upd, limpar, ativos, parceiros, filtradas, total: linhas.length }
}
