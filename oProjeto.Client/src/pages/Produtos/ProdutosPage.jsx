import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { produtosApi, categoriasApi, marcasApi } from '@/services/api'
import { useModalGuard } from '@/hooks/useModalGuard'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'

const Overlay = ({ children, onClose, zIndex = 50 }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    {children}
  </div>
)

const ModalBox = ({ children, maxWidth = 680 }) => (
  <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)', animation: 'slideUp .2s ease' }}>
    {children}
  </div>
)

const ModalHeader = ({ title, badge, onClose }) => (
  <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e6ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</div>
      {badge}
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
  </div>
)

const Inp = ({ label, value, onChange, maxLength, placeholder, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <input type="text" value={value} maxLength={maxLength} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={inp} onFocus={fo} onBlur={bl} />
  </div>
)

const BtnPrimary = ({ onClick, disabled, children, style }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: disabled ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: disabled ? .7 : 1, ...style }}
    onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '.85')}
    onMouseLeave={e => e.currentTarget.style.opacity = disabled ? '.7' : '1'}>
    {children}
  </button>
)

const BtnSecondary = ({ onClick, children }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', border: '1px solid #e2e6ed', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#475569' }}>
    {children}
  </button>
)

const CheckAtivo = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, whiteSpace: 'nowrap', fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
    Ativo
  </label>
)

