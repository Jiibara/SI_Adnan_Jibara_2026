import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { produtosApi, categoriasApi, marcasApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const btnSearch = { padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

export default function ProdutosPage() {
  const { data, loading, load } = useCrud(produtosApi)
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [form, setForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  
  // Modais de Pesquisa Externa
  const [openCategorias, setOpenCategorias] = useState(false)
  const [openMarcas, setOpenMarcas] = useState(false)

  useEffect(() => { 
    categoriasApi.getAll().then(setCategorias)
    marcasApi.getAll().then(setMarcas)
  }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    try {
      editing ? await produtosApi.update(form.codProd, form) : await produtosApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await produtosApi.delete(confirm.codProd); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'codProd', label: 'Cód.', mono: true },
    { key: 'produto', label: 'Produto' },
    { key: 'unidade', label: 'Un.', mono: true },
    { key: 'categoria', label: 'Categoria', render: r => r.categoria?.categoria ?? '' },
    { key: 'marca', label: 'Marca', render: r => r.marca?.marca ?? '' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'precoVenda', label: 'Preço Venda' },
    { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  // Seletores e Labels das FKs
  const catSelecionada = categorias.find(c => c.codCategoria === form.codCategoria)
  const catLabel = catSelecionada ? catSelecionada.categoria : ''
  const selectCategoria = r => { setForm(f => ({ ...f, codCategoria: r.codCategoria })); setOpenCategorias(false) }

  const marcaSelecionada = marcas.find(m => m.codMarca === form.codMarca)
  const marcaLabel = marcaSelecionada ? marcaSelecionada.marca : ''
  const selectMarca = r => { setForm(f => ({ ...f, codMarca: r.codMarca })); setOpenMarcas(false) }

  const F = (label, key, num = false) => (
    <FField label={label} type={num ? 'number' : 'text'} step={num ? '0.01' : undefined}
      value={form[key] ?? ''} onChange={v => upd(key, num ? Number(v) : v)} />
  )

  return (
    <div>
      <PageHeader title="Produtos" sub="Consulta de Produtos" label="Novo Produto"
        onNew={() => { setForm({ ativo: true, saldo: 0, pesoBruto: 0, pesoLiq: 0, precoCompra: 0, precoVenda: 0, custoMedio: 0 }); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Produto' : 'Novo Produto'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Linha 1: Dados Principais */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {editing && (
              <div style={{ flex: '0 0 80px' }}>
                <FField label="Código" disabled value={String(form.codProd ?? '')} onChange={() => { }} />
              </div>
            )}
            <div style={{ flex: '0 0 200px' }}>{F('Produto', 'produto')}</div>
            <div style={{ flex: '0 0 100px' }}>{F('Unidade', 'unidade')}</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Ativo
            </label>
          </div>

          {/* Linha 2: Chaves Estrangeiras (Categoria, Marca) */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Campo Categoria */}
            <div style={{ flex: '1 1 200px' }}>
              <label style={lbl}>Categoria *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={catLabel} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setOpenCategorias(true)} style={btnSearch}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
                  Pesquisar
                </button>
              </div>
            </div>

            {/* Campo Marca */}
            <div style={{ flex: '1 1 200px' }}>
              <label style={lbl}>Marca *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={marcaLabel} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setOpenMarcas(true)} style={btnSearch}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
                  Pesquisar
                </button>
              </div>
            </div>
          </div>

          {/* Linha 3: Preços e Custos */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>{F('Preço Compra (R$)', 'precoCompra', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Preço Venda (R$)', 'precoVenda', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Custo Médio (R$)', 'custoMedio', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Saldo', 'saldo', true)}</div>
          </div>

          {/* Linha 4: Pesos de Transporte */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 150px' }}>{F('Peso Bruto (kg)', 'pesoBruto', true)}</div>
            <div style={{ flex: '0 0 150px' }}>{F('Peso Líquido (kg)', 'pesoLiq', true)}</div>
          </div>

        </div>
      </Modal>

      {/* MODAL DE CONSULTA - CATEGORIAS */}
      {openCategorias && (
        <Overlay onClose={() => setOpenCategorias(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Categorias</div>
              <button onClick={() => setOpenCategorias(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Cód.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Categoria</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        <td style={{ padding: '11px 14px', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{row.codCategoria}</td>
                        <td style={{ padding: '11px 14px', color: '#0f172a' }}>{row.categoria}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button onClick={() => selectCategoria(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Selecionar</button>
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

      {/* MODAL DE CONSULTA - MARCAS */}
      {openMarcas && (
        <Overlay onClose={() => setOpenMarcas(false)} zIndex={60}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Consulta de Marcas</div>
              <button onClick={() => setOpenMarcas(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Cód.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Marca</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {marcas.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}>
                        <td style={{ padding: '11px 14px', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>{row.codMarca}</td>
                        <td style={{ padding: '11px 14px', color: '#0f172a' }}>{row.marca}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <button onClick={() => selectMarca(row)} style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Selecionar</button>
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

      <ConfirmDialog open={!!confirm} name={confirm?.produto} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}