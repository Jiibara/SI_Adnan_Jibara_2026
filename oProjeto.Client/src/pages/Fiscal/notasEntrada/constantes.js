import { fmtMoney } from '@/utils/format'
import { formatarDataBR, hojeISO } from '@/utils/date'

// Função (e não objeto fixo) para a data de emissão ser sempre a de HOJE, no fuso local.
export const notaVazia = () => ({
  numero: '', serie: '', modelo: '', codForn: null,
  dataEmissao: hojeISO(), dataChegada: '',
  tipoFrete: 'CIF', valorFrete: 0, valorSeguro: 0, outrasDespesas: 0, valorDesconto: 0,
  pedidoNumero: null, pedidoSerie: null, pedidoModelo: null,
  codCondicao: null, codTransp: null, placaVeiculo: '', observacoes: '', situacao: 'CONFERIDA',
  produtos: [],
  parcelasGeradas: [],
})

export const ITEM_EMPTY = { codProd: null, produtoNome: '', unidade: '', quantidade: '', valorUnitario: '', desconto: 0, descontoPercentual: 0 }

export const TIPO_FRETE_OPTIONS = [
  { value: 'CIF', label: 'CIF' },
  { value: 'FOB', label: 'FOB' },
  { value: 'OUT', label: 'Outros' },
]

// ----- colunas das tabelas
export const colsNotas = [
  { key: 'modelo', label: 'Modelo', mono: true, align: 'right' },
  { key: 'serie', label: 'Série', mono: true, align: 'right' },
  { key: 'numero', label: 'Número', mono: true, align: 'right' },
  { key: 'codForn', label: 'ID', render: r => r.fornecedor?.codForn ?? `#${r.codForn}`, align: 'right' },
  { key: 'fornecedor', label: 'Fornecedor', render: r => r.fornecedor?.fornecedor ?? `#${r.codForn}` },
  { key: 'dataEmissao', label: 'Emissão', render: r => formatarDataBR(r.dataEmissao) },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal), align: 'right' },
  { key: 'situacao', label: 'Situação' },
]

export const colsPedidosCompra = [
  { key: 'numero', label: 'Número', mono: true },
  { key: 'serie', label: 'Série', mono: true },
  { key: 'modelo', label: 'Modelo', mono: true },
  { key: 'dataCompra', label: 'Compra', render: r => formatarDataBR(r.dataCompra) },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal), align: 'right' },
  { key: 'situacao', label: 'Situação' },
]
