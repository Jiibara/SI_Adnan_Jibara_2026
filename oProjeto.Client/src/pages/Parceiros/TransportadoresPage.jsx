import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { transportadoresApi, cidadesApi, estadosApi, paisesApi, veiculosApi, marcasApi } from '@/services/api'
import { useModalGuard } from '@/hooks/useModalGuard'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'

const Overlay = ({ children, onClose, zIndex = 60 }) => (
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

const LookupField = ({ label, value, onSearch, style }) => (
  <div style={style}>
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

const Inp = ({ label, value, onChange, maxLength, placeholder, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
  </div>
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

const BtnNovo = ({ onClick, label }) => (
  <BtnPrimary onClick={onClick} style={{ marginTop: 6, padding: '4px 12px', fontSize: 12 }}>+ {label}</BtnPrimary>
)

const SaveRow = ({ onCancel, onSave, saving, label }) => (
  <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
    <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
    <BtnPrimary onClick={onSave} disabled={saving}>{saving ? 'Salvando...' : label}</BtnPrimary>
  </div>
)

const cols = [
  { key: 'codTransp',     label: 'Cód.',         mono: true },
  { key: 'transportador', label: 'Transportador' },
  { key: 'tipoPessoa',    label: 'Tipo' },
  { key: 'cpfCnpj',       label: 'CPF/CNPJ',     mono: true },
  { key: 'cidade',        label: 'Cidade',        render: r => r.cidade?.cidade ?? '' },
  { key: 'ativo',         label: 'Ativo',         render: r => r.ativo ? 'Sim' : 'Não' },
]
const colsCidades = [{ key: 'codCidade', label: 'Cód.', mono: true }, { key: 'cidade', label: 'Cidade' }, { key: 'estado', label: 'Estado', render: r => `${r.estado?.uf ?? ''} - ${r.estado?.estado ?? ''}` }]
const colsEstados = [{ key: 'codEstado', label: 'Cód.', mono: true }, { key: 'estado', label: 'Estado' }, { key: 'uf', label: 'UF' }, { key: 'pais', label: 'País', render: r => r.pais?.pais ?? '' }]
const colsPaises  = [{ key: 'codPais', label: 'Cód.', mono: true }, { key: 'pais', label: 'País' }, { key: 'sigla', label: 'Sigla' }, { key: 'ddi', label: 'DDI' }]
const colsVeiculos = [{ key: 'codVeic', label: 'Cód.', mono: true }, { key: 'placaVeic', label: 'Placa' }, { key: 'modelo', label: 'Modelo' }, { key: 'estado', label: 'Estado', render: r => r.estado?.uf ?? '' }, { key: 'marca', label: 'Marca', render: r => r.marca?.marca ?? '' }]
const colsMarcas   = [{ key: 'codMarca', label: 'Cód.', mono: true }, { key: 'marca', label: 'Marca' }]

const CIDADE_EMPTY  = { cidade: '', ddd: '', codEstado: null, ativo: true }
const ESTADO_EMPTY  = { estado: '', uf: '', codPais: null, ativo: true }
const PAIS_EMPTY    = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }
const VEICULO_EMPTY = { placaVeic: '', placaMercoSul: '', modelo: '', codANTT: '', codEstado: null, codMarca: null, ativo: true }
const MARCA_EMPTY   = { marca: '', ativo: true }

export default function TransportadoresPage() {
  const { data, loading, load } = useCrud(transportadoresApi)
  const [form, setForm]       = useState({ tipoPessoa: 'PJ', ativo: true })
    const [originalForm, setOriginalForm] = useState({ tipoPessoa: 'PJ', ativo: true })
  const [editing, setEditing] = useState(false)
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [cidades,  setCidades]  = useState([])
  const [estados,  setEstados]  = useState([])
  const [paises,   setPaises]   = useState([])
  const [veiculos, setVeiculos] = useState([])
  const [marcas,   setMarcas]   = useState([])

  const [openCidades,  setOpenCidades]  = useState(false)
  const [openEstados,  setOpenEstados]  = useState(false)
  const [openPaises,   setOpenPaises]   = useState(false)
  const [openVeiculos, setOpenVeiculos] = useState(false)
  const [openEstadosV, setOpenEstadosV] = useState(false)
  const [openPaisesV,  setOpenPaisesV]  = useState(false)
  const [openMarcas,   setOpenMarcas]   = useState(false)

  const [novaCidade,  setNovaCidade]  = useState(CIDADE_EMPTY)
  const [novoEstado,  setNovoEstado]  = useState(ESTADO_EMPTY)
  const [novoPais,    setNovoPais]    = useState(PAIS_EMPTY)
  const [novoVeiculo,  setNovoVeiculo]  = useState(VEICULO_EMPTY)
  const [novoEstadoV,  setNovoEstadoV]  = useState(ESTADO_EMPTY)
  const [novoPaisV,    setNovoPaisV]    = useState(PAIS_EMPTY)
  const [novaMarca,    setNovaMarca]    = useState(MARCA_EMPTY)

  const [showNovaCidade,  setShowNovaCidade]  = useState(false)
  const [showNovoEstado,  setShowNovoEstado]  = useState(false)
  const [showNovoPais,    setShowNovoPais]    = useState(false)
  const [showNovoVeiculo, setShowNovoVeiculo] = useState(false)
  const [showNovoEstadoV, setShowNovoEstadoV] = useState(false)
  const [showNovoPaisV,   setShowNovoPaisV]   = useState(false)
  const [showNovaMarca,   setShowNovaMarca]   = useState(false)

  const [savingCidade,  setSavingCidade]  = useState(false)
  const [savingEstado,  setSavingEstado]  = useState(false)
  const [savingPais,    setSavingPais]    = useState(false)
  const [savingVeiculo, setSavingVeiculo] = useState(false)
  const [savingEstadoV, setSavingEstadoV] = useState(false)
  const [savingPaisV,   setSavingPaisV]   = useState(false)
  const [savingMarca,   setSavingMarca]   = useState(false)

  const loadCidades  = async () => setCidades(await cidadesApi.getAll())
  const loadEstados  = async () => setEstados(await estadosApi.getAll())
  const loadPaises   = async () => setPaises(await paisesApi.getAll())
  const loadVeiculos = async () => setVeiculos(await veiculosApi.getAll())
  const loadMarcas   = async () => setMarcas(await marcasApi.getAll())

  useEffect(() => { loadCidades(); loadEstados(); loadPaises(); loadVeiculos(); loadMarcas() }, [])

  const upd  = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updC = (k, v) => setNovaCidade(p => ({ ...p, [k]: v }))
  const updE = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updP = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))
  const updV  = (k, v) => setNovoVeiculo(p => ({ ...p, [k]: v }))
  const updEV = (k, v) => setNovoEstadoV(p => ({ ...p, [k]: v }))
  const updPV = (k, v) => setNovoPaisV(p => ({ ...p, [k]: v }))
  const updM  = (k, v) => setNovaMarca(p => ({ ...p, [k]: v }))

  const save = async () => {
    try { editing ? await transportadoresApi.update(form.codTransp, form) : await transportadoresApi.create(form); toast.success('Salvo!'); setOpen(false); load() }
    catch { toast.error('Erro ao salvar.') }
  }
  const del = async () => {
    try { await transportadoresApi.delete(confirm.codTransp); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const mkSave = (api, payload, check, errMsg, afterSave, setSaving, setShow, reset) => async () => {
    if (!check()) { toast.error(errMsg); return }
    setSaving(true)
    try { await api.create(payload); toast.success('Cadastrado!'); await afterSave(); setShow(false); reset() }
    catch { toast.error('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  const saveNovaCidade  = mkSave(cidadesApi,  novaCidade,   () => novaCidade.cidade.trim(),    'Informe a cidade.', loadCidades,  setSavingCidade,  setShowNovaCidade,  () => setNovaCidade(CIDADE_EMPTY))
  const saveNovoEstado  = mkSave(estadosApi,  novoEstado,   () => novoEstado.estado.trim(),    'Informe o estado.', loadEstados,  setSavingEstado,  setShowNovoEstado,  () => setNovoEstado(ESTADO_EMPTY))
  const saveNovoPais    = mkSave(paisesApi,   novoPais,     () => novoPais.pais.trim(),         'Informe o país.',   loadPaises,   setSavingPais,    setShowNovoPais,    () => setNovoPais(PAIS_EMPTY))
  const saveNovoVeiculo = mkSave(veiculosApi, novoVeiculo,  () => novoVeiculo.placaVeic.trim(), 'Informe a placa.',  loadVeiculos, setSavingVeiculo, setShowNovoVeiculo, () => setNovoVeiculo(VEICULO_EMPTY))
  const saveNovoEstadoV = mkSave(estadosApi,  novoEstadoV,  () => novoEstadoV.estado.trim(),   'Informe o estado.', loadEstados,  setSavingEstadoV, setShowNovoEstadoV, () => setNovoEstadoV(ESTADO_EMPTY))
  const saveNovoPaisV   = mkSave(paisesApi,   novoPaisV,    () => novoPaisV.pais.trim(),        'Informe o país.',   loadPaises,   setSavingPaisV,   setShowNovoPaisV,   () => setNovoPaisV(PAIS_EMPTY))
  const saveNovaMarca   = mkSave(marcasApi,   novaMarca,    () => novaMarca.marca.trim(),       'Informe a marca.',  loadMarcas,   setSavingMarca,   setShowNovaMarca,   () => setNovaMarca(MARCA_EMPTY))

  const cancelC  = () => { setShowNovaCidade(false);  setNovaCidade(CIDADE_EMPTY) }
  const cancelE  = () => { setShowNovoEstado(false);  setNovoEstado(ESTADO_EMPTY) }
  const cancelP  = () => { setShowNovoPais(false);    setNovoPais(PAIS_EMPTY) }
  const cancelV  = () => { setShowNovoVeiculo(false); setNovoVeiculo(VEICULO_EMPTY) }
  const cancelEV = () => { setShowNovoEstadoV(false); setNovoEstadoV(ESTADO_EMPTY) }
  const cancelPV = () => { setShowNovoPaisV(false);   setNovoPaisV(PAIS_EMPTY) }
  const cancelM  = () => { setShowNovaMarca(false);   setNovaMarca(MARCA_EMPTY) }

  const closeCidades  = () => { setOpenCidades(false);  cancelC() }
  const closeEstados  = () => { setOpenEstados(false);  cancelE() }
  const closePaises   = () => { setOpenPaises(false);   cancelP() }
  const closeVeiculos = () => { setOpenVeiculos(false); cancelV() }
  const closeEstadosV = () => { setOpenEstadosV(false); cancelEV() }
  const closePaisesV  = () => { setOpenPaisesV(false);  cancelPV() }
  const closeMarcas   = () => { setOpenMarcas(false);   cancelM() }

  const estadoNaCidade  = estados.find(e => e.codEstado === novaCidade.codEstado)
  const estadoLabel     = estadoNaCidade ? `${estadoNaCidade.estado} - ${estadoNaCidade.uf}` : ''
  const paisNoEstado    = paises.find(p => p.codPais === novoEstado.codPais)?.pais ?? ''

  const estadoNoVeic    = estados.find(e => e.codEstado === novoVeiculo.codEstado)
  const estadoVLabel    = estadoNoVeic ? `${estadoNoVeic.estado} - ${estadoNoVeic.uf}` : ''
  const paisNoEstadoV   = paises.find(p => p.codPais === novoEstadoV.codPais)?.pais ?? ''
  const marcaNoVeic     = marcas.find(m => m.codMarca === novoVeiculo.codMarca)?.marca ?? ''

  const cidadeLabel  = cidades.find(c => c.codCidade === form.codCidade)?.cidade ?? ''
  const veiculoSel   = veiculos.find(v => v.codVeic === form.codVeic)
  const veiculoLabel = veiculoSel ? `${veiculoSel.placaVeic ?? ''} - ${veiculoSel.modelo ?? ''}` : ''

  const isPF = form.tipoPessoa === 'PF'
  const btnTipo = (tipo, label) => (
    <button type="button" onClick={() => upd('tipoPessoa', tipo)}
      style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'Outfit, sans-serif',
        borderColor: form.tipoPessoa === tipo ? '#2563eb' : '#e2e6ed',
        background:  form.tipoPessoa === tipo ? '#eff6ff'  : '#fff',
        color:       form.tipoPessoa === tipo ? '#2563eb'  : '#0f172a' }}>
      {label}
    </button>
  )

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const anyLookupOpen = openCidades || openEstados || openPaises || openVeiculos || openEstadosV || openPaisesV || openMarcas
  const { confirming, attemptClose, confirmClose, cancelClose } = useModalGuard({
    isOpen: open,
    isDirty,
    onClose: () => setOpen(false),
    onSave: save,
    paused: anyLookupOpen,
  })

  const abrirNovo = () => { const f = { tipoPessoa: 'PJ', ativo: true }; setForm(f); setOriginalForm(f); setEditing(false); setOpen(true) }
  const abrirEdicao = (r) => { setForm(r); setOriginalForm(r); setEditing(true); setOpen(true) }

  return (
    <div>
      <PageHeader title="Transportadores" sub="Consulta de Transportadores" label="Novo Transportador"
        onNew={abrirNovo} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicao}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Transportador' : 'Novo Transportador'} editing={editing} onClose={attemptClose} onSave={save}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <label style={lbl}>Tipo Pessoa</label>
              <div style={{ display: 'flex', gap: 8 }}>{btnTipo('PF', 'Pessoa Física')}{btnTipo('PJ', 'Pessoa Jurídica')}</div>
            </div>
            <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}><FField label="Transportador" required value={form.transportador ?? ''} onChange={v => upd('transportador', v)} /></div>
            <div style={{ flex: '1 1 320px' }}><FField label={isPF ? 'Apelido' : 'Nome Fantasia'} value={form.nomeFantasia ?? ''} onChange={v => upd('nomeFantasia', v)} /></div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}><FField label={isPF ? 'CPF' : 'CNPJ'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} /></div>
            <div style={{ flex: '1 1 320px' }}><FField label={isPF ? 'RG' : 'Insc. Estadual'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} /></div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}><FField label="Endereço" value={form.endereco ?? ''} onChange={v => upd('endereco', v)} /></div>
            <div style={{ flex: '0 0 100px' }}><FField label="Número" type="number" value={form.numero ?? ''} onChange={v => upd('numero', Number(v))} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label="Complemento" value={form.complemento ?? ''} onChange={v => upd('complemento', v)} /></div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 220px' }}><FField label="Bairro" value={form.bairro ?? ''} onChange={v => upd('bairro', v)} /></div>
            <div style={{ flex: '0 0 140px' }}><FField label="CEP" value={form.cep ?? ''} onChange={v => upd('cep', v)} /></div>
            <LookupField label="Cidade" value={cidadeLabel} onSearch={() => { setShowNovaCidade(false); setOpenCidades(true) }} style={{ flex: '1 1 220px' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}><FField label="Telefone" value={form.fone ?? ''} onChange={v => upd('fone', v)} /></div>
            <div style={{ flex: '1 1 250px' }}><FField label="Email" value={form.email ?? ''} onChange={v => upd('email', v)} /></div>
            <div style={{ flex: '1 1 250px' }}><FField label="Site" value={form.site ?? ''} onChange={v => upd('site', v)} /></div>
          </div>

          <LookupField label="Veículo" value={veiculoLabel} onSearch={() => setOpenVeiculos(true)} style={{ maxWidth: 700 }} />

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
      {/* Cidades */}
      {openCidades && (
        <Overlay onClose={closeCidades} zIndex={60}>
          <ModalBox maxWidth={640}>
            <ModalHeader title="Consulta de Cidades" onClose={closeCidades}
              badge={!showNovaCidade && <BtnNovo onClick={() => setShowNovaCidade(true)} label="Nova Cidade" />} />
            {showNovaCidade && (
              <InlineForm title="Nova Cidade">
                <Inp label="Cidade *" value={novaCidade.cidade} onChange={v => updC('cidade', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <Inp label="DDD" value={novaCidade.ddd} onChange={v => updC('ddd', v)} maxLength={3} placeholder="" style={{ flex: '0 0 72px' }} />
                <LookupField label="Estado *" value={estadoLabel} onSearch={() => { setShowNovoEstado(false); setOpenEstados(true) }} />
                <CheckAtivo checked={novaCidade.ativo} onChange={v => updC('ativo', v)} />
                <SaveRow onCancel={cancelC} onSave={saveNovaCidade} saving={savingCidade} label="Salvar Cidade" />
              </InlineForm>
            )}
            <LookupTable cols={colsCidades} rows={cidades} onSelect={r => { upd('codCidade', r.codCidade); setOpenCidades(false) }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Estados */}
      {openEstados && (
        <Overlay onClose={closeEstados} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Estados" onClose={closeEstados}
              badge={!showNovoEstado && <BtnNovo onClick={() => setShowNovoEstado(true)} label="Novo Estado" />} />
            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp label="Estado *" value={novoEstado.estado} onChange={v => updE('estado', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <Inp label="UF *" value={novoEstado.uf} onChange={v => updE('uf', v.toUpperCase())} maxLength={2} placeholder="" style={{ flex: '0 0 72px' }} />
                <LookupField label="País *" value={paisNoEstado} onSearch={() => { setShowNovoPais(false); setOpenPaises(true) }} />
                <CheckAtivo checked={novoEstado.ativo} onChange={v => updE('ativo', v)} />
                <SaveRow onCancel={cancelE} onSave={saveNovoEstado} saving={savingEstado} label="Salvar Estado" />
              </InlineForm>
            )}
            <LookupTable cols={colsEstados} rows={estados} onSelect={r => { updC('codEstado', r.codEstado); setOpenEstados(false) }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Paises */}
      {openPaises && (
        <Overlay onClose={closePaises} zIndex={80}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Países" onClose={closePaises}
              badge={!showNovoPais && <BtnNovo onClick={() => setShowNovoPais(true)} label="Novo País" />} />
            {showNovoPais && (
              <InlineForm title="Novo País">
                <Inp label="País *" value={novoPais.pais} onChange={v => updP('pais', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <Inp label="Sigla" value={novoPais.sigla} onChange={v => updP('sigla', v.toUpperCase())} maxLength={3} placeholder="" style={{ flex: '0 0 80px' }} />
                <Inp label="DDI" value={novoPais.ddi} onChange={v => updP('ddi', v)} maxLength={6} placeholder="" style={{ flex: '0 0 80px' }} />
                <Inp label="Moeda" value={novoPais.moeda} onChange={v => updP('moeda', v)} maxLength={10} placeholder="" style={{ flex: '1 1 120px' }} />
                <CheckAtivo checked={novoPais.ativo} onChange={v => updP('ativo', v)} />
                <SaveRow onCancel={cancelP} onSave={saveNovoPais} saving={savingPais} label="Salvar País" />
              </InlineForm>
            )}
            <LookupTable cols={colsPaises} rows={paises} onSelect={r => { updE('codPais', r.codPais); setOpenPaises(false) }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Veiculos */}
      {openVeiculos && (
        <Overlay onClose={closeVeiculos} zIndex={60}>
          <ModalBox maxWidth={720}>
            <ModalHeader title="Consulta de Veículos" onClose={closeVeiculos}
              badge={!showNovoVeiculo && <BtnNovo onClick={() => setShowNovoVeiculo(true)} label="Novo Veículo" />} />
            {showNovoVeiculo && (
              <InlineForm title="Novo Veículo">
                <Inp label="Placa *" value={novoVeiculo.placaVeic} onChange={v => updV('placaVeic', v.toUpperCase())} maxLength={8} placeholder="" style={{ flex: '0 0 110px' }} />
                <Inp label="Placa Mercosul" value={novoVeiculo.placaMercoSul} onChange={v => updV('placaMercoSul', v.toUpperCase())} maxLength={8} placeholder="" style={{ flex: '0 0 130px' }} />
                <Inp label="Modelo" value={novoVeiculo.modelo} onChange={v => updV('modelo', v)} placeholder="" style={{ flex: '1 1 160px' }} />
                <Inp label="ANTT" value={novoVeiculo.codANTT} onChange={v => updV('codANTT', v)} maxLength={20} placeholder="" style={{ flex: '1 1 130px' }} />
                <LookupField label="Estado *" value={estadoVLabel} onSearch={() => { setShowNovoEstadoV(false); setOpenEstadosV(true) }} />
                <LookupField label="Marca" value={marcaNoVeic} onSearch={() => { setShowNovaMarca(false); setOpenMarcas(true) }} />
                <CheckAtivo checked={novoVeiculo.ativo} onChange={v => updV('ativo', v)} />
                <SaveRow onCancel={cancelV} onSave={saveNovoVeiculo} saving={savingVeiculo} label="Salvar Veículo" />
              </InlineForm>
            )}
            <LookupTable cols={colsVeiculos} rows={veiculos} onSelect={r => { upd('codVeic', r.codVeic); closeVeiculos() }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Estados do Veiculo */}
      {openEstadosV && (
        <Overlay onClose={closeEstadosV} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Estados" onClose={closeEstadosV}
              badge={!showNovoEstadoV && <BtnNovo onClick={() => setShowNovoEstadoV(true)} label="Novo Estado" />} />
            {showNovoEstadoV && (
              <InlineForm title="Novo Estado">
                <Inp label="Estado *" value={novoEstadoV.estado} onChange={v => updEV('estado', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <Inp label="UF *" value={novoEstadoV.uf} onChange={v => updEV('uf', v.toUpperCase())} maxLength={2} placeholder="" style={{ flex: '0 0 72px' }} />
                <LookupField label="País *" value={paisNoEstadoV} onSearch={() => { setShowNovoPaisV(false); setOpenPaisesV(true) }} />
                <CheckAtivo checked={novoEstadoV.ativo} onChange={v => updEV('ativo', v)} />
                <SaveRow onCancel={cancelEV} onSave={saveNovoEstadoV} saving={savingEstadoV} label="Salvar Estado" />
              </InlineForm>
            )}
            <LookupTable cols={colsEstados} rows={estados} onSelect={r => { updV('codEstado', r.codEstado); closeEstadosV() }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Paises do Veiculo */}
      {openPaisesV && (
        <Overlay onClose={closePaisesV} zIndex={80}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Países" onClose={closePaisesV}
              badge={!showNovoPaisV && <BtnNovo onClick={() => setShowNovoPaisV(true)} label="Novo País" />} />
            {showNovoPaisV && (
              <InlineForm title="Novo País">
                <Inp label="País *" value={novoPaisV.pais} onChange={v => updPV('pais', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <Inp label="Sigla" value={novoPaisV.sigla} onChange={v => updPV('sigla', v.toUpperCase())} maxLength={3} placeholder="" style={{ flex: '0 0 80px' }} />
                <Inp label="DDI" value={novoPaisV.ddi} onChange={v => updPV('ddi', v)} maxLength={6} placeholder="" style={{ flex: '0 0 80px' }} />
                <Inp label="Moeda" value={novoPaisV.moeda} onChange={v => updPV('moeda', v)} maxLength={10} placeholder="" style={{ flex: '1 1 120px' }} />
                <CheckAtivo checked={novoPaisV.ativo} onChange={v => updPV('ativo', v)} />
                <SaveRow onCancel={cancelPV} onSave={saveNovoPaisV} saving={savingPaisV} label="Salvar País" />
              </InlineForm>
            )}
            <LookupTable cols={colsPaises} rows={paises} onSelect={r => { updEV('codPais', r.codPais); closePaisesV() }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Marcas */}
      {openMarcas && (
        <Overlay onClose={closeMarcas} zIndex={70}>
          <ModalBox maxWidth={480}>
            <ModalHeader title="Consulta de Marcas" onClose={closeMarcas}
              badge={!showNovaMarca && <BtnNovo onClick={() => setShowNovaMarca(true)} label="Nova Marca" />} />
            {showNovaMarca && (
              <InlineForm title="Nova Marca">
                <Inp label="Marca *" value={novaMarca.marca} onChange={v => updM('marca', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <CheckAtivo checked={novaMarca.ativo} onChange={v => updM('ativo', v)} />
                <SaveRow onCancel={cancelM} onSave={saveNovaMarca} saving={savingMarca} label="Salvar Marca" />
              </InlineForm>
            )}
            <LookupTable cols={colsMarcas} rows={marcas} onSelect={r => { updV('codMarca', r.codMarca); closeMarcas() }} />
          </ModalBox>
        </Overlay>
      )}

      <ConfirmDialog open={!!confirm} name={confirm?.transportador} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}