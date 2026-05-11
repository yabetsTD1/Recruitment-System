"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { ETHIOPIAN_NATIONS } from "@/data/ethiopianNations";

export default function FilterCandidatesExamPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [selectedApps, setSelectedApps] = useState([]);
  const [tableSearch, setTableSearch] = useState("");
  
  // Filter criteria (modal — only GPA and Experience)
  const [filters, setFilters] = useState({
    minGpa: "",
    minExperience: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  // Inline column dropdown filters
  const [colFilters, setColFilters] = useState({
    gender: "",
    nation: "",
    graduatedFrom: "",
  });
  const [viewingCandidate, setViewingCandidate] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const openViewDetails = async (row) => {
    setViewingCandidate(row);
    setCandidateDetails(null);
    setLoadingDetails(true);
    const email = encodeURIComponent(row.applicantEmail || "");
    try {
      const [eduRes, expRes, certRes, langRes, docRes] = await Promise.all([
        fetch(`${API}/public/applicant/education?email=${email}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/applicant/experience?email=${email}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/applicant/certification?email=${email}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/applicant/language?email=${email}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/applicant/document?email=${email}`).then(r => r.json()).catch(() => []),
      ]);
      setCandidateDetails({
        education: Array.isArray(eduRes) ? eduRes : [],
        experience: Array.isArray(expRes) ? expRes : [],
        certifications: Array.isArray(certRes) ? certRes : [],
        languages: Array.isArray(langRes) ? langRes : [],
        documents: Array.isArray(docRes) ? docRes : [],
      });
    } catch {
      setCandidateDetails({ education: [], experience: [], certifications: [], languages: [], documents: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

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
      .then(res => {
        const apps = res.data.filter(a => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW");
        setApplications(apps);
        setFilteredApps(apps);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load applications"); setLoading(false); });
  };

  const applyFilters = () => {
    if (!selectedRec) return;
    
    const params = new URLSearchParams();
    if (filters.minGpa) params.append("minGpa", filters.minGpa);
    if (filters.minExperience) params.append("minExperience", filters.minExperience);

    setLoading(true);
    api.get(`/recruitments/${selectedRec.id}/applications/filter?${params.toString()}`)
      .then(res => {
        setFilteredApps(res.data);
        setAppliedFilters({...filters});
        setShowCriteriaModal(false);
        setLoading(false);
      })
      .catch(() => { setError("Failed to apply filters"); setLoading(false); });
  };

  const clearFilters = () => {
    setFilters({ minGpa: "", minExperience: "" });
    setAppliedFilters({});
    setColFilters({ gender: "", nation: "", graduatedFrom: "" });
    setFilteredApps(applications);
    setShowCriteriaModal(false);
  };

  const updateStatus = (appId, status) => {
    api.put(`/recruitments/applications/${appId}/status`, { status }).then(() => {
      setApplications(prev => prev.filter(a => a.id !== appId));
      setFilteredApps(prev => prev.filter(a => a.id !== appId));
      setSelectedApps(prev => prev.filter(id => id !== appId));
    }).catch(() => setError("Failed to update status"));
  };

  const bulkAction = (status) => {
    if (selectedApps.length === 0) {
      alert("Please select candidates first");
      return;
    }
    if (!confirm(`${status === "SHORTLISTED" ? "Shortlist" : "Reject"} ${selectedApps.length} candidate(s)?`)) return;
    
    Promise.all(selectedApps.map(id => api.put(`/recruitments/applications/${id}/status`, { status })))
      .then(() => {
        setApplications(prev => prev.filter(a => !selectedApps.includes(a.id)));
        setFilteredApps(prev => prev.filter(a => !selectedApps.includes(a.id)));
        setSelectedApps([]);
      })
      .catch(() => setError("Failed to perform bulk action"));
  };

  const toggleSelect = (id) => {
    setSelectedApps(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedApps.length === filteredApps.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filteredApps.map(a => a.id));
    }
  };

  const statusStyle = { 
    SUBMITTED: { background: "#fef3c7", color: "#92400e" }, 
    UNDER_REVIEW: { background: "#dbeafe", color: "#1d4ed8" } 
  };

  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== "");

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Filter Candidates for Exam</h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>Review submitted applications and shortlist or reject candidates</p>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{error}</div>}

      {/* Recruitment Selector */}
      <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Recruitment (Batch Code / Job Title)</label>
        <input value={recSearch} onChange={e => setRecSearch(e.target.value)}
          onFocus={() => setDropOpen(true)} onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          placeholder="Search by batch code or job title..."
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box" }} />
        {dropOpen && (
          <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", maxHeight: "200px", overflowY: "auto", background: "white" }}>
            {searching ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>Searching...</p>
              : recruitments.filter(r => {
                  const q = recSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (r.batchCode || "").toLowerCase().includes(q) || (r.jobTitle || "").toLowerCase().includes(q);
                }).length === 0 ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>No results</p>
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
            <button onMouseDown={() => { setSelectedRec(null); setApplications([]); setFilteredApps([]); }}
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
          {/* Filter Controls */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button 
              onClick={() => setShowCriteriaModal(true)}
              style={{ 
                padding: "10px 20px", 
                background: hasActiveFilters ? "#3b82f6" : "#10b981", 
                color: "white", 
                border: "none", 
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              {hasActiveFilters ? "Modify Filters" : "Set Criteria"}
            </button>
            {hasActiveFilters && (
              <>
                <button 
                  onClick={clearFilters}
                  style={{ 
                    padding: "10px 20px", 
                    background: "#ef4444", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}
                >
                  Clear Filters
                </button>
                <div style={{ 
                  padding: "10px 16px", 
                  background: "#dbeafe", 
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#1e40af",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ fontWeight: "600" }}>Active Filters:</span>
                  {appliedFilters.minGpa && <span>GPA ≥ {appliedFilters.minGpa}</span>}
                  {appliedFilters.minExperience && <span>Exp ≥ {appliedFilters.minExperience}y</span>}
                </div>
              </>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedApps.length > 0 && (
            <div style={{ 
              background: "#f0f9ff", 
              padding: "12px 16px", 
              borderRadius: "8px", 
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#0369a1" }}>
                {selectedApps.length} candidate(s) selected
              </span>
              <button 
                onClick={() => bulkAction("SHORTLISTED")}
                style={{ 
                  padding: "6px 16px", 
                  background: "#10b981", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px"
                }}
              >
                Shortlist Selected
              </button>
              <button 
                onClick={() => bulkAction("REJECTED")}
                style={{ 
                  padding: "6px 16px", 
                  background: "#ef4444", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "13px"
                }}
              >
                Reject Selected
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Total Pending", value: applications.length, color: "#3b82f6" },
              { label: "Filtered Results", value: filteredApps.length, color: "#10b981" },
              { label: "Selected", value: selectedApps.length, color: "#8b5cf6" },
            ].map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: "32px", fontWeight: "700", color: s.color, margin: 0 }}>{s.value}</p>
                <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
            {/* Candidate search */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "8px", background: "#f8f9fa" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Search candidate by name..." value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", background: "transparent", flex: 1 }} />
              {tableSearch && <button onClick={() => setTableSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "14px", padding: 0 }}>×</button>}
            </div>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                {hasActiveFilters ? "No candidates match the filter criteria." : "No pending applications for this recruitment."}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                  <tr>
                    <th style={{ padding: "14px 20px", textAlign: "left" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedApps.length === filteredApps.length && filteredApps.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Name</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                      <div>Gender</div>
                      <select value={colFilters.gender} onChange={e => setColFilters(f => ({ ...f, gender: e.target.value }))}
                        style={{ marginTop: "4px", width: "100%", padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontWeight: "400" }}>
                        <option value="">All</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>GPA</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Experience</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                      <div>Graduated From</div>
                      <input value={colFilters.graduatedFrom} onChange={e => setColFilters(f => ({ ...f, graduatedFrom: e.target.value }))}
                        placeholder="Filter..."
                        style={{ marginTop: "4px", width: "100%", padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontWeight: "400", boxSizing: "border-box" }} />
                    </th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                      <div>Nation</div>
                      <select value={colFilters.nation} onChange={e => setColFilters(f => ({ ...f, nation: e.target.value }))}
                        style={{ marginTop: "4px", width: "100%", padding: "4px 6px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "11px", fontWeight: "400" }}>
                        <option value="">All</option>
                        {ETHIOPIAN_NATIONS.map((n, i) => <option key={i} value={n}>{n}</option>)}
                      </select>
                    </th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Status</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.filter(row => {
                    if (tableSearch.trim() && !(row.applicantName || "").toLowerCase().includes(tableSearch.toLowerCase())) return false;
                    if (colFilters.gender && (row.applicantGender || "") !== colFilters.gender) return false;
                    if (colFilters.nation && (row.nation || "") !== colFilters.nation) return false;
                    if (colFilters.graduatedFrom && !(row.graduatedFrom || "").toLowerCase().includes(colFilters.graduatedFrom.toLowerCase())) return false;
                    return true;
                  }).map(row => (
                    <tr key={row.id} style={{ borderTop: "1px solid #f9fafb", background: selectedApps.includes(row.id) ? "#f0f9ff" : "white" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <input 
                          type="checkbox" 
                          checked={selectedApps.includes(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1f2937" }}>{row.applicantName}</td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.applicantGender || "—"}</td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.gpa || "—"}</td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.experienceYears ? `${row.experienceYears}y` : "—"}</td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.graduatedFrom || "—"}</td>
                      <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.nation || "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...(statusStyle[row.status] || {}) }}>{row.status}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => openViewDetails(row)}
                            style={{ padding: "6px 12px", background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                            View Details
                          </button>
                          <button onClick={() => updateStatus(row.id, "SHORTLISTED")}
                            style={{ padding: "6px 14px", background: "#d1fae5", color: "#065f46", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                            Shortlist
                          </button>
                          <button onClick={() => updateStatus(row.id, "REJECTED")}
                            style={{ padding: "6px 14px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                            Reject
                          </button>
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

      {/* Filter Criteria Modal */}
      {showCriteriaModal && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{ 
            background: "white", 
            borderRadius: "12px", 
            padding: "28px", 
            width: "90%", 
            maxWidth: "600px"
          }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>
              Set Filter Criteria
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                  Minimum GPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={filters.minGpa}
                  onChange={(e) => setFilters({ ...filters, minGpa: e.target.value })}
                  placeholder="e.g., 3.0"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                  Minimum Experience (years)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minExperience}
                  onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
                  placeholder="e.g., 2"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowCriteriaModal(false)}
                style={{ 
                  padding: "10px 24px", 
                  background: "#e5e7eb", 
                  color: "#374151", 
                  border: "none", 
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={applyFilters}
                style={{ 
                  padding: "10px 24px", 
                  background: "#3b82f6", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Candidate Details Modal */}
      {viewingCandidate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
          onClick={() => setViewingCandidate(null)}>
          <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "860px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: "12px 12px 0 0", position: "sticky", top: 0, zIndex: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white" }}>{viewingCandidate.applicantName}</h2>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{viewingCandidate.applicantEmail}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                  background: viewingCandidate.status === "SHORTLISTED" ? "#d1fae5" : viewingCandidate.status === "REJECTED" ? "#fee2e2" : "#fef3c7",
                  color: viewingCandidate.status === "SHORTLISTED" ? "#065f46" : viewingCandidate.status === "REJECTED" ? "#b91c1c" : "#92400e"
                }}>{viewingCandidate.status}</span>
                <button onClick={() => setViewingCandidate(null)}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: "20px", cursor: "pointer", borderRadius: "6px", padding: "4px 10px", lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              {loadingDetails ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#7f8c8d" }}>Loading candidate details...</div>
              ) : (
                <>
                  {/* Personal Info */}
                  <Section title="Personal Information" color="#2980b9">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        { label: "Full Name", value: viewingCandidate.applicantName },
                        { label: "Email", value: viewingCandidate.applicantEmail },
                        { label: "Gender", value: viewingCandidate.applicantGender },
                        { label: "Phone", value: viewingCandidate.phone },
                        { label: "Location", value: viewingCandidate.location },
                        { label: "Nation", value: viewingCandidate.nation },
                        { label: "GPA", value: viewingCandidate.gpa },
                        { label: "Experience (yrs)", value: viewingCandidate.experienceYears },
                        { label: "Graduated From", value: viewingCandidate.graduatedFrom },
                      ].filter(f => f.value).map(f => (
                        <InfoCard key={f.label} label={f.label} value={f.value} />
                      ))}
                    </div>
                  </Section>

                  {/* Education */}
                  <Section title="Education" color="#8b5cf6">
                    {!candidateDetails?.education?.length ? (
                      <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>No education records.</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>{["Institution", "Field of Study", "Level", "Start", "End", "Paid By"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700", color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: "11px" }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {candidateDetails.education.map((e, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{e.institution || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.fieldOfStudy || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.educationLevel || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.startDate || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.endDate || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.paidBy || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* Experience */}
                  <Section title="Work Experience" color="#06b6d4">
                    {!candidateDetails?.experience?.length ? (
                      <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>No experience records.</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>{["Job Title", "Institution", "Type", "Start", "End"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700", color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: "11px" }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {candidateDetails.experience.map((e, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{e.jobTitle || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.institution || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.employmentType || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.startDate || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{e.endDate || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* Certifications */}
                  <Section title="Licenses & Certifications" color="#f59e0b">
                    {!candidateDetails?.certifications?.length ? (
                      <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>No certification records.</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>{["License/Certification", "Institution", "Skills", "Start", "End"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700", color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: "11px" }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {candidateDetails.certifications.map((c, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{c.professionalLicense || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{c.institution || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{c.skills || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{c.startDate || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{c.endDate || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* Languages */}
                  <Section title="Language Proficiency" color="#ec4899">
                    {!candidateDetails?.languages?.length ? (
                      <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>No language records.</p>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>{["Language", "Reading", "Writing", "Speaking", "Listening"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: "700", color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: "11px" }}>{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {candidateDetails.languages.map((l, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "8px 10px", fontWeight: "600" }}>{l.language || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{l.reading || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{l.writing || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{l.speaking || "—"}</td>
                              <td style={{ padding: "8px 10px" }}>{l.listening || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </Section>

                  {/* Documents */}
                  <Section title="📄 Documents" color="#374151">
                    {!candidateDetails?.documents?.length ? (
                      <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>No documents uploaded.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {candidateDetails.documents.map((doc, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ fontSize: "22px" }}>
                                {(doc.fileType || "").includes("pdf") ? "📕" : (doc.fileType || "").includes("word") || (doc.fileName || "").endsWith(".docx") ? "📘" : "📄"}
                              </span>
                              <div>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>{doc.fileName || `Document ${i + 1}`}</p>
                                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                                  {doc.documentType && <span style={{ background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "4px", marginRight: "6px", fontWeight: "600" }}>{doc.documentType}</span>}
                                  {doc.fileType || ""}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <a
                                href={`${API}/public/applicant/document/${doc.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.fileName}
                                style={{ padding: "6px 14px", background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                ⬇ Download
                              </a>
                              <a
                                href={`${API}/public/applicant/document/${doc.id}/download?view=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ padding: "6px 14px", background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: "6px", textDecoration: "none", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                👁 View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button onClick={() => { updateStatus(viewingCandidate.id, "SHORTLISTED"); setViewingCandidate(null); }}
                      style={{ padding: "9px 20px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                      Shortlist
                    </button>
                    <button onClick={() => { updateStatus(viewingCandidate.id, "REJECTED"); setViewingCandidate(null); }}
                      style={{ padding: "9px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                      Reject
                    </button>
                    <button onClick={() => setViewingCandidate(null)}
                      style={{ padding: "9px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3 style={{ fontSize: "13px", fontWeight: "700", color: "white", margin: "0 0 10px 0", background: color, padding: "8px 14px", borderRadius: "6px", letterSpacing: "0.5px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: "6px", padding: "10px 12px" }}>
      <p style={{ margin: 0, fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "3px 0 0", fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>{String(value)}</p>
    </div>
  );
}
