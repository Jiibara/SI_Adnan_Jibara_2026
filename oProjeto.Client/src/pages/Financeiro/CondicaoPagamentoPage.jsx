import { useState } from 'react'
import toast from 'react-hot-toast'
import useCrud from '@/hooks/useCrud'
import useCondicaoForm from '@/hooks/useCondicaoForm'
import useConsultaForma from '@/hooks/useConsultaForma'
import { useModalGuard } from '@/hooks/useModalGuard'
import DataTable from '@/components/DataTable'
import { ConfirmDialog, PageHeader } from '@/components/UI'
import { BtnPrimary, BtnSecondary, BadgeModo } from '@/components/form'
import ConfirmFechar from '@/components/lookup/ConfirmFechar'
import { Overlay, ModalBox, ModalHeader } from '@/components/lookup/ModalBase'
import CondicaoCampos from '@/components/condicao/CondicaoCampos'
import ConsultaForma from '@/components/condicao/ConsultaForma'
import { condicoesApi } from '@/services/api'

const cols = [
  { key: 'codCondicao', label: 'Cód.', mono: true },
  { key: 'condicaoPagamento', label: 'Condição de Pagamento' },
  { key: 'numeroParcelas', label: 'Parcelas' },
  { key: 'percentualDesconto', label: 'Desconto %' },
  { key: 'percentualMultas', label: 'Multa %' },
  { key: 'percentualJuros', label: 'Juros %' },
  { key: 'ativo', label: 'Ativo', render: r => r.ativo ? 'Sim' : 'Não' },
]

export default function CondicoesPagamentoPage() {
  const { data, loading, load } = useCrud(condicoesApi)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const ctrl = useCondicaoForm()
  const forma = useConsultaForma({ aoEscolher: (i, cod) => ctrl.updParcela(i, 'codFormaPagamento', cod) })

  const save = async () => {
    const msg = ctrl.erro()
    if (msg) return toast.error(msg)
    try {
      editing ? await condicoesApi.update(ctrl.form.codCondicao, ctrl.payload()) : await condicoesApi.create(ctrl.payload())
      toast.success('Salvo!'); setOpen(false); load()
    } catch { toast.error('Erro ao salvar.') }
  }

  const del = async () => {
    try { await condicoesApi.delete(confirm.codCondicao); toast.success('Excluído.'); setConfirm(null); load() }
    catch { toast.error('Erro.') }
  }

  const openModal = async (r = null) => {
    try { await forma.recarregar() } catch { toast.error('Erro ao carregar formas de pagamento.') }
    ctrl.carregar(r)
    setEditing(!!r)
    setOpen(true)
  }

  const guard = useModalGuard({
    isOpen: open,
    isDirty: ctrl.isDirty,
    onClose: () => setOpen(false),
    onSave: save,
    paused: forma.aberto,
  })

  return (
    <div>
      <PageHeader title="Condições de Pagamento" sub="Consulta de condições de pagamento" label="Nova Condição"
        onNew={() => openModal()} />

      <DataTable columns={cols} data={data} loading={loading}
        onEdit={r => openModal(r)} onDelete={r => setConfirm(r)} />

      {open && (
        <Overlay onClose={guard.attemptClose}>
          <ModalBox maxWidth={860}>
            <ModalHeader inline
              title={editing ? 'Editar Condição de Pagamento' : 'Nova Condição de Pagamento'}
              onClose={guard.attemptClose}
              badge={<BadgeModo editing={editing} />}
            />

            <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
              <CondicaoCampos ctrl={ctrl} formas={forma.formas} onEscolherForma={forma.abrir} mostrarCodigo />
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e6ed', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <BtnSecondary onClick={guard.attemptClose}>Cancelar</BtnSecondary>
              <BtnPrimary onClick={save}>Salvar</BtnPrimary>
            </div>
          </ModalBox>
        </Overlay>
      )}

      <ConfirmFechar guard={guard} />
      <ConsultaForma ctrl={forma} />

      <ConfirmDialog open={!!confirm} name={confirm?.condicaoPagamento} onClose={() => setConfirm(null)} onConfirm={del} />
    </div>
  )
}
