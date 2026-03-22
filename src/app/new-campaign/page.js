"use client";

import { useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function NewCampaign() {
  const router = useRouter();
  const [companiesText, setCompaniesText] = useState("");
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleKickoff = async () => {
    // Extract non-empty lines as company names
    const companies = companiesText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (companies.length === 0) {
      showToast("Please enter at least one company name", true);
      return;
    }

    try {
      setKickoffLoading(true);
      const res = await fetch("/api/kickoff", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast("Agent scaling up! Processing campaigns...");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        showToast("Kickoff failed: " + data.error, true);
        setKickoffLoading(false);
      }
    } catch (error) {
      showToast("Error executing kickoff", true);
      setKickoffLoading(false);
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
        <Link href="/new-campaign" className={`${styles.navLink} ${styles.navLinkActive}`}>New Campaign</Link>
        <Link href="/icp" className={styles.navLink}>ICP Rules</Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>Deploy Agents</h1>
        <p className={styles.subtitle}>
          Scale your ABM motion instantly. Input a list of target accounts, and the Engine will autonomously run the entire validation, research, and engagement pipeline for each.
        </p>
      </header>

      <div className={styles.editorContainer}>
        <div className={styles.editorHeader}>
          <div className={styles.instruction}>
            Target Accounts
          </div>
          <button 
            className={styles.kickoffBtn} 
            onClick={handleKickoff}
            disabled={kickoffLoading}
          >
            {kickoffLoading ? (
              <><span className={styles.spinner}></span> Initiating...</>
            ) : (
              "Launch Campaigns"
            )}
          </button>
        </div>
        
        <textarea 
          className={styles.textarea}
          value={companiesText}
          onChange={(e) => setCompaniesText(e.target.value)}
          placeholder={"Acme Corp\nStark Industries\nWayne Enterprises\n..."}
          spellCheck={false}
        />
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.isError ? styles.toastError : ''}`}>
          {toast.isError ? '⚠️' : '✅'} {toast.message}
        </div>
      )}
    </main>
  );
}
