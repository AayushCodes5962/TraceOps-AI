import { useState} from 'react'
import {
  Activity, AlertTriangle, ShieldCheck, Search, Network,
  BrainCircuit, ClipboardList, RefreshCw, ArrowRight,
} from 'lucide-react'
import GraphExplorer from './GraphExplorer'
import './App.css'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', Icon: Activity },
  { id: 'graph', label: 'Graph investigation', Icon: Network },
  { id: 'analyst', label: 'AI analyst', Icon: BrainCircuit },
  { id: 'audit', label: 'Audit trail', Icon: ClipboardList },
]

export default function App() {
  const [activeSection, setActiveSection] = useState('overview')
  const [alertId, setAlertId] = useState('ALT-1001')
  const [report, setReport] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [proposal, setProposal] = useState(null)
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function readJson(response) {
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Invalid API response (HTTP ${response.status}): ${text || 'empty response'}`)
    }
    if (!response.ok) throw new Error(data.detail || `Request failed: ${response.status}`)
    return data
  }

  async function investigate(id = alertId) {
    const requestedId = id.trim()
    if (!requestedId) {
      setMessage('Enter an alert ID.')
      return
    }
    setLoading(true)
    setMessage('')
    setExplanation('')
    setProposal(null)
    try {
      const response = await fetch(`/api/investigate/${encodeURIComponent(requestedId)}`)
      const data = await readJson(response)
      setAlertId(requestedId)
      setReport(data)
    } catch (error) {
      setReport(null)
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getExplanation() {
    if (!report?.found) {
      setMessage('Investigate an alert first, then generate its explanation.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/explain/${encodeURIComponent(alertId.trim())}`)
      const data = await readJson(response)
      setExplanation(data.explanation)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getProposal() {
    if (!report?.found) {
      setMessage('Investigate an alert before preparing a response proposal.')
      return
    }
    setMessage('')
    try {
      const response = await fetch(`/api/proposal/${encodeURIComponent(alertId.trim())}`)
      setProposal(await readJson(response))
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function loadAudit() {
    try {
      const response = await fetch('/api/audit')
      const data = await readJson(response)
      setAudit(data.events || [])
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function decide(approved) {
    setMessage('')
    try {
      const response = await fetch(`/api/decision/${encodeURIComponent(alertId.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      })
      const data = await readJson(response)
      setProposal({ ...data, success: true })
      setMessage(`Decision recorded: ${data.status}`)
      await loadAudit()
    } catch (error) {
      setMessage(error.message)
    }
  }

  

  const title = {
    overview: 'Investigation Overview',
    graph: 'Graph Investigation',
    analyst: 'AI Analyst',
    audit: 'Audit Trail',
  }[activeSection]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={25} /></div>
          <div>
            <h2>TraceOps <span>AI</span></h2>
            <small>SECURITY INTELLIGENCE</small>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activeSection === id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(id)
                setMessage('')
                if (id === 'audit') loadAudit()
              }}
              aria-current={activeSection === id ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className="status-dot" /> Local environment
          <small>Response actions require human review</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">SECURITY OPERATIONS CENTER</div>
            <h1>{title}</h1>
            <p>Connect the evidence. Understand the risk. Keep humans in control.</p>
          </div>
        </header>

        {message && <div className="notice global-notice" role="status">{message}</div>}

        {activeSection === 'overview' && (
          <>
            <section className="metric-grid">
              <div className="metric-card">
                <div className="metric-icon purple"><Activity /></div>
                <span>Investigation engine</span><strong>FalkorDB</strong>
                <small>Graph-powered evidence</small>
              </div>
              <div className="metric-card">
                <div className="metric-icon red"><AlertTriangle /></div>
                <span>Current risk score</span>
                <strong>{report ? `${report.risk.score}/100` : '—'}</strong>
                <small>{report ? `${report.risk.level} RISK` : 'Run an investigation'}</small>
              </div>
              <div className="metric-card">
                <div className="metric-icon blue"><BrainCircuit /></div>
                <span>AI explanation</span><strong>{explanation ? 'Ready' : 'On demand'}</strong>
                <small>Groq-powered analysis</small>
              </div>
              <div className="metric-card">
                <div className="metric-icon green"><ClipboardList /></div>
                <span>Audit events</span><strong>{audit.length}</strong>
                <small>Recorded decisions</small>
              </div>
            </section>

            <section className="panel search-panel">
              <div className="panel-heading">
                <div>
                  <h2><Search size={19} /> Investigate an alert</h2>
                  <p>Retrieve connected graph evidence from FalkorDB.</p>
                </div>
              </div>
              <form onSubmit={(event) => { event.preventDefault(); investigate() }}>
                <input
                  value={alertId}
                  onChange={(event) => setAlertId(event.target.value)}
                  placeholder="Enter alert ID, e.g. ALT-1001"
                  aria-label="Alert ID"
                />
                <button className="primary-button" disabled={loading || !alertId.trim()}>
                  <Search size={17} /> {loading ? 'Working...' : 'Investigate'}
                </button>
              </form>
            </section>

            {report?.found ? (
              <>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <div className="eyebrow">INVESTIGATION REPORT</div>
                      <h2>{report.alert.id} · {report.alert.type}</h2>
                      <p>Severity: {report.alert.severity}</p>
                    </div>
                    <span className="risk-pill">{report.risk.level} RISK</span>
                  </div>
                  <div className="risk-score">
                    <strong>{report.risk.score}</strong><span>/100</span>
                    <div className="risk-track"><div style={{ width: `${Math.min(100, Math.max(0, report.risk.score))}%` }} /></div>
                  </div>
                  <h3>Risk factors</h3>
                  <ul className="reason-list">
                    {(report.risk.reasons || []).map((reason, index) => <li key={index}>{reason}</li>)}
                  </ul>
                  <h3>Connected evidence</h3>
                  <div className="evidence-chain">
                    <div><small>ALERT</small><strong>{report.alert.id}</strong><span>{report.alert.type}</span></div>
                    <div className="chain-arrow">→</div>
                    <div><small>USER</small><strong>{report.user?.name || report.user?.id || 'Unknown'}</strong><span>{report.user?.privileged ? 'Privileged account' : 'Standard account'}</span></div>
                    <div className="chain-arrow">→</div>
                    <div><small>DEVICE</small><strong>{report.devices?.join(', ') || 'Unknown'}</strong><span>Connected device</span></div>
                    <div className="chain-arrow">→</div>
                    <div><small>SYSTEM</small><strong>{report.systems?.join(', ') || 'Unknown'}</strong><span>Connected system</span></div>
                  </div>
                  <div className="button-row">
                    <button className="secondary-button" onClick={() => setActiveSection('graph')}><Network size={16} /> Open graph investigation <ArrowRight size={15} /></button>
                    <button className="secondary-button" onClick={() => setActiveSection('analyst')}><BrainCircuit size={16} /> Open AI analyst <ArrowRight size={15} /></button>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div><h2><ShieldCheck size={19} /> Human approval</h2><p>Review a proposed response before recording a decision.</p></div>
                  </div>
                  {!proposal ? (
                    <button className="secondary-button" onClick={getProposal}>Prepare response proposal</button>
                  ) : (
                    <div className="proposal-box">
                      <div className="eyebrow">PROPOSED ACTION</div>
                      <h3>{proposal.proposed_action}</h3>
                      <p>{proposal.reason}</p>
                      <p className="muted">Simulation only · No real security action will be executed.</p>
                      {proposal.status === 'AWAITING_HUMAN_APPROVAL' && (
                        <div className="button-row">
                          <button className="approve-button" onClick={() => decide(true)}>Approve simulation</button>
                          <button className="reject-button" onClick={() => decide(false)}>Reject proposal</button>
                        </div>
                      )}
                      {proposal.status && proposal.status !== 'AWAITING_HUMAN_APPROVAL' && <strong>{proposal.status}</strong>}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <section className="panel"><p className="muted">Investigate an alert to view its risk score, connected evidence, and response proposal.</p></section>
            )}
          </>
        )}

        {activeSection === 'graph' && (
          <section className="panel">
            <div className="panel-heading">
              <div><h2><Network size={19} /> Interactive graph explorer</h2><p>Explore alert, user, device, system, and related-alert relationships returned by FalkorDB.</p></div>
              <button className="secondary-button" onClick={() => setActiveSection('overview')}>Back to overview</button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); investigate() }}>
              <input value={alertId} onChange={(event) => setAlertId(event.target.value)} placeholder="Enter alert ID" aria-label="Alert ID for graph investigation" />
              <button className="primary-button" disabled={loading || !alertId.trim()}><Search size={17} />{loading ? 'Working...' : 'Load graph'}</button>
            </form>
            {report?.found ? (
              <>
                <div className="graph-report-summary">
                  <strong>{report.alert.id} · {report.alert.type}</strong>
                  <span className="risk-pill">{report.risk.level} RISK · {report.risk.score}/100</span>
                </div>
                <GraphExplorer report={report} />
              </>
            ) : <p className="muted">No graph loaded yet. Enter an alert ID and select Load graph, or investigate an alert from Overview first.</p>}
          </section>
        )}

        {activeSection === 'analyst' && (
          <section className="panel">
            <div className="panel-heading">
              <div><h2><BrainCircuit size={19} /> AI analyst</h2><p>Generate an explanation based on the selected alert's investigation evidence.</p></div>
              <button className="secondary-button" onClick={getExplanation} disabled={loading || !report?.found}>
                {loading ? 'Generating...' : 'Generate explanation'}
              </button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); investigate() }}>
              <input value={alertId} onChange={(event) => setAlertId(event.target.value)} placeholder="Enter alert ID" aria-label="Alert ID for AI analysis" />
              <button className="primary-button" disabled={loading || !alertId.trim()}><Search size={17} />Load alert</button>
            </form>
            {report?.found && (
              <div className="analyst-context">
                <strong>{report.alert.id} · {report.alert.type}</strong>
                <span>Severity: {report.alert.severity} · Risk: {report.risk.score}/100 ({report.risk.level})</span>
              </div>
            )}
            {explanation ? <div className="explanation analyst-explanation">{explanation}</div> : <p className="muted">Load an alert, then select Generate explanation to ask the AI analyst for an evidence-based assessment.</p>}
          </section>
        )}

        {activeSection === 'audit' && (
          <section className="panel">
            <div className="panel-heading">
              <div><h2><ClipboardList size={19} /> Audit trail</h2><p>Recorded simulated response decisions from the backend.</p></div>
              <button className="secondary-button" onClick={loadAudit}><RefreshCw size={15} /> Refresh</button>
            </div>
            {audit.length ? [...audit].reverse().map((event, index) => (
              <div className="audit-row" key={`${event.timestamp}-${index}`}>
                <div className="audit-icon"><ShieldCheck size={18} /></div>
                <div className="audit-info">
                  <strong>{event.proposed_action || 'Response decision'}</strong>
                  <span>{event.alert_id} · {event.timestamp}</span>
                </div>
                <span className={event.approved ? 'approved-tag' : 'rejected-tag'}>{event.status}</span>
              </div>
            )) : <p className="muted">No audit events found. Recorded decisions will appear here. Select Refresh to check again.</p>}
          </section>
        )}

        <footer>TraceOps AI · FalkorDB + Groq + FastAPI · Synthetic security data only</footer>
      </main>
    </div>
  )
}
