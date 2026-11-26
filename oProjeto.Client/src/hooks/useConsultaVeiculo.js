import useLista from '@/hooks/useLista'
import useModais from '@/hooks/useModais'
import useCadastroRapido from '@/hooks/useCadastroRapido'
import useConsultaEstado from '@/hooks/useConsultaEstado'
import useConsultaMarca from '@/hooks/useConsultaMarca'
import { veiculosApi } from '@/services/api'
import { VEICULO_NOVO_EMPTY } from '@/constants/cadastros'
import { validarPlaca } from '@/utils/validacoes'

// Consulta de Veículos com cadastro rápido (o novo veículo tem consultas de Estado e Marca).
//  aoSelecionar(veiculo)   chamado ao escolher um veículo na lista
// Use com <ConsultaVeiculo ctrl={...} />.
export default function useConsultaVeiculo({ aoSelecionar }) {
  const [veiculos, recarregar] = useLista(veiculosApi)
  const m = useModais()

  const novoVeiculo = useCadastroRapido({
    empty: VEICULO_NOVO_EMPTY, api: veiculosApi, idKey: 'codVeic', recarregar,
    validar: v => {
      if (!v.placaVeic?.trim()) return 'Informe a placa.'
      if (!validarPlaca(v.placaVeic)) return 'Placa inválida. Use ABC1234 ou ABC1D23.'
      if (v.placaMercoSul && !validarPlaca(v.placaMercoSul)) return 'Placa Mercosul inválida.'
      return null
    },
    sucesso: 'Veículo cadastrado!', erro: 'Erro ao salvar veículo.',
  })
  const estado = useConsultaEstado({ aoSelecionar: e => novoVeiculo.upd('codEstado', e.codEstado) })
  const marca = useConsultaMarca({ aoSelecionar: x => novoVeiculo.upd('codMarca', x.codMarca) })

  return {
    m, veiculos, novoVeiculo, estado, marca,
    abrir: () => { novoVeiculo.setShow(false); m.abrir('veiculo') },
    aberto: m.algumAberto || estado.aberto || marca.aberto,
    label: cod => {
      const v = veiculos.find(x => x.codVeic === cod)
      return v ? `${v.placaVeic ?? ''} - ${v.modelo ?? ''}` : ''
    },
    selecionar: r => { aoSelecionar?.(r); m.fechar('veiculo') },
  }
}
