"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function SubmitCandidatesPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
    setSelected([]);
    setLoading(true);
    api.get("/recruitments/internal-applications")
      .then(res => setCandidates(res.data.filter(a => String(a.recruitmentId) === String(r.id) && ["SHORTLISTED", "HIRED"].includes(a.status))))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  };

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => {
    const eligible = candidates.filter(c => c.status === "SHORTLISTED").map(c => c.id);
    setSelected(selected.length === eligible.length ? [] : eligible);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(selected.map(id => api.put(`/recruitments/applications/${id}/status`, { status: "HIRED" })));
      setCandidates(prev => prev.map(c => selected.includes(c.id) ? { ...c, status: "HIRED" } : c));
      setSelected([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) { alert("Failed to submit some candidates."); }
    finally { setSubmitting(false); }
  };

  const pending = candidates.filter(c => c.status === "SHORTLISTED");
  const submitted = candidates.filter(c => c.status === "HIRED");

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Submit Candidates</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Select shortlisted candidates to submit for final approval</p>
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
            <button onMouseDown={() => { setSelectedRec(null); setCandidates([]); setSelected([]); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to submit candidates.</p>
        </div>
      ) : (
        <>
          {success && (
            <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "6px", padding: "12px 16px", marginBottom: "16px", color: "#15803d", fontWeight: "600", fontSize: "13px" }}>
              Candidates submitted successfully.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", flex: 1, marginRight: "16px" }}>
              {[
                { label: "Shortlisted", value: pending.length, color: "#27ae60" },
                { label: "Selected", value: selected.length, color: "#2980b9" },
                { label: "Submitted", value: submitted.length, color: "#8e44ad" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "14px 16px", color: "white" }}>
                  <p style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
                  <p style={{ fontSize: "12px", margin: 0, opacity: 0.9 }}>{s.label}</p>
                </div>
              ))}
            </div>
            {selected.length > 0 && (
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: "9px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" }}>
                {submitting ? "Submitting..." : `Submit ${selected.length} Candidate${selected.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "32px" }}>Loading...</p>
          ) : candidates.length === 0 ? (
            <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
              No shortlisted candidates for this recruitment.
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th style={{ padding: "11px 16px", width: "40px" }}>
                      <input type="checkbox" checked={selected.length === pending.length && pending.length > 0} onChange={toggleAll} style={{ cursor: "pointer" }} />
                    </th>
                    {["Candidate", "Email", "Score", "Status", "Submission"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => {
                    const isSubmitted = c.status === "HIRED";
                    return (
                      <tr key={c.id} style={{ borderTop: "1px solid #f0f3f4", background: selected.includes(c.id) ? "#eaf4fb" : "white" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <input type="checkbox" checked={selected.includes(c.id)} onChange={() => !isSubmitted && toggle(c.id)}
                            disabled={isSubmitted} style={{ cursor: isSubmitted ? "not-allowed" : "pointer" }} />
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{c.applicantName || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#7f8c8d", fontSize: "13px" }}>{c.applicantEmail}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "16px", fontWeight: "700", color: "#27ae60" }}>{c.totalScore ?? "—"}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: "#dcfce7", color: "#15803d" }}>SHORTLISTED</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {isSubmitted
                            ? <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: "#ede9fe", color: "#5b21b6" }}>Submitted</span>
                            : <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: "#f3f4f6", color: "#6b7280" }}>Pending</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
