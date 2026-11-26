import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { CheckAtivo, LookupField } from '@/components/form'
import ConsultaPais from '@/components/lookup/ConsultaPais'
import useCrud from '@/hooks/useCrud'
import useConsultaPais from '@/hooks/useConsultaPais'
import { estadosApi } from '@/services/api'
import { regra } from '@/constants/regrasCampos'

const VAZIO = { ativo: true }

const cols = [
  { key: 'codEstado', label: 'Cód.', mono: true },
  { key: 'estado', label: 'Estado' },
  { key: 'uf', label: 'UF' },
  { key: 'pais', label: 'País', render: r => r.pais?.pais ?? '' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

export default function EstadosPage() {
  const { data, loading, load } = useCrud(estadosApi)
  const [form, setForm] = useState(VAZIO)
  const [originalForm, setOriginalForm] = useState(VAZIO)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const pais = useConsultaPais({
    aoSelecionar: p => upd('codPais', p.codPais),
    aoCriar: cod => upd('codPais', cod),
  })

  const abrir = (row = null) => {
    const f = row ?? VAZIO
    setForm(f)
    setOriginalForm(f)
    setEditing(!!row)
    setOpen(true)
  }

  const save = async () => {
    if (!form.codPais) return toast.error('Selecione o país.')
    try {
      editing ? await estadosApi.update(form.codEstado, form) : await estadosApi.create(form)
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {
      await estadosApi.delete(confirm.codEstado)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  return (
    <div>
      <PageHeader title="Estados" sub="Consulta de Estados" label="Novo Estado" onNew={() => abrir()} disabled={open} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrir} onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Estado' : 'Novo Estado'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={pais.aberto}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 80px' }}><FField label="Código" disabled value={editing ? String(form.codEstado ?? '') : '—'} onChange={() => {}} /></div>
          <div style={{ flex: '1 1 220px' }}><FField label="Estado" required value={form.estado ?? ''} onChange={v => upd('estado', v)} {...regra('estado')} /></div>
          <div style={{ flex: '0 0 72px' }}><FField label="UF" required value={form.uf ?? ''} onChange={v => upd('uf', v)} {...regra('uf')} /></div>
          <LookupField label="País *" value={pais.label(form.codPais)} onSearch={pais.abrir} style={{ flex: '1 1 200px' }} />
          <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
        </div>
      </Modal>

      <ConsultaPais ctrl={pais} />

      <ConfirmDialog open={!!confirm} name={confirm?.estado} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
