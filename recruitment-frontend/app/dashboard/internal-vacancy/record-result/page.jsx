"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function RecordResultPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scores, setScores] = useState({ writtenScore: "", interviewScore: "", practicalScore: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      api.get(recSearch.trim() ? `/recruitments/vacancy-posts?search=${encodeURIComponent(recSearch)}` : "/recruitments/vacancy-posts")
        .then(r => setRecruitments(r.data))
        .catch(() => setRecruitments([]))
        .finally(() => setSearching(false));
    }, recSearch.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [recSearch]);

  const selectRec = (r) => {
    setSelectedRec(r);
    setRecSearch("");
    setDropOpen(false);
    setEditing(null);
    setLoading(true);
    api.get("/recruitments/internal-applications")
      .then(res => setCandidates(res.data.filter(a => String(a.recruitmentId) === String(r.id) && ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(a.status))))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setScores({ writtenScore: c.writtenScore ?? "", interviewScore: c.interviewScore ?? "", practicalScore: c.practicalScore ?? "" });
  };

  const saveScores = async (id) => {
    setSaving(true);
    try {
      const res = await api.put(`/recruitments/applications/${id}/scores`, {
        writtenScore: scores.writtenScore !== "" ? Number(scores.writtenScore) : null,
        interviewScore: scores.interviewScore !== "" ? Number(scores.interviewScore) : null,
        practicalScore: scores.practicalScore !== "" ? Number(scores.practicalScore) : null,
      });
      setCandidates(prev => prev.map(c => c.id === id ? {
        ...c,
        writtenScore: scores.writtenScore !== "" ? Number(scores.writtenScore) : null,
        interviewScore: scores.interviewScore !== "" ? Number(scores.interviewScore) : null,
        practicalScore: scores.practicalScore !== "" ? Number(scores.practicalScore) : null,
        totalScore: res.data.totalScore,
      } : c));
      setEditing(null);
    } catch (e) { alert("Failed to save scores."); }
    finally { setSaving(false); }
  };

  const scored = candidates.filter(c => c.totalScore !== null && c.totalScore !== undefined);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Record Result</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Enter exam and interview scores for a specific recruitment</p>
      </div>

      {/* Recruitment Selector */}
      <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Recruitment</label>
        <input value={recSearch} onChange={e => setRecSearch(e.target.value)}
          onFocus={() => setDropOpen(true)} onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          placeholder="Click or type to search recruitments..."
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box" }} />
        {dropOpen && (
          <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", maxHeight: "200px", overflowY: "auto", background: "white" }}>
            {searching ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>Searching...</p>
              : recruitments.length === 0 ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>No results</p>
              : recruitments.map(r => (
                <div key={r.id} onMouseDown={() => selectRec(r)}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <span style={{ fontWeight: "600", color: "#2c3e50" }}>{r.jobTitle}</span>
                  <span style={{ color: "#9ca3af", marginLeft: "8px" }}>{r.batchCode}</span>
                  <span style={{ color: "#9ca3af", marginLeft: "8px", fontSize: "11px" }}>({r.status})</span>
                </div>
              ))}
          </div>
        )}
        {selectedRec && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#0369a1" }}>{selectedRec.jobTitle}</span>
            <span style={{ fontSize: "12px", color: "#7f8c8d" }}>{selectedRec.batchCode}</span>
            <button onMouseDown={() => { setSelectedRec(null); setCandidates([]); setEditing(null); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to record scores.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
            {[
              { label: "Total Candidates", value: candidates.length, color: "#2980b9" },
              { label: "Scored", value: scored.length, color: "#27ae60" },
              { label: "Pending", value: candidates.length - scored.length, color: "#e67e22" },
            ].map((s, i) => (
              <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white" }}>
                <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
                <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "32px" }}>Loading...</p>
          ) : candidates.length === 0 ? (
            <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
              No candidates available for scoring in this recruitment.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {candidates.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: "8px", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px" }}>{c.applicantName || c.applicantEmail}</span>
                      <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>{c.applicantEmail}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {c.totalScore !== null && c.totalScore !== undefined && (
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: "22px", fontWeight: "700", color: c.totalScore >= 60 ? "#27ae60" : "#e74c3c", margin: 0 }}>{c.totalScore}</p>
                          <p style={{ fontSize: "11px", color: "#7f8c8d", margin: 0 }}>Avg</p>
                        </div>
                      )}
                      <button onClick={() => editing === c.id ? saveScores(c.id) : openEdit(c)}
                        disabled={saving && editing === c.id}
                        style={{ padding: "7px 16px", background: editing === c.id ? "#27ae60" : "#2980b9", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                        {editing === c.id ? (saving ? "Saving..." : "Save") : "Enter Scores"}
                      </button>
                      {editing === c.id && (
                        <button onClick={() => setEditing(null)}
                          style={{ padding: "7px 12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {editing === c.id && (
                    <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", paddingTop: "16px", borderTop: "1px solid #f0f3f4" }}>
                      {[
                        { label: "Written Exam (0-100)", key: "writtenScore" },
                        { label: "Interview (0-100)", key: "interviewScore" },
                        { label: "Practical (0-100)", key: "practicalScore" },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>{f.label}</label>
                          <input type="number" min="0" max="100" value={scores[f.key]}
                            onChange={e => setScores({ ...scores, [f.key]: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {c.totalScore !== null && c.totalScore !== undefined && editing !== c.id && (
                    <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", paddingTop: "12px", borderTop: "1px solid #f0f3f4" }}>
                      {[{ label: "Written", value: c.writtenScore }, { label: "Interview", value: c.interviewScore }, { label: "Practical", value: c.practicalScore }].map(s => (
                        <div key={s.label} style={{ background: "#f8f9fa", borderRadius: "6px", padding: "10px", textAlign: "center" }}>
                          <p style={{ fontSize: "20px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>{s.value ?? "—"}</p>
                          <p style={{ fontSize: "11px", color: "#7f8c8d", margin: 0 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
