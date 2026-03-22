"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";

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

  // Process data into distinct flow runs
  const flows = useMemo(() => {
    const map = new Map();
    states.forEach(state => {
      if (!map.has(state.flow_uuid)) {
        map.set(state.flow_uuid, {
          uuid: state.flow_uuid,
          latestMethod: state.method_name,
          companyName: state.state_json?.company_name || null,
          lastUpdated: state.timestamp,
          // If the final_content object exists and has keys, or if method is a known terminal method.
          isCompleted: state.method_name === 'generate_content' && Object.keys(state.state_json?.final_content || {}).length > 0,
          fullState: state.state_json,
          history: []
        });
      }
      map.get(state.flow_uuid).history.push(state);
      
      // Fallback: If we don't have company name yet, look historically
      if (!map.get(state.flow_uuid).companyName && state.state_json?.company_name) {
        map.get(state.flow_uuid).companyName = state.state_json.company_name;
      }
      
      // Merge state properties incrementally giving preference to latest
      if (!map.get(state.flow_uuid).fullState.buying_committee && state.state_json?.buying_committee) {
        map.get(state.flow_uuid).fullState.buying_committee = state.state_json.buying_committee;
      }
      if (!map.get(state.flow_uuid).fullState.trigger_event && state.state_json?.trigger_event) {
        map.get(state.flow_uuid).fullState.trigger_event = state.state_json.trigger_event;
      }
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
                        {flow.latestMethod.replace(/_/g, ' ')}
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
