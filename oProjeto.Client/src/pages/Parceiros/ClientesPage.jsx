import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { clientesApi, cidadesApi, condicoesApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const btnSearch = { padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

// Máscara DD/MM/AAAA
const maskDate = v => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

export default function ClientesPage() {
  const { data, loading, load } = useCrud(clientesApi)
  const [cidades, setCidades] = useState([])
  const [condicoes, setCondicoes] = useState([])
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const [openCidades, setOpenCidades] = useState(false)
  const [openCondicoes, setOpenCondicoes] = useState(false)

  useEffect(() => {
    cidadesApi.getAll().then(res => setCidades(res?.data || res || []))
    condicoesApi.getAll().then(res => setCondicoes(res?.data || res || []))
  }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      const toISO = v => {
        if (!v || !v.includes('/')) return v || null
        const [dd, mm, yyyy] = v.split('/')
        return yyyy ? `${yyyy}-${mm}-${dd}` : null
      }

      const payload = {
        ...form,
        dataNascimento: toISO(form.dataNascimento),
      }

      editing ? await clientesApi.update(payload.codCliente, payload) : await clientesApi.create(payload)
      toast.success('Cliente salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar cliente.') }
  }

  const del = async () => {
    try { await clientesApi.delete(confirm.codCliente); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro ao excluir.') }
  }

  const cols = [
    { key: 'codCliente', label: 'Cód.', mono: true },
    { key: 'cliente', label: 'Cliente' },
    { key: 'cpfCnpj', label: 'CPF / CNPJ' },
    { key: 'fone', label: 'Telefone' },
    { key: 'condicao', label: 'Cond. Pagamento', render: r => r.condicao?.condicaoPagamento ?? '' },
    { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  const selectCidade = r => {
    setForm(f => ({ ...f, codCidade: r.codCidade, cidade: r }))
    setOpenCidades(false)
  }

  const selectCondicao = r => {
    setForm(f => ({ ...f, codCondicao: r.codCondicao, condicao: r }))
    setOpenCondicoes(false)
  }

  // Campo texto/número normal
  const F = (label, key, type = 'text') => (
    <FField label={label} type={type} step={type === 'number' ? '1' : undefined}
      value={form[key] ?? ''}
      onChange={v => upd(key, type === 'number' ? (v === '' ? '' : Number(v)) : v)} />
  )

  // Campo data com máscara DD/MM/AAAA
  const FDate = (label, key) => (
    <div style={{ flex: '1 1 160px' }}>
      <label style={lbl}>{label}</label>
      <input
        type="text"
        placeholder="DD/MM/AAAA"
        value={form[key] ?? ''}
        onChange={e => upd(key, maskDate(e.target.value))}
        style={inp}
      />
    </div>
  )

  const btnTipo = (tipo, label) => (
    <button type="button" onClick={() => upd('tipoPessoa', tipo)} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s ease',
      borderColor: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb' : '#e2e6ed',
      background:  (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#eff6ff'  : '#fff',
      color:       (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb'  : '#0f172a' }}>
      {label}
    </button>
  )

  return (
    <div>
      <PageHeader title="Clientes" sub="Cadastro Geral de Clientes" label="Novo Cliente"
        onNew={() => { setForm({ tipoPessoa: 'F', ativo: true, limiteCredito: 0, numero: 0 }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Cliente' : 'Novo Cliente'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <label style={lbl}>Tipo Pessoa</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {btnTipo('F', 'Pessoa Física')}
                {btnTipo('J', 'Pessoa Jurídica')}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width: 16, height: 16 }} />
              Ativo
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {editing && (
              <div style={{ flex: '0 0 80px' }}>
                <FField label="Código" disabled value={String(form.codCliente ?? '')} onChange={() => { }} />
              </div>
            )}
            <div style={{ flex: '1 1 300px' }}>
              <FField label="Cliente" required value={form.cliente ?? ''} onChange={v => upd('cliente', v)} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <FField label={form.tipoPessoa === 'J' ? 'Nome Fantasia' : 'Apelido'} value={form.apelido ?? ''} onChange={v => upd('apelido', v)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}><FField label={form.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} /></div>
            <div style={{ flex: '1 1 200px' }}><FField label={form.tipoPessoa === 'J' ? 'Inscrição Estadual' : 'RG'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} /></div>
            <div style={{ flex: '1 1 100px' }}>{F('Sexo (M/F)', 'sexo')}</div>
            {FDate('Data de Nascimento', 'dataNascimento')}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>{F('Telefone', 'fone')}</div>
            <div style={{ flex: '2 1 300px' }}>{F('E-mail', 'email')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 130px' }}>{F('CEP', 'cep')}</div>
            <div style={{ flex: '3 1 350px' }}>{F('Endereço', 'endereco')}</div>
            <div style={{ flex: '1 1 90px' }}>{F('Número', 'numero', 'number')}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>{F('Bairro', 'bairro')}</div>
            <div style={{ flex: '1 1 200px' }}>{F('Complemento', 'complemento')}</div>
            <div style={{ flex: '1 1 250px' }}>
              <label style={lbl}>Cidade *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={form.cidade?.cidade ?? ''} style={inp} />
                <button type="button" onClick={() => setOpenCidades(true)} style={btnSearch}>Pesquisar</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 300px' }}>
              <label style={lbl}>Condição de Pagamento *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={form.condicao?.condicaoPagamento ?? ''} style={inp} />
                <button type="button" onClick={() => setOpenCondicoes(true)} style={btnSearch}>Pesquisar</button>
              </div>
            </div>
            <div style={{ flex: '1 1 180px' }}>{F('Limite de Crédito (R$)', 'limiteCredito', 'number')}</div>
          </div>

        </div>
      </Modal>

      {/* MODAL DE CONSULTA - CIDADES */}
      {openCidades && (
        <Overlay onClose={() => setOpenCidades(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Cidades</div>
              <button onClick={() => setOpenCidades(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Cód.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Cidade</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {cidades.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        <td style={{ padding: '11px 14px', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{row.codCidade}</td>
                        <td style={{ padding: '11px 14px', color: '#0f172a' }}>{row.cidade}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button type="button" onClick={() => selectCidade(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Selecionar</button>
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

      {/* MODAL DE CONSULTA - CONDIÇÕES */}
      {openCondicoes && (
        <Overlay onClose={() => setOpenCondicoes(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Condições de Pagamento</div>
              <button onClick={() => setOpenCondicoes(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Cód.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Condição de Pagamento</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {condicoes.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        <td style={{ padding: '11px 14px', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{row.codCondicao}</td>
                        <td style={{ padding: '11px 14px', color: '#0f172a' }}>{row.condicaoPagamento}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button type="button" onClick={() => selectCondicao(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Selecionar</button>
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

      <ConfirmDialog open={!!confirm} name={confirm?.cliente} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}