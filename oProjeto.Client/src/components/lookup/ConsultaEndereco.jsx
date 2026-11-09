import LookupModal from './LookupModal'
import { Inp, LookupField } from '@/components/form'
import { colsCidades, colsEstados, colsPaises } from '@/constants/cadastros'

// Modais Cidade -> Estado -> País (use com useConsultaEndereco).
export default function ConsultaEndereco({ ctrl }) {
  const { m, cidades, estados, paises, novaCidade, novoEstado, novoPais } = ctrl
  const estadoSel = estados.find(e => e.codEstado === novaCidade.form.codEstado)
  const estadoLabel = estadoSel ? `${estadoSel.estado} - ${estadoSel.uf}` : ''
  const paisLabel = paises.find(p => p.codPais === novoEstado.form.codPais)?.pais ?? ''

  return (
    <>
      <LookupModal {...m.modal('cidade')} title="Consulta de Cidades" maxWidth={680} zIndex={70}
        cols={colsCidades} rows={cidades} onSelect={ctrl.selecionarCidade}
        paused={m.isOpen('estado')}
        novo={{
          cadastro: novaCidade, titulo: 'Nova Cidade', salvarLabel: 'Salvar Cidade',
          campos: (
            <>
              <Inp label="Cidade *" value={novaCidade.form.cidade} onChange={v => novaCidade.upd('cidade', v)} placeholder="Nome da cidade" style={{ flex: '1 1 200px' }} />
              <Inp label="DDD" value={novaCidade.form.ddd} onChange={v => novaCidade.upd('ddd', v)} maxLength={3} placeholder="11" style={{ flex: '0 0 72px' }} />
              <LookupField label="Estado *" value={estadoLabel} onSearch={() => { novoEstado.setShow(false); m.abrir('estado') }} />
            </>
          ),
        }} />

      <LookupModal {...m.modal('estado')} title="Consulta de Estados" maxWidth={680} zIndex={80}
        cols={colsEstados} rows={estados}
        onSelect={r => { novaCidade.upd('codEstado', r.codEstado); m.fechar('estado') }}
        paused={m.isOpen('pais')}
        novo={{
          cadastro: novoEstado, titulo: 'Novo Estado', salvarLabel: 'Salvar Estado',
          campos: (
            <>
              <Inp label="Estado *" value={novoEstado.form.estado} onChange={v => novoEstado.upd('estado', v)} placeholder="Nome do estado" style={{ flex: '1 1 200px' }} />
              <Inp label="UF *" value={novoEstado.form.uf} onChange={v => novoEstado.upd('uf', v.toUpperCase())} maxLength={2} placeholder="SP" style={{ flex: '0 0 72px' }} />
              <LookupField label="País *" value={paisLabel} onSearch={() => { novoPais.setShow(false); m.abrir('pais') }} />
            </>
          ),
        }} />

      <LookupModal {...m.modal('pais')} title="Consulta de Países" maxWidth={680} zIndex={90}
        cols={colsPaises} rows={paises}
        onSelect={r => { novoEstado.upd('codPais', r.codPais); m.fechar('pais') }}
        novo={{
          cadastro: novoPais, titulo: 'Novo País', salvarLabel: 'Salvar País',
          campos: (
            <>
              <Inp label="País *" value={novoPais.form.pais} onChange={v => novoPais.upd('pais', v)} placeholder="Nome do país" style={{ flex: '1 1 200px' }} />
              <Inp label="Sigla" value={novoPais.form.sigla} onChange={v => novoPais.upd('sigla', v.toUpperCase())} maxLength={3} placeholder="BR" style={{ flex: '0 0 80px' }} />
              <Inp label="DDI" value={novoPais.form.ddi} onChange={v => novoPais.upd('ddi', v)} maxLength={6} placeholder="+55" style={{ flex: '0 0 80px' }} />
              <Inp label="Moeda" value={novoPais.form.moeda} onChange={v => novoPais.upd('moeda', v)} maxLength={10} placeholder="BRL" style={{ flex: '1 1 120px' }} />
            </>
          ),
        }} />
    </>
  )
}
