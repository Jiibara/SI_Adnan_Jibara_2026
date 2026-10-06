import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/paises', label: 'Países' },
  { to: '/estados', label: 'Estados' },
  { to: '/cidades', label: 'Cidades' },

  { to: '/fornecedores', label: 'Fornecedores' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/transportadores', label: 'Transportadores' },
  { to: '/veiculos', label: 'Veículos' },

  { to: '/funcionarios', label: 'Funcionários' },
  { to: '/funcoes', label: 'Funções' },

  { to: '/produtos', label: 'Produtos' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/marcas', label: 'Marcas' },
  { to: '/compras', label: 'Compras' },

  { to: '/nfe', label: 'NFe' },
  { to: '/notasentrada', label: ' Nota de Entrada'},
  { to: '/contasPagar', label: 'Contas a Pagar'},
  { to: 'notassaida', label:'Notas de Saida'},
  { to: 'contasReceber', label:'Contas a Receber'},

  { to: '/formapagamento', label: 'Forma de Pagamento' },
  { to: '/condicaoPagamentos', label: 'Condição de Pagamento' },
  //{ to: '/Compras', label: 'Compra'},
  { to: 'movimentosEstoque', label: 'Estoque' },

  { to: '/logs', label: 'Registros' },
]

const styles = {
  aside: {
    width: 170,
    background: '#fff',
    borderRight: '1px solid #e2e6ed',
    position: 'fixed',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    zIndex: 40,
  },
  logo: {
    padding: '24px 20px 18px',
    borderBottom: '1px solid #e2e6ed',
  },
  logoTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 22,
    fontWeight: 800,
    color: '#2563eb',
    letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'JetBrains Mono, monospace',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #e2e6ed',
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'JetBrains Mono, monospace',
    marginTop: 'auto',
  },
}

export default function Sidebar() {
  return (
    <aside style={styles.aside}>
      <div style={styles.logo}>
        <div style={styles.logoTitle}>Sistema</div>
        <div style={styles.logoSub}></div>
      </div>

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all .15s',
              borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
              color: isActive ? '#2563eb' : '#475569',
              background: isActive ? '#dbeafe' : 'transparent',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}></div>
    </aside>
  )
}