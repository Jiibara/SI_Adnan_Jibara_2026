import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { PageHeader } from '@/components/UI'
import SituacaoBadge from '@/components/financeiro/SituacaoBadge'
import FiltrosContas from '@/components/financeiro/FiltrosContas'
import BaixaModal from '@/components/financeiro/BaixaModal'
import useCrud from '@/hooks/useCrud'
import useLista from '@/hooks/useLista'
import useFiltrosContas from '@/hooks/useFiltrosContas'
import { contasReceberApi, formaPagamentosApi, mensagemErro } from '@/services/api'
import { situacaoConta } from '@/utils/contas'
import { fmtMoney } from '@/utils/format'
import { formatarDataBR } from '@/utils/date'

// Origem da conta: produto (contasReceber) ou serviço (contasReceberServico)
const TIPOS = { PRODUTO: 'Produto', SERVICO: 'Serviço' }
const TIPOS_FILTRO = Object.entries(TIPOS).map(([value, label]) => ({ value, label }))
const SITUACOES_FILTRO = ['PENDENTE', 'PARCIAL', 'RECEBIDO', 'VENCIDA', 'CANCELADA']

// A mesma nota/parcela pode existir nas duas tabelas, então o tipo faz parte da chave
const chave = r => `${r.tipoNota}-${r.notaNumero}-${r.notaSerie}-${r.notaModelo}-${r.codCliente}-${r.numeroParcela}`

const cols = [
  { key: 'tipoNome', label: 'Tipo' },
  { key: 'notaModelo', label: 'Modelo', mono: true, align: 'right' },
  { key: 'notaSerie', label: 'Série', mono: true, align: 'right' },
  { key: 'notaNumero', label: 'Número', mono: true, align: 'right' },
  { key: 'codCliente', label: 'Cód. Cliente', mono: true, align: 'right' },
  { key: 'nomeParceiro', label: 'Cliente' },
  { key: 'numeroParcela', label: 'Parcela', align: 'right', render: r => `${r.numeroParcela}/${r.totalParcelas}` },
  { key: 'valorTotal', label: 'Valor', mono: true, align: 'right', render: r => fmtMoney(r.valorTotal) },
  { key: 'dataVencimento', label: 'Vencimento', mono: true, align: 'right', render: r => formatarDataBR(r.dataVencimento) || '-' },
  { key: 'situacaoAtual', label: 'Situação', render: r => <SituacaoBadge situacao={r.situacaoAtual} /> },
  { key: 'dataRecebimento', label: 'Recebido em', mono: true, align: 'right', render: r => formatarDataBR(r.dataRecebimento) || '-' },
]

const podeReceber = r => r.situacaoAtual !== 'RECEBIDO' && r.situacaoAtual !== 'CANCELADA'

export default function ContasReceberPage() {
  const { data, loading, load } = useCrud(contasReceberApi)
  const [formas] = useLista(formaPagamentosApi)
  const [conta, setConta] = useState(null)

  const linhas = useMemo(() => data.map(r => ({
    ...r,
    tipoNome: TIPOS[r.tipoNota] ?? r.tipoNota ?? '-',
    codParceiro: r.codCliente,
    nomeParceiro: r.cliente?.cliente ?? `Cliente #${r.codCliente}`,
    situacaoAtual: situacaoConta(r, { quitada: 'RECEBIDO', campoPago: 'valorRecebido' }),
  })), [data])

  const filtros = useFiltrosContas(linhas)

  const abrirRecebimento = r => {
    if (!r.tipoNota) return toast.error('Não foi possível identificar o tipo da conta (produto ou serviço).')
    setConta(r)
  }

  const receber = async ({ dataBaixa, codFormaPagamento, calc }) => {
    try {
      await contasReceberApi.receber(conta, {
        valorRecebido: calc.valorFinal,
        valorDesconto: calc.desconto,
        valorJuros: calc.juros,
        valorMulta: calc.multa,
        dataRecebimento: dataBaixa,
        codFormaPagamento,
      })
      toast.success('Recebimento registrado!')
      setConta(null)
      load()
    } catch (error) {
      toast.error(mensagemErro(error, 'Erro ao registrar o recebimento.'))
      throw error
    }
  }

  return (
    <div>
      <PageHeader title="Contas a Receber" sub="Controle de contas e recebimentos" />

      <FiltrosContas ctrl={filtros} parceiroLabel="Cliente" situacoes={SITUACOES_FILTRO} tipos={TIPOS_FILTRO} />

      <DataTable columns={cols} data={filtros.filtradas} loading={loading}
        onEdit={abrirRecebimento} editLabel="Receber" canEdit={podeReceber} />

      {conta && (
        <BaixaModal key={chave(conta)} conta={conta} formas={formas} receber
          detalhes={[
            ['Tipo', conta.tipoNome],
            ['Cliente', conta.nomeParceiro],
            ['Cód. Cliente', conta.codCliente],
            ['Modelo', conta.notaModelo],
            ['Série', conta.notaSerie],
            ['Número', conta.notaNumero],
            ['Parcela', `${conta.numeroParcela}/${conta.totalParcelas}`],
            ['Vencimento', formatarDataBR(conta.dataVencimento)],
          ]}
          onClose={() => setConta(null)} onConfirm={receber} />
      )}
    </div>
  )
}
