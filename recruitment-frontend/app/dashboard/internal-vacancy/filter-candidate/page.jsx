"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function FilterCandidatePage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(60);
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
      .then(res => setCandidates(res.data.filter(a => String(a.recruitmentId) === String(r.id) && a.totalScore !== null && a.totalScore !== undefined)))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  };

  const applyFilter = async () => {
    for (const c of candidates) {
      const newStatus = c.totalScore >= threshold ? "SHORTLISTED" : "REJECTED";
      if (c.status !== newStatus) {
        setUpdating(c.id);
        try {
          await api.put(`/recruitments/applications/${c.id}/status`, { status: newStatus });
          setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x));
        } catch (e) { console.error(e); }
      }
    }
    setUpdating(null);
  };

  const passed = candidates.filter(c => c.totalScore >= threshold);
  const failed = candidates.filter(c => c.totalScore < threshold);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Filter Candidates</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Filter candidates by score threshold for a specific recruitment</p>
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
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to filter its candidates.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
            {[
              { label: "Total Scored", value: candidates.length, color: "#2980b9" },
              { label: "Pass", value: passed.length, color: "#27ae60" },
              { label: "Fail", value: failed.length, color: "#e74c3c" },
            ].map((s, i) => (
              <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white" }}>
                <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
                <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "16px", border: "1px solid #ecf0f1", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#5d6d7e" }}>Pass Threshold:</span>
            <input type="number" min="0" max="100" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
              style={{ width: "80px", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none" }} />
            <span style={{ fontSize: "13px", color: "#7f8c8d" }}>/ 100</span>
            <button onClick={applyFilter} disabled={!!updating || candidates.length === 0}
              style={{ padding: "7px 18px", background: "#2980b9", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
              {updating ? "Applying..." : "Apply & Update Status"}
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "32px" }}>Loading...</p>
          ) : candidates.length === 0 ? (
            <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
              No scored candidates for this recruitment yet.
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    {["Candidate", "Email", "Written", "Interview", "Practical", "Total", "Result"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => {
                    const pass = c.totalScore >= threshold;
                    return (
                      <tr key={c.id} style={{ borderTop: "1px solid #f0f3f4", background: pass ? "white" : "#fff5f5" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{c.applicantName || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#7f8c8d", fontSize: "13px" }}>{c.applicantEmail}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{c.writtenScore ?? "—"}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{c.interviewScore ?? "—"}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{c.practicalScore ?? "—"}</td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={{ fontSize: "16px", fontWeight: "700", color: pass ? "#27ae60" : "#e74c3c" }}>{c.totalScore}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 12px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: pass ? "#dcfce7" : "#fee2e2", color: pass ? "#15803d" : "#b91c1c" }}>
                            {pass ? "PASS" : "FAIL"}
                          </span>
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
