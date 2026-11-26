import LookupModal from './LookupModal'
import { Inp, LookupField } from '@/components/form'
import { colsEstados, colsPaises } from '@/constants/cadastros'
import { REGRAS } from '@/constants/regrasCampos'

// Modais Estado -> País (use com useConsultaEstado).
export default function ConsultaEstado({ ctrl, zIndex = 60 }) {
  const { m, estados, paises, novoEstado, novoPais } = ctrl
  const paisLabel = paises.find(p => p.codPais === novoEstado.form.codPais)?.pais ?? ''

  return (
    <>
      <LookupModal {...m.modal('estado')} title="Consulta de Estados" maxWidth={640} zIndex={zIndex}
        cols={colsEstados} rows={estados} onSelect={ctrl.selecionar}
        paused={m.isOpen('pais')}
        novo={{
          cadastro: novoEstado, titulo: 'Novo Estado', salvarLabel: 'Salvar Estado',
          campos: (
            <>
              <Inp label="Estado *" maxLength={REGRAS.estado.maxLength} value={novoEstado.form.estado} onChange={v => novoEstado.upd('estado', v)} placeholder="Nome do estado" style={{ flex: '1 1 200px' }} />
              <Inp label="UF *" value={novoEstado.form.uf} onChange={v => novoEstado.upd('uf', v.toUpperCase())} maxLength={REGRAS.uf.maxLength} placeholder="SP" style={{ flex: '0 0 72px' }} />
              <LookupField label="País *" value={paisLabel} onSearch={() => { novoPais.setShow(false); m.abrir('pais') }} />
            </>
          ),
        }} />

      <LookupModal {...m.modal('pais')} title="Consulta de Países" maxWidth={640} zIndex={zIndex + 10}
        cols={colsPaises} rows={paises}
        onSelect={r => { novoEstado.upd('codPais', r.codPais); m.fechar('pais') }}
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
    </>
  )
}
