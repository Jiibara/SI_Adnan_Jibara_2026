import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField, FSelect} from '@/components/UI'
import { prodNfeApi, nfeApi, produtosApi } from '@/services/api'

export default function ProdNfePage() {
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
      <PageHeader title="Produtos da NFe" sub="Consulta de " label="Novo Item"
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