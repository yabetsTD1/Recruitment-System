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
                        {[...new Set(filteredApps.map(a => a.applicantGender).filter(Boolean))].map(g => <option key={g} value={g}>{g}</option>)}
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
    </div>
  );
}
