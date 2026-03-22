"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const STAGE_MAP = {
  qualify_account: "🔍 Qualifying Account",
  handle_rejection: "❌ Account Disqualified",
  research_account: "🧠 Deep Research",
  generate_content: "✍️ Drafting Output"
};

export default function Home() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Modal state
  const [selectedFlow, setSelectedFlow] = useState(null);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/flow-states");
      const data = await res.json();
      if (data.success) {
        setStates(data.data);
      } else {
        showToast("Failed to fetch states", true);
      }
    } catch (error) {
      console.error(error);
      showToast("Error connecting to database", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
    const interval = setInterval(fetchStates, 5000); // Poll faster for better UX
    return () => clearInterval(interval);
  }, []);

  // Process data into distinct flow  // Group by flow_uuid to show only the latest state per run
  const flows = useMemo(() => {
    const map = new Map();
    states.forEach(state => {
      // Create a unique key using flow_uuid or timestamp if uuid missing
      const key = state.flow_uuid || state.timestamp;
      
      if (!map.has(key)) {
        map.set(key, {
          uuid: String(key),
          companyName: state.state_json?.company_name || null,
          lastUpdated: state.timestamp,
          isCompleted: (state.method_name === 'generate_content' && Object.keys(state.state_json?.final_content || {}).length > 0) || state.method_name === 'handle_rejection',
          fullState: state.state_json,
          methodName: state.method_name,
          history: []
        });
      }
      
      const entry = map.get(key);

      // If the newest DB record didn't have a method name, steal it from this older record
      if (!entry.methodName && state.method_name) {
        entry.methodName = state.method_name;
      }

      // If newest record wasn't visibly completed but an older one was
      if (!entry.isCompleted) {
        entry.isCompleted = (state.method_name === 'generate_content' && Object.keys(state.state_json?.final_content || {}).length > 0) || state.method_name === 'handle_rejection';
      }
      
      // Fallback: If we don't have company name yet, look historically
      if (!entry.companyName && state.state_json?.company_name) {
        entry.companyName = state.state_json.company_name;
      }
      
      // Merge state properties incrementally giving preference to latest (which means don't overwrite if entry already has it, because entry is newest)
      if (!entry.fullState?.buying_committee && state.state_json?.buying_committee) {
        entry.fullState.buying_committee = state.state_json.buying_committee;
      }
      if (!entry.fullState?.trigger_event && state.state_json?.trigger_event) {
        entry.fullState.trigger_event = state.state_json.trigger_event;
      }
      
      // Update with the most recent timestamp seen (in case the array isn't strictly newest-first)
      if (new Date(state.timestamp) > new Date(entry.lastUpdated)) {
        entry.lastUpdated = state.timestamp;
        
        // Spread the fullState, but state.state_json will overwrite older keys. This ensures the absolute newest keys persist.
        entry.fullState = { ...entry.fullState, ...state.state_json };
        
        if (state.method_name) {
          entry.methodName = state.method_name;
        }
        
        const isNowCompleted = (state.method_name === 'generate_content' && Object.keys(state.state_json?.final_content || {}).length > 0) || state.method_name === 'handle_rejection';
        entry.isCompleted = entry.isCompleted || isNowCompleted;
      }
      
      entry.history.push(state);
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }, [states]);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 5000);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const closeAndClearModal = (e) => {
    if (e.target.id === 'modal-overlay') {
      setSelectedFlow(null);
    }
  };

  const formatMarkdown = (text) => {
    if (!text) return { __html: "" };
    const html = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff">$1</strong>');
    return { __html: html };
  };

  return (
    <main className={styles.main}>
      <nav className={styles.navBar}>
        <Link href="/" className={`${styles.navLink} ${styles.navLinkActive}`}>Dashboard</Link>
        <Link href="/new-campaign" className={styles.navLink}>New Campaign</Link>
        <Link href="/icp" className={styles.navLink}>ICP Rules</Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>Agentic ABM Engine</h1>
        <p className={styles.subtitle}>
          Execute, monitor, and scale your autonomous marketing workforce in real-time.
        </p>
      </header>

      <div className={styles.processContainer}>
        <div className={styles.processStep}>
          <div className={styles.processIcon}>🔍</div>
          <div className={styles.processText}>
            <strong>1. ICP Match</strong>
            <span>Qualify accounts instantly</span>
          </div>
        </div>
        <div className={styles.processArrow}>→</div>
        <div className={styles.processStep}>
          <div className={styles.processIcon}>🧠</div>
          <div className={styles.processText}>
            <strong>2. Deep Research</strong>
            <span>Analyze decision makers</span>
          </div>
        </div>
        <div className={styles.processArrow}>→</div>
        <div className={styles.processStep}>
          <div className={styles.processIcon}>✍️</div>
          <div className={styles.processText}>
            <strong>3. Engagement</strong>
            <span>Draft hyper-personalized outbound</span>
          </div>
        </div>
      </div>

      <section className={styles.glassContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.liveIndicator}></span>
            Recent Campaigns
          </h2>
          <button className={styles.refreshBtn} onClick={fetchStates} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {flows.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <p>Awaiting kickoff... No state data found in database.</p>
          </div>
        ) : (
          <div className={styles.crmTableWrapper}>
            <table className={styles.crmTable}>
              <thead>
                <tr>
                  <th>Target Account</th>
                  <th>Status</th>
                  <th>Current Stage</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {flows.map(flow => (
                  <tr key={flow.uuid}>
                    <td>
                      <div className={styles.companyName}>
                        <div className={styles.companyIcon}>
                          {flow.companyName ? flow.companyName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div>{flow.companyName || "Unknown Account"}</div>
                          <div className={styles.uuidText}>{flow.uuid.split('-')[0]}***</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {flow.isCompleted ? (
                        <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                          ✅ Completed
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.statusRunning}`}>
                          <span className={styles.pulseDot}></span> Running
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={styles.stepBadge}>
                        {flow.methodName ? (STAGE_MAP[flow.methodName] || flow.methodName.replace(/_/g, ' ')) : 'Initializing...'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(flow.lastUpdated)}
                    </td>
                    <td>
                      <button 
                        className={styles.viewBtn} 
                        onClick={() => setSelectedFlow(flow)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Details Modal */}
      {selectedFlow && (
        <div id="modal-overlay" className={styles.modalOverlay} onClick={closeAndClearModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedFlow.companyName || "Unknown"}
                {selectedFlow.isCompleted ? (
                  <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Completed</span>
                ) : (
                  <span className={`${styles.statusBadge} ${styles.statusRunning}`}><span className={styles.pulseDot}></span> Running</span>
                )}
              </h2>
              <button className={styles.closeBtn} onClick={() => setSelectedFlow(null)}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              {/* ICP Qualification */}
              <div className={styles.dataCard}>
                <h3 className={styles.dataCardTitle}>🎯 Qualification</h3>
                <div style={{ marginBottom: "0.5rem" }}>
                  Status: 
                  <span className={`${styles.fitBadge} ${!selectedFlow.fullState.icp_fit ? styles.fitBadgeFalse : ''}`} style={{ marginLeft: "10px" }}>
                    {selectedFlow.fullState.icp_fit ? 'Valid ICP Fit' : 'Disqualified'}
                  </span>
                </div>
                <div>
                  <div className={styles.dataLabel}>Current Stage</div>
                  <div className={styles.dataValue} style={{ color: '#fff' }}>
                    {STAGE_MAP[selectedFlow.methodName] || selectedFlow.methodName || 'Unknown'}
                  </div>
                </div>
                {selectedFlow.fullState.rejection_reason && (
                  <p className={styles.dataText} style={{ color: '#f87171' }}>
                    <strong>Reason:</strong> {selectedFlow.fullState.rejection_reason}
                  </p>
                )}
              </div>

              {/* Buying Committee */}
              {selectedFlow.fullState.buying_committee?.summary && (
                <div className={styles.dataCard}>
                  <h3 className={styles.dataCardTitle}>👥 Buying Committee</h3>
                  <div 
                    className={styles.dataText} 
                    dangerouslySetInnerHTML={formatMarkdown(selectedFlow.fullState.buying_committee.summary)} 
                  />
                </div>
              )}

              {/* Trigger Event */}
              {selectedFlow.fullState.trigger_event && (
                <div className={styles.dataCard}>
                  <h3 className={styles.dataCardTitle}>⚡ Trigger Event</h3>
                  <div 
                    className={styles.dataText} 
                    dangerouslySetInnerHTML={formatMarkdown(selectedFlow.fullState.trigger_event)} 
                  />
                </div>
              )}

              {/* Final Content */}
              {selectedFlow.fullState.final_content && Object.keys(selectedFlow.fullState.final_content || {}).length > 0 && (() => {
                const finalObj = selectedFlow.fullState.final_content;
                
                // Fast path if LLM returned a raw string instead of a JSON object
                if (typeof finalObj === 'string') {
                  return (
                    <div className={styles.dataCard}>
                      <h3 className={styles.dataCardTitle}>📝 Final Output</h3>
                      <div style={{ marginBottom: "1.5rem" }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Generated Response</strong>
                        <div 
                          className={styles.dataText} 
                          style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}
                          dangerouslySetInnerHTML={formatMarkdown(finalObj)}
                        />
                      </div>
                    </div>
                  );
                }

                // Look for common keys associated with outreach emails and plans
                const emailKey = Object.keys(finalObj).find(k => /email|draft|message|outreach/i.test(k));
                const planKey = Object.keys(finalObj).find(k => /plan|strategy|engagement/i.test(k) && k !== emailKey);
                
                // Fallback: If no email or plan key is found, grab the first string that has substance
                const fallbackKey = (!emailKey && !planKey) ? Object.keys(finalObj).find(k => typeof finalObj[k] === 'string' && finalObj[k].length > 10) : null;
                
                const hasMatch = emailKey || planKey || fallbackKey;
                if (!hasMatch) return null; // Avoid rendering empty cards if keys are nested useless objects

                return (
                  <div className={styles.dataCard}>
                    <h3 className={styles.dataCardTitle}>📝 Final Output</h3>
                    
                    {emailKey && finalObj[emailKey] && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Generated Email</strong>
                        <div 
                          className={styles.dataText} 
                          style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}
                          dangerouslySetInnerHTML={formatMarkdown(typeof finalObj[emailKey] === 'string' ? finalObj[emailKey] : JSON.stringify(finalObj[emailKey]))}
                        />
                      </div>
                    )}
                    
                    {!emailKey && planKey && finalObj[planKey] && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>Engagement Plan / Output</strong>
                        <div 
                          className={styles.dataText} 
                          dangerouslySetInnerHTML={formatMarkdown(typeof finalObj[planKey] === 'string' ? finalObj[planKey] : JSON.stringify(finalObj[planKey]))}
                        />
                      </div>
                    )}

                    {!emailKey && !planKey && fallbackKey && finalObj[fallbackKey] && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', textTransform: 'capitalize' }}>
                          {fallbackKey.replace(/_/g, ' ')}
                        </strong>
                        <div 
                          className={styles.dataText} 
                          style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}
                          dangerouslySetInnerHTML={formatMarkdown(typeof finalObj[fallbackKey] === 'string' ? finalObj[fallbackKey] : JSON.stringify(finalObj[fallbackKey]))}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Usage Metrics (Advanced Details) */}
              {selectedFlow.fullState.usage_metrics && Object.keys(selectedFlow.fullState.usage_metrics).length > 0 && (
                <div className={styles.dataCard}>
                  <h3 className={styles.dataCardTitle}>📊 Advanced Details (Usage Metrics)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total Tokens</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {selectedFlow.fullState.usage_metrics.total_tokens?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Prompt Tokens</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                        {selectedFlow.fullState.usage_metrics.prompt_tokens?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Completion</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
                        {selectedFlow.fullState.usage_metrics.completion_tokens?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Requests</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                        {selectedFlow.fullState.usage_metrics.successful_requests?.toLocaleString() || 0}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.isError ? styles.toastError : ''}`}>
          {toast.isError ? '⚠️' : '✅'} {toast.message}
        </div>
      )}
    </main>
  );
}
