"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusColor = {
  SUBMITTED:    { background: "#fef3c7", color: "#92400e" },
  UNDER_REVIEW: { background: "#dbeafe", color: "#1d4ed8" },
  SHORTLISTED:  { background: "#d1fae5", color: "#065f46" },
  REJECTED:     { background: "#fee2e2", color: "#b91c1c" },
  HIRED:        { background: "#ede9fe", color: "#5b21b6" },
};

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ minWidth: "130px", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "#1f2937", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function ApplicantModal({ app, onClose }) {
  if (!app) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={onClose}>
      <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #2980b9, #8e44ad)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px" }}>
                {(app.applicantName || "?")[0].toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#1f2937" }}>{app.applicantName || "—"}</h3>
                <span style={{ fontSize: "11px", background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: "10px", fontWeight: "600" }}>
                  {app.applicantType || "EXTERNAL"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>

        {/* Status badge */}
        <div style={{ padding: "12px 24px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Applied for:</span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>{app.jobTitle}</span>
          <span style={{ marginLeft: "auto", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", ...(statusColor[app.status] || {}) }}>
            {app.status}
          </span>
        </div>

        {/* Details */}
        <div style={{ padding: "16px 24px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contact Information</p>
          <DetailRow label="Email" value={app.applicantEmail} />
          <DetailRow label="Phone" value={app.applicantPhone} />
          <DetailRow label="Location" value={app.applicantLocation} />
          <DetailRow label="Gender" value={app.applicantGender} />

          {(app.applicantGithub || app.applicantLinkedin) && (
            <>
              <p style={{ margin: "16px 0 12px", fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Online Profiles</p>
              {app.applicantGithub && (
                <div style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ minWidth: "130px", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>GitHub</span>
                  <a href={app.applicantGithub} target="_blank" rel="noreferrer" style={{ fontSize: "14px", color: "#2980b9", wordBreak: "break-all" }}>{app.applicantGithub}</a>
                </div>
              )}
              {app.applicantLinkedin && (
                <div style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ minWidth: "130px", fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px" }}>LinkedIn</span>
                  <a href={app.applicantLinkedin} target="_blank" rel="noreferrer" style={{ fontSize: "14px", color: "#2980b9", wordBreak: "break-all" }}>{app.applicantLinkedin}</a>
                </div>
              )}
            </>
          )}

          <p style={{ margin: "16px 0 12px", fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Application Details</p>
          <DetailRow label="Applied At" value={app.appliedAt ? app.appliedAt.slice(0, 10) : "—"} />
          <DetailRow label="Application ID" value={`#${app.id}`} />
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", textAlign: "right" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", background: "#f3f4f6", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px", color: "#374151" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FilterCandidatesPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      api.get(recSearch.trim() ? `/recruitments?search=${encodeURIComponent(recSearch)}` : "/recruitments")
        .then(r => setRecruitments(r.data.filter(rec => ["POSTED", "APPROVED", "CLOSED"].includes(rec.status))))
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
    api.get(`/recruitments/${r.id}/applications`)
      .then(res => { setApplications(res.data); setLoading(false); })
      .catch(() => { setError("Failed to load applications"); setLoading(false); });
  };

  const updateStatus = (appId, status) => {
    api.put(`/recruitments/applications/${appId}/status`, { status }).then(() => {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      if (selectedApp?.id === appId) setSelectedApp(prev => ({ ...prev, status }));
    }).catch(() => setError("Failed to update status"));
  };

  const filtered = statusFilter === "ALL" ? applications : applications.filter(a => a.status === statusFilter);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Filter Candidates</h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>View and manage all candidates with status filtering</p>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{error}</div>}

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
                  <span style={{ color: "#9ca3af", marginLeft: "8px" }}>{r.department}</span>
                  <span style={{ color: "#9ca3af", marginLeft: "8px", fontSize: "11px" }}>({r.status})</span>
                </div>
              ))}
          </div>
        )}
        {selectedRec && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#0369a1" }}>{selectedRec.jobTitle}</span>
            <span style={{ fontSize: "12px", color: "#7f8c8d" }}>{selectedRec.department}</span>
            <button onMouseDown={() => { setSelectedRec(null); setApplications([]); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to view its candidates.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "8px 14px", border: "2px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", outline: "none" }}>
              {["ALL", "SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", "HIRED"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              { label: "Total", value: applications.length, color: "#3b82f6" },
              { label: "Submitted", value: applications.filter(a => a.status === "SUBMITTED").length, color: "#f59e0b" },
              { label: "Shortlisted", value: applications.filter(a => a.status === "SHORTLISTED").length, color: "#10b981" },
              { label: "Hired", value: applications.filter(a => a.status === "HIRED").length, color: "#8b5cf6" },
              { label: "Rejected", value: applications.filter(a => a.status === "REJECTED").length, color: "#ef4444" },
            ].map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: "28px", fontWeight: "700", color: s.color, margin: 0 }}>{s.value}</p>
                <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>No candidates found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                  <tr>
                    {["Candidate Name", "Email", "Applied At", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} style={{ borderTop: "1px solid #f9fafb" }}>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1f2937" }}>{row.applicantName}</td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.applicantEmail}</td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.appliedAt ? row.appliedAt.slice(0, 10) : "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...(statusColor[row.status] || {}) }}>{row.status}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {/* View Details button — always visible */}
                          <button onClick={() => setSelectedApp(row)}
                            style={{ padding: "5px 12px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>
                            View Details
                          </button>
                          {row.status !== "HIRED" && row.status !== "REJECTED" && (
                            <>
                              {row.status !== "SHORTLISTED" && (
                                <button onClick={() => updateStatus(row.id, "SHORTLISTED")}
                                  style={{ padding: "5px 12px", background: "#d1fae5", color: "#065f46", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>
                                  Shortlist
                                </button>
                              )}
                              <button onClick={() => updateStatus(row.id, "REJECTED")}
                                style={{ padding: "5px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <ApplicantModal app={selectedApp} onClose={() => setSelectedApp(null)} />
    </div>
  );
}
