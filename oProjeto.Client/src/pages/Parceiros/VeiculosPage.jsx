import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
// Importação de marcasApi adicionada aqui
import { veiculosApi, estadosApi, marcasApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const btnSearch = { padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

export default function VeiculosPage() {
  const { data, loading, load } = useCrud(veiculosApi)
  const [estados, setEstados] = useState([])
  const [marcas, setMarcas] = useState([])
  const [form, setForm] = useState({ ativo: true })
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [openEstados, setOpenEstados] = useState(false)
  const [openMarcas, setOpenMarcas] = useState(false)

  useEffect(() => {
    estadosApi.getAll().then(setEstados)
    marcasApi.getAll().then(setMarcas) // Busca as marcas no carregamento
  }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await veiculosApi.update(form.codVeic, form) : await veiculosApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await veiculosApi.delete(confirm.codVeic); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

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

  const colsEstados = [
    { key: 'codEstado', label: 'Cód.', mono: true },
    { key: 'estado', label: 'Estado' },
    { key: 'uf', label: 'UF' },
  ]

  const estadoSelecionado = estados.find(e => e.codEstado === form.codEstado)
  const estadoLabel = estadoSelecionado ? `${estadoSelecionado.estado} (${estadoSelecionado.uf})` : ''
  const selectEstado = r => { setForm(f => ({ ...f, codEstado: r.codEstado })); setOpenEstados(false) }

  const marcaSelecionada = marcas.find(m => m.codMarca === form.codMarca)
  const marcaLabel = marcaSelecionada ? `${marcaSelecionada.marca ?? ''}` : ''
  const selectMarca = r => { setForm(f => ({ ...f, codMarca: r.codMarca })); setOpenMarcas(false) }

  return (
    <div>
      <PageHeader title="Veículos" sub="Consulta de Veículos" label="Novo Veículo"
        onNew={() => { setForm({ ativo: true }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Veículo' : 'Novo Veículo'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Linha 1: Código (Apenas visual se editando), Modelo do Veículo e Ativo */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {editing && (
              <div style={{ flex: '0 0 90px' }}>
                <FField label="Código" disabled value={String(form.codVeic ?? '')} onChange={() => { }} />
              </div>
            )}
            <div style={{ flex: '0 0 240px' }}>
              <FField label="Modelo do Veículo" required value={form.modelo ?? ''} onChange={v => upd('modelo', v)} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Ativo
            </label>
          </div>

          {/* Linha 2: Placas e ANTT */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <FField label="Placa" value={form.placaVeic ?? ''} onChange={v => upd('placaVeic', v)} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <FField label="Placa MercoSul" value={form.placaMercoSul ?? ''} onChange={v => upd('placaMercoSul', v)} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <FField label="ANTT" value={form.codANTT ?? ''} onChange={v => upd('codANTT', v)} />
            </div>
          </div>

          {/* Linha 3: Modais de Pesquisa (Estado e Marca) */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

            {/* Estado */}
            <div style={{ flex: '1 1 280px' }}>
              <label style={lbl}>Estado</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={estadoLabel} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setOpenEstados(true)}
                  style={btnSearch}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
                  Pesquisar
                </button>
              </div>
            </div>

            {/* Marca */}
            <div style={{ flex: '1 1 280px' }}>
              <label style={lbl}>Marca</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={marcaLabel} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setOpenMarcas(true)}
                  style={btnSearch}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
                  Pesquisar
                </button>
              </div>
            </div>

          </div>
        </div>
      </Modal>

      {/* MODAL DE PESQUISA - ESTADOS */}
      {openEstados && (
        <Overlay onClose={() => setOpenEstados(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Estados</div>
              <button onClick={() => setOpenEstados(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
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
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        {colsEstados.map(c => (
                          <td key={c.key} style={{ padding: '11px 14px', color: '#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                            {String(row[c.key] ?? '')}
                          </td>
                        ))}
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button onClick={() => selectEstado(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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

      {/* MODAL DE PESQUISA - MARCAS */}
      {openMarcas && (
        <Overlay onClose={() => setOpenMarcas(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Marcas</div>
              <button onClick={() => setOpenMarcas(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>Cód.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>Marca</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {marcas.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        <td style={{ padding: '11px 14px', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{row.codMarca}</td>
                        <td style={{ padding: '11px 14px', color: '#0f172a' }}>{row.marca ?? ''}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button onClick={() => selectMarca(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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

      <ConfirmDialog open={!!confirm} name={confirm?.placaVeic} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}