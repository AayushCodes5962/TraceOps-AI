import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Search,
  Network,
  BrainCircuit,
  ClipboardList,
  RefreshCw,
} from 'lucide-react'

import GraphExplorer from './GraphExplorer'
import './App.css'

export default function App() {
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
      throw new Error(
        `Invalid API response (HTTP ${response.status}): ${
          text || 'empty response'
        }`
      )
    }

    if (!response.ok) {
      throw new Error(data.detail || `Request failed: ${response.status}`)
    }

    return data
  }

  async function investigate() {
    if (!alertId.trim()) {
      setMessage('Enter an alert ID.')
      return
    }

    setLoading(true)
    setMessage('')
    setExplanation('')
    setProposal(null)

    try {
      const response = await fetch(
        `/api/investigate/${encodeURIComponent(alertId.trim())}`
      )
      const data = await readJson(response)
      setReport(data)
    } catch (error) {
      setReport(null)
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getExplanation() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(
        `/api/explain/${encodeURIComponent(alertId.trim())}`
      )
      const data = await readJson(response)
      setExplanation(data.explanation)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function getProposal() {
    setMessage('')

    try {
      const response = await fetch(
        `/api/proposal/${encodeURIComponent(alertId.trim())}`
      )
      const data = await readJson(response)
      setProposal(data)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function decide(approved) {
    setMessage('')

    try {
      const response = await fetch(
        `/api/decision/${encodeURIComponent(alertId.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved }),
        }
      )

      const data = await readJson(response)
      setProposal({ ...data, success: true })
      setMessage(`Decision recorded: ${data.status}`)
      await loadAudit()
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h2>
              TraceOps <span>AI</span>
            </h2>
            <small>SECURITY INTELLIGENCE</small>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>
        <div className="nav-item active">
          <Activity size={18} /> Overview
        </div>
        <div className="nav-item">
          <Network size={18} /> Graph investigation
        </div>
        <div className="nav-item">
          <BrainCircuit size={18} /> AI analyst
        </div>
        <div className="nav-item">
          <ClipboardList size={18} /> Audit trail
        </div>

        <div className="sidebar-bottom">
          <span className="status-dot" /> Local demo environment
          <small>Responses are simulation-only</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">SECURITY OPERATIONS CENTER</div>
            <h1>Investigation Overview</h1>
            <p>
              Connect the evidence. Understand the risk. Keep humans in control.
            </p>
          </div>
             <div className="live-badge">
            <span className="status-dot" /> DEMO MODE
          </div>
        </header> 
        

        <section className="metric-grid">
          <div className="metric-card">
            <div className="metric-icon purple">
              <Activity />
            </div>
            <span>Investigation engine</span>
            <strong>FalkorDB</strong>
            <small>Graph-powered evidence</small>
          </div>

          <div className="metric-card">
            <div className="metric-icon red">
              <AlertTriangle />
            </div>
            <span>Current risk score</span>
            <strong>{report ? `${report.risk.score}/100` : '—'}</strong>
            <small>
              {report ? `${report.risk.level} RISK` : 'Run an investigation'}
            </small>
          </div>

          <div className="metric-card">
            <div className="metric-icon blue">
              <BrainCircuit />
            </div>
            <span>AI explanation</span>
            <strong>{explanation ? 'Ready' : 'On demand'}</strong>
            <small>Groq-powered analysis</small>
          </div>

          <div className="metric-card">
            <div className="metric-icon green">
              <ClipboardList />
            </div>
            <span>Audit events</span>
            <strong>{audit.length}</strong>
            <small>Recorded decisions</small>
          </div>
        </section>

        <section className="panel search-panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Search size={19} /> Investigate an alert
              </h2>
              <p>Retrieve connected graph evidence from FalkorDB.</p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              investigate()
            }}
          >
            <input
              value={alertId}
              onChange={(event) => setAlertId(event.target.value)}
              placeholder="Enter alert ID, e.g. ALT-1001"
              aria-label="Alert ID"
            />
            <button
              className="primary-button"
              disabled={loading || !alertId.trim()}
            >
              <Search size={17} />
              {loading ? 'Working...' : 'Investigate'}
            </button>
          </form>

          {message && <div className="notice">{message}</div>}
        </section>

        {report && (
          <>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">INVESTIGATION REPORT</div>
                  <h2>
                    {report.alert.id} · {report.alert.type}
                  </h2>
                  <p>Severity: {report.alert.severity}</p>
                </div>
                <span className="risk-pill">{report.risk.level} RISK</span>
              </div>

              <div className="risk-score">
                <strong>{report.risk.score}</strong>
                <span>/100</span>
                <div className="risk-track">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, report.risk.score))}%`,
                    }}
                  />
                </div>
              </div>

              <h3>Graph evidence chain</h3>
              <div className="evidence-chain">
                <div>
                  <small>ALERT</small>
                  <strong>{report.alert.id}</strong>
                  <span>{report.alert.type}</span>
                </div>
                <div className="chain-arrow">→</div>
                <div>
                  <small>USER</small>
                  <strong>{report.user.name}</strong>
                  <span>
                    {report.user.privileged
                      ? 'Privileged account'
                      : 'Standard account'}
                  </span>
                </div>
                <div className="chain-arrow">→</div>
                <div>
                  <small>DEVICE</small>
                  <strong>{report.devices.join(', ') || 'Unknown'}</strong>
                  <span>Connected device</span>
                </div>
                <div className="chain-arrow">→</div>
                <div>
                  <small>SYSTEM</small>
                  <strong>{report.systems.join(', ') || 'Unknown'}</strong>
                  <span>Connected system</span>
                </div>
              </div>

              <h3>
                <Network size={16} /> Interactive graph explorer
              </h3>
              <p className="muted">
                Explore the entities and relationships returned by the
                investigation.
              </p>
              <GraphExplorer report={report} />

              <h3>Risk factors</h3>
              <ul className="reason-list">
                {report.risk.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>

              <h3>Related alerts</h3>
              {report.related_alerts.length ? (
                report.related_alerts.map((alert) => (
                  <div className="related-alert" key={alert.id}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>{alert.id}</strong>
                      <span>{alert.type}</span>
                    </div>
                    <span className="severity-tag">{alert.severity}</span>
                  </div>
                ))
              ) : (
                <p className="muted">No related alerts found.</p>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    <BrainCircuit size={19} /> AI analyst
                  </h2>
                  <p>Explanation generated from the investigation report.</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={getExplanation}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate explanation'}
                </button>
              </div>

              {explanation ? (
                <div className="explanation">{explanation}</div>
              ) : (
                <p className="muted">
                  Generate an explanation to see the evidence-based assessment
                  and recommended next steps.
                </p>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    <ShieldCheck size={19} /> Human approval
                  </h2>
                  <p>
                    Review the proposed response before recording a decision.
                  </p>
                </div>
              </div>

              {!proposal ? (
                <button className="secondary-button" onClick={getProposal}>
                  Prepare response proposal
                </button>
              ) : (
                <div className="proposal-box">
                  <div className="eyebrow">PROPOSED ACTION</div>
                  <h3>{proposal.proposed_action}</h3>
                  <p>{proposal.reason}</p>
                  <p className="muted">
                    Simulation only · No real security action will be executed.
                  </p>

                  {proposal.status === 'AWAITING_HUMAN_APPROVAL' && (
                    <div className="button-row">
                      <button
                        className="approve-button"
                        onClick={() => decide(true)}
                      >
                        Approve simulation
                      </button>
                      <button
                        className="reject-button"
                        onClick={() => decide(false)}
                      >
                        Reject proposal
                      </button>
                    </div>
                  )}

                  {proposal.status &&
                    proposal.status !== 'AWAITING_HUMAN_APPROVAL' && (
                      <strong>{proposal.status}</strong>
                    )}
                </div>
              )}
            </section>
          </>
        )}

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <ClipboardList size={19} /> Audit trail
              </h2>
              <p>Recorded simulated response decisions.</p>
            </div>
            <button className="secondary-button" onClick={loadAudit}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {audit.length ? (
            [...audit].reverse().map((event, index) => (
              <div
                className="audit-row"
                key={`${event.timestamp}-${index}`}
              >
                <div className="audit-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="audit-info">
                  <strong>{event.proposed_action}</strong>
                  <span>
                    {event.alert_id} · {event.timestamp}
                  </span>
                </div>
                <span
                  className={event.approved ? 'approved-tag' : 'rejected-tag'}
                >
                  {event.status}
                </span>
              </div>
            ))
          ) : (
            <p className="muted">
              Click Refresh to load recorded decisions.
            </p>
          )}
        </section>

        <footer>
          TraceOps AI · FalkorDB + Groq + FastAPI · Synthetic security data only
        </footer>
      </main>
    </div>
  )
}