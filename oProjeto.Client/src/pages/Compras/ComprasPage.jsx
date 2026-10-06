import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader } from '@/components/UI'
import {
  comprasApi, fornecedoresApi, condicoesApi, produtosApi,
  cidadesApi, estadosApi, paisesApi, marcasApi, categoriasApi,
} from '@/services/api'
import { useModalGuard } from '@/hooks/useModalGuard'


const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'
const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }
const tdStyle = { padding: '11px 14px', color: '#0f172a' }

const fmtMoney = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const arredondar2 = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100
const toDateInput = v => v ? String(v).slice(0, 10) : ''
const getDescontoItem = it => Number(it?.descontoValor ?? it?.desconto ?? 0) || 0

const chaveCompra = (numero, modelo, serie, codForn) => `${numero}/${modelo}/${serie}/${codForn}`

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

const BtnNovo = ({ onClick, label }) => (
  <BtnPrimary onClick={onClick} style={{ marginTop: 6, padding: '4px 12px', fontSize: 12 }}>+ {label}</BtnPrimary>
)

const SaveRow = ({ onCancel, onSave, saving, label }) => (
  <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
    <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
    <BtnPrimary onClick={onSave} disabled={saving}>{saving ? 'Salvando...' : label}</BtnPrimary>
  </div>
)

const BtnPesquisar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: disabled ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, background: disabled ? '#f1f4f8' : '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: disabled ? '#94a3b8' : '#0f172a' }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = disabled ? '#94a3b8' : '#0f172a' }}>
    Pesquisar
  </button>
)

const LookupField = ({ label, value, onSearch, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="text" readOnly value={value ?? ''} style={{ ...inp, flex: 1, background: disabled ? '#f1f4f8' : inp.background }} />
      <BtnPesquisar onClick={onSearch} disabled={disabled} />
    </div>
  </div>
)

const Inp = ({ label, value, onChange, maxLength, placeholder, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value ?? ''} maxLength={maxLength} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
  </div>
)

const NumberField = ({ label, value, onChange, step = '1', min, disabled, style, warning }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="number" step={step} min={min} disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      onFocus={e => { fo(e); e.target.select() }}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color, borderColor: warning ? '#f59e0b' : '#e2e6ed' }}
      onBlur={bl} />
    {warning && (
      <div style={{ fontSize: 11, color: '#b45309', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>⚠ {warning}</div>
    )}
  </div>
)

const DateField = ({ label, value, onChange, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="date" disabled={disabled} value={toDateInput(value)} onChange={e => onChange(e.target.value)}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background }} onFocus={fo} onBlur={bl} />
  </div>
)

const SelectField = ({ label, value, onChange, options, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={inp} onFocus={fo} onBlur={bl}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const TextAreaField = ({ label, value, onChange, rows = 2, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)}
      style={{ ...inp, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }} onFocus={fo} onBlur={bl} />
  </div>
)

const ReadOnlyField = ({ label, value, style, bold }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ ...inp, minHeight: 37, display: 'flex', alignItems: 'center', background: '#eef2f7', color: '#0f172a', fontWeight: bold ? 700 : 400, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
  </div>
)

const CheckAtivo = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
    Ativo
  </label>
)

const InlineForm = ({ title, children }) => (
  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#f8faff' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>
  </div>
)

const AvisoChavesPendentes = () => (
  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#fff7ed', color: '#b45309', fontSize: 13, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
    ⚠ Preencha Número, Série, Modelo e selecione o Fornecedor antes de adicionar itens.
  </div>
)

