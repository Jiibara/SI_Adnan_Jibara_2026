import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import useConsultaEndereco from '@/hooks/useConsultaEndereco'
import useConsultaProduto from '@/hooks/useConsultaProduto'
import DataTable from '@/components/DataTable'
import { Modal, PageHeader, FField } from '@/components/UI'
import {
  BtnPrimary, Inp, NumberField, DateField, SelectField, TextAreaField,
  ReadOnlyField, LookupField, InlineForm,
} from '@/components/form'
import LookupModal from '@/components/lookup/LookupModal'
import ConsultaEndereco from '@/components/lookup/ConsultaEndereco'
import ConsultaProduto from '@/components/lookup/ConsultaProduto'
import AvisoChaves from '@/components/nota/AvisoChaves'
import ParcelasGrid from '@/components/nota/ParcelasGrid'
import ParcelasCondicaoEditor from '@/components/nota/ParcelasCondicaoEditor'
import { notasSaidaApi, clientesApi, condicoesApi, transportadoresApi, formaPagamentosApi } from '@/services/api'
import { lbl, inp } from '@/styles/formStyles'
import { fmtMoney, arredondar2, arredondar4 } from '@/utils/format'
import { toDateInput, hojeISO } from '@/utils/date'
import { valorProdutosCalc, somaDescontosItens, valorTotalCalc } from '@/utils/notaCalculos'
import { montarParcelas, parcelasDaCondicao } from '@/utils/parcelas'
import { SITUACAO_OPTIONS } from '@/constants/nota'
import {
  CONDICAO_NOVA_EMPTY, CLIENTE_NOVO_EMPTY, colsClientes, colsCondicoes, colsTransportadoras, colsProdutosComPreco,
} from '@/constants/cadastros'
import ItemsList from './notasSaida/ItemsList'
import { comRateioSaida } from './notasSaida/calculos'
import {
  notaVazia, ITEM_EMPTY, TIPO_FRETE_OPTIONS, TRANSPORTADORA_NOVA_EMPTY, colsNotas,
} from './notasSaida/constantes'

const chaveNota = (numero, modelo, serie, codCliente) => `${numero}/${modelo}/${serie}/${codCliente}`

