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
import { contasPagarApi, formaPagamentosApi, mensagemErro } from '@/services/api'
import { situacaoConta } from '@/utils/contas'
import { fmtMoney } from '@/utils/format'
import { formatarDataBR } from '@/utils/date'

const SITUACOES_FILTRO = ['PENDENTE', 'PARCIAL', 'PAGA', 'VENCIDA', 'CANCELADA']

const chave = r => `${r.notaNumero}-${r.notaSerie}-${r.notaModelo}-${r.codForn}-${r.numeroParcela}`

const cols = [
  { key: 'notaModelo', label: 'Modelo', mono: true, align: 'right' },
  { key: 'notaSerie', label: 'Série', mono: true, align: 'right' },
  { key: 'notaNumero', label: 'Número', mono: true, align: 'right' },
  { key: 'codForn', label: 'Cód. Forn.', mono: true, align: 'right' },
  { key: 'nomeParceiro', label: 'Fornecedor' },
  { key: 'numeroParcela', label: 'Parcela', align: 'right', render: r => `${r.numeroParcela}/${r.totalParcelas}` },
  { key: 'valorTotal', label: 'Valor', mono: true, align: 'right', render: r => fmtMoney(r.valorTotal) },
  { key: 'dataVencimento', label: 'Vencimento', mono: true, align: 'right', render: r => formatarDataBR(r.dataVencimento) || '-' },
  { key: 'situacaoAtual', label: 'Situação', render: r => <SituacaoBadge situacao={r.situacaoAtual} /> },
  { key: 'dataPagamento', label: 'Pago em', mono: true, align: 'right', render: r => formatarDataBR(r.dataPagamento) || '-' },
]

const podePagar = r => r.situacaoAtual !== 'PAGA' && r.situacaoAtual !== 'CANCELADA'

export default function ContasPagarPage() {
  const { data, loading, load } = useCrud(contasPagarApi)
  const [formas] = useLista(formaPagamentosApi)
  const [conta, setConta] = useState(null)

  const linhas = useMemo(() => data.map(r => ({
    ...r,
    codParceiro: r.codForn,
    nomeParceiro: r.fornecedor?.fornecedor ?? `Fornecedor #${r.codForn}`,
    situacaoAtual: situacaoConta(r),
  })), [data])

  const filtros = useFiltrosContas(linhas)

  const pagar = async ({ dataBaixa, codFormaPagamento, calc }) => {
    try {
      await contasPagarApi.pagar(conta, {
        valorPago: calc.valorFinal,
        valorDesconto: calc.desconto,
        valorJuros: calc.juros,
        valorMulta: calc.multa,
        dataPagamento: dataBaixa,
        codFormaPagamento,
      })
      toast.success('Pagamento registrado!')
      setConta(null)
      load()
    } catch (error) {
      toast.error(mensagemErro(error, 'Erro ao registrar o pagamento.'))
      throw error
    }
  }

  return (
    <div>
      <PageHeader title="Contas a Pagar" sub="Controle de contas e pagamentos" />

      <FiltrosContas ctrl={filtros} parceiroLabel="Fornecedor" situacoes={SITUACOES_FILTRO} />

      <DataTable columns={cols} data={filtros.filtradas} loading={loading}
        onEdit={setConta} editLabel="Pagar" canEdit={podePagar} />

      {conta && (
        <BaixaModal key={chave(conta)} conta={conta} formas={formas}
          detalhes={[
            ['Fornecedor', conta.nomeParceiro],
            ['Modelo', conta.notaModelo],
            ['Série', conta.notaSerie],
            ['Número', conta.notaNumero],
            ['Parcela', `${conta.numeroParcela}/${conta.totalParcelas}`],
            ['Vencimento', formatarDataBR(conta.dataVencimento)],
          ]}
          onClose={() => setConta(null)} onConfirm={pagar} />
      )}
    </div>
  )
}
