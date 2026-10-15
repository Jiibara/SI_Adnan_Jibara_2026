import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { contasAvsApi, fornecedoresApi, formaPagamentosApi, condicoesApi } from '@/services/api'

// ajuste se a rota do seu controller for outra
const API = '/api/ContasPagarAvulsa'

/* ---------- estilos / helpers ---------- */

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }
const tdStyle = { padding: '11px 14px', color: '#0f172a' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'
const dis = (d, k) => (d ? (k === 'color' ? '#94a3b8' : '#f1f4f8') : inp[k])

const fmtMoney = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const arred2 = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100
const toDateInput = v => (v ? String(v).slice(0, 10) : '')
const hojeISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const formatarDataBR = v => {
  const iso = toDateInput(v)
  if (iso.length !== 10) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
const parseDataBR = v => {
  const x = String(v ?? '').replace(/\D/g, '').slice(0, 8)
  if (x.length <= 2) return x
  if (x.length <= 4) return `${x.slice(0, 2)}/${x.slice(2)}`
  return `${x.slice(0, 2)}/${x.slice(2, 4)}/${x.slice(4)}`
}
const dataBRParaISO = v => {
  const x = String(v ?? '').replace(/\D/g, '')
  if (x.length !== 8) return ''
  const [d, m, a] = [x.slice(0, 2), x.slice(2, 4), x.slice(4, 8)]
  const dt = new Date(Number(a), Number(m) - 1, Number(d))
  if (dt.getFullYear() !== Number(a) || dt.getMonth() !== Number(m) - 1 || dt.getDate() !== Number(d)) return ''
  return `${a}-${m}-${d}`
}
const addDiasISO = (iso, dias) => {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + (Number(dias) || 0))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const diasEntre = (inicio, fim) => {
  if (!inicio || !fim) return 0
  const a = new Date(`${toDateInput(inicio)}T00:00:00`)
  const b = new Date(`${toDateInput(fim)}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.max(0, Math.round((b - a) / 86400000))
}

const nomeFornecedor = f => f?.fornecedor || f?.nomeFantasia || f?.razaoSocial || f?.nome || ''

const mesmaConta = (a, b) =>
  String(a.notaNumero) === String(b.notaNumero) &&
  String(a.notaModelo) === String(b.notaModelo) &&
  String(a.notaSerie) === String(b.notaSerie) &&
  Number(a.codForn) === Number(b.codForn)

const situacaoDe = r => {
  const situacao = String(r.situacao ?? '').toUpperCase()
  const valorOriginal = Number(r.valorOriginal) || 0
  const valorPago = Number(r.valorPago) || 0

  if (situacao === 'CANCELADA') return 'CANCELADA'
  if (situacao === 'PAGA' || (valorOriginal > 0 && valorPago >= valorOriginal)) return 'PAGA'
  if (situacao === 'PARCIAL' || (valorPago > 0 && valorPago < valorOriginal)) return 'PARCIAL'
  if (situacao === 'VENCIDA') return 'VENCIDA'

  const vencimento = toDateInput(r.dataVencimento)
  if (vencimento && vencimento < hojeISO()) return 'VENCIDA'

  return 'PENDENTE'
}

/**
 * Cálculo do pagamento — mesma regra do servidor (PagarAsync):
 * em atraso: multa (uma vez) + juros proporcionais aos dias (percentual ao mês);
 * no prazo: desconto. Os percentuais vêm da condição de pagamento, gravados na parcela.
 */
const calcularPagamento = (conta, dataPagamento) => {
  const original = Number(conta?.valorOriginal) || 0
  const pDesc = Number(conta?.percentualDesconto) || 0
  const pJuros = Number(conta?.percentualJuros) || 0
  const pMulta = Number(conta?.percentualMulta) || 0

  const vencimento = toDateInput(conta?.dataVencimento)
  const diasAtraso = diasEntre(vencimento, dataPagamento)
  const diasAntecipacao = diasEntre(dataPagamento, vencimento)
  const atrasado = diasAtraso > 0

  const desconto = atrasado ? 0 : arred2(original * pDesc / 100)
  const multa = atrasado ? arred2(original * pMulta / 100) : 0
  const juros = atrasado ? arred2(original * pJuros / 100 * diasAtraso / 30) : 0
  const valorFinal = arred2(original - desconto + juros + multa)

  return { original, desconto, juros, multa, valorFinal, diasAtraso, diasAntecipacao, atrasado, pDesc, pJuros, pMulta }
}

/* ---------- componentes locais (mesmo padrão das outras telas) ---------- */

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

const ModalHeader = ({ title, onClose }) => (
  <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
  </div>
)

const BtnPrimary = ({ onClick, disabled, children, style }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: disabled ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: disabled ? .7 : 1, whiteSpace: 'nowrap', ...style }}>
    {children}
  </button>
)

const BtnSecondary = ({ onClick, disabled, children }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8, background: 'transparent', cursor: disabled ? 'default' : 'pointer', fontSize: 13, color: '#475569' }}>
    {children}
  </button>
)

const BtnPesquisar = ({ onClick, disabled }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: disabled ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, background: disabled ? '#f1f4f8' : '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: disabled ? '#94a3b8' : '#0f172a' }}>
    Pesquisar
  </button>
)

const LookupField = ({ label, value, onSearch, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="text" readOnly value={value} style={{ ...inp, flex: 1, background: dis(disabled, 'background') }} />
      <BtnPesquisar onClick={onSearch} disabled={disabled} />
    </div>
  </div>
)

const NumberField = ({ label, value, onChange, step = '0.01', min, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="number" step={step} min={min} disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      onFocus={e => { fo(e); e.target.select() }} onBlur={bl}
      style={{ ...inp, background: dis(disabled, 'background'), color: dis(disabled, 'color') }} />
  </div>
)

const DateField = ({ label, value, onChange, disabled, style }) => {
  const [display, setDisplay] = useState(formatarDataBR(value))
  useEffect(() => { setDisplay(formatarDataBR(value)) }, [value])

  return (
    <div style={style}>
      <label style={lbl}>{label}</label>
      <input type="text" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10}
        value={display} disabled={disabled}
        onChange={e => {
          const digitado = parseDataBR(e.target.value)
          setDisplay(digitado)
          const iso = dataBRParaISO(digitado)
          if (iso) onChange(iso)
          if (!digitado) onChange('')
        }}
        onBlur={e => {
          bl(e)
          const iso = dataBRParaISO(e.target.value)
          if (iso) { setDisplay(formatarDataBR(iso)); onChange(iso) }
          else if (!e.target.value) onChange('')
        }}
        onFocus={fo}
        style={{ ...inp, background: dis(disabled, 'background'), color: dis(disabled, 'color') }} />
    </div>
  )
}

const SelectField = ({ label, value, onChange, options, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ ...inp, background: dis(disabled, 'background'), color: dis(disabled, 'color') }} onFocus={fo} onBlur={bl}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const TextAreaField = ({ label, value, onChange, rows = 2, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ ...inp, resize: 'vertical', background: dis(disabled, 'background'), color: dis(disabled, 'color') }} onFocus={fo} onBlur={bl} />
  </div>
)

const ReadOnlyField = ({ label, value, style, bold }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ ...inp, background: '#eef2f7', fontWeight: bold ? 700 : 400, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
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
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map(c => (
                <td key={c.key} style={{ ...tdStyle, fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                  {String(row[c.key] ?? '')}
                </td>
              ))}
              <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                <button onClick={() => onSelect(row)}
                  style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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

const BADGES = {
  PAGA: { label: 'Paga', bg: '#ecfdf5', color: '#047857' },
  VENCIDA: { label: 'Vencida', bg: '#fef2f2', color: '#b91c1c' },
  PARCIAL: { label: 'Parcial', bg: '#eff6ff', color: '#2563eb' },
  CANCELADA: { label: 'Cancelada', bg: '#f1f5f9', color: '#64748b' },
  PENDENTE: { label: 'Pendente', bg: '#fff7ed', color: '#c2410c' },
}

const SituacaoBadge = ({ situacao }) => {
  const b = BADGES[situacao] ?? BADGES.PENDENTE
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 7, background: b.bg, color: b.color, fontSize: 12, fontWeight: 600 }}>
      {b.label}
    </span>
  )
}

const ValorCard = ({ label, valor, cor, detalhe }) => (
  <div style={{ padding: '12px 13px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#f8f9fb' }}>
    <div style={lbl}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: cor, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(valor)}</div>
    <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>{detalhe}</div>
  </div>
)

/* ---------- constantes ---------- */

const FORM_EMPTY = {
  notaNumero: '', notaModelo: '', notaSerie: '', codForn: null,
  dataEmissao: hojeISO(), valorOriginal: '',
  codCondicao: null, observacoes: '', parcelasGeradas: [],
}

const colsFornecedores = [
  { key: 'codForn', label: 'Cód.', mono: true },
  { key: 'fornecedor', label: 'Fornecedor' },
]

const colsCondicoes = [
  { key: 'codCondicao', label: 'Cód.', mono: true },
  { key: 'condicaoPagamento', label: 'Descrição' },
]

/* ---------- página ---------- */

export default function ContasPagarAvulsaPage() {
  const { data, loading, load } = useCrud(contasAvsApi)

  const [fornecedores, setFornecedores] = useState([])
  const [formas, setFormas] = useState([])
  const [condicoes, setCondicoes] = useState([])

  const [form, setForm] = useState(FORM_EMPTY)
  const [originalForm, setOriginalForm] = useState(FORM_EMPTY)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [openFornecedores, setOpenFornecedores] = useState(false)
  const [openCondicoes, setOpenCondicoes] = useState(false)

  const [contaPagamento, setContaPagamento] = useState(null)
  const [pagamento, setPagamento] = useState({ dataPagamento: hojeISO(), codFormaPagamento: '' })
  const [contaCancelar, setContaCancelar] = useState(null)

  const [search, setSearch] = useState('')
  const [filtroFornecedor, setFiltroFornecedor] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('')
  const [filtroVencimentoInicial, setFiltroVencimentoInicial] = useState('')
  const [filtroVencimentoFinal, setFiltroVencimentoFinal] = useState('')

  useEffect(() => {
    fornecedoresApi.getAll().then(r => setFornecedores(r ?? [])).catch(() => toast.error('Erro ao carregar fornecedores.'))
    formaPagamentosApi.getAll().then(r => setFormas(r ?? [])).catch(() => toast.error('Erro ao carregar formas de pagamento.'))
    condicoesApi.getAll().then(r => setCondicoes(r ?? [])).catch(() => toast.error('Erro ao carregar condições de pagamento.'))
  }, [])

  /* ----- cadastro ----- */

  const fornecedorLabel = nomeFornecedor(fornecedores.find(f => Number(f.codForn) === Number(form.codForn)))
  const condicaoSelecionada = condicoes.find(c => String(c.codCondicao) === String(form.codCondicao))
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? ''
  const temParcelas = form.parcelasGeradas.length > 0

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updInvalidando = (k, v) => setForm(p => ({ ...p, [k]: v, parcelasGeradas: [] }))
  const updParcela = (i, campo, valor) =>
    setForm(f => ({ ...f, parcelasGeradas: f.parcelasGeradas.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p) }))

  const abrirNova = () => {
    const novo = { ...FORM_EMPTY, dataEmissao: hojeISO() }
    setForm(novo); setOriginalForm(novo); setOpen(true)
  }

  const gerarParcelas = async () => {
    const base = Number(form.valorOriginal) || 0
    if (!form.codCondicao) { toast.error('Selecione uma Condição de Pagamento.'); return }
    if (base <= 0) { toast.error('Informe o Valor Original antes de gerar as parcelas.'); return }
    if (!form.dataEmissao) { toast.error('Informe a Data de Emissão antes de gerar as parcelas.'); return }

    let condicao = condicaoSelecionada
    let configuradas = condicao?.parcelas ?? condicao?.Parcelas ?? []

    if (configuradas.length === 0) {
      try {
        const d = await condicoesApi.getOne(form.codCondicao)
        condicao = d ?? condicao
        configuradas = d?.parcelas ?? d?.Parcelas ?? []
      } catch {
        toast.error('Não foi possível carregar as parcelas da condição de pagamento.')
        return
      }
    }
    if (configuradas.length === 0) { toast.error('A condição de pagamento não possui parcelas cadastradas.'); return }

    // juros, multa e desconto: sempre da condição de pagamento
    const regras = {
      percentualJuros: Number(condicao?.percentualJuros ?? condicaoSelecionada?.percentualJuros) || 0,
      percentualMulta: Number(condicao?.percentualMultas ?? condicao?.percentualMulta ?? condicaoSelecionada?.percentualMultas ?? condicaoSelecionada?.percentualMulta) || 0,
      percentualDesconto: Number(condicao?.percentualDesconto ?? condicaoSelecionada?.percentualDesconto) || 0,
    }

    const geradas = configuradas.map(p => ({
      numeroParcela: p.numeroParcela ?? p.NumeroParcela,
      vencimento: addDiasISO(form.dataEmissao, p.dias ?? p.Dias),
      valor: arred2(base * (Number(p.percentual ?? p.Percentual) || 0) / 100),
      codFormaPagamento: p.codFormaPagamento ?? p.CodFormaPagamento ?? null,
      ...regras,
    }))
    const diferenca = arred2(base - geradas.reduce((s, p) => s + p.valor, 0))
    if (diferenca !== 0) geradas[geradas.length - 1].valor = arred2(geradas[geradas.length - 1].valor + diferenca)

    upd('parcelasGeradas', geradas)
  }

  const save = async () => {
    const parcelas = form.parcelasGeradas

    if (!form.codForn) { toast.error('Selecione o fornecedor.'); return }
    if (!form.notaNumero || !form.notaModelo || !form.notaSerie) { toast.error('Informe número, modelo e série da nota.'); return }
    if (!Number(form.valorOriginal) || Number(form.valorOriginal) <= 0) { toast.error('Informe o valor original.'); return }
    if (!form.dataEmissao) { toast.error('Informe a data de emissão.'); return }
    if (!form.codCondicao) { toast.error('Selecione a condição de pagamento.'); return }
    if (parcelas.length === 0) { toast.error('Clique em "Gerar Parcelas" antes de salvar.'); return }
    if (parcelas.some(p => !p.vencimento)) { toast.error('Informe o vencimento de todas as parcelas.'); return }
    if (parcelas.some(p => p.vencimento < form.dataEmissao)) { toast.error('Nenhum vencimento pode ser anterior à emissão.'); return }

    const soma = arred2(parcelas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0))
    if (soma !== arred2(Number(form.valorOriginal))) {
      toast.error(`A soma das parcelas (${fmtMoney(soma)}) deve ser igual ao Valor Original (${fmtMoney(form.valorOriginal)}).`)
      return
    }

    let atual = null
    setSaving(true)
    try {
      for (const p of parcelas) {
        atual = p.numeroParcela
        await contasAvsApi.create({
          notaNumero: String(form.notaNumero),
          notaModelo: String(form.notaModelo),
          notaSerie: String(form.notaSerie),
          codForn: Number(form.codForn),
          numeroParcela: Number(p.numeroParcela),
          totalParcelas: parcelas.length,
          valorOriginal: Number(p.valor) || 0,
          valorTotal: Number(p.valor) || 0,
          valorPago: 0, valorJuros: 0, valorMulta: 0, valorDesconto: 0,
          percentualJuros: Number(p.percentualJuros) || 0,
          percentualMulta: Number(p.percentualMulta) || 0,
          percentualDesconto: Number(p.percentualDesconto) || 0,
          dataEmissao: form.dataEmissao,
          dataVencimento: p.vencimento,
          dataPagamento: null,
          codFormaPagamento: p.codFormaPagamento ? Number(p.codFormaPagamento) : null,
          codCondicao: Number(form.codCondicao),
          situacao: 'PENDENTE',
          observacoes: form.observacoes?.trim() || null,
        })
      }
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch (error) {
      const msg = error?.response?.data || error?.message
      const base = typeof msg === 'string' && msg ? msg : 'Erro ao salvar.'
      toast.error(atual ? `Parcela ${atual}: ${base}` : base)
      if (atual) load()
    } finally {
      setSaving(false)
    }
  }

  /* ----- pagar ----- */

  const abrirPagamento = conta => {
    if (situacaoDe(conta) === 'PAGA') { toast.error('Esta parcela já foi paga.'); return }
    setContaPagamento(conta)
    setPagamento({ dataPagamento: hojeISO(), codFormaPagamento: conta.codFormaPagamento ?? '' })
  }

  const calc = useMemo(
    () => calcularPagamento(contaPagamento, pagamento.dataPagamento),
    [contaPagamento, pagamento.dataPagamento]
  )

  const confirmarPagamento = async () => {
    if (!contaPagamento) return
    if (!pagamento.dataPagamento) { toast.error('Informe a data do pagamento.'); return }
    if (pagamento.dataPagamento > hojeISO()) { toast.error('A data do pagamento não pode ser futura.'); return }
    if (pagamento.dataPagamento < toDateInput(contaPagamento.dataEmissao)) { toast.error('A data do pagamento não pode ser anterior à emissão.'); return }
    if (!pagamento.codFormaPagamento) { toast.error('Selecione a forma de pagamento.'); return }
    if (calc.valorFinal <= 0) { toast.error('O valor final do pagamento deve ser maior que zero.'); return }

    const c = contaPagamento
    setSaving(true)
    try {
      const response = await fetch(
        `${API}/pagar/${encodeURIComponent(c.notaNumero)}/${encodeURIComponent(c.notaModelo)}/${encodeURIComponent(c.notaSerie)}/${c.codForn}/${c.numeroParcela}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataPagamento: pagamento.dataPagamento,
            codFormaPagamento: Number(pagamento.codFormaPagamento),
          }),
        }
      )
      if (!response.ok) throw new Error((await response.text()) || 'Erro ao registrar o pagamento.')

      toast.success('Pagamento registrado!')
      setContaPagamento(null)
      await load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao registrar o pagamento.')
    } finally {
      setSaving(false)
    }
  }

  /* ----- cancelar (conta inteira) ----- */

  const pedirCancelamento = conta => {
    const parcelasDaConta = data.filter(r => mesmaConta(r, conta))
    if (parcelasDaConta.some(r => situacaoDe(r) === 'PAGA' || Number(r.valorPago) > 0)) {
      toast.error('Não é possível cancelar: existe parcela paga nesta conta.')
      return
    }
    setContaCancelar(conta)
  }

  const confirmarCancelamento = async () => {
    if (!contaCancelar) return
    const c = contaCancelar
    setSaving(true)
    try {
      const response = await fetch(
        `${API}/cancelar/${encodeURIComponent(c.notaNumero)}/${encodeURIComponent(c.notaModelo)}/${encodeURIComponent(c.notaSerie)}/${c.codForn}`,
        { method: 'PUT' }
      )
      if (!response.ok) throw new Error((await response.text()) || 'Erro ao cancelar a conta.')

      toast.success('Conta cancelada.')
      setContaCancelar(null)
      await load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao cancelar a conta.')
    } finally {
      setSaving(false)
    }
  }

  /* ----- listagem ----- */

  const nomeDoFornecedor = r =>
    r.fornecedor?.fornecedor ||
    nomeFornecedor(fornecedores.find(f => Number(f.codForn) === Number(r.codForn))) ||
    `Fornecedor #${r.codForn}`

  const fornecedoresFiltro = useMemo(() => {
    const mapa = new Map()
    data.forEach(r => { if (r.codForn && !mapa.has(r.codForn)) mapa.set(r.codForn, nomeDoFornecedor(r)) })
    return [...mapa.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'pt-BR'))
  }, [data, fornecedores])

  const dataFiltrada = useMemo(() => {
    const termo = search.trim().toLowerCase()

    return data.filter(r => {
      const texto = [r.notaNumero, r.notaModelo, r.notaSerie, r.codForn, nomeDoFornecedor(r), r.numeroParcela, r.totalParcelas, r.situacao]
        .join(' ').toLowerCase()

      if (termo && !texto.includes(termo)) return false
      if (filtroFornecedor && String(r.codForn) !== String(filtroFornecedor)) return false
      if (filtroSituacao && situacaoDe(r) !== filtroSituacao) return false

      const vencimento = toDateInput(r.dataVencimento)
      if (filtroVencimentoInicial && vencimento < filtroVencimentoInicial) return false
      if (filtroVencimentoFinal && vencimento > filtroVencimentoFinal) return false

      return true
    })
  }, [data, fornecedores, search, filtroFornecedor, filtroSituacao, filtroVencimentoInicial, filtroVencimentoFinal])

  const filtrosAtivos = Boolean(search || filtroFornecedor || filtroSituacao || filtroVencimentoInicial || filtroVencimentoFinal)
  const limparFiltros = () => {
    setSearch(''); setFiltroFornecedor(''); setFiltroSituacao('')
    setFiltroVencimentoInicial(''); setFiltroVencimentoFinal('')
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const row = { padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }
  const formaOptions = [
    { value: '', label: 'Selecione...' },
    ...formas.map(f => ({ value: f.codFormaPagamento ?? f.id, label: f.formaPagamento || f.nome || f.descricao })),
  ]
  const nomeForma = cod => {
    const f = formas.find(x => String(x.codFormaPagamento ?? x.id) === String(cod))
    return f?.formaPagamento || f?.nome || (cod ? `#${cod}` : '-')
  }

  return (
    <div>
      <PageHeader title="Contas a Pagar Avulsas" sub="Contas a pagar sem vínculo com Nota de Entrada" label="Nova Conta" onNew={abrirNova} disabled={open} />

      <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e6ed' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px', minWidth: 220 }}>
              <label style={lbl}>Pesquisar</label>
              <input placeholder="Nota, fornecedor, parcela..." value={search} onChange={e => setSearch(e.target.value)}
                style={inp} onFocus={fo} onBlur={bl} />
            </div>

            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <label style={lbl}>Fornecedor</label>
              <select value={filtroFornecedor} onChange={e => setFiltroFornecedor(e.target.value)} style={inp}>
                <option value="">Todos os fornecedores</option>
                {fornecedoresFiltro.map(([cod, nome]) => <option key={cod} value={cod}>{nome}</option>)}
              </select>
            </div>

            <div style={{ flex: '1 1 170px', minWidth: 160 }}>
              <label style={lbl}>Situação</label>
              <select value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value)} style={inp}>
                <option value="">Todas</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="PARCIAL">Parciais</option>
                <option value="PAGA">Pagas</option>
                <option value="VENCIDA">Vencidas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>

            <div style={{ flex: '0 1 150px', minWidth: 140 }}>
              <label style={lbl}>Vencimento inicial</label>
              <input type="date" value={filtroVencimentoInicial} onChange={e => setFiltroVencimentoInicial(e.target.value)} style={inp} />
            </div>

            <div style={{ flex: '0 1 150px', minWidth: 140 }}>
              <label style={lbl}>Vencimento final</label>
              <input type="date" value={filtroVencimentoFinal} onChange={e => setFiltroVencimentoFinal(e.target.value)} style={inp} />
            </div>

            {filtrosAtivos && (
              <button onClick={limparFiltros}
                style={{ padding: '9px 13px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Limpar filtros
              </button>
            )}
          </div>

          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#64748b', fontSize: 11 }}>Filtre por fornecedor, situação ou período de vencimento.</span>
            <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              {dataFiltrada.length} de {data.length} registro(s)
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                <th style={{ ...thStyle, textAlign: 'right' }}>Modelo</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Série</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Número</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ID Fornecedor</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Fornecedor</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Parcela</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Vencimento</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Situação</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Carregando...</td></tr>
              ) : dataFiltrada.length === 0 ? (
                <tr><td colSpan="10" style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Nenhuma conta a pagar avulsa encontrada.</td></tr>
              ) : dataFiltrada.map(r => {
                const situacao = situacaoDe(r)
                const paga = situacao === 'PAGA'
                const cancelada = situacao === 'CANCELADA'
                const mono = { ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }

                return (
                  <tr key={`${r.notaNumero}-${r.notaSerie}-${r.notaModelo}-${r.codForn}-${r.numeroParcela}`} style={{ borderBottom: '1px solid #f1f4f8' }}>
                    <td style={mono}>{r.notaModelo}</td>
                    <td style={mono}>{r.notaSerie}</td>
                    <td style={mono}>{r.notaNumero}</td>
                    <td style={mono}>{r.codForn}</td>
                    <td style={{ ...tdStyle, textAlign: 'left' }}>{nomeDoFornecedor(r)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{r.numeroParcela}/{r.totalParcelas}</td>
                    <td style={{ ...mono, fontWeight: 600 }}>{fmtMoney(paga ? r.valorPago : r.valorTotal)}</td>
                    <td style={mono}>{formatarDataBR(r.dataVencimento) || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}><SituacaoBadge situacao={situacao} /></td>

                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                      {cancelada ? (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>Cancelada</span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {paga ? (
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>Pago em {formatarDataBR(r.dataPagamento) || '-'}</span>
                          ) : (
                            <button onClick={() => abrirPagamento(r)}
                              style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Pagar
                            </button>
                          )}
                          <button onClick={() => pedirCancelamento(r)}
                            style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: '#e2e6ed', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- cadastro ---------- */}
      <Modal open={open}
        title="Nova Conta a Pagar Avulsa"
        editing={false}
        onClose={() => setOpen(false)}
        onSave={save} wide maxWidth={1200}
        isDirty={isDirty}
        suspended={openFornecedores || openCondicoes}>

        <div style={row}>
          <FField label="Modelo" value={form.notaModelo} onChange={v => upd('notaModelo', v)} style={{ flex: '0 0 80px' }} />
          <FField label="Série" value={form.notaSerie} onChange={v => upd('notaSerie', v)} style={{ flex: '0 0 70px' }} />
          <FField label="Número" value={form.notaNumero} onChange={v => upd('notaNumero', v)} style={{ flex: '0 0 110px' }} />
          <div style={{ flex: '0 0 105px' }}>
            <label style={lbl}>Código</label>
            <input type="text" value={form.codForn ?? ''} readOnly
              style={{ ...inp, background: '#eef2f7', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }} />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <LookupField label="Fornecedor *" value={fornecedorLabel} onSearch={() => setOpenFornecedores(true)} />
          </div>
        </div>

        <div style={row}>
          <DateField label="Data Emissão" value={form.dataEmissao} onChange={v => updInvalidando('dataEmissao', v)} style={{ flex: '0 0 150px' }} />
          <NumberField label="Valor Original (total)" value={form.valorOriginal} onChange={v => updInvalidando('valorOriginal', v)} min="0" style={{ flex: '0 0 190px' }} />
          <LookupField label="Condição de Pagamento *" value={condicaoLabel} onSearch={() => setOpenCondicoes(true)} style={{ flex: '1 1 300px' }} />
          <BtnPrimary onClick={gerarParcelas} disabled={!form.codCondicao}>Gerar Parcelas</BtnPrimary>
        </div>

        {temParcelas && (
          <div style={{ padding: '16px 24px 0' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                    <th style={thStyle}>Parcela</th>
                    <th style={thStyle}>Vencimento</th>
                    <th style={thStyle}>Percentual</th>
                    <th style={thStyle}>Valor</th>
                    <th style={thStyle}>Forma de Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {form.parcelasGeradas.map((p, i) => {
                    const pct = Number(form.valorOriginal) > 0 ? (Number(p.valor) || 0) / Number(form.valorOriginal) * 100 : 0
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{p.numeroParcela}/{form.parcelasGeradas.length}</td>
                        <td style={{ ...tdStyle, padding: '6px 14px' }}>
                          <input type="date" value={toDateInput(p.vencimento)} min={form.dataEmissao}
                            onChange={e => updParcela(i, 'vencimento', e.target.value)}
                            style={{ ...inp, padding: '6px 8px' }} onFocus={fo} onBlur={bl} />
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>
                          {pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </td>
                        <td style={{ ...tdStyle, padding: '6px 14px' }}>
                          <input type="number" step="0.01" min="0" value={p.valor ?? ''}
                            onChange={e => updParcela(i, 'valor', e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={e => { fo(e); e.target.select() }} onBlur={bl}
                            style={{ ...inp, padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }} />
                        </td>
                        <td style={tdStyle}>{nomeForma(p.codFormaPagamento)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
              Regras da condição, aplicadas no pagamento: desconto {(form.parcelasGeradas[0]?.percentualDesconto ?? 0).toFixed(2)}% ·
              juros {(form.parcelasGeradas[0]?.percentualJuros ?? 0).toFixed(2)}% ao mês ·
              multa {(form.parcelasGeradas[0]?.percentualMulta ?? 0).toFixed(2)}%.
            </div>
          </div>
        )}

        <div style={{ padding: '14px 24px 20px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} />
        </div>
      </Modal>

      {/* ---------- pagamento ---------- */}
      {contaPagamento && (
        <Overlay onClose={() => !saving && setContaPagamento(null)}>
          <ModalBox maxWidth={620}>
            <ModalHeader title="Registrar Pagamento" onClose={() => !saving && setContaPagamento(null)} />

            <div style={{ padding: '18px 24px', overflowY: 'auto' }}>
              <div style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 9, padding: 14, marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                {[
                  ['Fornecedor', nomeDoFornecedor(contaPagamento)],
                  ['Modelo', contaPagamento.notaModelo],
                  ['Série', contaPagamento.notaSerie],
                  ['Número', contaPagamento.notaNumero],
                  ['Parcela', `${contaPagamento.numeroParcela}/${contaPagamento.totalParcelas}`],
                  ['Vencimento', formatarDataBR(contaPagamento.dataVencimento)],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={lbl}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <ReadOnlyField label="Valor Original" value={fmtMoney(calc.original)} style={{ flex: '1 1 180px' }} />
                <DateField label="Data Pagamento" value={pagamento.dataPagamento}
                  onChange={v => setPagamento(p => ({ ...p, dataPagamento: v }))} style={{ flex: '1 1 180px' }} />
              </div>

              <SelectField label="Forma de Pagamento *" value={pagamento.codFormaPagamento}
                onChange={v => setPagamento(p => ({ ...p, codFormaPagamento: v }))}
                options={formaOptions} style={{ marginTop: 14 }} />

              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <ValorCard label="Desconto" valor={calc.desconto} cor="#047857" detalhe={`${calc.pDesc.toFixed(2)}%`} />
                <ValorCard label="Juros" valor={calc.juros} cor="#c2410c" detalhe={`${calc.pJuros.toFixed(2)}% ao mês`} />
                <ValorCard label="Multa" valor={calc.multa} cor="#b91c1c" detalhe={`${calc.pMulta.toFixed(2)}%`} />
              </div>

              {calc.atrasado ? (
                <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid #fed7aa', borderRadius: 8, background: '#fff7ed' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#c2410c' }}>Pagamento em atraso</div>
                  <div style={{ marginTop: 5, fontSize: 11, color: '#9a3412' }}>
                    Pagamento {calc.diasAtraso} dia(s) após o vencimento. A multa é aplicada uma vez e os juros são proporcionais aos dias de atraso.
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid #bbf7d0', borderRadius: 8, background: '#f0fdf4' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>Pagamento dentro do prazo</div>
                  <div style={{ marginTop: 5, fontSize: 11, color: '#166534' }}>
                    {calc.diasAntecipacao > 0
                      ? `Pagamento ${calc.diasAntecipacao} dia(s) antes do vencimento. O desconto da condição foi aplicado automaticamente.`
                      : 'Pagamento no dia do vencimento. O desconto da condição foi aplicado automaticamente.'}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 9, background: '#eff6ff', border: '1px solid #dbeafe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Valor a Pagar</span>
                  <strong style={{ fontSize: 18, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(calc.valorFinal)}</strong>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
                  {calc.atrasado ? 'Original + juros + multa.' : 'Original − desconto.'}
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e6ed', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <BtnSecondary onClick={() => setContaPagamento(null)} disabled={saving}>Cancelar</BtnSecondary>
              <BtnPrimary onClick={confirmarPagamento} disabled={saving} style={{ padding: '8px 22px' }}>
                {saving ? 'Registrando...' : 'Confirmar pagamento'}
              </BtnPrimary>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ---------- consultas ---------- */}
      {openFornecedores && (
        <Overlay onClose={() => setOpenFornecedores(false)} zIndex={60}>
          <ModalBox maxWidth={640}>
            <ModalHeader title="Consulta de Fornecedores" onClose={() => setOpenFornecedores(false)} />
            <LookupTable cols={colsFornecedores} rows={fornecedores}
              onSelect={r => { upd('codForn', r.codForn); setOpenFornecedores(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {openCondicoes && (
        <Overlay onClose={() => setOpenCondicoes(false)} zIndex={60}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Condições de Pagamento" onClose={() => setOpenCondicoes(false)} />
            <LookupTable cols={colsCondicoes} rows={condicoes}
              onSelect={r => { setForm(f => ({ ...f, codCondicao: r.codCondicao, parcelasGeradas: [] })); setOpenCondicoes(false) }} />
          </ModalBox>
        </Overlay>
      )}

      <ConfirmDialog
        open={!!contaCancelar}
        icon="❓" title="Cancelar Conta a Pagar Avulsa"
        message={contaCancelar
          ? `Todas as parcelas da nota ${contaCancelar.notaNumero}/${contaCancelar.notaSerie} (modelo ${contaCancelar.notaModelo}) serão canceladas. Deseja continuar?`
          : ''}
        confirmLabel="Cancelar conta" confirmColor="#dc2626"
        onClose={() => !saving && setContaCancelar(null)}
        onConfirm={confirmarCancelamento}
      />
    </div>
  )
}