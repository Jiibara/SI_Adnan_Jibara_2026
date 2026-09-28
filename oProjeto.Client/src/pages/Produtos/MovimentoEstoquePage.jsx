import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DataTable from '@/components/DataTable'
import { PageHeader } from '@/components/UI'
import { produtosApi, movimentoApi } from '@/services/api'

const lbl = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: 5 }
const inp = { background: '#f8f9fb', border: '1px solid #e2e6ed', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }
const fo = e => e.target.style.borderColor = '#2563eb'
const bl = e => e.target.style.borderColor = '#e2e6ed'
const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#94a3b8' }
const tdStyle = { padding: '11px 14px', color: '#0f172a' }

const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const number = value => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

const formatDate = value => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}

export default function MovimentoEstoquePage() {
  const [movimentos, setMovimentos] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [produtoFiltro, setProdutoFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarProdutos()
    carregarMovimentos()
  }, [])

  const carregarProdutos = async () => {
    try {
      const data = await produtosApi.getAll()
      setProdutos(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar produtos')
    }
  }

  const carregarMovimentos = async () => {
    setLoading(true)
    try {
      const data = await movimentoApi.getAll()
      setMovimentos(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar movimentos')
      setMovimentos([])
    } finally {
      setLoading(false)
    }
  }

  const filtrarProduto = async value => {
    setProdutoFiltro(value)

    if (!value) {
      await carregarMovimentos()
      return
    }

    setLoading(true)
    try {
      const data = await movimentoApi.getByProduto(value)
      setMovimentos(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar movimentos do produto')
      setMovimentos([])
    } finally {
      setLoading(false)
    }
  }

  const movimentosFiltrados = movimentos.filter(item => {
    const tipo = String(item.tipo || '').toUpperCase()
    const texto = busca.toLowerCase()

    const correspondeTipo = !tipoFiltro || tipo === tipoFiltro

    const correspondeBusca =
      !texto ||
      String(item.numero || '').toLowerCase().includes(texto) ||
      String(item.serie || '').toLowerCase().includes(texto) ||
      String(item.modelo || '').toLowerCase().includes(texto) ||
      String(item.codParceiro || '').toLowerCase().includes(texto) ||
      String(item.codProd || '').toLowerCase().includes(texto) ||
      String(item.produto?.produto || '').toLowerCase().includes(texto)

    return correspondeTipo && correspondeBusca
  })

  const totalEntradas = movimentosFiltrados
    .filter(item => String(item.tipo || '').toUpperCase() === 'ENTRADA')
    .reduce((total, item) => total + Number(item.quantidade || 0), 0)

  const totalSaidas = movimentosFiltrados
    .filter(item => String(item.tipo || '').toUpperCase() === 'SAIDA')
    .reduce((total, item) => total + Number(item.quantidade || 0), 0)

  const renderTipo = tipo => {
    const entrada = String(tipo || '').toUpperCase() === 'ENTRADA'

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 9px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '.8px',
        background: entrada ? '#dcfce7' : '#fee2e2',
        color: entrada ? '#166534' : '#991b1b'
      }}>
        {entrada ? 'ENTRADA' : 'SAÍDA'}
      </span>
    )
  }

  return (
    <div>
      <PageHeader title="Movimento de Estoque" subtitle="Histórico de entradas e saídas de produtos" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 14,
        marginBottom: 20
      }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e2e6ed',
          borderRadius: 10,
          padding: '16px 18px'
        }}>
          <div style={lbl}>Entradas</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#166534', fontFamily: 'Outfit, sans-serif' }}>
            {number(totalEntradas)}
          </div>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #e2e6ed',
          borderRadius: 10,
          padding: '16px 18px'
        }}>
          <div style={lbl}>Saídas</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#991b1b', fontFamily: 'Outfit, sans-serif' }}>
            {number(totalSaidas)}
          </div>
        </div>

        <div style={{
          background: '#fff',
          border: '1px solid #e2e6ed',
          borderRadius: 10,
          padding: '16px 18px'
        }}>
          <div style={lbl}>Movimentos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {movimentosFiltrados.length}
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e2e6ed',
        borderRadius: 10,
        padding: 18,
        marginBottom: 18
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 160px 1fr',
          gap: 14,
          alignItems: 'end'
        }}>
          <div>
            <label style={lbl}>Produto</label>
            <select
              value={produtoFiltro}
              onChange={e => filtrarProduto(e.target.value)}
              onFocus={fo}
              onBlur={bl}
              style={inp}
            >
              <option value="">Todos os produtos</option>
              {produtos.map(item => (
                <option key={item.codProd} value={item.codProd}>
                  {item.codProd} - {item.produto}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={lbl}>Tipo</label>
            <select
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
              onFocus={fo}
              onBlur={bl}
              style={inp}
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
          </div>

          <div>
            <label style={lbl}>Pesquisar</label>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onFocus={fo}
              onBlur={bl}
              placeholder="Número da nota, produto, código..."
              style={inp}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'tipo',
            label: 'Tipo',
            render: item => renderTipo(item.tipo)
          },
          {
            key: 'dataMovimento',
            label: 'Data',
            render: item => formatDate(item.dataMovimento)
          },
          {
            key: 'numero',
            label: 'Nota',
            render: item => `${item.numero}/${item.serie}`
          },
          {
            key: 'codProd',
            label: 'Produto',
            render: item => (
              <div>
                <div style={{ fontWeight: 600 }}>{item.produto?.produto || `Produto ${item.codProd}`}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Cód. {item.codProd}</div>
              </div>
            )
          },
          {
            key: 'quantidade',
            label: 'Quantidade',
            render: item => number(item.quantidade)
          },
          {
            key: 'custoUnitario',
            label: 'Custo unit.',
            render: item => money(item.custoUnitario)
          },
          {
            key: 'valorTotal',
            label: 'Valor total',
            render: item => money(item.valorTotal)
          },
          {
            key: 'saldoPosterior',
            label: 'Saldo',
            render: item => (
              <span style={{ fontWeight: 600 }}>
                {number(item.saldoPosterior)}
              </span>
            )
          }
        ]}
        data={movimentosFiltrados}
        loading={loading}
        emptyMessage="Nenhum movimento de estoque encontrado"
      />

      {!loading && movimentosFiltrados.length > 0 && (
        <div style={{
          marginTop: 10,
          fontSize: 11,
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          {movimentosFiltrados.length} movimento(s) encontrado(s)
        </div>
      )}
    </div>
  )
}