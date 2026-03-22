"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import styles from "./page.module.css";

export default function IcpSettings() {
  const [yamlContent, setYamlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchIcp = async () => {
      try {
        const res = await fetch("/api/icp");
        const data = await res.json();
        if (data.success) {
          setYamlContent(data.data);
        } else {
          showToast("Failed to load icp.yaml", true);
        }
      } catch (error) {
        showToast("Error connected to API", true);
      } finally {
        setLoading(false);
      }
    };
    fetchIcp();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/icp", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yamlData: yamlContent })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Configuration saved successfully!");
      } else {
        showToast("Failed to save configuration", true);
      }
    } catch (error) {
      showToast("Error saving configuration", true);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <main className={styles.main}>
      <nav className={styles.navBar}>
        <Link href="/" className={styles.navLink}>Dashboard</Link>
        <Link href="/new-campaign" className={styles.navLink}>New Campaign</Link>
        <Link href="/icp" className={`${styles.navLink} ${styles.navLinkActive}`}>ICP Rules</Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>Qualification Rules</h1>
        <p className={styles.subtitle}>
          Modify standard ICP rules. The Qualification Crew automatically checks generated targets against these constraints.
        </p>
      </header>

      <div className={styles.editorContainer}>
        <div className={styles.editorHeader}>
          <div className={styles.fileName}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            abm_engine/icp.yaml
          </div>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa' }}>Loading configuration...</div>
        ) : (
          <textarea 
            className={styles.textarea}
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            spellCheck={false}
          />
        )}
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.isError ? styles.toastError : ''}`}>
          {toast.isError ? '⚠️' : '✅'} {toast.message}
        </div>
      )}
    </main>
  );
}
