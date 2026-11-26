import LookupModal from './LookupModal'
import { Inp } from '@/components/form'
import { colsPaises } from '@/constants/cadastros'
import { REGRAS } from '@/constants/regrasCampos'

// Consulta de Países com cadastro rápido (use com useConsultaPais).
export default function ConsultaPais({ ctrl, zIndex = 60 }) {
  const { m, paises, novoPais } = ctrl
  return (
    <LookupModal {...m.modal('pais')} title="Consulta de Países" maxWidth={680} zIndex={zIndex}
      cols={colsPaises} rows={paises} onSelect={ctrl.selecionar}
      novo={{
        cadastro: novoPais, titulo: 'Novo País', salvarLabel: 'Salvar País',
        campos: (
          <>
            <Inp label="País *" maxLength={REGRAS.pais.maxLength} value={novoPais.form.pais} onChange={v => novoPais.upd('pais', v)} placeholder="Nome do país" style={{ flex: '1 1 200px' }} />
            <Inp label="Sigla" value={novoPais.form.sigla} onChange={v => novoPais.upd('sigla', v.toUpperCase())} maxLength={REGRAS.sigla.maxLength} placeholder="BR" style={{ flex: '0 0 80px' }} />
            <Inp label="DDI" value={novoPais.form.ddi} onChange={v => novoPais.upd('ddi', v)} maxLength={REGRAS.ddi.maxLength} placeholder="+55" style={{ flex: '0 0 80px' }} />
            <Inp label="Moeda" value={novoPais.form.moeda} onChange={v => novoPais.upd('moeda', v)} maxLength={REGRAS.moeda.maxLength} placeholder="BRL" style={{ flex: '1 1 120px' }} />
          </>
        ),
      }} />
  )
}
