import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { cidadesApi, estadosApi, paisesApi } from '@/services/api'
import { CIDADE_EMPTY, ESTADO_EMPTY, PAIS_EMPTY } from '@/constants/cadastros'

// Cadeia de consultas Cidade -> Estado -> País, cada uma com cadastro rápido.
//  aoSelecionarCidade(cidade)  chamado ao escolher uma cidade na lista
//  aoCriarCidade(codigo)       chamado após cadastrar uma cidade nova
// Use com <ConsultaEndereco ctrl={...} />.
export default function useConsultaEndereco({ aoSelecionarCidade, aoCriarCidade }) {
  const [cidades, loadCidades] = useLista(cidadesApi)
  const [estados, loadEstados] = useLista(estadosApi)
  const [paises, loadPaises] = useLista(paisesApi)
  const m = useModais()

  const novaCidade = useCadastroRapido({
    empty: CIDADE_EMPTY, api: cidadesApi, idKey: 'codCidade', recarregar: loadCidades,
    validar: c => !c.cidade?.trim() ? 'Informe a cidade.' : null,
    sucesso: 'Cidade cadastrada!', erro: 'Erro ao salvar cidade.',
    aoCriar: cod => aoCriarCidade?.(cod),
  })
  const novoEstado = useCadastroRapido({
    empty: ESTADO_EMPTY, api: estadosApi, idKey: 'codEstado', recarregar: loadEstados,
    validar: e => !e.estado?.trim() ? 'Informe o estado.' : null,
    sucesso: 'Estado cadastrado!', erro: 'Erro ao salvar estado.',
    aoCriar: cod => novaCidade.upd('codEstado', cod),
  })
  const novoPais = useCadastroRapido({
    empty: PAIS_EMPTY, api: paisesApi, idKey: 'codPais', recarregar: loadPaises,
    validar: p => !p.pais?.trim() ? 'Informe o país.' : null,
    sucesso: 'País cadastrado!', erro: 'Erro ao salvar país.',
    aoCriar: cod => novoEstado.upd('codPais', cod),
  })

  return {
    m, cidades, estados, paises, novaCidade, novoEstado, novoPais,
    abrir: () => { novaCidade.setShow(false); m.abrir('cidade') },
    cidadeAberta: m.isOpen('cidade'),
    aberto: m.algumAberto,
    cidadeLabel: cod => cidades.find(c => c.codCidade === cod)?.cidade ?? '',
    selecionarCidade: r => { aoSelecionarCidade?.(r); m.fechar('cidade') },
  }
}
