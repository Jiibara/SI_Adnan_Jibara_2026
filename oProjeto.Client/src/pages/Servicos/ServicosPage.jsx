import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { Modal, ConfirmDialog, PageHeader, FField } from '@/components/UI'
import { servicosApi } from '@/services/api'

const empty = { servico:'', preco:'', duracaoMinutos:'', ativo:true }

const toNumber = v => Number(String(v ?? '').replace(',', '.'))
const brl = v => Number(v ?? 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

export default function ServicosPage() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(empty)
  const [originalForm, setOriginalForm] = useState(empty)
  const [editing, setEditing] = useState(false)
  const [open, setOpen]       = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    try { setLoading(true); setData(await servicosApi.getAll()) }
    catch { toast.error('Erro ao carregar serviços.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    const preco   = toNumber(form.preco)
    const duracao = toNumber(form.duracaoMinutos)

    if (!form.servico?.trim())                      return toast.error('Informe o nome do serviço.')
    if (!(preco > 0))                               return toast.error('Informe um preço maior que zero.')
    if (!Number.isInteger(duracao) || duracao <= 0) return toast.error('Informe a duração em minutos (número inteiro).')

    const body = { ...form, servico: form.servico.trim(), preco, duracaoMinutos: duracao }

    try {
      editing ? await servicosApi.update(form.codServico, body) : await servicosApi.create(body)
      toast.success(editing ? 'Serviço atualizado!' : 'Serviço criado!')
      setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try {
      await servicosApi.delete(confirm.codServico)
      toast.success('Excluído.'); setConfirm(null); load()
    } catch { toast.error('Erro ao excluir. Se o serviço já foi usado, desative-o em vez de excluir.') }
  }

  const cols = [
    { key:'codServico',     label:'Cód.', mono:true },
    { key:'servico',        label:'Serviço' },
    { key:'preco',          label:'Preço',   render: r => brl(r.preco) },
    { key:'duracaoMinutos', label:'Duração', render: r => `${r.duracaoMinutos} min` },
    { key:'ativo',          label:'Ativo',   render: r => r.ativo ? 'Sim' : 'Não' },
  ]

  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  const abrirNovo = () => { setForm(empty); setOriginalForm(empty); setEditing(false); setOpen(true) }
  const abrirEdicao = (r) => {
    const f = { ...r, preco: String(r.preco ?? '').replace('.', ','), duracaoMinutos: String(r.duracaoMinutos ?? '') }
    setForm(f); setOriginalForm(f); setEditing(true); setOpen(true)
  }

  return (
    <div>
      <PageHeader title="Serviços" sub="Consulta de serviços" label="Novo Serviço" onNew={abrirNovo} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={abrirEdicao}
        onDelete={r => setConfirm(r)} />

      <Modal open={open} title={editing ? 'Editar Serviço' : 'Novo Serviço'} editing={editing}
        onClose={() => setOpen(false)} onSave={save} isDirty={isDirty}>

        <div style={{ display:'flex', gap:12, alignItems:'flex-end', marginBottom:14 }}>
          <div style={{ flex:'0 0 30px' }}>
            <FField label="Código" value={editing ? String(form.codServico ?? '') : '—'} onChange={() => {}} />
          </div>
          <div style={{ flex:'1 1 auto' }}>
            <FField label="Serviço" required value={form.servico ?? ''} onChange={v => upd('servico', v)} />
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', paddingBottom:8, whiteSpace:'nowrap', fontSize:13, fontFamily:'Outfit, sans-serif', color:'#0f172a' }}>
            <input type="checkbox" checked={form.ativo ?? true} onChange={e => upd('ativo', e.target.checked)}
              style={{ width:16, height:16, cursor:'pointer' }} />
            Ativo
          </label>
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <div style={{ flex:'0 0 140px' }}>
            <FField label="Preço (R$)" required value={String(form.preco ?? '')} onChange={v => upd('preco', v)} />
          </div>
          <div style={{ flex:'0 0 140px' }}>
            <FField label="Duração (min)" required value={String(form.duracaoMinutos ?? '')} onChange={v => upd('duracaoMinutos', v.replace(/\D/g, ''))} />
          </div>
        </div>

      </Modal>

      <ConfirmDialog open={!!confirm} name={confirm?.servico}
        onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}