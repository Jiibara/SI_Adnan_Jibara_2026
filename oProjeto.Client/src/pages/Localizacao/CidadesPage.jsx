import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { cidadesApi, estadosApi, paisesApi } from '@/services/api'
import { useModalGuard } from '@/hooks/useModalGuard'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

const ModalBox = ({ children, maxWidth = 760 }) => (
  <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)', animation: 'slideUp .2s ease' }}>
    {children}
  </div>
)

const ModalHeader = ({ title, badge, onClose }) => (
  <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
      {badge}
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
  </div>
)

const Inp = ({ label, value, onChange, maxLength, placeholder, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
  </div>
)

const Badge = ({ editing }) => (
  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '2px 8px', borderRadius: 100, background: editing ? '#dbeafe' : '#dcfce7', color: editing ? '#1d4ed8' : '#15803d' }}>
    {editing ? 'ALTERAR' : 'INSERIR'}
  </span>
)

const BtnPrimary = ({ onClick, disabled, children, style }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: disabled ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: disabled ? .7 : 1, ...style }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '.85')}
    onMouseLeave={e => e.currentTarget.style.opacity = disabled ? '.7' : '1'}>
    {children}
  </button>
)

const BtnSecondary = ({ onClick, children }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#475569' }}>
    {children}
  </button>
)

const BtnPesquisar = ({ onClick }) => (
  <button type="button" onClick={onClick}
    style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
    Pesquisar
  </button>
)

const LookupField = ({ label, value, onSearch }) => (
  <div>
    <label style={lbl}>{label}</label>
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="text" readOnly value={value} style={{ ...inp, flex: 1 }} />
      <BtnPesquisar onClick={onSearch} />
    </div>
  </div>
)

const CheckAtivo = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
    Ativo
  </label>
)