const LookupField = ({ label, value, onSearch, style }) => (
  <div style={style}>
    <label style={lbl}>{label}</label>
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="text" readOnly value={value} style={{ ...inp, flex: 1 }} />
      <button type="button" onClick={onSearch}
        style={{ padding: '0 14px', height: 37, border: '1px solid #e2e6ed', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, background: '#f8f9fb', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e6ed'; e.currentTarget.style.color = '#0f172a' }}>
        Pesquisar
      </button>
    </div>
  </div>
)

const LookupTable = ({ cols, rows, onSelect }) => (
  <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
    <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
            {cols.map(c => <th key={c.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }}>{c.label}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map(c => (
                <td key={c.key} style={{ padding: '11px 14px', color: '#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>
                  {c.render ? c.render(row) : String(row[c.key] ?? '')}
                </td>
              ))}
              <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                <button onClick={() => onSelect(row)}
                  style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Selecionar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const InlineForm = ({ title, children }) => (
  <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e6ed', background: '#f8faff' }}>
    <div style={{ marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>
  </div>
)

const BtnNovo = ({ onClick, label }) => (
  <BtnPrimary onClick={onClick} style={{ marginTop: 6, padding: '4px 12px', fontSize: 12 }}>+ {label}</BtnPrimary>
)

const SaveRow = ({ onCancel, onSave, saving, label }) => (
  <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
    <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
    <BtnPrimary onClick={onSave} disabled={saving}>{saving ? 'Salvando...' : label}</BtnPrimary>
  </div>
)

const colsCategorias = [
  { key: 'codCategoria', label: 'Cód.', mono: true },
  { key: 'categoria',    label: 'Categoria' },
]
const colsMarcas = [
  { key: 'codMarca', label: 'Cód.', mono: true },
  { key: 'marca',    label: 'Marca' },
]

const CATEGORIA_EMPTY = { categoria: '', ativo: true }
const MARCA_EMPTY     = { marca: '', ativo: true }
const PRODUTO_EMPTY   = { ativo: true, saldo: 0, quantidadeMinima: 1, pesoBruto: 0, pesoLiq: 0, precoCompra: 0, precoVenda: 0, custoMedio: 0 }

export default function ProdutosPage() {
  const { data, loading, load } = useCrud(produtosApi)
  const [categorias, setCategorias] = useState([])
  const [marcas,     setMarcas]     = useState([])

  const [form,         setForm]         = useState(PRODUTO_EMPTY)
  const [originalForm, setOriginalForm] = useState(PRODUTO_EMPTY)
  const [editing,      setEditing]      = useState(false)
  const [open,         setOpen]         = useState(false)
  const [confirm,      setConfirm]      = useState(null)

  const [openCategorias,    setOpenCategorias]    = useState(false)
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria,     setNovaCategoria]     = useState(CATEGORIA_EMPTY)
  const [savingCategoria,   setSavingCategoria]   = useState(false)

  const [openMarcas,    setOpenMarcas]    = useState(false)
  const [showNovaMarca, setShowNovaMarca] = useState(false)
  const [novaMarca,     setNovaMarca]     = useState(MARCA_EMPTY)
  const [savingMarca,   setSavingMarca]   = useState(false)

  const loadCategorias = async () => setCategorias(await categoriasApi.getAll())
  const loadMarcas     = async () => setMarcas(await marcasApi.getAll())

  useEffect(() => { loadCategorias(); loadMarcas() }, [])

  const upd  = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const updC = (k, v) => setNovaCategoria(p => ({ ...p, [k]: v }))
  const updM = (k, v) => setNovaMarca(p => ({ ...p, [k]: v }))

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

  const saveNovaCategoria = async () => {
    if (!novaCategoria.categoria.trim()) { toast.error('Informe a categoria.'); return }
    setSavingCategoria(true)
    try {
      const created = await categoriasApi.create(novaCategoria)
      toast.success('Categoria cadastrada!')
      await loadCategorias()
      const codNovo = created?.codCategoria ?? created?.id
      if (codNovo) upd('codCategoria', codNovo)
      setShowNovaCategoria(false)
      setNovaCategoria(CATEGORIA_EMPTY)
    } catch { toast.error('Erro ao salvar categoria.') }
    finally { setSavingCategoria(false) }
  }

  const saveNovaMarca = async () => {
    if (!novaMarca.marca.trim()) { toast.error('Informe a marca.'); return }
    setSavingMarca(true)
    try {
      const created = await marcasApi.create(novaMarca)
      toast.success('Marca cadastrada!')
      await loadMarcas()
      const codNovo = created?.codMarca ?? created?.id
      if (codNovo) upd('codMarca', codNovo)
      setShowNovaMarca(false)
      setNovaMarca(MARCA_EMPTY)
    } catch { toast.error('Erro ao salvar marca.') }
    finally { setSavingMarca(false) }
  }

  const cancelCat   = () => { setShowNovaCategoria(false); setNovaCategoria(CATEGORIA_EMPTY) }
  const cancelMar   = () => { setShowNovaMarca(false);     setNovaMarca(MARCA_EMPTY) }
  const closeCats   = () => { setOpenCategorias(false);    cancelCat() }
  const closeMarcas = () => { setOpenMarcas(false);        cancelMar() }

  const catLabel   = categorias.find(c => c.codCategoria === form.codCategoria)?.categoria ?? ''
  const marcaLabel = marcas.find(m => m.codMarca === form.codMarca)?.marca ?? ''

  // ══════════════════════════════════════════════════════════════════
  // fechamento seguro em cascata — Categoria e Marca são lookups IRMÃOS
  // (ao contrário de Cidade→Estado→País no FornecedoresPage, aqui não
  // há encadeamento: os dois penduram direto do Produto)
  //   Produto (nível 1)
  //     ├─ Categoria (nível 2a)
  //     └─ Marca     (nível 2b)
  // ══════════════════════════════════════════════════════════════════

  const isDirtyProduto = JSON.stringify(form) !== JSON.stringify(originalForm)
  const suspendProduto = openCategorias || openMarcas

  const isDirtyCategoria = showNovaCategoria && JSON.stringify(novaCategoria) !== JSON.stringify(CATEGORIA_EMPTY)
  const categoriasGuard = useModalGuard({
    isOpen: openCategorias,
    isDirty: isDirtyCategoria,
    onClose: closeCats,
    onSave: showNovaCategoria ? saveNovaCategoria : undefined,
  })

  const isDirtyMarca = showNovaMarca && JSON.stringify(novaMarca) !== JSON.stringify(MARCA_EMPTY)
  const marcasGuard = useModalGuard({
    isOpen: openMarcas,
    isDirty: isDirtyMarca,
    onClose: closeMarcas,
    onSave: showNovaMarca ? saveNovaMarca : undefined,
  })

  const cols = [
    { key: 'codProd',    label: 'Cód.',      mono: true },
    { key: 'produto',    label: 'Produto' },
    { key: 'unidade',    label: 'Un.',        mono: true },
    { key: 'categoria',  label: 'Categoria',  render: r => r.categoria?.categoria ?? '' },
    { key: 'marca',      label: 'Marca',      render: r => r.marca?.marca ?? '' },
    { key: 'saldo',      label: 'Saldo' },
    { key: 'quantidadeMinima', label:'Quantidade Minima'},
    { key: 'precoVenda', label: 'Preço Venda' },
    { key: 'ativo',      label: 'Ativo',      render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  const F = (label, key, num = false) => (
    <FField label={label} type={num ? 'number' : 'text'} step={num ? '0.01' : undefined}
      value={form[key] ?? ''} onChange={v => upd(key, num ? Number(v) : v)} />
  )

  const abrirNovo = () => {
    setForm(PRODUTO_EMPTY); setOriginalForm(PRODUTO_EMPTY)
    setEditing(false); setOpen(true)
  }

  const abrirEdicao = (r) => {
    setForm(r); setOriginalForm(r)
    setEditing(true); setOpen(true)
  }

  return (
    <div>
      <PageHeader title="Produtos" sub="Consulta de Produtos" label="Novo Produto"
        onNew={abrirNovo} disabled={open} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicao}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar Produto' : 'Novo Produto'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}
        isDirty={isDirtyProduto}
        suspended={suspendProduto}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {editing && (
              <div style={{ flex: '0 0 80px' }}>
                <FField label="Código" disabled value={String(form.codProd ?? '')} onChange={() => {}} />
              </div>
            )}
            <div style={{ flex: '1 1 200px' }}>{F('Produto', 'produto')}</div>
            <div style={{ flex: '0 0 100px' }}>{F('Unidade', 'unidade')}</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', paddingBottom: 8, fontSize: 13, fontFamily: 'Outfit, sans-serif', color: '#0f172a', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Ativo
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <LookupField label="Categoria" value={catLabel}
              onSearch={() => { setShowNovaCategoria(false); setOpenCategorias(true) }}
              style={{ flex: '1 1 200px' }} />
            <LookupField label="Marca" value={marcaLabel}
              onSearch={() => { setShowNovaMarca(false); setOpenMarcas(true) }}
              style={{ flex: '1 1 200px' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>{F('Preço Compra (R$)', 'precoCompra', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Preço Venda (R$)', 'precoVenda', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Custo Médio (R$)', 'custoMedio', true)}</div>
            <div style={{ flex: '1 1 140px' }}>{F('Saldo', 'saldo', true)}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 140px' }}>{F('Quandidade Minima', 'quantidadeMinima', true)}</div>
            <div style={{ flex: '0 0 150px' }}>{F('Peso Bruto (kg)', 'pesoBruto', true)}</div>
            <div style={{ flex: '0 0 150px' }}>{F('Peso Líquido (kg)', 'pesoLiq', true)}</div>
          </div>

        </div>
      </Modal>

      {/* Categorias */}
      {openCategorias && (
        <Overlay onClose={categoriasGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Categorias" onClose={categoriasGuard.attemptClose}
              badge={!showNovaCategoria && <BtnNovo onClick={() => setShowNovaCategoria(true)} label="Nova Categoria" />} />

            {showNovaCategoria && (
              <InlineForm title="Nova Categoria">
                <Inp label="Categoria *" value={novaCategoria.categoria} onChange={v => updC('categoria', v)}
                  placeholder="" style={{ flex: '1 1 240px' }} />
                <CheckAtivo checked={novaCategoria.ativo} onChange={v => updC('ativo', v)} />
                <SaveRow onCancel={cancelCat} onSave={saveNovaCategoria} saving={savingCategoria} label="Salvar Categoria" />
              </InlineForm>
            )}

            <LookupTable cols={colsCategorias} rows={categorias}
              onSelect={r => { upd('codCategoria', r.codCategoria); setOpenCategorias(false) }} />
          </ModalBox>
        </Overlay>
      )}

      {/* Marcas */}
      {openMarcas && (
        <Overlay onClose={marcasGuard.attemptClose} zIndex={60}>
          <ModalBox maxWidth={560}>
            <ModalHeader title="Consulta de Marcas" onClose={marcasGuard.attemptClose}
              badge={!showNovaMarca && <BtnNovo onClick={() => setShowNovaMarca(true)} label="Nova Marca" />} />

            {showNovaMarca && (
              <InlineForm title="Nova Marca">
                <Inp label="Marca *" value={novaMarca.marca} onChange={v => updM('marca', v)}
                  placeholder="" style={{ flex: '1 1 240px' }} />
                <CheckAtivo checked={novaMarca.ativo} onChange={v => updM('ativo', v)} />
                <SaveRow onCancel={cancelMar} onSave={saveNovaMarca} saving={savingMarca} label="Salvar Marca" />
              </InlineForm>
            )}

            <LookupTable cols={colsMarcas} rows={marcas}
              onSelect={r => { upd('codMarca', r.codMarca); setOpenMarcas(false) }} />
          </ModalBox>
        </Overlay>
      )}

      <ConfirmDialog
        open={categoriasGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={categoriasGuard.cancelClose} onConfirm={categoriasGuard.confirmClose}
      />
      <ConfirmDialog
        open={marcasGuard.confirming}
        icon="❓" title="Fechar sem salvar?"
        message="Tem certeza que quer fechar? Tudo será apagado."
        confirmLabel="Fechar mesmo assim" confirmColor="#dc2626"
        onClose={marcasGuard.cancelClose} onConfirm={marcasGuard.confirmClose}
      />

      <ConfirmDialog open={!!confirm} name={confirm?.produto} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}