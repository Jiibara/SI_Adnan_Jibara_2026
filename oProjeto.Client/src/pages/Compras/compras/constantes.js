import { fmtMoney } from '@/utils/format'
import { formatarDataBR, hojeISO } from '@/utils/date'

// Função (e não objeto fixo) para a data da compra ser sempre a de HOJE, no fuso local.
export const compraVazia = () => ({
  numero: '', serie: '', modelo: '', codForn: null,
  dataCompra: hojeISO(), dataPrevisaoEntrega: '',
  codCondicao: null, valorProdutos: 0, valorDesconto: 0, valorFrete: 0,
  valorSeguro: 0, outrasDespesas: 0, valorTotal: 0,
  observacoes: '', situacao: 'ABERTA',
  produtos: [],
})

// desconto = R$ por unidade; descontoValor = desconto total do item
export const ITEM_EMPTY = {
  codProd: null, produtoNome: '', unidade: '', quantidade: '', valorUnitario: '',
  desconto: 0, descontoValor: 0, descontoPercentual: 0,
}

export const SITUACAO_OPTIONS = [
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'RECEBIDA', label: 'Recebida' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

export const colsCompras = [
  { key: 'numero', label: 'Número', mono: true, align: 'right' },
  { key: 'serie', label: 'Série', mono: true, align: 'right' },
  { key: 'modelo', label: 'Modelo', mono: true, align: 'right' },
  { key: 'fornecedor', label: 'Fornecedor', render: r => r.fornecedor?.fornecedor ?? `#${r.codForn}`, align: 'right' },
  { key: 'dataCompra', label: 'Data', render: r => formatarDataBR(r.dataCompra), align: 'right' },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal), align: 'right' },
  { key: 'situacao', label: 'Situação', align: 'right' },
]
