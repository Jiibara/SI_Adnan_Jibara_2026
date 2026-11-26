import LookupModal from '@/components/lookup/LookupModal'
import { Inp } from '@/components/form'
import { colsFormasPagamento } from '@/constants/cadastros'
import { REGRAS } from '@/constants/regrasCampos'

// Consulta de Formas de Pagamento (só as ativas), com cadastro rápido. Use com useConsultaForma.
export default function ConsultaForma({ ctrl, zIndex = 70 }) {
  const { aberto, fechar, formas, selecionar, nova } = ctrl
  return (
    <LookupModal open={aberto} onClose={fechar} title="Consulta de Formas de Pagamento" maxWidth={580} zIndex={zIndex}
      cols={colsFormasPagamento} rows={formas.filter(f => f.ativo)} onSelect={selecionar}
      novo={{
        cadastro: nova, titulo: 'Nova Forma', salvarLabel: 'Salvar Forma',
        campos: <Inp label="Forma *" maxLength={REGRAS.formaPagamento.maxLength} value={nova.form.formaPagamento}
          onChange={v => nova.upd('formaPagamento', v)} style={{ flex: '1 1 200px' }} />,
      }} />
  )
}
