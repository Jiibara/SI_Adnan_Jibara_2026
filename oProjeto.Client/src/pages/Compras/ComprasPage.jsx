import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import useConsultaEndereco from '@/hooks/useConsultaEndereco'
import useConsultaProduto from '@/hooks/useConsultaProduto'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader } from '@/components/UI'
import {
  BtnPrimary, Inp, NumberField, DateField, SelectField, TextAreaField,
  ReadOnlyField, LookupField, InlineForm,
} from '@/components/form'
import LookupModal from '@/components/lookup/LookupModal'
import ConsultaEndereco from '@/components/lookup/ConsultaEndereco'
import ConsultaProduto from '@/components/lookup/ConsultaProduto'
import AvisoChaves from '@/components/nota/AvisoChaves'
import { comprasApi, fornecedoresApi, condicoesApi } from '@/services/api'
import { fmtMoney, arredondar2, arredondar4 } from '@/utils/format'
import { toDateInput } from '@/utils/date'
import { getDescontoItem, somaDescontosItens } from '@/utils/notaCalculos'
import { FORNECEDOR_NOVO_EMPTY, colsFornecedores, colsCondicoes } from '@/constants/cadastros'
import ItemsList from './compras/ItemsList'
import { comRateioCompra } from './compras/calculos'
import { compraVazia, ITEM_EMPTY, SITUACAO_OPTIONS, colsCompras } from './compras/constantes'

const chaveCompra = (numero, modelo, serie, codForn) => `${numero}/${modelo}/${serie}/${codForn}`

