import { lazy } from 'react'
import { NavLink } from 'react-router-dom'

const nav = [
  { group: 'Localização', items: [
      { to: '/paises', label: 'Países' },
      { to: '/estados', label: 'Estados' },
      { to: '/cidades', label: 'Cidades' }, 
  ]},
  { group: 'Parceiros', items: [
    { to: '/fornecedores', label: 'Fornecedores' }, 
    { to: '/clientes', label: 'Clientes'}, 
    { to: '/transportadores', label: 'Transportadores' }, 
    { to: '/veiculos', label: 'Veículos' }, 
  ]},
  { group: 'Funcionarios', items: [
     { to: '/funcionarios', label: 'Funcionarios'},
     { to: '/funcoes', label: 'Funções'},
  ]},
  { group: 'Produtos', items: [
     { to: '/produtos', label: 'Produtos' }, 
     { to: '/categorias', label: 'Categorias'},
     { to: '/marcas', label: 'Marcas'},
  ]},
 // { group: 'Notas Fiscais', items: [
    // { to: '/nfe', label: 'NFe' },
  //]},
  { group: 'Financeiro', items: [
    //{ to: '/contaspagar', label: 'Contas a Pagar' },
    { to: '/formapagamento', label: 'Forma de Pagamento' },
    { to: '/condicaoPagamentos', label: 'Condição de Pagamento'},
  ]},
    { group: 'Registro', items: [
    { to: '/logs', label: 'Registros' },
  ]},
]

const styles = {
  aside: {
    width: 170, background: '#fff', borderRight: '1px solid #e2e6ed',
    position: 'fixed', height: '100vh', display: 'flex',
    flexDirection: 'column', overflowY: 'auto', zIndex: 40,
  },
  logo: {
    padding: '24px 20px 18px', borderBottom: '1px solid #e2e6ed',
  },
  logoTitle: {
    fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800,
    color: '#2563eb', letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace',
    marginTop: 2, textTransform: 'uppercase', letterSpacing: '1.5px',
  },
  groupLabel: {
    fontSize: 10, color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: '2px', padding: '12px 20px 4px',
    fontFamily: 'JetBrains Mono, monospace',
  },
  footer: {
    padding: '16px 20px', borderTop: '1px solid #e2e6ed',
    fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace',
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

      <nav style={{ flex: 1, paddingBottom: 8 }}>
        {nav.map(g => (
          <div key={g.group}>
            <div style={styles.groupLabel}>{g.group}</div>
            {g.items.map(item => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 20px', fontSize: 13, fontWeight: 500,
                textDecoration: 'none', transition: 'all .15s',
                borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                color: isActive ? '#2563eb' : '#475569',
                background: isActive ? '#dbeafe' : 'transparent',
              })}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={styles.footer}></div>
    </aside>
  )
}
