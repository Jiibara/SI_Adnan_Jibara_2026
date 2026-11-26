import LookupModal from './LookupModal'
import { Inp } from '@/components/form'
import { colsFuncoes } from '@/constants/cadastros'
import { REGRAS } from '@/constants/regrasCampos'

// Consulta de Funções/Cargos com cadastro rápido (use com useConsultaFuncao).
export default function ConsultaFuncao({ ctrl, zIndex = 60 }) {
  const { m, funcoes, novaFuncao } = ctrl
  return (
    <LookupModal {...m.modal('funcao')} title="Consulta de Funções" maxWidth={600} zIndex={zIndex}
      cols={colsFuncoes} rows={funcoes} onSelect={ctrl.selecionar}
      novo={{
        cadastro: novaFuncao, titulo: 'Nova Função', salvarLabel: 'Salvar Função',
        campos: <Inp label="Função *" maxLength={REGRAS.funcao.maxLength} value={novaFuncao.form.funcao} onChange={v => novaFuncao.upd('funcao', v)} style={{ flex: '1 1 260px' }} />,
      }} />
  )
}
