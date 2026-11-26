import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import { estadosApi, paisesApi } from '@/services/api'
import { ESTADO_EMPTY, PAIS_EMPTY } from '@/constants/cadastros'

// Consultas Estado -> País, cada uma com cadastro rápido.
//  aoSelecionar(estado)   chamado ao escolher um estado na lista
// Use com <ConsultaEstado ctrl={...} />.
export default function useConsultaEstado({ aoSelecionar }) {
  const [estados, loadEstados] = useLista(estadosApi)
  const [paises, loadPaises] = useLista(paisesApi)
  const m = useModais()

  const novoEstado = useCadastroRapido({
    empty: ESTADO_EMPTY, api: estadosApi, idKey: 'codEstado', recarregar: loadEstados,
    validar: e => !e.estado?.trim() ? 'Informe o estado.' : null,
    sucesso: 'Estado cadastrado!', erro: 'Erro ao salvar estado.',
  })
  const novoPais = useCadastroRapido({
    empty: PAIS_EMPTY, api: paisesApi, idKey: 'codPais', recarregar: loadPaises,
    validar: p => !p.pais?.trim() ? 'Informe o país.' : null,
    sucesso: 'País cadastrado!', erro: 'Erro ao salvar país.',
    aoCriar: cod => novoEstado.upd('codPais', cod),
  })

  return {
    m, estados, paises, novoEstado, novoPais,
    abrir: () => { novoEstado.setShow(false); m.abrir('estado') },
    aberto: m.algumAberto,
    label: cod => {
      const e = estados.find(x => x.codEstado === cod)
      return e ? `${e.estado} - ${e.uf}` : ''
    },
    selecionar: r => { aoSelecionar?.(r); m.fechar('estado') },
  }
}
