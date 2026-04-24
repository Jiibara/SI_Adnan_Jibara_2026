import { useState } from 'react'

export default function DataTable({ columns, data, onEdit, onDelete, loading }) {
  const [search, setSearch] = useState('')

  const filtered = (data || []).filter(row =>
    Object.values(row).some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:200 }}>
      <div style={{
        width: 36, height: 36, border: '3px solid #e2e6ed',
        borderTopColor: '#2563eb', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
      {/* search bar */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e6ed', display:'flex', alignItems:'center', gap:12 }}>
        <input
          style={{
            flex:1, maxWidth:300, background:'#f8f9fb', border:'1px solid #e2e6ed',
            borderRadius:8, padding:'7px 12px', fontSize:13, color:'#0f172a',
            outline:'none', fontFamily:'Outfit, sans-serif',
          }}
          placeholder="Pesquisar"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8', fontFamily:'JetBrains Mono, monospace' }}>
          {filtered.length} registro(s)
        </span>
      </div>

      {/* table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
              {columns.map(c => (
                <th key={c.key} style={{
                  padding:'10px 14px', textAlign:'left', fontSize:11,
                  fontWeight:600, textTransform:'uppercase', letterSpacing:'1.2px', color:'#94a3b8',
                }}>{c.label}</th>
              ))}
              <th style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1.2px', color:'#94a3b8' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding:'48px 20px', textAlign:'center', color:'#94a3b8' }}>
                    <div style={{ fontSize:32, marginBottom:8 }}></div>
                    <div>Nenhum registro encontrado.</div>
                  </td>
                </tr>
              )
              : filtered.map((row, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #f1f4f8', transition:'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f8f9fb'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {columns.map(c => (
                    <td key={c.key} style={{
                      padding:'11px 14px', color:'#0f172a', fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'inherit',
                      maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {c.render ? c.render(row) : String(row[c.key] ?? '')}
                    </td>
                  ))}
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      <button onClick={() => onEdit(row)} style={{
                        padding:'4px 10px', border:'1px solid #e2e6ed', borderRadius:6,
                        background:'transparent', cursor:'pointer', fontSize:12, color:'#475569',
                        transition:'all .15s',
                      }}
                        onMouseEnter={e => { e.target.style.borderColor='#2563eb'; e.target.style.color='#2563eb'; e.target.style.background='#dbeafe' }}
                        onMouseLeave={e => { e.target.style.borderColor='#e2e6ed'; e.target.style.color='#475569'; e.target.style.background='transparent' }}>
                         Editar
                      </button>
                      <button onClick={() => onDelete(row)} style={{
                        padding:'4px 10px', border:'1px solid #e2e6ed', borderRadius:6,
                        background:'transparent', cursor:'pointer', fontSize:12, color:'#475569',
                        transition:'all .15s',
                      }}
                        onMouseEnter={e => { e.target.style.borderColor='#dc2626'; e.target.style.color='#dc2626'; e.target.style.background='#fee2e2' }}
                        onMouseLeave={e => { e.target.style.borderColor='#e2e6ed'; e.target.style.color='#475569'; e.target.style.background='transparent' }}>
                         Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
