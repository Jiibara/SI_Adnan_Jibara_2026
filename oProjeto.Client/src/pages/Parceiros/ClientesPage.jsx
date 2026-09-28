import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { clientesApi, cidadesApi, estadosApi, paisesApi, condicoesApi, formaPagamentosApi } from '@/services/api'
import { useModalGuard } from '@/hooks/useModalGuard'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s', appearance: 'none' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'

const maskDate = v => { const d = v.replace(/\D/g, '').slice(0, 8); if (d.length <= 2) return d; if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`; return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` }

const CIDADE_EMPTY = { cidade: '', ddd: '', codEstado: null, ativo: true }
const ESTADO_EMPTY = { estado: '', uf: '', codPais: null, ativo: true }
const PAIS_EMPTY = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }
const CONDICAO_EMPTY = { condicaoPagamento: '', numeroParcelas: 1, percentualJuros: 0, percentualMultas: 0, percentualDesconto: 0, ativo: true, parcelas: [] }
const FORMA_EMPTY = { formaPagamento: '', ativo: true }

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
  { key: 'codCliente', label: 'Cód.', mono: true },
  { key: 'cliente', label: 'Cliente' },
  { key: 'cpfCnpj', label: 'CPF / CNPJ' },
  { key: 'fone', label: 'Telefone' },
  { key: 'condicao', label: 'Cond. Pagamento', render: r => r.condicao?.condicaoPagamento ?? '' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]
const colsCidades = [{ key: 'codCidade', label: 'Cód.', mono: true }, { key: 'cidade', label: 'Cidade' }, { key: 'estado', label: 'UF', render: r => r.estado?.uf ?? '' }]
const colsEstados = [{ key: 'codEstado', label: 'Cód.', mono: true }, { key: 'estado', label: 'Estado' }, { key: 'uf', label: 'UF' }, { key: 'pais', label: 'País', render: r => r.pais?.pais ?? '' }]
const colsPaises = [{ key: 'codPais', label: 'Cód.', mono: true }, { key: 'pais', label: 'País' }, { key: 'sigla', label: 'Sigla' }, { key: 'ddi', label: 'DDI' }]
const colsFormas = [{ key: 'codFormaPagamento', label: 'Cód.', mono: true }, { key: 'formaPagamento', label: 'Forma de Pagamento' }]

