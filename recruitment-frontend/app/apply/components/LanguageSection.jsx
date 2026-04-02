import { useState, useEffect } from "react";

export default function LanguageSection({
  languages,
  setLanguages,
  expandedSections,
  toggleSection,
  goToNextStep,
  goToPreviousStep,
  inputStyle,
  labelStyle,
}) {
  const [savingIdx, setSavingIdx] = useState(null);
  const [saveMsg, setSaveMsg] = useState({});
  const [savedRecords, setSavedRecords] = useState([]);

  const getEmail = () => typeof window !== "undefined" ? localStorage.getItem("externalEmail") : null;

  useEffect(() => {
    const email = getEmail();
    if (!email) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/language?email=${encodeURIComponent(email)}`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setSavedRecords(d); }).catch(() => {});
  }, []);

  const deleteSaved = async (id) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/language/${id}`, { method: "DELETE" }).catch(() => {});
    setSavedRecords(prev => prev.filter(r => r.id !== id));
  };

  const proficiencyOptions = ["Excellent", "Very Good", "Good", "Fair", "Poor"];

  const addLanguage = () => {
    setLanguages([...languages, { language: "", writing: "", listening: "", reading: "", speaking: "" }]);
  };

  const removeLanguage = (index) => {
    const entry = languages[index];
    if (entry.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/language/${entry.id}`, { method: "DELETE" }).catch(() => {});
    }
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const updateLanguage = (index, field, value) => {
    const updated = [...languages];
    updated[index][field] = value;
    setLanguages(updated);
  };

  const saveEntry = async (index) => {
    const email = getEmail();
    if (!email) { setSaveMsg(p => ({ ...p, [index]: "error:Not logged in" })); return; }
    setSavingIdx(index);
    try {
      const entry = languages[index];
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/language`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, email }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(p => ({ ...p, [index]: "error:" + (data.message || "Failed") })); return; }
      const updated = [...languages];
      updated[index] = { ...updated[index], id: data.id };
      setLanguages(updated);
      setSaveMsg(p => ({ ...p, [index]: "success:Saved!" }));
      setTimeout(() => setSaveMsg(p => { const n = { ...p }; delete n[index]; return n; }), 3000);
      // Refresh saved records
      if (email) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/language?email=${encodeURIComponent(email)}`)
          .then(r => r.json()).then(d => { if (Array.isArray(d)) setSavedRecords(d); }).catch(() => {});
      }
    } catch { setSaveMsg(p => ({ ...p, [index]: "error:Network error" })); }
    finally { setSavingIdx(null); }
  };

  return (
    <div style={{ marginBottom: "32px", paddingTop: "8px", background: "#ffffff", borderRadius: "12px", overflow: "hidden" }}>
      {/* Section Header */}
      <div onClick={() => toggleSection('language')} className="section-header"
        style={{ background: "linear-gradient(135deg, #ec4899, #db2777)", padding: "16px 24px", borderRadius: "12px", marginBottom: expandedSections.language ? "24px" : "0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(236, 72, 153, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white" }}>Language Proficiency</h4>
        </div>
        <span style={{ color: "white", fontSize: "24px", fontWeight: "bold", transform: expandedSections.language ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s ease", display: "inline-block" }}>›</span>
      </div>

      {expandedSections.language && (
        <div className="animate-in">
          {/* Saved Records Table */}
          {savedRecords.length > 0 && (
            <div style={{ marginBottom: "24px", background: "white", borderRadius: "10px", overflow: "hidden", border: "2px solid #e2e8f0" }}>
              <div style={{ padding: "10px 16px", background: "linear-gradient(135deg, #ec4899, #db2777)", color: "white", fontSize: "13px", fontWeight: "700" }}>
                Saved Languages ({savedRecords.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    {["#", "Language", "Reading", "Writing", "Speaking", "Listening", "Action"].map(h => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {savedRecords.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ padding: "9px 12px", fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>{r.language || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#6b7280" }}>{r.reading || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#6b7280" }}>{r.writing || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#6b7280" }}>{r.speaking || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#6b7280" }}>{r.listening || "—"}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <button type="button" onClick={() => deleteSaved(r.id)}
                          style={{ padding: "4px 10px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
            <button type="button" onClick={addLanguage}
              style={{ padding: "10px 20px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", boxShadow: "0 2px 8px rgba(59,130,246,0.3)", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Add Language
            </button>
          </div>

          {languages.map((lang, index) => (
            <div key={index} className="entry-card" style={{ background: "linear-gradient(to bottom, #ffffff, #f8fafc)", padding: "24px", borderRadius: "12px", marginBottom: "16px", border: "2px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #ec4899, #db2777)", color: "white", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>
                  Entry {index + 1}
                </div>
                {languages.length > 1 && (
                  <button type="button" onClick={() => removeLanguage(index)}
                    style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#991b1b", border: "2px solid #fca5a5", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    Remove
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 28px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Language:</label>
                    <input style={inputStyle} placeholder="Enter Language" value={lang.language} onChange={e => updateLanguage(index, "language", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Writing:</label>
                    <select style={inputStyle} value={lang.writing} onChange={e => updateLanguage(index, "writing", e.target.value)}>
                      <option value="">Select One</option>
                      {proficiencyOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Listening:</label>
                    <select style={inputStyle} value={lang.listening} onChange={e => updateLanguage(index, "listening", e.target.value)}>
                      <option value="">Select One</option>
                      {proficiencyOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Reading:</label>
                    <select style={inputStyle} value={lang.reading} onChange={e => updateLanguage(index, "reading", e.target.value)}>
                      <option value="">Select One</option>
                      {proficiencyOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Speaking:</label>
                    <select style={inputStyle} value={lang.speaking} onChange={e => updateLanguage(index, "speaking", e.target.value)}>
                      <option value="">Select One</option>
                      {proficiencyOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "20px", textAlign: "center" }}>
                {saveMsg[index] && (
                  <div style={{ marginBottom: "10px", padding: "8px 14px", borderRadius: "7px", fontSize: "13px", fontWeight: "600", background: saveMsg[index].startsWith("success:") ? "#d1fae5" : "#fee2e2", color: saveMsg[index].startsWith("success:") ? "#065f46" : "#991b1b" }}>
                    {saveMsg[index].split(":").slice(1).join(":")}
                  </div>
                )}
                <button type="button" onClick={() => saveEntry(index)} disabled={savingIdx === index}
                  style={{ padding: "10px 28px", background: savingIdx === index ? "#94a3b8" : "linear-gradient(135deg, #ec4899, #db2777)", color: "white", border: "none", borderRadius: "8px", cursor: savingIdx === index ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", boxShadow: "0 2px 8px rgba(236,72,153,0.3)" }}>
                  {savingIdx === index ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </div>
          ))}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
            <button type="button" onClick={goToPreviousStep}
              style={{ padding: "12px 32px", background: "linear-gradient(135deg, #64748b, #475569)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: "600", boxShadow: "0 4px 12px rgba(100,116,139,0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Previous
            </button>
            <button type="button" onClick={goToNextStep}
              style={{ padding: "12px 32px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "15px", fontWeight: "600", boxShadow: "0 4px 12px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
              Next Section
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
