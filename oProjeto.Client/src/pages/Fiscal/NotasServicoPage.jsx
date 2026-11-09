import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import useConsultaEndereco from '@/hooks/useConsultaEndereco'
import DataTable from '@/components/DataTable'
import { Modal, PageHeader } from '@/components/UI'
import {
  BtnPrimary, Inp, NumberField, DateField, SelectField, TextAreaField,
  ReadOnlyField, LookupField, InlineForm,
} from '@/components/form'
import LookupModal from '@/components/lookup/LookupModal'
import ConsultaEndereco from '@/components/lookup/ConsultaEndereco'
import AvisoChaves from '@/components/nota/AvisoChaves'
import ParcelasGrid from '@/components/nota/ParcelasGrid'
import ParcelasCondicaoEditor from '@/components/nota/ParcelasCondicaoEditor'
import { notasServicoApi, clientesApi, condicoesApi, servicosApi, formaPagamentosApi } from '@/services/api'
import { lbl, inp } from '@/styles/formStyles'
import { fmtMoney, arredondar2, arredondar4 } from '@/utils/format'
import { toDateInput, hojeISO } from '@/utils/date'
import { valorProdutosCalc, somaDescontosItens, valorTotalCalc, comUnitarioLiquido } from '@/utils/notaCalculos'
import { montarParcelas, parcelasDaCondicao } from '@/utils/parcelas'
import { SITUACAO_OPTIONS } from '@/constants/nota'
import { CONDICAO_NOVA_EMPTY, CLIENTE_NOVO_EMPTY, colsClientes, colsCondicoes } from '@/constants/cadastros'
import ItemsList from './notasServico/ItemsList'
import { notaVazia, ITEM_EMPTY, SERVICO_NOVO_EMPTY, colsNotas, colsServicos } from './notasServico/constantes'

const chaveNota = (numero, modelo, serie, codCliente) => `${numero}/${modelo}/${serie}/${codCliente}`

