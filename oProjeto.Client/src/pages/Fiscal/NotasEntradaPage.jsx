import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import DataTable from '@/components/DataTable'
import { Modal, PageHeader, FField } from '@/components/UI'
import {
  BtnPrimary, Inp, NumberField, DateField, SelectField, TextAreaField,
  ReadOnlyField, LookupField, InlineForm,
} from '@/components/form'
import LookupModal from '@/components/lookup/LookupModal'
import { notasEntradaApi, fornecedoresApi, condicoesApi, transportadoresApi, formaPagamentosApi } from '@/services/api'
import useConsultaEndereco from '@/hooks/useConsultaEndereco'
import useConsultaProduto from '@/hooks/useConsultaProduto'
import ConsultaEndereco from '@/components/lookup/ConsultaEndereco'
import ConsultaProduto from '@/components/lookup/ConsultaProduto'
import AvisoChaves from '@/components/nota/AvisoChaves'
import ParcelasGrid from '@/components/nota/ParcelasGrid'
import { lbl, inp } from '@/styles/formStyles'
import { fmtMoney, arredondar2, arredondar4 } from '@/utils/format'
import { toDateInput, hojeISO } from '@/utils/date'
import { valorProdutosCalc, somaDescontosItens, valorTotalCalc } from '@/utils/notaCalculos'
import { montarParcelas, parcelasDaCondicao } from '@/utils/parcelas'
import { SITUACAO_OPTIONS } from '@/constants/nota'
import { FORNECEDOR_NOVO_EMPTY, colsFornecedores, colsCondicoes, colsTransportadoras } from '@/constants/cadastros'
import ItemsList from './notasEntrada/ItemsList'
import { comRateio } from './notasEntrada/calculos'
import {
  notaVazia, ITEM_EMPTY, TIPO_FRETE_OPTIONS, colsNotas, colsPedidosCompra,
} from './notasEntrada/constantes'

const chaveNota = (numero, modelo, serie, codForn) =>
  [numero, modelo, serie, codForn]
    .map(v => encodeURIComponent(String(v ?? '')))
    .join('/')

