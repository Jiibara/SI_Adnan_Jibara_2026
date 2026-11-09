import { useModalGuard } from '@/hooks/useModalGuard'
import { BtnNovo, SaveRow, CheckAtivo, InlineForm } from '@/components/form'
import LookupTable from './LookupTable'
import ConfirmFechar from './ConfirmFechar'
import { Overlay, ModalBox, ModalHeader } from './ModalBase'

// Modal de consulta ("Pesquisar"), com cadastro rápido opcional.
//
//  open, onClose        controle de abertura (use useModais().modal('chave'))
//  title, maxWidth, zIndex
//  cols, rows, onSelect tabela e ação ao selecionar
//  subheader            conteúdo extra entre o cabeçalho e a tabela
//  emptyText            mensagem quando não há linhas (senão mostra a tabela vazia)
//  paused               true enquanto outro modal aberto por cima deve receber as teclas
//  novo                 habilita "+ Novo ...":
//     { cadastro: useCadastroRapido(...), titulo, salvarLabel, campos: <campos do formulário>,
//       depoisAtivo?: <conteúdo extra entre o checkbox "Ativo" e os botões> }
//     O checkbox "Ativo" e os botões Cancelar/Salvar já são incluídos aqui.
export default function LookupModal({
  open, onClose, title, maxWidth = 640, zIndex = 60,
  cols, rows, onSelect, subheader, emptyText, paused = false, novo,
}) {
  const cad = novo?.cadastro

  // Com cadastro rápido, fechar com dados digitados pede confirmação.
  const guard = useModalGuard({
    isOpen: open && !!cad,
    isDirty: !!cad?.isDirty,
    onClose: () => { cad?.cancelar(); onClose() },
    onSave: cad?.show ? cad.salvar : undefined,
    paused,
  })
  const fechar = cad ? guard.attemptClose : onClose

  return (
    <>
      {open && (
        <Overlay onClose={fechar} zIndex={zIndex}>
          <ModalBox maxWidth={maxWidth}>
            <ModalHeader title={title} onClose={fechar}
              badge={cad && !cad.show && <BtnNovo onClick={() => cad.setShow(true)} label={novo.titulo} />} />

            {cad?.show && (
              <InlineForm title={novo.titulo}>
                {novo.campos}
                <CheckAtivo checked={cad.form.ativo} onChange={v => cad.upd('ativo', v)} />
                {novo.depoisAtivo}
                <SaveRow onCancel={cad.cancelar} onSave={cad.salvar} saving={cad.saving} label={novo.salvarLabel} />
              </InlineForm>
            )}

            {subheader}

            {emptyText && rows.length === 0
              ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>{emptyText}</div>
              : <LookupTable cols={cols} rows={rows} onSelect={onSelect} />}
          </ModalBox>
        </Overlay>
      )}
      {cad && <ConfirmFechar guard={guard} />}
    </>
  )
}
