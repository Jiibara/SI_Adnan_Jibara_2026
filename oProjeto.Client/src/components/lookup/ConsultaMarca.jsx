import LookupModal from './LookupModal'
import { Inp } from '@/components/form'
import { colsMarcas } from '@/constants/cadastros'
import { REGRAS } from '@/constants/regrasCampos'

// Consulta de Marcas com cadastro rápido (use com useConsultaMarca).
export default function ConsultaMarca({ ctrl, zIndex = 60 }) {
  const { m, marcas, novaMarca } = ctrl
  return (
    <LookupModal {...m.modal('marca')} title="Consulta de Marcas" maxWidth={480} zIndex={zIndex}
      cols={colsMarcas} rows={marcas} onSelect={ctrl.selecionar}
      novo={{
        cadastro: novaMarca, titulo: 'Nova Marca', salvarLabel: 'Salvar Marca',
        campos: <Inp label="Marca *" maxLength={REGRAS.marca.maxLength} value={novaMarca.form.marca} onChange={v => novaMarca.upd('marca', v)} style={{ flex: '1 1 200px' }} />,
      }} />
  )
}
