import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField, FTextarea } from '@/components/UI'
import { nfeApi, fornecedoresApi, transportadoresApi, veiculosApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }

const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }

const btnSearch = {
  width: 120,
  height: 37,
  border: '1px solid #e2e6ed',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 13,
  background: '#f8f9fb',
  fontFamily: 'Outfit, sans-serif',
  color: '#0f172a'
}

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

const BtnSearch = ({ onClick }) => (
  <button type="button" onClick={onClick} style={btnSearch}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
    Pesquisar
  </button>
)

const LookupModal = ({ open, onClose, title, cols, data, onSelect }) => open && (
  <Overlay onClose={onClose} zIndex={60}>
    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>

      <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>

        <button onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>
          ✕
        </button>
      </div>

      <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                {cols.map(c => (
                  <th key={c.key}
                    style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>
                    {c.label}
                  </th>
                ))}
                <th />
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr key={i}
                  style={{ borderBottom: '1px solid #f1f4f8' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {cols.map(c => (
                    <td key={c.key}
                      style={{ padding: '11px 14px', color: '#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
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

    </div>
  </Overlay>
)

export default function NfePage() {

  const [data, setData] = useState([])
  const [forns, setForns] = useState([])
  const [transps, setTransps] = useState([])
  const [veics, setVeics] = useState([])

  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)

  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [openForns, setOpenForns] = useState(false)
  const [openTransps, setOpenTransps] = useState(false)
  const [openVeics, setOpenVeics] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)

    const [n, f, t, v] = await Promise.all([
      nfeApi.getAll(),
      fornecedoresApi.getAll(),
      transportadoresApi.getAll(),
      veiculosApi.getAll()
    ])

    setData(n)
    setForns(f)
    setTransps(t)
    setVeics(v)

    setLoading(false)
  }

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const num = (k, v) =>
    setForm(p => ({ ...p, [k]: v === '' ? undefined : Number(v) }))

  const save = async () => {
    try {

      const body = {
        ...form,
        horaEnt: form.horaEnt ? form.horaEnt + ':00' : null,
        horaProtAcesso: form.horaProtAcesso ? form.horaProtAcesso + ':00' : null
      }

      editing
        ? await nfeApi.update(body.numero, body.serie, body.modelo, body)
        : await nfeApi.create(body)

      toast.success('NF salva!')
      setOpen(false)
      load()

    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {

      await nfeApi.delete(confirm.numero, confirm.serie, confirm.modelo)

      toast.success('NF excluída.')
      setConfirm(null)
      load()

    } catch {
      toast.error('Erro ao excluir.')
    }
  }

  const cols = [
    { key: 'numero', label: 'Número', mono: true },
    { key: 'serie', label: 'Série', mono: true },
    { key: 'modelo', label: 'Modelo', mono: true },
    { key: 'fornecedor', label: 'Fornecedor', render: r => r.fornecedor?.fornecedor ?? '' },
    { key: 'dataEmit', label: 'Emissão' },
    { key: 'valorIcms', label: 'Valor ICMS' },
    { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' }
  ]

  const colsForns = [
    { key: 'codForn', label: 'Código', mono: true },
    { key: 'fornecedor', label: 'Fornecedor' }
  ]

  const colsTransps = [
    { key: 'codTransp', label: 'Código', mono: true },
    { key: 'transportador', label: 'Transportador' }
  ]

  const colsVeics = [
    { key: 'codVeic', label: 'Código', mono: true },
    { key: 'placaVeic', label: 'Placa' },
    { key: 'placaMercoSul', label: 'Placa' }
  ]

  const fornecedorLabel = forns.find(f => f.codForn === form.codForn)?.fornecedor ?? ''
  const transpLabel = transps.find(t => t.codTransp === form.codTransp)?.transportador ?? ''
  const veicLabel = (() => {
    const v = veics.find(v => v.codVeic === form.codVeic)
    if (!v) return ''

    return [v.placaVeic, v.placaMercoSul]
      .filter(Boolean)
      .join(' / ')
  })()

  const selectForn = r => { setForm(f => ({ ...f, codForn: r.codForn })); setOpenForns(false) }
  const selectTransp = r => { setForm(f => ({ ...f, codTransp: r.codTransp })); setOpenTransps(false) }
  const selectVeic = r => { setForm(f => ({ ...f, codVeic: r.codVeic })); setOpenVeics(false) }

  const F = (label, key, numField = false, type = 'text') => (
    <FField label={label} type={type} step={numField ? '0.01' : undefined}
      value={form[key] ?? ''}
      onChange={v => numField && type === 'number' ? num(key, v) : upd(key, v)} />
  )

  return (
    <div>

      <PageHeader title="Notas Fiscais (NFe)" sub="Consulta de NFe" label="Nova NF"
        onNew={() => { setForm({ ativo: true }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar NFe' : 'Nova NFe'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 130px' }}>{F('Número NF', 'numero', true, 'number')}</div>
            <div style={{ flex: '0 0 100px' }}>{F('Série', 'serie', true, 'number')}</div>
            <div style={{ flex: '0 0 100px' }}>{F('Modelo', 'modelo', true, 'number')}</div>
            <div style={{ flex: '0 0 120px' }}>{F('Página', 'pagina', true, 'number')}</div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true}
                onChange={e => upd('ativo', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Ativo
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 auto' }}>{F('Natureza Operação', 'natOper')}</div>
            <div style={{ flex: '0 0 170px' }}>{F('Data Emissão', 'dataEmit', false, 'date')}</div>
            <div style={{ flex: '0 0 170px' }}>{F('Data Entrada', 'dataEnt', false, 'date')}</div>
            <div style={{ flex: '0 0 140px' }}>{F('Hora Entrada', 'horaEnt', false, 'time')}</div>
          </div>

          <div style={{ maxWidth: 820 }}>
            <label style={lbl}>Fornecedor *</label>

            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" readOnly value={fornecedorLabel} style={{ ...inp, flex: 1 }} />
              <BtnSearch onClick={() => setOpenForns(true)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '1 1 auto' }}>{F('Chave Acesso', 'chaveAcesso')}</div>
            <div style={{ flex: '0 0 220px' }}>{F('Protocolo', 'protAcesso')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '0 0 180px' }}>{F('Data Protocolo', 'dataProtAcesso', false, 'date')}</div>
            <div style={{ flex: '0 0 150px' }}>{F('Hora Protocolo', 'horaProtAcesso', false, 'time')}</div>
          </div>

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

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 auto', maxWidth: 500 }}>
              <label style={lbl}>Transportador</label>

              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={transpLabel} style={{ ...inp, flex: 1 }} />
                <BtnSearch onClick={() => setOpenTransps(true)} />
              </div>
            </div>

            <div style={{ flex: '0 0 180px' }}>{F('Frete Conta', 'fretePorConta')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 auto', maxWidth: 400 }}>
              <label style={lbl}>Veículo</label>

              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={veicLabel} style={{ ...inp, flex: 1 }} />
                <BtnSearch onClick={() => setOpenVeics(true)} />
              </div>
            </div>

            <div style={{ flex: '0 0 140px' }}>{F('Qtde Vol.', 'quantidade', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Espécie', 'especie')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Marca', 'marca')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: '1 1 auto' }}>{F('Peso Bruto', 'pesoBruto', true, 'number')}</div>
            <div style={{ flex: '1 1 auto' }}>{F('Peso Líq.', 'pesoLiq', true, 'number')}</div>
          </div>

          <FTextarea label="Informações Complementares" full
            value={form.infComp ?? ''}
            onChange={v => upd('infComp', v)} />

        </div>
      </Modal>

      <LookupModal open={openForns} onClose={() => setOpenForns(false)}
        title="Consulta de Fornecedores"
        cols={colsForns}
        data={forns}
        onSelect={selectForn} />

      <LookupModal open={openTransps} onClose={() => setOpenTransps(false)}
        title="Consulta de Transportadores"
        cols={colsTransps}
        data={transps}
        onSelect={selectTransp} />

      <LookupModal open={openVeics} onClose={() => setOpenVeics(false)}
        title="Consulta de Veículos"
        cols={colsVeics}
        data={veics}
        onSelect={selectVeic} />

      <ConfirmDialog open={!!confirm}
        name={confirm ? `NF ${confirm.numero}/${confirm.serie}/${confirm.modelo}` : ''}
        onClose={() => setConfirm(null)}
        onConfirm={del} />

    </div>
  )
}

