import { fmtMoney } from '@/utils/format'
import { formatarDataBR, hojeISO } from '@/utils/date'

// Função (e não objeto fixo) para a data de emissão ser sempre a de HOJE, no fuso local.
export const notaVazia = () => ({
  numero: '', serie: '', modelo: '', codCliente: null,
  dataEmissao: hojeISO(),
  valorServicos: 0, valorDesconto: 0, valorTotal: 0,
  codCondicao: null, observacoes: '', situacao: 'CONFERIDA',
  servicos: [],
  parcelasGeradas: [],
})

// desconto = R$ por unidade; descontoValor = desconto total do item
export const ITEM_EMPTY = {
  codServico: null, servicoNome: '', duracaoMinutos: '', quantidade: 1, valorUnitario: '',
  desconto: 0, descontoPercentual: 0, descontoValor: 0,
}

export const SERVICO_NOVO_EMPTY = { servico: '', preco: '', duracaoMinutos: '', ativo: true }

export const colsNotas = [
  { key: 'modelo', label: 'Modelo', mono: true, align: 'right' },
  { key: 'serie', label: 'Série', mono: true, align: 'right' },
  { key: 'numero', label: 'Número', mono: true, align: 'right' },
  { key: 'cliente', label: 'Cliente', render: r => r.cliente?.cliente ?? r.cliente?.nome ?? `#${r.codCliente}`, align: 'right' },
  { key: 'dataEmissao', label: 'Emissão', render: r => formatarDataBR(r.dataEmissao), align: 'right' },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal), align: 'right' },
  { key: 'situacao', label: 'Situação', align: 'right' },
]

export const colsServicos = [
  { key: 'codServico', label: 'Cód.', mono: true },
  { key: 'servico', label: 'Serviço' },
  { key: 'duracaoMinutos', label: 'Duração', render: r => `${r.duracaoMinutos} min` },
  { key: 'preco', label: 'Preço', render: r => fmtMoney(r.preco), align: 'right' },
]
