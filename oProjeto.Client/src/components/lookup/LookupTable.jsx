import { thStyle, tdStyle, MONO } from '@/styles/formStyles'

// Tabela de consulta com botão "Selecionar".
// cols: [{ key, label, mono?, align?, render?(row) }]
export default function LookupTable({ cols, rows, onSelect }) {
  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e6ed', background: '#f8f9fb' }}>
              {cols.map(c => <th key={c.key} style={{ ...thStyle, ...(c.align && { textAlign: c.align }) }}>{c.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f4f8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {cols.map(c => (
                  <td key={c.key} style={{ ...tdStyle, fontFamily: c.mono ? MONO : 'inherit', ...(c.align && { textAlign: c.align }) }}>
                    {c.render ? c.render(row) : String(row[c.key] ?? '')}
                  </td>
                ))}
                <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                  <button onClick={() => onSelect(row)}
                    style={{ padding: '4px 12px', border: 'none', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    Selecionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
