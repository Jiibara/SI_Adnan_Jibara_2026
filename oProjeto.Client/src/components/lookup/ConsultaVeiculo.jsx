import LookupModal from './LookupModal'
import ConsultaEstado from './ConsultaEstado'
import ConsultaMarca from './ConsultaMarca'
import { Inp, LookupField } from '@/components/form'
import { colsVeiculos } from '@/constants/cadastros'
import { REGRAS } from '@/constants/regrasCampos'

// Consulta de Veículos com cadastro rápido (use com useConsultaVeiculo).
export default function ConsultaVeiculo({ ctrl, zIndex = 60 }) {
  const { m, veiculos, novoVeiculo: nv, estado, marca } = ctrl
  return (
    <>
      <LookupModal {...m.modal('veiculo')} title="Consulta de Veículos" maxWidth={760} zIndex={zIndex}
        cols={colsVeiculos} rows={veiculos} onSelect={ctrl.selecionar}
        paused={estado.aberto || marca.aberto}
        novo={{
          cadastro: nv, titulo: 'Novo Veículo', salvarLabel: 'Salvar Veículo',
          campos: (
            <>
              <Inp label="Placa *" value={nv.form.placaVeic} onChange={v => nv.upd('placaVeic', v.toUpperCase())} maxLength={REGRAS.placaVeic.maxLength} style={{ flex: '0 0 110px' }} />
              <Inp label="Placa Mercosul" value={nv.form.placaMercoSul} onChange={v => nv.upd('placaMercoSul', v.toUpperCase())} maxLength={REGRAS.placaMercoSul.maxLength} style={{ flex: '0 0 130px' }} />
              <Inp label="Modelo" value={nv.form.modelo} onChange={v => nv.upd('modelo', v)} maxLength={REGRAS.modeloVeiculo.maxLength} style={{ flex: '1 1 160px' }} />
              <Inp label="ANTT" value={nv.form.codANTT} onChange={v => nv.upd('codANTT', v)} maxLength={REGRAS.codANTT.maxLength} style={{ flex: '1 1 130px' }} />
              <LookupField label="Estado *" value={estado.label(nv.form.codEstado)} onSearch={estado.abrir} />
              <LookupField label="Marca" value={marca.label(nv.form.codMarca)} onSearch={marca.abrir} />
            </>
          ),
        }} />
      <ConsultaEstado ctrl={estado} zIndex={zIndex + 10} />
      <ConsultaMarca ctrl={marca} zIndex={zIndex + 10} />
    </>
  )
}
