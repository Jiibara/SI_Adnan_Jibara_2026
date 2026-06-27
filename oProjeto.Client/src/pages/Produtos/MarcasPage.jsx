import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { marcasApi } from '@/services/api'
import useCrud from '@/hooks/useCrud'

const empty = { marca:'', ativo:true }

export default function MarcaPage() {

  const { data, loading, load } = useCrud(marcasApi)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await marcasApi.update(form.codMarca, form) : await marcasApi.create(form)
      toast.success(editing ? 'Atualizado!' : 'Criado!')
      setOpen(false)
      load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try {
      await marcasApi.delete(confirm.codMarca)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch { toast.error('Erro ao excluir.') }
  }

  const cols = [
    { key:'codMarca', label:'Cód.', mono:true },
    { key:'marca', label:'Marca' },
    { key:'ativo', label:'Ativo', render:r => r.ativo ? 'Sim' : 'Não' }
  ]

  return (
    <div>

      <PageHeader
        title="Marcas"
        sub="Consulta de Marcas"
        label="Nova Marca"
        onNew={() => { setForm(empty); setEditing(false); setOpen(true) }}
      />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)}
      />

      <Modal open={open} title={editing ? 'Editar Marca' : 'Nova Marca'} editing={editing} onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>

          <div style={{ flex:'0 0 30px' }}>
            <FField label="Código" value={editing ? String(form.codMarca ?? '') : '—'} onChange={() => {}} />
          </div>

          <div style={{ flex:'1 1 320px', maxWidth:420 }}>
            <FField label="Marca" required value={form.marca ?? ''} onChange={v => upd('marca', v)} />
          </div>

          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', paddingBottom:8, whiteSpace:'nowrap', fontSize:13, fontFamily:'Outfit, sans-serif', color:'#0f172a' }}>
            <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width:16, height:16, cursor:'pointer' }} />
            Ativo
          </label>

        </div>
      </Modal>

      <ConfirmDialog open={!!confirm} name={confirm?.marca} onClose={() => setConfirm(null)} onConfirm={del} />

    </div>
  )
}