export default function NotaSaidaPage() {
  const { data, loading, load } = useCrud(notasSaidaApi)

  // ----- listas das consultas
  const [clientes, loadClientes] = useLista(clientesApi)
  const [condicoes, loadCondicoes] = useLista(condicoesApi)
  const [transportadoras, loadTransportadoras] = useLista(transportadoresApi)
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
  const [cidadeTarget, setCidadeTarget] = useState('cliente')   // quem recebe a cidade escolhida

  // ----- modais de consulta
  const { abrir, fechar, modal, algumAberto } = useModais()

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const updDataEmissao = v => {
    if (v && v > hojeISO()) { toast.error('A Data de Emissão não pode ser futura.'); return }
    if (form.dataSaida && v && form.dataSaida < v) {
      setForm(p => ({ ...p, dataEmissao: v, dataSaida: '' }))
      return
    }
    upd('dataEmissao', v)
  }

  const updDataSaida = v => {
    if (v && v > hojeISO()) { toast.error('A Data de Saída não pode ser futura.'); return }
    if (v && form.dataEmissao && v < form.dataEmissao) { toast.error('A Data de Saída não pode ser anterior à Data de Emissão.'); return }
    upd('dataSaida', v)
  }

  // ----- item em edição (rascunho)
  // "Desconto (R$)" é POR UNIDADE e sai do valor unitário (ex.: 8.888 - 5 = 8.883).
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

  // consulta de produtos (com Marca/Categoria); o modal fecha sozinho ao escolher ou cadastrar
  const produto = useConsultaProduto({
    aoSelecionar: r => setItemDraft({
      ...ITEM_EMPTY,
      codProd: r.codProd,
      produtoNome: r.produto ?? '',
      unidade: r.unidade ?? '',
      valorUnitario: Number(r.precoVenda) || 0,
    }),
  })

  const addItem = () => {
    if (!itemDraft.codProd) { toast.error('Selecione um produto.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (!Number.isInteger(Number(itemDraft.quantidade))) { toast.error('A quantidade deve ser um número inteiro.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }
    const jaExiste = (form.produtos ?? []).some(p => Number(p.codProd) === Number(itemDraft.codProd))
    if (jaExiste) { toast.error('Este produto já foi adicionado à nota.'); return }

    const quantidade = Number(itemDraft.quantidade)
    const valorUnitario = Number(itemDraft.valorUnitario)
    const descontoUnit = Number(itemDraft.desconto) || 0
    if (descontoUnit > valorUnitario) { toast.error('O desconto por unidade não pode ser maior que o valor unitário.'); return }
    const descontoPercentual = Number(itemDraft.descontoPercentual) || 0
    const descontoValor = arredondar2(descontoUnit * quantidade)           // desconto total do item
    const valorTotal = arredondar2(quantidade * valorUnitario - descontoValor)

    const novoItem = {
      numero: String(form.numero ?? ''),
      modelo: String(form.modelo ?? ''),
      serie: String(form.serie ?? ''),
      codCliente: Number(form.codCliente),
      codProd: Number(itemDraft.codProd),
      produtoNome: itemDraft.produtoNome,
      unidade: itemDraft.unidade,
      quantidade,
      valorUnitario,
      valorTotal,
      descontoPercentual,
      descontoValor,
      rateioFrete: 0,
      rateioSeguro: 0,
      rateioOutras: 0,
      custoFinal: 0,
    }
    setForm(f => ({ ...f, produtos: [...(f.produtos ?? []), novoItem], parcelasGeradas: [] }))
    setItemDraft(ITEM_EMPTY)
  }

  const removeItem = i => setForm(f => ({ ...f, produtos: (f.produtos ?? []).filter((_, idx) => idx !== i), parcelasGeradas: [] }))

  // ----- totais
  const valorProdutosAtual = arredondar2(valorProdutosCalc(form.produtos))
  const totalDescontosAtual = arredondar2(somaDescontosItens(form.produtos))
  const valorTotalAtual = valorTotalCalc(valorProdutosAtual, form.valorFrete, form.valorSeguro, form.outrasDespesas)
  const produtosComRateio = comRateioSaida(form.produtos, valorProdutosAtual, form.valorFrete, form.valorSeguro, form.outrasDespesas)

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

  const transportadorSelecionado = transportadoras.find(t => Number(t.codTransp) === Number(form.codTransp)) ?? form.transportador
  const transportadorLabel = transportadorSelecionado?.transportador ?? transportadorSelecionado?.nome ?? ''
  const selectTransportadora = r => {
    setForm(f => ({ ...f, codTransp: Number(r.codTransp), transportador: r }))
    fechar('transportadora')
  }

  // ----- parcelas
  const gerarParcelas = async () => {
    if (!form.produtos?.length) { toast.error('Adicione ao menos um produto antes de gerar as parcelas.'); return }
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
  const novaTransportadora = useCadastroRapido({
    empty: TRANSPORTADORA_NOVA_EMPTY, api: transportadoresApi, idKey: 'codTransp', recarregar: loadTransportadoras,
    validar: t => !t.transportador?.trim() ? 'Informe a transportadora.' : null,
    sucesso: 'Transportadora cadastrada!', erro: 'Erro ao salvar transportadora.',
    aoCriar: (cod, t) => selectTransportadora({ ...t, codTransp: cod }),
  })

  // a cidade escolhida/cadastrada vai para o cliente OU para a transportadora, conforme quem abriu a consulta
  const aplicarCidade = cod => (cidadeTarget === 'transportadora' ? novaTransportadora : novoCliente).upd('codCidade', cod)
  const endereco = useConsultaEndereco({
    aoSelecionarCidade: r => aplicarCidade(r.codCidade),
    aoCriarCidade: cod => aplicarCidade(cod),
  })
  const abrirCidadesPara = alvo => { setCidadeTarget(alvo); endereco.abrir() }

  // ----- abrir / editar nota
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  const abrirNovaNota = () => {
    const nova = { ...notaVazia(), dataSaida: hojeISO() }
    setForm(nova); setOriginalForm(nova); setItemDraft(ITEM_EMPTY)
    setEditing(false); setOpen(true)
  }

  const abrirEdicaoNota = async (r, modoCancelamento = false) => {
    try {
      const completa = await notasSaidaApi.getOne(chaveNota(r.numero, r.modelo, r.serie, r.codCliente))
      const formCarregado = {
        ...completa,
        numero: String(completa.numero ?? ''),
        serie: String(completa.serie ?? ''),
        modelo: String(completa.modelo ?? ''),
        codCliente: Number(completa.codCliente),
        dataEmissao: toDateInput(completa.dataEmissao),
        dataSaida: toDateInput(completa.dataSaida),
        valorFrete: Number(completa.valorFrete) || 0,
        valorSeguro: Number(completa.valorSeguro) || 0,
        outrasDespesas: Number(completa.outrasDespesas) || 0,
        valorDesconto: Number(completa.valorDesconto) || 0,
        valorProdutos: Number(completa.valorProdutos) || 0,
        valorTotal: Number(completa.valorTotal) || 0,
        codCondicao: completa.codCondicao ? Number(completa.codCondicao) : null,
        codTransp: completa.codTransp ? Number(completa.codTransp) : null,
        produtos: (completa.produtos ?? []).map(p => {
          const prod = p.produto ?? p.Produto ?? {}
          return {
            numero: String(p.numero ?? completa.numero ?? ''),
            modelo: String(p.modelo ?? completa.modelo ?? ''),
            serie: String(p.serie ?? completa.serie ?? ''),
            codCliente: Number(p.codCliente ?? completa.codCliente),
            codProd: Number(p.codProd),
            produtoNome: prod.produto ?? prod.Produto ?? `Produto #${p.codProd}`,
            unidade: prod.unidade ?? prod.Unidade ?? '',
            quantidade: Number(p.quantidade) || 0,
            valorUnitario: Number(p.valorUnitario) || 0,
            valorTotal: Number(p.valorTotal) || 0,
            descontoPercentual: Number(p.descontoPercentual) || 0,
            descontoValor: Number(p.descontoValor) || 0,
            rateioFrete: Number(p.rateioFrete) || 0,
            rateioSeguro: Number(p.rateioSeguro) || 0,
            rateioOutras: Number(p.rateioOutras) || 0,
            custoFinal: Number(p.custoFinal) || 0,
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
  const confirmarNaApi = async ({ numero, modelo, serie, codCliente }) => {
    const response = await fetch(`/api/NotasSaida/confirmar/${numero}/${modelo}/${serie}/${codCliente}`, { method: 'PUT' })
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
    if (form.dataSaida) {
      if (form.dataSaida > hojeISO()) { toast.error('A Data de Saída não pode ser futura.'); return }
      if (form.dataSaida < form.dataEmissao) { toast.error('A Data de Saída não pode ser anterior à Data de Emissão.'); return }
    }
    if (!form.produtos || form.produtos.length === 0) { toast.error('Adicione ao menos um item.'); return }
    if (form.produtos.some(p => !p.quantidade || Number(p.quantidade) <= 0)) { toast.error('Todos os itens devem possuir quantidade maior que zero.'); return }
    if (form.produtos.some(p => !Number.isInteger(Number(p.quantidade)))) { toast.error('A quantidade dos itens deve ser inteira.'); return }

    const situacaoAnterior = String(originalForm?.situacao ?? 'CONFERIDA').toUpperCase()
    const situacaoNova = String(form.situacao ?? 'CONFERIDA').toUpperCase()
    if (situacaoAnterior === 'CONFERIDA' && situacaoNova !== 'CONFERIDA') {
      toast.error('Uma nota conferida não pode voltar para Pendente ou Cancelada.')
      return
    }

    const payload = {
      ...form,
      numero: String(form.numero ?? ''),
      serie: String(form.serie ?? ''),
      modelo: String(form.modelo ?? ''),
      codCliente: Number(form.codCliente),
      dataEmissao: form.dataEmissao,
      dataSaida: form.dataSaida || null,
      valorProdutos: valorProdutosAtual,
      valorFrete: Number(form.valorFrete) || 0,
      valorSeguro: Number(form.valorSeguro) || 0,
      outrasDespesas: Number(form.outrasDespesas) || 0,
      valorDesconto: totalDescontosAtual,
      valorTotal: valorTotalAtual,
      codCondicao: form.codCondicao ? Number(form.codCondicao) : null,
      codTransp: form.codTransp ? Number(form.codTransp) : null,
      placaVeiculo: form.placaVeiculo || null,
      observacoes: form.observacoes || null,
      situacao: situacaoNova,
      produtos: produtosComRateio.map(item => ({
        numero: String(item.numero ?? form.numero ?? ''),
        modelo: String(item.modelo ?? form.modelo ?? ''),
        serie: String(item.serie ?? form.serie ?? ''),
        codCliente: Number(item.codCliente ?? form.codCliente),
        codProd: Number(item.codProd),
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario) || 0,
        valorTotal: Number(item.valorTotal) || 0,
        descontoPercentual: Number(item.descontoPercentual) || 0,
        descontoValor: Number(item.descontoValor) || 0,
        rateioFrete: Number(item.rateioFrete) || 0,
        rateioSeguro: Number(item.rateioSeguro) || 0,
        rateioOutras: Number(item.rateioOutras) || 0,
        custoFinal: Number(item.custoFinal) || 0,
      })),
    }
    delete payload.parcelasGeradas

    const chave = chaveNota(payload.numero, payload.modelo, payload.serie, payload.codCliente)
    setSaving(true)
    try {
      if (editing) {
        if (situacaoAnterior === 'PENDENTE' && situacaoNova === 'CONFERIDA') {
          await notasSaidaApi.update(chave, { ...payload, situacao: 'PENDENTE' })
          await confirmarNaApi(payload)
        } else {
          await notasSaidaApi.update(chave, payload)
        }
      } else {
        await notasSaidaApi.create({ ...payload, situacao: 'PENDENTE' })
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

      const response = await fetch(`/api/NotasSaida/cancelar/${numero}/${modelo}/${serie}/${codCliente}`, {
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
  const possuiItens = (form.produtos ?? []).length > 0
  const parcelasGeradas = (form.parcelasGeradas ?? []).length > 0
  const podeEditarNota = !editing || form.situacao === 'PENDENTE'
  const bloquearChave = cancelamentoModo || possuiItens || parcelasGeradas || !podeEditarNota
  const bloquearTudo = cancelamentoModo || parcelasGeradas || !podeEditarNota

  return (
    <div>
      <PageHeader title="Notas de Saída" sub="Consulta de Notas de Saída" label="Nova Nota" onNew={abrirNovaNota} disabled={open} />

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
        title={cancelamentoModo ? 'Cancelar Nota de Saída' : (editing ? 'Editar Nota de Saída' : 'Nova Nota de Saída')}
        editing={editing}
        cancelMode={cancelamentoModo}
        onClose={() => { setOpen(false); setMotivoCancelamento(''); setCancelamentoModo(false) }}
        onSave={cancelamentoModo ? cancelarNota : save}
        wide
        maxWidth={2000}
        isDirty={cancelamentoModo ? !!motivoCancelamento.trim() : isDirty}
        suspended={algumAberto || produto.aberto || endereco.aberto}
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
          <DateField digitavel label="Data Saída" value={form.dataSaida} onChange={updDataSaida} disabled={bloquearChave} min={form.dataEmissao || undefined} max={hojeISO()} style={{ flex: '0 0 150px' }} />
        </div>

        {!chavePronta && !cancelamentoModo && <AvisoChaves parceiro="Cliente" />}

        {chavePronta && podeEditarNota && !parcelasGeradas && !cancelamentoModo && (
          <InlineForm title="Adicionar Item">
            <div style={{ flex: '1 1 260px', minWidth: 220 }}>
              <LookupField label="Produto *" value={itemDraft.produtoNome} onSearch={produto.abrir} />
            </div>
            <ReadOnlyField label="Unidade" value={itemDraft.unidade || '-'} style={{ flex: '0 0 70px' }} />
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
            Produtos da Nota
          </div>
        </div>

        <ItemsList items={produtosComRateio} onRemove={removeItem} podeRemover={podeEditarNota} />

        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <SelectField label="Tipo Frete" value={form.tipoFrete} onChange={v => upd('tipoFrete', v)} options={TIPO_FRETE_OPTIONS} disabled={bloquearTudo} style={{ flex: '0 0 230px' }} />
          <SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)}
            options={SITUACAO_OPTIONS.filter(o => o.value !== 'CANCELADA' || form.situacao === 'CANCELADA')}
            disabled={bloquearTudo || form.situacao === 'CONFERIDA'} style={{ flex: '0 0 180px' }} />
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
            <LookupField label="Transportadora" value={transportadorLabel} disabled={bloquearTudo}
              onSearch={() => { novaTransportadora.setShow(false); abrir('transportadora') }} />
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <FField label="Placa Veículo" value={form.placaVeiculo ?? ''} onChange={v => upd('placaVeiculo', v.toUpperCase())} disabled={bloquearTudo} />
          </div>
        </div>

        <div style={{ padding: '14px 24px 4px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} disabled={bloquearTudo} />
        </div>

        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <ReadOnlyField label="Valor Produtos" value={fmtMoney(valorProdutosAtual)} style={{ flex: '1 1 150px' }} />
          <NumberField label="Valor Frete" value={form.valorFrete} onChange={v => upd('valorFrete', v)} step="0.01" min="0" disabled={bloquearTudo} style={{ flex: '1 1 130px' }} />
          <NumberField label="Valor Seguro" value={form.valorSeguro} onChange={v => upd('valorSeguro', v)} step="0.01" min="0" disabled={bloquearTudo} style={{ flex: '1 1 130px' }} />
          <NumberField label="Outras Despesas" value={form.outrasDespesas} onChange={v => upd('outrasDespesas', v)} step="0.01" min="0" disabled={bloquearTudo} style={{ flex: '1 1 140px' }} />
          <ReadOnlyField label="Total Descontos" value={fmtMoney(totalDescontosAtual)} style={{ flex: '1 1 150px' }} />
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
                onSearch={() => abrirCidadesPara('cliente')} style={{ flex: '1 1 200px' }} />
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

      <LookupModal {...modal('transportadora')} title="Consulta de Transportadoras" maxWidth={700}
        cols={colsTransportadoras} rows={transportadoras} onSelect={selectTransportadora}
        paused={endereco.cidadeAberta}
        novo={{
          cadastro: novaTransportadora, titulo: 'Nova Transportadora', salvarLabel: 'Salvar Transportadora',
          campos: (
            <>
              <Inp label="Transportadora *" value={novaTransportadora.form.transportador} onChange={v => novaTransportadora.upd('transportador', v)}
                placeholder="Razão social / nome" style={{ flex: '1 1 220px' }} />
              <Inp label="CPF/CNPJ" value={novaTransportadora.form.cpfCnpj} onChange={v => novaTransportadora.upd('cpfCnpj', v)} style={{ flex: '1 1 180px' }} />
              <LookupField label="Cidade" value={endereco.cidadeLabel(novaTransportadora.form.codCidade)}
                onSearch={() => abrirCidadesPara('transportadora')} style={{ flex: '1 1 200px' }} />
            </>
          ),
        }} />

      <ConsultaEndereco ctrl={endereco} />
      <ConsultaProduto ctrl={produto} cols={colsProdutosComPreco} />
    </div>
  )
}
