import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { fornecedoresApi, cidadesApi } from '@/services/api'
import useCrud from '@/hooks/useCrud'

const lbl = {
  fontSize:11,
  color:'#94a3b8',
  textTransform:'uppercase',
  letterSpacing:'1.2px',
  fontFamily:'JetBrains Mono, monospace',
  display:'block',
  marginBottom:5
}

const inp = {
  background:'#f8f9fb',
  border:'1px solid #e2e6ed',
  borderRadius:8,
  padding:'9px 12px',
  fontSize:13,
  color:'#0f172a',
  fontFamily:'Outfit, sans-serif',
  outline:'none',
  width:'100%',
  boxSizing:'border-box'
}

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

const Overlay = ({ children, onClose }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{
      position:'fixed',
      inset:0,
      background:'rgba(15,23,42,.45)',
      backdropFilter:'blur(4px)',
      zIndex:60,
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:16
    }}>
    {children}
  </div>
)

export default function FornecedoresPage() {

  const { data, loading, load } = useCrud(fornecedoresApi)

  const [cidades, setCidades] = useState([])

  const [form, setForm] = useState({
    tipoPessoa:'PJ',
    ativo:true
  })

  const [editing, setEditing] = useState(false)

  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [openCidades, setOpenCidades] = useState(false)

  useEffect(() => {
    cidadesApi.getAll().then(setCidades)
  }, [])

  const upd = (k, v) =>
    setForm(p => ({ ...p, [k]: v }))

  const setTipoPessoa = tipo =>
    setForm(p => ({
      ...p,
      tipoPessoa:tipo,
      cpfCnpj:'',
      rgIe:'',
      fantasia:''
    }))

  const save = async () => {
    try {

      editing
        ? await fornecedoresApi.update(form.codForn, form)
        : await fornecedoresApi.create(form)

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
    { key:'cpfCnpj', label:'CPF/CNPJ', mono:true },
    { key:'fone', label:'Telefone' },
    { key:'ativo', label:'Ativo', render:r => r.ativo ? 'Sim' : 'Não' }
  ]

  const cidadeLabel =
    cidades.find(c => c.codCidade === form.codCidade)?.cidade ?? ''

  const selectCidade = r => {
    setForm(f => ({ ...f, codCidade:r.codCidade }))
    setOpenCidades(false)
  }

  return (
    <div>

      <PageHeader
        title="Fornecedores"
        sub="Consulta de fornecedores"
        label="Novo Fornecedor"
        onNew={() => {
          setForm({
            tipoPessoa:'PJ',
            ativo:true
          })

          setEditing(false)
          setOpen(true)
        }}
      />

      <DataTable
        columns={cols}
        data={data}
        loading={loading}
        onEdit={r => {
          setForm(r)
          setEditing(true)
          setOpen(true)
        }}
        onDelete={r => setConfirm(r)}
      />

      <Modal
        wide
        open={open}
        title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={save}
      >

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* topo */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>

            <div>

              <label style={lbl}>Tipo Pessoa</label>

              <div style={{ display:'flex', gap:8 }}>

                <button type="button"
                  onClick={() => setTipoPessoa('PF')}
                  style={{
                    height:36,
                    padding:'0 16px',
                    borderRadius:8,
                    border:'1px solid',
                    borderColor: form.tipoPessoa === 'PF' ? '#2563eb' : '#e2e6ed',
                    background: form.tipoPessoa === 'PF' ? '#eff6ff' : '#fff',
                    color: form.tipoPessoa === 'PF' ? '#2563eb' : '#0f172a',
                    fontWeight:600,
                    cursor:'pointer'
                  }}>
                  Pessoa Física
                </button>

                <button type="button"
                  onClick={() => setTipoPessoa('PJ')}
                  style={{
                    height:36,
                    padding:'0 16px',
                    borderRadius:8,
                    border:'1px solid',
                    borderColor: form.tipoPessoa === 'PJ' ? '#2563eb' : '#e2e6ed',
                    background: form.tipoPessoa === 'PJ' ? '#eff6ff' : '#fff',
                    color: form.tipoPessoa === 'PJ' ? '#2563eb' : '#0f172a',
                    fontWeight:600,
                    cursor:'pointer'
                  }}>
                  Pessoa Jurídica
                </button>

              </div>

            </div>

            <label style={{
              display:'flex',
              alignItems:'center',
              gap:6,
              cursor:'pointer',
              paddingBottom:8,
              fontSize:13
            }}>
              <input
                type="checkbox"
                checked={form.ativo ?? true}
                onChange={e => upd('ativo', e.target.checked)}
                style={{ width:16, height:16 }}
              />
              Ativo
            </label>

          </div>

          {/* nome */}
          <FField
            label={form.tipoPessoa === 'PF'
              ? 'Fornecedor'
              : 'Fornecedor'}
            required
            value={form.fornecedor ?? ''}
            onChange={v => upd('fornecedor', v)}
          />

          {/* docs */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>

            <div style={{ flex:'1 1 220px' }}>
              <FField
                label={form.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                value={form.cpfCnpj ?? ''}
                onChange={v => upd('cpfCnpj', v)}
              />
            </div>

            <div style={{ flex:'1 1 220px' }}>
              <FField
                label={form.tipoPessoa === 'PF' ? 'RG' : 'Inscrição Estadual'}
                value={form.RgInscEst ?? ''}
                onChange={v => upd('RgInscEst', v)}
              />
            </div>

          </div>

          {/* contato */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>

            <div style={{ flex:'1 1 220px' }}>
              <FField
                label="Telefone"
                value={form.fone ?? ''}
                onChange={v => upd('fone', v)}
              />
            </div>

            <div style={{ flex:'1 1 320px' }}>
              <FField
                label="Email"
                value={form.email ?? ''}
                onChange={v => upd('email', v)}
              />
            </div>

          </div>

          {/* endereço */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>

            <div style={{ flex:'1 1 320px' }}>
              <FField
                label="Endereço"
                value={form.endereco ?? ''}
                onChange={v => upd('endereco', v)}
              />
            </div>

            <div style={{ flex:'1 1 220px' }}>
              <FField
                label="Bairro"
                value={form.bairro ?? ''}
                onChange={v => upd('bairro', v)}
              />
            </div>

            <div style={{ flex:'0 0 140px' }}>
              <FField
                label="CEP"
                value={form.cep ?? ''}
                onChange={v => upd('cep', v)}
              />
            </div>

          </div>

          {/* cidade */}
          <div style={{ width:'100%', maxWidth:700 }}>

            <label style={lbl}>Cidade</label>

            <div style={{ display:'flex', gap:8 }}>

              <input
                type="text"
                readOnly
                value={cidadeLabel}
                style={{ ...inp, flex:1 }}
              />

              <button
                type="button"
                onClick={() => setOpenCidades(true)}
                style={btnSearch}>
                Pesquisar
              </button>

            </div>

          </div>

        </div>

      </Modal>

      {openCidades && (

        <Overlay onClose={() => setOpenCidades(false)}>

          <div style={{
            background:'#fff',
            borderRadius:12,
            width:'100%',
            maxWidth:700,
            maxHeight:'90vh',
            overflow:'hidden'
          }}>

            <div style={{
              padding:'18px 24px',
              borderBottom:'1px solid #e2e6ed',
              fontWeight:700
            }}>
              Consulta de Cidades
            </div>

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

                      <td style={{ padding:10 }}>
                        {c.cidade}
                      </td>

                      <td style={{ padding:10, textAlign:'right' }}>

                        <button
                          onClick={() => selectCidade(c)}
                          style={{
                            padding:'4px 12px',
                            border:'none',
                            borderRadius:6,
                            background:'#2563eb',
                            color:'#fff',
                            cursor:'pointer',
                            fontSize:12,
                            fontWeight:600
                          }}>
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

      <ConfirmDialog
        open={!!confirm}
        name={confirm?.fornecedor}
        onClose={() => setConfirm(null)}
        onConfirm={del}
      />

    </div>
  )
}
