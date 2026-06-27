import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { funcionariosApi, funcoesApi, cidadesApi } from '@/services/api'

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

// DD/MM/YYYY → YYYY-MM-DD (para o input[type=date] interno)
const toDateInput = v => {
    const [dd, mm, yyyy] = (v ?? '').split('/')
    return yyyy ? `${yyyy}-${mm}-${dd}` : ''
}

// YYYY-MM-DD → DD/MM/YYYY (ao selecionar pelo calendário)
const fromDateInput = v => {
    if (!v) return ''
    const [yyyy, mm, dd] = v.split('-')
    return `${dd}/${mm}/${yyyy}`
}

export default function FuncionariosPage() {
    const { data, loading, load } = useCrud(funcionariosApi)
    const [funcoes, setFuncoes] = useState([])
    const [cidades, setCidades] = useState([])
    const [form, setForm] = useState({})
    const [editing, setEditing] = useState(false)
    const [open, setOpen] = useState(false)
    const [confirm, setConfirm] = useState(null)

    const [openFuncoes, setOpenFuncoes] = useState(false)
    const [openCidades, setOpenCidades] = useState(false)

    useEffect(() => {
        funcoesApi.getAll().then(res => setFuncoes(res?.data || res || []))
        cidadesApi.getAll().then(res => setCidades(res?.data || res || []))
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
                dataAdmissao: toISO(form.dataAdmissao),
                dataDemissao: toISO(form.dataDemissao),
            }

            // VER O QUE ESTÁ SENDO ENVIADO:
            console.log('dataNascimento:', payload.dataNascimento)
            console.log('dataAdmissao:', payload.dataAdmissao)
            console.log('dataDemissao:', payload.dataDemissao)

            editing
                ? await funcionariosApi.update(payload.codFunc, payload)
                : await funcionariosApi.create(payload)

            toast.success('Funcionário salvo!'); setOpen(false); load()
        } catch { toast.error('Erro ao salvar funcionário.') }
    }
    const del = async () => {
        try { await funcionariosApi.delete(confirm.codFunc); toast.success('Excluído.'); setConfirm(null); load() }
        catch { toast.error('Erro ao excluir.') }
    }

    const cols = [
        { key: 'codFunc', label: 'Cód.', mono: true },
        { key: 'funcionario', label: 'Funcionário' },
        { key: 'fone', label: 'Telefone' },
        { key: 'email', label: 'E-mail' },
        { key: 'funcao', label: 'Função', render: r => r.funcao?.descricao ?? r.funcao?.funcao ?? '' },
        { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
    ]

    const funcaoSelecionada = funcoes?.find?.(f => f.codFuncao === form.codFuncao)?.funcao ?? ''
    const selectFuncao = r => { setForm(f => ({ ...f, codFuncao: r.codFuncao })); setOpenFuncoes(false) }
    const cidadeLabel = cidades.find(c => c.codCidade === form.codCidade)?.cidade ?? ''
    console.log('codCidade no form:', form.codCidade, typeof form.codCidade)
    console.log('cidades:', cidades.map(c => ({ cod: c.codCidade, tipo: typeof c.codCidade })))
    const selectCidade = r => { upd('codCidade', r.codCidade); setOpenCidades(false) }

    // Campo texto/número normal
    const F = (label, key, type = 'text') => (
        <FField label={label} type={type} step={type === 'number' ? '0.01' : undefined}
            value={form[key] ?? ''}
            onChange={v => upd(key, type === 'number' ? (v === '' ? '' : Number(v)) : v)} />
    )

    // Campo data com máscara DD/MM/AAAA + calendário nativo
    const FDate = (label, key) => (
        <div style={{ flex: '1 1 180px' }}>
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
        <button type="button" onClick={() => upd('tipoPessoa', tipo)} style={{
            height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s ease',
            borderColor: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb' : '#e2e6ed',
            background: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#eff6ff' : '#fff',
            color: (form.tipoPessoa === tipo || (!form.tipoPessoa && tipo === 'F')) ? '#2563eb' : '#0f172a'
        }}>
            {label}
        </button>
    )

    return (
        <div>
            <PageHeader title="Funcionários" sub="Cadastro Geral de Funcionários" label="Novo Funcionário"
                onNew={() => { setForm({ tipoPessoa: 'F', ativo: true, salario: 0, numero: 0 }); setEditing(false); setOpen(true) }} />

            <DataTable columns={cols} data={data} loading={loading}
                onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
                onDelete={r => setConfirm(r)} />

            <Modal wide open={open} title={editing ? 'Editar Funcionário' : 'Novo Funcionário'} editing={editing}
                onClose={() => setOpen(false)} onSave={save}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Linha 1: Tipo Pessoa e Ativo */}
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

                    {/* Linha 2: Nome e Apelido */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {editing && (
                            <div style={{ flex: '0 0 80px' }}>
                                <FField label="Código" disabled value={String(form.codFunc ?? '')} onChange={() => { }} />
                            </div>
                        )}
                        <div style={{ flex: '1 1 300px' }}>
                            <FField label="Funcionário" required value={form.funcionario ?? ''} onChange={v => upd('funcionario', v)} />
                        </div>
                        <div style={{ flex: '1 1 180px' }}>
                            <FField label={form.tipoPessoa === 'J' ? 'Nome Fantasia' : 'Apelido'} value={form.apelido ?? ''} onChange={v => upd('apelido', v)} />
                        </div>
                    </div>

                    {/* Linha 3: Documentação e Gênero */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}><FField label={form.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'} value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} /></div>
                        <div style={{ flex: '1 1 200px' }}><FField label={form.tipoPessoa === 'J' ? 'Inscrição Estadual' : 'RG'} value={form.rgInscEst ?? ''} onChange={v => upd('rgInscEst', v)} /></div>
                        <div style={{ flex: '1 1 100px' }}>{F('Sexo (M/F)', 'sexo')}</div>
                    </div>

                    {/* Linha 4: Contatos */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>{F('Telefone / Celular', 'fone')}</div>
                        <div style={{ flex: '2 1 300px' }}>{F('E-mail', 'email')}</div>
                    </div>

                    {/* Linha 5: Endereço */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 140px' }}>{F('CEP', 'cep')}</div>
                        <div style={{ flex: '3 1 350px' }}>{F('Endereço', 'endereco')}</div>
                        <div style={{ flex: '1 1 90px' }}>{F('Número', 'numero', 'number')}</div>
                    </div>

                    {/* Linha 6: Bairro, Complemento e Cidade */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 180px' }}>{F('Bairro', 'bairro')}</div>
                        <div style={{ flex: '1 1 180px' }}>{F('Complemento', 'complemento')}</div>
                        <div style={{ flex: '1 1 240px' }}>
                            <label style={lbl}>Cidade *</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="text" readOnly value={cidadeLabel} style={{ ...inp, flex: 1 }} />
                                <button type="button" onClick={() => setOpenCidades(true)} style={btnSearch}>Pesquisar</button>
                            </div>
                        </div>
                    </div>

                    {/* Linha 7: Função e Salário */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '2 1 300px' }}>
                            <label style={lbl}>Função / Cargo *</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="text" readOnly value={funcaoSelecionada} style={{ ...inp, flex: 1 }} />
                                <button type="button" onClick={() => setOpenFuncoes(true)} style={btnSearch}>Pesquisar</button>
                            </div>
                        </div>
                        <div style={{ flex: '1 1 180px' }}>{F('Salário Base (R$)', 'salario', 'number')}</div>
                    </div>

                    {/* Linha 8: Datas */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {FDate('Data de Nascimento', 'dataNascimento')}
                        {FDate('Data de Admissão', 'dataAdmissao')}
                        {FDate('Data de Demissão', 'dataDemissao')}
                    </div>

                </div>
            </Modal>

            {/* MODAL - CIDADES */}
            {openCidades && (
                <Overlay onClose={() => setOpenCidades(false)}>
                    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', fontWeight: 700 }}>Consulta de Cidades</div>
                        <div style={{ padding: 24, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fb' }}>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Código</th>
                                        <th style={{ padding: 10, textAlign: 'left' }}>Cidade</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {cidades.map(c => (
                                        <tr key={c.codCidade} style={{ borderTop: '1px solid #f1f4f8' }}>
                                            <td style={{ padding: 10 }}>{c.codCidade}</td>
                                            <td style={{ padding: 10 }}>{c.cidade}</td>
                                            <td style={{ padding: 10, textAlign: 'right' }}>
                                                <button onClick={() => selectCidade(c)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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

            {/* MODAL - FUNÇÕES */}
            {openFuncoes && (
                <Overlay onClose={() => setOpenFuncoes(false)} zIndex={60}>
                    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Funções</div>
                            <button onClick={() => setOpenFuncoes(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                                            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Cód.</th>
                                            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Descrição / Cargo</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {funcoes.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                                                <td style={{ padding: '11px 14px', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{row.codFuncao}</td>
                                                <td style={{ padding: '11px 14px', color: '#0f172a' }}>{row.funcao}</td>
                                                <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                                                    <button onClick={() => selectFuncao(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Selecionar</button>
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

            <ConfirmDialog open={!!confirm} name={confirm?.funcionario} onClose={() => setConfirm(null)} onConfirm={del} />
        </div>
    )
}