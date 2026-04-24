import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField, FSelect } from '../components/UI'
import { prodNfeApi, nfeApi, produtosApi, contasPagarApi, fornecedoresApi } from '../services/api'

// ════════════════════════════════════════════════════
//  PRODUTOS DA NFE
// ════════════════════════════════════════════════════
export function ProdNfePage() {
  const [data, setData]   = useState([])
  const [nfes, setNfes]   = useState([])
  const [prods, setProds] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]   = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen]   = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    setLoading(true)
    const [p, n, pr] = await Promise.all([prodNfeApi.getAll(), nfeApi.getAll(), produtosApi.getAll()])
    setData(p); setNfes(n); setProds(pr); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const num = (k, v) => setForm(p => ({ ...p, [k]: v === '' ? undefined : Number(v) }))

  const save = async () => {
    try {
      editing
        ? await prodNfeApi.update(form.numero, form.serie, form.modelo, form.codProd, form)
        : await prodNfeApi.create(form)
      toast.success('Item salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try {
      await prodNfeApi.delete(confirm.numero, confirm.serie, confirm.modelo, confirm.codProd)
      toast.success('Excluído.'); setConfirm(null); load()
    } catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'numero',        label: 'NF', mono: true },
    { key: 'serie',         label: 'Série', mono: true },
    { key: 'modelo',        label: 'Modelo', mono: true },
    { key: 'produto',       label: 'Produto', render: r => r.produto?.produto ?? '' },
    { key: 'quantidade',    label: 'Qtde.' },
    { key: 'valorUnitario', label: 'Vl. Unit.' },
  ]

  const ff = (label, key) => (
    <FField label={label} type="number" step="0.01" value={form[key] ?? ''} onChange={v => num(key, v)} />
  )

  return (
    <div>
      <PageHeader title="Produtos da NFe" sub="Itens vinculados às notas fiscais" label="Novo Item"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal wide open={open} title={editing ? 'Editar Item' : 'Novo Item'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <FSelect label="Nota Fiscal" required full
            value={form.numNfe !== undefined ? `${form.numero}/${form.serie}/${form.modelo}` : ''}
            onChange={v => { const [n,s,m] = v.split('/').map(Number); setForm(p => ({ ...p, numero:n, serie:s, modelo:m })) }}
            opts={nfes.map(n => ({ id:`${n.numero}/${n.serie}/${n.modelo}`, label:`NF ${n.numero} / S${n.serie} / M${n.modelo} — ${n.fornecedor?.razaoSocial ?? ''}` }))} />
          <FSelect label="Produto" required full value={form.codProd}
            onChange={v => setForm(p => ({ ...p, codProd: Number(v) }))}
            opts={prods.map(p => ({ id: p.codProd, label: `[${p.codProd}] ${p.produto}` }))} />
          <FField label="CSOSN" value={form.CSOSN ?? ''} onChange={v => setForm(p => ({ ...p, CSOSN: v }))} />
          <FField label="CFOP"  value={form.CFOP ?? ''}  onChange={v => setForm(p => ({ ...p, CFOP: v }))} />
          {ff('Quantidade', 'quantidade')}
          {ff('Valor Unitário', 'valorUnitario')}
          {ff('Desconto', 'desconto')}
          {ff('Base Cálc. ICMS', 'baseCalcIcms')}
          {ff('Alíq. ICMS (%)', 'aliqIcms')}
          {ff('Valor ICMS', 'valorIcms')}
          {ff('Alíq. IPI (%)', 'aliqIpi')}
          {ff('Valor IPI', 'valorIpi')}
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm}
        name={confirm ? `NF ${confirm.numero}/${confirm.serie}/${confirm.modelo} — Prod ${confirm.codProd}` : ''}
        onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}

// ════════════════════════════════════════════════════
//  CONTAS A PAGAR
// ════════════════════════════════════════════════════
export function ContasPagarPage() {
  const [data, setData]   = useState([])
  const [nfes, setNfes]   = useState([])
  const [forns, setForns] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]   = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen]   = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    setLoading(true)
    const [c, n, f] = await Promise.all([contasPagarApi.getAll(), nfeApi.getAll(), fornecedoresApi.getAll()])
    setData(c); setNfes(n); setForns(f); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const num = (k, v) => setForm(p => ({ ...p, [k]: v === '' ? undefined : Number(v) }))

  const save = async () => {
    try {
      editing
        ? await contasPagarApi.update(form.numero, form.serie, form.modelo, form.codForn, form.numeroParcela, form)
        : await contasPagarApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try {
      await contasPagarApi.delete(confirm.numero, confirm.serie, confirm.modelo, confirm.codForn, confirm.numeroParcela)
      toast.success('Excluído.'); setConfirm(null); load()
    } catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'numero',       label: 'NF', mono: true },
    { key: 'serie',        label: 'Série', mono: true },
    { key: 'modelo',       label: 'Modelo', mono: true },
    { key: 'fornecedor',   label: 'Fornecedor', render: r => r.fornecedor?.fornecedor ?? '' },
    { key: 'numeroParcela',   label: 'Parcela', mono: true },
    { key: 'valorParcela', label: 'Valor (R$)' },
    { key: 'vencimentoParcela',label: 'Vencimento' },
  ]

  return (
    <div>
      <PageHeader title="Contas a Pagar" sub="Parcelas das notas fiscais" label="Nova Parcela"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal open={open} title={editing ? 'Editar Parcela' : 'Nova Parcela'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <FSelect label="Nota Fiscal" required full
            value={form.numero !== undefined ? `${form.numero}/${form.serie}/${form.modelo}` : ''}
            onChange={v => { const [n,s,m] = v.split('/').map(Number); setForm(p => ({ ...p, numero:n, serie:s, modelo:m })) }}
            opts={nfes.map(n => ({ id:`${n.numero}/${n.serie}/${n.modelo}`, label:`NF ${n.numero} / S${n.serie} / M${n.modelo}` }))} />
          <FSelect label="Fornecedor" required full value={form.codForn}
            onChange={v => setForm(p => ({ ...p, codForn: Number(v) }))}
            opts={forns.map(f => ({ id: f.codForn, label: f.fornecedor }))} />
          <FField label="Nº Parcela" required type="number" value={form.numeroParcela ?? ''}
            onChange={v => num('numeroParcela', v)} />
          <FField label="Valor (R$)" type="number" step="0.01" value={form.valorParcela ?? ''}
            onChange={v => num('valorParcela', v)} />
          <FField label="Vencimento" type="date" full value={form.vencimentoParcela ?? ''}
            onChange={v => setForm(p => ({ ...p, vencimentoParcela: v }))} />
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm}
        name={confirm ? `NF ${confirm.numero} — Parcela ${confirm.numeroParcela}` : ''}
        onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
