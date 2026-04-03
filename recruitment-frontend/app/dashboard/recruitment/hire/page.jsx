"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function HireCandidatesPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [passMark, setPassMark] = useState(60);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState("");

  // Per-row hire date and branch
  const [hireDates, setHireDates] = useState({});
  const [branches, setBranches] = useState({});

  // Bottom form
  const [approverRemark, setApproverRemark] = useState("");
  const [hireDateFrom, setHireDateFrom] = useState("");
  const [processedBy, setProcessedBy] = useState("");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const name = payload.sub || payload.name || "";
        setCurrentUser(name);
        setProcessedBy(name);
      }
    } catch {}
  }, []);

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
    setError("");
    setHireDates({});
    setBranches({});
    Promise.all([
      api.get(`/recruitments/${r.id}/applications`),
      api.get(`/recruitments/${r.id}/exam-results`).catch(() => ({ data: [] })),
      api.get(`/recruitments/${r.id}/pass-mark`).catch(() => ({ data: { passMark: 60 } }))
    ])
      .then(([appsRes, resultsRes, pmRes]) => {
        // Show HIRED candidates
        setApplications(appsRes.data.filter(a => a.status === "HIRED"));
        setExamResults(resultsRes.data);
        setPassMark(pmRes.data?.passMark ?? 60);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load data"); setLoading(false); });
  };

  const getExamTotal = (appId) => {
    const results = examResults.filter(r => r.applicationId === appId);
    if (results.length === 0) return null;
    return results.reduce((sum, r) => sum + (r.resultScore || 0), 0);
  };

  const handleSave = () => {
    if (!hireDateFrom) { setError("Please enter Hire Date From"); return; }
    if (applications.length === 0) { setError("No hired candidates to process"); return; }
    setSaving(true);
    setSuccess("Hire records saved successfully");
    setSaving(false);
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Hire Candidates</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            Requested Lists = (<span style={{ color: "#3b82f6", fontWeight: "700" }}>{applications.length}</span>)
          </p>
        </div>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{success}</div>}

      {/* Recruitment Selector */}
      <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Batch Code / Job Title</label>
            <input value={recSearch} onChange={e => setRecSearch(e.target.value)}
              onFocus={() => setDropOpen(true)} onBlur={() => setTimeout(() => setDropOpen(false), 150)}
              placeholder="Search by batch code or job title..."
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
            {dropOpen && (
              <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", maxHeight: "200px", overflowY: "auto", background: "white", position: "relative", zIndex: 10 }}>
                {searching ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>Searching...</p>
                  : recruitments.filter(r => {
                      const q = recSearch.toLowerCase().trim();
                      if (!q) return true;
                      return (r.batchCode || "").toLowerCase().includes(q) || (r.jobTitle || "").toLowerCase().includes(q);
                    }).length === 0
                    ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>No results</p>
                  : recruitments.filter(r => {
                      const q = recSearch.toLowerCase().trim();
                      if (!q) return true;
                      return (r.batchCode || "").toLowerCase().includes(q) || (r.jobTitle || "").toLowerCase().includes(q);
                    }).map(r => (
                    <div key={r.id} onMouseDown={() => selectRec(r)}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <span style={{ fontWeight: "700", color: "#2980b9" }}>{r.batchCode || `#${r.id}`}</span>
                      <span style={{ fontWeight: "600", color: "#2c3e50", marginLeft: "10px" }}>{r.jobTitle}</span>
                      <span style={{ color: "#9ca3af", marginLeft: "8px", fontSize: "11px" }}>({r.status})</span>
                    </div>
                  ))}
              </div>
            )}
            {selectedRec && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2980b9" }}>{selectedRec.batchCode || `#${selectedRec.id}`}</span>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#0369a1" }}>{selectedRec.jobTitle}</span>
                <button onMouseDown={() => { setSelectedRec(null); setApplications([]); setExamResults([]); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Required Job Type</label>
            <input value={selectedRec?.jobTitle || ""} readOnly placeholder="--Select One--"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", background: "#f9fafb", boxSizing: "border-box" }} />
          </div>
        </div>
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to view hired candidates.</p>
        </div>
      ) : loading ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#6b7280", border: "1px solid #ecf0f1" }}>Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Hired Candidates", value: applications.length, color: "#10b981" },
              { label: "Vacancy Required", value: selectedRec.vacancyNumber || 0, color: "#3b82f6" },
              { label: "Pass Mark", value: passMark, color: "#8b5cf6" },
            ].map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: "32px", fontWeight: "700", color: s.color, margin: 0 }}>{s.value}</p>
                <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>{s.label}</p>
              </div>
            ))}
          </div>
          {/* Candidates Table */}
          <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "auto", marginBottom: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                <tr>
                  {["No", "ID", "Name", "Graduated From", "Nation", "Gender", "Experience", "Total", "Hire Date", "Branch", "Hire Candidate"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                      No records found.
                    </td>
                  </tr>
                ) : applications.map((app, idx) => {
                  const examTotal = getExamTotal(app.id);
                  return (
                    <tr key={app.id} style={{ borderTop: "1px solid #f9fafb" }}>
                      <td style={td}>{idx + 1}</td>
                      <td style={td}>{app.id}</td>
                      <td style={{ ...td, fontWeight: "600", color: "#1f2937" }}>{app.applicantName}</td>
                      <td style={td}>{app.graduatedFrom || "—"}</td>
                      <td style={td}>{app.nation || "—"}</td>
                      <td style={td}>{app.applicantGender || "—"}</td>
                      <td style={td}>{app.experienceYears ? `${app.experienceYears}y` : "—"}</td>
                      <td style={{ ...td, fontWeight: "700", color: examTotal !== null ? (examTotal >= passMark ? "#065f46" : "#b91c1c") : "#9ca3af" }}>
                        {examTotal !== null ? examTotal.toFixed(2) : "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <input type="date" value={hireDates[app.id] || ""}
                          onChange={e => setHireDates(p => ({ ...p, [app.id]: e.target.value }))}
                          style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px" }} />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <input type="text" value={branches[app.id] || ""} placeholder="Branch"
                          onChange={e => setBranches(p => ({ ...p, [app.id]: e.target.value }))}
                          style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px", width: "100px" }} />
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: "#d1fae5", color: "#065f46" }}>
                          Hired
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Approval Form */}
          <div style={{ background: "white", borderRadius: "8px", padding: "20px 24px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>Approved By</label>
                <div style={{ padding: "10px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>
                  {currentUser || "Current User"}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>Hire Date From</label>
                <input type="date" value={hireDateFrom} onChange={e => setHireDateFrom(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>Approver Remark</label>
                <textarea value={approverRemark} onChange={e => setApproverRemark(e.target.value)} rows={3}
                  placeholder="Enter remark..."
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>Processed By</label>
                <div style={{ padding: "10px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>
                  {processedBy || "Current User"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: "12px 48px", background: saving ? "#9ca3af" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const td = {
  padding: "10px 14px",
  fontSize: "13px",
  color: "#4b5563",
};