const LookupTable = ({ cols, rows, onSelect }) => (
  <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            {cols.map(c => <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>{c.label}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map(c => (
                <td key={c.key} style={{ padding: '11px 14px', color: '#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                  {c.render ? c.render(row) : String(row[c.key] ?? '')}
                </td>
              ))}
              <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                <button onClick={() => onSelect(row)}
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
)

const InlineForm = ({ title, children }) => (
  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#f8faff' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</span>
      <Badge editing={false} />
    </div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>
  </div>
)

const ESTADO_EMPTY = { estado: '', uf: '', codPais: null, ativo: true }
const PAIS_EMPTY   = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }

const cols = [
  { key: 'codCidade', label: 'Cód.', mono: true },
  { key: 'cidade', label: 'Cidade' },
  { key: 'ddd', label: 'DDD' },
  { key: 'estado', label: 'Estado', render: r => `${r.estado?.estado ?? ''} - ${r.estado?.uf ?? ''}` },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

const colsEstados = [
  { key: 'codEstado', label: 'Cód.', mono: true },
  { key: 'estado', label: 'Estado' },
  { key: 'uf', label: 'UF' },
  { key: 'pais', label: 'País', render: r => r.pais?.pais ?? '' },
]

const colsPaises = [
  { key: 'codPais', label: 'Cód.', mono: true },
  { key: 'pais', label: 'País' },
  { key: 'sigla', label: 'Sigla' },
  { key: 'ddi', label: 'DDI' },
  { key: 'moeda', label: 'Moeda' },
]

export default function CidadesPage() {
  const { data, loading, load } = useCrud(cidadesApi)
  const [estados, setEstados] = useState([])
  const [paises, setPaises]   = useState([])
  const [form, setForm]       = useState({})
  const [originalForm, setOriginalForm] = useState({}) 
  const [editing, setEditing] = useState(false)
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [openEstados, setOpenEstados]     = useState(false)
  const [showNovoEstado, setShowNovoEstado] = useState(false)
  const [novoEstado, setNovoEstado]       = useState(ESTADO_EMPTY)
  const [savingEstado, setSavingEstado]   = useState(false)

  const [openPaises, setOpenPaises]     = useState(false)
  const [showNovoPais, setShowNovoPais] = useState(false)
  const [novoPais, setNovoPais]         = useState(PAIS_EMPTY)
  const [savingPais, setSavingPais]     = useState(false)

  const loadEstados = async () => setEstados(await estadosApi.getAll())
  const loadPaises  = async () => setPaises(await paisesApi.getAll())
  useEffect(() => { loadEstados(); loadPaises() }, [])

  const upd  = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updE = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updP = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))

  const save = async () => {
    try { editing ? await cidadesApi.update(form.codCidade, form) : await cidadesApi.create(form); toast.success('Salvo!'); setOpen(false); load() }
    catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await cidadesApi.delete(confirm.codCidade); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const saveNovoEstado = async () => {
    if (!novoEstado.estado.trim()) { toast.error('Informe o nome do estado.'); return }
    setSavingEstado(true)
    try { await estadosApi.create(novoEstado); toast.success('Estado cadastrado!'); await loadEstados(); setShowNovoEstado(false); setNovoEstado(ESTADO_EMPTY) }
    catch { toast.error('Erro ao salvar estado.') }
    finally { setSavingEstado(false) }
  }

  const saveNovoPais = async () => {
    if (!novoPais.pais.trim()) { toast.error('Informe o nome do país.'); return }
    setSavingPais(true)
    try { await paisesApi.create(novoPais); toast.success('País cadastrado!'); await loadPaises(); setShowNovoPais(false); setNovoPais(PAIS_EMPTY) }
    catch { toast.error('Erro ao salvar país.') }
    finally { setSavingPais(false) }
  }

  const cancelNovoEstado = () => { setShowNovoEstado(false); setNovoEstado(ESTADO_EMPTY) }
  const cancelNovoPais   = () => { setShowNovoPais(false); setNovoPais(PAIS_EMPTY) }
  const closeEstados     = () => { setOpenEstados(false); cancelNovoEstado() }
  const closePaises      = () => { setOpenPaises(false); cancelNovoPais() }

  const estadoSelecionado = estados.find(e => e.codEstado === form.codEstado)
  const estadoLabel       = estadoSelecionado ? `${estadoSelecionado.estado} - ${estadoSelecionado.uf}` : ''
  const selectEstado      = r => { setForm(f => ({ ...f, codEstado: r.codEstado })); setOpenEstados(false) }

  const paisNoEstado    = paises.find(p => p.codPais === novoEstado.codPais)?.pais ?? ''
  const selectPais      = r => { setNovoEstado(e => ({ ...e, codPais: r.codPais })); setOpenPaises(false) }

  const isDirtyCidade = JSON.stringify(form) !== JSON.stringify(originalForm)

  const isDirtyEstado = showNovoEstado && JSON.stringify(novoEstado) !== JSON.stringify(ESTADO_EMPTY)
  const estadosGuard = useModalGuard({
    isOpen: openEstados,
    isDirty: isDirtyEstado,
    onClose: closeEstados,
    onSave: showNovoEstado ? saveNovoEstado : undefined,
    paused: openPaises, 
  })

  const isDirtyPais = showNovoPais && JSON.stringify(novoPais) !== JSON.stringify(PAIS_EMPTY)
  const paisesGuard = useModalGuard({
    isOpen: openPaises,
    isDirty: isDirtyPais,
    onClose: closePaises,
    onSave: showNovoPais ? saveNovoPais : undefined,
  })

  const abrirNovaCidade = () => {
    const f = { ativo: true }
    setForm(f); setOriginalForm(f); setEditing(false); setOpen(true)
  }

  const abrirEdicaoCidade = (r) => {
    setForm(r); setOriginalForm(r); setEditing(true); setOpen(true)
  }

  return (
    <div>
      <PageHeader title="Cidades" sub="Consulta de Cidades" label="Nova Cidade" onNew={abrirNovaCidade} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicaoCidade}
        onDelete={r => setConfirm(r)} />

      <Modal open={open} title={editing ? 'Editar Cidade' : 'Nova Cidade'} editing={editing}
        onClose={() => setOpen(false)} onSave={save} wide
        isDirty={isDirtyCidade}
        suspended={openEstados || openPaises}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 }}>
          <div style={{ flex: '0 0 30px' }}>
            <FField label="Código" value={editing ? String(form.codCidade ?? '') : '—'} onChange={() => {}} />
          </div>
          <div style={{ flex: '1 1 auto' }}>
            <FField label="Cidade" required value={form.cidade ?? ''} onChange={v => upd('cidade', v)} />
          </div>
          <div style={{ flex: '1 0 60px' }}>
            <FField label="DDD" required value={form.ddd ?? ''} onChange={v => upd('ddd', v)} />
          </div>
          <div style={{ flex: '1 1 auto' }}>
            <LookupField label="Estado *" value={estadoLabel} onSearch={() => { setShowNovoEstado(false); setOpenEstados(true) }} />
          </div>
          <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
        </div>
      </Modal>
      {/* Estados */ }
      {openEstados && (
        <Overlay onClose={estadosGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={720}>
            <ModalHeader title="Consulta de Estados" onClose={estadosGuard.attemptClose}
              badge={!showNovoEstado && (
                <BtnPrimary onClick={() => setShowNovoEstado(true)} style={{ marginTop: 6, padding: '4px 12px', fontSize: 12 }}>
                  + Novo Estado
                </BtnPrimary>
              )} />

            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp label="Estado *" value={novoEstado.estado} onChange={v => updE('estado', v)} placeholder="" style={{ flex: '1 1 200px', minWidth: 160 }} />
                <Inp label="UF *" value={novoEstado.uf} onChange={v => updE('uf', v.toUpperCase())} maxLength={2} placeholder="" style={{ flex: '0 0 72px' }} />
                <LookupField label="País *" value={paisNoEstado} onSearch={() => { setShowNovoPais(false); setOpenPaises(true) }} />
                <CheckAtivo checked={novoEstado.ativo} onChange={v => updE('ativo', v)} />
                <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
                  <BtnSecondary onClick={cancelNovoEstado}>Cancelar</BtnSecondary>
                  <BtnPrimary onClick={saveNovoEstado} disabled={savingEstado}>{savingEstado ? 'Salvando...' : 'Salvar Estado'}</BtnPrimary>
                </div>
              </InlineForm>
            )}

            <LookupTable cols={colsEstados} rows={estados} onSelect={selectEstado} />
          </ModalBox>
        </Overlay>
      )}
      {/* Paises */ }
      {openPaises && (
        <Overlay onClose={paisesGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Países" onClose={paisesGuard.attemptClose}
              badge={!showNovoPais && (
                <BtnPrimary onClick={() => setShowNovoPais(true)} style={{ marginTop: 6, padding: '4px 12px', fontSize: 12 }}>
                  + Novo País
                </BtnPrimary>
              )} />

            {showNovoPais && (
              <InlineForm title="Novo País">
                <Inp label="País *" value={novoPais.pais} onChange={v => updP('pais', v)} placeholder=" " style={{ flex: '1 1 200px', minWidth: 160 }} />
                <Inp label="Sigla" value={novoPais.sigla} onChange={v => updP('sigla', v.toUpperCase())} maxLength={3} placeholder=" " style={{ flex: '0 0 80px' }} />
                <Inp label="DDI" value={novoPais.ddi} onChange={v => updP('ddi', v)} maxLength={6} placeholder="" style={{ flex: '0 0 80px' }} />
                <Inp label="Moeda" value={novoPais.moeda} onChange={v => updP('moeda', v)} maxLength={10} placeholder="" style={{ flex: '1 1 120px', minWidth: 100 }} />
                <CheckAtivo checked={novoPais.ativo} onChange={v => updP('ativo', v)} />
                <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
                  <BtnSecondary onClick={cancelNovoPais}>Cancelar</BtnSecondary>
                  <BtnPrimary onClick={saveNovoPais} disabled={savingPais}>{savingPais ? 'Salvando...' : 'Salvar País'}</BtnPrimary>
                </div>
              </InlineForm>
            )}

            <LookupTable cols={colsPaises} rows={paises} onSelect={selectPais} />
          </ModalBox>
        </Overlay>
      )}

      <ConfirmDialog
        open={estadosGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Todos dados escritos serão apagados."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={estadosGuard.cancelClose}
        onConfirm={estadosGuard.confirmClose}
      />

      <ConfirmDialog
        open={paisesGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Todos dados escritos serão apagados."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={paisesGuard.cancelClose}
        onConfirm={paisesGuard.confirmClose}
      />

      <ConfirmDialog open={!!confirm} name={confirm?.cidade} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}