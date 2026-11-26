import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { LookupField, DateField, NumberField, ReadOnlyField, TextAreaField } from '@/components/form'
import LookupModal from '@/components/lookup/LookupModal'
import ConsultaCondicao from '@/components/condicao/ConsultaCondicao'
import ParcelasGrid from '@/components/nota/ParcelasGrid'
import SituacaoBadge from '@/components/financeiro/SituacaoBadge'
import FiltrosContas from '@/components/financeiro/FiltrosContas'
import BaixaModal from '@/components/financeiro/BaixaModal'
import useCrud from '@/hooks/useCrud'
import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useConsultaCondicao from '@/hooks/useConsultaCondicao'
import useFiltrosContas from '@/hooks/useFiltrosContas'
import { contasAvsApi, fornecedoresApi, formaPagamentosApi, condicoesApi, mensagemErro } from '@/services/api'
import { colsFornecedores } from '@/constants/cadastros'
import { regra } from '@/constants/regrasCampos'
import { situacaoConta } from '@/utils/contas'
import { parcelasDaCondicao, montarParcelas } from '@/utils/parcelas'
import { fmtMoney, arredondar2 } from '@/utils/format'
import { formatarDataBR, hojeISO } from '@/utils/date'

const VAZIO = {
  notaNumero: '', notaModelo: '', notaSerie: '', codForn: null,
  dataEmissao: '', valorOriginal: '', codCondicao: null, observacoes: '', parcelasGeradas: [],
}

const SITUACOES_FILTRO = ['PENDENTE', 'PARCIAL', 'PAGA', 'VENCIDA', 'CANCELADA']

const chave = r => `${r.notaNumero}-${r.notaSerie}-${r.notaModelo}-${r.codForn}-${r.numeroParcela}`

const mesmaConta = (a, b) =>
  String(a.notaNumero) === String(b.notaNumero) &&
  String(a.notaModelo) === String(b.notaModelo) &&
  String(a.notaSerie) === String(b.notaSerie) &&
  Number(a.codForn) === Number(b.codForn)

const cols = [
  { key: 'notaModelo', label: 'Modelo', mono: true, align: 'right' },
  { key: 'notaSerie', label: 'Série', mono: true, align: 'right' },
  { key: 'notaNumero', label: 'Número', mono: true, align: 'right' },
  { key: 'codForn', label: 'Cód. Forn.', mono: true, align: 'right' },
  { key: 'nomeParceiro', label: 'Fornecedor' },
  { key: 'numeroParcela', label: 'Parcela', align: 'right', render: r => `${r.numeroParcela}/${r.totalParcelas}` },
  { key: 'valorTotal', label: 'Valor', mono: true, align: 'right', render: r => fmtMoney(r.situacaoAtual === 'PAGA' ? r.valorPago : r.valorTotal) },
  { key: 'dataVencimento', label: 'Vencimento', mono: true, align: 'right', render: r => formatarDataBR(r.dataVencimento) || '-' },
  { key: 'situacaoAtual', label: 'Situação', render: r => <SituacaoBadge situacao={r.situacaoAtual} /> },
  { key: 'dataPagamento', label: 'Pago em', mono: true, align: 'right', render: r => formatarDataBR(r.dataPagamento) || '-' },
]

const linha = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }

