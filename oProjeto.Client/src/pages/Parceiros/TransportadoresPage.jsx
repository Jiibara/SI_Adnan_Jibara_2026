import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { transportadoresApi, cidadesApi } from '@/services/api'

const lbl = { fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono, monospace', display:'block', marginBottom:5 }
const inp = { background:'#f8f9fb', border:'1px solid #e2e6ed', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0f172a', fontFamily:'Outfit, sans-serif', outline:'none', width:'100%', boxSizing:'border-box', transition:'border-color .15s' }

const btnToggle = (active) => ({
  height:36, padding:'0 16px', borderRadius:8, border:'1px solid',
  borderColor: active ? '#2563eb' : '#e2e6ed',
  background:  active ? '#eff6ff' : '#fff',
  color:       active ? '#2563eb' : '#0f172a',
  fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'Outfit, sans-serif',
})

const Overlay = ({ children, onClose, zIndex = 60 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)', zIndex, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
    {children}
  </div>
)

export default function TransportadoresPage() {
  const { data, loading, load } = useCrud(transportadoresApi)
  const [cidades, setCidades]         = useState([])
  const [form, setForm]               = useState({ tipoPessoa:'PJ', ativo:true })
  const [editing, setEditing]         = useState(false)
  const [open, setOpen]               = useState(false)
  const [confirm, setConfirm]         = useState(null)
  const [openCidades, setOpenCidades] = useState(false)

  useEffect(() => { cidadesApi.getAll().then(setCidades) }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const setTipoPessoa = tipo =>
    setForm(p => ({ ...p, tipoPessoa:tipo, cpfCnpj:'', RgInscEst:'' }))

  const save = async () => {
    try {
      editing ? await transportadoresApi.update(form.codTransp, form) : await transportadoresApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await transportadoresApi.delete(confirm.codTransp); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key:'codTransp',     label:'Cód.',         mono:true },
    { key:'transportador', label:'Transportador' },
    { key:'cpfCnpj',       label:'CPF/CNPJ',     mono:true },
    { key:'cidade',        label:'Cidade',        render: r => r.cidade?.cidade ?? '' },
    { key:'ativo',         label:'Ativo',         render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  const colsCidades = [
    { key:'codCidade', label:'Cód.', mono:true },
    { key:'cidade',    label:'Cidade' },
    { key:'estado',    label:'Estado', render: r => `${r.estado?.uf ?? ''} - ${r.estado?.estado ?? ''}` },
  ]

  const cidadeSelecionada = cidades.find(c => c.codCidade === form.codCidade)?.cidade ?? ''
  const selectCidade = r => { setForm(f => ({ ...f, codCidade: r.codCidade })); setOpenCidades(false) }

  const isPF = form.tipoPessoa === 'PF'

  return (
    <div>
      <PageHeader title="Transportadores" sub="Consulta de Transportadores" label="Novo Transportador"
        onNew={() => { setForm({ tipoPessoa:'PJ', ativo:true }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Transportador' : 'Novo Transportador'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Tipo Pessoa + Ativo */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12 }}>
            <div>
              <label style={lbl}>Tipo Pessoa</label>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={() => setTipoPessoa('PF')} style={btnToggle(isPF)}>Pessoa Física</button>
                <button type="button" onClick={() => setTipoPessoa('PJ')} style={btnToggle(!isPF)}>Pessoa Jurídica</button>
              </div>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', paddingBottom:8, fontSize:13, fontFamily:'Outfit, sans-serif', color:'#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)}
                style={{ width:16, height:16, cursor:'pointer' }} />
              Ativo
            </label>
          </div>

          {/* Transportador */}
          <FField label="Transportador" required value={form.transportador ?? ''} onChange={v => upd('transportador', v)} />

          {/* CPF/CNPJ + RG/Insc. Estadual */}
          <div style={{ display:'flex', gap:12 }}>
            <div style={{ flex:'1 1 180px' }}>
              <FField label={isPF ? 'CPF' : 'CNPJ'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} />
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <FField label={isPF ? 'RG' : 'Insc. Estadual'} value={form.RgInscEst ?? ''} onChange={v => upd('RgInscEst', v)} />
            </div>
          </div>

          {/* Endereço */}
          <FField label="Endereço" value={form.endereco ?? ''} onChange={v => upd('endereco', v)} />

          {/* Cidade */}
          <div>
            <label style={lbl}>Cidade</label>
            <div style={{ display:'flex', gap:8 }}>
              <input type="text" readOnly value={cidadeSelecionada} style={{ ...inp, flex:1 }} />
              <button type="button" onClick={() => setOpenCidades(true)}
                style={{ padding:'0 14px', height:37, border:'1px solid #e2e6ed', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13, background:'#f8f9fb', whiteSpace:'nowrap', fontFamily:'Outfit, sans-serif', color:'#0f172a' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.color='#2563eb' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e6ed'; e.currentTarget.style.color='#0f172a' }}>
                Pesquisar
              </button>
            </div>
          </div>

        </div>
      </Modal>

      {openCidades && (
        <Overlay onClose={() => setOpenCidades(false)}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:600, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.15)', animation:'slideUp .2s ease' }}>

            <div style={{ padding:'18px 24px', borderBottom:'1px solid #e2e6ed', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Consulta de Cidades</div>
              <button onClick={() => setOpenCidades(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#94a3b8' }}>✕</button>
            </div>

            <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
              <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
                      {colsCidades.map(c => (
                        <th key={c.key} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1.2px', color:'#94a3b8' }}>{c.label}</th>
                      ))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {cidades.map((row, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f1f4f8' }}
                        onMouseEnter={e => e.currentTarget.style.background='#f8f9fb'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        {colsCidades.map(c => (
                          <td key={c.key} style={{ padding:'11px 14px', color:'#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace':'inherit' }}>
                            {c.render ? c.render(row) : String(row[c.key] ?? '')}
                          </td>
                        ))}
                        <td style={{ padding:'11px 14px', textAlign:'right' }}>
                          <button onClick={() => selectCidade(row)}
                            style={{ padding:'4px 12px', border:'none', borderRadius:6, background:'#2563eb', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}
                            onMouseEnter={e => e.currentTarget.style.opacity='.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity='1'}>
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
      )}

      <ConfirmDialog open={!!confirm} name={confirm?.transportador} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}