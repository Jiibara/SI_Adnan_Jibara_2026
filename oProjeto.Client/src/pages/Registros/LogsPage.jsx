import { useEffect, useState } from 'react'
import { logsApi } from '@/services/api'
import { PageHeader } from '@/components/UI'

const acaoCor = {
  CRIOU:   { background:'#dcfce7', color:'#15803d' },
  EDITOU:  { background:'#dbeafe', color:'#1d4ed8' },
  EXCLUIU: { background:'#fee2e2', color:'#dc2626' },
}

const sel = {
  height:36, border:'1px solid #e2e6ed', borderRadius:8, padding:'0 12px',
  fontSize:13, fontFamily:'Outfit, sans-serif', background:'#f8f9fb', color:'#0f172a', outline:'none',
}

export default function LogsPage() {
  const [logs, setLogs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [filtroEntidade, setFE]       = useState('')
  const [filtroAcao, setFA]           = useState('')

  useEffect(() => {
    logsApi.getAll().then(setLogs).finally(() => setLoading(false))
  }, [])

  const entidades = [...new Set(logs.map(l => l.entidade))].sort()
  const acoes     = [...new Set(logs.map(l => l.acao))].sort()

  const filtered = logs.filter(l =>
    (!filtroEntidade || l.entidade === filtroEntidade) &&
    (!filtroAcao     || l.acao     === filtroAcao)
  )

  return (
    <div>
      <PageHeader title="Logs" sub="Histórico de operações" />

      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <select value={filtroEntidade} onChange={e => setFE(e.target.value)} style={sel}>
          <option value="">Todas as entidades</option>
          {entidades.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        <select value={filtroAcao} onChange={e => setFA(e.target.value)} style={sel}>
          <option value="">Todas as ações</option>
          {acoes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {(filtroEntidade || filtroAcao) && (
          <button onClick={() => { setFE(''); setFA('') }}
            style={{ height:36, padding:'0 14px', border:'1px solid #e2e6ed', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, color:'#475569' }}>
            Limpar
          </button>
        )}

        <span style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8', fontFamily:'JetBrains Mono, monospace' }}>
          {filtered.length} registro(s)
        </span>
      </div>

      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
        {loading
          ? <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:200 }}>
              <div style={{ width:36, height:36, border:'3px solid #e2e6ed', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            </div>
          : <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
                  {['Data/Hora','Entidade','Ação','Descrição'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'1.2px', color:'#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={4} style={{ padding:'48px 20px', textAlign:'center', color:'#94a3b8' }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                      <div>Nenhum log encontrado.</div>
                    </td></tr>
                  : filtered.map(log => (
                    <tr key={log.codLog} style={{ borderBottom:'1px solid #f1f4f8' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f8f9fb'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'11px 14px', color:'#94a3b8', fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap' }}>
                        {new Date(log.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td style={{ padding:'11px 14px', color:'#0f172a' }}>{log.entidade}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', padding:'2px 8px', borderRadius:100, fontWeight:600, ...(acaoCor[log.acao] ?? { background:'#f1f5f9', color:'#475569' }) }}>
                          {log.acao}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px', color:'#475569' }}>{log.descricao}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}