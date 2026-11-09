import { fmtMoney } from '@/utils/format'
import { formatarDataBR, hojeISO } from '@/utils/date'

// Função (e não objeto fixo) para a data de emissão ser sempre a de HOJE, no fuso local.
export const notaVazia = () => ({
  numero: '', serie: '', modelo: '', codCliente: null,
  dataEmissao: hojeISO(), dataSaida: '',
  tipoFrete: 'CIF',
  valorProdutos: 0, valorFrete: 0, valorSeguro: 0, outrasDespesas: 0, valorDesconto: 0, valorTotal: 0,
  codCondicao: null, codTransp: null, placaVeiculo: '', observacoes: '', situacao: 'CONFERIDA',
  produtos: [],
  parcelasGeradas: [],
})

export const ITEM_EMPTY = {
  codProd: null, produtoNome: '', unidade: '', quantidade: '', valorUnitario: '',
  desconto: 0, descontoPercentual: 0, descontoValor: 0,   // desconto = R$ por unidade; descontoValor = total do item
}

export const TIPO_FRETE_OPTIONS = [
  { value: 'CIF', label: 'CIF - Por conta do emitente' },
  { value: 'FOB', label: 'FOB - Por conta do destinatário' },
  { value: 'OUT', label: 'Outros' },
]

export const TRANSPORTADORA_NOVA_EMPTY = { transportador: '', cpfCnpj: '', codCidade: null, ativo: true }

export const colsNotas = [
  { key: 'numero', label: 'Número', mono: true, align: 'right' },
  { key: 'serie', label: 'Série', mono: true, align: 'right' },
  { key: 'modelo', label: 'Modelo', mono: true, align: 'right' },
  { key: 'cliente', label: 'Cliente', render: r => r.cliente?.cliente ?? r.cliente?.nome ?? `#${r.codCliente}`, align: 'right' },
  { key: 'dataEmissao', label: 'Emissão', render: r => formatarDataBR(r.dataEmissao), align: 'right' },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal), align: 'right' },
  { key: 'situacao', label: 'Situação', align: 'right' },
]
