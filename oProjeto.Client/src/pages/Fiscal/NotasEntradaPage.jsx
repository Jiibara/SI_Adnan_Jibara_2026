import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import {
  notasEntradaApi, fornecedoresApi, condicoesApi, transportadoresApi, produtosApi,
  cidadesApi, estadosApi, paisesApi, marcasApi, categoriasApi, formaPagamentosApi,
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
const getDescontoItem = it => Number(it?.descontoValor ?? it?.desconto ?? 0) || 0
const toDateInput = v => v ? String(v).slice(0, 10) : ''
const hojeISO = () => {
  const d = new Date()
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
const formatarDataBR = v => {
  const iso = toDateInput(v)
  if (!iso || iso.length !== 10) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
const parseDataBR = v => {
  const digits = String(v ?? '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
const dataBRParaISO = v => {
  const digits = String(v ?? '').replace(/\D/g, '')
  if (digits.length !== 8) return ''
  const dia = digits.slice(0, 2)
  const mes = digits.slice(2, 4)
  const ano = digits.slice(4, 8)
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia))
  if (d.getFullYear() !== Number(ano) || d.getMonth() !== Number(mes) - 1 || d.getDate() !== Number(dia)) return ''
  return `${ano}-${mes}-${dia}`
}

const chaveNota = (numero, modelo, serie, codForn) => `${numero}/${modelo}/${serie}/${codForn}`

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
      <input type="text" readOnly value={value} style={{ ...inp, flex: 1, background: disabled ? '#f1f4f8' : inp.background }} />
      <BtnPesquisar onClick={onSearch} disabled={disabled} />
    </div>
  </div>
)

const Inp = ({ label, value, onChange, maxLength, placeholder, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
  </div>
)

const NumberField = ({ label, value, onChange, step = '1', min, disabled, style, warning }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="number" step={step} min={min} disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      onFocus={e => { fo(e); e.target.select() }}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color, borderColor: warning ? '#f59e0b' : inp.border }}
      onBlur={bl} />
    {warning && (
      <div style={{ fontSize: 11, color: '#b45309', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
        ⚠ {warning}
      </div>
    )}
  </div>
)

const DateField = ({ label, value, onChange, disabled, style }) => {
  const [display, setDisplay] = useState(formatarDataBR(value))

  useEffect(() => {
    setDisplay(formatarDataBR(value))
  }, [value])

  return (
    <div style={style}>
      <label style={lbl}>{label}</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={display}
        disabled={disabled}
        maxLength={10}
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
          if (iso) {
            setDisplay(formatarDataBR(iso))
            onChange(iso)
          } else if (!e.target.value) {
            onChange('')
          }
        }}
        onFocus={fo}
        style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color }}
      />
    </div>
  )
}

const SelectField = ({ label, value, onChange, options, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color }} onFocus={fo} onBlur={bl}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

const TextAreaField = ({ label, value, onChange, rows = 2, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ ...inp, resize: 'vertical', fontFamily: 'Outfit, sans-serif', background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color }} onFocus={fo} onBlur={bl} />
  </div>
)

