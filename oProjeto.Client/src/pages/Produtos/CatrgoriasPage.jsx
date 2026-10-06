import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { categoriasApi } from '@/services/api'
import useCrud from '@/hooks/useCrud'
import { useModalGuard } from '@/hooks/useModalGuard'

const empty = { categoria:'', ativo:true }

export default function CategoriasPage() {

  const { data, loading, load } = useCrud(categoriasApi)
  const [form, setForm] = useState(empty)
  const [originalForm, setOriginalForm] = useState(empty) 
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await categoriasApi.update(form.codCategoria, form) : await categoriasApi.create(form)
      toast.success(editing ? 'Atualizado!' : 'Criado!')
      setOpen(false)
      load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try {
      await categoriasApi.delete(confirm.codCategoria)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch { toast.error('Erro ao excluir.') }
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const descartar = () => setForm(originalForm)

  const { confirming, attemptClose, confirmClose, cancelClose } = useModalGuard({
    isOpen: open,
    isDirty,
    onClose: () => setOpen(false),
    onSave: save,
    onDiscard: descartar,
  })

  const abrirNovo = () => { setForm(empty); setOriginalForm(empty); setEditing(false); setOpen(true) }
  const abrirEdicao = (r) => { setForm(r); setOriginalForm(r); setEditing(true); setOpen(true) }

  const cols = [
    { key:'codCategoria', label:'Cód.', mono:true },
    { key:'categoria', label:'Categoria' },
    { key:'ativo', label:'Ativo', render:r => r.ativo ? 'Sim' : 'Não' }
  ]

  return (
    <div>

      <PageHeader
        title="Categorias"
        sub="Consulta de Categorias"
        label="Nova Categoria"
        onNew={abrirNovo}
      />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicao}
        onDelete={r => setConfirm(r)}
      />

      <Modal open={open} title={editing ? 'Editar Categoria' : 'Nova Categoria'} editing={editing} onClose={attemptClose} onSave={confirming ? undefined : save}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>

          <div style={{ flex:'0 0 30px' }}>
            <FField label="Código" value={editing ? String(form.codCategoria ?? '') : '—'} onChange={() => {}} />
          </div>

          <div style={{ flex:'1 1 320px', maxWidth:420 }}>
            <FField label="Categoria" required value={form.categoria ?? ''} onChange={v => upd('categoria', v)} />
          </div>

          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', paddingBottom:8, whiteSpace:'nowrap', fontSize:13, fontFamily:'Outfit, sans-serif', color:'#0f172a' }}>
            <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width:16, height:16, cursor:'pointer' }} />
            Ativo
          </label>

        </div>
      </Modal>

      <ConfirmDialog
        open={confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Todos dados escritos serão apagados."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={cancelClose}
        onConfirm={confirmClose}
      />

      <ConfirmDialog open={!!confirm} name={confirm?.categoria} onClose={() => setConfirm(null)} onConfirm={del} />

    </div>
  )
}