export default function ClientesPage() {
  const { data, loading, load } = useCrud(clientesApi)
  const [form, setForm] = useState({})
  const [originalForm, setOriginalForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [cidades, setCidades] = useState([])
  const [estados, setEstados] = useState([])
  const [paises, setPaises] = useState([])
  const [condicoes, setCondicoes] = useState([])
  const [formas, setFormas] = useState([])

  const [openCidades, setOpenCidades] = useState(false)
  const [openEstados, setOpenEstados] = useState(false)
  const [openPaises, setOpenPaises] = useState(false)
  const [openCondicao, setOpenCondicao] = useState(false)
  const [openFormas, setOpenFormas] = useState(false)
  const [parcelaFormaIdx, setParcelaFormaIdx] = useState(null)  

  const [novaCidade, setNovaCidade] = useState(CIDADE_EMPTY)
  const [showNovaCidade, setShowNovaCidade] = useState(false)
  const [savingCidade, setSavingCidade] = useState(false)

  const [novoEstado, setNovoEstado] = useState(ESTADO_EMPTY)
  const [showNovoEstado, setShowNovoEstado] = useState(false)
  const [savingEstado, setSavingEstado] = useState(false)

  const [novoPais, setNovoPais] = useState(PAIS_EMPTY)
  const [showNovoPais, setShowNovoPais] = useState(false)
  const [savingPais, setSavingPais] = useState(false)

  const [condicaoForm, setCondicaoForm] = useState(CONDICAO_EMPTY)
  const [condicaoEditing, setCondicaoEditing] = useState(false)
  const [showNovaCondicao, setShowNovaCondicao] = useState(false)
  const [numParcelasInput, setNumParcelasInput] = useState('1')
  const [savingCondicao, setSavingCondicao] = useState(false)

  const [novaForma, setNovaForma] = useState(FORMA_EMPTY)
  const [showNovaForma, setShowNovaForma] = useState(false)
  const [savingForma, setSavingForma] = useState(false)

  const loadCidades = async () => setCidades(await cidadesApi.getAll())
  const loadEstados = async () => setEstados(await estadosApi.getAll())
  const loadPaises = async () => setPaises(await paisesApi.getAll())
  const loadCondicoes = async () => setCondicoes(await condicoesApi.getAll())
  const loadFormas = async () => setFormas(await formaPagamentosApi.getAll())

  useEffect(() => { loadCidades(); loadEstados(); loadPaises(); loadCondicoes(); loadFormas() }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updC = (k, v) => setNovaCidade(p => ({ ...p, [k]: v }))
  const updE = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updP = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))
  const updK = (k, v) => setCondicaoForm(p => ({ ...p, [k]: v }))
  const updF = (k, v) => setNovaForma(p => ({ ...p, [k]: v }))

  const gerarParcelas = n => {
    const qtd = parseInt(n) || 0
    if (qtd < 1) return
    setCondicaoForm(p => {
      const antigas = p.parcelas ?? []
      const base = parseFloat((100 / qtd).toFixed(2))
      const ajuste = parseFloat((100 - base * (qtd - 1)).toFixed(2))
      const novas = Array.from({ length: qtd }, (_, i) => ({
        parcela: i + 1, percentual: String(i === qtd - 1 ? ajuste : base),
        dias: antigas[i]?.dias ?? (i + 1) * 30, codFormaPagamento: antigas[i]?.codFormaPagamento ?? '',
      }))
      return { ...p, numeroParcelas: qtd, parcelas: novas }
    })
  }
  const updParcela = (i, k, v) => setCondicaoForm(p => ({ ...p, parcelas: p.parcelas.map((x, idx) => idx === i ? { ...x, [k]: v } : x) }))
  const diasForaDeOrdem = (condicaoForm.parcelas ?? []).some((p, i, arr) => i > 0 && parseInt(p.dias) <= parseInt(arr[i - 1].dias))
  const totalPercentual = (condicaoForm.parcelas ?? []).reduce((s, p) => s + (parseFloat(p.percentual) || 0), 0)
  const totalOk = Math.abs(totalPercentual - 100) < 0.01

  const save = async () => {
    try {
      const toISO = v => { if (!v || !v.includes('/')) return v || null; const [dd, mm, yyyy] = v.split('/'); return yyyy ? `${yyyy}-${mm}-${dd}` : null }
      const payload = { ...form, dataNascimento: toISO(form.dataNascimento) }
      editing ? await clientesApi.update(payload.codCliente, payload) : await clientesApi.create(payload)
      toast.success('Cliente salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar cliente.') }
  }
  const del = async () => {
    try { await clientesApi.delete(confirm.codCliente); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  const mkSave = (api, payload, check, errMsg, afterSave, setSaving, setShow, reset) => async () => {
    if (!check()) { toast.error(errMsg); return }
    setSaving(true)
    try { await api.create(payload); toast.success('Cadastrado!'); await afterSave(); setShow(false); reset() }
    catch { toast.error('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  const saveNovaCidade = mkSave(cidadesApi, novaCidade, () => novaCidade.cidade.trim(), 'Informe a cidade.', loadCidades, setSavingCidade, setShowNovaCidade, () => setNovaCidade(CIDADE_EMPTY))
  const saveNovoEstado = mkSave(estadosApi, novoEstado, () => novoEstado.estado.trim(), 'Informe o estado.', loadEstados, setSavingEstado, setShowNovoEstado, () => setNovoEstado(ESTADO_EMPTY))
  const saveNovoPais = mkSave(paisesApi, novoPais, () => novoPais.pais.trim(), 'Informe o país.', loadPaises, setSavingPais, setShowNovoPais, () => setNovoPais(PAIS_EMPTY))
  const saveNovaForma = mkSave(formaPagamentosApi, novaForma, () => novaForma.formaPagamento.trim(), 'Informe a forma.', loadFormas, setSavingForma, setShowNovaForma, () => setNovaForma(FORMA_EMPTY))

  const openCondicaoModal = async (row = null) => {
    await loadFormas(); setShowNovaCondicao(false)
    if (row) {
      setCondicaoForm({ ...row, parcelas: (row.parcelas ?? []).map((p, i) => ({ parcela: p.numeroParcela ?? i + 1, percentual: String(p.percentual ?? 0), dias: p.dias ?? (i + 1) * 30, codFormaPagamento: String(p.codFormaPagamento ?? '') })) })
      setNumParcelasInput(String(row.numeroParcelas ?? '')); setCondicaoEditing(true)
    } else {
      setCondicaoForm(CONDICAO_EMPTY); setNumParcelasInput('1'); setCondicaoEditing(false)
    }
    setOpenCondicao(true)
  }

  const saveCondicao = async () => {
    if (!totalOk) return toast.error(`Total dos percentuais é ${totalPercentual.toFixed(2)}%. Deve ser 100%.`)
    if (diasForaDeOrdem) return toast.error('Os dias das parcelas devem estar em ordem crescente.')
    if (!condicaoForm.condicaoPagamento?.trim()) return toast.error('Informe a condição de pagamento.')
    setSavingCondicao(true)
    try {
      const payload = { ...condicaoForm, parcelas: condicaoForm.parcelas.map(p => ({ numeroParcela: parseInt(p.parcela) || 0, percentual: parseFloat(p.percentual) || 0, dias: parseInt(p.dias) || 0, codFormaPagamento: parseInt(p.codFormaPagamento) || 0 })) }
      if (condicaoEditing) {
        await condicoesApi.update(condicaoForm.codCondicao, payload)
        toast.success('Condição salva!'); await loadCondicoes(); setCondicaoEditing(false); setCondicaoForm(CONDICAO_EMPTY)
      } else {
        const created = await condicoesApi.create(payload)
        const codNovo = created?.codCondicao ?? created?.id
        if (codNovo) upd('codCondicao', codNovo)
        toast.success('Condição salva!'); await loadCondicoes(); setShowNovaCondicao(false); setCondicaoForm(CONDICAO_EMPTY); setNumParcelasInput('1')
      }
    } catch { toast.error('Erro ao salvar condição.') }
    finally { setSavingCondicao(false) }
  }

  const cancelC = () => { setShowNovaCidade(false); setNovaCidade(CIDADE_EMPTY) }
  const cancelE = () => { setShowNovoEstado(false); setNovoEstado(ESTADO_EMPTY) }
  const cancelP = () => { setShowNovoPais(false); setNovoPais(PAIS_EMPTY) }
  const cancelF = () => { setShowNovaForma(false); setNovaForma(FORMA_EMPTY) }

  const closeCidades = () => { setOpenCidades(false); cancelC() }
  const closeEstados = () => { setOpenEstados(false); cancelE() }
  const closePaises = () => { setOpenPaises(false); cancelP() }
  const closeFormas = () => { setOpenFormas(false); setParcelaFormaIdx(null); cancelF() }
  const openFormasForParcela = (i) => { setParcelaFormaIdx(i); setShowNovaForma(false); setOpenFormas(true) }

  const estadoNaCidade = estados.find(e => e.codEstado === novaCidade.codEstado)
  const estadoLabel = estadoNaCidade ? `${estadoNaCidade.estado} - ${estadoNaCidade.uf}` : ''
  const paisNoEstado = paises.find(p => p.codPais === novoEstado.codPais)?.pais ?? ''
  const condicaoLabel = condicoes.find(c => c.codCondicao === form.codCondicao)?.condicaoPagamento ?? ''

  const formaLabelNaParcela = codFormaPagamento =>
    formas.find(f => String(f.codFormaPagamento) === String(codFormaPagamento))?.formaPagamento ?? ''

  const isPJ = form.tipoPessoa === 'J'
  const btnTipo = (tipo, label) => (
    <button type="button" onClick={() => upd('tipoPessoa', tipo)} style={{
      height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
      borderColor: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb' : '#e2e6ed',
      background: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#eff6ff' : '#fff',
      color: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb' : '#0f172a'
    }}>
      {label}
    </button>
  )

  const colsCondicoes = [
    { key: 'codCondicao',       label: 'Cód.',    mono: true },
    { key: 'condicaoPagamento', label: 'Condição' },
    { key: 'numeroParcelas',    label: 'Parcelas' },
  ]

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const anySubOpen = openCidades || openEstados || openPaises || openCondicao || openFormas
  const { confirming, attemptClose, confirmClose, cancelClose } = useModalGuard({
    isOpen: open,
    isDirty,
    onClose: () => setOpen(false),
    onSave: save,
    paused: anySubOpen,
  })

  const abrirNovo = () => {
    const f = { tipoPessoa: 'F', ativo: true, limiteCredito: 0, numero: 0 }
    setForm(f); setOriginalForm(f); setEditing(false); setOpen(true)
  }

  const abrirEdicao = (r) => {
    setForm(r); setOriginalForm(r); setEditing(true); setOpen(true)
  }

  return (
    <div>
      <PageHeader title="Clientes" sub="Consulta de Clientes" label="Novo Cliente"
        onNew={abrirNovo} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicao}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Cliente' : 'Novo Cliente'} editing={editing} onClose={attemptClose} onSave={save}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <label style={lbl}>Tipo Pessoa</label>
              <div style={{ display: 'flex', gap: 8 }}>{btnTipo('F', 'Pessoa Física')}{btnTipo('J', 'Pessoa Jurídica')}</div>
            </div>
            <CheckAtivo checked={form.ativo ?? true} onChange={v => upd('ativo', v)} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {editing && <div style={{ flex: '0 0 80px' }}><FField label="Código" disabled value={String(form.codCliente ?? '')} onChange={() => { }} /></div>}
            <div style={{ flex: '1 1 300px' }}><FField label="Cliente" required value={form.cliente ?? ''} onChange={v => upd('cliente', v)} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label={isPJ ? 'Nome Fantasia' : 'Apelido'} value={form.apelido ?? ''} onChange={v => upd('apelido', v)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}><FField label={isPJ ? 'CNPJ' : 'CPF'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label={isPJ ? 'Inscrição Estadual' : 'RG'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} /></div>
            <div style={{ flex: '1 1 100px' }}><FField label="Sexo (M/F)" value={form.sexo ?? ''} onChange={v => upd('sexo', v)} /></div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={lbl}>Data de Nascimento</label>
              <input type="text" placeholder="DD/MM/AAAA" value={form.dataNascimento ?? ''} onChange={e => upd('dataNascimento', maskDate(e.target.value))} style={inp} onFocus={fo} onBlur={bl} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}><FField label="Telefone" value={form.fone ?? ''} onChange={v => upd('fone', v)} /></div>
            <div style={{ flex: '2 1 300px' }}><FField label="E-mail" value={form.email ?? ''} onChange={v => upd('email', v)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 130px' }}><FField label="CEP" value={form.cep ?? ''} onChange={v => upd('cep', v)} /></div>
            <div style={{ flex: '3 1 350px' }}><FField label="Endereço" value={form.endereco ?? ''} onChange={v => upd('endereco', v)} /></div>
            <div style={{ flex: '1 1 90px' }}><FField label="Número" type="number" value={form.numero ?? ''} onChange={v => upd('numero', v === '' ? '' : Number(v))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}><FField label="Bairro" value={form.bairro ?? ''} onChange={v => upd('bairro', v)} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label="Complemento" value={form.complemento ?? ''} onChange={v => upd('complemento', v)} /></div>
            <LookupField label="Cidade *" value={form.cidade?.cidade ?? ''} onSearch={() => { setShowNovaCidade(false); setOpenCidades(true) }} style={{ flex: '1 1 250px' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <LookupField label="Condição de Pagamento *" value={condicaoLabel} onSearch={() => openCondicaoModal()} style={{ flex: '2 1 300px' }} />
            <div style={{ flex: '1 1 180px' }}><FField label="Limite de Crédito (R$)" type="number" value={form.limiteCredito ?? ''} onChange={v => upd('limiteCredito', v === '' ? '' : Number(v))} /></div>
          </div>
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

      {/* Condição de Pagamento  */}
      {openCondicao && (
        <Overlay onClose={() => setOpenCondicao(false)} zIndex={60}>
          <ModalBox maxWidth={860}>
            <ModalHeader
              title={condicaoEditing ? 'Editar Condição de Pagamento' : 'Consulta / Nova Condição'}
              onClose={() => setOpenCondicao(false)}
              badge={
                condicaoEditing
                  ? <Badge editing />
                  : (!showNovaCondicao && <BtnNovo onClick={() => { setCondicaoForm(CONDICAO_EMPTY); setNumParcelasInput('1'); setShowNovaCondicao(true) }} label="Nova Condição" />)
              }
            />

            {!condicaoEditing && (
              <>
                {showNovaCondicao && <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 280px' }}>
                      <FField label="Condição de Pagamento" required value={condicaoForm.condicaoPagamento ?? ''} onChange={v => updK('condicaoPagamento', v)} />
                    </div>
                    <div style={{ flex: '0 0 120px' }}>
                      <label style={lbl}>Nº de Parcelas</label>
                      <input type="number" min={1} value={numParcelasInput} style={inp}
                        onChange={e => { setNumParcelasInput(e.target.value); if (e.target.value !== '') gerarParcelas(e.target.value) }}
                        onFocus={fo} onBlur={bl} />
                    </div>
                    <div style={{ flex: '0 0 90px', display: 'flex', alignItems: 'center', height: 38, marginBottom: 1 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a', userSelect: 'none' }}>
                        <input type="checkbox" checked={condicaoForm.ativo ?? true} onChange={e => updK('ativo', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                        Ativo
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {[['Desconto %', 'percentualDesconto'], ['Multa %', 'percentualMultas'], ['Juros %', 'percentualJuros']].map(([label, key]) => (
                      <div key={key} style={{ flex: '1 1 130px', maxWidth: 160 }}>
                        <label style={lbl}>{label}</label>
                        <input type="number" step="0.01" value={condicaoForm[key] ?? ''} style={inp}
                          onChange={e => updK(key, e.target.value === '' ? '' : parseFloat(e.target.value))}
                          onFocus={fo} onBlur={bl} />
                      </div>
                    ))}
                  </div>

                  {(condicaoForm.parcelas ?? []).length > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={lbl}>Parcelas</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {diasForaDeOrdem && <span style={{ fontSize: 11, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>⚠ Dias fora de ordem crescente</span>}
                          {!totalOk && <span style={{ fontSize: 11, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>⚠ Total: {totalPercentual.toFixed(2)}% (deve ser 100%)</span>}
                        </div>
                      </div>
                      <div style={{ border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                              {['Parcela', 'Percentual (%)', 'Dias', 'Forma de Pagamento'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {condicaoForm.parcelas.map((p, i) => {
                              const diasInvalido = i > 0 && parseInt(p.dias) <= parseInt(condicaoForm.parcelas[i - 1].dias)
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <td style={{ padding: '8px 14px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{p.parcela}</td>
                                  <td style={{ padding: '6px 14px' }}>
                                    <input type="text" inputMode="decimal" value={p.percentual}
                                      style={{ ...inp, width: 100, textAlign: 'right' }}
                                      onChange={e => updParcela(i, 'percentual', e.target.value)}
                                      onFocus={fo} onBlur={bl} />
                                  </td>
                                  <td style={{ padding: '6px 14px' }}>
                                    <input type="number" value={p.dias}
                                      style={{ ...inp, width: 80, textAlign: 'right', borderColor: diasInvalido ? '#ef4444' : '#e2e6ed' }}
                                      onChange={e => updParcela(i, 'dias', e.target.value)}
                                      onFocus={fo}
                                      onBlur={e => { if (!diasInvalido) bl(e) }} />
                                  </td>
                                  <td style={{ padding: '6px 14px' }}>
                                    <LookupField
                                      value={formas.find(f => String(f.codFormaPagamento) === String(p.codFormaPagamento))?.formaPagamento ?? ''}
                                      onSearch={() => openFormasForParcela(i)}
                                      style={{}} />
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <BtnSecondary onClick={() => { setShowNovaCondicao(false); setCondicaoForm(CONDICAO_EMPTY); setNumParcelasInput('1') }}>Cancelar</BtnSecondary>
                    <BtnPrimary onClick={saveCondicao} disabled={savingCondicao}>
                      {savingCondicao ? 'Salvando...' : 'Salvar Nova Condição'}
                    </BtnPrimary>
                  </div>
                </div>}

                <div style={{ padding: '12px 24px 8px', borderBottom: '1px solid #e2e6ed' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace' }}>
                    Condições Cadastradas
                  </span>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginTop: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                            {colsCondicoes.map(c => (
                              <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>{c.label}</th>
                            ))}
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {condicoes.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              {colsCondicoes.map(c => (
                                <td key={c.key} style={{ padding: '11px 14px', color: '#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                                  {c.render ? c.render(row) : String(row[c.key] ?? '')}
                                </td>
                              ))}
                              <td style={{ padding: '11px 14px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => openCondicaoModal(row)}
                                  style={{ padding: '4px 10px', border: '1px solid #e2e6ed', borderRadius: 6, background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#475569' }}>
                                  Editar
                                </button>
                                <button onClick={() => {
                                  upd('codCondicao', row.codCondicao)
                                  setOpenCondicao(false)
                                }}
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
              </>
            )}

            {condicaoEditing && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 70px' }}>
                    <FField label="Código" value={String(condicaoForm.codCondicao ?? '')} onChange={() => { }} />
                  </div>
                  <div style={{ flex: '1 1 280px' }}>
                    <FField label="Condição de Pagamento" required value={condicaoForm.condicaoPagamento ?? ''} onChange={v => updK('condicaoPagamento', v)} />
                  </div>
                  <div style={{ flex: '0 0 120px' }}>
                    <label style={lbl}>Nº de Parcelas</label>
                    <input type="number" min={1} value={numParcelasInput} style={inp}
                      onChange={e => { setNumParcelasInput(e.target.value); if (e.target.value !== '') gerarParcelas(e.target.value) }}
                      onFocus={fo} onBlur={bl} />
                  </div>
                  <div style={{ flex: '0 0 90px', display: 'flex', alignItems: 'center', height: 38, marginBottom: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a', userSelect: 'none' }}>
                      <input type="checkbox" checked={condicaoForm.ativo ?? true} onChange={e => updK('ativo', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      Ativo
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {[['Desconto %', 'percentualDesconto'], ['Multa %', 'percentualMultas'], ['Juros %', 'percentualJuros']].map(([label, key]) => (
                    <div key={key} style={{ flex: '1 1 130px', maxWidth: 160 }}>
                      <label style={lbl}>{label}</label>
                      <input type="number" step="0.01" value={condicaoForm[key] ?? ''} style={inp}
                        onChange={e => updK(key, e.target.value === '' ? '' : parseFloat(e.target.value))}
                        onFocus={fo} onBlur={bl} />
                    </div>
                  ))}
                </div>

                {(condicaoForm.parcelas ?? []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={lbl}>Parcelas</label>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {diasForaDeOrdem && <span style={{ fontSize: 11, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>⚠ Dias fora de ordem crescente</span>}
                        {!totalOk && <span style={{ fontSize: 11, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>⚠ Total: {totalPercentual.toFixed(2)}% (deve ser 100%)</span>}
                      </div>
                    </div>
                    <div style={{ border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                            {['Parcela', 'Percentual (%)', 'Dias', 'Forma de Pagamento'].map(h => (
                              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {condicaoForm.parcelas.map((p, i) => {
                            const diasInvalido = i > 0 && parseInt(p.dias) <= parseInt(condicaoForm.parcelas[i - 1].dias)
                            return (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding: '8px 14px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{p.parcela}</td>
                                <td style={{ padding: '6px 14px' }}>
                                  <input type="text" inputMode="decimal" value={p.percentual}
                                    style={{ ...inp, width: 100, textAlign: 'right' }}
                                    onChange={e => updParcela(i, 'percentual', e.target.value)}
                                    onFocus={fo} onBlur={bl} />
                                </td>
                                <td style={{ padding: '6px 14px' }}>
                                  <input type="number" value={p.dias}
                                    style={{ ...inp, width: 80, textAlign: 'right', borderColor: diasInvalido ? '#ef4444' : '#e2e6ed' }}
                                    onChange={e => updParcela(i, 'dias', e.target.value)}
                                    onFocus={fo}
                                    onBlur={e => { if (!diasInvalido) bl(e) }} />
                                </td>
                                <td style={{ padding: '6px 14px' }}>
                                  <LookupField
                                    value={formas.find(f => String(f.codFormaPagamento) === String(p.codFormaPagamento))?.formaPagamento ?? ''}
                                    onSearch={() => openFormasForParcela(i)}
                                    style={{}} />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                  <BtnSecondary onClick={() => { setCondicaoEditing(false); setCondicaoForm(CONDICAO_EMPTY) }}>Cancelar</BtnSecondary>
                  <BtnPrimary onClick={saveCondicao} disabled={savingCondicao}>
                    {savingCondicao ? 'Salvando...' : 'Salvar Condição'}
                  </BtnPrimary>
                </div>
              </div>
            )}
          </ModalBox>
        </Overlay>
      )}

      {/* Formas de Pagamento */}
      {openFormas && (
        <Overlay onClose={closeFormas} zIndex={70}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Formas de Pagamento" onClose={closeFormas}
              badge={!showNovaForma && <BtnNovo onClick={() => setShowNovaForma(true)} label="Nova Forma" />} />
            {showNovaForma && (
              <InlineForm title="Nova Forma de Pagamento">
                <Inp label="Forma *" value={novaForma.formaPagamento} onChange={v => updF('formaPagamento', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <CheckAtivo checked={novaForma.ativo} onChange={v => updF('ativo', v)} />
                <SaveRow onCancel={cancelF} onSave={saveNovaForma} saving={savingForma} label="Salvar Forma" />
              </InlineForm>
            )}
            <LookupTable cols={colsFormas} rows={formas.filter(f => f.ativo)} onSelect={r => {
              if (parcelaFormaIdx !== null) updParcela(parcelaFormaIdx, 'codFormaPagamento', String(r.codFormaPagamento))
              closeFormas()
            }} />
          </ModalBox>
        </Overlay>
      )}

      {openCidades && (
        <Overlay onClose={closeCidades} zIndex={60}>
          <ModalBox maxWidth={640}>
            <ModalHeader title="Consulta de Cidades" onClose={closeCidades}
              badge={!showNovaCidade && <BtnNovo onClick={() => setShowNovaCidade(true)} label="Nova Cidade" />} />
            {showNovaCidade && (
              <InlineForm title="Nova Cidade">
                <Inp label="Cidade *" value={novaCidade.cidade} onChange={v => updC('cidade', v)} style={{ flex: '1 1 200px' }} />
                <Inp label="DDD" value={novaCidade.ddd} onChange={v => updC('ddd', v)} maxLength={3} style={{ flex: '0 0 72px' }} />
                <LookupField label="Estado *" value={estadoLabel} onSearch={() => { setShowNovoEstado(false); setOpenEstados(true) }} />
                <CheckAtivo checked={novaCidade.ativo} onChange={v => updC('ativo', v)} />
                <SaveRow onCancel={cancelC} onSave={saveNovaCidade} saving={savingCidade} label="Salvar Cidade" />
              </InlineForm>
            )}
            <LookupTable cols={colsCidades} rows={cidades} onSelect={r => { setForm(f => ({ ...f, codCidade: r.codCidade, cidade: r })); setOpenCidades(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {openEstados && (
        <Overlay onClose={closeEstados} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Estados" onClose={closeEstados}
              badge={!showNovoEstado && <BtnNovo onClick={() => setShowNovoEstado(true)} label="Novo Estado" />} />
            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp label="Estado *" value={novoEstado.estado} onChange={v => updE('estado', v)} style={{ flex: '1 1 200px' }} />
                <Inp label="UF *" value={novoEstado.uf} onChange={v => updE('uf', v.toUpperCase())} maxLength={2} style={{ flex: '0 0 72px' }} />
                <LookupField label="País *" value={paisNoEstado} onSearch={() => { setShowNovoPais(false); setOpenPaises(true) }} />
                <CheckAtivo checked={novoEstado.ativo} onChange={v => updE('ativo', v)} />
                <SaveRow onCancel={cancelE} onSave={saveNovoEstado} saving={savingEstado} label="Salvar Estado" />
              </InlineForm>
            )}
            <LookupTable cols={colsEstados} rows={estados} onSelect={r => { updC('codEstado', r.codEstado); setOpenEstados(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {openPaises && (
        <Overlay onClose={closePaises} zIndex={80}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Países" onClose={closePaises}
              badge={!showNovoPais && <BtnNovo onClick={() => setShowNovoPais(true)} label="Novo País" />} />
            {showNovoPais && (
              <InlineForm title="Novo País">
                <Inp label="País *" value={novoPais.pais} onChange={v => updP('pais', v)} style={{ flex: '1 1 200px' }} />
                <Inp label="Sigla" value={novoPais.sigla} onChange={v => updP('sigla', v.toUpperCase())} maxLength={3} style={{ flex: '0 0 80px' }} />
                <Inp label="DDI" value={novoPais.ddi} onChange={v => updP('ddi', v)} maxLength={6} style={{ flex: '0 0 80px' }} />
                <Inp label="Moeda" value={novoPais.moeda} onChange={v => updP('moeda', v)} maxLength={10} style={{ flex: '1 1 120px' }} />
                <CheckAtivo checked={novoPais.ativo} onChange={v => updP('ativo', v)} />
                <SaveRow onCancel={cancelP} onSave={saveNovoPais} saving={savingPais} label="Salvar País" />
              </InlineForm>
            )}
            <LookupTable cols={colsPaises} rows={paises} onSelect={r => { updE('codPais', r.codPais); setOpenPaises(false) }} />
          </ModalBox>
        </Overlay>
      )}

      <ConfirmDialog open={!!confirm} name={confirm?.cliente} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}