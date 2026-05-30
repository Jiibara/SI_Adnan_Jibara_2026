import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { cidadesApi, estadosApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

export default function CidadesPage() {
  const { data, loading, load } = useCrud(cidadesApi)
  const [estados, setEstados] = useState([])
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [openEstados, setOpenEstados] = useState(false)

  useEffect(() => { estadosApi.getAll().then(setEstados) }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await cidadesApi.update(form.codCidade, form) : await cidadesApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await cidadesApi.delete(confirm.codCidade); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'codCidade', label: 'Cód.', mono: true },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'Estado', render: r => `${r.estado?.estado ?? ''} - ${r.estado?.uf ?? ''}` },
    { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  const colsEstados = [
    { key: 'codEstado', label: 'Cód.', mono: true },
    { key: 'estado', label: 'Estado' },
    { key: 'uf', label: 'UF' },
  ]

  const estadoSelecionado = estados.find(e => e.codEstado === form.codEstado)
  const estadoLabel = estadoSelecionado ? `${estadoSelecionado.estado} - ${estadoSelecionado.uf}` : ''

  const selectEstado = r => { setForm(f => ({ ...f, codEstado: r.codEstado })); setOpenEstados(false) }

  return (
    <div>
      <PageHeader title="Cidades" sub="Consulta de Cidades" label="Nova Cidade"
        onNew={() => { setForm({ ativo: true }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal open={open} title={editing ? 'Editar Cidade' : 'Nova Cidade'} editing={editing}
        onClose={() => setOpen(false)} onSave={save} wide>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 }}>
            <div style={{ flex: '0 0 30px' }}>
              <FField label="Código" value={editing ? String(form.codCidade ?? '') : '—'} onChange={() => { }} />
            </div>

            <div style={{ flex: '1 1 auto' }}>
              <FField label="Cidade" required value={form.cidade ?? ''} onChange={v => upd('cidade', v)} />
            </div>

            <div style={{ flex: '1 1 auto' }}>
              <label style={lbl}>Estado *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={estadoLabel} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setOpenEstados(true)}
                  style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
                  Pesquisar
                </button>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Ativo
            </label>
          </div>
          </div>
      </Modal>

      {openEstados && (
        <Overlay onClose={() => setOpenEstados(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)', animation: 'slideUp .2s ease' }}>

            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Estados</div>
              <button onClick={() => setOpenEstados(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                      {colsEstados.map(c => (
                        <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>{c.label}</th>
                      ))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {estados.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {colsEstados.map(c => (
                          <td key={c.key} style={{ padding: '11px 14px', color: '#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                            {String(row[c.key] ?? '')}
                          </td>
                        ))}
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button onClick={() => selectEstado(row)}
                            style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            Selecionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </Overlay>
      )}

      <ConfirmDialog open={!!confirm} name={confirm?.cidade} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}