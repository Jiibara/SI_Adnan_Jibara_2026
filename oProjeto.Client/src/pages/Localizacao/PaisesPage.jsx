import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { paisesApi } from '@/services/api'

const empty = { pais:'', sigla:'', ddi:'', moeda:'', ativo:true }

export default function PaisesPage() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(empty)
  const [editing, setEditing] = useState(false)
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    try { setLoading(true); setData(await paisesApi.getAll()) }
    catch { toast.error('Erro ao carregar países.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await paisesApi.update(form.codPais, form) : await paisesApi.create(form)
      toast.success(editing ? 'País atualizado!' : 'País criado!')
      setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try {
      await paisesApi.delete(confirm.codPais)
      toast.success('Excluído.'); setConfirm(null); load()
    } catch { toast.error('Erro ao excluir.') }
  }

  const cols = [
    { key:'codPais', label:'Cód.', mono:true },
    { key:'pais',    label:'País' },
    { key:'sigla',   label:'Sigla' },
    { key:'ddi',     label:'DDI' },
    { key:'moeda',   label:'Moeda' },
    { key:'ativo',   label:'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  return (
    <div>
      <PageHeader title="Países" sub="Consulta de países" label="Novo País"
        onNew={() => { setForm(empty); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal open={open} title={editing ? 'Editar País' : 'Novo País'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display:'flex', gap:12, alignItems:'flex-end', marginBottom:14 }}>
          <div style={{ flex:'0 0 30px' }}>
            <FField label="Código" value={editing ? String(form.codPais ?? '') : '—'} onChange={() => {}} />
          </div>
          <div style={{ flex:'1 1 auto' }}>
            <FField label="País" required value={form.pais ?? ''} onChange={v => upd('pais', v)} />
          </div>
          <div style={{ flex:'0 0 90px' }}>
            <FField label="Sigla" required value={form.sigla ?? ''} onChange={v => upd('sigla', v)} />
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', paddingBottom:8, whiteSpace:'nowrap', fontSize:13, fontFamily:'Outfit, sans-serif', color:'#0f172a' }}>
            <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)}
              style={{ width:16, height:16, cursor:'pointer' }} />
            Ativo
          </label>
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <div style={{ flex:'0 0 120px' }}>
            <FField label="DDI" value={form.ddi ?? ''} onChange={v => upd('ddi', v)} />
          </div>
          <div style={{ flex:'0 0 150px' }}>
            <FField label="Moeda" value={form.moeda ?? ''} onChange={v => upd('moeda', v)} />
          </div>
        </div>

      </Modal>

      <ConfirmDialog open={!!confirm} name={confirm?.pais}
        onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}