import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/UI'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }
const tdStyle = { padding: '11px 14px', color: '#0f172a' }

const fmtMoney = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDate = v => {
  if (!v) return '-'
  const value = String(v).slice(0, 10)
  const [ano, mes, dia] = value.split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : value
}

const dataHoje = () => {
  const d = new Date()
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const calcularDias = (inicio, fim) => {
  if (!inicio || !fim) return 0

  const [anoInicio, mesInicio, diaInicio] = String(inicio).slice(0, 10).split('-').map(Number)
  const [anoFim, mesFim, diaFim] = String(fim).slice(0, 10).split('-').map(Number)

  if (!anoInicio || !mesInicio || !diaInicio || !anoFim || !mesFim || !diaFim)
    return 0

  const dataInicio = new Date(anoInicio, mesInicio - 1, diaInicio)
  const dataFim = new Date(anoFim, mesFim - 1, diaFim)

  return Math.max(0, Math.floor((dataFim.getTime() - dataInicio.getTime()) / 86400000))
}

const Overlay = ({ children, onClose }) => (

  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

const ModalBox = ({ children }) => (

  <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
    {children}
  </div>
)

const ModalHeader = ({ title, onClose }) => (

  <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
    <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
  </div>
)

const Field = ({ label, value, type = 'number', disabled = false }) => (

  <div style={{ flex: '1 1 180px' }}>
    <label style={lbl}>{label}</label>
    <input
      type={type}
      value={value ?? ''}
      readOnly={disabled}
      disabled={disabled}
      style={{ ...inp, background: disabled ? '#eef2f7' : '#f8f9fb' }} />
  </div>
)

const SituacaoBadge = ({ situacao }) => {
  const valor = String(situacao ?? '').toUpperCase()
  const paga = valor === 'PAGA'
  const vencida = valor === 'VENCIDA'
  const parcial = valor === 'PARCIAL'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '5px 10px',
      borderRadius: 7,
      background: paga ? '#ecfdf5' : vencida ? '#fef2f2' : parcial ? '#eff6ff' : '#fff7ed',
      color: paga ? '#047857' : vencida ? '#b91c1c' : parcial ? '#2563eb' : '#c2410c',
      fontSize: 12,
      fontWeight: 600
    }}>
      {paga ? 'Paga' : vencida ? 'Vencida' : parcial ? 'Parcial' : 'Pendente'} </span>
  )
}

