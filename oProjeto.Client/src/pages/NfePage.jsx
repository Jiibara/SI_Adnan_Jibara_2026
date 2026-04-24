import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField, FSelect, FSep, FTextarea } from '../components/UI'
import { nfeApi, fornecedoresApi, transportadoresApi, veiculosApi } from '../services/api'

export default function NfePage() {
  const [data, setData]       = useState([])
  const [forns, setForns]     = useState([])
  const [transps, setTransps] = useState([])
  const [veics, setVeics]     = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({})
  const [editing, setEditing] = useState(false)
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    setLoading(true)
    const [n, f, t, v] = await Promise.all([
      nfeApi.getAll(), fornecedoresApi.getAll(),
      transportadoresApi.getAll(), veiculosApi.getAll(),
    ])
    setData(n); setForns(f); setTransps(t); setVeics(v); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const num = (k, v) => setForm(p => ({ ...p, [k]: v === '' ? undefined : Number(v) }))

const save = async () => {
  try {
    const body = {
      ...form,
      horaEnt:        form.horaEnt        ? form.horaEnt + ':00'        : null,
      horaProtAcesso: form.horaProtAcesso ? form.horaProtAcesso + ':00' : null,
    }
    editing
      ? await nfeApi.update(body.numero, body.serie, body.modelo, body)
      : await nfeApi.create(body)
    toast.success('NF salva!'); setOpen(false); load()
  } catch { toast.error('Erro ao salvar.') }
}

  const del = async () => {
    try {
      await nfeApi.delete(confirm.numero, confirm.serie, confirm.modelo)
      toast.success('NF excluída.'); setConfirm(null); load()
    } catch { toast.error('Erro ao excluir.') }
  }

  const cols = [
    { key: 'numero',      label: 'Número', mono: true },
    { key: 'serie',       label: 'Série',  mono: true },
    { key: 'modelo',      label: 'Modelo', mono: true },
    { key: 'fornecedor',  label: 'Fornecedor', render: r => r.fornecedor?.fornecedor ?? '' },
    { key: 'dataEmit',    label: 'Emissão' },
    { key: 'valorIcms',   label: 'Valor ICMS' },
  ]

  // atalhos para campos texto e número
  const ft = (label, key, full = false) => (
    <FField label={label} full={full}
      value={form[key] ?? ''} onChange={v => upd(key, v)} />
  )
  const fn = (label, key, type = 'number') => (
    <FField label={label} type={type} step={type === 'number' ? '0.01' : undefined}
      value={form[key] ?? ''} onChange={v => type === 'number' ? num(key, v) : upd(key, v)} />
  )

  return (
    <div>
      <PageHeader title="Notas Fiscais (NFe)" sub="Entradas e saídas fiscais" label="Nova NF"
        onNew={() => { setForm({}); setEditing(false); setOpen(true) }} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => { setForm(r); setEditing(true); setOpen(true) }}
        onDelete={r => setConfirm(r)} />

      <Modal wide open={open} title={editing ? 'Editar NFe' : 'Nova NFe'} editing={editing}
        onClose={() => setOpen(false)} onSave={save}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

          {/* Identificação */}
          <FField label="Número NF" required type="number" value={form.numero ?? ''}  onChange={v => num('numero', v)} />
          <FField label="Série"     required type="number" value={form.serie ?? ''}   onChange={v => num('serie', v)} />
          <FField label="Modelo"    required type="number" value={form.modelo ?? ''}  onChange={v => num('modelo', v)} />
          <FField label="Página"             type="number" value={form.pagina ?? ''}  onChange={v => num('pagina', v)} />

          <FSelect label="Fornecedor" required full value={form.codForn}
            onChange={v => setForm(p => ({ ...p, codForn: Number(v) }))}
            opts={forns.map(f => ({ id: f.codForn, label: f.fornecedor }))} />

          {ft('Natureza da Operação', 'natOper', true)}

          {fn('Data Emissão',  'dataEmit',       'date')}
          {fn('Data Entrada',  'dataEnt',        'date')}
          {fn('Hora Entrada',  'horaEnt',        'time')}

          {/* Protocolo / Chave */}
          <FSep label="Chave e Protocolo" />
          {ft('Chave de Acesso (44 dígitos)', 'chaveAcesso', true)}
          {ft('Protocolo', 'protAcesso')}
          {fn('Data Protocolo', 'dataProtAcesso', 'date')}
          {fn('Hora Protocolo', 'horaProtAcesso', 'time')}

          {/* Valores */}
          <FSep label="Valores" />
          {fn('Base Cálc. ICMS',    'baseCalcIcms')}
          {fn('Valor ICMS',         'valorIcms')}
          {fn('Base ICMS Sub.',     'baseCalcIcmsSub')}
          {fn('Valor ICMS Sub.',    'valorIcmsSub')}
          {fn('Valor Frete',        'valorFrete')}
          {fn('Valor Seguro',       'valorSeguro')}
          {fn('Desconto',           'desconto')}
          {fn('Outras Despesas',    'outrasDesp')}
          {fn('Valor IPI',          'valorIpi')}

          {/* Transporte */}
          <FSep label="Transporte" />
          <FSelect label="Transportador" value={form.codTransp}
            onChange={v => setForm(p => ({ ...p, codTransp: Number(v) }))}
            opts={transps.map(t => ({ id: t.codTransp, label: t.transportador }))} />
          {ft('Frete por Conta', 'fretePorConta')}
          <FSelect label="Veículo" value={form.codVeic}
            onChange={v => setForm(p => ({ ...p, codVeic: Number(v) }))}
            opts={veics.map(v => ({ id: v.codVeic, label: v.placaVeic }))} />
          {fn('Qtde. Volumes',   'quantidade', 'number')}
          {ft('Espécie Vol.',    'especie')}
          {ft('Marca Vol.',      'marca')}
          {fn('Peso Bruto Vol.', 'pesoBruto')}
          {fn('Peso Líq. Vol.',  'pesoLiq')}

          <FTextarea label="Inf. Complementares" full
            value={form.infComp ?? ''} onChange={v => upd('infComp', v)} />
        </div>
      </Modal>

      <ConfirmDialog open={!!confirm}
        name={confirm ? `NF ${confirm.numero}/${confirm.serie}/${confirm.modelo}` : ''}
        onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}