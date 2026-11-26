import { useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { CheckAtivo, LookupField } from '@/components/form'
import ConsultaEstado from '@/components/lookup/ConsultaEstado'
import ConsultaMarca from '@/components/lookup/ConsultaMarca'
import useCrud from '@/hooks/useCrud'
import useConsultaEstado from '@/hooks/useConsultaEstado'
import useConsultaMarca from '@/hooks/useConsultaMarca'
import { veiculosApi } from '@/services/api'
import { regra } from '@/constants/regrasCampos'

const VAZIO = { ativo: true }

const cols = [
  { key: 'codVeic', label: 'Cód.', mono: true },
  { key: 'placaVeic', label: 'Placa', mono: true },
  { key: 'placaMercoSul', label: 'Placa MercoSul', mono: true },
  { key: 'modelo', label: 'Modelo' },
  { key: 'marca', label: 'Marca', render: r => r.marca?.marca ?? '' },
  { key: 'codANTT', label: 'ANTT', mono: true },
  { key: 'estado', label: 'UF', render: r => r.estado?.uf ?? '' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

const linha = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }

export default function VeiculosPage() {
  const { data, loading, load } = useCrud(veiculosApi)
  const [form, setForm] = useState(VAZIO)
  const [originalForm, setOriginalForm] = useState(VAZIO)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const estado = useConsultaEstado({ aoSelecionar: e => upd('codEstado', e.codEstado) })
  const marca = useConsultaMarca({ aoSelecionar: m => upd('codMarca', m.codMarca) })

  const abrir = (row = null) => {
    const f = row ?? VAZIO
    setForm(f)
    setOriginalForm(f)
    setEditing(!!row)
    setOpen(true)
  }

  const save = async () => {
    try {
      editing ? await veiculosApi.update(form.codVeic, form) : await veiculosApi.create(form)
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {
      await veiculosApi.delete(confirm.codVeic)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro.')
    }
  }

  return (
    <div>
      <PageHeader title="Veículos" sub="Consulta de Veículos" label="Novo Veículo" onNew={() => abrir()} />

      <DataTable columns={cols} data={data} loading={loading} onEdit={abrir} onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Veículo' : 'Novo Veículo'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={JSON.stringify(form) !== JSON.stringify(originalForm)}
        suspended={estado.aberto || marca.aberto}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={linha}>
            {editing && <div style={{ flex: '0 0 90px' }}><FField label="Código" disabled value={String(form.codVeic ?? '')} onChange={() => {}} /></div>}
            <div style={{ flex: '0 0 240px' }}><FField label="Modelo do Veículo" required value={form.modelo ?? ''} onChange={v => upd('modelo', v)} {...regra('modeloVeiculo')} /></div>
            <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
          </div>
          <div style={linha}>
            <div style={{ flex: '1 1 140px' }}><FField label="Placa" value={form.placaVeic ?? ''} onChange={v => upd('placaVeic', v)} {...regra('placaVeic')} /></div>
            <div style={{ flex: '1 1 140px' }}><FField label="Placa MercoSul" value={form.placaMercoSul ?? ''} onChange={v => upd('placaMercoSul', v)} {...regra('placaMercoSul')} /></div>
            <div style={{ flex: '1 1 160px' }}><FField label="ANTT" value={form.codANTT ?? ''} onChange={v => upd('codANTT', v)} {...regra('codANTT')} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <LookupField label="Estado" value={estado.label(form.codEstado)} onSearch={estado.abrir} style={{ flex: '1 1 280px' }} />
            <LookupField label="Marca" value={marca.label(form.codMarca)} onSearch={marca.abrir} style={{ flex: '1 1 280px' }} />
          </div>
        </div>
      </Modal>

      <ConsultaEstado ctrl={estado} />
      <ConsultaMarca ctrl={marca} />

      <ConfirmDialog open={!!confirm} name={confirm?.placaVeic} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
