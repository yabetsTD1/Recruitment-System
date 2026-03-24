"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function ApprovedFilterPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);

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
    setLoading(true);
    api.get("/recruitments/internal-applications")
      .then(res => setCandidates(res.data.filter(a => String(a.recruitmentId) === String(r.id) && ["HIRED", "SHORTLISTED", "REJECTED"].includes(a.status))))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/recruitments/applications/${id}/status`, { status });
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (e) { alert("Failed to update."); }
    finally { setUpdating(null); }
  };

  const pending = candidates.filter(c => c.status === "SHORTLISTED");
  const approved = candidates.filter(c => c.status === "HIRED");
  const rejected = candidates.filter(c => c.status === "REJECTED");

  const statusStyle = (s) => {
    if (s === "HIRED") return { bg: "#dcfce7", color: "#15803d" };
    if (s === "REJECTED") return { bg: "#fee2e2", color: "#b91c1c" };
    return { bg: "#fef3c7", color: "#92400e" };
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Approved Filter Candidates</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Review and approve submitted candidates for a specific recruitment</p>
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
            <button onMouseDown={() => { setSelectedRec(null); setCandidates([]); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to review candidates.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
            {[
              { label: "Awaiting Approval", value: pending.length, color: "#e67e22" },
              { label: "Approved", value: approved.length, color: "#27ae60" },
              { label: "Rejected", value: rejected.length, color: "#e74c3c" },
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
              No candidates to review for this recruitment.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {candidates.map(item => {
                const sc = statusStyle(item.status);
                return (
                  <div key={item.id} style={{ background: "white", borderRadius: "8px", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px" }}>{item.applicantName || item.applicantEmail}</span>
                        <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: sc.bg, color: sc.color }}>{item.status}</span>
                      </div>
                      <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "0 0 4px 0" }}>{item.applicantEmail}</p>
                      <p style={{ color: "#7f8c8d", fontSize: "12px", margin: 0 }}>
                        Applied: {item.appliedAt}
                        {item.totalScore !== null && item.totalScore !== undefined && (
                          <span> · Score: <strong style={{ color: "#27ae60" }}>{item.totalScore}</strong></span>
                        )}
                      </p>
                    </div>
                    {item.status === "SHORTLISTED" && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => updateStatus(item.id, "HIRED")} disabled={updating === item.id}
                          style={{ padding: "8px 18px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                          Approve
                        </button>
                        <button onClick={() => updateStatus(item.id, "REJECTED")} disabled={updating === item.id}
                          style={{ padding: "8px 18px", background: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