export default function NotasEntradaPage() {
  const { data, loading, load } = useCrud(notasEntradaApi)

  // ----- listas das consultas
  const [fornecedores, loadFornecedores] = useLista(fornecedoresApi)
  const [condicoes] = useLista(condicoesApi)
  const [transportadoras] = useLista(transportadoresApi)
  const [formaPagamentos] = useLista(formaPagamentosApi)

  // ----- estado da nota
  const [form, setForm] = useState(notaVazia)
  const [originalForm, setOriginalForm] = useState(notaVazia)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelamentoModo, setCancelamentoModo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [itemDraft, setItemDraft] = useState(ITEM_EMPTY)

  // ----- modais de consulta
  const { abrir, fechar, modal, algumAberto } = useModais()
  const [pedidosCompra, setPedidosCompra] = useState([])
  const [loadingPedidosCompra, setLoadingPedidosCompra] = useState(false)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ----- item em edição (rascunho)
  // "Desconto (R$)" é POR UNIDADE e sai do valor unitário (ex.: 8.888 - 5 = 8.883).
  // descontoValor = desconto total do item = desconto por unidade x quantidade.
  const updItemQuantidade = (v) => setItemDraft(d => ({
    ...d, quantidade: v, descontoValor: (Number(d.desconto) || 0) * (Number(v) || 0),
  }))

  const updItemValorUnitario = (v) => setItemDraft(d => {
    const desconto = arredondar4((Number(v) || 0) * (Number(d.descontoPercentual) || 0) / 100)
    return { ...d, valorUnitario: v, desconto, descontoValor: desconto * (Number(d.quantidade) || 0) }
  })

  const updItemDesconto = (v) => setItemDraft(d => {
    const unit = Number(d.valorUnitario) || 0
    const descontoUnit = Number(v) || 0
    const percentual = unit > 0 ? (descontoUnit / unit) * 100 : 0
    return { ...d, desconto: v, descontoValor: descontoUnit * (Number(d.quantidade) || 0), descontoPercentual: percentual }
  })

  const updItemDescontoPercentual = (v) => setItemDraft(d => {
    const desconto = arredondar4((Number(d.valorUnitario) || 0) * (Number(v) || 0) / 100)
    return { ...d, desconto, descontoValor: desconto * (Number(d.quantidade) || 0), descontoPercentual: v }
  })

  // ----- pedido de compra
  const abrirPedidosCompra = async () => {
    if (!form.codForn) { toast.error('Selecione o fornecedor antes de buscar um pedido de compra.'); return }
    setLoadingPedidosCompra(true)
    try {
      const response = await fetch(`/api/Compras/pendentes/${form.codForn}`)
      if (!response.ok) throw new Error()
      const rows = await response.json()
      setPedidosCompra(rows ?? [])
      abrir('pedido')
    } catch {
      toast.error('Erro ao carregar os pedidos de compra.')
    } finally {
      setLoadingPedidosCompra(false)
    }
  }

  const selecionarPedidoCompra = async r => {
    try {
      const response = await fetch(`/api/Compras/${r.numero}/${r.serie}/${r.modelo}/${r.codForn}`)
      if (!response.ok) throw new Error()
      const pedido = await response.json()
      const itens = (pedido?.produtos ?? []).map(p => {
        const quantidadeComprada = Number(p.quantidade) || 0
        const quantidadeRecebidaAnterior = Number(p.quantidadeRecebida) || 0
        const quantidadePendente = Math.max(quantidadeComprada - quantidadeRecebidaAnterior, 0)
        const valorUnitario = Number(p.valorUnitario) || 0
        const descontoPercentual = Number(p.descontoPercentual) || 0
        const quantidade = 0
        const bruto = quantidade * valorUnitario
        const descontoValor = bruto * descontoPercentual / 100
        const valorTotal = bruto - descontoValor
        return {
          codProd: p.codProd,
          produtoNome: p.produto?.produto ?? '',
          unidade: p.produto?.unidade ?? '',
          quantidadeComprada,
          quantidadeRecebidaAnterior,
          quantidadePendente,
          quantidadeFalta: quantidadePendente,
          quantidade,
          valorUnitario,
          valorTotal,
          descontoPercentual,
          descontoValor,
          desconto: descontoValor,
        }
      }).filter(p => p.quantidadePendente > 0)

      if (itens.length === 0) {
        toast.error('Este pedido não possui itens pendentes de recebimento.')
        return
      }

      setForm(f => ({
        ...f,
        codForn: r.codForn,
        fornecedor: r.fornecedor,
        pedidoNumero: r.numero != null ? String(r.numero) : null,
        pedidoSerie: r.serie != null ? String(r.serie) : null,
        pedidoModelo: r.modelo != null ? String(r.modelo) : null,
        produtos: itens,
        codCondicao: pedido.codCondicao ?? f.codCondicao,
        condicaoPagamento: pedido.condicao ?? f.condicaoPagamento,
      }))
      setItemDraft(ITEM_EMPTY)
      fechar('pedido')
    } catch {
      toast.error('Erro ao carregar os itens do pedido de compra.')
    }
  }

  const updQuantidadeReceber = (i, v) => {
    setForm(f => ({
      ...f,
      produtos: (f.produtos ?? []).map((it, idx) => {
        if (idx !== i || it.quantidadePendente == null) return it   // item avulso: quantidade não é editável na grid
        let quantidade = v === '' ? '' : Number(v)
        const max = Number(it.quantidadePendente) || 0
        if (quantidade !== '' && quantidade < 0) quantidade = 0
        if (quantidade !== '' && quantidade > max) quantidade = max
        const bruto = (Number(quantidade) || 0) * (Number(it.valorUnitario) || 0)
        const descontoValor = bruto * (Number(it.descontoPercentual) || 0) / 100
        const valorTotal = bruto - descontoValor
        return { ...it, quantidade, quantidadeFalta: Math.max(max - (Number(quantidade) || 0), 0), descontoValor, desconto: descontoValor, valorTotal }
      }),
    }))
  }

  // ----- regras derivadas da nota
  const chavePronta = !!(form.numero && form.serie && form.modelo && form.codForn)
  const chaveInformada =
    String(form.modelo ?? '').trim() !== '' &&
    String(form.serie ?? '').trim() !== '' &&
    String(form.numero ?? '').trim() !== '' &&
    Number(form.codForn) > 0

  const camposLiberados = chaveInformada
  const chaveBloqueada = (form.produtos ?? []).length > 0
  const parcelasBloqueadas = (form.parcelasGeradas ?? []).length > 0

  const valorProdutosAtual = valorProdutosCalc(form.produtos)
  const totalDescontosAtual = somaDescontosItens(form.produtos)
  const valorTotalAtual = valorTotalCalc(valorProdutosAtual, form.valorFrete, form.valorSeguro, form.outrasDespesas)
  const valorTotalItemDraft = (Number(itemDraft.quantidade) || 0) * (Number(itemDraft.valorUnitario) || 0)
  const valorUnitLiquidoDraft = Math.max((Number(itemDraft.valorUnitario) || 0) - (Number(itemDraft.desconto) || 0), 0)
  const valorLiquidoItemDraft = (Number(itemDraft.quantidade) || 0) * valorUnitLiquidoDraft
  const produtosComRateio = comRateio(form.produtos, form.valorFrete, form.valorSeguro, form.outrasDespesas)

  const addItem = () => {
    if (!chaveInformada) {
      toast.error('Informe Modelo, Série, Número e Fornecedor antes de adicionar itens.')
      return
    }
    if (!itemDraft.codProd) { toast.error('Selecione um produto.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }
    if (Number(itemDraft.desconto) < 0) { toast.error('Desconto não pode ser negativo.'); return }
    if ((Number(itemDraft.desconto) || 0) > Number(itemDraft.valorUnitario)) { toast.error('O desconto por unidade não pode ser maior que o valor unitário.'); return }

    const produtoJaAdicionado = (form.produtos ?? []).some(
      item => Number(item.codProd) === Number(itemDraft.codProd)
    )

    if (produtoJaAdicionado) {
      toast.error('Este produto já foi adicionado à nota.')
      return
    }

    const descontoTotalItem = arredondar2((Number(itemDraft.desconto) || 0) * Number(itemDraft.quantidade))
    const novoItem = {
      codProd: itemDraft.codProd,
      produtoNome: itemDraft.produtoNome,
      unidade: itemDraft.unidade,
      quantidade: Number(itemDraft.quantidade),
      quantidadeComprada: null,
      quantidadeRecebidaAnterior: 0,
      quantidadePendente: null,
      quantidadeFalta: null,
      valorUnitario: Number(itemDraft.valorUnitario),
      valorTotal: arredondar2(Number(itemDraft.quantidade) * Number(itemDraft.valorUnitario) - descontoTotalItem),
      descontoPercentual: Number(itemDraft.descontoPercentual) || 0,
      descontoValor: descontoTotalItem,
      desconto: descontoTotalItem,
    }
    setForm(f => ({ ...f, produtos: [...(f.produtos ?? []), novoItem] }))
    setItemDraft(ITEM_EMPTY)
  }

  const removeItem = (i) => setForm(f => ({ ...f, produtos: f.produtos.filter((_, idx) => idx !== i), parcelasGeradas: [] }))

  // ----- salvar / confirmar / cancelar
  const confirmarNaApi = async ({ numero, modelo, serie, codForn }) => {
    const response = await fetch(`/api/NotasEntrada/confirmar/${numero}/${modelo}/${serie}/${codForn}`, { method: 'PUT' })
    if (!response.ok) {
      const mensagem = await response.text()
      throw new Error(mensagem || 'Erro ao confirmar a nota.')
    }
  }

  const save = async () => {
    if (!chaveInformada) {
      toast.error('Informe Modelo, Série, Número e Fornecedor antes de continuar.')
      return
    }
    if (!form.codForn) { toast.error('Selecione o fornecedor.'); return }
    if (!form.numero || !form.serie || !form.modelo) { toast.error('Informe número, série e modelo.'); return }
    if (!form.produtos || form.produtos.length === 0) { toast.error('Adicione ao menos um item.'); return }
    if (form.produtos.some(p => !p.quantidade || Number(p.quantidade) <= 0)) { toast.error('Informe uma quantidade recebida maior que zero em todos os itens.'); return }

    const hoje = hojeISO()
    const dataEmissao = toDateInput(form.dataEmissao)
    const dataChegada = toDateInput(form.dataChegada)

    if (!dataEmissao || dataEmissao > hoje) { toast.error('A Data de Emissão não pode ser futura.'); return }
    if (dataChegada && (dataChegada < dataEmissao || dataChegada > hoje)) { toast.error('A Data de Chegada deve estar entre a Data de Emissão e a data atual.'); return }

    const payload = {
      ...form,
      numero: String(form.numero ?? ''),
      serie: String(form.serie ?? ''),
      modelo: String(form.modelo ?? ''),
      dataChegada: form.dataChegada || null,
      valorProdutos: valorProdutosAtual,
      valorDesconto: totalDescontosAtual,
      valorTotal: valorTotalAtual,
      produtos: produtosComRateio.map(it => ({
        numero: String(form.numero ?? ''),
        serie: String(form.serie ?? ''),
        modelo: String(form.modelo ?? ''),
        codProd: it.codProd,
        quantidade: it.quantidade,
        valorUnitario: it.valorUnitario,
        valorTotal: it.valorTotal,
        rateioFrete: it.rateioFrete,
        rateioSeguro: it.rateioSeguro,
        rateioOutras: it.rateioOutras,
        descontoPercentual: Number(it.descontoPercentual) || 0,
        descontoValor: Number(it.descontoValor ?? it.desconto) || 0,
        custoFinal: it.custoFinal,
      })),
    }
    delete payload.parcelasGeradas

    setSaving(true)
    try {
      if (editing) {
        const situacaoAnterior = String(originalForm?.situacao ?? 'PENDENTE').toUpperCase()
        const situacaoNova = String(payload.situacao ?? 'PENDENTE').toUpperCase()

        if (situacaoAnterior === 'PENDENTE' && situacaoNova === 'CONFERIDA') {
          await notasEntradaApi.update(chaveNota(payload.numero, payload.modelo, payload.serie, payload.codForn), { ...payload, situacao: 'PENDENTE' })
          await confirmarNaApi(payload)
        } else {
          await notasEntradaApi.update(chaveNota(payload.numero, payload.modelo, payload.serie, payload.codForn), payload)
        }
      } else {
        await notasEntradaApi.create({ ...payload, situacao: 'PENDENTE' })
        if (String(payload.situacao).toUpperCase() === 'CONFERIDA') await confirmarNaApi(payload)
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
    if (!form?.numero || !form?.modelo || !form?.serie || !form?.codForn) return
    if (!motivoCancelamento.trim()) { toast.error('Informe o motivo do cancelamento.'); return }

    setSaving(true)
    try {
      const numero = encodeURIComponent(String(form.numero ?? ''))
      const modelo = encodeURIComponent(String(form.modelo ?? ''))
      const serie = encodeURIComponent(String(form.serie ?? ''))
      const codForn = encodeURIComponent(String(form.codForn ?? ''))

      const response = await fetch(`/api/NotasEntrada/cancelar/${numero}/${modelo}/${serie}/${codForn}`, {
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

  // ----- seleções nas consultas
  const fornecedorSelecionado = fornecedores.find(f => f.codForn === form.codForn) ?? form.fornecedor
  const fornecedorLabel = fornecedorSelecionado?.fornecedor ?? ''
  const selectFornecedor = r => {
    setForm(f => {
      const mudouFornecedor = f.codForn && Number(f.codForn) !== Number(r.codForn)
      return {
        ...f,
        codForn: r.codForn,
        fornecedor: r,
        pedidoNumero: mudouFornecedor ? null : f.pedidoNumero,
        pedidoSerie: mudouFornecedor ? null : f.pedidoSerie,
        pedidoModelo: mudouFornecedor ? null : f.pedidoModelo,
        produtos: mudouFornecedor ? [] : f.produtos,
        codCondicao: r.condicao?.codCondicao ?? null,
        condicaoPagamento: r.condicao ?? null,
      }
    })
    setItemDraft(ITEM_EMPTY)
    fechar('fornecedor')
  }

  const condicaoSelecionada = condicoes.find(c => String(c.codCondicao) === String(form.codCondicao)) ?? form.condicaoPagamento
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? ''
  const selectCondicao = r => {
    setForm(f => ({ ...f, codCondicao: r.codCondicao, condicaoPagamento: r, parcelasGeradas: [] }))
    fechar('condicao')
  }

  const transportadorSelecionado = transportadoras.find(t => t.codTransp === form.codTransp) ?? form.transportador
  const transportadorLabel = transportadorSelecionado?.transportador ?? ''
  const selectTransportadora = r => { setForm(f => ({ ...f, codTransp: r.codTransp, transportador: r })); fechar('transportadora') }

  // consulta de produtos (com Marca/Categoria); o modal fecha sozinho ao escolher ou cadastrar
  const produto = useConsultaProduto({
    aoSelecionar: r => setItemDraft(d => ({ ...d, codProd: r.codProd, produtoNome: r.produto, unidade: r.unidade ?? '' })),
  })

  // ----- parcelas
  const gerarParcelas = async () => {
    if (!chaveInformada) {
      toast.error('Informe Modelo, Série, Número e Fornecedor antes de gerar parcelas.')
      return
    }
    if (!form.produtos || form.produtos.length === 0) { toast.error('Adicione ao menos um produto antes de gerar parcelas.'); return }
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

  // ----- cadastro rápido do fornecedor + cadeia de endereço (Cidade -> Estado -> País)
  const novoFornecedor = useCadastroRapido({
    empty: FORNECEDOR_NOVO_EMPTY, api: fornecedoresApi, idKey: 'codForn', recarregar: loadFornecedores,
    validar: f => !f.fornecedor?.trim() ? 'Informe o fornecedor.' : !f.codCidade ? 'Selecione a cidade.' : null,
    sucesso: 'Fornecedor cadastrado!', erro: 'Erro ao salvar fornecedor.',
    aoCriar: (cod, f) => selectFornecedor({ ...f, codForn: cod, condicao: null }),
  })
  const endereco = useConsultaEndereco({
    aoSelecionarCidade: r => novoFornecedor.upd('codCidade', r.codCidade),
    aoCriarCidade: cod => novoFornecedor.upd('codCidade', cod),
  })

  const abrirFornecedores = () => { novoFornecedor.setShow(false); abrir('fornecedor') }

  // ----- abrir / editar nota
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  const abrirNovaNota = () => {
    const nova = notaVazia()
    setForm(nova); setOriginalForm(nova); setItemDraft(ITEM_EMPTY)
    setEditing(false); setOpen(true); setMotivoCancelamento(''); setCancelamentoModo(false)
  }

  const abrirEdicaoNota = async (r, modoCancelamento = false) => {
    let completa
    try {
      completa = await notasEntradaApi.getOne(chaveNota(r.numero, r.modelo, r.serie, r.codForn))
    } catch {
      toast.error('Erro ao carregar a nota.')
      return
    }

    let pedidoCompleto = null
    if (completa.pedidoNumero && completa.pedidoSerie && completa.pedidoModelo && completa.codForn) {
      try {
        const response = await fetch(`/api/Compras/${completa.pedidoNumero}/${completa.pedidoSerie}/${completa.pedidoModelo}/${completa.codForn}`)
        if (response.ok) pedidoCompleto = await response.json()
      } catch {
        pedidoCompleto = null
      }
    }

    const itensPedido = pedidoCompleto?.produtos ?? []

    const formCarregado = {
      ...completa,
      numero: completa.numero != null ? String(completa.numero) : '',
      serie: completa.serie != null ? String(completa.serie) : '',
      modelo: completa.modelo != null ? String(completa.modelo) : '',
      pedidoNumero: completa.pedidoNumero != null ? String(completa.pedidoNumero) : null,
      pedidoSerie: completa.pedidoSerie != null ? String(completa.pedidoSerie) : null,
      pedidoModelo: completa.pedidoModelo != null ? String(completa.pedidoModelo) : null,
      dataEmissao: toDateInput(completa.dataEmissao),
      dataChegada: toDateInput(completa.dataChegada),
      produtos: (completa.produtos ?? []).map(p => {
        const produto = p.produto ?? p.Produto ?? {}
        const itemPedido = itensPedido.find(x => Number(x.codProd ?? x.CodProd) === Number(p.codProd))
        const quantidade = Number(p.quantidade) || 0
        const quantidadeComprada = itemPedido ? Number(itemPedido.quantidade ?? itemPedido.Quantidade) || 0 : null
        const quantidadeRecebidaTotal = itemPedido ? Number(itemPedido.quantidadeRecebida ?? itemPedido.QuantidadeRecebida) || 0 : 0
        const quantidadeRecebidaAnterior = itemPedido ? Math.max(quantidadeRecebidaTotal - quantidade, 0) : 0
        const quantidadePendente = itemPedido ? Math.max(quantidadeComprada - quantidadeRecebidaAnterior, 0) : null
        const quantidadeFalta = itemPedido ? Math.max(quantidadePendente - quantidade, 0) : null
        const descontoValor = p.descontoValor ?? p.desconto ?? 0

        return {
          codProd: p.codProd,
          produtoNome: produto.produto ?? produto.Produto ?? '',
          unidade: produto.unidade ?? produto.Unidade ?? '',
          quantidadeComprada,
          quantidadeRecebidaAnterior,
          quantidadePendente,
          quantidadeFalta,
          quantidade: p.quantidade,
          valorUnitario: p.valorUnitario,
          valorTotal: (Number(p.quantidade) || 0) * (Number(p.valorUnitario) || 0) - (Number(descontoValor) || 0),
          descontoPercentual: p.descontoPercentual ?? 0,
          descontoValor,
          desconto: descontoValor,
        }
      }),
      parcelasGeradas: completa.parcelasGeradas ?? [],
    }
    setForm(formCarregado); setOriginalForm(formCarregado); setItemDraft(ITEM_EMPTY)
    setEditing(true); setOpen(true); setMotivoCancelamento(''); setCancelamentoModo(modoCancelamento)
  }

  const bloqueado = cancelamentoModo || parcelasBloqueadas
  const semCampos = cancelamentoModo || !camposLiberados || parcelasBloqueadas
  const semParcelas = cancelamentoModo || !camposLiberados || !(form.produtos ?? []).length

  return (
    <div>
      <PageHeader title="Notas de Entrada" sub="Consulta de Notas de Entrada" label="Nova Nota" onNew={abrirNovaNota} disabled={open} />

      {/* Somente o botão "Cancelar" (sem Editar). Oculto para notas já canceladas. */}
      <DataTable columns={colsNotas} data={data} loading={loading}
        onDelete={r => abrirEdicaoNota(r, true)}
        deleteLabel="Cancelar"
        canDelete={r => String(r.situacao ?? '').toUpperCase() !== 'CANCELADA'} />

      <Modal open={open}
        title={cancelamentoModo ? 'Cancelar Nota de Entrada' : (editing ? 'Editar Nota de Entrada' : 'Nova Nota de Entrada')}
        editing={editing}
        cancelMode={cancelamentoModo}
        onClose={() => { setOpen(false); setMotivoCancelamento(''); setCancelamentoModo(false) }}
        onSave={cancelamentoModo ? cancelarNota : save} wide maxWidth={2000}
        isDirty={cancelamentoModo ? !!motivoCancelamento.trim() : isDirty}
        suspended={algumAberto || produto.aberto || endereco.aberto}>

        {cancelamentoModo && (
          <div style={{ padding: '0 24px 16px', borderBottom: '1px solid #e2e6ed', marginBottom: 4 }}>
            <TextAreaField label="Motivo do Cancelamento *" value={motivoCancelamento} onChange={v => setMotivoCancelamento(v)} rows={3} />
          </div>
        )}

        <div style={{ padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <FField label="Modelo" value={form.modelo} onChange={v => upd('modelo', v)} disabled={cancelamentoModo || chaveBloqueada || parcelasBloqueadas} style={{ flex: '0 0 80px' }} />
          <FField label="Série" value={form.serie} onChange={v => upd('serie', v)} disabled={cancelamentoModo || chaveBloqueada || parcelasBloqueadas} style={{ flex: '0 0 70px' }} />
          <FField label="Número" value={form.numero} onChange={v => upd('numero', v)} disabled={cancelamentoModo || chaveBloqueada || parcelasBloqueadas} style={{ flex: '0 0 110px' }} />
          <div style={{ flex: '0 0 105px' }}>
            <label style={lbl}>Código</label>
            <input type="text" value={form.codForn ?? ''} readOnly style={{ ...inp, background: '#eef2f7', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }} />
          </div>

          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <LookupField label="Fornecedor *" value={fornecedorLabel} disabled={cancelamentoModo || chaveBloqueada || parcelasBloqueadas} onSearch={abrirFornecedores} />
          </div>

          <DateField label="Data Emissão" value={form.dataEmissao} onChange={v => upd('dataEmissao', v)} required max={hojeISO()} disabled={cancelamentoModo || !camposLiberados || chaveBloqueada || parcelasBloqueadas} style={{ flex: '0 0 150px' }} />
          <DateField label="Data Chegada" value={form.dataChegada} onChange={v => upd('dataChegada', v)} min={form.dataEmissao || undefined} max={hojeISO()} disabled={cancelamentoModo || !camposLiberados || chaveBloqueada || parcelasBloqueadas} style={{ flex: '0 0 150px' }} />
        </div>

        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <LookupField label="Pedido de Compra" value={form.pedidoNumero ? `Pedido ${form.pedidoNumero}/${form.pedidoSerie} - Modelo ${form.pedidoModelo}` : ''}
            onSearch={abrirPedidosCompra} disabled={cancelamentoModo || !camposLiberados || editing || parcelasBloqueadas || loadingPedidosCompra} style={{ flex: '0 0 420px' }} />
        </div>

        {chavePronta && !cancelamentoModo ? (
          <InlineForm title="Adicionar Item">
            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <LookupField label="Produto *" value={itemDraft.produtoNome}
                onSearch={produto.abrir}
                disabled={bloqueado} />
            </div>
            <ReadOnlyField label="Unidade" value={itemDraft.unidade || '-'} style={{ flex: '0 0 50px' }} />
            <NumberField label="Quantidade" value={itemDraft.quantidade} onChange={updItemQuantidade} step="1" min="0" disabled={bloqueado} style={{ flex: '0 0 110px' }} />
            <NumberField label="Valor Unitário" value={itemDraft.valorUnitario} onChange={updItemValorUnitario} step="0.01" min="0" disabled={bloqueado} style={{ flex: '0 0 140px' }} />
            <NumberField label="Desconto (%)" value={itemDraft.descontoPercentual} onChange={updItemDescontoPercentual} step="0.01" min="0" disabled={bloqueado} style={{ flex: '0 0 110px' }} />
            <NumberField label="Desconto Unit. (R$)" value={itemDraft.desconto} onChange={updItemDesconto} step="0.01" min="0" disabled={bloqueado} style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Unit. c/ Desconto" value={fmtMoney(valorUnitLiquidoDraft)} style={{ flex: '0 0 140px' }} />
            <ReadOnlyField label="Valor Total" value={fmtMoney(valorTotalItemDraft)} style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor c/ Desconto" value={fmtMoney(valorLiquidoItemDraft)} style={{ flex: '0 0 140px' }} />
            <BtnPrimary onClick={addItem} disabled={bloqueado} style={{ padding: '9px 20px' }}>Adicionar</BtnPrimary>
          </InlineForm>
        ) : cancelamentoModo ? null : (
          <AvisoChaves parceiro="Fornecedor" />
        )}

        <ItemsList
          items={produtosComRateio}
          onRemove={removeItem}
          onChangeQuantidade={updQuantidadeReceber}
          disabledQuantidade={bloqueado}
          disabledRemover={cancelamentoModo}
        />

        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <SelectField label="Tipo Frete" value={form.tipoFrete} onChange={v => upd('tipoFrete', v)} options={TIPO_FRETE_OPTIONS} disabled={semCampos} style={{ flex: '0 0 220px' }} />
          <SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)} options={SITUACAO_OPTIONS} disabled={semCampos} style={{ flex: '0 0 180px' }} />
          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
            <LookupField label="Transportadora" value={transportadorLabel} onSearch={() => abrir('transportadora')} disabled={semCampos} />
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <FField label="Placa Veículo" value={form.placaVeiculo ?? ''} onChange={v => upd('placaVeiculo', v)} disabled={semCampos} />
          </div>
        </div>

        <div style={{ padding: '14px 24px 4px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} disabled={semCampos} />
        </div>

        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <ReadOnlyField label="Valor Produtos" value={fmtMoney(valorProdutosAtual)} style={{ flex: '1 1 140px' }} />
          <NumberField label="Valor Frete" value={form.valorFrete} onChange={v => upd('valorFrete', v)} step="0.01" min="0" disabled={semCampos} style={{ flex: '1 1 120px' }} />
          <NumberField label="Valor Seguro" value={form.valorSeguro} onChange={v => upd('valorSeguro', v)} step="0.01" min="0" disabled={semCampos} style={{ flex: '1 1 120px' }} />
          <NumberField label="Outras Despesas" value={form.outrasDespesas} onChange={v => upd('outrasDespesas', v)} step="0.01" min="0" disabled={semCampos} style={{ flex: '1 1 130px' }} />
          <ReadOnlyField label="Descontos (já abatidos)" value={fmtMoney(totalDescontosAtual)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Valor Total da Nota" value={fmtMoney(valorTotalAtual)} bold style={{ flex: '1 1 160px' }} />
        </div>

        <ParcelasGrid
          parcelas={form.parcelasGeradas ?? []}
          valorTotalNota={valorTotalAtual}
          onChangeParcela={updParcelaGerada}
          condicaoLabel={condicaoLabel}
          onSearchCondicao={() => abrir('condicao')}
          onGerar={gerarParcelas}
          podeGerar={!semParcelas && !!condicaoSelecionada}
          condicaoDisabled={semParcelas}
          bloqueado={cancelamentoModo}
        />
      </Modal>

      {/* ---------- consultas ---------- */}
      <LookupModal {...modal('pedido')} title="Consulta de Pedidos de Compra" maxWidth={900}
        cols={colsPedidosCompra} rows={pedidosCompra} onSelect={selecionarPedidoCompra}
        emptyText="Nenhum pedido de compra pendente para este fornecedor."
        subheader={
          <div style={{ padding: '12px 24px 0', color: '#64748b', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>
            Fornecedor: <strong>{fornecedorLabel}</strong>
          </div>
        } />

      <LookupModal {...modal('fornecedor')} title="Consulta de Fornecedores" maxWidth={640}
        cols={colsFornecedores} rows={fornecedores} onSelect={selectFornecedor}
        paused={endereco.cidadeAberta}
        novo={{
          cadastro: novoFornecedor, titulo: 'Novo Fornecedor', salvarLabel: 'Salvar Fornecedor',
          campos: (
            <>
              <Inp label="Fornecedor *" value={novoFornecedor.form.fornecedor} onChange={v => novoFornecedor.upd('fornecedor', v)}
                placeholder="Razão social / nome" style={{ flex: '1 1 220px' }} />
              <Inp label={novoFornecedor.form.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'} value={novoFornecedor.form.cpfCnpj}
                onChange={v => novoFornecedor.upd('cpfCnpj', v)} style={{ flex: '1 1 180px' }} />
              <LookupField label="Cidade *" value={endereco.cidadeLabel(novoFornecedor.form.codCidade)}
                onSearch={endereco.abrir} style={{ flex: '1 1 200px' }} />
            </>
          ),
        }} />

      <LookupModal {...modal('condicao')} title="Consulta de Condições de Pagamento" maxWidth={560}
        cols={colsCondicoes} rows={condicoes} onSelect={selectCondicao} />

      <LookupModal {...modal('transportadora')} title="Consulta de Transportadoras" maxWidth={620}
        cols={colsTransportadoras} rows={transportadoras} onSelect={selectTransportadora} />

      <ConsultaEndereco ctrl={endereco} />
      <ConsultaProduto ctrl={produto} />
    </div>
  )
}
