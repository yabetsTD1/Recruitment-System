"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const selectionStatusStyle = {
  SHORTLISTED: { background: "#d1fae5", color: "#065f46" },
  REJECTED:    { background: "#fee2e2", color: "#b91c1c" },
  SUBMITTED:   { background: "#fef3c7", color: "#92400e" },
  UNDER_REVIEW:{ background: "#dbeafe", color: "#1d4ed8" },
  HIRED:       { background: "#ede9fe", color: "#5b21b6" },
};

const selectionLabel = {
  SHORTLISTED: "Selected",
  REJECTED: "Rejected",
  SUBMITTED: "Pending",
  UNDER_REVIEW: "Under Review",
  HIRED: "Hired",
};

export default function FilterCandidatesPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchOpen, setBatchOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [passMark, setPassMark] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filter criteria state
  const [criteria, setCriteria] = useState({
    graduatedFrom: "",
    gender: "",
    nation: "",
    physicalDisability: "",
    minGpa: "",
    minExperience: "",
  });

  // Inline column filters
  const [colFilter, setColFilter] = useState({
    graduatedFrom: "",
    gender: "",
    nation: "",
  });

  useEffect(() => {
    api.get("/recruitments")
      .then(r => setRecruitments(r.data.filter(rec => ["POSTED", "APPROVED", "CLOSED"].includes(rec.status))))
      .catch(() => {});
  }, []);

  const loadRec = (r) => {
    setSelectedRec(r);
    setBatchSearch("");
    setBatchOpen(false);
    setLoading(true);
    setSelectedRows([]);
    Promise.all([
      api.get(`/recruitments/${r.id}/applications`),
      api.get(`/recruitments/${r.id}/exam-results`).catch(() => ({ data: [] })),
      api.get(`/recruitments/${r.id}/pass-mark`).catch(() => ({ data: { passMark: 60 } }))
    ])
      .then(([appsRes, resultsRes, pmRes]) => {
        setApplications(appsRes.data);
        setFilteredApps(appsRes.data);
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

  const displayFiltered = () => {
    const params = new URLSearchParams();
    if (criteria.minGpa) params.append("minGpa", criteria.minGpa);
    if (criteria.minExperience) params.append("minExperience", criteria.minExperience);
    if (criteria.gender) params.append("gender", criteria.gender);
    if (criteria.nation) params.append("nation", criteria.nation);
    if (criteria.graduatedFrom) params.append("graduatedFrom", criteria.graduatedFrom);
    if (criteria.physicalDisability) params.append("physicalDisability", criteria.physicalDisability);

    setLoading(true);
    api.get(`/recruitments/${selectedRec.id}/applications/filter?${params.toString()}`)
      .then(res => { setFilteredApps(res.data); setShowCriteriaModal(false); setLoading(false); })
      .catch(() => { setError("Failed to filter"); setLoading(false); });
  };

  const displayAll = () => {
    setFilteredApps(applications);
    setCriteria({ graduatedFrom: "", gender: "", nation: "", physicalDisability: "", minGpa: "", minExperience: "" });
    setColFilter({ graduatedFrom: "", gender: "", nation: "" });
  };

  // Apply inline column filters on top of filteredApps
  const displayed = filteredApps.filter(app => {
    if (colFilter.graduatedFrom && !(app.graduatedFrom || "").toLowerCase().includes(colFilter.graduatedFrom.toLowerCase())) return false;
    if (colFilter.gender && !(app.applicantGender || "").toLowerCase().includes(colFilter.gender.toLowerCase())) return false;
    if (colFilter.nation && !(app.nation || "").toLowerCase().includes(colFilter.nation.toLowerCase())) return false;
    return true;
  });

  const updateStatus = (appId, status) => {
    api.put(`/recruitments/applications/${appId}/status`, { status })
      .then(() => {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
        setFilteredApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
        setSuccess(status === "SHORTLISTED" ? "Candidate selected" : "Candidate rejected");
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(() => setError("Failed to update status"));
  };

  const bulkSelect = () => {
    if (selectedRows.length === 0) return;
    Promise.all(selectedRows.map(id => api.put(`/recruitments/applications/${id}/status`, { status: "SHORTLISTED" })))
      .then(() => {
        setApplications(prev => prev.map(a => selectedRows.includes(a.id) ? { ...a, status: "SHORTLISTED" } : a));
        setFilteredApps(prev => prev.map(a => selectedRows.includes(a.id) ? { ...a, status: "SHORTLISTED" } : a));
        setSelectedRows([]);
        setSuccess(`${selectedRows.length} candidate(s) selected`);
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(() => setError("Failed to update"));
  };

  const toggleRow = (id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedRows(selectedRows.length === displayed.length ? [] : displayed.map(a => a.id));

  const selectedCount = filteredApps.filter(a => a.status === "SHORTLISTED").length;
  const rejectedCount = filteredApps.filter(a => a.status === "REJECTED").length;

  const filteredRecruitments = recruitments.filter(r =>
    (r.batchCode || r.jobTitle || "").toLowerCase().includes(batchSearch.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Filter Candidates</h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>
          Selected candidates: <strong style={{ color: "#10b981" }}>{selectedCount}</strong>
        </p>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{success}</div>}

      {/* Top Controls */}
      <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
          {/* Batch Code */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Batch Code:</label>
            <div style={{ position: "relative" }}>
              <input value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
                onFocus={() => setBatchOpen(true)} onBlur={() => setTimeout(() => setBatchOpen(false), 150)}
                placeholder="--Select One--"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              {batchOpen && filteredRecruitments.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, border: "1px solid #d1d5db", borderRadius: "6px", background: "white", zIndex: 10, maxHeight: "200px", overflowY: "auto" }}>
                  {filteredRecruitments.map(r => (
                    <div key={r.id} onMouseDown={() => loadRec(r)}
                      style={{ padding: "9px 12px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #f3f4f6" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <span style={{ fontWeight: "600" }}>{r.batchCode || "—"}</span>
                      <span style={{ color: "#9ca3af", marginLeft: "8px" }}>{r.jobTitle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedRec && (
              <div style={{ marginTop: "6px", fontSize: "12px", color: "#0369a1", fontWeight: "600" }}>
                {selectedRec.batchCode || selectedRec.jobTitle}
              </div>
            )}
          </div>

          {/* Required Job Type */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Required Job Type:</label>
            <input value={selectedRec?.jobTitle || ""} readOnly placeholder="--Select One--"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", background: "#f9fafb", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setShowCriteriaModal(true)} disabled={!selectedRec}
            style={{ padding: "9px 20px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: selectedRec ? "pointer" : "not-allowed", opacity: selectedRec ? 1 : 0.5 }}>
            Set Criteria
          </button>
          <button onClick={displayFiltered} disabled={!selectedRec}
            style={{ padding: "9px 20px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: selectedRec ? "pointer" : "not-allowed", opacity: selectedRec ? 1 : 0.5 }}>
            Display Filtered Result
          </button>
          <button onClick={displayAll} disabled={!selectedRec}
            style={{ padding: "9px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: selectedRec ? "pointer" : "not-allowed", opacity: selectedRec ? 1 : 0.5 }}>
            Display All
          </button>
          {selectedRows.length > 0 && (
            <button onClick={bulkSelect}
              style={{ padding: "9px 20px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", marginLeft: "auto" }}>
              Select {selectedRows.length} Candidate(s)
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {selectedRec && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total", value: filteredApps.length, color: "#3b82f6" },
            { label: "Selected", value: selectedCount, color: "#10b981" },
            { label: "Rejected", value: rejectedCount, color: "#ef4444" },
          ].map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: "32px", fontWeight: "700", color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Candidates Table */}
      <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "auto" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : !selectedRec ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Select a recruitment above.</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>No records found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
              <tr>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                  <input type="checkbox" checked={selectedRows.length === displayed.length && displayed.length > 0}
                    onChange={toggleAll} style={{ cursor: "pointer" }} />
                </th>
                <th style={thStyle}>No</th>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={{ ...thStyle, minWidth: "140px" }}>
                  <div>Graduated From</div>
                  <input value={colFilter.graduatedFrom} onChange={e => setColFilter(p => ({ ...p, graduatedFrom: e.target.value }))}
                    placeholder="Filter..." style={colFilterInput} />
                </th>
                <th style={{ ...thStyle, minWidth: "100px" }}>
                  <div>Gender</div>
                  <select value={colFilter.gender} onChange={e => setColFilter(p => ({ ...p, gender: e.target.value }))} style={colFilterInput}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </th>
                <th style={{ ...thStyle, minWidth: "100px" }}>
                  <div>Nation</div>
                  <input value={colFilter.nation} onChange={e => setColFilter(p => ({ ...p, nation: e.target.value }))}
                    placeholder="***" style={colFilterInput} />
                </th>
                <th style={thStyle}>Physical Disability</th>
                <th style={thStyle}>CGPA</th>
                <th style={thStyle}>Experience</th>
                <th style={thStyle}>Total Result</th>
                <th style={thStyle}>Selection Status</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((app, idx) => {
                const examTotal = getExamTotal(app.id);
                return (
                  <tr key={app.id} style={{ borderTop: "1px solid #f9fafb", background: selectedRows.includes(app.id) ? "#f0f9ff" : "white" }}>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <input type="checkbox" checked={selectedRows.includes(app.id)}
                        onChange={() => toggleRow(app.id)} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>{app.id}</td>
                    <td style={{ ...tdStyle, fontWeight: "600", color: "#1f2937" }}>{app.applicantName}</td>
                    <td style={tdStyle}>{app.graduatedFrom || "—"}</td>
                    <td style={tdStyle}>{app.applicantGender || "—"}</td>
                    <td style={tdStyle}>{app.nation || "—"}</td>
                    <td style={tdStyle}>{app.physicalDisability || "None"}</td>
                    <td style={tdStyle}>{app.gpa ?? "—"}</td>
                    <td style={tdStyle}>{app.experienceYears ? `${app.experienceYears}y` : "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: "700", color: examTotal !== null ? (examTotal >= passMark ? "#065f46" : "#b91c1c") : "#9ca3af" }}>
                      {examTotal !== null ? examTotal.toFixed(2) : "—"}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...(selectionStatusStyle[app.status] || {}) }}>
                        {selectionLabel[app.status] || app.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {app.status !== "SHORTLISTED" && app.status !== "HIRED" && (
                          <button onClick={() => updateStatus(app.id, "SHORTLISTED")}
                            style={{ padding: "5px 12px", background: "#d1fae5", color: "#065f46", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>
                            Select
                          </button>
                        )}
                        {app.status !== "REJECTED" && app.status !== "HIRED" && (
                          <button onClick={() => updateStatus(app.id, "REJECTED")}
                            style={{ padding: "5px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Set Criteria Modal */}
      {showCriteriaModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", width: "90%", maxWidth: "560px" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700", color: "#1f2937" }}>Set Filter Criteria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Minimum GPA", key: "minGpa", type: "number", placeholder: "e.g. 3.0" },
                { label: "Min Experience (years)", key: "minExperience", type: "number", placeholder: "e.g. 2" },
                { label: "Graduated From", key: "graduatedFrom", type: "text", placeholder: "University name" },
                { label: "Nation", key: "nation", type: "text", placeholder: "e.g. Ethiopian" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>{f.label}</label>
                  <input type={f.type} value={criteria[f.key]} placeholder={f.placeholder}
                    onChange={e => setCriteria(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Gender</label>
                <select value={criteria.gender} onChange={e => setCriteria(p => ({ ...p, gender: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box" }}>
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Physical Disability</label>
                <select value={criteria.physicalDisability} onChange={e => setCriteria(p => ({ ...p, physicalDisability: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box" }}>
                  <option value="">All</option>
                  <option value="None">None</option>
                  <option value="Visual">Visual</option>
                  <option value="Hearing">Hearing</option>
                  <option value="Physical">Physical</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCriteriaModal(false)}
                style={{ padding: "9px 22px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={displayFiltered}
                style={{ padding: "9px 22px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: "13px",
  color: "#4b5563",
};

const colFilterInput = {
  marginTop: "4px",
  width: "100%",
  padding: "3px 6px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "11px",
  boxSizing: "border-box",
};
