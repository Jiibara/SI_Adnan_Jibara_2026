import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { formaPagamentosApi } from '@/services/api'
import useCrud from '@/hooks/useCrud'

const empty = {
  formaPagamento: '',
  ativo: true
}

export default function FormaPagamentoPage() {

  const { data, loading, load } = useCrud(formaPagamentosApi)

  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(false)

  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) =>
    setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {

      editing
        ? await formaPagamentosApi.update(form.codFormaPagamento, form)
        : await formaPagamentosApi.create(form)

      toast.success(editing ? 'Atualizado!' : 'Criado!')

      setOpen(false)
      load()

    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {

      await formaPagamentosApi.delete(confirm.codFormaPagamento)

      toast.success('Excluído.')

      setConfirm(null)
      load()

    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  const cols = [
    { key: 'codFormaPagamento', label: 'Cód.', mono: true },
    { key: 'formaPagamento', label: 'Nome' },
    { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' }
  ]

  return (
    <div>

      <PageHeader
        title="Formas de Pagamento"
        sub="Consulta de formas de pagamento"
        label="Nova Forma de Pagamento"
        onNew={() => {
          setForm(empty)
          setEditing(false)
          setOpen(true)
        }}
      />

      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        onEdit={r => {
          setForm(r)
          setEditing(true)
          setOpen(true)
        }}
        onDelete={r => setConfirm(r)}
      />

      <Modal
        open={open}
        title={editing ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={save}
      >

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 30px' }}>
              <FField label="Código" value={editing ? String(form.codFormaPagamento ?? '') : '—'} onChange={() => { }} />
            </div>

            <div style={{ flex: '1 1 320px', maxWidth: 420 }}>
              <FField
                label="Forma de pagamento"
                required
                value={form.formaPagamento ?? ''}
                onChange={v => upd('formaPagamento', v)}
              />
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              paddingBottom: 8,
              whiteSpace: 'nowrap',
              fontSize: 13,
              fontFamily: 'Outfit, sans-serif',
              color: '#0f172a'
            }}>
              <input
                type="checkbox"
                checked={form.ativo ?? true}
                onChange={e => upd('ativo', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              Ativo
            </label>

          </div>

        </div>

      </Modal>

      <ConfirmDialog
        open={!!confirm}
        name={confirm?.formaPagamento}
        onClose={() => setConfirm(null)}
        onConfirm={del}
      />

    </div>
  )
}

