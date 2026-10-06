import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import {
  notasSaidaApi, clientesApi, condicoesApi, transportadoresApi, produtosApi,
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
const toDateInput = v => v ? String(v).slice(0, 10) : ''
const hoje = () => new Date().toISOString().slice(0, 10)
const chaveNota = (numero, modelo, serie, codCliente) => `${numero}/${modelo}/${serie}/${codCliente}`
const addDias = (dataStr, dias) => {
  if (!dataStr) return null
  const d = new Date(`${dataStr}T00:00:00`)
  d.setDate(d.getDate() + (Number(dias) || 0))
  return d
}
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
const BtnSecondary = ({ onClick, children, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8, background: 'transparent', cursor: disabled ? 'default' : 'pointer', fontSize: 13, color: '#475569', opacity: disabled ? .6 : 1 }}>
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
      <input type="text" readOnly value={value ?? ''} style={{ ...inp, width: '100%', paddingRight: 42, background: disabled ? '#f1f4f8' : inp.background }} />
      <BtnPesquisar onClick={onSearch} disabled={disabled} />
    </div>
  </div>
)
const Inp = ({ label, value, onChange, maxLength, placeholder, style, disabled }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value ?? ''} maxLength={maxLength} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color }}
      onFocus={fo} onBlur={bl} />
  </div>
)
const NumberField = ({ label, value, onChange, step = '1', min, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="number" step={step} min={min} disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      onFocus={e => { fo(e); e.target.select() }}
      onBlur={bl}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background, color: disabled ? '#94a3b8' : inp.color }} />
  </div>
)
const formatDateBR = value => {
  const iso = toDateInput(value)
  if (!iso || iso.length !== 10) return ''
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
const parseDateBR = value => {
  const texto = String(value ?? '').trim()
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dia, mes, ano] = match
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia))
  if (
    data.getFullYear() !== Number(ano) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getDate() !== Number(dia)
  ) return null
  return `${ano}-${mes}-${dia}`
}
const DateField = ({ label = 'Data', value, onChange, disabled, min, max, style }) => {
  const [texto, setTexto] = useState(formatDateBR(value))
  const calendarioRef = useRef(null)
  useEffect(() => {
    setTexto(formatDateBR(value))
  }, [value])
  const abrirCalendario = () => {
    if (disabled) return
    if (calendarioRef.current?.showPicker) {
      calendarioRef.current.showPicker()
    } else {
      calendarioRef.current?.click()
    }
  }
  const selecionarData = data => {
    if (!data) return
    if (min && data < min) return
    if (max && data > max) return
    setTexto(formatDateBR(data))
    onChange(data)
  }
  const alterarTexto = valor => {
    const limpo = valor.replace(/\D/g, '').slice(0, 8)
    let formatado = limpo
    if (limpo.length > 4)
      formatado = `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4)}`
    else if (limpo.length > 2)
      formatado = `${limpo.slice(0, 2)}/${limpo.slice(2)}`
    setTexto(formatado)
  }
  const finalizarTexto = () => {
    if (!texto) {
      onChange('')
      return
    }
    const data = parseDateBR(texto)
    if (!data) {
      setTexto(formatDateBR(value))
      toast.error(`Informe uma data válida no formato DD/MM/AAAA.`)
      return
    }
    if (min && data < min) {
      setTexto(formatDateBR(value))
      toast.error(`A data não pode ser anterior a ${formatDateBR(min)}.`)
      return
    }
    if (max && data > max) {
      setTexto(formatDateBR(value))
      toast.error(`A data não pode ser posterior a ${formatDateBR(max)}.`)
      return
    }
    onChange(data)
  }
  return (
    <div style={style}>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={texto}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          onChange={e => alterarTexto(e.target.value)}
          onBlur={e => {
            bl(e)
            finalizarTexto()
          }}
          onFocus={fo}
          style={{ ...inp, width: '100%', paddingRight: 42, background: disabled ? '#f1f4f8' : inp.background }}
        />
        <button
          type="button"
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={abrirCalendario}
          aria-label={`Selecionar ${label.toLowerCase()}`}
          style={{
            position: 'absolute',
            right: 1,
            top: 1,
            width: 38,
            height: 'calc(100% - 2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: '#475569',
            cursor: disabled ? 'default' : 'pointer',
            padding: 0,
            borderRadius: 7
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        <input
          ref={calendarioRef}
          type="date"
          disabled={disabled}
          value={toDateInput(value)}
          min={min}
          max={max}
          onChange={e => selecionarData(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
            left: 0,
            bottom: 0
          }}
        />
      </div>
    </div>
  )
}
const SelectField = ({ label, value, onChange, options, disabled, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <select disabled={disabled} value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{ ...inp, background: disabled ? '#f1f4f8' : inp.background }}
      onFocus={fo} onBlur={bl}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)
const ReadOnlyField = ({ label, value, style, bold }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ ...inp, background: '#eef2f7', color: '#0f172a', fontWeight: bold ? 700 : 400, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
  </div>
)
const TextAreaField = ({ label, value, onChange, rows = 2, style, disabled }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <textarea rows={rows} value={value ?? ''} disabled={disabled} onChange={e => onChange(e.target.value)}
      style={{ ...inp, resize: 'vertical', fontFamily: 'Outfit, sans-serif', background: disabled ? '#f1f4f8' : inp.background }}
      onFocus={fo} onBlur={bl} />
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
    ⚠ Preencha Número, Série, Modelo e selecione o Cliente antes de adicionar itens.
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
            <tr>
              <td colSpan={cols.length + 1} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                Nenhum registro encontrado.
              </td>
            </tr>
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
const ItemsList = ({ items, onRemove, podeRemover }) => (
  <div style={{ padding: '0 24px 20px' }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            <th style={thStyle}>Produto</th>
            <th style={thStyle}>Unid.</th>
            <th style={thStyle}>Quantidade</th>
            <th style={thStyle}>Vlr. Unit.</th>
            <th style={thStyle}>Desconto %</th>
            <th style={thStyle}>Desconto R$</th>
            <th style={thStyle}>Vlr. Total</th>
            <th style={thStyle}>Rateio</th>
            <th style={thStyle}>Custo Final</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={10} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>
                Nenhum item adicionado.
              </td>
            </tr>
          )}
          {items.map((it, i) => {
            const rateioTotal =
              (Number(it.rateioFrete) || 0) +
              (Number(it.rateioSeguro) || 0) +
              (Number(it.rateioOutras) || 0)
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                <td style={tdStyle}>{it.produtoNome || `Produto #${it.codProd}`}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.unidade || '-'}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{it.quantidade}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.valorUnitario)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>
                  {Number(it.descontoPercentual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMoney(it.descontoValor)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtMoney(it.valorTotal)}</td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', cursor: 'help' }}
                  title={`Frete: ${fmtMoney(it.rateioFrete)} · Seguro: ${fmtMoney(it.rateioSeguro)} · Outras: ${fmtMoney(it.rateioOutras)}`}>
                  {fmtMoney(rateioTotal)}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmtMoney(it.custoFinal)}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                  <button onClick={() => podeRemover && onRemove(i)} disabled={!podeRemover}
                    style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: podeRemover ? '#fee2e2' : '#f1f4f8', color: podeRemover ? '#dc2626' : '#94a3b8', cursor: podeRemover ? 'pointer' : 'default', fontSize: 12, fontWeight: 600 }}>
                    Remover
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
         <tfoot>
          <tr style={{ borderTop: '2px solid #e2e6ed', background: '#f8f9fb' }}>
            <td colSpan={6} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right' }}>VALOR TOTAL DOS PRODUTOS</td>
            <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmtMoney(items.reduce((s, it) => s + (Number(it.valorTotal) || 0), 0))}</td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
)
const ParcelasGridEditavel = ({ parcelas, valorTotalNota, onChangeParcela, onGerar, condicaoLabel, onSearchCondicao, podeGerar, condicaoDisabled }) => (
  <div style={{ padding: '4px 24px 20px' }}>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
      <LookupField
        label="Condição de Pagamento"
        value={condicaoLabel}
        onSearch={onSearchCondicao}
        disabled={condicaoDisabled}
        style={{ width: 320 }}
      />
      <BtnPrimary onClick={onGerar} disabled={!podeGerar} style={{ padding: '9px 16px', fontSize: 12 }}>
        Gerar Parcelas
      </BtnPrimary>
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
<DateField value={p.vencimento} onChange={v => onChangeParcela(i, 'vencimento', v)} disabled={!parcelas.length} style={{ minWidth: 170 }} />
                </td>
                <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace' }}>
                  {percentual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </td>
                <td style={{ ...tdStyle, padding: '6px 14px' }}>
                  <input type="number" step="0.01" min="0" value={p.valor ?? ''} disabled={!parcelas.length}
                    onChange={e => onChangeParcela(i, 'valor', e.target.value === '' ? '' : e.target.value)}
                    onFocus={e => { fo(e); e.target.select() }}
                    onBlur={e => {
                      bl(e)
                      if (p.valor !== '' && p.valor !== undefined && p.valor !== null) {
                        const parsed = parseFloat(p.valor)
                        if (!isNaN(parsed)) onChangeParcela(i, 'valor', Number(parsed.toFixed(2)))
                      }
                    }}
                    style={{ ...inp, padding: '6px 8px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }} />
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
const ParcelasCondicaoEditor = ({ parcelas, onChange, formaPagamentos }) => {
  const total = parcelas.reduce((s, p) => s + (Number(p.percentual) || 0), 0)
  const addLinha = () => {
    onChange([...parcelas, {
      numeroParcela: parcelas.length + 1,
      percentual: 0,
      dias: 30,
      codFormaPagamento: formaPagamentos[0]?.codFormaPagamento ?? null
    }])
  }
  const updLinha = (i, campo, valor) => {
    onChange(parcelas.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p))
  }
  const removeLinha = i => {
    onChange(parcelas.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, numeroParcela: idx + 1 })))
  }
  return (
    <div style={{ flex: '1 1 100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ ...lbl, marginBottom: 0 }}>
          Parcelas {parcelas.length > 0 && `(soma: ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`}
        </label>
        <BtnPrimary onClick={addLinha} style={{ padding: '4px 12px', fontSize: 12 }}>+ Parcela</BtnPrimary>
      </div>
      {parcelas.length === 0 ? (
        <div style={{ fontSize: 12, color: '#94a3b8', padding: '8px 0' }}>Nenhuma parcela adicionada ainda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {parcelas.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
<ReadOnlyField label="Nº" value={p.numeroParcela} style={{ flex: '0 0 50px' }} />
<NumberField label="Percentual (%)" value={p.percentual} onChange={v => updLinha(i, 'percentual', v)} step="0.01" min="0" style={{ flex: '0 0 130px' }} /> <NumberField label="Dias" value={p.dias} onChange={v => updLinha(i, 'dias', v)} step="1" min="0" style={{ flex: '0 0 90px' }} />
<SelectField label="Forma de Pagamento" value={p.codFormaPagamento} onChange={v => updLinha(i, 'codFormaPagamento', Number(v))} options={formaPagamentos.map(f => ({ value: f.codFormaPagamento, label: f.formaPagamento }))} style={{ flex: '1 1 180px' }} />
              <BtnSecondary onClick={() => removeLinha(i)}>Remover</BtnSecondary>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
const NOTA_EMPTY = {
  numero: '',
  serie: '',
  modelo: '',
  codCliente: null,
  dataEmissao: new Date().toISOString().slice(0, 10),
  dataSaida: '',
  tipoFrete: 'CIF',
  valorProdutos: 0,
  valorFrete: 0,
  valorSeguro: 0,
  outrasDespesas: 0,
  valorDesconto: 0,
  valorTotal: 0,
  codCondicao: null,
  codTransp: null,
  placaVeiculo: '',
  observacoes: '',
  situacao: 'CONFERIDA',
  produtos: [],
  parcelasGeradas: [],
}
const ITEM_EMPTY = {
  codProd: null,
  produtoNome: '',
  unidade: '',
  quantidade: '',
  valorUnitario: '',
  descontoPercentual: 0,
  descontoValor: 0,
}
const TIPO_FRETE_OPTIONS = [
  { value: 'CIF', label: 'CIF - Por conta do emitente' },
  { value: 'FOB', label: 'FOB - Por conta do destinatário' },
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
  { key: 'cliente', label: 'Cliente', render: r => r.cliente?.cliente ?? r.cliente?.nome ?? `#${r.codCliente}` },
  { key: 'dataEmissao', label: 'Emissão', render: r => r.dataEmissao ? new Date(r.dataEmissao).toLocaleDateString('pt-BR') : '' },
  { key: 'valorTotal', label: 'Valor Total', render: r => fmtMoney(r.valorTotal) },
  { key: 'situacao', label: 'Situação' },
]
const colsClientes = [
  { key: 'codCliente', label: 'Cód.', mono: true },
  { key: 'cliente', label: 'Cliente', render: r => r.cliente ?? r.nome ?? r.razaoSocial ?? '' },
  { key: 'cpfCnpj', label: 'CPF/CNPJ', render: r => r.cpfCnpj ?? '' },
]
const colsCondicoes = [
  { key: 'codCondicao', label: 'Cód.', mono: true },
  { key: 'condicaoPagamento', label: 'Descrição' },
]
const colsTransportadoras = [
  { key: 'codTransp', label: 'Cód.', mono: true },
  { key: 'transportador', label: 'Transportadora', render: r => r.transportador ?? r.nome ?? '' },
]
const colsProdutos = [
  { key: 'codProd', label: 'Cód.', mono: true },
  { key: 'produto', label: 'Produto' },
  { key: 'unidade', label: 'Unidade' },
  { key: 'precoVenda', label: 'Preço Venda', render: r => fmtMoney(r.precoVenda) },
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
const CLIENTE_NOVO_EMPTY = { tipoPessoa: 'PJ', cliente: '', cpfCnpj: '', codCidade: null, ativo: true }
const CIDADE_EMPTY = { cidade: '', ddd: '', codEstado: null, ativo: true }
const ESTADO_EMPTY = { estado: '', uf: '', codPais: null, ativo: true }
const PAIS_EMPTY = { pais: '', sigla: '', ddi: '', moeda: '', ativo: true }
const PRODUTO_NOVO_EMPTY = {
  produto: '', unidade: '', precoCompra: 0, precoVenda: 0, custoMedio: 0, saldo: 0,
  pesoBruto: 0, pesoLiq: 0, codMarca: null, codCategoria: null, ativo: true,
}
const MARCA_EMPTY = { marca: '', ativo: true }
const CATEGORIA_EMPTY = { categoria: '', ativo: true }
const CONDICAO_NOVA_EMPTY = { condicaoPagamento: '', ativo: true, parcelas: [] }
const TRANSPORTADORA_NOVA_EMPTY = { transportador: '', cpfCnpj: '', codCidade: null, ativo: true }
export default function NotaSaidaPage() {
  const { data, loading, load } = useCrud(notasSaidaApi)
  const [clientes, setClientes] = useState([])
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
  const [itemDraft, setItemDraft] = useState(ITEM_EMPTY)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [openClientes, setOpenClientes] = useState(false)
  const [openCondicoes, setOpenCondicoes] = useState(false)
  const [openTransportadoras, setOpenTransportadoras] = useState(false)
  const [openProdutos, setOpenProdutos] = useState(false)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoCliente, setNovoCliente] = useState(CLIENTE_NOVO_EMPTY)
  const [savingCliente, setSavingCliente] = useState(false)
  const [cidadeTarget, setCidadeTarget] = useState('cliente')
  const [openCidadesEnd, setOpenCidadesEnd] = useState(false)
  const [showNovaCidade, setShowNovaCidade] = useState(false)
  const [novaCidade, setNovaCidade] = useState(CIDADE_EMPTY)
  const [savingCidade, setSavingCidade] = useState(false)
  const [openEstadosEnd, setOpenEstadosEnd] = useState(false)
  const [showNovoEstado, setShowNovoEstado] = useState(false)
  const [novoEstado, setNovoEstado] = useState(ESTADO_EMPTY)
  const [savingEstado, setSavingEstado] = useState(false)
  const [openPaisesEnd, setOpenPaisesEnd] = useState(false)
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
  const [showNovaCondicao, setShowNovaCondicao] = useState(false)
  const [novaCondicao, setNovaCondicao] = useState(CONDICAO_NOVA_EMPTY)
  const [savingCondicao, setSavingCondicao] = useState(false)
  const [showNovaTransportadora, setShowNovaTransportadora] = useState(false)
  const [novaTransportadora, setNovaTransportadora] = useState(TRANSPORTADORA_NOVA_EMPTY)
  const [savingTransportadora, setSavingTransportadora] = useState(false)
  const loadClientes = async () => setClientes(await clientesApi.getAll())
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
    loadClientes(); loadCondicoes(); loadTransportadoras(); loadProdutos()
    loadCidades(); loadEstados(); loadPaises(); loadMarcas(); loadCategorias()
    loadFormaPagamentos()
  }, [])
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updNovoCliente = (k, v) => setNovoCliente(p => ({ ...p, [k]: v }))
  const updCidade = (k, v) => setNovaCidade(p => ({ ...p, [k]: v }))
  const updEstado = (k, v) => setNovoEstado(p => ({ ...p, [k]: v }))
  const updPais = (k, v) => setNovoPais(p => ({ ...p, [k]: v }))
  const updNovoProduto = (k, v) => setNovoProdutoForm(p => ({ ...p, [k]: v }))
  const updMarca = (k, v) => setNovaMarca(p => ({ ...p, [k]: v }))
  const updCategoria = (k, v) => setNovaCategoria(p => ({ ...p, [k]: v }))
  const updNovaTransportadora = (k, v) => setNovaTransportadora(p => ({ ...p, [k]: v }))
  const updDataEmissao = v => {
    if (v && v > hoje()) {
      toast.error('A Data de Emissão não pode ser futura.')
      return
    }
    if (form.dataSaida && v && form.dataSaida < v) {
      setForm(p => ({ ...p, dataEmissao: v, dataSaida: '' }))
      return
    }
    upd('dataEmissao', v)
  }
  const updDataSaida = v => {
    if (v && v > hoje()) {
      toast.error('A Data de Saída não pode ser futura.')
      return
    }
    if (v && form.dataEmissao && v < form.dataEmissao) {
      toast.error('A Data de Saída não pode ser anterior à Data de Emissão.')
      return
    }
    upd('dataSaida', v)
  }
  const updItemQuantidade = v => setItemDraft(d => {
    const quantidade = Number(v) || 0
    const valorUnitario = Number(d.valorUnitario) || 0
    const bruto = quantidade * valorUnitario
    const percentual = Number(d.descontoPercentual) || 0
    return { ...d, quantidade: v, descontoValor: arredondar2(bruto * percentual / 100) }
  })
  const updItemValorUnitario = v => setItemDraft(d => {
    const quantidade = Number(d.quantidade) || 0
    const valorUnitario = Number(v) || 0
    const bruto = quantidade * valorUnitario
    const percentual = Number(d.descontoPercentual) || 0
    return { ...d, valorUnitario: v, descontoValor: arredondar2(bruto * percentual / 100) }
  })
  const updItemDescontoPercentual = v => setItemDraft(d => {
    const quantidade = Number(d.quantidade) || 0
    const valorUnitario = Number(d.valorUnitario) || 0
    const bruto = quantidade * valorUnitario
    const percentual = Number(v) || 0
    return { ...d, descontoPercentual: v, descontoValor: arredondar2(bruto * percentual / 100) }
  })
  const updItemDescontoValor = v => setItemDraft(d => {
    const quantidade = Number(d.quantidade) || 0
    const valorUnitario = Number(d.valorUnitario) || 0
    const bruto = quantidade * valorUnitario
    const descontoValor = Number(v) || 0
    const percentual = bruto > 0 ? (descontoValor / bruto) * 100 : 0
    return { ...d, descontoValor: v, descontoPercentual: percentual }
  })
  const selectProdutoItem = r => {
    setItemDraft({
      ...ITEM_EMPTY,
      codProd: r.codProd,
      produtoNome: r.produto ?? '',
      unidade: r.unidade ?? '',
      valorUnitario: Number(r.precoVenda) || 0,
    })
    setOpenProdutos(false)
  }
  const addItem = () => {
    if (!itemDraft.codProd) { toast.error('Selecione um produto.'); return }
    if (!itemDraft.quantidade || Number(itemDraft.quantidade) <= 0) { toast.error('Informe a quantidade.'); return }
    if (!Number.isInteger(Number(itemDraft.quantidade))) { toast.error('A quantidade deve ser um número inteiro.'); return }
    if (itemDraft.valorUnitario === '' || Number(itemDraft.valorUnitario) < 0) { toast.error('Informe o valor unitário.'); return }
    const jaExiste = (form.produtos ?? []).some(p => Number(p.codProd) === Number(itemDraft.codProd))
    if (jaExiste) { toast.error('Este produto já foi adicionado à nota.'); return }
    const quantidade = Number(itemDraft.quantidade)
    const valorUnitario = Number(itemDraft.valorUnitario)
    const bruto = quantidade * valorUnitario
    const descontoPercentual = Number(itemDraft.descontoPercentual) || 0
    const descontoValor = arredondar2(Number(itemDraft.descontoValor) || 0)
    const valorTotal = arredondar2(bruto - descontoValor)
    if (descontoValor > bruto) { toast.error('O desconto não pode ser maior que o valor bruto do item.'); return }
    const novoItem = {
      numero: String(form.numero ?? ''),
      modelo: String(form.modelo ?? ''),
      serie: String(form.serie ?? ''),
      codCliente: Number(form.codCliente),
      codProd: Number(itemDraft.codProd),
      produtoNome: itemDraft.produtoNome,
      unidade: itemDraft.unidade,
      quantidade,
      valorUnitario,
      valorTotal,
      descontoPercentual,
      descontoValor,
      rateioFrete: 0,
      rateioSeguro: 0,
      rateioOutras: 0,
      custoFinal: 0,
    }
    setForm(f => ({ ...f, produtos: [...(f.produtos ?? []), novoItem], parcelasGeradas: [] }))
    setItemDraft(ITEM_EMPTY)
  }
  const removeItem = i => {
    setForm(f => {
      const produtos = (f.produtos ?? []).filter((_, idx) => idx !== i)
      return { ...f, produtos, parcelasGeradas: [] }
    })
  }
  const calcularItens = produtosList => (produtosList ?? []).reduce((total, item) => total + (Number(item.valorTotal) || 0), 0)
  const calcularDescontos = produtosList => (produtosList ?? []).reduce((total, item) => total + (Number(item.descontoValor) || 0), 0)
  const valorProdutosAtual = arredondar2(calcularItens(form.produtos))
  const totalDescontosAtual = arredondar2(calcularDescontos(form.produtos))
  const valorTotalAtual = arredondar2(
    valorProdutosAtual +
    (Number(form.valorFrete) || 0) +
    (Number(form.valorSeguro) || 0) +
    (Number(form.outrasDespesas) || 0)
  )
  const produtosComRateio = (form.produtos ?? []).map(item => {
    const proporcao = valorProdutosAtual > 0 ? (Number(item.valorTotal) || 0) / valorProdutosAtual : 0
    const rateioFrete = arredondar2((Number(form.valorFrete) || 0) * proporcao)
    const rateioSeguro = arredondar2((Number(form.valorSeguro) || 0) * proporcao)
    const rateioOutras = arredondar2((Number(form.outrasDespesas) || 0) * proporcao)
    const qtd = Number(item.quantidade) || 0
    const custoFinal = qtd > 0
      ? arredondar2((Number(item.valorUnitario) || 0) + (rateioFrete + rateioSeguro + rateioOutras - (Number(item.descontoValor) || 0)) / qtd)
      : (Number(item.valorUnitario) || 0)
    return {
      ...item,
      rateioFrete,
      rateioSeguro,
      rateioOutras,
      custoFinal,
    }
  })
  const valorTotalItemDraft = arredondar2((Number(itemDraft.quantidade) || 0) * (Number(itemDraft.valorUnitario) || 0))
  const valorLiquidoItemDraft = arredondar2(valorTotalItemDraft - (Number(itemDraft.descontoValor) || 0))
  const clienteSelecionado = clientes.find(c => Number(c.codCliente) === Number(form.codCliente)) ?? form.cliente
  const clienteLabel = clienteSelecionado?.cliente ?? clienteSelecionado?.nome ?? clienteSelecionado?.razaoSocial ?? ''
  const selectCliente = r => {
    setForm(f => ({
      ...f,
      codCliente: Number(r.codCliente),
      cliente: r,
      codCondicao: r.condicao?.codCondicao ?? null,
      condicaoPagamento: r.condicao ?? null,
    }))
    setOpenClientes(false)
  }
  const condicaoSelecionada = condicoes.find(c => Number(c.codCondicao) === Number(form.codCondicao)) ?? form.condicaoPagamento
  const condicaoLabel = condicaoSelecionada?.condicaoPagamento ?? condicaoSelecionada?.descricao ?? ''
  const selectCondicao = r => {
    setForm(f => ({
      ...f,
      codCondicao: Number(r.codCondicao),
      condicaoPagamento: r,
      parcelasGeradas: []
    }))
    setOpenCondicoes(false)
  }
  const gerarParcelas = async () => {
    if (!form.produtos?.length) {
      toast.error('Adicione ao menos um produto antes de gerar as parcelas.')
      return
    }
    if (!form.codCondicao) {
      toast.error('Selecione uma Condição de Pagamento antes.')
      return
    }
    if (!form.dataEmissao) {
      toast.error('Informe a Data de Emissão antes.')
      return
    }
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
      return {
        numeroParcela,
        vencimento: venc ? venc.toISOString().slice(0, 10) : '',
        percentual: 0,
        valor,
        codFormaPagamento,
        formaNome
      }
    })
    const totalGerado = arredondar2(geradas.reduce((s, p) => s + (Number(p.valor) || 0), 0))
    const diferenca = arredondar2(valorTotalAtual - totalGerado)
    if (geradas.length > 0 && diferenca !== 0) {
      const ultima = geradas.length - 1
      geradas[ultima] = {
        ...geradas[ultima],
        valor: arredondar2(geradas[ultima].valor + diferenca)
      }
    }
    geradas = geradas.map(p => ({
      ...p,
      percentual: valorTotalAtual > 0
        ? arredondar2((Number(p.valor) / valorTotalAtual) * 100)
        : 0
    }))
    setForm(f => ({
      ...f,
      condicaoPagamento: condicao,
      parcelasGeradas: geradas
    }))
  }
  const updParcelaGerada = (i, campo, valor) => {
    setForm(f => ({
      ...f,
      parcelasGeradas: (f.parcelasGeradas ?? []).map((p, idx) =>
        idx === i ? { ...p, [campo]: valor } : p
      )
    }))
  }
  const transportadorSelecionado = transportadoras.find(t => Number(t.codTransp) === Number(form.codTransp)) ?? form.transportador
  const transportadorLabel = transportadorSelecionado?.transportador ?? transportadorSelecionado?.nome ?? ''
  const selectTransportadora = r => {
    setForm(f => ({
      ...f,
      codTransp: Number(r.codTransp),
      transportador: r
    }))
    setOpenTransportadoras(false)
  }
  const cidadeNovoClienteLabel = cidades.find(c => c.codCidade === novoCliente.codCidade)?.cidade ?? ''
  const cidadeNovaTransportadoraLabel = cidades.find(c => c.codCidade === novaTransportadora.codCidade)?.cidade ?? ''
  const estadoNaCidadeLabel = (() => {
    const e = estados.find(e => e.codEstado === novaCidade.codEstado)
    return e ? `${e.estado} - ${e.uf}` : ''
  })()
  const paisNoEstadoLabel = paises.find(p => p.codPais === novoEstado.codPais)?.pais ?? ''
  const abrirCidadesPara = target => {
    setCidadeTarget(target)
    setShowNovaCidade(false)
    setOpenCidadesEnd(true)
  }
  const saveNovoCliente = async () => {
    if (!novoCliente.cliente?.trim()) { toast.error('Informe o cliente.'); return }
    if (!novoCliente.codCidade) { toast.error('Selecione a cidade.'); return }
    setSavingCliente(true)
    try {
      const created = await clientesApi.create(novoCliente)
      toast.success('Cliente cadastrado!')
      await loadClientes()
      const codNovo = created?.codCliente ?? created?.id
      if (codNovo) {
        selectCliente({
          ...novoCliente,
          codCliente: codNovo,
          condicao: null
        })
      }
      setShowNovoCliente(false)
      setNovoCliente(CLIENTE_NOVO_EMPTY)
    } catch {
      toast.error('Erro ao salvar cliente.')
    } finally {
      setSavingCliente(false)
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
      if (codNovo) {
        if (cidadeTarget === 'transportadora') updNovaTransportadora('codCidade', codNovo)
        else updNovoCliente('codCidade', codNovo)
      }
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
  const cancelClienteNovo = () => {
    setShowNovoCliente(false)
    setNovoCliente(CLIENTE_NOVO_EMPTY)
  }
  const cancelCidade = () => {
    setShowNovaCidade(false)
    setNovaCidade(CIDADE_EMPTY)
  }
  const cancelEstado = () => {
    setShowNovoEstado(false)
    setNovoEstado(ESTADO_EMPTY)
  }
  const cancelPais = () => {
    setShowNovoPais(false)
    setNovoPais(PAIS_EMPTY)
  }
  const cancelTransportadoraNova = () => {
    setShowNovaTransportadora(false)
    setNovaTransportadora(TRANSPORTADORA_NOVA_EMPTY)
  }
  const cancelCondicaoNova = () => {
    setShowNovaCondicao(false)
    setNovaCondicao(CONDICAO_NOVA_EMPTY)
  }
  const closeClientes = () => {
    setOpenClientes(false)
    cancelClienteNovo()
  }
  const closeCidadesEnd = () => {
    setOpenCidadesEnd(false)
    cancelCidade()
  }
  const closeEstadosEnd = () => {
    setOpenEstadosEnd(false)
    cancelEstado()
  }
  const closePaisesEnd = () => {
    setOpenPaisesEnd(false)
    cancelPais()
  }
  const closeTransportadoras = () => {
    setOpenTransportadoras(false)
    cancelTransportadoraNova()
  }
  const closeCondicoes = () => {
    setOpenCondicoes(false)
    cancelCondicaoNova()
  }
  const isDirtyNovoCliente = showNovoCliente && JSON.stringify(novoCliente) !== JSON.stringify(CLIENTE_NOVO_EMPTY)
  const clientesGuard = useModalGuard({
    isOpen: openClientes,
    isDirty: isDirtyNovoCliente,
    onClose: closeClientes,
    onSave: showNovoCliente ? saveNovoCliente : undefined,
    paused: openCidadesEnd,
  })
  const isDirtyCidade = showNovaCidade && JSON.stringify(novaCidade) !== JSON.stringify(CIDADE_EMPTY)
  const cidadesEndGuard = useModalGuard({
    isOpen: openCidadesEnd,
    isDirty: isDirtyCidade,
    onClose: closeCidadesEnd,
    onSave: showNovaCidade ? saveNovaCidade : undefined,
    paused: openEstadosEnd,
  })
  const isDirtyEstado = showNovoEstado && JSON.stringify(novoEstado) !== JSON.stringify(ESTADO_EMPTY)
  const estadosEndGuard = useModalGuard({
    isOpen: openEstadosEnd,
    isDirty: isDirtyEstado,
    onClose: closeEstadosEnd,
    onSave: showNovoEstado ? saveNovoEstado : undefined,
    paused: openPaisesEnd,
  })
  const isDirtyPais = showNovoPais && JSON.stringify(novoPais) !== JSON.stringify(PAIS_EMPTY)
  const paisesEndGuard = useModalGuard({
    isOpen: openPaisesEnd,
    isDirty: isDirtyPais,
    onClose: closePaisesEnd,
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
      if (codNovo) {
        selectProdutoItem({
          codProd: codNovo,
          produto: novoProdutoForm.produto,
          unidade: novoProdutoForm.unidade,
          precoVenda: novoProdutoForm.precoVenda
        })
      }
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
  const cancelProdutoNovo = () => {
    setShowNovoProduto(false)
    setNovoProdutoForm(PRODUTO_NOVO_EMPTY)
  }
  const cancelMarca = () => {
    setShowNovaMarca(false)
    setNovaMarca(MARCA_EMPTY)
  }
  const cancelCategoria = () => {
    setShowNovaCategoria(false)
    setNovaCategoria(CATEGORIA_EMPTY)
  }
  const closeProdutos = () => {
    setOpenProdutos(false)
    cancelProdutoNovo()
  }
  const closeMarcasNota = () => {
    setOpenMarcasNota(false)
    cancelMarca()
  }
  const closeCategoriasNota = () => {
    setOpenCategoriasNota(false)
    cancelCategoria()
  }
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
  const saveNovaCondicao = async () => {
    if (!novaCondicao.condicaoPagamento?.trim()) { toast.error('Informe a descrição da condição.'); return }
    if (novaCondicao.parcelas.length === 0) { toast.error('Adicione ao menos uma parcela.'); return }
    setSavingCondicao(true)
    try {
      const created = await condicoesApi.create(novaCondicao)
      toast.success('Condição de pagamento cadastrada!')
      await loadCondicoes()
      const codNovo = created?.codCondicao ?? created?.id
      if (codNovo) {
        selectCondicao({
          ...novaCondicao,
          codCondicao: codNovo
        })
      }
      setShowNovaCondicao(false)
      setNovaCondicao(CONDICAO_NOVA_EMPTY)
    } catch {
      toast.error('Erro ao salvar condição de pagamento.')
    } finally {
      setSavingCondicao(false)
    }
  }
  const isDirtyCondicao = showNovaCondicao && JSON.stringify(novaCondicao) !== JSON.stringify(CONDICAO_NOVA_EMPTY)
  const condicoesGuard = useModalGuard({
    isOpen: openCondicoes,
    isDirty: isDirtyCondicao,
    onClose: closeCondicoes,
    onSave: showNovaCondicao ? saveNovaCondicao : undefined,
  })
  const saveNovaTransportadora = async () => {
    if (!novaTransportadora.transportador?.trim()) { toast.error('Informe a transportadora.'); return }
    setSavingTransportadora(true)
    try {
      const created = await transportadoresApi.create(novaTransportadora)
      toast.success('Transportadora cadastrada!')
      await loadTransportadoras()
      const codNovo = created?.codTransp ?? created?.id
      if (codNovo) {
        selectTransportadora({
          ...novaTransportadora,
          codTransp: codNovo
        })
      }
      setShowNovaTransportadora(false)
      setNovaTransportadora(TRANSPORTADORA_NOVA_EMPTY)
    } catch {
      toast.error('Erro ao salvar transportadora.')
    } finally {
      setSavingTransportadora(false)
    }
  }
  const isDirtyTransportadora = showNovaTransportadora && JSON.stringify(novaTransportadora) !== JSON.stringify(TRANSPORTADORA_NOVA_EMPTY)
  const transportadorasGuard = useModalGuard({
    isOpen: openTransportadoras,
    isDirty: isDirtyTransportadora,
    onClose: closeTransportadoras,
    onSave: showNovaTransportadora ? saveNovaTransportadora : undefined,
    paused: openCidadesEnd,
  })
  const anyLookupOpen = openClientes || openCondicoes || openTransportadoras || openProdutos
  const abrirNovaNota = () => {
    const nova = {
      ...NOTA_EMPTY,
      dataEmissao: hoje(),
      dataSaida: hoje(),
    }
    setForm(nova)
    setOriginalForm(nova)
    setItemDraft(ITEM_EMPTY)
    setEditing(false)
    setOpen(true)
  }
  const abrirEdicaoNota = async r => {
    try {
      const completa = await notasSaidaApi.getOne(
        chaveNota(r.numero, r.modelo, r.serie, r.codCliente)
      )
      const formCarregado = {
        ...completa,
        numero: String(completa.numero ?? ''),
        serie: String(completa.serie ?? ''),
        modelo: String(completa.modelo ?? ''),
        codCliente: Number(completa.codCliente),
        dataEmissao: toDateInput(completa.dataEmissao),
        dataSaida: toDateInput(completa.dataSaida),
        valorFrete: Number(completa.valorFrete) || 0,
        valorSeguro: Number(completa.valorSeguro) || 0,
        outrasDespesas: Number(completa.outrasDespesas) || 0,
        valorDesconto: Number(completa.valorDesconto) || 0,
        valorProdutos: Number(completa.valorProdutos) || 0,
        valorTotal: Number(completa.valorTotal) || 0,
        codCondicao: completa.codCondicao ? Number(completa.codCondicao) : null,
        codTransp: completa.codTransp ? Number(completa.codTransp) : null,
        produtos: (completa.produtos ?? []).map(p => {
          const produto = p.produto ?? p.Produto ?? {}
          return {
            numero: String(p.numero ?? completa.numero ?? ''),
            modelo: String(p.modelo ?? completa.modelo ?? ''),
            serie: String(p.serie ?? completa.serie ?? ''),
            codCliente: Number(p.codCliente ?? completa.codCliente),
            codProd: Number(p.codProd),
            produtoNome: produto.produto ?? produto.Produto ?? `Produto #${p.codProd}`,
            unidade: produto.unidade ?? produto.Unidade ?? '',
            quantidade: Number(p.quantidade) || 0,
            valorUnitario: Number(p.valorUnitario) || 0,
            valorTotal: Number(p.valorTotal) || 0,
            descontoPercentual: Number(p.descontoPercentual) || 0,
            descontoValor: Number(p.descontoValor) || 0,
            rateioFrete: Number(p.rateioFrete) || 0,
            rateioSeguro: Number(p.rateioSeguro) || 0,
            rateioOutras: Number(p.rateioOutras) || 0,
            custoFinal: Number(p.custoFinal) || 0,
          }
        }),
        parcelasGeradas: completa.parcelasGeradas ?? [],
      }
      setForm(formCarregado)
      setOriginalForm(formCarregado)
      setItemDraft(ITEM_EMPTY)
      setEditing(true)
      setOpen(true)
    } catch {
      toast.error('Erro ao carregar a nota.')
    }
  }
  const save = async () => {
    if (!form.codCliente) {
      toast.error('Selecione o cliente.')
      return
    }
    if (!form.numero || !form.serie || !form.modelo) {
      toast.error('Informe número, série e modelo.')
      return
    }
    if (!form.dataEmissao) {
      toast.error('Informe a data de emissão.')
      return
    }
    if (form.dataEmissao > hoje()) {
      toast.error('A Data de Emissão não pode ser futura.')
      return
    }
    if (form.dataSaida) {
      if (form.dataSaida > hoje()) {
        toast.error('A Data de Saída não pode ser futura.')
        return
      }
      if (form.dataSaida < form.dataEmissao) {
        toast.error('A Data de Saída não pode ser anterior à Data de Emissão.')
        return
      }
    }
    if (!form.produtos || form.produtos.length === 0) {
      toast.error('Adicione ao menos um item.')
      return
    }
    if (form.produtos.some(p => !p.quantidade || Number(p.quantidade) <= 0)) {
      toast.error('Todos os itens devem possuir quantidade maior que zero.')
      return
    }
    if (form.produtos.some(p => !Number.isInteger(Number(p.quantidade)))) {
      toast.error('A quantidade dos itens deve ser inteira.')
      return
    }
    const situacaoAnterior = originalForm?.situacao ?? 'CONFERIDA'
    const situacaoNova = form.situacao ?? 'CONFERIDA'
    if (situacaoAnterior === 'CONFERIDA' && situacaoNova !== 'CONFERIDA') {
      toast.error('Uma nota conferida não pode voltar para Pendente ou Cancelada.')
      return
    }
    const payload = {
      ...form,
      numero: String(form.numero ?? ''),
      serie: String(form.serie ?? ''),
      modelo: String(form.modelo ?? ''),
      codCliente: Number(form.codCliente),
      dataEmissao: form.dataEmissao,
      dataSaida: form.dataSaida || null,
      valorProdutos: valorProdutosAtual,
      valorFrete: Number(form.valorFrete) || 0,
      valorSeguro: Number(form.valorSeguro) || 0,
      outrasDespesas: Number(form.outrasDespesas) || 0,
      valorDesconto: totalDescontosAtual,
      valorTotal: valorTotalAtual,
      codCondicao: form.codCondicao ? Number(form.codCondicao) : null,
      codTransp: form.codTransp ? Number(form.codTransp) : null,
      placaVeiculo: form.placaVeiculo || null,
      observacoes: form.observacoes || null,
      situacao: situacaoNova,
      produtos: produtosComRateio.map(item => ({
        numero: String(item.numero ?? form.numero ?? ''),
        modelo: String(item.modelo ?? form.modelo ?? ''),
        serie: String(item.serie ?? form.serie ?? ''),
        codCliente: Number(item.codCliente ?? form.codCliente),
        codProd: Number(item.codProd),
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario) || 0,
        valorTotal: Number(item.valorTotal) || 0,
        descontoPercentual: Number(item.descontoPercentual) || 0,
        descontoValor: Number(item.descontoValor) || 0,
        rateioFrete: Number(item.rateioFrete) || 0,
        rateioSeguro: Number(item.rateioSeguro) || 0,
        rateioOutras: Number(item.rateioOutras) || 0,
        custoFinal: Number(item.custoFinal) || 0,
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
     await notasSaidaApi.update(chaveNota(payload.numero, payload.modelo, payload.serie, payload.codCliente), payloadPendente)
     const responseConfirmar = await fetch(`/api/NotasSaida/confirmar/${payload.numero}/${payload.modelo}/${payload.serie}/${payload.codCliente}`, { method: 'PUT' })
     if (!responseConfirmar.ok) {
      const mensagem = await responseConfirmar.text()
      throw new Error(mensagem || 'Erro ao confirmar a nota.')
     }
    } else {
     await notasSaidaApi.update(chaveNota(payload.numero, payload.modelo, payload.serie, payload.codCliente), payload)
    }
   } else {
    const payloadPendente = { ...payload, situacao: 'PENDENTE' }
    await notasSaidaApi.create(payloadPendente)
    if (String(payload.situacao).toUpperCase() === 'CONFERIDA') {
     const responseConfirmar = await fetch(`/api/NotasSaida/confirmar/${payload.numero}/${payload.modelo}/${payload.serie}/${payload.codCliente}`, { method: 'PUT' })
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
    if (!confirm) return
    try {
      const motivo = confirm.motivoCancelamento || 'Cancelamento de nota de saída'
      const response = await fetch(
        `/api/NotasSaida/cancelar/${confirm.numero}/${confirm.modelo}/${confirm.serie}/${confirm.codCliente}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ motivo })
        }
      )
      if (!response.ok) {
        const mensagem = await response.text()
        throw new Error(mensagem || 'Erro ao cancelar a nota.')
      }
      toast.success('Nota de saída cancelada.')
      setConfirm(null)
      await load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao cancelar a nota.')
    }
  }
  const chavePronta = !!form.numero && !!form.serie && !!form.modelo && !!form.codCliente
  const possuiItens = (form.produtos ?? []).length > 0
  const parcelasGeradas = (form.parcelasGeradas ?? []).length > 0
  const podeEditarNota = !editing || form.situacao === 'PENDENTE'
  const bloquearChave = possuiItens || parcelasGeradas || !podeEditarNota
  const bloquearPrimeiros7 = possuiItens || parcelasGeradas || !podeEditarNota
  const bloquearTudo = parcelasGeradas || !podeEditarNota
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
  return (
    <div>
      <PageHeader title="Notas de Saída" sub="Consulta de Notas de Saída" label="Nova Nota" onNew={abrirNovaNota} disabled={open} />
      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        onEdit={abrirEdicaoNota}
        onDelete={r => setConfirm(r)}
      />
      <Modal
        open={open}
        title={editing ? 'Editar Nota de Saída' : 'Nova Nota de Saída'}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={save}
        wide
        maxWidth={2000}
        isDirty={isDirty}
        suspended={anyLookupOpen}
      >
        <div style={{ padding: '18px 24px 0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Inp
            label="Modelo"
            value={form.modelo}
            onChange={v => upd('modelo', v)}
            disabled={bloquearChave}
            style={{ flex: '0 0 80px' }}
          />
          <Inp
            label="Série"
            value={form.serie}
            onChange={v => upd('serie', v)}
            disabled={bloquearChave}
            style={{ flex: '0 0 70px' }}
          />
          <Inp
            label="Número"
            value={form.numero}
            onChange={v => upd('numero', v)}
            disabled={bloquearChave}
            style={{ flex: '0 0 110px' }}
          />
          <div style={{ flex: '0 0 105px' }}>
            <label style={lbl}>Código</label>
            <input type="text" value={form.codCliente ?? ''} readOnly
              style={{ ...inp, background: '#eef2f7', color: '#64748b', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }} />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
<LookupField label="Cliente *" value={clienteLabel} disabled={bloquearChave} onSearch={() => { setShowNovoCliente(false); setOpenClientes(true) }} />
          </div>
<DateField label="Data Emissão" value={form.dataEmissao} onChange={updDataEmissao} disabled={bloquearPrimeiros7} max={hoje()} style={{ flex: '0 0 150px' }} />
<DateField label="Data Saída" value={form.dataSaida} onChange={updDataSaida} disabled={bloquearPrimeiros7} min={form.dataEmissao || undefined} max={hoje()} style={{ flex: '0 0 150px' }} />
        </div>
        {!chavePronta && <AvisoChavesPendentes />}
        {chavePronta && podeEditarNota && !parcelasGeradas && (
          <InlineForm title="Adicionar Item">
            <div style={{ flex: '1 1 260px', minWidth: 220 }}>
<LookupField label="Produto *" value={itemDraft.produtoNome} onSearch={() => { setShowNovoProduto(false); setOpenProdutos(true) }} />
            </div>
<ReadOnlyField label="Unidade" value={itemDraft.unidade || '-'} style={{ flex: '0 0 70px' }} />
<NumberField label="Quantidade" value={itemDraft.quantidade} onChange={updItemQuantidade} step="1" min="1" style={{ flex: '0 0 110px' }} />
<NumberField label="Valor Unitário" value={itemDraft.valorUnitario} onChange={updItemValorUnitario} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
<NumberField label="Desconto (%)" value={itemDraft.descontoPercentual} onChange={updItemDescontoPercentual} step="0.01" min="0" style={{ flex: '0 0 110px' }} />
<NumberField label="Desconto (R$)" value={itemDraft.descontoValor} onChange={updItemDescontoValor} step="0.01" min="0" style={{ flex: '0 0 130px' }} />
<ReadOnlyField label="Valor Bruto" value={fmtMoney(valorTotalItemDraft)} style={{ flex: '0 0 130px' }} />
<ReadOnlyField label="Valor Líquido" value={fmtMoney(valorLiquidoItemDraft)} style={{ flex: '0 0 140px' }} />
            <BtnPrimary onClick={addItem} style={{ padding: '9px 20px' }}>
              Adicionar
            </BtnPrimary>
          </InlineForm>
        )}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
            Produtos da Nota
          </div>
        </div>
        <ItemsList
          items={produtosComRateio}
          onRemove={removeItem}
          podeRemover={podeEditarNota}
        />
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
<SelectField label="Tipo Frete" value={form.tipoFrete} onChange={v => upd('tipoFrete', v)} options={TIPO_FRETE_OPTIONS} disabled={bloquearTudo} style={{ flex: '0 0 230px' }} />
<SelectField label="Situação" value={form.situacao} onChange={v => upd('situacao', v)} options={SITUACAO_OPTIONS.filter(o => o.value !== 'CANCELADA' || form.situacao === 'CANCELADA')} disabled={bloquearTudo || form.situacao === 'CONFERIDA'} style={{ flex: '0 0 180px' }} />
          <div style={{ flex: '1 1 260px', minWidth: 220 }}>
<LookupField label="Transportadora" value={transportadorLabel} onSearch={() => { setShowNovaTransportadora(false); setOpenTransportadoras(true) }} disabled={bloquearTudo} />
          </div>
          <div style={{ flex: '0 0 140px' }}>
<FField label="Placa Veículo" value={form.placaVeiculo ?? ''} onChange={v => upd('placaVeiculo', v.toUpperCase())} disabled={bloquearTudo} />
          </div>
        </div>
        <div style={{ padding: '14px 24px 4px' }}>
<TextAreaField label="Observações" value={form.observacoes} onChange={v => upd('observacoes', v)} disabled={bloquearTudo} />
        </div>
        <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', borderTop: '1px solid #e2e6ed', paddingTop: 16 }}>
<ReadOnlyField label="Valor Produtos" value={fmtMoney(valorProdutosAtual)} style={{ flex: '1 1 150px' }} />
<NumberField label="Valor Frete" value={form.valorFrete} onChange={v => upd('valorFrete', v)} step="0.01" min="0" disabled={bloquearTudo} style={{ flex: '1 1 130px' }} />
<NumberField label="Valor Seguro" value={form.valorSeguro} onChange={v => upd('valorSeguro', v)} step="0.01" min="0" disabled={bloquearTudo} style={{ flex: '1 1 130px' }} />
<NumberField label="Outras Despesas" value={form.outrasDespesas} onChange={v => upd('outrasDespesas', v)} step="0.01" min="0" disabled={bloquearTudo} style={{ flex: '1 1 140px' }} />
<ReadOnlyField label="Total Descontos" value={fmtMoney(totalDescontosAtual)} style={{ flex: '1 1 150px' }} />
<ReadOnlyField label="Valor Total da Nota" value={fmtMoney(valorTotalAtual)} bold style={{ flex: '1 1 170px' }} />
        </div>
        <ParcelasGridEditavel
          parcelas={form.parcelasGeradas ?? []}
          valorTotalNota={valorTotalAtual}
          onChangeParcela={updParcelaGerada}
          onGerar={gerarParcelas}
          condicaoLabel={condicaoLabel}
          onSearchCondicao={() => { setShowNovaCondicao(false); setOpenCondicoes(true) }}
          podeGerar={!!condicaoSelecionada && possuiItens && !parcelasGeradas && podeEditarNota}
          condicaoDisabled={bloquearTudo}
        />
      </Modal>
      {openClientes && (
        <Overlay onClose={clientesGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={640}>
            <ModalHeader
              title="Consulta de Clientes"
              onClose={clientesGuard.attemptClose}
              badge={!showNovoCliente && <BtnNovo onClick={() => setShowNovoCliente(true)} label="Novo Cliente" />}
            />
            {showNovoCliente && (
              <InlineForm title="Novo Cliente">
                <Inp
                  label="Cliente *"
                  value={novoCliente.cliente}
                  onChange={v => updNovoCliente('cliente', v)}
                  placeholder="Razão social / nome"
                  style={{ flex: '1 1 220px' }}
                />
                <Inp
                  label={novoCliente.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                  value={novoCliente.cpfCnpj}
                  onChange={v => updNovoCliente('cpfCnpj', v)}
                  style={{ flex: '1 1 180px' }}
                />
<LookupField label="Cidade *" value={cidadeNovoClienteLabel} onSearch={() => abrirCidadesPara('cliente')} style={{ flex: '1 1 200px' }} />
<CheckAtivo checked={novoCliente.ativo} onChange={v => updNovoCliente('ativo', v)} />
                <SaveRow
                  onCancel={cancelClienteNovo}
                  onSave={saveNovoCliente}
                  saving={savingCliente}
                  label="Salvar Cliente"
                />
              </InlineForm>
            )}
            <LookupTable cols={colsClientes} rows={clientes} onSelect={selectCliente} />
          </ModalBox>
        </Overlay>
      )}
      {openCidadesEnd && (
        <Overlay onClose={cidadesEndGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={680}>
            <ModalHeader
              title="Consulta de Cidades"
              onClose={cidadesEndGuard.attemptClose}
              badge={!showNovaCidade && <BtnNovo onClick={() => setShowNovaCidade(true)} label="Nova Cidade" />}
            />
            {showNovaCidade && (
              <InlineForm title="Nova Cidade">
                <Inp
                  label="Cidade *"
                  value={novaCidade.cidade}
                  onChange={v => updCidade('cidade', v)}
                  placeholder="Nome da cidade"
                  style={{ flex: '1 1 200px' }}
                />
                <Inp
                  label="DDD"
                  value={novaCidade.ddd}
                  onChange={v => updCidade('ddd', v)}
                  maxLength={3}
                  placeholder="11"
                  style={{ flex: '0 0 72px' }}
                />
<LookupField label="Estado *" value={estadoNaCidadeLabel} onSearch={() => { setShowNovoEstado(false); setOpenEstadosEnd(true) }} />
<CheckAtivo checked={novaCidade.ativo} onChange={v => updCidade('ativo', v)} />
                <SaveRow
                  onCancel={cancelCidade}
                  onSave={saveNovaCidade}
                  saving={savingCidade}
                  label="Salvar Cidade"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsCidades}
              rows={cidades}
              onSelect={r => {
                if (cidadeTarget === 'transportadora') updNovaTransportadora('codCidade', r.codCidade)
                else updNovoCliente('codCidade', r.codCidade)
                setOpenCidadesEnd(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      {openEstadosEnd && (
        <Overlay onClose={estadosEndGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={680}>
            <ModalHeader
              title="Consulta de Estados"
              onClose={estadosEndGuard.attemptClose}
              badge={!showNovoEstado && <BtnNovo onClick={() => setShowNovoEstado(true)} label="Novo Estado" />}
            />
            {showNovoEstado && (
              <InlineForm title="Novo Estado">
                <Inp
                  label="Estado *"
                  value={novoEstado.estado}
                  onChange={v => updEstado('estado', v)}
                  placeholder="Nome do estado"
                  style={{ flex: '1 1 200px' }}
                />
                <Inp
                  label="UF *"
                  value={novoEstado.uf}
                  onChange={v => updEstado('uf', v.toUpperCase())}
                  maxLength={2}
                  placeholder="SP"
                  style={{ flex: '0 0 72px' }}
                />
<LookupField label="País *" value={paisNoEstadoLabel} onSearch={() => { setShowNovoPais(false); setOpenPaisesEnd(true) }} />
<CheckAtivo checked={novoEstado.ativo} onChange={v => updEstado('ativo', v)} />
                <SaveRow
                  onCancel={cancelEstado}
                  onSave={saveNovoEstado}
                  saving={savingEstado}
                  label="Salvar Estado"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsEstados}
              rows={estados}
              onSelect={r => {
                updCidade('codEstado', r.codEstado)
                setOpenEstadosEnd(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      {openPaisesEnd && (
        <Overlay onClose={paisesEndGuard.attemptClose} zIndex={90}>
          <ModalBox maxWidth={680}>
            <ModalHeader
              title="Consulta de Países"
              onClose={paisesEndGuard.attemptClose}
              badge={!showNovoPais && <BtnNovo onClick={() => setShowNovoPais(true)} label="Novo País" />}
            />
            {showNovoPais && (
              <InlineForm title="Novo País">
                <Inp
                  label="País *"
                  value={novoPais.pais}
                  onChange={v => updPais('pais', v)}
                  placeholder="Nome do país"
                  style={{ flex: '1 1 200px' }}
                />
                <Inp
                  label="Sigla"
                  value={novoPais.sigla}
                  onChange={v => updPais('sigla', v.toUpperCase())}
                  maxLength={3}
                  placeholder="BR"
                  style={{ flex: '0 0 80px' }}
                />
                <Inp
                  label="DDI"
                  value={novoPais.ddi}
                  onChange={v => updPais('ddi', v)}
                  maxLength={6}
                  placeholder="+55"
                  style={{ flex: '0 0 80px' }}
                />
                <Inp
                  label="Moeda"
                  value={novoPais.moeda}
                  onChange={v => updPais('moeda', v)}
                  maxLength={10}
                  placeholder="BRL"
                  style={{ flex: '1 1 120px' }}
                />
<CheckAtivo checked={novoPais.ativo} onChange={v => updPais('ativo', v)} />
                <SaveRow
                  onCancel={cancelPais}
                  onSave={saveNovoPais}
                  saving={savingPais}
                  label="Salvar País"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsPaises}
              rows={paises}
              onSelect={r => {
                updEstado('codPais', r.codPais)
                setOpenPaisesEnd(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      {openCondicoes && (
        <Overlay onClose={condicoesGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={760}>
            <ModalHeader
              title="Consulta de Condições de Pagamento"
              onClose={condicoesGuard.attemptClose}
              badge={!showNovaCondicao && <BtnNovo onClick={() => setShowNovaCondicao(true)} label="Nova Condição" />}
            />
            {showNovaCondicao && (
              <InlineForm title="Nova Condição de Pagamento">
                <Inp
                  label="Descrição *"
                  value={novaCondicao.condicaoPagamento}
                  onChange={v => setNovaCondicao(p => ({ ...p, condicaoPagamento: v }))}
                  placeholder="Ex.: 30/60/90 dias"
                  style={{ flex: '1 1 260px' }}
                />
<CheckAtivo checked={novaCondicao.ativo} onChange={v => setNovaCondicao(p => ({ ...p, ativo: v }))} />
                <ParcelasCondicaoEditor
                  parcelas={novaCondicao.parcelas}
                  onChange={parcelas => setNovaCondicao(p => ({ ...p, parcelas }))}
                  formaPagamentos={formaPagamentos}
                />
                <SaveRow
                  onCancel={cancelCondicaoNova}
                  onSave={saveNovaCondicao}
                  saving={savingCondicao}
                  label="Salvar Condição"
                />
              </InlineForm>
            )}
            <LookupTable cols={colsCondicoes} rows={condicoes} onSelect={selectCondicao} />
          </ModalBox>
        </Overlay>
      )}
      {openTransportadoras && (
        <Overlay onClose={transportadorasGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={700}>
            <ModalHeader
              title="Consulta de Transportadoras"
              onClose={transportadorasGuard.attemptClose}
              badge={!showNovaTransportadora && <BtnNovo onClick={() => setShowNovaTransportadora(true)} label="Nova Transportadora" />}
            />
            {showNovaTransportadora && (
              <InlineForm title="Nova Transportadora">
                <Inp
                  label="Transportadora *"
                  value={novaTransportadora.transportador}
                  onChange={v => updNovaTransportadora('transportador', v)}
                  placeholder="Razão social / nome"
                  style={{ flex: '1 1 220px' }}
                />
                <Inp
                  label="CPF/CNPJ"
                  value={novaTransportadora.cpfCnpj}
                  onChange={v => updNovaTransportadora('cpfCnpj', v)}
                  style={{ flex: '1 1 180px' }}
                />
<LookupField label="Cidade" value={cidadeNovaTransportadoraLabel} onSearch={() => abrirCidadesPara('transportadora')} style={{ flex: '1 1 200px' }} />
<CheckAtivo checked={novaTransportadora.ativo} onChange={v => updNovaTransportadora('ativo', v)} />
                <SaveRow
                  onCancel={cancelTransportadoraNova}
                  onSave={saveNovaTransportadora}
                  saving={savingTransportadora}
                  label="Salvar Transportadora"
                />
              </InlineForm>
            )}
            <LookupTable cols={colsTransportadoras} rows={transportadoras} onSelect={selectTransportadora} />
          </ModalBox>
        </Overlay>
      )}
      {openProdutos && (
        <Overlay onClose={produtosGuard.attemptClose} zIndex={70}>
          <ModalBox maxWidth={640}>
            <ModalHeader
              title="Consulta de Produtos"
              onClose={produtosGuard.attemptClose}
              badge={!showNovoProduto && <BtnNovo onClick={() => setShowNovoProduto(true)} label="Novo Produto" />}
            />
            {showNovoProduto && (
              <InlineForm title="Novo Produto">
                <Inp
                  label="Produto *"
                  value={novoProdutoForm.produto}
                  onChange={v => updNovoProduto('produto', v)}
                  placeholder="Nome do produto"
                  style={{ flex: '1 1 220px' }}
                />
                <Inp
                  label="Unidade"
                  value={novoProdutoForm.unidade}
                  onChange={v => updNovoProduto('unidade', v)}
                  maxLength={6}
                  placeholder="UN"
                  style={{ flex: '0 0 90px' }}
                />
<LookupField label="Categoria" value={categoriaNovoProdLabel} onSearch={() => { setShowNovaCategoria(false); setOpenCategoriasNota(true) }} style={{ flex: '1 1 180px' }} />
<LookupField label="Marca" value={marcaNovoProdLabel} onSearch={() => { setShowNovaMarca(false); setOpenMarcasNota(true) }} style={{ flex: '1 1 180px' }} />
<NumberField label="Preço Venda (R$)" value={novoProdutoForm.precoVenda} onChange={v => updNovoProduto('precoVenda', v)} step="0.01" min="0" style={{ flex: '0 0 140px' }} />
<CheckAtivo checked={novoProdutoForm.ativo} onChange={v => updNovoProduto('ativo', v)} />
                <SaveRow
                  onCancel={cancelProdutoNovo}
                  onSave={saveNovoProduto}
                  saving={savingProduto}
                  label="Salvar Produto"
                />
              </InlineForm>
            )}
            <LookupTable cols={colsProdutos} rows={produtos} onSelect={selectProdutoItem} />
          </ModalBox>
        </Overlay>
      )}
      {openCategoriasNota && (
        <Overlay onClose={categoriasNotaGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={560}>
            <ModalHeader
              title="Consulta de Categorias"
              onClose={categoriasNotaGuard.attemptClose}
              badge={!showNovaCategoria && <BtnNovo onClick={() => setShowNovaCategoria(true)} label="Nova Categoria" />}
            />
            {showNovaCategoria && (
              <InlineForm title="Nova Categoria">
                <Inp
                  label="Categoria *"
                  value={novaCategoria.categoria}
                  onChange={v => updCategoria('categoria', v)}
                  style={{ flex: '1 1 240px' }}
                />
<CheckAtivo checked={novaCategoria.ativo} onChange={v => updCategoria('ativo', v)} />
                <SaveRow
                  onCancel={cancelCategoria}
                  onSave={saveNovaCategoria}
                  saving={savingCategoria}
                  label="Salvar Categoria"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsCategorias}
              rows={categorias}
              onSelect={r => {
                updNovoProduto('codCategoria', r.codCategoria)
                setOpenCategoriasNota(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      {openMarcasNota && (
        <Overlay onClose={marcasNotaGuard.attemptClose} zIndex={80}>
          <ModalBox maxWidth={560}>
            <ModalHeader
              title="Consulta de Marcas"
              onClose={marcasNotaGuard.attemptClose}
              badge={!showNovaMarca && <BtnNovo onClick={() => setShowNovaMarca(true)} label="Nova Marca" />}
            />
            {showNovaMarca && (
              <InlineForm title="Nova Marca">
                <Inp
                  label="Marca *"
                  value={novaMarca.marca}
                  onChange={v => updMarca('marca', v)}
                  style={{ flex: '1 1 240px' }}
                />
<CheckAtivo checked={novaMarca.ativo} onChange={v => updMarca('ativo', v)} />
                <SaveRow
                  onCancel={cancelMarca}
                  onSave={saveNovaMarca}
                  saving={savingMarca}
                  label="Salvar Marca"
                />
              </InlineForm>
            )}
            <LookupTable
              cols={colsMarcas}
              rows={marcas}
              onSelect={r => {
                updNovoProduto('codMarca', r.codMarca)
                setOpenMarcasNota(false)
              }}
            />
          </ModalBox>
        </Overlay>
      )}
      <ConfirmDialog
        open={clientesGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={clientesGuard.cancelClose}
        onConfirm={clientesGuard.confirmClose}
      />
      <ConfirmDialog
        open={cidadesEndGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={cidadesEndGuard.cancelClose}
        onConfirm={cidadesEndGuard.confirmClose}
      />
      <ConfirmDialog
        open={estadosEndGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={estadosEndGuard.cancelClose}
        onConfirm={estadosEndGuard.confirmClose}
      />
      <ConfirmDialog
        open={paisesEndGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={paisesEndGuard.cancelClose}
        onConfirm={paisesEndGuard.confirmClose}
      />
      <ConfirmDialog
        open={produtosGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={produtosGuard.cancelClose}
        onConfirm={produtosGuard.confirmClose}
      />
      <ConfirmDialog
        open={categoriasNotaGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={categoriasNotaGuard.cancelClose}
        onConfirm={categoriasNotaGuard.confirmClose}
      />
      <ConfirmDialog
        open={marcasNotaGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={marcasNotaGuard.cancelClose}
        onConfirm={marcasNotaGuard.confirmClose}
      />
      <ConfirmDialog
        open={condicoesGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={condicoesGuard.cancelClose}
        onConfirm={condicoesGuard.confirmClose}
      />
      <ConfirmDialog
        open={transportadorasGuard.confirming}
        icon="❓"
        title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim"
        confirmColor="#dc2626"
        onClose={transportadorasGuard.cancelClose}
        onConfirm={transportadorasGuard.confirmClose}
      />
      <ConfirmDialog
        open={!!confirm}
        name={confirm ? `${confirm.numero}/${confirm.serie}/${confirm.modelo}` : ''}
        onClose={() => setConfirm(null)}
        onConfirm={cancelarNota}
      />
    </div>
  )
}
