import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { CheckAtivo, LookupField } from '@/components/form'
import ConsultaEstado from '@/components/lookup/ConsultaEstado'
import useCrud from '@/hooks/useCrud'
import useConsultaEstado from '@/hooks/useConsultaEstado'
import { cidadesApi } from '@/services/api'
import { regra } from '@/constants/regrasCampos'

const VAZIO = { ativo: true }

const cols = [
  { key: 'codCidade', label: 'Cód.', mono: true },
  { key: 'cidade', label: 'Cidade' },
  { key: 'ddd', label: 'DDD' },
  { key: 'estado', label: 'Estado', render: r => `${r.estado?.estado ?? ''} - ${r.estado?.uf ?? ''}` },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

export default function CidadesPage() {
  const { data, loading, load } = useCrud(cidadesApi)
  const [form, setForm] = useState(VAZIO)
  const [originalForm, setOriginalForm] = useState(VAZIO)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const estado = useConsultaEstado({ aoSelecionar: e => upd('codEstado', e.codEstado) })

  const abrir = (row = null) => {
    const f = row ?? VAZIO
    setForm(f)
    setOriginalForm(f)
    setEditing(!!row)
    setOpen(true)
  }

  const save = async () => {
    if (!form.codEstado) return toast.error('Selecione o estado.')
    try {
      editing ? await cidadesApi.update(form.codCidade, form) : await cidadesApi.create(form)
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {
      await cidadesApi.delete(confirm.codCidade)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  return (
    <div>
      <PageHeader title="Cidades" sub="Consulta de Cidades" label="Nova Cidade" onNew={() => abrir()} disabled={open} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrir} onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Cidade' : 'Nova Cidade'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={estado.aberto}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 80px' }}><FField label="Código" disabled value={editing ? String(form.codCidade ?? '') : '—'} onChange={() => {}} /></div>
          <div style={{ flex: '1 1 220px' }}><FField label="Cidade" required value={form.cidade ?? ''} onChange={v => upd('cidade', v)} {...regra('cidade')} /></div>
          <div style={{ flex: '0 0 80px' }}><FField label="DDD" required value={form.ddd ?? ''} onChange={v => upd('ddd', v)} {...regra('ddd')} /></div>
          <LookupField label="Estado *" value={estado.label(form.codEstado)} onSearch={estado.abrir} style={{ flex: '1 1 220px' }} />
          <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
        </div>
      </Modal>

      <ConsultaEstado ctrl={estado} />

      <ConfirmDialog open={!!confirm} name={confirm?.cidade} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