const LookupTable = ({ cols, rows, onSelect }) => (
  <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            {cols.map(c => <th key={c.key} style={thStyle}>{c.label}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={cols.length + 1} style={{ padding: 18, textAlign: 'center', color: '#94a3b8' }}>Nenhum registro encontrado.</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map(c => (
                <td key={c.key} style={{ ...tdStyle, fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
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

const ItemsList = ({ items, onRemove, disabled }) => (
  <div style={{ padding: '0 24px 20px' }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            <th style={thStyle}>Produto</th>
            <th style={thStyle}>Unid.</th>
            <th style={thStyle}>Qtd.</th>
            <th style={thStyle}>Vlr. Unit.</th>
            <th style={thStyle}>Vlr. Bruto</th>
            <th style={thStyle}>Desconto</th>
            <th style={thStyle}>Vlr. Líquido</th>
            <th style={thStyle}>Rateio</th>
            <th style={thStyle}>Custo Final (unit.)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={10} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Nenhum item adicionado.</td></tr>
          )}
          {items.map((it, i) => {
            const bruto = (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0)
            const desconto = getDescontoItem(it)
            const rateioTotal = (Number(it.rateioFrete) || 0) + (Number(it.rateioSeguro) || 0) + (Number(it.rateioOutras) || 0)
            const rateioTitle = `Frete: ${fmtMoney(it.rateioFrete)} · Seguro: ${fmtMoney(it.rateioSeguro)} · Outras: ${fmtMoney(it.rateioOutras)}`
            const descontoExcede = bruto > 0 && desconto >= bruto
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                <td style={tdStyle}>{it.produtoNome || `Produto #${it.codProd}`}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.unidade || '-'}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.quantidade}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.valorUnitario)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(bruto)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', color: descontoExcede ? '#b45309' : '#0f172a', fontWeight: descontoExcede ? 700 : 400 }}
                  title={descontoExcede ? 'Desconto ≥ valor do item' : undefined}>
                  {fmtMoney(desconto)}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.valorTotal)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', cursor: 'help' }} title={rateioTitle}>{fmtMoney(rateioTotal)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtMoney(it.custoFinal)}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                  <button disabled={disabled} onClick={() => onRemove(i)}
                    style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: disabled ? '#f1f4f8' : '#fee2e2', color: disabled ? '#94a3b8' : '#dc2626', cursor: disabled ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Remover
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)

const COMPRA_EMPTY = {
  numero: '', serie: '', modelo: '', codForn: null,
  dataCompra: new Date().toISOString().slice(0, 10), dataPrevisaoEntrega: '',
  codCondicao: null, valorProdutos: 0, valorDesconto: 0, valorFrete: 0,
  valorSeguro: 0, outrasDespesas: 0, valorTotal: 0,
  observacoes: '', situacao: 'ABERTA',
  produtos: [],
}

const ITEM_EMPTY = { codProd: null, produtoNome: '', unidade: '', quantidade: '', valorUnitario: '', descontoValor: 0, descontoPercentual: 0 }

const SITUACAO_OPTIONS = [
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'RECEBIDA', label: 'Recebida' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const cols = [
  { key: 'numero', label: 'Número', mono: true },
  { key: 'serie', label: 'Série', mono: true },
  { key: 'modelo', label: 'Modelo', mono: true },
  { key: 'fornecedor', label: 'Fornecedor', render: r => r.fornecedor?.fornecedor ?? `#${r.codForn}` },
  { key: 'dataCompra', label: 'Data', render: r => r.dataCompra ? new Date(r.dataCompra).toLocaleDateString('pt-BR') : '' },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal) },
  { key: 'situacao', label: 'Situação' },
]

const colsFornecedores = [
  { key: 'codForn', label: 'Cód.', mono: true },
  { key: 'fornecedor', label: 'Fornecedor' },
]

const colsCondicoes = [
  { key: 'codCondicao', label: 'Cód.', mono: true },
  { key: 'condicaoPagamento', label: 'Descrição' },
]


const colsProdutos = [
  { key: 'codProd', label: 'Cód.', mono: true },
  { key: 'produto', label: 'Produto' },
  { key: 'unidade', label: 'Unidade' },
]

const colsCidades = [
  { key: 'codCidade', label: 'Cód.', mono: true },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado', render: r => r.estado?.uf ?? '' },
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

const colsMarcas = [
  { key: 'codMarca', label: 'Cód.', mono: true },
  { key: 'marca', label: 'Marca' },
]

const colsCategorias = [
  { key: 'codCategoria', label: 'Cód.', mono: true },
  { key: 'categoria', label: 'Categoria' },
]

const FORNECEDOR_NOVO_EMPTY = { tipoPessoa: 'PJ', fornecedor: '', cpfCnpj: '', codCidade: null, ativo: true }
const CIDADE_EMPTY = { cidade: '', ddd: '', codEstado: null, ativo: true }
const ESTADO_EMPTY = { estado: '', uf: '', codPais: null, ativo: true }
const PAIS_EMPTY = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }

const PRODUTO_NOVO_EMPTY = {
  produto: '', unidade: '', precoCompra: 0, precoVenda: 0, custoMedio: 0, saldo: 0,
  pesoBruto: 0, pesoLiq: 0, codMarca: null, codCategoria: null, ativo: true,
}
const MARCA_EMPTY = { marca: '', ativo: true }
const CATEGORIA_EMPTY = { categoria: '', ativo: true }

// Página

export default function ComprasPage() {
  const { data, loading, load } = useCrud(comprasApi)

  const [fornecedores, setFornecedores] = useState([])
  const [condicoes, setCondicoes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [cidades, setCidades] = useState([])
  const [estados, setEstados] = useState([])
  const [paises, setPaises] = useState([])
  const [marcas, setMarcas] = useState([])
  const [categorias, setCategorias] = useState([])

  const [form, setForm] = useState(COMPRA_EMPTY)
  const [originalForm, setOriginalForm] = useState(COMPRA_EMPTY)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [saving, setSaving] = useState(false)

  const [itemDraft, setItemDraft] = useState(ITEM_EMPTY)

  const [openFornecedores, setOpenFornecedores] = useState(false)
  const [openCondicoes, setOpenCondicoes] = useState(false)
  const [openProdutos, setOpenProdutos] = useState(false)

  const [showNovoFornecedor, setShowNovoFornecedor] = useState(false)
  const [novoFornecedor, setNovoFornecedor] = useState(FORNECEDOR_NOVO_EMPTY)
  const [savingFornecedor, setSavingFornecedor] = useState(false)

  const [openCidadesForn, setOpenCidadesForn] = useState(false)
  const [showNovaCidade, setShowNovaCidade] = useState(false)
  const [novaCidade, setNovaCidade] = useState(CIDADE_EMPTY)
  const [savingCidade, setSavingCidade] = useState(false)

  const [openEstadosForn, setOpenEstadosForn] = useState(false)
  const [showNovoEstado, setShowNovoEstado] = useState(false)
  const [novoEstado, setNovoEstado] = useState(ESTADO_EMPTY)
  const [savingEstado, setSavingEstado] = useState(false)

  const [openPaisesForn, setOpenPaisesForn] = useState(false)
  const [showNovoPais, setShowNovoPais] = useState(false)
  const [novoPais, setNovoPais] = useState(PAIS_EMPTY)
  const [savingPais, setSavingPais] = useState(false)

  const [showNovoProduto, setShowNovoProduto] = useState(false)
  const [novoProdutoForm, setNovoProdutoForm] = useState(PRODUTO_NOVO_EMPTY)
  const [savingProduto, setSavingProduto] = useState(false)

  const [openMarcasCompra, setOpenMarcasCompra] = useState(false)
  const [showNovaMarca, setShowNovaMarca] = useState(false)
  const [novaMarca, setNovaMarca] = useState(MARCA_EMPTY)
  const [savingMarca, setSavingMarca] = useState(false)

  const [openCategoriasCompra, setOpenCategoriasCompra] = useState(false)
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState(CATEGORIA_EMPTY)
  const [savingCategoria, setSavingCategoria] = useState(false)

  const loadFornecedores = async () => setFornecedores(await fornecedoresApi.getAll())
  const loadCondicoes = async () => setCondicoes(await condicoesApi.getAll())
  const loadProdutos = async () => setProdutos(await produtosApi.getAll())
  const loadCidades = async () => setCidades(await cidadesApi.getAll())
  const loadEstados = async () => setEstados(await estadosApi.getAll())
  const loadPaises = async () => setPaises(await paisesApi.getAll())
  const loadMarcas = async () => setMarcas(await marcasApi.getAll())
  const loadCategorias = async () => setCategorias(await categoriasApi.getAll())

  useEffect(() => {
    loadFornecedores(); loadCondicoes(); loadProdutos()
    loadCidades(); loadEstados(); loadPaises(); loadMarcas(); loadCategorias()
  }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updNovoFornecedor = (k, v) => setNovoFornecedor(p => ({ ...p, [k]: v }))
  const updCidade = (k, v) => setNovaCidade(p => ({ ...p, [k]: v }))
  const updEstado = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updPais = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))
  const updNovoProduto = (k, v) => setNovoProdutoForm(p => ({ ...p, [k]: v }))
  const updMarca = (k, v) => setNovaMarca(p => ({ ...p, [k]: v }))
  const updCategoria = (k, v) => setNovaCategoria(p => ({ ...p, [k]: v }))

  const updItemQuantidade = v => setItemDraft(d => {
    const bruto = (Number(v) || 0) * (Number(d.valorUnitario) || 0)
    const descontoValor = arredondar2(bruto * (Number(d.descontoPercentual) || 0) / 100)
    return { ...d, quantidade: v, descontoValor }
  })

  const updItemValorUnitario = v => setItemDraft(d => {
    const bruto = (Number(d.quantidade) || 0) * (Number(v) || 0)
    const descontoValor = arredondar2(bruto * (Number(d.descontoPercentual) || 0) / 100)
    return { ...d, valorUnitario: v, descontoValor }
  })

  const updItemDesconto = v => setItemDraft(d => {
    const bruto = (Number(d.quantidade) || 0) * (Number(d.valorUnitario) || 0)
    const descontoValor = Number(v) || 0
    const descontoPercentual = bruto > 0 ? arredondar2(descontoValor / bruto * 100) : 0
    return { ...d, descontoValor: v, descontoPercentual }
  })

  const updItemDescontoPercentual = v => setItemDraft(d => {
    const bruto = (Number(d.quantidade) || 0) * (Number(d.valorUnitario) || 0)
    const descontoPercentual = Number(v) || 0
    const descontoValor = arredondar2(bruto * descontoPercentual / 100)
    return { ...d, descontoPercentual: v, descontoValor }
  })

  const chavePronta = !!(form.numero && form.serie && form.modelo && form.codForn)

  const valorProdutosBruto = (form.produtos ?? []).reduce((s, it) => s + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0), 0)
  const totalDescontos = (form.produtos ?? []).reduce((s, it) => s + getDescontoItem(it), 0)
  const valorProdutosLiquido = valorProdutosBruto - totalDescontos
  const valorTotal = valorProdutosLiquido + (Number(form.valorFrete) || 0) + (Number(form.valorSeguro) || 0) + (Number(form.outrasDespesas) || 0)

  const comRateio = (produtosList, frete, seguro, outras) => {
    const lista = produtosList ?? []
    const liquidos = lista.map(it => {
      const bruto = (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0)
      return Math.max(0, bruto - getDescontoItem(it))
    })
    const base = liquidos.reduce((s, v) => s + v, 0)

    const acumulado = { frete: 0, seguro: 0, outras: 0 }
    const result = lista.map((it, i) => {
      const liquido = liquidos[i]
      const proporcao = base > 0 ? liquido / base : 0
      const rateioFrete = arredondar2((Number(frete) || 0) * proporcao)
      const rateioSeguro = arredondar2((Number(seguro) || 0) * proporcao)
      const rateioOutras = arredondar2((Number(outras) || 0) * proporcao)
      acumulado.frete += rateioFrete
      acumulado.seguro += rateioSeguro
      acumulado.outras += rateioOutras
      return { ...it, valorTotal: arredondar2(liquido), rateioFrete, rateioSeguro, rateioOutras }
    })

    if (result.length > 0 && base > 0) {
      const ultimo = result.length - 1
      result[ultimo] = {
        ...result[ultimo],
        rateioFrete: arredondar2(result[ultimo].rateioFrete + arredondar2((Number(frete) || 0) - acumulado.frete)),
        rateioSeguro: arredondar2(result[ultimo].rateioSeguro + arredondar2((Number(seguro) || 0) - acumulado.seguro)),
        rateioOutras: arredondar2(result[ultimo].rateioOutras + arredondar2((Number(outras) || 0) - acumulado.outras)),
      }
    }

    return result.map(it => {
      const qtd = Number(it.quantidade) || 0
      const custoTotalItem = arredondar2(it.valorTotal + it.rateioFrete + it.rateioSeguro + it.rateioOutras)
      return { ...it, custoFinal: qtd > 0 ? arredondar2(custoTotalItem / qtd) : 0 }
    })
  }

  const produtosComRateio = comRateio(form.produtos, form.valorFrete, form.valorSeguro, form.outrasDespesas)

  const valorBrutoItemDraft = (Number(itemDraft.quantidade) || 0) * (Number(itemDraft.valorUnitario) || 0)
  const valorLiquidoItemDraft = valorBrutoItemDraft - (Number(itemDraft.descontoValor) || 0)

  const addItem = () => {
    if (!itemDraft.codProd) { toast.error('Selecione um produto.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }

    const desconto = Number(itemDraft.descontoValor) || 0
    const bruto = Number(itemDraft.quantidade) * Number(itemDraft.valorUnitario)
    if (desconto < 0) { toast.error('Desconto não pode ser negativo.'); return }
    if (desconto > bruto) { toast.error('Desconto maior que o valor do item.'); return }

    const produtoJaAdicionado = (form.produtos ?? []).some(
      item => Number(item.codProd) === Number(itemDraft.codProd)
    )
    if (produtoJaAdicionado) { toast.error('Este produto já foi adicionado à compra.'); return }

    const novoItem = {
      codProd: itemDraft.codProd,
      produtoNome: itemDraft.produtoNome,
      unidade: itemDraft.unidade,
      quantidade: Number(itemDraft.quantidade),
      valorUnitario: Number(itemDraft.valorUnitario),
      valorTotal: arredondar2(bruto - desconto),
      descontoPercentual: Number(itemDraft.descontoPercentual) || 0,
      descontoValor: desconto,
    }
    setForm(f => ({ ...f, produtos: [...(f.produtos ?? []), novoItem] }))
    setItemDraft(ITEM_EMPTY)
  }

  const removeItem = i => setForm(f => ({ ...f, produtos: f.produtos.filter((_, idx) => idx !== i) }))

  const save = async () => {
    if (!form.codForn) { toast.error('Selecione o fornecedor.'); return }
    if (!form.numero || !form.serie || !form.modelo) { toast.error('Informe número, série e modelo.'); return }
    if (!form.produtos?.length) { toast.error('Adicione ao menos um item.'); return }

    const payload = {
      ...form,
      numero: String(form.numero ?? ''),
      serie: String(form.serie ?? ''),
      modelo: String(form.modelo ?? ''),
      dataCompra: form.dataCompra || null,
      dataPrevisaoEntrega: form.dataPrevisaoEntrega || null,
      valorProdutos: arredondar2(valorProdutosBruto),
      valorDesconto: arredondar2(totalDescontos),
      valorTotal: arredondar2(valorTotal),
      produtos: produtosComRateio.map(it => ({
        numero: String(form.numero ?? ''),
        serie: String(form.serie ?? ''),
        modelo: String(form.modelo ?? ''),
        codProd: it.codProd,
        quantidade: it.quantidade,
        valorUnitario: it.valorUnitario,
        valorTotal: it.valorTotal,
        rateioFrete: it.rateioFrete,
        rateioSeguro: it.rateioSeguro,
        rateioOutras: it.rateioOutras,
        descontoPercentual: Number(it.descontoPercentual) || 0,
        descontoValor: getDescontoItem(it),
        custoFinal: it.custoFinal,
      })),
    }

    setSaving(true)
    try {
      if (editing) {
        await comprasApi.update(chaveCompra(payload.numero, payload.modelo, payload.serie, payload.codForn), payload)
      } else {
        await comprasApi.create(payload)
      }
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar a compra.')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    try {
      await comprasApi.delete(chaveCompra(confirm.numero, confirm.modelo, confirm.serie, confirm.codForn))
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir a compra.')
    }
  }

  const fornecedorSelecionado = fornecedores.find(f => f.codForn === form.codForn) ?? form.fornecedor
  const fornecedorLabel = fornecedorSelecionado?.fornecedor ?? ''
  const selectFornecedor = r => {
    setForm(f => ({
      ...f,
      codForn: r.codForn,
      fornecedor: r,
      codCondicao: r.condicao?.codCondicao ?? f.codCondicao,
      condicaoPagamento: r.condicao ?? f.condicaoPagamento,
    }))
    setOpenFornecedores(false)
  }

  const condicaoSelecionada = condicoes.find(c => String(c.codCondicao) === String(form.codCondicao)) ?? form.condicaoPagamento
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? ''
  const selectCondicao = r => {
    setForm(f => ({ ...f, codCondicao: r.codCondicao, condicaoPagamento: r }))
    setOpenCondicoes(false)
  }
  const selectProdutoItem = r => {
    setItemDraft(d => ({ ...d, codProd: r.codProd, produtoNome: r.produto, unidade: r.unidade ?? '' }))
    setOpenProdutos(false)
  }

  const cidadeNovoFornLabel = cidades.find(c => c.codCidade === novoFornecedor.codCidade)?.cidade ?? ''
  const estadoNaCidadeLabel = (() => {
    const e = estados.find(e => e.codEstado === novaCidade.codEstado)
    return e ? `${e.estado} - ${e.uf}` : ''
  })()
  const paisNoEstadoLabel = paises.find(p => p.codPais === novoEstado.codPais)?.pais ?? ''

  const saveNovoFornecedor = async () => {
    if (!novoFornecedor.fornecedor?.trim()) { toast.error('Informe o fornecedor.'); return }
    if (!novoFornecedor.codCidade) { toast.error('Selecione a cidade.'); return }
    setSavingFornecedor(true)
    try {
      const created = await fornecedoresApi.create(novoFornecedor)
      toast.success('Fornecedor cadastrado!')
      await loadFornecedores()
      const codNovo = created?.codForn ?? created?.id
      if (codNovo) selectFornecedor({ ...novoFornecedor, codForn: codNovo, condicao: null })
      setShowNovoFornecedor(false)
      setNovoFornecedor(FORNECEDOR_NOVO_EMPTY)
    } catch {
      toast.error('Erro ao salvar fornecedor.')
    } finally {
      setSavingFornecedor(false)
    }
  }

  const saveNovaCidade = async () => {
    if (!novaCidade.cidade?.trim()) { toast.error('Informe a cidade.'); return }
    setSavingCidade(true)
    try {
      const created = await cidadesApi.create(novaCidade)
      toast.success('Cidade cadastrada!')
      await loadCidades()
      const codNovo = created?.codCidade ?? created?.id
      if (codNovo) updNovoFornecedor('codCidade', codNovo)
      setShowNovaCidade(false)
      setNovaCidade(CIDADE_EMPTY)
    } catch {
      toast.error('Erro ao salvar cidade.')
    } finally {
      setSavingCidade(false)
    }
  }

  const saveNovoEstado = async () => {
    if (!novoEstado.estado?.trim()) { toast.error('Informe o estado.'); return }
    setSavingEstado(true)
    try {
      const created = await estadosApi.create(novoEstado)
      toast.success('Estado cadastrado!')
      await loadEstados()
      const codNovo = created?.codEstado ?? created?.id
      if (codNovo) updCidade('codEstado', codNovo)
      setShowNovoEstado(false)
      setNovoEstado(ESTADO_EMPTY)
    } catch {
      toast.error('Erro ao salvar estado.')
    } finally {
      setSavingEstado(false)
    }
  }

  const saveNovoPais = async () => {
    if (!novoPais.pais?.trim()) { toast.error('Informe o país.'); return }
    setSavingPais(true)
    try {
      const created = await paisesApi.create(novoPais)
      toast.success('País cadastrado!')
      await loadPaises()
      const codNovo = created?.codPais ?? created?.id
      if (codNovo) updEstado('codPais', codNovo)
      setShowNovoPais(false)
      setNovoPais(PAIS_EMPTY)
    } catch {
      toast.error('Erro ao salvar país.')
    } finally {
      setSavingPais(false)
    }
  }

  const cancelFornecedorNovo = () => { setShowNovoFornecedor(false); setNovoFornecedor(FORNECEDOR_NOVO_EMPTY) }
  const cancelCidade = () => { setShowNovaCidade(false); setNovaCidade(CIDADE_EMPTY) }
  const cancelEstado = () => { setShowNovoEstado(false); setNovoEstado(ESTADO_EMPTY) }
  const cancelPais = () => { setShowNovoPais(false); setNovoPais(PAIS_EMPTY) }

  const closeFornecedores = () => { setOpenFornecedores(false); cancelFornecedorNovo() }
  const closeCidadesForn = () => { setOpenCidadesForn(false); cancelCidade() }
  const closeEstadosForn = () => { setOpenEstadosForn(false); cancelEstado() }
  const closePaisesForn = () => { setOpenPaisesForn(false); cancelPais() }

  const isDirtyNovoFornecedor = showNovoFornecedor && JSON.stringify(novoFornecedor) !== JSON.stringify(FORNECEDOR_NOVO_EMPTY)
  const fornecedoresGuard = useModalGuard({
    isOpen: openFornecedores,
    isDirty: isDirtyNovoFornecedor,
    onClose: closeFornecedores,
    onSave: showNovoFornecedor ? saveNovoFornecedor : undefined,
    paused: openCidadesForn,
  })

  const isDirtyCidade = showNovaCidade && JSON.stringify(novaCidade) !== JSON.stringify(CIDADE_EMPTY)
  const cidadesFornGuard = useModalGuard({
    isOpen: openCidadesForn,
    isDirty: isDirtyCidade,
    onClose: closeCidadesForn,
    onSave: showNovaCidade ? saveNovaCidade : undefined,
    paused: openEstadosForn,
  })

  const isDirtyEstado = showNovoEstado && JSON.stringify(novoEstado) !== JSON.stringify(ESTADO_EMPTY)
  const estadosFornGuard = useModalGuard({
    isOpen: openEstadosForn,
    isDirty: isDirtyEstado,
    onClose: closeEstadosForn,
    onSave: showNovoEstado ? saveNovoEstado : undefined,
    paused: openPaisesForn,
  })

  const isDirtyPais = showNovoPais && JSON.stringify(novoPais) !== JSON.stringify(PAIS_EMPTY)
  const paisesFornGuard = useModalGuard({
    isOpen: openPaisesForn,
    isDirty: isDirtyPais,
    onClose: closePaisesForn,
    onSave: showNovoPais ? saveNovoPais : undefined,
  })

  const marcaNovoProdLabel = marcas.find(m => m.codMarca === novoProdutoForm.codMarca)?.marca ?? ''
  const categoriaNovoProdLabel = categorias.find(c => c.codCategoria === novoProdutoForm.codCategoria)?.categoria ?? ''

  const saveNovoProduto = async () => {
    if (!novoProdutoForm.produto?.trim()) { toast.error('Informe o produto.'); return }
    setSavingProduto(true)
    try {
      const created = await produtosApi.create(novoProdutoForm)
      toast.success('Produto cadastrado!')
      await loadProdutos()
      const codNovo = created?.codProd ?? created?.id
      if (codNovo) selectProdutoItem({ codProd: codNovo, produto: novoProdutoForm.produto, unidade: novoProdutoForm.unidade })
      setShowNovoProduto(false)
      setNovoProdutoForm(PRODUTO_NOVO_EMPTY)
    } catch {
      toast.error('Erro ao salvar produto.')
    } finally {
      setSavingProduto(false)
    }
  }

  const saveNovaMarca = async () => {
    if (!novaMarca.marca?.trim()) { toast.error('Informe a marca.'); return }
    setSavingMarca(true)
    try {
      const created = await marcasApi.create(novaMarca)
      toast.success('Marca cadastrada!')
      await loadMarcas()
      const codNovo = created?.codMarca ?? created?.id
      if (codNovo) updNovoProduto('codMarca', codNovo)
      setShowNovaMarca(false)
      setNovaMarca(MARCA_EMPTY)
    } catch {
      toast.error('Erro ao salvar marca.')
    } finally {
      setSavingMarca(false)
    }
  }

  const saveNovaCategoria = async () => {
    if (!novaCategoria.categoria?.trim()) { toast.error('Informe a categoria.'); return }
    setSavingCategoria(true)
    try {
      const created = await categoriasApi.create(novaCategoria)
      toast.success('Categoria cadastrada!')
      await loadCategorias()
      const codNovo = created?.codCategoria ?? created?.id
      if (codNovo) updNovoProduto('codCategoria', codNovo)
      setShowNovaCategoria(false)
      setNovaCategoria(CATEGORIA_EMPTY)
    } catch {
      toast.error('Erro ao salvar categoria.')
    } finally {
      setSavingCategoria(false)
    }
  }

  const cancelProdutoNovo = () => { setShowNovoProduto(false); setNovoProdutoForm(PRODUTO_NOVO_EMPTY) }
  const cancelMarca = () => { setShowNovaMarca(false); setNovaMarca(MARCA_EMPTY) }
  const cancelCategoria = () => { setShowNovaCategoria(false); setNovaCategoria(CATEGORIA_EMPTY) }

  const closeProdutos = () => { setOpenProdutos(false); cancelProdutoNovo() }
  const closeMarcasCompra = () => { setOpenMarcasCompra(false); cancelMarca() }
  const closeCategoriasCompra = () => { setOpenCategoriasCompra(false); cancelCategoria() }

  const isDirtyNovoProduto = showNovoProduto && JSON.stringify(novoProdutoForm) !== JSON.stringify(PRODUTO_NOVO_EMPTY)
  const produtosGuard = useModalGuard({
    isOpen: openProdutos,
    isDirty: isDirtyNovoProduto,
    onClose: closeProdutos,
    onSave: showNovoProduto ? saveNovoProduto : undefined,
    paused: openMarcasCompra || openCategoriasCompra,
  })

  const isDirtyMarca = showNovaMarca && JSON.stringify(novaMarca) !== JSON.stringify(MARCA_EMPTY)
  const marcasCompraGuard = useModalGuard({
    isOpen: openMarcasCompra,
    isDirty: isDirtyMarca,
    onClose: closeMarcasCompra,
    onSave: showNovaMarca ? saveNovaMarca : undefined,
  })

  const isDirtyCategoria = showNovaCategoria && JSON.stringify(novaCategoria) !== JSON.stringify(CATEGORIA_EMPTY)
  const categoriasCompraGuard = useModalGuard({
    isOpen: openCategoriasCompra,
    isDirty: isDirtyCategoria,
    onClose: closeCategoriasCompra,
    onSave: showNovaCategoria ? saveNovaCategoria : undefined,
  })

  const closeCondicoes = () => setOpenCondicoes(false)

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const anyLookupOpen = openFornecedores || openCondicoes || openProdutos

  const abrirNovaCompra = () => {
    const vazio = { ...COMPRA_EMPTY, produtos: [] }
    setForm(vazio); setOriginalForm(vazio); setItemDraft(ITEM_EMPTY)
    setEditing(false); setOpen(true)
  }

  const abrirEdicaoCompra = async r => {
    let completa
    try {
      completa = await comprasApi.getOne(chaveCompra(r.numero, r.modelo, r.serie, r.codForn))
    } catch {
      toast.error('Erro ao carregar a compra.')
      return
    }

    const formCarregado = {
      ...completa,
      dataCompra: toDateInput(completa.dataCompra),
      dataPrevisaoEntrega: toDateInput(completa.dataPrevisaoEntrega),
      produtos: (completa.produtos ?? []).map(p => ({
        codProd: p.codProd,
        produtoNome: p.produto?.produto ?? '',
        unidade: p.produto?.unidade ?? '',
        quantidade: p.quantidade,
        valorUnitario: p.valorUnitario,
        valorTotal: p.valorTotal,
        descontoPercentual: p.descontoPercentual ?? 0,
        descontoValor: p.descontoValor ?? p.desconto ?? 0,
      })),
    }
    setForm(formCarregado); setOriginalForm(formCarregado); setItemDraft(ITEM_EMPTY)
    setEditing(true); setOpen(true)
  }

  return (
    <div>
      <PageHeader title="Compras" sub="Consulta de Compras" label="Nova Compra" onNew={abrirNovaCompra} disabled={open} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicaoCompra}
        onDelete={r => setConfirm(r)} />

      <Modal open={open} title={editing ? 'Editar Compra' : 'Nova Compra'} editing={editing}
        onClose={() => setOpen(false)} onSave={save} saving={saving} wide maxWidth={2000}
        isDirty={isDirty}
        suspended={anyLookupOpen}>

        {/* Linha única: Modelo, Série, Número, Código Fornecedor, Fornecedor, Data Compra, Previsão Entrega */}
        <div style={{ padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Inp label="Modelo" value={form.modelo} onChange={v => upd('modelo', v)} style={{ flex: '0 0 80px' }} />
          <Inp label="Série" value={form.serie} onChange={v => upd('serie', v)} style={{ flex: '0 0 70px' }} />
          <Inp label="Número" value={form.numero} onChange={v => upd('numero', v)} style={{ flex: '0 0 110px' }} />
          <ReadOnlyField label="Código" value={form.codForn ?? ''} style={{ flex: '0 0 90px' }} />

          <div style={{ flex: '1 1 260px' }}>
            <LookupField label="Fornecedor *" value={fornecedorLabel} disabled={editing}
              onSearch={() => { setShowNovoFornecedor(false); setOpenFornecedores(true) }} />
          </div>

          <DateField label="Data Compra" value={form.dataCompra} onChange={v => upd('dataCompra', v)} style={{ flex: '0 0 150px' }} />
          <DateField label="Previsão Entrega" value={form.dataPrevisaoEntrega} onChange={v => upd('dataPrevisaoEntrega', v)} style={{ flex: '0 0 150px' }} />
        </div>

        {/* Adicionar Item — só liberado depois das chaves primárias preenchidas */}
        {chavePronta ? (
          <InlineForm title="Adicionar Item">
            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <LookupField label="Produto *" value={itemDraft.produtoNome}
                onSearch={() => { setShowNovoProduto(false); setOpenProdutos(true) }} />
            </div>
            {/* Unidade vem automaticamente junto com o produto selecionado */}
            <ReadOnlyField label="Unidade" value={itemDraft.unidade || '-'} style={{ flex: '0 0 70px' }} />
            <NumberField label="Quantidade" value={itemDraft.quantidade} onChange={updItemQuantidade} step="0.001" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Valor Unitário" value={itemDraft.valorUnitario} onChange={updItemValorUnitario} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
            {/* Desconto em R$ e em % se recalculam um a partir do outro */}
            <NumberField label="Desconto (%)" value={itemDraft.descontoPercentual} onChange={updItemDescontoPercentual} step="0.01" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Desconto (R$)" value={itemDraft.descontoValor} onChange={updItemDesconto} step="0.01" min="0"
              warning={valorBrutoItemDraft > 0 && Number(itemDraft.descontoValor) > valorBrutoItemDraft ? 'Maior que o item' : undefined}
              style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor Bruto" value={fmtMoney(valorBrutoItemDraft)} style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor c/ Desconto" value={fmtMoney(valorLiquidoItemDraft)} style={{ flex: '0 0 140px' }} />
            <BtnPrimary onClick={addItem} style={{ padding: '9px 20px' }}>Adicionar</BtnPrimary>
          </InlineForm>
        ) : (
          <AvisoChavesPendentes />
        )}

        <ItemsList items={produtosComRateio} onRemove={removeItem} />

        {/* Situação / condição de pagamento */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)} options={SITUACAO_OPTIONS} style={{ flex: '0 0 200px' }} />
          <div style={{ flex: '0 0 500px', minWidth: 200 }}>
            <LookupField label="Condição de Pagamento" value={condicaoLabel} onSearch={() => setOpenCondicoes(true)} />
          </div>
        </div>

        <div style={{ padding: '14px 24px 4px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} />
        </div>

        {/* Totais da compra — desconto é só leitura (soma dos itens) */}
        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <ReadOnlyField label="Produtos Bruto" value={fmtMoney(valorProdutosBruto)} style={{ flex: '1 1 140px' }} />
          <ReadOnlyField label="Total Descontos (itens)" value={fmtMoney(totalDescontos)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Produtos Líquido" value={fmtMoney(valorProdutosLiquido)} style={{ flex: '1 1 150px' }} />
          <NumberField label="Valor Frete" value={form.valorFrete} onChange={v => upd('valorFrete', v)} step="0.01" min="0" style={{ flex: '1 1 120px' }} />
          <NumberField label="Valor Seguro" value={form.valorSeguro} onChange={v => upd('valorSeguro', v)} step="0.01" min="0" style={{ flex: '1 1 120px' }} />
          <NumberField label="Outras Despesas" value={form.outrasDespesas} onChange={v => upd('outrasDespesas', v)} step="0.01" min="0" style={{ flex: '1 1 130px' }} />
          <ReadOnlyField label="Valor Total da Compra" value={fmtMoney(valorTotal)} bold style={{ flex: '1 1 170px' }} />
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          Fornecedor (nível 1 desta sub-árvore) → Cidade → Estado → País
      ══════════════════════════════════════════════════════════════ */}
      {openFornecedores && (
        <Overlay onClose={fornecedoresGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={640}>
            <ModalHeader title="Consulta de Fornecedores" onClose={fornecedoresGuard.attemptClose}
              badge={!showNovoFornecedor && <BtnNovo onClick={() => setShowNovoFornecedor(true)} label="Novo Fornecedor" />} />

            {showNovoFornecedor && (
              <InlineForm title="Novo Fornecedor">
                <Inp label="Fornecedor *" value={novoFornecedor.fornecedor} onChange={v => updNovoFornecedor('fornecedor', v)}
                  placeholder="Razão social / nome" style={{ flex: '1 1 220px' }} />
                <Inp label={novoFornecedor.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'} value={novoFornecedor.cpfCnpj}
                  onChange={v => updNovoFornecedor('cpfCnpj', v)} style={{ flex: '1 1 180px' }} />
                <LookupField label="Cidade *" value={cidadeNovoFornLabel}
                  onSearch={() => { setShowNovaCidade(false); setOpenCidadesForn(true) }}
                  style={{ flex: '1 1 200px' }} />
                <CheckAtivo checked={novoFornecedor.ativo} onChange={v => updNovoFornecedor('ativo', v)} />
                <SaveRow onCancel={cancelFornecedorNovo} onSave={saveNovoFornecedor} saving={savingFornecedor} label="Salvar Fornecedor" />
              </InlineForm>
            )}

            <LookupTable cols={colsFornecedores} rows={fornecedores} onSelect={selectFornecedor} />
          </ModalBox>
        </Overlay>
      )}

      {/* Cidade (filho de Fornecedor) — zIndex 70 */}
      {openCidadesForn && (
        <Overlay onClose={cidadesFornGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Cidades" onClose={cidadesFornGuard.attemptClose}
              badge={!showNovaCidade && <BtnNovo onClick={() => setShowNovaCidade(true)} label="Nova Cidade" />} />

            {showNovaCidade && (
              <InlineForm title="Nova Cidade">
                <Inp label="Cidade *" value={novaCidade.cidade} onChange={v => updCidade('cidade', v)} placeholder="Nome da cidade" style={{ flex: '1 1 200px' }} />
                <Inp label="DDD" value={novaCidade.ddd} onChange={v => updCidade('ddd', v)} maxLength={3} placeholder="11" style={{ flex: '0 0 72px' }} />
                <LookupField label="Estado *" value={estadoNaCidadeLabel} onSearch={() => { setShowNovoEstado(false); setOpenEstadosForn(true) }} style={{ flex: '1 1 200px' }} />
                <CheckAtivo checked={novaCidade.ativo} onChange={v => updCidade('ativo', v)} />
                <SaveRow onCancel={cancelCidade} onSave={saveNovaCidade} saving={savingCidade} label="Salvar Cidade" />
              </InlineForm>
            )}

            <LookupTable cols={colsCidades} rows={cidades}
              onSelect={r => { updNovoFornecedor('codCidade', r.codCidade); setOpenCidadesForn(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {/* Estado (filho de Cidade) — zIndex 80 */}
      {openEstadosForn && (
        <Overlay onClose={estadosFornGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Estados" onClose={estadosFornGuard.attemptClose}
              badge={!showNovoEstado && <BtnNovo onClick={() => setShowNovoEstado(true)} label="Novo Estado" />} />

            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp label="Estado *" value={novoEstado.estado} onChange={v => updEstado('estado', v)} placeholder="Nome do estado" style={{ flex: '1 1 200px' }} />
                <Inp label="UF *" value={novoEstado.uf} onChange={v => updEstado('uf', v.toUpperCase())} maxLength={2} placeholder="SP" style={{ flex: '0 0 72px' }} />
                <LookupField label="País *" value={paisNoEstadoLabel} onSearch={() => { setShowNovoPais(false); setOpenPaisesForn(true) }} style={{ flex: '1 1 200px' }} />
                <CheckAtivo checked={novoEstado.ativo} onChange={v => updEstado('ativo', v)} />
                <SaveRow onCancel={cancelEstado} onSave={saveNovoEstado} saving={savingEstado} label="Salvar Estado" />
              </InlineForm>
            )}

            <LookupTable cols={colsEstados} rows={estados}
              onSelect={r => { updCidade('codEstado', r.codEstado); setOpenEstadosForn(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {/* País (filho de Estado) — zIndex 90 */}
      {openPaisesForn && (
        <Overlay onClose={paisesFornGuard.attemptClose} zIndex={90}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Países" onClose={paisesFornGuard.attemptClose}
              badge={!showNovoPais && <BtnNovo onClick={() => setShowNovoPais(true)} label="Novo País" />} />

            {showNovoPais && (
              <InlineForm title="Novo País">
                <Inp label="País *" value={novoPais.pais} onChange={v => updPais('pais', v)} placeholder="Nome do país" style={{ flex: '1 1 200px' }} />
                <Inp label="Sigla" value={novoPais.sigla} onChange={v => updPais('sigla', v.toUpperCase())} maxLength={3} placeholder="BR" style={{ flex: '0 0 80px' }} />
                <Inp label="DDI" value={novoPais.ddi} onChange={v => updPais('ddi', v)} maxLength={6} placeholder="+55" style={{ flex: '0 0 80px' }} />
                <Inp label="Moeda" value={novoPais.moeda} onChange={v => updPais('moeda', v)} maxLength={10} placeholder="BRL" style={{ flex: '1 1 120px' }} />
                <CheckAtivo checked={novoPais.ativo} onChange={v => updPais('ativo', v)} />
                <SaveRow onCancel={cancelPais} onSave={saveNovoPais} saving={savingPais} label="Salvar País" />
              </InlineForm>
            )}

            <LookupTable cols={colsPaises} rows={paises}
              onSelect={r => { updEstado('codPais', r.codPais); setOpenPaisesForn(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {/* Condição de Pagamento — lookup puro, sem "+ Novo X" e sem cadeia */}
      {openCondicoes && (
        <Overlay onClose={closeCondicoes} zIndex={60}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Condições de Pagamento" onClose={closeCondicoes} />
            <LookupTable cols={colsCondicoes} rows={condicoes} onSelect={selectCondicao} />
          </ModalBox>
        </Overlay>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Produto (nível 1 desta sub-árvore) → Marca / Categoria (irmãos)
      ══════════════════════════════════════════════════════════════ */}
      {openProdutos && (
        <Overlay onClose={produtosGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={640}>
            <ModalHeader title="Consulta de Produtos" onClose={produtosGuard.attemptClose}
              badge={!showNovoProduto && <BtnNovo onClick={() => setShowNovoProduto(true)} label="Novo Produto" />} />

            {showNovoProduto && (
              <InlineForm title="Novo Produto">
                <Inp label="Produto *" value={novoProdutoForm.produto} onChange={v => updNovoProduto('produto', v)}
                  placeholder="Nome do produto" style={{ flex: '1 1 220px' }} />
                <Inp label="Unidade" value={novoProdutoForm.unidade} onChange={v => updNovoProduto('unidade', v)}
                  maxLength={6} placeholder="UN" style={{ flex: '0 0 90px' }} />
                <LookupField label="Categoria" value={categoriaNovoProdLabel}
                  onSearch={() => { setShowNovaCategoria(false); setOpenCategoriasCompra(true) }} style={{ flex: '1 1 180px' }} />
                <LookupField label="Marca" value={marcaNovoProdLabel}
                  onSearch={() => { setShowNovaMarca(false); setOpenMarcasCompra(true) }} style={{ flex: '1 1 180px' }} />
                <NumberField label="Preço Venda (R$)" value={novoProdutoForm.precoVenda} onChange={v => updNovoProduto('precoVenda', v)} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
                <CheckAtivo checked={novoProdutoForm.ativo} onChange={v => updNovoProduto('ativo', v)} />
                <SaveRow onCancel={cancelProdutoNovo} onSave={saveNovoProduto} saving={savingProduto} label="Salvar Produto" />
              </InlineForm>
            )}

            <LookupTable cols={colsProdutos} rows={produtos} onSelect={selectProdutoItem} />
          </ModalBox>
        </Overlay>
      )}

      {/* Categoria (filho de Produto) — zIndex 80 */}
      {openCategoriasCompra && (
        <Overlay onClose={categoriasCompraGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Categorias" onClose={categoriasCompraGuard.attemptClose}
              badge={!showNovaCategoria && <BtnNovo onClick={() => setShowNovaCategoria(true)} label="Nova Categoria" />} />

            {showNovaCategoria && (
              <InlineForm title="Nova Categoria">
                <Inp label="Categoria *" value={novaCategoria.categoria} onChange={v => updCategoria('categoria', v)} style={{ flex: '1 1 240px' }} />
                <CheckAtivo checked={novaCategoria.ativo} onChange={v => updCategoria('ativo', v)} />
                <SaveRow onCancel={cancelCategoria} onSave={saveNovaCategoria} saving={savingCategoria} label="Salvar Categoria" />
              </InlineForm>
            )}

            <LookupTable cols={colsCategorias} rows={categorias}
              onSelect={r => { updNovoProduto('codCategoria', r.codCategoria); setOpenCategoriasCompra(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {/* Marca (filho de Produto) — zIndex 80 */}
      {openMarcasCompra && (
        <Overlay onClose={marcasCompraGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Marcas" onClose={marcasCompraGuard.attemptClose}
              badge={!showNovaMarca && <BtnNovo onClick={() => setShowNovaMarca(true)} label="Nova Marca" />} />

            {showNovaMarca && (
              <InlineForm title="Nova Marca">
                <Inp label="Marca *" value={novaMarca.marca} onChange={v => updMarca('marca', v)} style={{ flex: '1 1 240px' }} />
                <CheckAtivo checked={novaMarca.ativo} onChange={v => updMarca('ativo', v)} />
                <SaveRow onCancel={cancelMarca} onSave={saveNovaMarca} saving={savingMarca} label="Salvar Marca" />
              </InlineForm>
            )}

            <LookupTable cols={colsMarcas} rows={marcas}
              onSelect={r => { updNovoProduto('codMarca', r.codMarca); setOpenMarcasCompra(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {/* confirmações de fechar com dados não salvos, uma por nível */}
      <ConfirmDialog
        open={fornecedoresGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={fornecedoresGuard.cancelClose} onConfirm={fornecedoresGuard.confirmClose}
      />
      <ConfirmDialog
        open={cidadesFornGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={cidadesFornGuard.cancelClose} onConfirm={cidadesFornGuard.confirmClose}
      />
      <ConfirmDialog
        open={estadosFornGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={estadosFornGuard.cancelClose} onConfirm={estadosFornGuard.confirmClose}
      />
      <ConfirmDialog
        open={paisesFornGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={paisesFornGuard.cancelClose} onConfirm={paisesFornGuard.confirmClose}
      />
      <ConfirmDialog
        open={produtosGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={produtosGuard.cancelClose} onConfirm={produtosGuard.confirmClose}
      />
      <ConfirmDialog
        open={categoriasCompraGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={categoriasCompraGuard.cancelClose} onConfirm={categoriasCompraGuard.confirmClose}
      />
      <ConfirmDialog
        open={marcasCompraGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={marcasCompraGuard.cancelClose} onConfirm={marcasCompraGuard.confirmClose}
      />

      <ConfirmDialog open={!!confirm} name={confirm ? `${confirm.numero}/${confirm.serie}` : ''} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}