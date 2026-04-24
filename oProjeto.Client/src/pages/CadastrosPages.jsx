import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField, FSelect } from '../components/UI'
import { cidadesApi, estadosApi, fornecedoresApi, transportadoresApi, veiculosApi, ncmApi, produtosApi } from '../services/api'

// ── helper ───────────────────────────────────────────────────────────
function useCrud(api, deps = []) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); setData(await api.getAll()); setLoading(false) }
  useEffect(() => { load() }, deps)
  return { data, loading, load }
}

// ════════════════════════════════════════════════════
//  CIDADES
// ════════════════════════════════════════════════════
export function CidadesPage() {
  const { data, loading, load } = useCrud(cidadesApi)
  const [estados, setEstados]   = useState([])
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState(null)

  useEffect(() => { estadosApi.getAll().then(setEstados) }, [])

  const save = async () => {
    try {
      editing ? await cidadesApi.update(form.codCidade, form) : await cidadesApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }
  const del = async () => {
    try { await cidadesApi.delete(confirm.codCidade); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'codCidade', label: 'Cód.', mono: true },
    { key: 'cidade',    label: 'Cidade' },
    { key: 'estado',    label: 'Estado', render: r => `${r.estado?.uf ?? ''} - ${r.estado?.estado ?? ''}` },
  ]

  return (
    <div>
      <PageHeader title="Cidades" sub="Municípios vinculados a estados" label="Nova Cidade"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal open={open} title={editing ? 'Editar Cidade' : 'Nova Cidade'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <FField label="Cidade" required value={form.cidade ?? ''} onChange={v => setForm(p => ({ ...p, cidade: v }))} />
          <FSelect label="Estado" required value={form.codEstado}
            onChange={v => setForm(p => ({ ...p, codEstado: Number(v) }))}
            opts={estados.map(e => ({ id: e.codEstado, label: `${e.uf} - ${e.estado}` }))} />
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} name={confirm?.cidade} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}

// ════════════════════════════════════════════════════
//  FORNECEDORES
// ════════════════════════════════════════════════════
export function FornecedoresPage() {
  const { data, loading, load } = useCrud(fornecedoresApi)
  const [cidades, setCidades]   = useState([])
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState(null)

  useEffect(() => { cidadesApi.getAll().then(setCidades) }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const save = async () => {
    try {
      editing ? await fornecedoresApi.update(form.codForn, form) : await fornecedoresApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }
  const del = async () => {
    try { await fornecedoresApi.delete(confirm.codForn); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'codForn',     label: 'Cód.', mono: true },
    { key: 'fornecedor', label: 'Razão Social' },
    { key: 'cnpj',        label: 'CNPJ', mono: true },
    { key: 'fone',        label: 'Telefone' },
    { key: 'cidade',      label: 'Cidade', render: r => r.cidade?.cidade ?? '' },
  ]

  const f = (label, key, req = false, full = false) => (
    <FField label={label} required={req} full={full} value={form[key] ?? ''} onChange={v => upd(key, v)} />
  )

  return (
    <div>
      <PageHeader title="Fornecedores" sub="Cadastro completo de fornecedores" label="Novo Fornecedor"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal wide open={open} title={editing ? 'Editar Fornecedor' : 'Novo Fornecedor'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {f('Razão Social', 'fornecedor', true, true)}
          {f('CNPJ', 'cnpj', true)}
          {f('Insc. Estadual', 'inscEst')}
          {f('Insc. Est. Sub. Trib.', 'inscEstSubTrib')}
          {f('Endereço', 'endereco', false, true)}
          {f('Bairro', 'bairro')}
          <FSelect label="Cidade" required value={form.codCidade}
            onChange={v => setForm(p => ({ ...p, codCidade: Number(v) }))}
            opts={cidades.map(c => ({ id: c.codCidade, label: c.cidade }))} />
          {f('CEP', 'cep')}
          {f('Telefone', 'fone')}
          {f('E-mail', 'email', false, true)}
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} name={confirm?.fornecedor} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}

// ════════════════════════════════════════════════════
//  TRANSPORTADORES
// ════════════════════════════════════════════════════
export function TransportadoresPage() {
  const { data, loading, load } = useCrud(transportadoresApi)
  const [cidades, setCidades]   = useState([])
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState(null)

  useEffect(() => { cidadesApi.getAll().then(setCidades) }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
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
    { key: 'codTransp',      label: 'Cód.', mono: true },
    { key: 'transportador', label: 'Razão Social' },
    { key: 'cpfCnpj',  label: 'CPF/CNPJ', mono: true },
    { key: 'cidade',         label: 'Cidade', render: r => r.cidade?.cidade ?? '' },
  ]

  return (
    <div>
      <PageHeader title="Transportadores" sub="Transportadoras e fretes" label="Novo Transportador"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal open={open} title={editing ? 'Editar Transportador' : 'Novo Transportador'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <FField label="Razão Social" required full value={form.transportador ?? ''} onChange={v => upd('transportador', v)} />
          <FField label="CPF/CNPJ" required value={form.cpfCnpj ?? ''} onChange={v => upd('cpfCnpj', v)} />
          <FField label="Insc. Estadual" value={form.inscEst ?? ''} onChange={v => upd('inscEst', v)} />
          <FField label="Endereço" full value={form.endereco ?? ''} onChange={v => upd('endereco', v)} />
          <FSelect label="Cidade" required value={form.codCidade}
            onChange={v => setForm(p => ({ ...p, codCidade: Number(v) }))}
            opts={cidades.map(c => ({ id: c.codCidade, label: c.cidade }))} />
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} name={confirm?.transportador} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}

// ════════════════════════════════════════════════════
//  VEÍCULOS
// ════════════════════════════════════════════════════
export function VeiculosPage() {
  const { data, loading, load } = useCrud(veiculosApi)
  const [estados, setEstados]   = useState([])
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState(null)

  useEffect(() => { estadosApi.getAll().then(setEstados) }, [])

  const save = async () => {
    try {
      editing ? await veiculosApi.update(form.codVeic, form) : await veiculosApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }
  const del = async () => {
    try { await veiculosApi.delete(confirm.codVeic); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'codVeic',   label: 'Cód.', mono: true },
    { key: 'placaVeic', label: 'Placa', mono: true },
    { key: 'codANTT',   label: 'ANTT', mono: true },
    { key: 'estado',    label: 'Estado', render: r => r.estado?.uf ?? '' },
  ]

  return (
    <div>
      <PageHeader title="Veículos" sub="Frota de transporte" label="Novo Veículo"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal open={open} title={editing ? 'Editar Veículo' : 'Novo Veículo'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <FField label="Placa" required value={form.placaVeic ?? ''} onChange={v => setForm(p => ({ ...p, placaVeic: v }))} />
          <FField label="ANTT" value={form.codANTT ?? ''} onChange={v => setForm(p => ({ ...p, codANTT: v }))} />
          <FSelect label="Estado" required full value={form.codEstado}
            onChange={v => setForm(p => ({ ...p, codEstado: Number(v) }))}
            opts={estados.map(e => ({ id: e.codEstado, label: `${e.uf} - ${e.estado}` }))} />
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} name={confirm?.placaVeic} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}

// ════════════════════════════════════════════════════
//  NCM/SH
// ════════════════════════════════════════════════════
export function NcmPage() {
  const { data, loading, load } = useCrud(ncmApi)
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState(null)

  const save = async () => {
    try {
      editing ? await ncmApi.update(form.ncmSh, form) : await ncmApi.create(form)
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }
  const del = async () => {
    try { await ncmApi.delete(confirm.ncmSh); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const cols = [
    { key: 'ncmSh',        label: 'NCM/SH', mono: true },
    { key: 'aliqIcms', label: 'Alíq. ICMS (%)' },
    { key: 'aliqIpi',  label: 'Alíq. IPI (%)' },
  ]

  return (
    <div>
      <PageHeader title="NCM/SH" sub="Nomenclatura Comum do Mercosul" label="Novo NCM"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal open={open} title={editing ? 'Editar NCM' : 'Novo NCM'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          <FField label="NCM/SH" required value={form.ncmSh ?? ''} onChange={v => setForm(p => ({ ...p, ncmSh: v }))} />
          <FField label="Alíq. ICMS (%)" type="number" step="0.01" value={form.aliqIcms ?? ''} onChange={v => setForm(p => ({ ...p, aliqIcms: Number(v) }))} />
          <FField label="Alíq. IPI (%)"  type="number" step="0.01" value={form.aliqIpi ?? ''}  onChange={v => setForm(p => ({ ...p, aliqIpi: Number(v) }))} />
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} name={confirm?.ncmSh} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}

// ════════════════════════════════════════════════════
//  PRODUTOS
// ════════════════════════════════════════════════════
export function ProdutosPage() {
  const { data, loading, load } = useCrud(produtosApi)
  const [ncms, setNcms]         = useState([])
  const [form, setForm]         = useState({})
  const [editing, setEditing]   = useState(false)
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState(null)

  useEffect(() => { ncmApi.getAll().then(setNcms) }, [])

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
    { key: 'codProd',  label: 'Cód.', mono: true },
    { key: 'produto', label: 'Descrição' },
    { key: 'unidade',  label: 'Un.' },
    { key: 'ncmShs', label: 'NCM', render: r => r.ncmShs?.ncmSh ?? '' },    
    { key: 'saldo',label: 'Saldo' },
  ]

  const fn = (label, key, num = false, full = false) => (
    <FField label={label} full={full} type={num ? 'number' : 'text'} step={num ? '0.01' : undefined}
      value={form[key] ?? ''} onChange={v => upd(key, num ? Number(v) : v)} />
  )

  return (
    <div>
      <PageHeader title="Produtos" sub="Catálogo de produtos" label="Novo Produto"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />
      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />
      <Modal wide open={open} title={editing ? 'Editar Produto' : 'Novo Produto'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {fn('Descrição', 'produto', false, true)}
          <FSelect label="NCM/SH" required value={form.ncmSh}
            onChange={v => setForm(p => ({ ...p, ncmSh: v }))}
            opts={ncms.map(n => ({ id: n.ncmSh, label: n.ncmSh }))} />
          {fn('Unidade', 'unidade')}
          {fn('Peso Bruto (kg)', 'pesoBruto', true)}
          {fn('Peso Líq. (kg)', 'pesoLiq', true)}
          {fn('Saldo', 'saldo', true)}
          {fn('Custo Médio', 'custoMedio', true)}
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} name={confirm?.produto} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
