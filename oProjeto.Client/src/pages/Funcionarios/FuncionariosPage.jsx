import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { funcionariosApi, funcoesApi, cidadesApi, estadosApi, paisesApi } from '@/services/api'
import { useModalGuard } from '@/hooks/useModalGuard'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'

const maskDate = v => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

const ModalBox = ({ children, maxWidth = 680 }) => (
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

const CheckAtivo = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
    Ativo
  </label>
)

const LookupField = ({ label, value, onSearch, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="text" readOnly value={value} style={{ ...inp, flex: 1 }} />
      <button type="button" onClick={onSearch}
        style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
        Pesquisar
      </button>
    </div>
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
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</span>
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

const colsCidades  = [
  { key: 'codCidade', label: 'Cód.', mono: true },
  { key: 'cidade',    label: 'Cidade' },
  { key: 'ddd',       label: 'DDD' },
  { key: 'estado',    label: 'Estado', render: r => r.estado?.uf ?? '' },
]
const colsEstados  = [
  { key: 'codEstado', label: 'Cód.', mono: true },
  { key: 'estado',    label: 'Estado' },
  { key: 'uf',        label: 'UF' },
  { key: 'pais',      label: 'País', render: r => r.pais?.pais ?? '' },
]
const colsPaises   = [
  { key: 'codPais', label: 'Cód.', mono: true },
  { key: 'pais',    label: 'País' },
  { key: 'sigla',   label: 'Sigla' },
  { key: 'ddi',     label: 'DDI' },
  { key: 'moeda',   label: 'Moeda' },
]
const colsFuncoes  = [
  { key: 'codFuncao', label: 'Cód.', mono: true },
  { key: 'funcao',    label: 'Função / Cargo' },
]

const CIDADE_EMPTY = { cidade: '', ddd: '', codEstado: null, ativo: true }
const ESTADO_EMPTY = { estado: '', uf: '', codPais: null, ativo: true }
const PAIS_EMPTY   = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }
const FUNCAO_EMPTY = { funcao: '', ativo: true }

export default function FuncionariosPage() {
  const { data, loading, load } = useCrud(funcionariosApi)
  const [funcoes,  setFuncoes]  = useState([])
  const [cidades,  setCidades]  = useState([])
  const [estados,  setEstados]  = useState([])
  const [paises,   setPaises]   = useState([])
  const [form,     setForm]     = useState({})
  const [originalForm, setOriginalForm] = useState({}) 
  const [editing,  setEditing]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [confirm,  setConfirm]  = useState(null)

  const [openCidades,     setOpenCidades]     = useState(false)
  const [showNovaCidade,  setShowNovaCidade]  = useState(false)
  const [novaCidade,      setNovaCidade]      = useState(CIDADE_EMPTY)
  const [savingCidade,    setSavingCidade]    = useState(false)

  const [openEstados,     setOpenEstados]     = useState(false)
  const [showNovoEstado,  setShowNovoEstado]  = useState(false)
  const [novoEstado,      setNovoEstado]      = useState(ESTADO_EMPTY)
  const [savingEstado,    setSavingEstado]    = useState(false)

  const [openPaises,      setOpenPaises]      = useState(false)
  const [showNovoPais,    setShowNovoPais]    = useState(false)
  const [novoPais,        setNovoPais]        = useState(PAIS_EMPTY)
  const [savingPais,      setSavingPais]      = useState(false)

  const [openFuncoes,     setOpenFuncoes]     = useState(false)
  const [showNovaFuncao,  setShowNovaFuncao]  = useState(false)
  const [novaFuncao,      setNovaFuncao]      = useState(FUNCAO_EMPTY)
  const [savingFuncao,    setSavingFuncao]    = useState(false)

  const loadFuncoes  = async () => setFuncoes((await funcoesApi.getAll())?.data ?? await funcoesApi.getAll() ?? [])
  const loadCidades  = async () => setCidades((await cidadesApi.getAll())?.data ?? await cidadesApi.getAll() ?? [])
  const loadEstados  = async () => setEstados(await estadosApi.getAll())
  const loadPaises   = async () => setPaises(await paisesApi.getAll())

  useEffect(() => { loadFuncoes(); loadCidades(); loadEstados(); loadPaises() }, [])

  const upd  = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updC = (k, v) => setNovaCidade(p => ({ ...p, [k]: v }))
  const updE = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updP = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))
  const updF = (k, v) => setNovaFuncao(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      const toISO = v => {
        if (!v || !v.includes('/')) return v || null
        const [dd, mm, yyyy] = v.split('/')
        return yyyy ? `${yyyy}-${mm}-${dd}` : null
      }
      const payload = {
        ...form,
        dataNascimento: toISO(form.dataNascimento),
        dataAdmissao:   toISO(form.dataAdmissao),
        dataDemissao:   toISO(form.dataDemissao),
      }
      editing
        ? await funcionariosApi.update(payload.codFunc, payload)
        : await funcionariosApi.create(payload)
      toast.success('Funcionário salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar funcionário.') }
  }

  const del = async () => {
    try { await funcionariosApi.delete(confirm.codFunc); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  const saveNovaCidade = async () => {
    if (!novaCidade.cidade.trim()) { toast.error('Informe a cidade.'); return }
    setSavingCidade(true)
    try { await cidadesApi.create(novaCidade); toast.success('Cidade cadastrada!'); await loadCidades(); setShowNovaCidade(false); setNovaCidade(CIDADE_EMPTY) }
    catch { toast.error('Erro ao salvar cidade.') }
    finally { setSavingCidade(false) }
  }

  const saveNovoEstado = async () => {
    if (!novoEstado.estado.trim()) { toast.error('Informe o estado.'); return }
    setSavingEstado(true)
    try { await estadosApi.create(novoEstado); toast.success('Estado cadastrado!'); await loadEstados(); setShowNovoEstado(false); setNovoEstado(ESTADO_EMPTY) }
    catch { toast.error('Erro ao salvar estado.') }
    finally { setSavingEstado(false) }
  }

  const saveNovoPais = async () => {
    if (!novoPais.pais.trim()) { toast.error('Informe o país.'); return }
    setSavingPais(true)
    try { await paisesApi.create(novoPais); toast.success('País cadastrado!'); await loadPaises(); setShowNovoPais(false); setNovoPais(PAIS_EMPTY) }
    catch { toast.error('Erro ao salvar país.') }
    finally { setSavingPais(false) }
  }

  const saveNovaFuncao = async () => {
    if (!novaFuncao.funcao.trim()) { toast.error('Informe a função.'); return }
    setSavingFuncao(true)
    try { await funcoesApi.create(novaFuncao); toast.success('Função cadastrada!'); await loadFuncoes(); setShowNovaFuncao(false); setNovaFuncao(FUNCAO_EMPTY) }
    catch { toast.error('Erro ao salvar função.') }
    finally { setSavingFuncao(false) }
  }

  const cancelC = () => { setShowNovaCidade(false);  setNovaCidade(CIDADE_EMPTY) }
  const cancelE = () => { setShowNovoEstado(false);  setNovoEstado(ESTADO_EMPTY) }
  const cancelP = () => { setShowNovoPais(false);    setNovoPais(PAIS_EMPTY) }
  const cancelF = () => { setShowNovaFuncao(false);  setNovaFuncao(FUNCAO_EMPTY) }

  const closeCidades = () => { setOpenCidades(false); cancelC() }
  const closeEstados = () => { setOpenEstados(false); cancelE() }
  const closePaises  = () => { setOpenPaises(false);  cancelP() }
  const closeFuncoes = () => { setOpenFuncoes(false); cancelF() }

  const cidadeLabel   = cidades.find(c => c.codCidade === form.codCidade)?.cidade ?? ''
  const funcaoLabel   = funcoes?.find?.(f => f.codFuncao === form.codFuncao)?.funcao ?? ''
  const estadoNaCidade = estados.find(e => e.codEstado === novaCidade.codEstado)
  const estadoLabelC   = estadoNaCidade ? `${estadoNaCidade.estado} - ${estadoNaCidade.uf}` : ''
  const paisNoEstado   = paises.find(p => p.codPais === novoEstado.codPais)?.pais ?? ''

  const cols = [
    { key: 'codFunc',     label: 'Cód.',      mono: true },
    { key: 'funcionario', label: 'Funcionário' },
    { key: 'fone',        label: 'Telefone' },
    { key: 'email',       label: 'E-mail' },
    { key: 'funcao',      label: 'Função', render: r => r.funcao?.funcao ?? r.funcao?.descricao ?? '' },
    { key: 'ativo',       label: 'Ativo',  render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  const F = (label, key, type = 'text') => (
    <FField label={label} type={type} step={type === 'number' ? '0.01' : undefined}
      value={form[key] ?? ''}
      onChange={v => upd(key, type === 'number' ? (v === '' ? '' : Number(v)) : v)} />
  )

  const FDate = (label, key) => (
    <div style={{ flex: '1 1 180px' }}>
      <label style={lbl}>{label}</label>
      <input type="text" placeholder="DD/MM/AAAA" value={form[key] ?? ''}
        onChange={e => upd(key, maskDate(e.target.value))}
        style={inp} onFocus={fo} onBlur={bl} />
    </div>
  )

  const btnTipo = (tipo, label) => (
    <button type="button" onClick={() => upd('tipoPessoa', tipo)} style={{
      height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s ease',
      borderColor: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb' : '#e2e6ed',
      background:  (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#eff6ff'  : '#fff',
      color:       (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb'  : '#0f172a',
    }}>
      {label}
    </button>
  )

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const anyLookupOpen = openCidades || openEstados || openPaises || openFuncoes
  const descartar = () => setForm(originalForm)

  const { confirming, attemptClose, confirmClose, cancelClose } = useModalGuard({
    isOpen: open,
    isDirty,
    onClose: () => setOpen(false),
    onSave: save,
    onDiscard: descartar,
    paused: anyLookupOpen,
  })

  const abrirNovo = () => {
    const f = { tipoPessoa: 'F', ativo: true, salario: 0, numero: 0 }
    setForm(f); setOriginalForm(f); setEditing(false); setOpen(true)
  }

  const abrirEdicao = (r) => {
    setForm(r); setOriginalForm(r); setEditing(true); setOpen(true)
  }

  return (
    <div>
      <PageHeader title="Funcionários" sub="Consulta de Funcionários" label="Novo Funcionário"
        onNew={abrirNovo} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicao}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Funcionário' : 'Novo Funcionário'} editing={editing}
        onClose={attemptClose} onSave={confirming ? undefined : save}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <label style={lbl}>Tipo Pessoa</label>
              <div style={{ display: 'flex', gap: 8 }}>{btnTipo('F', 'Pessoa Física')}{btnTipo('J', 'Pessoa Jurídica')}</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width: 16, height: 16 }} />
              Ativo
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {editing && <div style={{ flex: '0 0 80px' }}><FField label="Código" disabled value={String(form.codFunc ?? '')} onChange={() => {}} /></div>}
            <div style={{ flex: '1 1 300px' }}><FField label="Funcionário" required value={form.funcionario ?? ''} onChange={v => upd('funcionario', v)} /></div>
            <div style={{ flex: '1 1 180px' }}><FField label={form.tipoPessoa === 'J' ? 'Nome Fantasia' : 'Apelido'} value={form.apelido ?? ''} onChange={v => upd('apelido', v)} /></div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}><FField label={form.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label={form.tipoPessoa === 'J' ? 'Inscrição Estadual' : 'RG'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} /></div>
            <div style={{ flex: '1 1 100px' }}>{F('Sexo (M/F)', 'sexo')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>{F('Telefone / Celular', 'fone')}</div>
            <div style={{ flex: '2 1 300px' }}>{F('E-mail', 'email')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>{F('CEP', 'cep')}</div>
            <div style={{ flex: '3 1 350px' }}>{F('Endereço', 'endereco')}</div>
            <div style={{ flex: '1 1 90px' }}>{F('Número', 'numero', 'number')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>{F('Bairro', 'bairro')}</div>
            <div style={{ flex: '1 1 180px' }}>{F('Complemento', 'complemento')}</div>
            <LookupField label="Cidade" value={cidadeLabel}
              onSearch={() => { setShowNovaCidade(false); setOpenCidades(true) }}
              style={{ flex: '1 1 240px' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <LookupField label="Função / Cargo" value={funcaoLabel}
              onSearch={() => { setShowNovaFuncao(false); setOpenFuncoes(true) }}
              style={{ flex: '2 1 300px' }} />
            <div style={{ flex: '1 1 180px' }}>{F('Salário Base (R$)', 'salario', 'number')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {FDate('Data de Nascimento', 'dataNascimento')}
            {FDate('Data de Admissão',   'dataAdmissao')}
            {FDate('Data de Demissão',   'dataDemissao')}
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
      {/* Cidades */ }
      {openCidades && (
        <Overlay onClose={closeCidades} zIndex={60}>
          <ModalBox maxWidth={720}>
            <ModalHeader title="Consulta de Cidades" onClose={closeCidades}
              badge={!showNovaCidade && <BtnNovo onClick={() => setShowNovaCidade(true)} label="Nova Cidade" />} />

            {showNovaCidade && (
              <InlineForm title="Nova Cidade">
                <Inp label="Cidade *" value={novaCidade.cidade} onChange={v => updC('cidade', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <Inp label="DDD" value={novaCidade.ddd} onChange={v => updC('ddd', v)} maxLength={3} placeholder="" style={{ flex: '0 0 72px' }} />
                <LookupField label="Estado *" value={estadoLabelC}
                  onSearch={() => { setShowNovoEstado(false); setOpenEstados(true) }}
                  style={{ flex: '1 1 200px' }} />
                <CheckAtivo checked={novaCidade.ativo} onChange={v => updC('ativo', v)} />
                <SaveRow onCancel={cancelC} onSave={saveNovaCidade} saving={savingCidade} label="Salvar Cidade" />
              </InlineForm>
            )}

            <LookupTable cols={colsCidades} rows={cidades}
              onSelect={r => { upd('codCidade', r.codCidade); setOpenCidades(false) }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Estados */ }
      {openEstados && (
        <Overlay onClose={closeEstados} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Estados" onClose={closeEstados}
              badge={!showNovoEstado && <BtnNovo onClick={() => setShowNovoEstado(true)} label="Novo Estado" />} />

            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp label="Estado *" value={novoEstado.estado} onChange={v => updE('estado', v)} placeholder="" style={{ flex: '1 1 200px' }} />
                <Inp label="UF *" value={novoEstado.uf} onChange={v => updE('uf', v.toUpperCase())} maxLength={2} placeholder="" style={{ flex: '0 0 72px' }} />
                <LookupField label="País *" value={paisNoEstado}
                  onSearch={() => { setShowNovoPais(false); setOpenPaises(true) }}
                  style={{ flex: '1 1 180px' }} />
                <CheckAtivo checked={novoEstado.ativo} onChange={v => updE('ativo', v)} />
                <SaveRow onCancel={cancelE} onSave={saveNovoEstado} saving={savingEstado} label="Salvar Estado" />
              </InlineForm>
            )}

            <LookupTable cols={colsEstados} rows={estados}
              onSelect={r => { updC('codEstado', r.codEstado); setOpenEstados(false) }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Paises */ }
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

            <LookupTable cols={colsPaises} rows={paises}
              onSelect={r => { updE('codPais', r.codPais); setOpenPaises(false) }} />
          </ModalBox>
        </Overlay>
      )}
      {/* Funções */ }
      {openFuncoes && (
        <Overlay onClose={closeFuncoes} zIndex={60}>
          <ModalBox maxWidth={600}>
            <ModalHeader title="Consulta de Funções" onClose={closeFuncoes}
              badge={!showNovaFuncao && <BtnNovo onClick={() => setShowNovaFuncao(true)} label="Nova Função" />} />

            {showNovaFuncao && (
              <InlineForm title="Nova Função / Cargo">
                <Inp label="Função *" value={novaFuncao.funcao} onChange={v => updF('funcao', v)} placeholder="" style={{ flex: '1 1 260px' }} />
                <CheckAtivo checked={novaFuncao.ativo} onChange={v => updF('ativo', v)} />
                <SaveRow onCancel={cancelF} onSave={saveNovaFuncao} saving={savingFuncao} label="Salvar Função" />
              </InlineForm>
            )}

            <LookupTable cols={colsFuncoes} rows={funcoes}
              onSelect={r => { upd('codFuncao', r.codFuncao); setOpenFuncoes(false) }} />
          </ModalBox>
        </Overlay>
      )}

      <ConfirmDialog open={!!confirm} name={confirm?.funcionario} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
