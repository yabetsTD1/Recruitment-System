"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function PromoteCandidatesPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(null);
  const [error, setError] = useState("");

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
    setError("");
    api.get("/recruitments/internal-applications")
      .then(res => setCandidates(res.data.filter(a => String(a.recruitmentId) === String(r.id) && ["HIRED", "PROMOTED"].includes(a.status))))
      .catch(() => setError("Failed to load candidates."))
      .finally(() => setLoading(false));
  };

  const handlePromote = async (id) => {
    setPromoting(id);
    try {
      await api.post(`/recruitments/applications/${id}/promote`);
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: "PROMOTED", isPromoted: true } : c));
    } catch (e) { alert("Failed to promote candidate."); }
    finally { setPromoting(null); }
  };

  const readyCount = candidates.filter(c => c.status === "HIRED").length;
  const promotedCount = candidates.filter(c => c.status === "PROMOTED").length;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Promote Candidates</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Finalize promotions for a specific recruitment</p>
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
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to promote candidates.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
            {[
              { label: "Ready to Promote", value: readyCount, color: "#2980b9" },
              { label: "Promoted", value: promotedCount, color: "#27ae60" },
              { label: "Total", value: candidates.length, color: "#8e44ad" },
            ].map((s, i) => (
              <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white" }}>
                <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
                <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "12px 16px", color: "#dc2626", marginBottom: "16px", fontSize: "13px" }}>{error}</div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d" }}>Loading candidates...</div>
          ) : candidates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d", background: "white", borderRadius: "8px", border: "1px solid #ecf0f1" }}>
              <p style={{ fontSize: "15px", margin: 0 }}>No hired candidates for this recruitment.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {candidates.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: "8px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#2980b9", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px", flexShrink: 0 }}>
                        {c.applicantName ? c.applicantName[0].toUpperCase() : "?"}
                      </div>
                      <div>
                        <p style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px", margin: 0 }}>{c.applicantName || "Unknown"}</p>
                        <p style={{ color: "#7f8c8d", fontSize: "12px", margin: "2px 0 0 0" }}>{c.applicantEmail} · Applied: {c.appliedAt || "—"}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {c.totalScore != null && (
                        <>
                          <p style={{ fontSize: "26px", fontWeight: "700", color: "#27ae60", margin: "0 0 2px 0" }}>{c.totalScore}</p>
                          <p style={{ fontSize: "11px", color: "#7f8c8d", margin: "0 0 10px 0" }}>Score</p>
                        </>
                      )}
                      {c.status === "PROMOTED" ? (
                        <span style={{ padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: "#dcfce7", color: "#15803d", display: "block" }}>✓ Promoted</span>
                      ) : (
                        <button onClick={() => handlePromote(c.id)} disabled={promoting === c.id}
                          style={{ padding: "9px 20px", background: promoting === c.id ? "#bdc3c7" : "#8e44ad", color: "white", border: "none", borderRadius: "5px", cursor: promoting === c.id ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px" }}>
                          {promoting === c.id ? "Promoting..." : "Promote"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
