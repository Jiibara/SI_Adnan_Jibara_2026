import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { formaPagamentosApi } from '@/services/api'
import useCrud from '@/hooks/useCrud'
import { useModalGuard } from '@/hooks/useModalGuard'

const empty = { formaPagamento:'', ativo:true }

export default function FormaPagamentoPage() {

  const { data, loading, load } = useCrud(formaPagamentosApi)
  const [form, setForm] = useState(empty)
  const [originalForm, setOriginalForm] = useState(empty)  
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await formaPagamentosApi.update(form.codFormaPagamento, form) : await formaPagamentosApi.create(form)
      toast.success(editing ? 'Atualizado!' : 'Criado!')
      setOpen(false)
      load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try {
      await formaPagamentosApi.delete(confirm.codFormaPagamento)
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
    { key:'codFormaPagamento', label:'Cód.', mono:true },
    { key:'formaPagamento', label:'Forma de Pagamento' },
    { key:'ativo', label:'Ativo', render:r => r.ativo ? 'Sim' : 'Não' }
  ]

  return (
    <div>

      <PageHeader
        title="Formas de Pagamento"
        sub="Consulta de formas de pagamento"
        label="Nova Forma de Pagamento"
        onNew={abrirNovo}
      />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicao}
        onDelete={r => setConfirm(r)}
      />

      <Modal open={open} title={editing ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'} editing={editing} onClose={attemptClose} onSave={confirming ? undefined : save}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>

          <div style={{ flex:'0 0 30px' }}>
            <FField label="Código" value={editing ? String(form.codFormaPagamento ?? '') : '—'} onChange={() => {}} />
          </div>

          <div style={{ flex:'1 1 320px', maxWidth:420 }}>
            <FField label="Forma de pagamento" required value={form.formaPagamento ?? ''} onChange={v => upd('formaPagamento', v)} />
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

      <ConfirmDialog open={!!confirm} name={confirm?.formaPagamento} onClose={() => setConfirm(null)} onConfirm={del} />

    </div>
  )
}
