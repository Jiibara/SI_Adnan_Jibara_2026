import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { paisesApi } from '@/services/api'
import { PAIS_EMPTY } from '@/constants/cadastros'

// Consulta de Países com cadastro rápido.
//  aoSelecionar(pais)   chamado ao escolher um país na lista
//  aoCriar(codigo)      chamado após cadastrar um país novo
// Use com <ConsultaPais ctrl={...} />.
export default function useConsultaPais({ aoSelecionar, aoCriar }) {
  const [paises, recarregar] = useLista(paisesApi)
  const m = useModais()

  const novoPais = useCadastroRapido({
    empty: PAIS_EMPTY, api: paisesApi, idKey: 'codPais', recarregar,
    validar: p => !p.pais?.trim() ? 'Informe o país.' : null,
    sucesso: 'País cadastrado!', erro: 'Erro ao salvar país.',
    aoCriar: cod => aoCriar?.(cod),
  })

  return {
    m, paises, novoPais,
    abrir: () => { novoPais.setShow(false); m.abrir('pais') },
    aberto: m.algumAberto,
    label: cod => paises.find(p => p.codPais === cod)?.pais ?? '',
    selecionar: r => { aoSelecionar?.(r); m.fechar('pais') },
  }
}
