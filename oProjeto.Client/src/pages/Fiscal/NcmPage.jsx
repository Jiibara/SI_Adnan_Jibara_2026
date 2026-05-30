import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { ncmApi } from '@/services/api'

export default function NcmPage() {

  const { data, loading, load } = useCrud(ncmApi)

  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)

  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const upd = (k, v) =>
    setForm(p => ({ ...p, [k]: v }))

  const num = (k, v) =>
    setForm(p => ({ ...p, [k]: v === '' ? undefined : Number(v) }))

  const save = async () => {
    try {

      editing
        ? await ncmApi.update(form.ncmSh, form)
        : await ncmApi.create(form)

      toast.success('Salvo!')

      setOpen(false)
      load()

    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {

      await ncmApi.delete(confirm.ncmSh)

      toast.success('Excluído.')

      setConfirm(null)
      load()

    } catch {
      toast.error('Erro.')
    }
  }

  const cols = [
    { key:'ncmSh', label:'NCM/SH', mono:true },
    { key:'aliqIcms', label:'Alíq. ICMS (%)' },
    { key:'aliqIpi', label:'Alíq. IPI (%)' },
    { key:'ativo', label:'Ativo', render:r => r.ativo ? 'Sim' : 'Não' }
  ]

  return (
    <div>

      <PageHeader
        title="NCM/SH"
        sub="Consulta de NCM/SH"
        label="Novo NCM"
        onNew={() => {
          setForm({ ativo:true })
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
        title={editing ? 'Editar NCM' : 'Novo NCM'}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={save}
      >

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>

            <div style={{ flex:'1 1 180px' }}>
              <FField
                label="NCM/SH"
                required
                value={form.ncmSh ?? ''}
                onChange={v => upd('ncmSh', v)}
              />
            </div>

            <div style={{ flex:'1 1 180px' }}>
              <FField
                label="Alíq. ICMS (%)"
                type="number"
                step="0.01"
                value={form.aliqIcms ?? ''}
                onChange={v => num('aliqIcms', v)}
              />
            </div>

            <div style={{ flex:'1 1 180px' }}>
              <FField
                label="Alíq. IPI (%)"
                type="number"
                step="0.01"
                value={form.aliqIpi ?? ''}
                onChange={v => num('aliqIpi', v)}
              />
            </div>

            <label style={{
              display:'flex',
              alignItems:'center',
              gap:6,
              cursor:'pointer',
              paddingBottom:8,
              whiteSpace:'nowrap',
              fontSize:13,
              fontFamily:'Outfit, sans-serif',
              color:'#0f172a'
            }}>
              <input
                type="checkbox"
                checked={form.ativo ?? true}
                onChange={e => upd('ativo', e.target.checked)}
                style={{ width:16, height:16, cursor:'pointer' }}
              />
              Ativo
            </label>

          </div>

        </div>

      </Modal>

      <ConfirmDialog
        open={!!confirm}
        name={confirm?.ncmSh}
        onClose={() => setConfirm(null)}
        onConfirm={del}
      />

    </div>
  )
}

