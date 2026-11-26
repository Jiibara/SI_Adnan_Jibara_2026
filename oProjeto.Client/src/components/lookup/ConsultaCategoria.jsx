import LookupModal from './LookupModal'
import { Inp } from '@/components/form'
import { colsCategorias } from '@/constants/cadastros'
import { REGRAS } from '@/constants/regrasCampos'

// Consulta de Categorias com cadastro rápido (use com useConsultaCategoria).
export default function ConsultaCategoria({ ctrl, zIndex = 60 }) {
  const { m, categorias, novaCategoria } = ctrl
  return (
    <LookupModal {...m.modal('categoria')} title="Consulta de Categorias" maxWidth={560} zIndex={zIndex}
      cols={colsCategorias} rows={categorias} onSelect={ctrl.selecionar}
      novo={{
        cadastro: novaCategoria, titulo: 'Nova Categoria', salvarLabel: 'Salvar Categoria',
        campos: <Inp label="Categoria *" maxLength={REGRAS.categoria.maxLength} value={novaCategoria.form.categoria} onChange={v => novaCategoria.upd('categoria', v)} style={{ flex: '1 1 240px' }} />,
      }} />
  )
}
