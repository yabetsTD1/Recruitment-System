"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusConfig = {
  SUBMITTED: { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" },
  UNDER_REVIEW: { bg: "#fef3c7", color: "#92400e", label: "Under Review" },
  SHORTLISTED: { bg: "#dcfce7", color: "#15803d", label: "Shortlisted" },
  REJECTED: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  HIRED: { bg: "#ede9fe", color: "#5b21b6", label: "Hired" },
  PROMOTED: { bg: "#fce7f3", color: "#9d174d", label: "Promoted" },
};

export default function RegisteredCandidatesPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
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
    setSearch("");
    setFilterStatus("All");
    setLoading(true);
    api.get("/recruitments/internal-applications")
      .then(res => setCandidates(res.data.filter(a => String(a.recruitmentId) === String(r.id))))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/recruitments/applications/${id}/status`, { status });
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = candidates.filter(c =>
    (filterStatus === "All" || c.status === filterStatus) &&
    (c.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
      c.applicantEmail?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Registered Candidates</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Employees who applied for a specific internal vacancy</p>
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
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to view its registered candidates.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
            {[
              { label: "Total Applied", value: candidates.length, color: "#2980b9" },
              { label: "Under Review", value: candidates.filter(c => c.status === "UNDER_REVIEW").length, color: "#e67e22" },
              { label: "Shortlisted", value: candidates.filter(c => c.status === "SHORTLISTED").length, color: "#27ae60" },
              { label: "Rejected", value: candidates.filter(c => c.status === "REJECTED").length, color: "#e74c3c" },
            ].map((s, i) => (
              <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "14px 16px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                <p style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
                <p style={{ fontSize: "12px", margin: 0, opacity: 0.9 }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", border: "1px solid #ecf0f1", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", width: "220px" }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none" }}>
              <option value="All">All Statuses</option>
              {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span style={{ marginLeft: "auto", fontSize: "13px", color: "#7f8c8d" }}>{filtered.length} candidates</span>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#7f8c8d", padding: "32px" }}>Loading...</p>
          ) : (
            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    {["Candidate", "Email", "Batch Code", "Applied Date", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>No candidates found.</td></tr>
                  ) : filtered.map(c => {
                    const sc = statusConfig[c.status] || statusConfig.SUBMITTED;
                    return (
                      <tr key={c.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{c.applicantName || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#7f8c8d", fontSize: "13px" }}>{c.applicantEmail}</td>
                        <td style={{ padding: "12px 16px", color: "#2980b9", fontSize: "13px", fontWeight: "600" }}>{c.batchCode || `#${c.recruitmentId}`}</td>
                        <td style={{ padding: "12px 16px", color: "#7f8c8d", fontSize: "13px" }}>{c.appliedAt}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
                            disabled={updating === c.id}
                            style={{ padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "12px", outline: "none", cursor: "pointer" }}>
                            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
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
