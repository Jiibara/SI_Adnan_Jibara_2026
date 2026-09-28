  import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField, FTextarea } from '@/components/UI'
import { nfeApi, fornecedoresApi, transportadoresApi, veiculosApi, produtosApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box' }

const BtnSearch = ({ onClick }) => (
  <button type="button" onClick={onClick} 
    style={{ width: 110, height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', color: '#0f172a' }}>
    Pesquisar
  </button>
)

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

const LookupModal = ({ open, onClose, title, cols, data, onSelect }) => open && (
  <Overlay onClose={onClose} zIndex={60}>
    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
      </div>
      <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
              {cols.map(c => (
                <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                {cols.map(c => (
                  <td key={c.key} style={{ padding: '11px 14px', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                    {String(row[c.key] ?? '')}
                  </td>
                ))}
                <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                  <button onClick={() => onSelect(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Selecionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Overlay>
)

export default function NfePage() {
  const [data, setData] = useState([])
  const [forns, setForns] = useState([])
  const [transps, setTransps] = useState([])
  const [veics, setVeics] = useState([])
  const [prods, setProds] = useState([])

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ itens: [] })
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [openForns, setOpenForns] = useState(false)
  const [openTransps, setOpenTransps] = useState(false)
  const [openVeics, setOpenVeics] = useState(false)
  const [openProds, setOpenProds] = useState(false)

  const [itemAtual, setItemAtual] = useState({ codProd: '', quantidade: 1, valorUnitario: 0, CFOP: '1102' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [n, f, t, v, p] = await Promise.all([
        nfeApi.getAll(),
        fornecedoresApi.getAll(),
        transportadoresApi.getAll(),
        veiculosApi.getAll(),
        produtosApi.getAll()
      ])
      setData(n)
      setForns(f)
      setTransps(t)
      setVeics(v)
      setProds(p)
    } catch {
      toast.error('Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const num = (k, v) => setForm(p => ({ ...p, [k]: v === '' ? undefined : Number(v) }))

  const addItem = () => {
    if (!itemAtual.codProd || Number(itemAtual.quantidade) <= 0) {
      toast.error('Informe um produto e quantidade válida.')
      return
    }
    const prodRef = prods.find(p => p.codProd === itemAtual.codProd)
    const novo = {
      ...itemAtual,
      produto: prodRef?.produto ?? '',
      valorTotal: Number(itemAtual.quantidade) * Number(itemAtual.valorUnitario)
    }

    setForm(p => ({
      ...p,
      itens: [...(p.itens || []).filter(i => i.codProd !== novo.codProd), novo]
    }))
    setItemAtual({ codProd: '', quantidade: 1, valorUnitario: 0, CFOP: '1102' })
  }

  const removeItem = (codProd) => {
    setForm(p => ({ ...p, itens: p.itens.filter(i => i.codProd !== codProd) }))
  }

  const save = async () => {
    if (!form.numero || !form.serie || !form.modelo || !form.codForn) {
      toast.error('Preencha Número, Série, Modelo e Fornecedor.')
      return
    }

    try {
      const payload = {
        ...form,
        horaEnt: form.horaEnt ? form.horaEnt + ':00' : null,
        horaProtAcesso: form.horaProtAcesso ? form.horaProtAcesso + ':00' : null
      }

      editing
        ? await nfeApi.update(payload.numero, payload.serie, payload.modelo, payload)
        : await nfeApi.create(payload)

      toast.success('NF salva com sucesso!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar NF.')
    }
  }

  const del = async () => {
    try {
      await nfeApi.delete(confirm.numero, confirm.serie, confirm.modelo)
      toast.success('NF excluída.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro ao excluir NF.')
    }
  }

  const cols = [
    { key: 'numero', label: 'Número', mono: true },
    { key: 'serie', label: 'Série', mono: true },
    { key: 'modelo', label: 'Modelo', mono: true },
    { key: 'fornecedor', label: 'Fornecedor', render: r => forns.find(f => f.codForn === r.codForn)?.fornecedor ?? r.codForn },
    { key: 'dataEmit', label: 'Emissão' },
    { key: 'valorIcms', label: 'Valor ICMS' },
    { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' }
  ]

  const fornecedorLabel = forns.find(f => f.codForn === form.codForn)?.fornecedor ?? ''
  const transpLabel = transps.find(t => t.codTransp === form.codTransp)?.transportador ?? ''
  const veicLabel = (() => {
    const v = veics.find(v => v.codVeic === form.codVeic)
    return v ? [v.placaVeic, v.placaMercoSul].filter(Boolean).join(' / ') : ''
  })()

  const F = (label, key, numField = false, type = 'text') => (
    <FField label={label} type={type} step={numField ? '0.01' : undefined}
      value={form[key] ?? ''}
      onChange={v => numField && type === 'number' ? num(key, v) : upd(key, v)} />
  )

  return (
    <div>
      <PageHeader title="Notas Fiscais (NFe)" sub="Consulta de NFe" label="Nova NF"
        onNew={() => { setForm({ ativo: true, serie: 1, modelo: 55, itens: [] }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar NFe' : 'Nova NFe'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Dados Gerais */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 130px' }}>{F('Número NF', 'numero', true, 'number')}</div>
            <div style={{ flex: '0 0 100px' }}>{F('Série', 'serie', true, 'number')}</div>
            <div style={{ flex: '0 0 100px' }}>{F('Modelo', 'modelo', true, 'number')}</div>
            <div style={{ flex: '0 0 120px' }}>{F('Página', 'pagina', true, 'number')}</div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, color: '#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width: 16, height: 16 }} />
              Ativo
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 auto' }}>{F('Natureza Operação', 'natOper')}</div>
            <div style={{ flex: '0 0 170px' }}>{F('Data Emissão', 'dataEmit', false, 'date')}</div>
            <div style={{ flex: '0 0 170px' }}>{F('Data Entrada', 'dataEnt', false, 'date')}</div>
            <div style={{ flex: '0 0 140px' }}>{F('Hora Entrada', 'horaEnt', false, 'time')}</div>
          </div>

          <div>
            <label style={lbl}>Fornecedor *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" readOnly value={fornecedorLabel} style={{ ...inp, flex: 1 }} />
              <BtnSearch onClick={() => setOpenForns(true)} />
            </div>
          </div>

          {/* Área de Itens da NF (prodnfes) */}
          <div style={{ background: '#f8f9fb', border: '1px solid #e2e6ed', padding: 12, borderRadius: 8 }}>
            <span style={lbl}>Adicionar Produtos (prodnfes)</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'flex-end' }}>
              <input type="text" readOnly placeholder="Selecione o Produto..." 
                value={prods.find(p => p.codProd === itemAtual.codProd)?.produto ?? ''} 
                style={{ ...inp, flex: 2 }} />
              <BtnSearch onClick={() => setOpenProds(true)} />
              
              <input type="number" placeholder="Qtd" value={itemAtual.quantidade} 
                onChange={e => setItemAtual(p => ({ ...p, quantidade: Number(e.target.value) }))} 
                style={{ ...inp, flex: 1 }} />

              <input type="number" step="0.01" placeholder="Valor Unit." value={itemAtual.valorUnitario} 
                onChange={e => setItemAtual(p => ({ ...p, valorUnitario: Number(e.target.value) }))} 
                style={{ ...inp, flex: 1 }} />

              <button type="button" onClick={addItem} 
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 37, fontWeight: 600, cursor: 'pointer' }}>
                ＋ Inserir
              </button>
            </div>

            {/* Listagem de itens inseridos */}
            <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#e2e6ed', textAlign: 'left' }}>
                  <th style={{ padding: 6 }}>Cód</th>
                  <th style={{ padding: 6 }}>Produto</th>
                  <th style={{ padding: 6 }}>Qtd</th>
                  <th style={{ padding: 6 }}>Unitário</th>
                  <th style={{ padding: 6 }}>Total</th>
                  <th style={{ padding: 6 }} />
                </tr>
              </thead>
              <tbody>
                {(form.itens || []).map(i => (
                  <tr key={i.codProd} style={{ borderBottom: '1px solid #e2e6ed' }}>
                    <td style={{ padding: 6, fontFamily: 'JetBrains Mono' }}>{i.codProd}</td>
                    <td style={{ padding: 6 }}>{i.produto}</td>
                    <td style={{ padding: 6 }}>{i.quantidade}</td>
                    <td style={{ padding: 6 }}>R$ {Number(i.valorUnitario).toFixed(2)}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>R$ {Number(i.valorTotal).toFixed(2)}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>
                      <button type="button" onClick={() => removeItem(i.codProd)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais Impostos */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '1 1 auto' }}>{F('Base ICMS', 'baseCalcIcms', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Valor ICMS', 'valorIcms', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Base ICMS Sub.', 'baseCalcIcmsSub', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Valor ICMS Sub.', 'valorIcmsSub', true, 'number')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '1 1 auto' }}>{F('Valor Frete', 'valorFrete', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Seguro', 'valorSeguro', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Desconto', 'desconto', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Outras Despesas', 'outrasDesp', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Valor IPI', 'valorIpi', true, 'number')}</div>
          </div>

          <FTextarea label="Informações Complementares" full value={form.infComp ?? ''} onChange={v => upd('infComp', v)} />
        </div>
      </Modal>

      {/* Modais de Busca */}
      <LookupModal open={openForns} onClose={() => setOpenForns(false)} title="Consulta de Fornecedores"
        cols={[{ key: 'codForn', label: 'Código', mono: true }, { key: 'fornecedor', label: 'Fornecedor' }]}
        data={forns} onSelect={r => { setForm(f => ({ ...f, codForn: r.codForn })); setOpenForns(false) }} />

      <LookupModal open={openTransps} onClose={() => setOpenTransps(false)} title="Consulta de Transportadores"
        cols={[{ key: 'codTransp', label: 'Código', mono: true }, { key: 'transportador', label: 'Transportador' }]}
        data={transps} onSelect={r => { setForm(f => ({ ...f, codTransp: r.codTransp })); setOpenTransps(false) }} />

      <LookupModal open={openVeics} onClose={() => setOpenVeics(false)} title="Consulta de Veículos"
        cols={[{ key: 'codVeic', label: 'Código', mono: true }, { key: 'placaVeic', label: 'Placa' }]}
        data={veics} onSelect={r => { setForm(f => ({ ...f, codVeic: r.codVeic })); setOpenVeics(false) }} />

      <LookupModal open={openProds} onClose={() => setOpenProds(false)} title="Consulta de Produtos"
        cols={[{ key: 'codProd', label: 'Código', mono: true }, { key: 'produto', label: 'Produto' }]}
        data={prods} onSelect={r => { setItemAtual(p => ({ ...p, codProd: r.codProd, valorUnitario: r.precoCompra || 0 })); setOpenProds(false) }} />

      <ConfirmDialog open={!!confirm} name={confirm ? `NF ${confirm.numero}/${confirm.serie}/${confirm.modelo}` : ''}
        onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}