import { useState, useEffect } from "react";

export default function ExperienceSection({
  experience,
  setExperience,
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/experience?email=${encodeURIComponent(email)}`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setSavedRecords(d); }).catch(() => {});
  }, []);

  const deleteSaved = async (id) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/experience/${id}`, { method: "DELETE" }).catch(() => {});
    setSavedRecords(prev => prev.filter(r => r.id !== id));
  };

  const addExperience = () => {
    setExperience([...experience, { jobTitle: "", institution: "", organizationType: "", startDate: "", terminationReason: "", employmentType: "", responsibility: "", salary: "", endDate: "" }]);
  };

  const removeExperience = (index) => {
    const entry = experience[index];
    if (entry.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/experience/${entry.id}`, { method: "DELETE" }).catch(() => {});
    }
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const saveEntry = async (index) => {
    const email = getEmail();
    if (!email) { setSaveMsg(p => ({ ...p, [index]: "error:Not logged in" })); return; }
    setSavingIdx(index);
    try {
      const entry = experience[index];
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/experience`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, email }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveMsg(p => ({ ...p, [index]: "error:" + (data.message || "Failed") })); return; }
      const updated = [...experience];
      updated[index] = { ...updated[index], id: data.id };
      setExperience(updated);
      setSaveMsg(p => ({ ...p, [index]: "success:Saved!" }));
      setTimeout(() => setSaveMsg(p => { const n = { ...p }; delete n[index]; return n; }), 3000);
      const refreshEmail = getEmail();
      if (refreshEmail) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/experience?email=${encodeURIComponent(refreshEmail)}`)
          .then(r => r.json()).then(d => { if (Array.isArray(d)) setSavedRecords(d); }).catch(() => {});
      }
    } catch { setSaveMsg(p => ({ ...p, [index]: "error:Network error" })); }
    finally { setSavingIdx(null); }
  };

  return (
    <div style={{
      marginBottom: "32px",
      paddingTop: "8px",
      background: "#ffffff",
      borderRadius: "12px",
      overflow: "hidden"
    }}>
      {/* Section Header */}
      <div
        onClick={() => toggleSection('experience')}
        className="section-header"
        style={{
          background: "linear-gradient(135deg, #06b6d4, #0891b2)",
          padding: "16px 24px",
          borderRadius: "12px",
          marginBottom: expandedSections.experience ? "24px" : "0",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(6, 182, 212, 0.2)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", letterSpacing: "-0.01em" }}>
            Work Experience
          </h4>
        </div>
        <span style={{
          color: "white",
          fontSize: "24px",
          fontWeight: "bold",
          transform: expandedSections.experience ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease",
          display: "inline-block"
        }}>
          ›
        </span>
      </div>

      {expandedSections.experience && (
        <div className="animate-in">
          {savedRecords.length > 0 && (
            <div style={{ marginBottom: "24px", background: "white", borderRadius: "10px", overflow: "hidden", border: "2px solid #e2e8f0" }}>
              <div style={{ padding: "10px 16px", background: "linear-gradient(135deg, #06b6d4, #0891b2)", color: "white", fontSize: "13px", fontWeight: "700" }}>
                Saved Work Experience ({savedRecords.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    {["#", "Job Title", "Institution", "Type", "Start", "End", "Action"].map(h => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#374151", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {savedRecords.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ padding: "9px 12px", fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>{r.jobTitle || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "13px", color: "#6b7280" }}>{r.institution || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "13px", color: "#6b7280" }}>{r.employmentType || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#6b7280" }}>{r.startDate || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: "12px", color: "#6b7280" }}>{r.endDate || "—"}</td>
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
            <button
              type="button"
              onClick={addExperience}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Experience
            </button>
          </div>

          {experience.map((exp, index) => (
            <div key={index} className="entry-card" style={{
              background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "16px",
              position: "relative",
              border: "2px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  Entry {index + 1}
                </div>
                {experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    style={{
                      background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                      color: "#991b1b",
                      border: "2px solid #fca5a5",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    Remove
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 28px" }}>
                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Job Title:</label>
                    <input style={inputStyle} placeholder="Enter Job Title" value={exp.jobTitle} onChange={e => updateExperience(index, "jobTitle", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Institution:</label>
                    <input style={inputStyle} placeholder="Enter Institution" value={exp.institution} onChange={e => updateExperience(index, "institution", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Organization Type:</label>
                    <select style={inputStyle} value={exp.organizationType} onChange={e => updateExperience(index, "organizationType", e.target.value)}>
                      <option value="">Select One</option>
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
                      <option value="NGO">NGO</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Start Date:</label>
                    <input type="date" style={inputStyle} placeholder="Enter Start Date" value={exp.startDate} onChange={e => updateExperience(index, "startDate", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Termination Reason:</label>
                    <input style={inputStyle} placeholder="Enter Termination Reason" value={exp.terminationReason} onChange={e => updateExperience(index, "terminationReason", e.target.value)} />
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Employment Type:</label>
                    <select style={inputStyle} value={exp.employmentType} onChange={e => updateExperience(index, "employmentType", e.target.value)}>
                      <option value="">Select One</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Responsibility:</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} placeholder="Enter Responsibility" value={exp.responsibility} onChange={e => updateExperience(index, "responsibility", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>Salary:</label>
                    <input style={inputStyle} placeholder="Enter Salary" value={exp.salary} onChange={e => updateExperience(index, "salary", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "12px" }}>End Date:</label>
                    <input type="date" style={inputStyle} placeholder="Enter End Date" value={exp.endDate} onChange={e => updateExperience(index, "endDate", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                {saveMsg[index] && (
                  <div style={{ marginBottom: "10px", padding: "8px 14px", borderRadius: "7px", fontSize: "13px", fontWeight: "600",
                    background: saveMsg[index].startsWith("success:") ? "#d1fae5" : "#fee2e2",
                    color: saveMsg[index].startsWith("success:") ? "#065f46" : "#991b1b" }}>
                    {saveMsg[index].split(":").slice(1).join(":")}
                  </div>
                )}
                <button type="button" onClick={() => saveEntry(index)} disabled={savingIdx === index}
                  style={{ padding: "10px 28px", background: savingIdx === index ? "#94a3b8" : "linear-gradient(135deg, #06b6d4, #0891b2)",
                    color: "white", border: "none", borderRadius: "8px", cursor: savingIdx === index ? "not-allowed" : "pointer",
                    fontSize: "14px", fontWeight: "600", boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)" }}>
                  {savingIdx === index ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </div>
          ))}

          {/* Navigation Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
            <button
              type="button"
              onClick={goToPreviousStep}
              style={{
                padding: "12px 32px",
                background: "linear-gradient(135deg, #64748b, #475569)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(100, 116, 139, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>
            <button
              type="button"
              onClick={goToNextStep}
              style={{
                padding: "12px 32px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              Next Section
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
