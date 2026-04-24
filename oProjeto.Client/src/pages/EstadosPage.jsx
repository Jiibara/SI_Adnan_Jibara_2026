import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField, FSelect } from '../components/UI'
import { estadosApi, paisesApi } from '../services/api'

export default function EstadosPage() {
  const [data, setData]       = useState([])
  const [paises, setPaises]   = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    setLoading(true)
    const [e, p] = await Promise.all([estadosApi.getAll(), paisesApi.getAll()])
    setData(e); setPaises(p); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      editing ? await estadosApi.update(form.codEstado, form) : await estadosApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await estadosApi.delete(confirm.codEstado); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  const cols = [
    { key: 'codEstado', label: 'Cód.', mono: true },
    { key: 'uf',        label: 'UF' },
    { key: 'estado',    label: 'Estado' },
    { key: 'pais',      label: 'País', render: r => r.pais?.pais ?? '' },
  ]

  return (
    <div>
      <PageHeader title="Estados" sub="Unidades federativas por país" label="Novo Estado"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal open={open} title={editing ? 'Editar Estado' : 'Novo Estado'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <FField label="Estado" required value={form.estado ?? ''} onChange={v => setForm(p => ({ ...p, estado: v }))} />
          <FField label="UF"     required value={form.uf ?? ''}     onChange={v => setForm(p => ({ ...p, uf: v }))} />
          <FSelect label="País" required full value={form.codPais}
            onChange={v => setForm(p => ({ ...p, codPais: Number(v) }))}
            opts={paises.map(p => ({ id: p.codPais, label: p.pais }))} />
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} name={confirm?.estado} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
