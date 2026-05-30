import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { contasPagarApi, nfeApi, fornecedoresApi } from '@/services/api'

const lbl = { fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono, monospace', display:'block', marginBottom:5 }

const inp = { background:'#f8f9fb', border:'1px solid #e2e6ed', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0f172a', fontFamily:'Outfit, sans-serif', outline:'none', width:'100%', boxSizing:'border-box', transition:'border-color .15s' }

const btnSearch = {
  width:120,
  height:37,
  border:'1px solid #e2e6ed',
  borderRadius:8,
  cursor:'pointer',
  fontWeight:600,
  fontSize:13,
  background:'#f8f9fb',
  fontFamily:'Outfit, sans-serif',
  color:'#0f172a'
}

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)', zIndex, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
    {children}
  </div>
)

const BtnSearch = ({ onClick }) => (
  <button type="button" onClick={onClick} style={btnSearch}
    onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.color='#2563eb' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e6ed'; e.currentTarget.style.color='#0f172a' }}>
    Pesquisar
  </button>
)

const LookupModal = ({ open, onClose, title, cols, data, onSelect }) => open && (
  <Overlay onClose={onClose} zIndex={60}>
    <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:700, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.15)' }}>

      <div style={{ padding:'18px 24px', borderBottom:'1px solid #e2e6ed', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>{title}</div>

        <button onClick={onClose}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#94a3b8' }}>
          ✕
        </button>
      </div>

      <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
        <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>

          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
                {cols.map(c => (
                  <th key={c.key}
                    style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1.2px', color:'#94a3b8' }}>
                    {c.label}
                  </th>
                ))}
                <th />
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr key={i}
                  style={{ borderBottom:'1px solid #f1f4f8' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f8f9fb'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                  {cols.map(c => (
                    <td key={c.key}
                      style={{ padding:'11px 14px', color:'#0f172a', fontFamily:c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                      {String(row[c.key] ?? '')}
                    </td>
                  ))}

                  <td style={{ padding:'11px 14px', textAlign:'right' }}>
                    <button onClick={() => onSelect(row)}
                      style={{ padding:'4px 12px', border:'none', borderRadius:6, background:'#2563eb', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
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

export default function ContasPagarPage() {

  const [data, setData] = useState([])
  const [nfes, setNfes] = useState([])
  const [forns, setForns] = useState([])

  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)

  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [openNfes, setOpenNfes] = useState(false)
  const [openForns, setOpenForns] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)

    const [c, n, f] = await Promise.all([
      contasPagarApi.getAll(),
      nfeApi.getAll(),
      fornecedoresApi.getAll()
    ])

    setData(c)
    setNfes(n)
    setForns(f)

    setLoading(false)
  }

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const num = (k, v) =>
    setForm(p => ({ ...p, [k]: v === '' ? undefined : Number(v) }))

  const save = async () => {
    try {

      editing
        ? await contasPagarApi.update(form.numero, form.serie, form.modelo, form.codForn, form.numeroParcela, form)
        : await contasPagarApi.create(form)

      toast.success('Salvo!')
      setOpen(false)
      load()

    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {

      await contasPagarApi.delete(confirm.numero, confirm.serie, confirm.modelo, confirm.codForn, confirm.numeroParcela)

      toast.success('Excluído.')
      setConfirm(null)
      load()

    } catch {
      toast.error('Erro.')
    }
  }

  const cols = [
    { key:'numero', label:'NF', mono:true },
    { key:'serie', label:'Série', mono:true },
    { key:'modelo', label:'Modelo', mono:true },
    { key:'fornecedor', label:'Fornecedor', render:r => r.fornecedor?.fornecedor ?? '' },
    { key:'numeroParcela', label:'Parcela', mono:true },
    { key:'valorParcela', label:'Valor (R$)' },
    { key:'vencimentoParcela', label:'Vencimento' },
    { key:'ativo', label:'Ativo', render:r => r.ativo ? 'Sim' : 'Não' }
  ]

  const colsNfes = [
    { key:'numero', label:'NF', mono:true },
    { key:'serie', label:'Série', mono:true },
    { key:'modelo', label:'Modelo', mono:true }
  ]

  const colsForns = [
    { key:'codForn', label:'Código', mono:true },
    { key:'fornecedor', label:'Fornecedor' }
  ]

  const nfeLabel = form.numero ? `NF ${form.numero} / S${form.serie} / M${form.modelo}` : ''

  const fornecedorLabel =
    forns.find(f => f.codForn === form.codForn)?.fornecedor ?? ''

  const selectNfe = r => {
    setForm(f => ({ ...f, numero:r.numero, serie:r.serie, modelo:r.modelo }))
    setOpenNfes(false)
  }

  const selectForn = r => {
    setForm(f => ({ ...f, codForn:r.codForn }))
    setOpenForns(false)
  }

  const F = (label, key, numField = false, type = 'text') => (
    <FField label={label} type={type} step={numField ? '0.01' : undefined}
      value={form[key] ?? ''}
      onChange={v => numField && type === 'number' ? num(key, v) : upd(key, v)} />
  )

  return (
    <div>

      <PageHeader title="Contas a Pagar" sub="Consulta de Contas a Pagar" label="Nova Parcela"
        onNew={() => { setForm({ ativo:true }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Parcela' : 'Nova Parcela'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>

            <div style={{ flex:'1 1 140px' }}>
              {F('Nº Parcela', 'numeroParcela', true, 'number')}
            </div>

            <div style={{ flex:'1 1 180px' }}>
              {F('Valor (R$)', 'valorParcela', true, 'number')}
            </div>

            <div style={{ flex:'1 1 180px' }}>
              {F('Vencimento', 'vencimentoParcela', false, 'date')}
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', paddingBottom:8, whiteSpace:'nowrap', fontSize:13, fontFamily:'Outfit, sans-serif', color:'#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true}
                onChange={e => upd('ativo', e.target.checked)}
                style={{ width:16, height:16, cursor:'pointer' }} />
              Ativo
            </label>

          </div>

          <div style={{ width:'100%', maxWidth:600 }}>
            <label style={lbl}>Nota Fiscal *</label>

            <div style={{ display:'flex', gap:8 }}>
              <input type="text" readOnly value={nfeLabel} style={{ ...inp, flex:1 }} />
              <BtnSearch onClick={() => setOpenNfes(true)} />
            </div>
          </div>

          <div style={{ width:'100%', maxWidth:700 }}>
            <label style={lbl}>Fornecedor *</label>

            <div style={{ display:'flex', gap:8 }}>
              <input type="text" readOnly value={fornecedorLabel} style={{ ...inp, flex:1 }} />
              <BtnSearch onClick={() => setOpenForns(true)} />
            </div>
          </div>

        </div>
      </Modal>

      <LookupModal open={openNfes}
        onClose={() => setOpenNfes(false)}
        title="Consulta de Notas Fiscais"
        cols={colsNfes}
        data={nfes}
        onSelect={selectNfe} />

      <LookupModal open={openForns}
        onClose={() => setOpenForns(false)}
        title="Consulta de Fornecedores"
        cols={colsForns}
        data={forns}
        onSelect={selectForn} />

      <ConfirmDialog open={!!confirm}
        name={confirm ? `NF ${confirm.numero} — Parcela ${confirm.numeroParcela}` : ''}
        onClose={() => setConfirm(null)}
        onConfirm={del} />

    </div>
  )
}