import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { produtosApi, ncmApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

export default function ProdutosPage() {
  const { data, loading, load } = useCrud(produtosApi)
  const [ncms, setNcms] = useState([])
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [openNcms, setOpenNcms] = useState(false)

  useEffect(() => { ncmApi.getAll().then(setNcms) }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await produtosApi.update(form.codProd, form) : await produtosApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await produtosApi.delete(confirm.codProd); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'codProd', label: 'Cód.', mono: true },
    { key: 'produto', label: 'Produto' },
    { key: 'unidade', label: 'Un.' },
    { key: 'ncmShs', label: 'NCM', render: r => r.ncmShs?.ncmSh ?? '' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  const colsNcm = [
    { key: 'ncmSh', label: 'NCM/SH', mono: true },
    { key: 'descricao', label: 'Descrição' },
  ]

  const ncmSelecionado = form.ncmSh ?? ''
  const selectNcm = r => { setForm(f => ({ ...f, ncmSh: r.ncmSh })); setOpenNcms(false) }

  const F = (label, key, num = false) => (
    <FField label={label} type={num ? 'number' : 'text'} step={num ? '0.01' : undefined}
      value={form[key] ?? ''} onChange={v => upd(key, num ? Number(v) : v)} />
  )

  return (
    <div>
      <PageHeader title="Produtos" sub="Consulta de Produtos" label="Novo Produto"
        onNew={() => { setForm({ ativo: true }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Produto' : 'Novo Produto'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Linha 1: Produto + Ativo */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 30px' }}>
              <FField label="Código" value={editing ? String(form.codProd ?? '') : '—'} onChange={() => { }} />
            </div>
            <div style={{ flex: '0 0 auto' }}>{F('Produto', 'produto')}</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Ativo
            </label>
          </div>

          {/* Linha 2: NCM (com pesquisar) + Unidade */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '0 1 200px' }}>
              <label style={lbl}>NCM/SH *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={ncmSelecionado} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setOpenNcms(true)}
                  style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
                  Pesquisar
                </button>
              </div>
            </div>
            <div style={{ flex: '0 0 110px' }}>{F('Unidade', 'unidade')}</div>
          </div>

          {/* Linha 3: Peso Bruto + Peso Líq. + Saldo + Custo Médio */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '1 1 auto' }}>{F('Peso Bruto (kg)', 'pesoBruto', true)}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Peso Líq. (kg)', 'pesoLiq', true)}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Saldo', 'saldo', true)}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Custo Médio', 'custoMedio', true)}</div>
          </div>

        </div>
      </Modal>

      {openNcms && (
        <Overlay onClose={() => setOpenNcms(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)', animation: 'slideUp .2s ease' }}>

            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de NCM/SH</div>
              <button onClick={() => setOpenNcms(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                      {colsNcm.map(c => (
                        <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>{c.label}</th>
                      ))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {ncms.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {colsNcm.map(c => (
                          <td key={c.key} style={{ padding: '11px 14px', color: '#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                            {String(row[c.key] ?? '')}
                          </td>
                        ))}
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button onClick={() => selectNcm(row)}
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

      <ConfirmDialog open={!!confirm} name={confirm?.produto} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}