export default function NotaServicoPage() {
  const { data, loading, load } = useCrud(notasServicoApi)

  // ----- listas das consultas
  const [clientes, loadClientes] = useLista(clientesApi)
  const [condicoes, loadCondicoes] = useLista(condicoesApi)
  const [servicos, loadServicos] = useLista(servicosApi)
  const [formaPagamentos] = useLista(formaPagamentosApi)

  // ----- estado da nota
  const [form, setForm] = useState(notaVazia)
  const [originalForm, setOriginalForm] = useState(notaVazia)
  const [itemDraft, setItemDraft] = useState(ITEM_EMPTY)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelamentoModo, setCancelamentoModo] = useState(false)
  const [saving, setSaving] = useState(false)

  // ----- modais de consulta
  const { abrir, fechar, modal, algumAberto } = useModais()

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const updDataEmissao = v => {
    if (v && v > hojeISO()) { toast.error('A Data de Emissão não pode ser futura.'); return }
    upd('dataEmissao', v)
  }

  // ----- item em edição (rascunho)
  // "Desconto (R$)" é POR UNIDADE e sai do valor unitário (mesmo cálculo das notas de entrada e saída).
  // descontoValor = desconto total do item = desconto por unidade x quantidade.
  const updItemQuantidade = v => setItemDraft(d => ({
    ...d, quantidade: v, descontoValor: (Number(d.desconto) || 0) * (Number(v) || 0),
  }))

  const updItemValorUnitario = v => setItemDraft(d => {
    const desconto = arredondar4((Number(v) || 0) * (Number(d.descontoPercentual) || 0) / 100)
    return { ...d, valorUnitario: v, desconto, descontoValor: desconto * (Number(d.quantidade) || 0) }
  })

  const updItemDescontoPercentual = v => setItemDraft(d => {
    const desconto = arredondar4((Number(d.valorUnitario) || 0) * (Number(v) || 0) / 100)
    return { ...d, desconto, descontoValor: desconto * (Number(d.quantidade) || 0), descontoPercentual: v }
  })

  const updItemDesconto = v => setItemDraft(d => {
    const unit = Number(d.valorUnitario) || 0
    const descontoUnit = Number(v) || 0
    const percentual = unit > 0 ? (descontoUnit / unit) * 100 : 0
    return { ...d, desconto: v, descontoValor: descontoUnit * (Number(d.quantidade) || 0), descontoPercentual: percentual }
  })

  const selecionarServico = r => {
    setItemDraft({
      ...ITEM_EMPTY,
      codServico: r.codServico,
      servicoNome: r.servico ?? '',
      duracaoMinutos: r.duracaoMinutos ?? '',
      valorUnitario: Number(r.preco) || 0,
    })
    fechar('servico')
  }

  const addItem = () => {
    if (!itemDraft.codServico) { toast.error('Selecione um serviço.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (!Number.isInteger(Number(itemDraft.quantidade))) { toast.error('A quantidade deve ser um número inteiro.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }
    const jaExiste = (form.servicos ?? []).some(s => Number(s.codServico) === Number(itemDraft.codServico))
    if (jaExiste) { toast.error('Este serviço já foi adicionado. Aumente a quantidade dele.'); return }

    const quantidade = Number(itemDraft.quantidade)
    const valorUnitario = Number(itemDraft.valorUnitario)
    const descontoUnit = Number(itemDraft.desconto) || 0
    if (descontoUnit < 0) { toast.error('O desconto não pode ser negativo.'); return }
    if (descontoUnit > valorUnitario) { toast.error('O desconto por unidade não pode ser maior que o valor unitário.'); return }
    const descontoPercentual = Number(itemDraft.descontoPercentual) || 0
    const descontoValor = arredondar2(descontoUnit * quantidade)           // desconto total do item

    const novoItem = {
      numero: String(form.numero ?? ''),
      modelo: String(form.modelo ?? ''),
      serie: String(form.serie ?? ''),
      codCliente: Number(form.codCliente),
      codServico: Number(itemDraft.codServico),
      servicoNome: itemDraft.servicoNome,
      duracaoMinutos: itemDraft.duracaoMinutos,
      quantidade,
      valorUnitario,
      valorTotal: arredondar2(quantidade * valorUnitario - descontoValor),
      descontoPercentual,
      descontoValor,
    }
    setForm(f => ({ ...f, servicos: [...(f.servicos ?? []), novoItem], parcelasGeradas: [] }))
    setItemDraft(ITEM_EMPTY)
  }

  const removeItem = i => setForm(f => ({ ...f, servicos: (f.servicos ?? []).filter((_, idx) => idx !== i), parcelasGeradas: [] }))

  // ----- totais
  const valorServicosAtual = arredondar2(valorProdutosCalc(form.servicos))
  const descontoAtual = arredondar2(somaDescontosItens(form.servicos))
  const valorTotalAtual = valorTotalCalc(valorServicosAtual, 0, 0, 0)

  const valorTotalItemDraft = arredondar2((Number(itemDraft.quantidade) || 0) * (Number(itemDraft.valorUnitario) || 0))
  const valorUnitLiquidoDraft = Math.max((Number(itemDraft.valorUnitario) || 0) - (Number(itemDraft.desconto) || 0), 0)
  const valorLiquidoItemDraft = arredondar2((Number(itemDraft.quantidade) || 0) * valorUnitLiquidoDraft)

  // ----- seleções nas consultas
  const clienteSelecionado = clientes.find(c => Number(c.codCliente) === Number(form.codCliente)) ?? form.cliente
  const clienteLabel = clienteSelecionado?.cliente ?? clienteSelecionado?.nome ?? clienteSelecionado?.razaoSocial ?? ''
  const selectCliente = r => {
    setForm(f => ({
      ...f,
      codCliente: Number(r.codCliente),
      cliente: r,
      codCondicao: r.condicao?.codCondicao ?? null,
      condicaoPagamento: r.condicao ?? null,
    }))
    fechar('cliente')
  }

  const condicaoSelecionada = condicoes.find(c => Number(c.codCondicao) === Number(form.codCondicao)) ?? form.condicaoPagamento
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? condicaoSelecionada?.descricao ?? ''
  const selectCondicao = r => {
    setForm(f => ({ ...f, codCondicao: Number(r.codCondicao), condicaoPagamento: r, parcelasGeradas: [] }))
    fechar('condicao')
  }

  // ----- parcelas
  const gerarParcelas = async () => {
    if (!form.servicos?.length) { toast.error('Adicione ao menos um serviço antes de gerar as parcelas.'); return }
    if (!form.codCondicao) { toast.error('Selecione uma Condição de Pagamento antes.'); return }
    if (!form.dataEmissao) { toast.error('Informe a Data de Emissão antes.'); return }

    let condicao = condicaoSelecionada
    let configuradas = parcelasDaCondicao(condicao)

    if (configuradas.length === 0) {
      try {
        const detalhe = await condicoesApi.getOne(form.codCondicao)
        condicao = detalhe ?? condicao
        configuradas = parcelasDaCondicao(detalhe)
      } catch {
        toast.error('Não foi possível carregar as parcelas da condição de pagamento.')
        return
      }
    }

    if (configuradas.length === 0) {
      toast.error('A condição de pagamento não possui parcelas cadastradas.')
      return
    }

    const geradas = montarParcelas({ configuradas, valorTotal: valorTotalAtual, dataEmissao: form.dataEmissao, formaPagamentos })
    setForm(f => ({ ...f, condicaoPagamento: condicao, parcelasGeradas: geradas }))
  }

  const updParcelaGerada = (i, campo, valor) => {
    setForm(f => ({
      ...f,
      parcelasGeradas: (f.parcelasGeradas ?? []).map((p, idx) => idx === i ? { ...p, [campo]: valor } : p),
    }))
  }

  // ----- cadastros rápidos (dentro dos modais de consulta)
  const novoCliente = useCadastroRapido({
    empty: CLIENTE_NOVO_EMPTY, api: clientesApi, idKey: 'codCliente', recarregar: loadClientes,
    validar: c => !c.cliente?.trim() ? 'Informe o cliente.' : !c.codCidade ? 'Selecione a cidade.' : null,
    sucesso: 'Cliente cadastrado!', erro: 'Erro ao salvar cliente.',
    aoCriar: (cod, c) => selectCliente({ ...c, codCliente: cod, condicao: null }),
  })
  const novaCondicao = useCadastroRapido({
    empty: CONDICAO_NOVA_EMPTY, api: condicoesApi, idKey: 'codCondicao', recarregar: loadCondicoes,
    validar: c => !c.condicaoPagamento?.trim() ? 'Informe a descrição da condição.' : c.parcelas.length === 0 ? 'Adicione ao menos uma parcela.' : null,
    sucesso: 'Condição de pagamento cadastrada!', erro: 'Erro ao salvar condição de pagamento.',
    aoCriar: (cod, c) => selectCondicao({ ...c, codCondicao: cod }),
  })
  const novoServico = useCadastroRapido({
    empty: SERVICO_NOVO_EMPTY, idKey: 'codServico', recarregar: loadServicos,
    // preço e duração chegam como texto do formulário: converte antes de enviar
    api: { create: f => servicosApi.create({ ...f, servico: f.servico.trim(), preco: Number(f.preco), duracaoMinutos: Number(f.duracaoMinutos) }) },
    validar: f => {
      const preco = Number(f.preco)
      const duracao = Number(f.duracaoMinutos)
      if (!f.servico?.trim()) return 'Informe o serviço.'
      if (!(preco > 0)) return 'Informe um preço maior que zero.'
      if (!Number.isInteger(duracao) || duracao <= 0) return 'Informe a duração em minutos (número inteiro).'
      return null
    },
    sucesso: 'Serviço cadastrado!', erro: 'Erro ao salvar serviço.',
    aoCriar: (cod, f) => selecionarServico({ codServico: cod, servico: f.servico.trim(), duracaoMinutos: Number(f.duracaoMinutos), preco: Number(f.preco) }),
  })

  // cadeia Cidade -> Estado -> País (a cidade escolhida vai para o cliente em cadastro)
  const endereco = useConsultaEndereco({
    aoSelecionarCidade: r => novoCliente.upd('codCidade', r.codCidade),
    aoCriarCidade: cod => novoCliente.upd('codCidade', cod),
  })

  // ----- abrir / editar nota
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  const abrirNovaNota = () => {
    const nova = notaVazia()
    setForm(nova); setOriginalForm(nova); setItemDraft(ITEM_EMPTY)
    setEditing(false); setOpen(true)
  }

  const abrirEdicaoNota = async (r, modoCancelamento = false) => {
    try {
      const completa = await notasServicoApi.getOne(chaveNota(r.numero, r.modelo, r.serie, r.codCliente))
      const formCarregado = {
        ...completa,
        numero: String(completa.numero ?? ''),
        serie: String(completa.serie ?? ''),
        modelo: String(completa.modelo ?? ''),
        codCliente: Number(completa.codCliente),
        dataEmissao: toDateInput(completa.dataEmissao),
        valorServicos: Number(completa.valorServicos) || 0,
        valorDesconto: Number(completa.valorDesconto) || 0,
        valorTotal: Number(completa.valorTotal) || 0,
        codCondicao: completa.codCondicao ? Number(completa.codCondicao) : null,
        servicos: (completa.servicos ?? []).map(s => {
          const servico = s.servico ?? s.Servico ?? {}
          return {
            numero: String(s.numero ?? completa.numero ?? ''),
            modelo: String(s.modelo ?? completa.modelo ?? ''),
            serie: String(s.serie ?? completa.serie ?? ''),
            codCliente: Number(s.codCliente ?? completa.codCliente),
            codServico: Number(s.codServico),
            servicoNome: servico.servico ?? servico.Servico ?? `Serviço #${s.codServico}`,
            duracaoMinutos: servico.duracaoMinutos ?? '',
            quantidade: Number(s.quantidade) || 0,
            valorUnitario: Number(s.valorUnitario) || 0,
            valorTotal: Number(s.valorTotal) || 0,
            descontoPercentual: Number(s.descontoPercentual) || 0,
            descontoValor: Number(s.descontoValor) || 0,
          }
        }),
        parcelasGeradas: completa.parcelasGeradas ?? [],
      }
      setForm(formCarregado); setOriginalForm(formCarregado); setItemDraft(ITEM_EMPTY)
      setEditing(true); setOpen(true); setMotivoCancelamento(''); setCancelamentoModo(modoCancelamento)
    } catch {
      toast.error('Erro ao carregar a nota.')
    }
  }

  // ----- salvar / confirmar / cancelar
  const confirmarNaApi = async p => {
    const url = `/api/NotasServico/confirmar/${encodeURIComponent(p.numero)}/${encodeURIComponent(p.modelo)}/${encodeURIComponent(p.serie)}/${encodeURIComponent(p.codCliente)}`
    const response = await fetch(url, { method: 'PUT' })
    if (!response.ok) {
      const mensagem = await response.text()
      throw new Error(mensagem || 'Erro ao confirmar a nota.')
    }
  }

  const save = async () => {
    if (!form.codCliente) { toast.error('Selecione o cliente.'); return }
    if (!form.numero || !form.serie || !form.modelo) { toast.error('Informe número, série e modelo.'); return }
    if (!form.dataEmissao) { toast.error('Informe a data de emissão.'); return }
    if (form.dataEmissao > hojeISO()) { toast.error('A Data de Emissão não pode ser futura.'); return }
    if (!form.servicos || form.servicos.length === 0) { toast.error('Adicione ao menos um serviço.'); return }
    if (form.servicos.some(s => !s.quantidade || Number(s.quantidade) <= 0)) { toast.error('Todos os serviços devem possuir quantidade maior que zero.'); return }
    if (form.servicos.some(s => !Number.isInteger(Number(s.quantidade)))) { toast.error('A quantidade dos serviços deve ser inteira.'); return }

    const situacaoAnterior = String(originalForm?.situacao ?? 'PENDENTE').toUpperCase()
    const situacaoNova = String(form.situacao ?? 'PENDENTE').toUpperCase()
    if (editing && situacaoAnterior === 'CONFERIDA' && situacaoNova !== 'CONFERIDA') {
      toast.error('Uma nota conferida não pode voltar para Pendente ou Cancelada.')
      return
    }
    if (situacaoNova === 'CONFERIDA') {
      if (!form.codCondicao) { toast.error('Selecione a Condição de Pagamento para conferir a nota.'); return }
      if (valorTotalAtual <= 0) { toast.error('O valor total da nota deve ser maior que zero.'); return }
    }

    const payload = {
      ...form,
      numero: String(form.numero ?? ''),
      serie: String(form.serie ?? ''),
      modelo: String(form.modelo ?? ''),
      codCliente: Number(form.codCliente),
      dataEmissao: form.dataEmissao,
      valorServicos: valorServicosAtual,
      valorDesconto: descontoAtual,
      valorTotal: valorTotalAtual,
      codCondicao: form.codCondicao ? Number(form.codCondicao) : null,
      observacoes: form.observacoes || null,
      situacao: situacaoNova,
      servicos: form.servicos.map(item => ({
        numero: String(item.numero ?? form.numero ?? ''),
        modelo: String(item.modelo ?? form.modelo ?? ''),
        serie: String(item.serie ?? form.serie ?? ''),
        codCliente: Number(item.codCliente ?? form.codCliente),
        codServico: Number(item.codServico),
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario) || 0,
        valorTotal: Number(item.valorTotal) || 0,
        descontoPercentual: Number(item.descontoPercentual) || 0,
        descontoValor: Number(item.descontoValor) || 0,
      })),
    }
    delete payload.parcelasGeradas

    setSaving(true)
    try {
      const chave = chaveNota(payload.numero, payload.modelo, payload.serie, payload.codCliente)
      if (editing) {
        if (situacaoAnterior === 'PENDENTE' && situacaoNova === 'CONFERIDA') {
          await notasServicoApi.update(chave, { ...payload, situacao: 'PENDENTE' })
          await confirmarNaApi(payload)
        } else {
          await notasServicoApi.update(chave, payload)
        }
      } else {
        await notasServicoApi.create({ ...payload, situacao: 'PENDENTE' })
        if (situacaoNova === 'CONFERIDA') await confirmarNaApi(payload)
      }
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const cancelarNota = async () => {
    if (!form?.numero || !form?.modelo || !form?.serie || !form?.codCliente) return
    if (!motivoCancelamento.trim()) { toast.error('Informe o motivo do cancelamento.'); return }

    setSaving(true)
    try {
      const numero = encodeURIComponent(String(form.numero ?? ''))
      const modelo = encodeURIComponent(String(form.modelo ?? ''))
      const serie = encodeURIComponent(String(form.serie ?? ''))
      const codCliente = encodeURIComponent(String(form.codCliente ?? ''))

      const response = await fetch(`/api/NotasServico/cancelar/${numero}/${modelo}/${serie}/${codCliente}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivoCancelamento: motivoCancelamento.trim() }),
      })

      if (!response.ok) {
        const mensagem = await response.text()
        throw new Error(mensagem || 'Erro ao cancelar a nota.')
      }

      toast.success('Nota cancelada.')
      setOpen(false)
      setMotivoCancelamento('')
      setCancelamentoModo(false)
      load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao cancelar a nota.')
    } finally {
      setSaving(false)
    }
  }

  // ----- regras de bloqueio
  const chavePronta = !!form.numero && !!form.serie && !!form.modelo && !!form.codCliente
  const possuiItens = (form.servicos ?? []).length > 0
  const parcelasGeradas = (form.parcelasGeradas ?? []).length > 0
  const podeEditarNota = !editing || form.situacao === 'PENDENTE'
  const bloquearChave = cancelamentoModo || possuiItens || parcelasGeradas || !podeEditarNota
  const bloquearTudo = cancelamentoModo || parcelasGeradas || !podeEditarNota

  return (
    <div>
      <PageHeader title="Notas de Serviço" sub="Consulta de Notas de Serviço" label="Nova Nota" onNew={abrirNovaNota} disabled={open} />

      <DataTable
        columns={colsNotas}
        data={data}
        loading={loading}
        onDelete={r => abrirEdicaoNota(r, true)}
        deleteLabel="Cancelar"
        canDelete={r => String(r.situacao ?? '').toUpperCase() !== 'CANCELADA'}
      />

      <Modal
        open={open}
        title={cancelamentoModo ? 'Cancelar Nota de Serviço' : (editing ? 'Editar Nota de Serviço' : 'Nova Nota de Serviço')}
        editing={editing}
        cancelMode={cancelamentoModo}
        onClose={() => { setOpen(false); setMotivoCancelamento(''); setCancelamentoModo(false) }}
        onSave={cancelamentoModo ? cancelarNota : save}
        wide
        maxWidth={2000}
        isDirty={cancelamentoModo ? !!motivoCancelamento.trim() : isDirty}
        suspended={algumAberto || endereco.aberto}
      >
        {cancelamentoModo && (
          <div style={{ padding: '0 24px 16px', borderBottom: '1px solid #e2e6ed', marginBottom: 4 }}>
            <TextAreaField label="Motivo do Cancelamento *" value={motivoCancelamento} onChange={setMotivoCancelamento} rows={3} />
          </div>
        )}

        <div style={{ padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Inp label="Modelo" value={form.modelo} onChange={v => upd('modelo', v)} disabled={bloquearChave} style={{ flex: '0 0 80px' }} />
          <Inp label="Série" value={form.serie} onChange={v => upd('serie', v)} disabled={bloquearChave} style={{ flex: '0 0 70px' }} />
          <Inp label="Número" value={form.numero} onChange={v => upd('numero', v)} disabled={bloquearChave} style={{ flex: '0 0 110px' }} />
          <div style={{ flex: '0 0 105px' }}>
            <label style={lbl}>Código</label>
            <input type="text" value={form.codCliente ?? ''} readOnly
              style={{ ...inp, background: '#eef2f7', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }} />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <LookupField label="Cliente *" value={clienteLabel} disabled={bloquearChave}
              onSearch={() => { novoCliente.setShow(false); abrir('cliente') }} />
          </div>
          <DateField digitavel label="Data Emissão" value={form.dataEmissao} onChange={updDataEmissao} disabled={bloquearChave} max={hojeISO()} style={{ flex: '0 0 150px' }} />
        </div>

        {!chavePronta && !cancelamentoModo && <AvisoChaves parceiro="Cliente" />}

        {chavePronta && podeEditarNota && !parcelasGeradas && !cancelamentoModo && (
          <InlineForm title="Adicionar Serviço">
            <div style={{ flex: '1 1 260px', minWidth: 220 }}>
              <LookupField label="Serviço *" value={itemDraft.servicoNome}
                onSearch={() => { novoServico.setShow(false); abrir('servico') }} />
            </div>
            <ReadOnlyField label="Duração" value={itemDraft.duracaoMinutos ? `${itemDraft.duracaoMinutos} min` : '-'} style={{ flex: '0 0 100px' }} />
            <NumberField label="Quantidade" value={itemDraft.quantidade} onChange={updItemQuantidade} step="1" min="1" style={{ flex: '0 0 110px' }} />
            <NumberField label="Valor Unitário" value={itemDraft.valorUnitario} onChange={updItemValorUnitario} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
            <NumberField label="Desconto (%)" value={itemDraft.descontoPercentual} onChange={updItemDescontoPercentual} step="0.01" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Desconto Unit. (R$)" value={itemDraft.desconto} onChange={updItemDesconto} step="0.01" min="0" style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Unit. c/ Desconto" value={fmtMoney(valorUnitLiquidoDraft)} style={{ flex: '0 0 140px' }} />
            <ReadOnlyField label="Valor Bruto" value={fmtMoney(valorTotalItemDraft)} style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor Líquido" value={fmtMoney(valorLiquidoItemDraft)} style={{ flex: '0 0 140px' }} />
            <BtnPrimary onClick={addItem} style={{ padding: '9px 20px' }}>Adicionar</BtnPrimary>
          </InlineForm>
        )}

        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
            Serviços da Nota
          </div>
        </div>

        <ItemsList
          items={comUnitarioLiquido(form.servicos)}
          onRemove={removeItem}
          podeRemover={podeEditarNota && !parcelasGeradas && !cancelamentoModo}
        />

        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)}
            options={SITUACAO_OPTIONS.filter(o => o.value !== 'CANCELADA' || form.situacao === 'CANCELADA')}
            disabled={bloquearTudo || form.situacao === 'CONFERIDA'} style={{ flex: '0 0 180px' }} />
        </div>

        <div style={{ padding: '14px 24px 4px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} disabled={bloquearTudo} />
        </div>

        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <ReadOnlyField label="Valor Serviços" value={fmtMoney(valorServicosAtual)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Total Descontos" value={fmtMoney(descontoAtual)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Valor Total da Nota" value={fmtMoney(valorTotalAtual)} bold style={{ flex: '1 1 170px' }} />
        </div>

        <ParcelasGrid
          parcelas={form.parcelasGeradas ?? []}
          valorTotalNota={valorTotalAtual}
          onChangeParcela={updParcelaGerada}
          condicaoLabel={condicaoLabel}
          onSearchCondicao={() => { novaCondicao.setShow(false); abrir('condicao') }}
          onGerar={gerarParcelas}
          podeGerar={!!condicaoSelecionada && possuiItens && !parcelasGeradas && podeEditarNota}
          condicaoDisabled={bloquearTudo}
          bloqueado={cancelamentoModo || !podeEditarNota}
          dataDigitavel
        />
      </Modal>

      {/* ---------- consultas ---------- */}
      <LookupModal {...modal('cliente')} title="Consulta de Clientes" maxWidth={640}
        cols={colsClientes} rows={clientes} onSelect={selectCliente}
        paused={endereco.cidadeAberta}
        novo={{
          cadastro: novoCliente, titulo: 'Novo Cliente', salvarLabel: 'Salvar Cliente',
          campos: (
            <>
              <Inp label="Cliente *" value={novoCliente.form.cliente} onChange={v => novoCliente.upd('cliente', v)}
                placeholder="Razão social / nome" style={{ flex: '1 1 220px' }} />
              <Inp label={novoCliente.form.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'} value={novoCliente.form.cpfCnpj}
                onChange={v => novoCliente.upd('cpfCnpj', v)} style={{ flex: '1 1 180px' }} />
              <LookupField label="Cidade *" value={endereco.cidadeLabel(novoCliente.form.codCidade)}
                onSearch={endereco.abrir} style={{ flex: '1 1 200px' }} />
            </>
          ),
        }} />

      <LookupModal {...modal('condicao')} title="Consulta de Condições de Pagamento" maxWidth={760}
        cols={colsCondicoes} rows={condicoes} onSelect={selectCondicao}
        novo={{
          cadastro: novaCondicao, titulo: 'Nova Condição', salvarLabel: 'Salvar Condição',
          campos: (
            <Inp label="Descrição *" value={novaCondicao.form.condicaoPagamento} onChange={v => novaCondicao.upd('condicaoPagamento', v)}
              placeholder="Ex.: 30/60/90 dias" style={{ flex: '1 1 260px' }} />
          ),
          depoisAtivo: (
            <ParcelasCondicaoEditor
              parcelas={novaCondicao.form.parcelas}
              onChange={parcelas => novaCondicao.upd('parcelas', parcelas)}
              formaPagamentos={formaPagamentos} />
          ),
        }} />

      <LookupModal {...modal('servico')} title="Consulta de Serviços" maxWidth={640} zIndex={70}
        cols={colsServicos} rows={servicos.filter(s => s.ativo)} onSelect={selecionarServico}
        novo={{
          cadastro: novoServico, titulo: 'Novo Serviço', salvarLabel: 'Salvar Serviço',
          campos: (
            <>
              <Inp label="Serviço *" value={novoServico.form.servico} onChange={v => novoServico.upd('servico', v)}
                placeholder="Ex.: Corte masculino" maxLength={100} style={{ flex: '1 1 220px' }} />
              <NumberField label="Preço (R$) *" value={novoServico.form.preco} onChange={v => novoServico.upd('preco', v)} step="0.01" min="0" style={{ flex: '0 0 130px' }} />
              <NumberField label="Duração (min) *" value={novoServico.form.duracaoMinutos} onChange={v => novoServico.upd('duracaoMinutos', v)} step="1" min="1" style={{ flex: '0 0 130px' }} />
            </>
          ),
        }} />

      <ConsultaEndereco ctrl={endereco} />
    </div>
  )
}