export default function ComprasPage() {
  const { data, loading, load } = useCrud(comprasApi)

  // ----- listas das consultas
  const [fornecedores, loadFornecedores] = useLista(fornecedoresApi)
  const [condicoes] = useLista(condicoesApi)

  // ----- estado da compra
  const [form, setForm] = useState(compraVazia)
  const [originalForm, setOriginalForm] = useState(compraVazia)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [itemDraft, setItemDraft] = useState(ITEM_EMPTY)

  // ----- modais de consulta
  const { abrir, fechar, modal, algumAberto } = useModais()

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // ----- item em edição (rascunho)
  // "Desconto (R$)" é POR UNIDADE e sai do valor unitário (mesmo cálculo das notas).
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
    aoSelecionar: r => setItemDraft(d => ({ ...d, codProd: r.codProd, produtoNome: r.produto, unidade: r.unidade ?? '' })),
  })

  // ----- totais
  const chavePronta = !!(form.numero && form.serie && form.modelo && form.codForn)

  const valorProdutosBruto = (form.produtos ?? []).reduce((s, it) => s + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0), 0)
  const totalDescontos = somaDescontosItens(form.produtos)
  const valorProdutosLiquido = valorProdutosBruto - totalDescontos
  const valorTotal = valorProdutosLiquido + (Number(form.valorFrete) || 0) + (Number(form.valorSeguro) || 0) + (Number(form.outrasDespesas) || 0)

  const produtosComRateio = comRateioCompra(form.produtos, form.valorFrete, form.valorSeguro, form.outrasDespesas)

  const valorBrutoItemDraft = (Number(itemDraft.quantidade) || 0) * (Number(itemDraft.valorUnitario) || 0)
  const valorUnitLiquidoDraft = Math.max((Number(itemDraft.valorUnitario) || 0) - (Number(itemDraft.desconto) || 0), 0)
  const valorLiquidoItemDraft = (Number(itemDraft.quantidade) || 0) * valorUnitLiquidoDraft

  const addItem = () => {
    if (!itemDraft.codProd) { toast.error('Selecione um produto.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }

    const quantidade = Number(itemDraft.quantidade)
    const valorUnitario = Number(itemDraft.valorUnitario)
    const descontoUnit = Number(itemDraft.desconto) || 0
    if (descontoUnit < 0) { toast.error('Desconto não pode ser negativo.'); return }
    if (descontoUnit > valorUnitario) { toast.error('O desconto por unidade não pode ser maior que o valor unitário.'); return }

    const produtoJaAdicionado = (form.produtos ?? []).some(item => Number(item.codProd) === Number(itemDraft.codProd))
    if (produtoJaAdicionado) { toast.error('Este produto já foi adicionado à compra.'); return }

    const descontoValor = arredondar2(descontoUnit * quantidade)           // desconto total do item
    const novoItem = {
      codProd: itemDraft.codProd,
      produtoNome: itemDraft.produtoNome,
      unidade: itemDraft.unidade,
      quantidade,
      valorUnitario,
      valorTotal: arredondar2(quantidade * valorUnitario - descontoValor),
      descontoPercentual: Number(itemDraft.descontoPercentual) || 0,
      descontoValor,
    }
    setForm(f => ({ ...f, produtos: [...(f.produtos ?? []), novoItem] }))
    setItemDraft(ITEM_EMPTY)
  }

  const removeItem = i => setForm(f => ({ ...f, produtos: f.produtos.filter((_, idx) => idx !== i) }))

  // ----- salvar / excluir
  const save = async () => {
    if (!form.codForn) { toast.error('Selecione o fornecedor.'); return }
    if (!form.numero || !form.serie || !form.modelo) { toast.error('Informe número, série e modelo.'); return }
    if (!form.produtos?.length) { toast.error('Adicione ao menos um item.'); return }

    const payload = {
      ...form,
      numero: String(form.numero ?? ''),
      serie: String(form.serie ?? ''),
      modelo: String(form.modelo ?? ''),
      dataCompra: form.dataCompra || null,
      dataPrevisaoEntrega: form.dataPrevisaoEntrega || null,
      valorProdutos: arredondar2(valorProdutosBruto),
      valorDesconto: arredondar2(totalDescontos),
      valorTotal: arredondar2(valorTotal),
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
        descontoValor: getDescontoItem(it),
        custoFinal: it.custoFinal,
      })),
    }

    setSaving(true)
    try {
      if (editing) {
        await comprasApi.update(chaveCompra(payload.numero, payload.modelo, payload.serie, payload.codForn), payload)
      } else {
        await comprasApi.create(payload)
      }
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar a compra.')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    try {
      await comprasApi.delete(chaveCompra(confirm.numero, confirm.modelo, confirm.serie, confirm.codForn))
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir a compra.')
    }
  }

  // ----- seleções nas consultas
  const fornecedorSelecionado = fornecedores.find(f => f.codForn === form.codForn) ?? form.fornecedor
  const fornecedorLabel = fornecedorSelecionado?.fornecedor ?? ''
  const selectFornecedor = r => {
    setForm(f => ({
      ...f,
      codForn: r.codForn,
      fornecedor: r,
      codCondicao: r.condicao?.codCondicao ?? f.codCondicao,
      condicaoPagamento: r.condicao ?? f.condicaoPagamento,
    }))
    fechar('fornecedor')
  }

  const condicaoSelecionada = condicoes.find(c => String(c.codCondicao) === String(form.codCondicao)) ?? form.condicaoPagamento
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? ''
  const selectCondicao = r => {
    setForm(f => ({ ...f, codCondicao: r.codCondicao, condicaoPagamento: r }))
    fechar('condicao')
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

  // ----- abrir / editar compra
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  const abrirNovaCompra = () => {
    const vazio = compraVazia()
    setForm(vazio); setOriginalForm(vazio); setItemDraft(ITEM_EMPTY)
    setEditing(false); setOpen(true)
  }

  const abrirEdicaoCompra = async r => {
    let completa
    try {
      completa = await comprasApi.getOne(chaveCompra(r.numero, r.modelo, r.serie, r.codForn))
    } catch {
      toast.error('Erro ao carregar a compra.')
      return
    }

    const formCarregado = {
      ...completa,
      dataCompra: toDateInput(completa.dataCompra),
      dataPrevisaoEntrega: toDateInput(completa.dataPrevisaoEntrega),
      produtos: (completa.produtos ?? []).map(p => ({
        codProd: p.codProd,
        produtoNome: p.produto?.produto ?? '',
        unidade: p.produto?.unidade ?? '',
        quantidade: p.quantidade,
        valorUnitario: p.valorUnitario,
        valorTotal: p.valorTotal,
        descontoPercentual: p.descontoPercentual ?? 0,
        descontoValor: p.descontoValor ?? p.desconto ?? 0,
      })),
    }
    setForm(formCarregado); setOriginalForm(formCarregado); setItemDraft(ITEM_EMPTY)
    setEditing(true); setOpen(true)
  }

  return (
    <div>
      <PageHeader title="Compras" sub="Consulta de Compras" label="Nova Compra" onNew={abrirNovaCompra} disabled={open} />

      <DataTable columns={colsCompras} data={data} loading={loading}
        onEdit={abrirEdicaoCompra}
        onDelete={r => setConfirm(r)} />

      <Modal open={open} title={editing ? 'Editar Compra' : 'Nova Compra'} editing={editing}
        onClose={() => setOpen(false)} onSave={save} saving={saving} wide maxWidth={2000}
        isDirty={isDirty}
        suspended={algumAberto || produto.aberto || endereco.aberto}>

        {/* Modelo, Série, Número, Código, Fornecedor, Data Compra, Previsão Entrega */}
        <div style={{ padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Inp label="Modelo" value={form.modelo} onChange={v => upd('modelo', v)} style={{ flex: '0 0 80px' }} />
          <Inp label="Série" value={form.serie} onChange={v => upd('serie', v)} style={{ flex: '0 0 70px' }} />
          <Inp label="Número" value={form.numero} onChange={v => upd('numero', v)} style={{ flex: '0 0 110px' }} />
          <ReadOnlyField label="Código" value={form.codForn ?? ''} style={{ flex: '0 0 90px' }} />

          <div style={{ flex: '1 1 260px' }}>
            <LookupField label="Fornecedor *" value={fornecedorLabel} disabled={editing}
              onSearch={() => { novoFornecedor.setShow(false); abrir('fornecedor') }} />
          </div>

          <DateField digitavel label="Data Compra" value={form.dataCompra} onChange={v => upd('dataCompra', v)} style={{ flex: '0 0 150px' }} />
          <DateField digitavel label="Previsão Entrega" value={form.dataPrevisaoEntrega} onChange={v => upd('dataPrevisaoEntrega', v)} style={{ flex: '0 0 150px' }} />
        </div>

        {/* Adicionar Item — só liberado depois das chaves primárias preenchidas */}
        {chavePronta ? (
          <InlineForm title="Adicionar Item">
            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <LookupField label="Produto *" value={itemDraft.produtoNome} onSearch={produto.abrir} />
            </div>
            <ReadOnlyField label="Unidade" value={itemDraft.unidade || '-'} style={{ flex: '0 0 70px' }} />
            <NumberField label="Quantidade" value={itemDraft.quantidade} onChange={updItemQuantidade} step="0.001" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Valor Unitário" value={itemDraft.valorUnitario} onChange={updItemValorUnitario} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
            {/* Desconto por unidade em R$ e em % se recalculam um a partir do outro */}
            <NumberField label="Desconto (%)" value={itemDraft.descontoPercentual} onChange={updItemDescontoPercentual} step="0.01" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Desconto Unit. (R$)" value={itemDraft.desconto} onChange={updItemDesconto} step="0.01" min="0"
              warning={Number(itemDraft.valorUnitario) > 0 && Number(itemDraft.desconto) > Number(itemDraft.valorUnitario) ? 'Maior que o valor unitário' : undefined}
              style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Unit. c/ Desconto" value={fmtMoney(valorUnitLiquidoDraft)} style={{ flex: '0 0 140px' }} />
            <ReadOnlyField label="Valor Bruto" value={fmtMoney(valorBrutoItemDraft)} style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor c/ Desconto" value={fmtMoney(valorLiquidoItemDraft)} style={{ flex: '0 0 140px' }} />
            <BtnPrimary onClick={addItem} style={{ padding: '9px 20px' }}>Adicionar</BtnPrimary>
          </InlineForm>
        ) : (
          <AvisoChaves parceiro="Fornecedor" />
        )}

        <ItemsList items={produtosComRateio} onRemove={removeItem} />

        {/* Situação / condição de pagamento */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)} options={SITUACAO_OPTIONS} style={{ flex: '0 0 200px' }} />
          <div style={{ flex: '0 0 500px', minWidth: 200 }}>
            <LookupField label="Condição de Pagamento" value={condicaoLabel} onSearch={() => abrir('condicao')} />
          </div>
        </div>

        <div style={{ padding: '14px 24px 4px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} />
        </div>

        {/* Totais da compra — desconto é só leitura (soma dos itens) */}
        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <ReadOnlyField label="Produtos Bruto" value={fmtMoney(valorProdutosBruto)} style={{ flex: '1 1 140px' }} />
          <ReadOnlyField label="Total Descontos (itens)" value={fmtMoney(totalDescontos)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Produtos Líquido" value={fmtMoney(valorProdutosLiquido)} style={{ flex: '1 1 150px' }} />
          <NumberField label="Valor Frete" value={form.valorFrete} onChange={v => upd('valorFrete', v)} step="0.01" min="0" style={{ flex: '1 1 120px' }} />
          <NumberField label="Valor Seguro" value={form.valorSeguro} onChange={v => upd('valorSeguro', v)} step="0.01" min="0" style={{ flex: '1 1 120px' }} />
          <NumberField label="Outras Despesas" value={form.outrasDespesas} onChange={v => upd('outrasDespesas', v)} step="0.01" min="0" style={{ flex: '1 1 130px' }} />
          <ReadOnlyField label="Valor Total da Compra" value={fmtMoney(valorTotal)} bold style={{ flex: '1 1 170px' }} />
        </div>
      </Modal>

      {/* ---------- consultas ---------- */}
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

      <ConsultaEndereco ctrl={endereco} />
      <ConsultaProduto ctrl={produto} />

      {/* confirmação de exclusão */}
      <ConfirmDialog open={!!confirm} name={confirm ? `${confirm.numero}/${confirm.serie}` : ''}
        onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
