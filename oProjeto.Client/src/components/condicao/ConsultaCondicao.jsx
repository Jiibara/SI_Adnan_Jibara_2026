import { BtnPrimary, BtnSecondary, BtnNovo, BadgeModo } from '@/components/form'
import LookupTable from '@/components/lookup/LookupTable'
import ConfirmFechar from '@/components/lookup/ConfirmFechar'
import { Overlay, ModalBox, ModalHeader } from '@/components/lookup/ModalBase'
import { colsCondicoesParcelas } from '@/constants/cadastros'
import { MONO, COR_BORDA } from '@/styles/formStyles'
import CondicaoCampos from './CondicaoCampos'
import ConsultaForma from './ConsultaForma'

// Modal de consulta/cadastro de Condição de Pagamento. Use com useConsultaCondicao.
export default function ConsultaCondicao({ ctrl: c, zIndex = 60 }) {
  const editando = c.modo === 'editar'
  const comFormulario = c.modo !== 'lista'

  return (
    <>
      {c.aberto && (
        <Overlay onClose={c.guard.attemptClose} zIndex={zIndex}>
          <ModalBox maxWidth={860}>
            <ModalHeader
              title={editando ? 'Editar Condição de Pagamento' : 'Consulta / Nova Condição'}
              onClose={c.guard.attemptClose}
              badge={editando ? <BadgeModo editing /> : (c.modo === 'lista' && <BtnNovo onClick={c.novo} label="Nova Condição" />)}
            />

            {comFormulario && (
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COR_BORDA}`, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: editando ? 1 : undefined }}>
                <CondicaoCampos ctrl={c.ctrl} formas={c.forma.formas} onEscolherForma={c.forma.abrir} mostrarCodigo={editando} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <BtnSecondary onClick={c.voltarParaLista}>Cancelar</BtnSecondary>
                  <BtnPrimary onClick={c.salvar} disabled={c.salvando}>
                    {c.salvando ? 'Salvando...' : editando ? 'Salvar Condição' : 'Salvar Nova Condição'}
                  </BtnPrimary>
                </div>
              </div>
            )}

            {!editando && (
              <>
                <div style={{ padding: '12px 24px 0' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: MONO }}>
                    Condições Cadastradas
                  </span>
                </div>
                <LookupTable cols={colsCondicoesParcelas} rows={c.condicoes} onSelect={c.selecionar} onEdit={c.editar} />
              </>
            )}
          </ModalBox>
        </Overlay>
      )}

      <ConfirmFechar guard={c.guard} />
      <ConsultaForma ctrl={c.forma} zIndex={zIndex + 10} />
    </>
  )
}