const ReadOnlyField = ({ label, value, style, bold }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ ...inp, background: '#eef2f7', color: '#0f172a', fontWeight: bold ? 700 : 400, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
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

const addDias = (dataStr, dias) => {
  if (!dataStr) return null
  const d = new Date(`${dataStr}T00:00:00`)
  d.setDate(d.getDate() + (Number(dias) || 0))
  return d
}

const ParcelasGridEditavel = ({ parcelas, valorTotalNota, onChangeParcela, condicaoLabel, condicaoSelecionada, onOpenCondicoes, onGerarParcelas, disabled }) => (
  <div style={{ padding: '4px 24px 20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 16 }}>
      <label style={{ ...lbl, marginBottom: 0 }}>Parcelas {condicaoLabel ? `— ${condicaoLabel}` : ''}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 300 }}>
          <LookupField label="" value={condicaoLabel} onSearch={onOpenCondicoes} disabled={disabled} />
        </div>
        <BtnPrimary onClick={onGerarParcelas} disabled={disabled || !condicaoSelecionada} style={{ whiteSpace: 'nowrap' }}>Gerar Parcelas</BtnPrimary>
      </div>
    </div>
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
          {parcelas.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>
              Selecione uma Condição de Pagamento e clique em "Gerar Parcelas".
            </td></tr>
          )}
          {parcelas.map((p, i) => {
            const percentual = Number(valorTotalNota) > 0 ? (Number(p.valor) || 0) / Number(valorTotalNota) * 100 : 0
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{p.numeroParcela}</td>
                <td style={{ ...tdStyle, padding: '6px 14px' }}>
                  <input type="date" value={toDateInput(p.vencimento)}
                    onChange={e => onChangeParcela(i, 'vencimento', e.target.value)}
                    style={{ ...inp, padding: '6px 8px', fontSize: 13 }} onFocus={fo} onBlur={bl} />
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>
                  {percentual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </td>
                <td style={{ ...tdStyle, padding: '6px 14px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={p.valor ?? ''}
                    onChange={e => onChangeParcela(i, 'valor', e.target.value === '' ? '' : e.target.value)}
                    onFocus={e => { fo(e); e.target.select() }}
                    onBlur={e => {
                      bl(e);
                      if (p.valor !== '' && p.valor !== undefined && p.valor !== null) {
                        const parsed = parseFloat(p.valor);
                        if (!isNaN(parsed)) {
                          onChangeParcela(i, 'valor', Number(parsed.toFixed(2)));
                        }
                      }
                    }}
                    style={{ ...inp, padding: '6px 8px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </td>
                <td style={tdStyle}>{p.formaNome || `#${p.codFormaPagamento}`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)

const ItemsList = ({ items, onRemove, onChangeQuantidade, disabled }) => (
  <div style={{ padding: '0 0px 20px' }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            <th style={thStyle}>Produto</th>
            <th style={thStyle}>Unid.</th>
            <th style={thStyle}>Comprada</th>
            <th style={thStyle}>Já Recebida</th>
            <th style={thStyle}>Recebida</th>
            <th style={thStyle}>Falta</th>
            <th style={thStyle}>Vlr. Unit.</th>
            <th style={thStyle}>Vlr. Total</th>
            <th style={thStyle}>Desconto</th>
            <th style={thStyle}>Rateio</th>
            <th style={thStyle}>Custo Final (unit.)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={12} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Nenhum item adicionado.</td></tr>
          )}
          {items.map((it, i) => {
            const rateioTotal = (Number(it.rateioFrete) || 0) + (Number(it.rateioSeguro) || 0) + (Number(it.rateioOutras) || 0)
            const rateioTitle = `Frete: ${fmtMoney(it.rateioFrete)} · Seguro: ${fmtMoney(it.rateioSeguro)} · Outras: ${fmtMoney(it.rateioOutras)}`
            const descontoItem = getDescontoItem(it)
            const descontoExcede = Number(it.valorTotal) > 0 && descontoItem >= Number(it.valorTotal)
            const falta = it.quantidadePendente != null
              ? Math.max((Number(it.quantidadePendente) || 0) - (Number(it.quantidade) || 0), 0)
              : null
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                <td style={tdStyle}>{it.produtoNome || `Produto #${it.codProd}`}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.unidade || '-'}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.quantidadeComprada ?? '-'}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.quantidadeRecebidaAnterior ?? 0}</td>
                <td style={{ ...tdStyle, padding: '6px 14px' }}>
                  <input type="number" step="0.001" min="0" max={it.quantidadePendente ?? undefined}
                    value={it.quantidade ?? ''} onChange={e => onChangeQuantidade(i, e.target.value)}
                    style={{ ...inp, width: 105, padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={e => { fo(e); e.target.select() }} onBlur={bl} />
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                  {falta != null ? falta : '-'}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.valorUnitario)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.valorTotal)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', color: descontoExcede ? '#b45309' : '#0f172a', fontWeight: descontoExcede ? 700 : 400 }}
                  title={descontoExcede ? 'Desconto ≥ valor do item' : undefined}>
                  {fmtMoney(descontoItem)}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', cursor: 'help' }} title={rateioTitle}>{fmtMoney(rateioTotal)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtMoney(it.custoFinal)}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                  <button onClick={() => onRemove(i)} disabled={disabled}
                    style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: disabled ? '#f1f4f8' : '#fee2e2', color: disabled ? '#94a3b8' : '#dc2626', cursor: disabled ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Remover
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #e2e6ed', background: '#f8f9fb' }}>
            <td colSpan={7} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>VALOR TOTAL DOS PRODUTOS</td>
            <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmtMoney(items.reduce((s, it) => s + (Number(it.valorTotal) || 0), 0))}</td>
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)

const NOTA_EMPTY = {
  numero: '', serie: '', modelo: '', codForn: null,
  dataEmissao: new Date().toISOString().slice(0, 10), dataChegada: '',
  tipoFrete: 'CIF', valorFrete: 0, valorSeguro: 0, outrasDespesas: 0, valorDesconto: 0,
  pedidoNumero: null, pedidoSerie: null, pedidoModelo: null,
  codCondicao: null, codTransp: null, placaVeiculo: '', observacoes: '', situacao: 'CONFERIDA',
  produtos: [],
  parcelasGeradas: [],
}
const ITEM_EMPTY = { codProd: null, produtoNome: '', unidade: '', quantidade: '', valorUnitario: '', desconto: 0, descontoPercentual: 0 }

const TIPO_FRETE_OPTIONS = [
  { value: 'CIF', label: 'CIF' },
  { value: 'FOB', label: 'FOB' },
  { value: 'OUT', label: 'Outros' },
]

const SITUACAO_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'CONFERIDA', label: 'Conferida' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const cols = [
  { key: 'numero', label: 'Número', mono: true },
  { key: 'serie', label: 'Série', mono: true },
  { key: 'modelo', label: 'Modelo', mono: true },
  { key: 'fornecedor', label: 'Fornecedor', render: r => r.fornecedor?.fornecedor ?? `#${r.codForn}` },
  { key: 'dataEmissao', label: 'Emissão', render: r => r.dataEmissao ? new Date(r.dataEmissao).toLocaleDateString('pt-BR') : '' },
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

const colsTransportadoras = [
  { key: 'codTransp', label: 'Cód.', mono: true },
  { key: 'transportador', label: 'Transportadora' },
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

const colsPedidosCompra = [
  { key: 'numero', label: 'Número', mono: true },
  { key: 'serie', label: 'Série', mono: true },
  { key: 'modelo', label: 'Modelo', mono: true },
  { key: 'dataCompra', label: 'Compra', render: r => r.dataCompra ? new Date(r.dataCompra).toLocaleDateString('pt-BR') : '' },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal) },
  { key: 'situacao', label: 'Situação' },
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


export default function NotasEntradaPage() {
  const { data, loading, load } = useCrud(notasEntradaApi)

  const [fornecedores, setFornecedores] = useState([])
  const [condicoes, setCondicoes] = useState([])
  const [transportadoras, setTransportadoras] = useState([])
  const [produtos, setProdutos] = useState([])
  const [cidades, setCidades] = useState([])
  const [estados, setEstados] = useState([])
  const [paises, setPaises] = useState([])
  const [marcas, setMarcas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [formaPagamentos, setFormaPagamentos] = useState([])

  const [form, setForm] = useState(NOTA_EMPTY)
  const [originalForm, setOriginalForm] = useState(NOTA_EMPTY)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelamentoModo, setCancelamentoModo] = useState(false)
  const [saving, setSaving] = useState(false)

  const [itemDraft, setItemDraft] = useState(ITEM_EMPTY)

  const [openFornecedores, setOpenFornecedores] = useState(false)
  const [openCondicoes, setOpenCondicoes] = useState(false)
  const [openTransportadoras, setOpenTransportadoras] = useState(false)
  const [openProdutos, setOpenProdutos] = useState(false)
  const [openPedidosCompra, setOpenPedidosCompra] = useState(false)
  const [pedidosCompra, setPedidosCompra] = useState([])
  const [loadingPedidosCompra, setLoadingPedidosCompra] = useState(false)

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

  const [openMarcasNota, setOpenMarcasNota] = useState(false)
  const [showNovaMarca, setShowNovaMarca] = useState(false)
  const [novaMarca, setNovaMarca] = useState(MARCA_EMPTY)
  const [savingMarca, setSavingMarca] = useState(false)

  const [openCategoriasNota, setOpenCategoriasNota] = useState(false)
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState(CATEGORIA_EMPTY)
  const [savingCategoria, setSavingCategoria] = useState(false)

  const loadFornecedores = async () => setFornecedores(await fornecedoresApi.getAll())
  const loadCondicoes = async () => setCondicoes(await condicoesApi.getAll())
  const loadTransportadoras = async () => setTransportadoras(await transportadoresApi.getAll())
  const loadProdutos = async () => setProdutos(await produtosApi.getAll())
  const loadCidades = async () => setCidades(await cidadesApi.getAll())
  const loadEstados = async () => setEstados(await estadosApi.getAll())
  const loadPaises = async () => setPaises(await paisesApi.getAll())
  const loadMarcas = async () => setMarcas(await marcasApi.getAll())
  const loadCategorias = async () => setCategorias(await categoriasApi.getAll())
  const loadFormaPagamentos = async () => setFormaPagamentos(await formaPagamentosApi.getAll())

  useEffect(() => {
    loadFornecedores(); loadCondicoes(); loadTransportadoras(); loadProdutos()
    loadCidades(); loadEstados(); loadPaises(); loadMarcas(); loadCategorias()
    loadFormaPagamentos()
  }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updNovoFornecedor = (k, v) => setNovoFornecedor(p => ({ ...p, [k]: v }))
  const updCidade = (k, v) => setNovaCidade(p => ({ ...p, [k]: v }))
  const updEstado = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updPais = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))
  const updNovoProduto = (k, v) => setNovoProdutoForm(p => ({ ...p, [k]: v }))
  const updMarca = (k, v) => setNovaMarca(p => ({ ...p, [k]: v }))
  const updCategoria = (k, v) => setNovaCategoria(p => ({ ...p, [k]: v }))

  const updItemQuantidade = (v) => setItemDraft(d => {
    const total = (Number(v) || 0) * (Number(d.valorUnitario) || 0)
    const desconto = total * (Number(d.descontoPercentual) || 0) / 100
    return { ...d, quantidade: v, desconto, descontoValor: desconto }
  })

  const updItemValorUnitario = (v) => setItemDraft(d => {
    const total = (Number(d.quantidade) || 0) * (Number(v) || 0)
    const desconto = total * (Number(d.descontoPercentual) || 0) / 100
    return { ...d, valorUnitario: v, desconto, descontoValor: desconto }
  })

  const updItemDesconto = (v) => setItemDraft(d => {
    const total = (Number(d.quantidade) || 0) * (Number(d.valorUnitario) || 0)
    const valor = Number(v) || 0
    const percentual = total > 0 ? (valor / total) * 100 : 0
    return { ...d, desconto: v, descontoValor: v, descontoPercentual: percentual }
  })

  const updItemDescontoPercentual = (v) => setItemDraft(d => {
    const total = (Number(d.quantidade) || 0) * (Number(d.valorUnitario) || 0)
    const percentual = Number(v) || 0
    const valor = total * percentual / 100
    return { ...d, desconto: valor, descontoValor: valor, descontoPercentual: v }
  })

  const abrirPedidosCompra = async () => {
    if (!form.codForn) { toast.error('Selecione o fornecedor antes de buscar um pedido de compra.'); return }
    setLoadingPedidosCompra(true)
    try {
      const response = await fetch(`/api/Compras/pendentes/${form.codForn}`)
      if (!response.ok) throw new Error()
      const rows = await response.json()
      setPedidosCompra(rows ?? [])
      setOpenPedidosCompra(true)
    } catch {
      toast.error('Erro ao carregar os pedidos de compra.')
    } finally {
      setLoadingPedidosCompra(false)
    }
  }

  const selecionarPedidoCompra = async r => {
    try {
      const response = await fetch(`/api/Compras/${r.numero}/${r.serie}/${r.modelo}/${r.codForn}`)
      if (!response.ok) throw new Error()
      const pedido = await response.json()
      const itens = (pedido?.produtos ?? []).map(p => {
        const quantidadeComprada = Number(p.quantidade) || 0
        const quantidadeRecebidaAnterior = Number(p.quantidadeRecebida) || 0
        const quantidadePendente = Math.max(quantidadeComprada - quantidadeRecebidaAnterior, 0)
        const valorUnitario = Number(p.valorUnitario) || 0
        const descontoPercentual = Number(p.descontoPercentual) || 0
        const quantidade = 0
        const bruto = quantidade * valorUnitario
        const descontoValor = bruto * descontoPercentual / 100
        const valorTotal = bruto - descontoValor
        return {
          codProd: p.codProd,
          produtoNome: p.produto?.produto ?? '',
          unidade: p.produto?.unidade ?? '',
          quantidadeComprada,
          quantidadeRecebidaAnterior,
          quantidadePendente,
          quantidadeFalta: quantidadePendente,
          quantidade,
          valorUnitario,
          valorTotal,
          descontoPercentual,
          descontoValor,
          desconto: descontoValor,
        }
      }).filter(p => p.quantidadePendente > 0)

      if (itens.length === 0) {
        toast.error('Este pedido não possui itens pendentes de recebimento.')
        return
      }

      setForm(f => ({
        ...f,
        codForn: r.codForn,
        fornecedor: r.fornecedor,
        pedidoNumero: r.numero,
        pedidoSerie: r.serie,
        pedidoModelo: r.modelo,
        produtos: itens,
        codCondicao: pedido.codCondicao ?? f.codCondicao,
        condicaoPagamento: pedido.condicao ?? f.condicaoPagamento,
      }))
      setItemDraft(ITEM_EMPTY)
      setOpenPedidosCompra(false)
    } catch {
      toast.error('Erro ao carregar os itens do pedido de compra.')
    }
  }

  const updQuantidadeReceber = (i, v) => {
    setForm(f => ({
      ...f,
      produtos: (f.produtos ?? []).map((it, idx) => {
        if (idx !== i) return it
        let quantidade = v === '' ? '' : Number(v)
        const max = Number(it.quantidadePendente) || 0
        if (quantidade !== '' && quantidade < 0) quantidade = 0
        if (quantidade !== '' && quantidade > max) quantidade = max
        const bruto = (Number(quantidade) || 0) * (Number(it.valorUnitario) || 0)
        const descontoValor = bruto * (Number(it.descontoPercentual) || 0) / 100
        const valorTotal = bruto - descontoValor
        return { ...it, quantidade, quantidadeFalta: Math.max(max - (Number(quantidade) || 0), 0), descontoValor, desconto: descontoValor, valorTotal }
      }),
    }))
  }

  const chavePronta = !!(form.numero && form.serie && form.modelo && form.codForn)
  const chaveInformada =
    String(form.modelo ?? '').trim() !== '' &&
    String(form.serie ?? '').trim() !== '' &&
    String(form.numero ?? '').trim() !== '' &&
    Number(form.codForn) > 0

  const camposLiberados = chaveInformada
  const chaveBloqueada = (form.produtos ?? []).length > 0
  const codigoNota = chavePronta ? chaveNota(form.numero, form.modelo, form.serie, form.codForn) : ''

  const valorProdutosCalc = (produtosList) => (produtosList ?? []).reduce((acc, it) => acc + (Number(it.valorTotal) || 0), 0)
  const somaDescontosItens = (produtosList) => (produtosList ?? []).reduce((acc, it) => acc + getDescontoItem(it), 0)
  const valorTotalCalc = (vp, vf, vs, od, totalDesconto) => vp + (Number(vf) || 0) + (Number(vs) || 0) + (Number(od) || 0) - totalDesconto

  const comRateio = (produtosList, valorFrete, valorSeguro, outrasDespesas) => {
    const totalProdutos = valorProdutosCalc(produtosList)
    return (produtosList ?? []).map(it => {
      const proporcao = totalProdutos > 0 ? (Number(it.valorTotal) || 0) / totalProdutos : 0
      const rateioFrete = (Number(valorFrete) || 0) * proporcao
      const rateioSeguro = (Number(valorSeguro) || 0) * proporcao
      const rateioOutras = (Number(outrasDespesas) || 0) * proporcao
      const desconto = getDescontoItem(it)
      const qtd = Number(it.quantidade) || 0
      const custoFinal = qtd > 0
        ? (Number(it.valorUnitario) || 0) + (rateioFrete + rateioSeguro + rateioOutras - desconto) / qtd
        : (Number(it.valorUnitario) || 0)
      return { ...it, rateioFrete, rateioSeguro, rateioOutras, custoFinal }
    })
  }

  const valorProdutosAtual = valorProdutosCalc(form.produtos)
  const totalDescontosAtual = somaDescontosItens(form.produtos)
  const valorTotalAtual = valorTotalCalc(valorProdutosAtual, form.valorFrete, form.valorSeguro, form.outrasDespesas, totalDescontosAtual)
  const valorTotalItemDraft = (Number(itemDraft.quantidade) || 0) * (Number(itemDraft.valorUnitario) || 0)
  const valorLiquidoItemDraft = valorTotalItemDraft - (Number(itemDraft.desconto) || 0)
  const produtosComRateio = comRateio(form.produtos, form.valorFrete, form.valorSeguro, form.outrasDespesas)

  const addItem = () => {
    if (!chaveInformada) {
      toast.error('Informe Modelo, Série, Número e Fornecedor antes de adicionar itens.')
      return
    }
    if (!itemDraft.codProd) { toast.error('Selecione um produto.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }
    if (Number(itemDraft.desconto) < 0) { toast.error('Desconto não pode ser negativo.'); return }

    const produtoJaAdicionado = (form.produtos ?? []).some(
      item => Number(item.codProd) === Number(itemDraft.codProd)
    )

    if (produtoJaAdicionado) {
      toast.error('Este produto já foi adicionado à nota.')
      return
    }

    const novoItem = {
      codProd: itemDraft.codProd,
      produtoNome: itemDraft.produtoNome,
      unidade: itemDraft.unidade,
      quantidade: Number(itemDraft.quantidade),
      quantidadeComprada: null,
      quantidadeRecebidaAnterior: 0,
      quantidadePendente: null,
      quantidadeFalta: null,
      valorUnitario: Number(itemDraft.valorUnitario),
      valorTotal: Number(itemDraft.quantidade) * Number(itemDraft.valorUnitario),
      descontoPercentual: Number(itemDraft.descontoPercentual) || 0,
      descontoValor: Number(itemDraft.descontoValor ?? itemDraft.desconto) || 0,
      desconto: Number(itemDraft.descontoValor ?? itemDraft.desconto) || 0,
    }
    setForm(f => ({ ...f, produtos: [...(f.produtos ?? []), novoItem] }))
    setItemDraft(ITEM_EMPTY)
  }

  const removeItem = (i) => setForm(f => ({ ...f, produtos: f.produtos.filter((_, idx) => idx !== i), parcelasGeradas: [] }))

  const save = async () => {
    if (!chaveInformada) {
      toast.error('Informe Modelo, Série, Número e Fornecedor antes de continuar.')
      return
    }
    if (!form.codForn) { toast.error('Selecione o fornecedor.'); return }
    if (!form.numero || !form.serie || !form.modelo) { toast.error('Informe número, série e modelo.'); return }
    if (!form.produtos || form.produtos.length === 0) { toast.error('Adicione ao menos um item.'); return }
    if (form.produtos.some(p => !p.quantidade || Number(p.quantidade) <= 0)) { toast.error('Informe uma quantidade recebida maior que zero em todos os itens.'); return }

    const hoje = hojeISO()
    const dataEmissao = toDateInput(form.dataEmissao)
    const dataChegada = toDateInput(form.dataChegada)

    if (!dataEmissao || dataEmissao > hoje) { toast.error('A Data de Emissão não pode ser futura.'); return }
    if (dataChegada && (dataChegada < dataEmissao || dataChegada > hoje)) { toast.error('A Data de Chegada deve estar entre a Data de Emissão e a data atual.'); return }

    const payload = {
      ...form,
      numero: Number(form.numero),
      serie: Number(form.serie),
      modelo: Number(form.modelo),
      dataChegada: form.dataChegada || null,
      valorProdutos: valorProdutosAtual,
      valorDesconto: totalDescontosAtual,
      valorTotal: valorTotalAtual,
      produtos: produtosComRateio.map(it => ({
        codProd: it.codProd,
        quantidade: it.quantidade,
        valorUnitario: it.valorUnitario,
        valorTotal: it.valorTotal,
        rateioFrete: it.rateioFrete,
        rateioSeguro: it.rateioSeguro,
        rateioOutras: it.rateioOutras,
        descontoPercentual: Number(it.descontoPercentual) || 0,
        descontoValor: Number(it.descontoValor ?? it.desconto) || 0,
        custoFinal: it.custoFinal,
      })),
    }
    delete payload.parcelasGeradas

    setSaving(true)
    try {
      if (editing) {
        const situacaoAnterior = String(originalForm?.situacao ?? 'PENDENTE').toUpperCase()
        const situacaoNova = String(payload.situacao ?? 'PENDENTE').toUpperCase()

        if (situacaoAnterior === 'PENDENTE' && situacaoNova === 'CONFERIDA') {
          const payloadPendente = { ...payload, situacao: 'PENDENTE' }
          await notasEntradaApi.update(chaveNota(payload.numero, payload.modelo, payload.serie, payload.codForn), payloadPendente)
          const responseConfirmar = await fetch(`/api/NotasEntrada/confirmar/${payload.numero}/${payload.modelo}/${payload.serie}/${payload.codForn}`, { method: 'PUT' })
          if (!responseConfirmar.ok) {
            const mensagem = await responseConfirmar.text()
            throw new Error(mensagem || 'Erro ao confirmar a nota.')
          }
        } else {
          await notasEntradaApi.update(chaveNota(payload.numero, payload.modelo, payload.serie, payload.codForn), payload)
        }
      } else {
        const payloadPendente = { ...payload, situacao: 'PENDENTE' }
        await notasEntradaApi.create(payloadPendente)
        if (String(payload.situacao).toUpperCase() === 'CONFERIDA') {
          const responseConfirmar = await fetch(`/api/NotasEntrada/confirmar/${payload.numero}/${payload.modelo}/${payload.serie}/${payload.codForn}`, { method: 'PUT' })
          if (!responseConfirmar.ok) {
            const mensagem = await responseConfirmar.text()
            throw new Error(mensagem || 'Erro ao confirmar a nota.')
          }
        }
      }
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch (error) {
      let mensagem = 'Erro ao salvar.'

      if (error?.message)
        mensagem = error.message

      toast.error(mensagem)
    } finally {
      setSaving(false)
    }
  }

  const cancelarNota = async () => {
    if (!form?.numero || !form?.modelo || !form?.serie || !form?.codForn) return
    if (!motivoCancelamento.trim()) { toast.error('Informe o motivo do cancelamento.'); return }

    setSaving(true)
    try {
      const response = await fetch(`/api/NotasEntrada/cancelar/${form.numero}/${form.modelo}/${form.serie}/${form.codForn}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoCancelamento.trim() }),
      })

      if (!response.ok) {
        const mensagem = await response.text()
        throw new Error(mensagem || 'Erro ao cancelar a nota.')
      }

      toast.success('Nota cancelada.')
      setOpen(false)
      setMotivoCancelamento('')
      setCancelamentoModo(false)
      load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao cancelar a nota.')
    } finally {
      setSaving(false)
    }
  }

  const fornecedorSelecionado = fornecedores.find(f => f.codForn === form.codForn) ?? form.fornecedor
  const fornecedorLabel = fornecedorSelecionado?.fornecedor ?? ''
  const selectFornecedor = r => {
    setForm(f => {
      const mudouFornecedor = f.codForn && Number(f.codForn) !== Number(r.codForn)
      return {
        ...f,
        codForn: r.codForn,
        fornecedor: r,
        pedidoNumero: mudouFornecedor ? null : f.pedidoNumero,
        pedidoSerie: mudouFornecedor ? null : f.pedidoSerie,
        pedidoModelo: mudouFornecedor ? null : f.pedidoModelo,
        produtos: mudouFornecedor ? [] : f.produtos,
        codCondicao: r.condicao?.codCondicao ?? null,
        condicaoPagamento: r.condicao ?? null,
      }
    })
    setItemDraft(ITEM_EMPTY)
    setOpenFornecedores(false)
  }

  const condicaoSelecionada = condicoes.find(c => String(c.codCondicao) === String(form.codCondicao)) ?? form.condicaoPagamento
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? ''
  const selectCondicao = r => {
    setForm(f => ({ ...f, codCondicao: r.codCondicao, condicaoPagamento: r, parcelasGeradas: [] }))
    setOpenCondicoes(false)
  }

  const gerarParcelas = async () => {
    if (!chaveInformada) {
      toast.error('Informe Modelo, Série, Número e Fornecedor antes de gerar parcelas.')
      return
    }
    if (!form.produtos || form.produtos.length === 0) { toast.error('Adicione ao menos um produto antes de gerar parcelas.'); return }
    if (!form.codCondicao) { toast.error('Selecione uma Condição de Pagamento antes.'); return }
    if (!form.dataEmissao) { toast.error('Informe a Data de Emissão antes.'); return }

    let condicao = condicaoSelecionada
    let configuradas = condicao?.parcelas ?? condicao?.Parcelas ?? []

    if (configuradas.length === 0) {
      try {
        const detalhe = await condicoesApi.getOne(form.codCondicao)
        condicao = detalhe ?? condicao
        configuradas = detalhe?.parcelas ?? detalhe?.Parcelas ?? []
      } catch {
        toast.error('Não foi possível carregar as parcelas da condição de pagamento.')
        return
      }
    }

    if (configuradas.length === 0) {
      toast.error('A condição de pagamento não possui parcelas cadastradas.')
      return
    }

    let geradas = configuradas.map(p => {
      const percentualOriginal = Number(p.percentual ?? p.Percentual) || 0
      const valor = arredondar2(valorTotalAtual * percentualOriginal / 100)
      const dias = Number(p.dias ?? p.Dias) || 0
      const numeroParcela = p.numeroParcela ?? p.NumeroParcela
      const codFormaPagamento = p.codFormaPagamento ?? p.CodFormaPagamento
      const venc = addDias(form.dataEmissao, dias)
      const formaNome = formaPagamentos.find(f => String(f.codFormaPagamento) === String(codFormaPagamento))?.formaPagamento ?? ''
      return { numeroParcela, vencimento: venc ? venc.toISOString().slice(0, 10) : '', percentual: 0, valor, codFormaPagamento, formaNome }
    })

    const totalGerado = arredondar2(geradas.reduce((s, p) => s + (Number(p.valor) || 0), 0))
    const diferenca = arredondar2(valorTotalAtual - totalGerado)
    if (geradas.length > 0 && diferenca !== 0) {
      const ultima = geradas.length - 1
      geradas[ultima] = { ...geradas[ultima], valor: arredondar2(geradas[ultima].valor + diferenca) }
    }

    geradas = geradas.map(p => ({ ...p, percentual: valorTotalAtual > 0 ? arredondar2((Number(p.valor) / valorTotalAtual) * 100) : 0 }))

    setForm(f => ({ ...f, condicaoPagamento: condicao, parcelasGeradas: geradas }))
  }

  const updParcelaGerada = (i, campo, valor) => {
    setForm(f => ({
      ...f,
      parcelasGeradas: (f.parcelasGeradas ?? []).map((p, idx) => idx === i ? { ...p, [campo]: valor } : p),
    }))
  }

  const transportadorSelecionado = transportadoras.find(t => t.codTransp === form.codTransp) ?? form.transportador
  const transportadorLabel = transportadorSelecionado?.transportador ?? ''
  const selectTransportadora = r => { setForm(f => ({ ...f, codTransp: r.codTransp, transportador: r })); setOpenTransportadoras(false) }

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
  const closeMarcasNota = () => { setOpenMarcasNota(false); cancelMarca() }
  const closeCategoriasNota = () => { setOpenCategoriasNota(false); cancelCategoria() }

  const isDirtyNovoProduto = showNovoProduto && JSON.stringify(novoProdutoForm) !== JSON.stringify(PRODUTO_NOVO_EMPTY)
  const produtosGuard = useModalGuard({
    isOpen: openProdutos,
    isDirty: isDirtyNovoProduto,
    onClose: closeProdutos,
    onSave: showNovoProduto ? saveNovoProduto : undefined,
    paused: openMarcasNota || openCategoriasNota,
  })

  const isDirtyMarca = showNovaMarca && JSON.stringify(novaMarca) !== JSON.stringify(MARCA_EMPTY)
  const marcasNotaGuard = useModalGuard({
    isOpen: openMarcasNota,
    isDirty: isDirtyMarca,
    onClose: closeMarcasNota,
    onSave: showNovaMarca ? saveNovaMarca : undefined,
  })

  const isDirtyCategoria = showNovaCategoria && JSON.stringify(novaCategoria) !== JSON.stringify(CATEGORIA_EMPTY)
  const categoriasNotaGuard = useModalGuard({
    isOpen: openCategoriasNota,
    isDirty: isDirtyCategoria,
    onClose: closeCategoriasNota,
    onSave: showNovaCategoria ? saveNovaCategoria : undefined,
  })

  const closeCondicoes = () => setOpenCondicoes(false)
  const closeTransportadoras = () => setOpenTransportadoras(false)

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  const anyLookupOpen = openFornecedores || openCondicoes || openTransportadoras || openProdutos || openPedidosCompra

  const abrirNovaNota = () => {
    setForm(NOTA_EMPTY); setOriginalForm(NOTA_EMPTY); setItemDraft(ITEM_EMPTY)
    setEditing(false); setOpen(true); setMotivoCancelamento(''); setCancelamentoModo(false)
  }

  const abrirEdicaoNota = async (r, modoCancelamento = false) => {
    let completa
    try {
      completa = await notasEntradaApi.getOne(chaveNota(r.numero, r.modelo, r.serie, r.codForn))
    } catch {
      toast.error('Erro ao carregar a nota.')
      return
    }

    let pedidoCompleto = null
    if (completa.pedidoNumero && completa.pedidoSerie && completa.pedidoModelo && completa.codForn) {
      try {
        const response = await fetch(`/api/Compras/${completa.pedidoNumero}/${completa.pedidoSerie}/${completa.pedidoModelo}/${completa.codForn}`)
        if (response.ok) pedidoCompleto = await response.json()
      } catch {
        pedidoCompleto = null
      }
    }

    const itensPedido = pedidoCompleto?.produtos ?? []

    const formCarregado = {
      ...completa,
      dataEmissao: toDateInput(completa.dataEmissao),
      dataChegada: toDateInput(completa.dataChegada),
      produtos: (completa.produtos ?? []).map(p => {
        const produto = p.produto ?? p.Produto ?? {}
        const itemPedido = itensPedido.find(x => Number(x.codProd ?? x.CodProd) === Number(p.codProd))
        const quantidade = Number(p.quantidade) || 0
        const quantidadeComprada = itemPedido ? Number(itemPedido.quantidade ?? itemPedido.Quantidade) || 0 : null
        const quantidadeRecebidaTotal = itemPedido ? Number(itemPedido.quantidadeRecebida ?? itemPedido.QuantidadeRecebida) || 0 : 0
        const quantidadeRecebidaAnterior = itemPedido
          ? Math.max(quantidadeRecebidaTotal - quantidade, 0)
          : 0
        const quantidadePendente = itemPedido
          ? Math.max(quantidadeComprada - quantidadeRecebidaAnterior, 0)
          : null
        const quantidadeFalta = itemPedido
          ? Math.max(quantidadePendente - quantidade, 0)
          : null

        return {
          codProd: p.codProd,
          produtoNome: produto.produto ?? produto.Produto ?? '',
          unidade: produto.unidade ?? produto.Unidade ?? '',
          quantidadeComprada,
          quantidadeRecebidaAnterior,
          quantidadePendente,
          quantidadeFalta,
          quantidade: p.quantidade,
          valorUnitario: p.valorUnitario,
          valorTotal: p.valorTotal,
          descontoPercentual: p.descontoPercentual ?? 0,
          descontoValor: p.descontoValor ?? p.desconto ?? 0,
          desconto: p.descontoValor ?? p.desconto ?? 0,
        }
      }),
      parcelasGeradas: completa.parcelasGeradas ?? [],
    }
    setForm(formCarregado); setOriginalForm(formCarregado); setItemDraft(ITEM_EMPTY)
    setEditing(true); setOpen(true); setMotivoCancelamento(''); setCancelamentoModo(modoCancelamento)
  }

  return (
    <div>
      <PageHeader title="Notas de Entrada" sub="Consulta de Notas de Entrada" label="Nova Nota" onNew={abrirNovaNota} disabled={open} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicaoNota}
        onDelete={r => abrirEdicaoNota(r, true)} />


      <Modal open={open} title={cancelamentoModo ? 'Cancelar Nota de Entrada' : (editing ? 'Editar Nota de Entrada' : 'Nova Nota de Entrada')} editing={editing}
        onClose={() => { setOpen(false); setMotivoCancelamento(''); setCancelamentoModo(false) }} onSave={cancelamentoModo ? cancelarNota : save} wide maxWidth={2000}
        isDirty={cancelamentoModo || isDirty}
        suspended={anyLookupOpen}>

        <div style={{ padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <NumberField label="Modelo" value={form.modelo} onChange={v => upd('modelo', v)} disabled={cancelamentoModo || chaveBloqueada} style={{ flex: '0 0 80px' }} />
          <NumberField label="Série" value={form.serie} onChange={v => upd('serie', v)} disabled={cancelamentoModo || chaveBloqueada} style={{ flex: '0 0 70px' }} />
          <NumberField label="Número" value={form.numero} onChange={v => upd('numero', v)} disabled={cancelamentoModo || chaveBloqueada} style={{ flex: '0 0 110px' }} />
          <div style={{ flex: '0 0 105px' }}>
            <label style={lbl}>Código</label>
            <input type="text" value={form.codForn ?? ''} readOnly style={{ ...inp, background: '#eef2f7', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', }}/>
          </div>

          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <LookupField label="Fornecedor *" value={fornecedorLabel} disabled={cancelamentoModo || chaveBloqueada}  onSearch={() => { setShowNovoFornecedor(false),   setOpenFornecedores(true)}}/>
          </div>

          <DateField label="Data Emissão" value={form.dataEmissao} onChange={v => upd('dataEmissao', v)} disabled={cancelamentoModo || !camposLiberados || chaveBloqueada} max={hojeISO()} style={{ flex: '0 0 150px' }} />
          <DateField label="Data Chegada" value={form.dataChegada} onChange={v => upd('dataChegada', v)} disabled={cancelamentoModo || !camposLiberados || chaveBloqueada} min={form.dataEmissao} max={hojeISO()} style={{ flex: '0 0 150px' }} />
        </div>

        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <LookupField label="Pedido de Compra" value={form.pedidoNumero ? `Pedido ${form.pedidoNumero}/${form.pedidoSerie} - Modelo ${form.pedidoModelo}` : ''}
            onSearch={abrirPedidosCompra} disabled={cancelamentoModo || !camposLiberados || editing} style={{ flex: '0 0 420px' }} />
        </div>

        {chavePronta && !cancelamentoModo ? (
          <InlineForm title="Adicionar Item">
            <div style={{ flex: '1 1 220px', minWidth: 200 }}>
              <LookupField label="Produto *" value={itemDraft.produtoNome}
                onSearch={() => { setShowNovoProduto(false); setOpenProdutos(true) }} />
            </div>
            <ReadOnlyField label="Unidade" value={itemDraft.unidade || '-'} style={{ flex: '0 0 50px' }} />
            <NumberField label="Quantidade" value={itemDraft.quantidade} onChange={updItemQuantidade} step="1" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Valor Unitário" value={itemDraft.valorUnitario} onChange={updItemValorUnitario} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
            <NumberField label="Desconto (%)" value={itemDraft.descontoPercentual} onChange={updItemDescontoPercentual} step="0.01" min="0" style={{ flex: '0 0 110px' }} />
            <NumberField label="Desconto (R$)" value={itemDraft.desconto} onChange={updItemDesconto} step="0.01" min="0" style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor Total" value={fmtMoney(valorTotalItemDraft)} style={{ flex: '0 0 130px' }} />
            <ReadOnlyField label="Valor c/ Desconto" value={fmtMoney(valorLiquidoItemDraft)} style={{ flex: '0 0 140px' }} />
            <BtnPrimary onClick={addItem} style={{ padding: '9px 20px' }}>Adicionar</BtnPrimary>
          </InlineForm>
        ) : (
          <AvisoChavesPendentes />
        )}

        <ItemsList items={produtosComRateio} onRemove={removeItem} onChangeQuantidade={updQuantidadeReceber} disabled={cancelamentoModo} />

        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <SelectField label="Tipo Frete" value={form.tipoFrete} onChange={v => upd('tipoFrete', v)} options={TIPO_FRETE_OPTIONS} disabled={cancelamentoModo || !camposLiberados} style={{ flex: '0 0 220px' }} />
          <SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)} options={SITUACAO_OPTIONS} disabled={cancelamentoModo || !camposLiberados} style={{ flex: '0 0 180px' }} />
          <div style={{ flex: '1 1 200px', minWidth: 180 }}>
            <LookupField label="Transportadora" value={transportadorLabel} onSearch={() => setOpenTransportadoras(true)} disabled={cancelamentoModo || !camposLiberados} />
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <FField label="Placa Veículo" value={form.placaVeiculo ?? ''} onChange={v => upd('placaVeiculo', v)} disabled={cancelamentoModo || !camposLiberados} />
          </div>
        </div>

        <div style={{ padding: '14px 24px 4px' }}>
          <TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} disabled={cancelamentoModo || !camposLiberados} />
        </div>

        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
          <ReadOnlyField label="Valor Produtos" value={fmtMoney(valorProdutosAtual)} style={{ flex: '1 1 140px' }} />
          <NumberField label="Valor Frete" value={form.valorFrete} onChange={v => upd('valorFrete', v)} step="0.01" min="0" disabled={cancelamentoModo || !camposLiberados} style={{ flex: '1 1 120px' }} />
          <NumberField label="Valor Seguro" value={form.valorSeguro} onChange={v => upd('valorSeguro', v)} step="0.01" min="0" disabled={cancelamentoModo || !camposLiberados} style={{ flex: '1 1 120px' }} />
          <NumberField label="Outras Despesas" value={form.outrasDespesas} onChange={v => upd('outrasDespesas', v)} step="0.01" min="0" disabled={cancelamentoModo || !camposLiberados} style={{ flex: '1 1 130px' }} />
          <ReadOnlyField label="Total Descontos (itens)" value={fmtMoney(totalDescontosAtual)} style={{ flex: '1 1 150px' }} />
          <ReadOnlyField label="Valor Total da Nota" value={fmtMoney(valorTotalAtual)} bold style={{ flex: '1 1 160px' }} />
        </div>

        {cancelamentoModo && (
          <div style={{ padding: '4px 24px 20px', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
            <TextAreaField label="Motivo do Cancelamento *" value={motivoCancelamento} onChange={v => setMotivoCancelamento(v)} rows={4} />
          </div>
        )}

        <ParcelasGridEditavel
          parcelas={form.parcelasGeradas ?? []}
          valorTotalNota={valorTotalAtual}
          onChangeParcela={updParcelaGerada}
          condicaoLabel={condicaoLabel}
          condicaoSelecionada={condicaoSelecionada}
          onOpenCondicoes={() => setOpenCondicoes(true)}
          onGerarParcelas={gerarParcelas}
          disabled={cancelamentoModo || !camposLiberados || !(form.produtos ?? []).length}
        />
      </Modal>

      {openPedidosCompra && (
        <Overlay onClose={() => setOpenPedidosCompra(false)} zIndex={60}>
          <ModalBox maxWidth={900}>
            <ModalHeader title="Consulta de Pedidos de Compra" onClose={() => setOpenPedidosCompra(false)} />
            <div style={{ padding: '12px 24px 0', color: '#64748b', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>
              Fornecedor: <strong>{fornecedorLabel}</strong>
            </div>
            {loadingPedidosCompra ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Carregando pedidos...</div>
            ) : pedidosCompra.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Nenhum pedido de compra pendente para este fornecedor.</div>
            ) : (
              <LookupTable cols={colsPedidosCompra} rows={pedidosCompra} onSelect={selecionarPedidoCompra} />
            )}
          </ModalBox>
        </Overlay>
      )}

      
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

      
      {openCidadesForn && (
        <Overlay onClose={cidadesFornGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Cidades" onClose={cidadesFornGuard.attemptClose}
              badge={!showNovaCidade && <BtnNovo onClick={() => setShowNovaCidade(true)} label="Nova Cidade" />} />

            {showNovaCidade && (
              <InlineForm title="Nova Cidade">
                <Inp label="Cidade *" value={novaCidade.cidade} onChange={v => updCidade('cidade', v)} placeholder="Nome da cidade" style={{ flex: '1 1 200px' }} />
                <Inp label="DDD" value={novaCidade.ddd} onChange={v => updCidade('ddd', v)} maxLength={3} placeholder="11" style={{ flex: '0 0 72px' }} />
                <LookupField label="Estado *" value={estadoNaCidadeLabel} onSearch={() => { setShowNovoEstado(false); setOpenEstadosForn(true) }} />
                <CheckAtivo checked={novaCidade.ativo} onChange={v => updCidade('ativo', v)} />
                <SaveRow onCancel={cancelCidade} onSave={saveNovaCidade} saving={savingCidade} label="Salvar Cidade" />
              </InlineForm>
            )}

            <LookupTable cols={colsCidades} rows={cidades}
              onSelect={r => { updNovoFornecedor('codCidade', r.codCidade); setOpenCidadesForn(false) }} />
          </ModalBox>
        </Overlay>
      )}

      
      {openEstadosForn && (
        <Overlay onClose={estadosFornGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={680}>
            <ModalHeader title="Consulta de Estados" onClose={estadosFornGuard.attemptClose}
              badge={!showNovoEstado && <BtnNovo onClick={() => setShowNovoEstado(true)} label="Novo Estado" />} />

            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp label="Estado *" value={novoEstado.estado} onChange={v => updEstado('estado', v)} placeholder="Nome do estado" style={{ flex: '1 1 200px' }} />
                <Inp label="UF *" value={novoEstado.uf} onChange={v => updEstado('uf', v.toUpperCase())} maxLength={2} placeholder="SP" style={{ flex: '0 0 72px' }} />
                <LookupField label="País *" value={paisNoEstadoLabel} onSearch={() => { setShowNovoPais(false); setOpenPaisesForn(true) }} />
                <CheckAtivo checked={novoEstado.ativo} onChange={v => updEstado('ativo', v)} />
                <SaveRow onCancel={cancelEstado} onSave={saveNovoEstado} saving={savingEstado} label="Salvar Estado" />
              </InlineForm>
            )}

            <LookupTable cols={colsEstados} rows={estados}
              onSelect={r => { updCidade('codEstado', r.codEstado); setOpenEstadosForn(false) }} />
          </ModalBox>
        </Overlay>
      )}

      
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

      
      {openCondicoes && (
        <Overlay onClose={closeCondicoes} zIndex={60}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Condições de Pagamento" onClose={closeCondicoes} />
            <LookupTable cols={colsCondicoes} rows={condicoes} onSelect={selectCondicao} />
          </ModalBox>
        </Overlay>
      )}

      
      {openTransportadoras && (
        <Overlay onClose={closeTransportadoras} zIndex={60}>
          <ModalBox maxWidth={620}>
            <ModalHeader title="Consulta de Transportadoras" onClose={closeTransportadoras} />
            <LookupTable cols={colsTransportadoras} rows={transportadoras} onSelect={selectTransportadora} />
          </ModalBox>
        </Overlay>
      )}

      
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
                  onSearch={() => { setShowNovaCategoria(false); setOpenCategoriasNota(true) }} style={{ flex: '1 1 180px' }} />
                <LookupField label="Marca" value={marcaNovoProdLabel}
                  onSearch={() => { setShowNovaMarca(false); setOpenMarcasNota(true) }} style={{ flex: '1 1 180px' }} />
                <NumberField label="Preço Venda (R$)" value={novoProdutoForm.precoVenda} onChange={v => updNovoProduto('precoVenda', v)} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
                <CheckAtivo checked={novoProdutoForm.ativo} onChange={v => updNovoProduto('ativo', v)} />
                <SaveRow onCancel={cancelProdutoNovo} onSave={saveNovoProduto} saving={savingProduto} label="Salvar Produto" />
              </InlineForm>
            )}

            <LookupTable cols={colsProdutos} rows={produtos} onSelect={selectProdutoItem} />
          </ModalBox>
        </Overlay>
      )}

      
      {openCategoriasNota && (
        <Overlay onClose={categoriasNotaGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Categorias" onClose={categoriasNotaGuard.attemptClose}
              badge={!showNovaCategoria && <BtnNovo onClick={() => setShowNovaCategoria(true)} label="Nova Categoria" />} />

            {showNovaCategoria && (
              <InlineForm title="Nova Categoria">
                <Inp label="Categoria *" value={novaCategoria.categoria} onChange={v => updCategoria('categoria', v)}
                  placeholder="" style={{ flex: '1 1 240px' }} />
                <CheckAtivo checked={novaCategoria.ativo} onChange={v => updCategoria('ativo', v)} />
                <SaveRow onCancel={cancelCategoria} onSave={saveNovaCategoria} saving={savingCategoria} label="Salvar Categoria" />
              </InlineForm>
            )}

            <LookupTable cols={colsCategorias} rows={categorias}
              onSelect={r => { updNovoProduto('codCategoria', r.codCategoria); setOpenCategoriasNota(false) }} />
          </ModalBox>
        </Overlay>
      )}

      
      {openMarcasNota && (
        <Overlay onClose={marcasNotaGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Marcas" onClose={marcasNotaGuard.attemptClose}
              badge={!showNovaMarca && <BtnNovo onClick={() => setShowNovaMarca(true)} label="Nova Marca" />} />

            {showNovaMarca && (
              <InlineForm title="Nova Marca">
                <Inp label="Marca *" value={novaMarca.marca} onChange={v => updMarca('marca', v)}
                  placeholder="" style={{ flex: '1 1 240px' }} />
                <CheckAtivo checked={novaMarca.ativo} onChange={v => updMarca('ativo', v)} />
                <SaveRow onCancel={cancelMarca} onSave={saveNovaMarca} saving={savingMarca} label="Salvar Marca" />
              </InlineForm>
            )}

            <LookupTable cols={colsMarcas} rows={marcas}
              onSelect={r => { updNovoProduto('codMarca', r.codMarca); setOpenMarcasNota(false) }} />
          </ModalBox>
        </Overlay>
      )}

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
        open={categoriasNotaGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={categoriasNotaGuard.cancelClose} onConfirm={categoriasNotaGuard.confirmClose}
      />
      <ConfirmDialog
        open={marcasNotaGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={marcasNotaGuard.cancelClose} onConfirm={marcasNotaGuard.confirmClose}
      />


    </div>
  )
}
