import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { fornecedoresApi, cidadesApi, condicoesApi } from '@/services/api'
import useCrud from '@/hooks/useCrud'

const lbl = { fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'JetBrains Mono, monospace', display:'block', marginBottom:5 }
const inp = { background:'#f8f9fb', border:'1px solid #e2e6ed', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0f172a', fontFamily:'Outfit, sans-serif', outline:'none', width:'100%', boxSizing:'border-box' }
const btnSearch = { width:120, height:37, border:'1px solid #e2e6ed', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13, background:'#f8f9fb', fontFamily:'Outfit, sans-serif', color:'#0f172a' }

const Overlay = ({ children, onClose }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
    {children}
  </div>
)

export default function FornecedoresPage() {

  const { data, loading, load } = useCrud(fornecedoresApi)
  const [cidades, setCidades] = useState([])
  const [condicoes, setCondicoes] = useState([])
  const [form, setForm] = useState({ tipoPessoa:'PJ', ativo:true })
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  
  const [openCidades, setOpenCidades] = useState(false)
  const [openCondicoes, setOpenCondicoes] = useState(false)

  useEffect(() => { 
    cidadesApi.getAll().then(setCidades)
    condicoesApi.getAll().then(setCondicoes) 
  }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

const setTipoPessoa = tipo => setForm(p => ({ ...p, tipoPessoa: tipo }))

  const save = async () => {
    try {
      editing ? await fornecedoresApi.update(form.codForn, form) : await fornecedoresApi.create(form)
      toast.success('Salvo!')
      setOpen(false)
      load()
    } catch {
      toast.error('Erro ao salvar.')
    }
  }

  const del = async () => {
    try {
      await fornecedoresApi.delete(confirm.codForn)
      toast.success('Excluído.')
      setConfirm(null)
      load()
    } catch {
      toast.error('Erro.')
    }
  }

  const cols = [
    { key:'codForn', label:'Cód.', mono:true },
    { key:'fornecedor', label:'Fornecedor' },
    { key:'tipoPessoa', label:'Tipo' },
    { key:'cpfCnpj', label:'CPF/CNPJ', mono:true },
    { key:'fone', label:'Telefone' },
    { key:'ativo', label:'Ativo', render:r => r.ativo ? 'Sim' : 'Não' }
  ]

  const cidadeLabel = cidades.find(c => c.codCidade === form.codCidade)?.cidade ?? ''
  const selectCidade = r => { upd('codCidade', r.codCidade); setOpenCidades(false) }

  const condicaoLabel = condicoes.find(c => c.codCondicao === form.codCondicao)?.condicaoPagamento ?? ''
  const selectCondicao = r => { upd('codCondicao', r.codCondicao); setOpenCondicoes(false) }

  const btnTipo = (tipo, label) => (
    <button type="button" onClick={() => setTipoPessoa(tipo)} style={{ height:36, padding:'0 16px', borderRadius:8, border:'1px solid', cursor:'pointer', fontWeight:600,
      borderColor: form.tipoPessoa === tipo ? '#2563eb' : '#e2e6ed',
      background:  form.tipoPessoa === tipo ? '#eff6ff'  : '#fff',
      color:       form.tipoPessoa === tipo ? '#2563eb'  : '#0f172a' }}>
      {label}
    </button>
  )

  return (
    <div>

      <PageHeader
        title="Fornecedores"
        sub="Consulta de fornecedores"
        label="Novo Fornecedor"
        onNew={() => { setForm({ tipoPessoa:'PJ', ativo:true }); setEditing(false); setOpen(true) }}
      />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)}
      />

      <Modal wide open={open} title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'} editing={editing} onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
            <div>
              <label style={lbl}>Tipo Pessoa</label>
              <div style={{ display:'flex', gap:8 }}>
                {btnTipo('PF', 'Pessoa Física')}
                {btnTipo('PJ', 'Pessoa Jurídica')}
              </div>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', paddingBottom:8, fontSize:13 }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width:16, height:16 }} />
              Ativo
            </label>
          </div>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 320px' }}><FField label={form.tipoPessoa === 'PJ' ? 'Fornecedor' : 'Fornecedor'} required value={form.fornecedor ?? ''} onChange={v => upd('fornecedor', v)} /></div>
            <div style={{ flex:'1 1 320px' }}>
              <FField label={form.tipoPessoa === 'PJ' ? 'Nome Fantasia' : 'Apelido'} value={form.nomeFantasia ?? ''} onChange={v => upd('nomeFantasia', v)} />
            </div>
          </div>
            
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 320px' }}><FField label="Endereço" value={form.endereco ?? ''} onChange={v => upd('endereco', v)} /></div>
            <div style={{ flex:'0 0 100px' }}><FField label="Número" type="number" value={form.numero ?? ''} onChange={v => upd('numero', Number(v))} /></div>
            <div style={{ flex:'1 1 200px' }}><FField label="Complemento" value={form.complemento ?? ''} onChange={v => upd('complemento', v)} /></div>
          </div>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 220px' }}><FField label="Bairro" value={form.bairro ?? ''} onChange={v => upd('bairro', v)} /></div>
            <div style={{ flex:'0 0 140px' }}><FField label="CEP" value={form.cep ?? ''} onChange={v => upd('cep', v)} /></div>
            
            <div style={{ flex:'1 1 220px' }}>
              <label style={lbl}>Cidade</label>
              <div style={{ display:'flex', gap:8 }}>
                <input type="text" readOnly value={cidadeLabel} style={{ ...inp, flex:1 }} />
                <button type="button" onClick={() => setOpenCidades(true)} style={btnSearch}>Pesquisar</button>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 180px' }}><FField label="Telefone" value={form.fone ?? ''} onChange={v => upd('fone', v)} /></div>
            <div style={{ flex:'1 1 250px' }}><FField label="Email" value={form.email ?? ''} onChange={v => upd('email', v)} /></div>
            <div style={{ flex:'1 1 250px' }}><FField label="Site" value={form.site ?? ''} onChange={v => upd('site', v)} /></div>
          </div>

          {/* docs (Insc. Est. Sub. Trib. removida daqui) */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 320px' }}><FField label={form.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} /></div>
            <div style={{ flex:'1 1 320px' }}><FField label={form.tipoPessoa === 'PF' ? 'RG' : 'Inscrição Estadual'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} /></div>
          </div>

          {/* Condição de Pagamento */}
          <div style={{ width:'100%', maxWidth:700 }}>
            <label style={lbl}>Condição de Pagamento</label>
            <div style={{ display:'flex', gap:8 }}>
              <input type="text" readOnly value={condicaoLabel} style={{ ...inp, flex:1 }} />
              <button type="button" onClick={() => setOpenCondicoes(true)} style={btnSearch}>Pesquisar</button>
            </div>
          </div>

        </div>
      </Modal>

      {/*CIDADES */}
      {openCidades && (
        <Overlay onClose={() => setOpenCidades(false)}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:700, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid #e2e6ed', fontWeight:700 }}>Consulta de Cidades</div>
            <div style={{ padding:24, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8f9fb' }}>
                    <th style={{ padding:10, textAlign:'left' }}>Código</th>
                    <th style={{ padding:10, textAlign:'left' }}>Cidade</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cidades.map(c => (
                    <tr key={c.codCidade} style={{ borderTop:'1px solid #f1f4f8' }}>
                      <td style={{ padding:10 }}>{c.codCidade}</td>
                      <td style={{ padding:10 }}>{c.cidade}</td>
                      <td style={{ padding:10, textAlign:'right' }}>
                        <button onClick={() => selectCidade(c)} style={{ padding:'4px 12px', border:'none', borderRadius:6, background:'#2563eb', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
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
      )}

      {/* Condicao Pagamento */}
      {openCondicoes && (
        <Overlay onClose={() => setOpenCondicoes(false)}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:700, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid #e2e6ed', fontWeight:700 }}>Consulta de Condições de Pagamento</div>
            <div style={{ padding:24, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8f9fb' }}>
                    <th style={{ padding:10, textAlign:'left' }}>Código</th>
                    <th style={{ padding:10, textAlign:'left' }}>Condição</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {condicoes.map(c => (
                    <tr key={c.codCondicao} style={{ borderTop:'1px solid #f1f4f8' }}>
                      <td style={{ padding:10 }}>{c.codCondicao}</td>
                      <td style={{ padding:10 }}>{c.condicaoPagamento}</td>
                      <td style={{ padding:10, textAlign:'right' }}>
                        <button onClick={() => selectCondicao(c)} style={{ padding:'4px 12px', border:'none', borderRadius:6, background:'#2563eb', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:600 }}>
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
      )}

      <ConfirmDialog open={!!confirm} name={confirm?.fornecedor} onClose={() => setConfirm(null)} onConfirm={del} />

    </div>
  )
}