export default function ContasPagarAvulsaPage() {
  const { data, loading, load } = useCrud(contasAvsApi)
  const [fornecedores] = useLista(fornecedoresApi)
  const [formas] = useLista(formaPagamentosApi)
  const { abrir, fechar, modal, algumAberto } = useModais()

  const [form, setForm] = useState(VAZIO)
  const [originalForm, setOriginalForm] = useState(VAZIO)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contaPagamento, setContaPagamento] = useState(null)
  const [contaCancelar, setContaCancelar] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  // campos que mudam o cálculo das parcelas obrigam a gerá-las de novo
  const updInvalidando = (k, v) => setForm(p => ({ ...p, [k]: v, parcelasGeradas: [] }))
  const updParcela = (i, campo, valor) =>
    setForm(f => ({ ...f, parcelasGeradas: f.parcelasGeradas.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p) }))

  const condicao = useConsultaCondicao({
    aoSelecionar: cod => updInvalidando('codCondicao', cod),
    aoCriar: cod => updInvalidando('codCondicao', cod),
  })

  const nomeFornecedor = cod => fornecedores.find(f => Number(f.codForn) === Number(cod))?.fornecedor ?? ''

  const linhas = useMemo(() => data.map(r => ({
    ...r,
    codParceiro: r.codForn,
    nomeParceiro: r.fornecedor?.fornecedor || nomeFornecedor(r.codForn) || `Fornecedor #${r.codForn}`,
    situacaoAtual: situacaoConta(r),
  })), [data, fornecedores])

  const filtros = useFiltrosContas(linhas)

  /* ----- cadastro ----- */

  const abrirNova = () => {
    const novo = { ...VAZIO, dataEmissao: hojeISO() }
    setForm(novo)
    setOriginalForm(novo)
    setOpen(true)
  }

  const gerarParcelas = async () => {
    const valorTotal = Number(form.valorOriginal) || 0
    if (!form.codCondicao) return toast.error('Selecione uma Condição de Pagamento.')
    if (valorTotal <= 0) return toast.error('Informe o Valor Original antes de gerar as parcelas.')
    if (!form.dataEmissao) return toast.error('Informe a Data de Emissão antes de gerar as parcelas.')

    let cond = condicao.condicoes.find(c => String(c.codCondicao) === String(form.codCondicao))
    if (parcelasDaCondicao(cond).length === 0) {
      try {
        cond = (await condicoesApi.getOne(form.codCondicao)) ?? cond
      } catch {
        return toast.error('Não foi possível carregar as parcelas da condição de pagamento.')
      }
    }
    const configuradas = parcelasDaCondicao(cond)
    if (configuradas.length === 0) return toast.error('A condição de pagamento não possui parcelas cadastradas.')

    // juros, multa e desconto: sempre da condição de pagamento
    const regras = {
      percentualJuros: Number(cond?.percentualJuros) || 0,
      percentualMulta: Number(cond?.percentualMultas ?? cond?.percentualMulta) || 0,
      percentualDesconto: Number(cond?.percentualDesconto) || 0,
    }

    const geradas = montarParcelas({ configuradas, valorTotal, dataEmissao: form.dataEmissao, formaPagamentos: formas })
    upd('parcelasGeradas', geradas.map(p => ({ ...p, ...regras })))
  }

  const save = async () => {
    if (saving) return
    const parcelas = form.parcelasGeradas

    if (!form.codForn) return toast.error('Selecione o fornecedor.')
    if (!form.notaNumero || !form.notaModelo || !form.notaSerie) return toast.error('Informe número, modelo e série da nota.')
    if (!(Number(form.valorOriginal) > 0)) return toast.error('Informe o valor original.')
    if (!form.dataEmissao) return toast.error('Informe a data de emissão.')
    if (!form.codCondicao) return toast.error('Selecione a condição de pagamento.')
    if (parcelas.length === 0) return toast.error('Clique em "Gerar Parcelas" antes de salvar.')
    if (parcelas.some(p => !p.vencimento)) return toast.error('Informe o vencimento de todas as parcelas.')
    if (parcelas.some(p => p.vencimento < form.dataEmissao)) return toast.error('Nenhum vencimento pode ser anterior à emissão.')

    const soma = arredondar2(parcelas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0))
    if (soma !== arredondar2(Number(form.valorOriginal))) {
      return toast.error(`A soma das parcelas (${fmtMoney(soma)}) deve ser igual ao Valor Original (${fmtMoney(form.valorOriginal)}).`)
    }

    let atual = null
    setSaving(true)
    try {
      for (const p of parcelas) {
        atual = p.numeroParcela
        await contasAvsApi.create({
          notaNumero: String(form.notaNumero),
          notaModelo: String(form.notaModelo),
          notaSerie: String(form.notaSerie),
          codForn: Number(form.codForn),
          numeroParcela: Number(p.numeroParcela),
          totalParcelas: parcelas.length,
          valorOriginal: Number(p.valor) || 0,
          valorTotal: Number(p.valor) || 0,
          valorPago: 0, valorJuros: 0, valorMulta: 0, valorDesconto: 0,
          percentualJuros: Number(p.percentualJuros) || 0,
          percentualMulta: Number(p.percentualMulta) || 0,
          percentualDesconto: Number(p.percentualDesconto) || 0,
          dataEmissao: form.dataEmissao,
          dataVencimento: p.vencimento,
          dataPagamento: null,
          codFormaPagamento: p.codFormaPagamento ? Number(p.codFormaPagamento) : null,
          codCondicao: Number(form.codCondicao),
          situacao: 'PENDENTE',
          observacoes: form.observacoes?.trim() || null,
        })
      }
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch (error) {
      const msg = mensagemErro(error, 'Erro ao salvar.')
      toast.error(atual ? `Parcela ${atual}: ${msg}` : msg)
      if (atual) load()
    } finally {
      setSaving(false)
    }
  }

  /* ----- pagar ----- */

  const pagar = async ({ dataBaixa, codFormaPagamento }) => {
    try {
      await contasAvsApi.pagar(contaPagamento, { dataPagamento: dataBaixa, codFormaPagamento })
      toast.success('Pagamento registrado!')
      setContaPagamento(null)
      load()
    } catch (error) {
      toast.error(mensagemErro(error, 'Erro ao registrar o pagamento.'))
      throw error
    }
  }

  /* ----- cancelar (conta inteira) ----- */

  const pedirCancelamento = conta => {
    const parcelasDaConta = data.filter(r => mesmaConta(r, conta))
    if (parcelasDaConta.some(r => situacaoConta(r) === 'PAGA' || Number(r.valorPago) > 0)) {
      return toast.error('Não é possível cancelar: existe parcela paga nesta conta.')
    }
    setContaCancelar(conta)
  }

  const confirmarCancelamento = async () => {
    if (!contaCancelar || saving) return
    setSaving(true)
    try {
      await contasAvsApi.cancelar(contaCancelar)
      toast.success('Conta cancelada.')
      setContaCancelar(null)
      load()
    } catch (error) {
      toast.error(mensagemErro(error, 'Erro ao cancelar a conta.'))
    } finally {
      setSaving(false)
    }
  }

  const regrasParcela = form.parcelasGeradas[0]

  return (
    <div>
      <PageHeader title="Contas a Pagar Avulsas" sub="Contas a pagar sem vínculo com Nota de Entrada" label="Nova Conta"
        onNew={abrirNova} disabled={open} />

      <FiltrosContas ctrl={filtros} parceiroLabel="Fornecedor" situacoes={SITUACOES_FILTRO} />

      <DataTable columns={cols} data={filtros.filtradas} loading={loading}
        onEdit={setContaPagamento} editLabel="Pagar" canEdit={r => r.situacaoAtual !== 'PAGA' && r.situacaoAtual !== 'CANCELADA'}
        onDelete={pedirCancelamento} deleteLabel="Cancelar" canDelete={r => r.situacaoAtual !== 'CANCELADA'} />

      <Modal wide maxWidth={1200} open={open} title="Nova Conta a Pagar Avulsa" editing={false}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={algumAberto || condicao.aberto}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={linha}>
            <div style={{ flex: '0 0 90px' }}><FField label="Modelo" required value={form.notaModelo} onChange={v => upd('notaModelo', v)} {...regra('modeloNota')} /></div>
            <div style={{ flex: '0 0 90px' }}><FField label="Série" required value={form.notaSerie} onChange={v => upd('notaSerie', v)} {...regra('serieNota')} /></div>
            <div style={{ flex: '0 0 130px' }}><FField label="Número" required value={form.notaNumero} onChange={v => upd('notaNumero', v)} {...regra('numeroNota')} /></div>
            <ReadOnlyField label="Código" value={form.codForn ?? ''} style={{ flex: '0 0 100px' }} />
            <LookupField label="Fornecedor *" value={nomeFornecedor(form.codForn)} onSearch={() => abrir('fornecedor')}
              style={{ flex: '1 1 320px', minWidth: 260 }} />
          </div>

          <div style={linha}>
            <DateField label="Data Emissão" required digitavel value={form.dataEmissao}
              onChange={v => updInvalidando('dataEmissao', v)} style={{ flex: '0 0 170px' }} />
            <NumberField label="Valor Original (total) *" step="0.01" min="0" value={form.valorOriginal}
              onChange={v => updInvalidando('valorOriginal', v)} style={{ flex: '0 0 200px' }} />
          </div>
        </div>

        <div style={{ margin: '14px -24px 0' }}>
          <ParcelasGrid
            parcelas={form.parcelasGeradas}
            valorTotalNota={form.valorOriginal}
            onChangeParcela={updParcela}
            condicaoLabel={condicao.label(form.codCondicao)}
            onSearchCondicao={condicao.abrir}
            onGerar={gerarParcelas}
            podeGerar={!!form.codCondicao}
            dataDigitavel />
        </div>

        {regrasParcela && (
          <div style={{ marginTop: -10, marginBottom: 14, fontSize: 11, color: '#64748b' }}>
            Regras da condição, aplicadas no pagamento: desconto {regrasParcela.percentualDesconto.toFixed(2)}% ·
            juros {regrasParcela.percentualJuros.toFixed(2)}% ao mês ·
            multa {regrasParcela.percentualMulta.toFixed(2)}%.
          </div>
        )}

        <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} />
      </Modal>

      <LookupModal {...modal('fornecedor')} title="Consulta de Fornecedores" maxWidth={640}
        cols={colsFornecedores} rows={fornecedores}
        onSelect={r => { upd('codForn', r.codForn); fechar('fornecedor') }} />

      <ConsultaCondicao ctrl={condicao} />

      {contaPagamento && (
        <BaixaModal key={chave(contaPagamento)} conta={contaPagamento} formas={formas} dataEditavel formaObrigatoria
          detalhes={[
            ['Fornecedor', contaPagamento.nomeParceiro],
            ['Modelo', contaPagamento.notaModelo],
            ['Série', contaPagamento.notaSerie],
            ['Número', contaPagamento.notaNumero],
            ['Parcela', `${contaPagamento.numeroParcela}/${contaPagamento.totalParcelas}`],
            ['Vencimento', formatarDataBR(contaPagamento.dataVencimento)],
          ]}
          onClose={() => setContaPagamento(null)} onConfirm={pagar} />
      )}

      <ConfirmDialog
        open={!!contaCancelar}
        icon="❓" title="Cancelar Conta a Pagar Avulsa"
        message={contaCancelar
          ? `Todas as parcelas da nota ${contaCancelar.notaNumero}/${contaCancelar.notaSerie} (modelo ${contaCancelar.notaModelo}) serão canceladas. Deseja continuar?`
          : ''}
        confirmLabel="Cancelar conta" confirmColor="#dc2626"
        onClose={() => !saving && setContaCancelar(null)}
        onConfirm={confirmarCancelamento} />
    </div>
  )
}