export default function ContasPagarPage() {
  const [data, setData] = useState([])
  const [formas, setFormas] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroFornecedor, setFiltroFornecedor] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('')
  const [filtroVencimentoInicial, setFiltroVencimentoInicial] = useState('')
  const [filtroVencimentoFinal, setFiltroVencimentoFinal] = useState('')
  const [contaPagamento, setContaPagamento] = useState(null)
  const [pagamento, setPagamento] = useState({
    dataPagamento: dataHoje(),
    codFormaPagamento: '',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/ContasPagar')

      if (!response.ok)
        throw new Error()

      const rows = await response.json()
      setData(rows ?? [])
    } catch {
      toast.error('Erro ao carregar as contas a pagar.')
    } finally {
      setLoading(false)
    }

  }

  const loadFormas = async () => {
    try {
      const response = await fetch('/api/FormaPagamentos')

      if (!response.ok)
        throw new Error()

      const rows = await response.json()
      setFormas(rows ?? [])
    } catch {
      toast.error('Erro ao carregar as formas de pagamento.')
    }

  }

  useEffect(() => {
    load()
    loadFormas()
  }, [])

  const abrirPagamento = conta => {
    const situacao = situacaoFiltro(conta)


    if (situacao === 'PAGA') {
      toast.error('Esta conta já foi paga.')
      return
    }

    setContaPagamento(conta)

    setPagamento({
      dataPagamento: dataHoje(),
      codFormaPagamento: conta.codFormaPagamento ?? '',
    })


  }

  const fecharPagamento = () => {
    if (saving)
      return


    setContaPagamento(null)


  }

  const updPagamento = (campo, valor) => {
    setPagamento(p => ({ ...p, [campo]: valor }))
  }

  const valoresPagamento = useMemo(() => {
    if (!contaPagamento) {
      return {
        original: 0,
        desconto: 0,
        juros: 0,
        multa: 0,
        valorFinal: 0,
        diasAtraso: 0,
        diasAntecipacao: 0,
        atrasado: false,
        percentualDesconto: 0,
        percentualJuros: 0,
        percentualMulta: 0,
      }
    }


    const original = Number(contaPagamento.valorOriginal ?? contaPagamento.valorTotal ?? 0) || 0

    const percentualDesconto = Number(contaPagamento.percentualDesconto) || 0
    const percentualJuros = Number(contaPagamento.percentualJuros) || 0
    const percentualMulta = Number(contaPagamento.percentualMulta) || 0

    const vencimento = String(contaPagamento.dataVencimento ?? '').slice(0, 10)
    const dataPagamento = String(pagamento.dataPagamento ?? '').slice(0, 10)

    const dias = calcularDias(vencimento, dataPagamento)
    const diasAtraso = dias
    const diasAntecipacao = calcularDias(dataPagamento, vencimento)

    const atrasado = diasAtraso > 0

    let desconto = 0
    let juros = 0
    let multa = 0

    if (atrasado) {
      multa = original * (percentualMulta / 100)

      juros = original * (percentualJuros / 100) * (diasAtraso / 30)
    } else {
      desconto = original * (percentualDesconto / 100)
    }

    desconto = Math.round((desconto + Number.EPSILON) * 100) / 100
    juros = Math.round((juros + Number.EPSILON) * 100) / 100
    multa = Math.round((multa + Number.EPSILON) * 100) / 100

    const valorFinal = Math.round(
      (original - desconto + juros + multa + Number.EPSILON) * 100
    ) / 100

    return {
      original,
      desconto,
      juros,
      multa,
      valorFinal,
      diasAtraso,
      diasAntecipacao,
      atrasado,
      percentualDesconto,
      percentualJuros,
      percentualMulta,
    }


  }, [contaPagamento, pagamento.dataPagamento])

  const confirmarPagamento = async () => {
    if (!contaPagamento)
      return


    const valorFinal = Number(valoresPagamento.valorFinal)

    if (!pagamento.dataPagamento) {
      toast.error('Informe a data do pagamento.')
      return
    }

    if (valorFinal <= 0) {
      toast.error('O valor final do pagamento deve ser maior que zero.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/ContasPagar/pagar/${contaPagamento.notaNumero}/${contaPagamento.notaModelo}/${contaPagamento.notaSerie}/${contaPagamento.codForn}/${contaPagamento.numeroParcela}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorPago: valorFinal,
          valorDesconto: valoresPagamento.desconto,
          valorJuros: valoresPagamento.juros,
          valorMulta: valoresPagamento.multa,
          dataPagamento: pagamento.dataPagamento,
          codFormaPagamento: pagamento.codFormaPagamento
            ? Number(pagamento.codFormaPagamento)
            : null,
        }),
      })

      if (!response.ok) {
        const mensagem = await response.text()
        throw new Error(mensagem || 'Erro ao registrar o pagamento.')
      }

      toast.success('Pagamento registrado!')
      setContaPagamento(null)
      await load()
    } catch (error) {
      toast.error(error?.message || 'Erro ao registrar o pagamento.')
    } finally {
      setSaving(false)
    }


  }

  const fornecedoresFiltro = useMemo(() => {
    const mapa = new Map()


    data.forEach(r => {
      if (r.codForn && !mapa.has(r.codForn))
        mapa.set(r.codForn, r.fornecedor?.fornecedor ?? `Fornecedor #${r.codForn}`)
    })

    return [...mapa.entries()].sort((a, b) =>
      String(a[1]).localeCompare(String(b[1]), 'pt-BR')
    )


  }, [data])

  const situacaoFiltro = r => {
    const situacao = String(r.situacao ?? '').toUpperCase()
    const valorOriginal = Number(r.valorOriginal) || 0
    const valorPago = Number(r.valorPago) || 0


    if (situacao === 'PAGA' || valorOriginal > 0 && valorPago >= valorOriginal)
      return 'PAGA'

    if (situacao === 'PARCIAL' || valorPago > 0 && valorPago < valorOriginal)
      return 'PARCIAL'

    if (situacao === 'CANCELADA')
      return 'CANCELADA'

    if (situacao === 'VENCIDA')
      return 'VENCIDA'

    if (r.dataVencimento) {
      const vencimento = String(r.dataVencimento).slice(0, 10)

      if (vencimento < dataHoje() && situacao !== 'PAGA')
        return 'VENCIDA'
    }

    return 'PENDENTE'


  }

  const limparFiltros = () => {
    setSearch('')
    setFiltroFornecedor('')
    setFiltroSituacao('')
    setFiltroVencimentoInicial('')
    setFiltroVencimentoFinal('')
  }

  const dataFiltrada = useMemo(() => {
    const termo = search.trim().toLowerCase()


    return data.filter(r => {
      const texto = [
        r.notaNumero,
        r.notaModelo,
        r.notaSerie,
        r.codForn,
        r.fornecedor?.fornecedor,
        r.numeroParcela,
        r.totalParcelas,
        r.situacao,
      ].join(' ').toLowerCase()

      if (termo && !texto.includes(termo))
        return false

      if (filtroFornecedor && String(r.codForn) !== String(filtroFornecedor))
        return false

      if (filtroSituacao && situacaoFiltro(r) !== filtroSituacao)
        return false

      const vencimento = String(r.dataVencimento ?? '').slice(0, 10)

      if (filtroVencimentoInicial && vencimento < filtroVencimentoInicial)
        return false

      if (filtroVencimentoFinal && vencimento > filtroVencimentoFinal)
        return false

      return true
    })


  }, [
    data,
    search,
    filtroFornecedor,
    filtroSituacao,
    filtroVencimentoInicial,
    filtroVencimentoFinal
  ])

  const filtrosAtivos = Boolean(
    search ||
    filtroFornecedor ||
    filtroSituacao ||
    filtroVencimentoInicial ||
    filtroVencimentoFinal
  )

  return (<div> <PageHeader title="Contas a Pagar" sub="Controle de contas e pagamentos" />


    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e6ed' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px', minWidth: 220 }}>
            <label style={lbl}>Pesquisar</label>
            <input
              placeholder="Nota, fornecedor, parcela..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={inp} />
          </div>

          <div style={{ flex: '1 1 220px', minWidth: 200 }}>
            <label style={lbl}>Fornecedor</label>
            <select value={filtroFornecedor} onChange={e => setFiltroFornecedor(e.target.value)} style={inp}>
              <option value="">Todos os fornecedores</option>
              {fornecedoresFiltro.map(([codForn, fornecedor]) => (
                <option key={codForn} value={codForn}>{fornecedor}</option>
              ))}
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
            <input
              type="date"
              value={filtroVencimentoInicial}
              onChange={e => setFiltroVencimentoInicial(e.target.value)}
              style={inp} />
          </div>

          <div style={{ flex: '0 1 150px', minWidth: 140 }}>
            <label style={lbl}>Vencimento final</label>
            <input
              type="date"
              value={filtroVencimentoFinal}
              onChange={e => setFiltroVencimentoFinal(e.target.value)}
              style={inp} />
          </div>

          {filtrosAtivos && (
            <button
              onClick={limparFiltros}
              style={{ padding: '9px 13px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              Limpar filtros
            </button>
          )}
        </div>

        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#64748b', fontSize: 11 }}>
            Filtre por fornecedor, situação ou período de vencimento.
          </span>
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
              <tr>
                <td colSpan="10" style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                  Carregando...
                </td>
              </tr>
            ) : dataFiltrada.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                  Nenhuma conta a pagar encontrada.
                </td>
              </tr>
            ) : dataFiltrada.map(r => {
              const situacao = situacaoFiltro(r)
              const paga = situacao === 'PAGA'
              const cancelada = situacao === 'CANCELADA'

              return (
                <tr key={`${r.notaNumero}-${r.notaSerie}-${r.notaModelo}-${r.codForn}-${r.numeroParcela}`} style={{ borderBottom: '1px solid #f1f4f8' }}>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                    {r.notaModelo}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                    {r.notaSerie}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                    {r.notaNumero}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                    {r.codForn}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'left' }}>
                    {r.fornecedor?.fornecedor ?? `Fornecedor #${r.codForn}`}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {r.numeroParcela}/{r.totalParcelas}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                    {fmtMoney(r.valorTotal)}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                    {fmtDate(r.dataVencimento)}
                  </td>

                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <SituacaoBadge situacao={situacao} />
                  </td>

                  <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                    {!paga && !cancelada ? (
                      <button
                        onClick={() => abrirPagamento(r)}
                        style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Pagar
                      </button>
                    ) : paga ? (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        Pago em {fmtDate(r.dataPagamento)}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        Cancelada
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>

    {contaPagamento && (
      <Overlay onClose={fecharPagamento}>
        <ModalBox>
          <ModalHeader title="Registrar Pagamento" onClose={fecharPagamento} />

          <div style={{ padding: '18px 24px', overflowY: 'auto' }}>
            <div style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 9, padding: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={lbl}>Fornecedor</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {contaPagamento.fornecedor?.fornecedor ?? `Fornecedor #${contaPagamento.codForn}`}
                  </div>
                </div>

                <div>
                  <div style={lbl}>Modelo</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {contaPagamento.notaModelo}
                  </div>
                </div>

                <div>
                  <div style={lbl}>Série</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {contaPagamento.notaSerie}
                  </div>
                </div>

                <div>
                  <div style={lbl}>Número</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {contaPagamento.notaNumero}
                  </div>
                </div>

                <div>
                  <div style={lbl}>Parcela</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {contaPagamento.numeroParcela}/{contaPagamento.totalParcelas}
                  </div>
                </div>

                <div>
                  <div style={lbl}>Vencimento</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {fmtDate(contaPagamento.dataVencimento)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Field
                label="Valor Original"
                value={Number(valoresPagamento.original).toFixed(2)}
                disabled />

              <Field
                label="Data Pagamento"
                type="date"
                value={pagamento.dataPagamento}
                disabled />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Forma de Pagamento</label>

              <select
                value={pagamento.codFormaPagamento}
                onChange={e => updPagamento('codFormaPagamento', e.target.value)}
                style={inp}>
                <option value="">Selecione...</option>

                {formas.map(f => (
                  <option
                    key={f.codFormaPagamento}
                    value={f.codFormaPagamento}>
                    {f.formaPagamento}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ padding: '12px 13px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#f8f9fb' }}>
                <div style={lbl}>Desconto</div>

                <div style={{ fontSize: 15, fontWeight: 700, color: '#047857', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmtMoney(valoresPagamento.desconto)}
                </div>

                <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>
                  {valoresPagamento.percentualDesconto.toFixed(2)}%
                </div>
              </div>

              <div style={{ padding: '12px 13px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#f8f9fb' }}>
                <div style={lbl}>Juros</div>

                <div style={{ fontSize: 15, fontWeight: 700, color: '#c2410c', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmtMoney(valoresPagamento.juros)}
                </div>

                <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>
                  {valoresPagamento.percentualJuros.toFixed(2)}% ao mês
                </div>
              </div>

              <div style={{ padding: '12px 13px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#f8f9fb' }}>
                <div style={lbl}>Multa</div>

                <div style={{ fontSize: 15, fontWeight: 700, color: '#b91c1c', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmtMoney(valoresPagamento.multa)}
                </div>

                <div style={{ marginTop: 4, fontSize: 10, color: '#94a3b8' }}>
                  {valoresPagamento.percentualMulta.toFixed(2)}%
                </div>
              </div>
            </div>

            {valoresPagamento.atrasado ? (
              <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid #fed7aa', borderRadius: 8, background: '#fff7ed' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#c2410c' }}>
                  Pagamento em atraso
                </div>

                <div style={{ marginTop: 5, fontSize: 11, color: '#9a3412' }}>
                  Pagamento realizado {valoresPagamento.diasAtraso} dia(s) após o vencimento.
                  A multa foi aplicada uma vez e os juros foram calculados proporcionalmente aos dias de atraso.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid #bbf7d0', borderRadius: 8, background: '#f0fdf4' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>
                  Pagamento dentro do prazo
                </div>

                <div style={{ marginTop: 5, fontSize: 11, color: '#166534' }}>
                  {valoresPagamento.diasAntecipacao > 0
                    ? `Pagamento ${valoresPagamento.diasAntecipacao} dia(s) antes do vencimento. O desconto da condição foi aplicado automaticamente.`
                    : 'Pagamento no dia do vencimento. O desconto da condição foi aplicado automaticamente.'}
                </div>
              </div>
            )}

            <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 9, background: '#eff6ff', border: '1px solid #dbeafe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                  Valor a Pagar
                </span>

                <strong style={{ fontSize: 18, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                  {fmtMoney(valoresPagamento.valorFinal)}
                </strong>
              </div>

              <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
                {valoresPagamento.atrasado
                  ? 'Original + juros + multa.'
                  : 'Original − desconto.'}
              </div>
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid #e2e6ed', borderRadius: 8, background: '#f8f9fb' }}>
              <div style={lbl}>Valor Pago</div>

              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                {fmtMoney(valoresPagamento.valorFinal)}
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: '#64748b' }}>
              Regras da condição:
              desconto {valoresPagamento.percentualDesconto.toFixed(2)}% ·
              juros {valoresPagamento.percentualJuros.toFixed(2)}% ao mês ·
              multa {valoresPagamento.percentualMulta.toFixed(2)}%.
            </div>
          </div>

          <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e6ed', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={fecharPagamento}
              disabled={saving}
              style={{ padding: '8px 14px', border: '1px solid #e2e6ed', borderRadius: 7, background: '#fff', color: '#475569', cursor: saving ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}>
              Cancelar
            </button>

            <button
              onClick={confirmarPagamento}
              disabled={saving}
              style={{ padding: '8px 14px', border: 'none', borderRadius: 7, background: '#2563eb', color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}>
              {saving ? 'Registrando...' : 'Confirmar pagamento'}
            </button>
          </div>
        </ModalBox>
      </Overlay>
    )}
  </div>

  )
}
