"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function RecordResultPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [examCriteria, setExamCriteria] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [passMark, setPassMark] = useState(60);
  const [editingPassMark, setEditingPassMark] = useState(false);
  const [tempPassMark, setTempPassMark] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Search and record modal states
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const [resultScore, setResultScore] = useState("");
  const [criteriaScores, setCriteriaScores] = useState({});
  const [recording, setRecording] = useState(false);
  
  // Overall status management
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppForStatus, setSelectedAppForStatus] = useState(null);
  const [overallStatus, setOverallStatus] = useState("PASS");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [passedIds, setPassedIds] = useState(null); // null = show all, array = filter to these IDs

  // Read passed IDs from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("recordResultSelectedIds");
    if (stored) {
      try {
        setPassedIds(JSON.parse(stored));
      } catch { setPassedIds(null); }
      sessionStorage.removeItem("recordResultSelectedIds");
    }
  }, []);

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
    Promise.all([
      api.get(`/recruitments/${r.id}/applications`),
      api.get(`/recruitments/${r.id}/exam-criteria`),
      api.get(`/recruitments/${r.id}/exam-results`).catch(() => ({ data: [] })),
      api.get(`/recruitments/${r.id}/pass-mark`).catch(() => ({ data: { passMark: 60 } }))
    ])
      .then(([appsRes, criteriaRes, resultsRes, passMarkRes]) => {
        setApplications(appsRes.data);
        setExamCriteria(criteriaRes.data);
        setExamResults(resultsRes.data);
        const pm = passMarkRes.data?.passMark ?? 60;
        setPassMark(pm);
        setTempPassMark(pm);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load data"); setLoading(false); });
  };

  useEffect(() => {
    if (applications.length > 0) {
      const search = candidateSearch.toLowerCase().trim();
      if (search) {
        setFilteredCandidates(
          applications.filter(app =>
            (app.applicantName || "").toLowerCase().includes(search) ||
            (app.applicantEmail || "").toLowerCase().includes(search)
          )
        );
      } else {
        // Show all candidates when search is empty
        setFilteredCandidates(applications);
      }
    } else {
      setFilteredCandidates([]);
    }
  }, [candidateSearch, applications]);

  const openRecordModal = () => {
    if (!selectedRec) {
      setError("Please select a recruitment first");
      return;
    }
    if (examCriteria.length === 0) {
      setError("No exam criteria found for this recruitment");
      return;
    }
    setCandidateSearch("");
    setFilteredCandidates(passedIds ? applications.filter(a => passedIds.includes(a.id)) : applications); // show only passed candidates
    setShowRecordModal(true);
    setError("");
    setSuccess("");
  };

  const closeRecordModal = () => {
    setShowRecordModal(false);
    setCandidateSearch("");
    setFilteredCandidates([]);
    setSelectedCandidate(null);
    setSelectedCriteria(null);
    setResultScore("");
    setCriteriaScores({});
  };

  const selectCandidate = (app) => {
    setSelectedCandidate(app);
    setCandidateSearch("");
    setFilteredCandidates([]);
    // Pre-fill existing scores for this candidate
    const existing = {};
    examCriteria.forEach(c => {
      const r = examResults.find(er => er.applicationId === app.id && er.criteriaId === c.id);
      if (r) existing[c.id] = String(r.resultScore);
    });
    setCriteriaScores(existing);
  };

  const recordResult = () => {
    if (!selectedCandidate) {
      setError("Please select a candidate");
      return;
    }

    // Validate all criteria have scores
    const missing = examCriteria.filter(c => !criteriaScores[c.id] && criteriaScores[c.id] !== 0);
    if (missing.length > 0) {
      setError(`Please fill scores for: ${missing.map(c => c.criteriaName).join(", ")}`);
      return;
    }

    // Validate score ranges
    for (const c of examCriteria) {
      const s = parseFloat(criteriaScores[c.id]);
      if (isNaN(s) || s < 0 || s > (c.weight ?? 100)) {
        setError(`Score for "${c.criteriaName}" must be between 0 and ${c.weight ?? 100}`);
        return;
      }
    }

    setRecording(true);
    setError("");

    // Submit all criteria scores sequentially
    const submissions = examCriteria.map(c => {
      const score = parseFloat(criteriaScores[c.id]);
      const computedStatus = score >= ((c.weight ?? 100) * passMark / 100) ? "PASS" : "FAIL";
      return api.post("/recruitments/exam-results", {
        applicationId: selectedCandidate.id,
        criteriaId: c.id,
        resultScore: score,
        status: computedStatus,
      });
    });

    Promise.all(submissions)
      .then(() => {
        setSuccess(`All results recorded for ${selectedCandidate.applicantName}`);
        return api.get(`/recruitments/${selectedRec.id}/exam-results`);
      })
      .then(res => {
        setExamResults(res.data);
        closeRecordModal();
        setTimeout(() => setSuccess(""), 5000);
      })
      .catch(e => {
        const msg = e?.response?.data?.message;
        setError(msg || "Failed to record result");
      })
      .finally(() => setRecording(false));
  };

  const getResultForApplication = (appId, criteriaId) => {
    return examResults.find(r => r.applicationId === appId && r.criteriaId === criteriaId);
  };

  const calculateWeightedTotal = (appId) => {
    const results = examResults.filter(r => r.applicationId === appId);
    if (results.length === 0) return null;
    
    let total = 0;
    results.forEach(r => { total += r.resultScore || 0; });
    return total;
  };

  const savePassMark = () => {
    if (!selectedRec) return;
    
    const mark = parseFloat(tempPassMark);
    if (isNaN(mark) || mark < 0 || mark > 100) {
      setError("Pass mark must be between 0 and 100");
      return;
    }

    api.put(`/recruitments/${selectedRec.id}/pass-mark`, { passMark: mark })
      .then(() => {
        setPassMark(mark);
        setEditingPassMark(false);
        setSuccess("Pass mark updated successfully");
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch(() => setError("Failed to update pass mark"));
  };

  const openStatusModal = (app) => {
    setSelectedAppForStatus(app);
    const weightedTotal = calculateWeightedTotal(app.id);
    setOverallStatus(weightedTotal !== null && weightedTotal >= passMark ? "PASS" : "FAIL");
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedAppForStatus(null);
    setOverallStatus("PASS");
  };

  const updateOverallStatus = () => {
    if (!selectedAppForStatus) return;
    
    setUpdatingStatus(true);
    api.put(`/recruitments/applications/${selectedAppForStatus.id}/status`, {
      status: overallStatus === "PASS" ? "SHORTLISTED" : "REJECTED"
    })
      .then(() => {
        setSuccess(`Overall status updated: ${selectedAppForStatus.applicantName} - ${overallStatus}`);
        // Refresh applications
        return api.get(`/recruitments/${selectedRec.id}/applications`);
      })
      .then(res => {
        setApplications(res.data);
        closeStatusModal();
        setTimeout(() => setSuccess(""), 5000);
      })
      .catch(() => setError("Failed to update status"))
      .finally(() => setUpdatingStatus(false));
  };

  const statusColor = {
    PASS: { background: "#d1fae5", color: "#065f46" },
    FAIL: { background: "#fee2e2", color: "#b91c1c" },
  };

  return (
    <div>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Record Result</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>Record exam results for candidates</p>
        </div>
        {selectedRec && (
          <button onClick={openRecordModal}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>
            + Record Result
          </button>
        )}
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{success}</div>}

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
            <button onMouseDown={() => { setSelectedRec(null); setApplications([]); setExamCriteria([]); setExamResults([]); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to view and record exam results.</p>
        </div>
      ) : loading ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
      ) : examCriteria.length === 0 ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#9ca3af" }}>
          No exam criteria found. Please add exam criteria in the Degree of Exam page first.
        </div>
      ) : (
        <>
          {/* Passed candidates filter banner */}
          {passedIds && (
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#0369a1" }}>
                📋 Showing <strong>{passedIds.length}</strong> candidate{passedIds.length !== 1 ? "s" : ""} passed from View Registered Candidates
              </span>
              <button onClick={() => setPassedIds(null)}
                style={{ marginLeft: "auto", padding: "5px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                Show All
              </button>
            </div>
          )}

          {/* Pass Mark Setting */}
          <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Pass Mark Threshold:</label>
              {editingPassMark ? (
                <>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={tempPassMark}
                    onChange={e => setTempPassMark(e.target.value)}
                    style={{ width: "100px", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                  />
                  <button onClick={savePassMark}
                    style={{ padding: "6px 16px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
                    Save
                  </button>
                  <button onClick={() => { setEditingPassMark(false); setTempPassMark(passMark); }}
                    style={{ padding: "6px 16px", background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "18px", fontWeight: "700", color: "#3b82f6" }}>{passMark}</span>
                  <button onClick={() => setEditingPassMark(true)}
                    style={{ padding: "6px 16px", background: "#f0f9ff", color: "#3b82f6", border: "1px solid #bae6fd", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
                    Edit
                  </button>
                </>
              )}
              <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "auto" }}>
                Candidates with weighted total ≥ {passMark} will pass
              </span>
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "auto" }}>
          {/* Candidate search */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "8px", background: "#f8f9fa" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search candidate by name..." value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: "13px", background: "transparent", flex: 1 }} />
            {tableSearch && <button onClick={() => setTableSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "14px", padding: 0 }}>×</button>}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
              <tr>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151", position: "sticky", left: 0, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", zIndex: 1 }}>Candidate Name</th>
                {examCriteria.map(c => (
                  <th key={c.id} style={{ padding: "14px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                    {c.criteriaName}<br/>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>({c.weight}%)</span>
                  </th>
                ))}
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Weighted Total</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications
                .filter(app => !passedIds || passedIds.includes(app.id))
                .filter(app => !tableSearch.trim() || (app.applicantName || "").toLowerCase().includes(tableSearch.toLowerCase()))
                .map((app) => {
                const weightedTotal = calculateWeightedTotal(app.id);
                const finalStatus = weightedTotal !== null ? (weightedTotal >= passMark ? "PASS" : "FAIL") : null;
                
                return (
                  <tr key={app.id} style={{ borderTop: "1px solid #f9fafb" }}>
                    <td style={{ padding: "14px 20px", fontWeight: "600", color: "#1f2937", position: "sticky", left: 0, background: "white", zIndex: 1 }}>{app.applicantName}</td>
                    {examCriteria.map(c => {
                      const result = getResultForApplication(app.id, c.id);
                      return (
                        <td key={c.id} style={{ padding: "14px 20px", textAlign: "center", color: "#6b7280" }}>
                          {result ? (
                            <span style={{ fontWeight: "600", fontSize: "15px", color: "#1f2937" }}>{result.resultScore}</span>
                          ) : "—"}
                        </td>
                      );
                    })}
                    <td style={{ padding: "14px 20px", textAlign: "center", fontWeight: "700", fontSize: "16px", color: weightedTotal !== null ? (weightedTotal >= passMark ? "#065f46" : "#b91c1c") : "#9ca3af" }}>
                      {weightedTotal !== null ? weightedTotal.toFixed(2) : "—"}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          setCandidateSearch("");
                          setFilteredCandidates(applications);
                          selectCandidate(app);
                          setShowRecordModal(true);
                          setError("");
                          setSuccess("");
                        }}
                        style={{ padding: "6px 16px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Record Result Modal */}
      {showRecordModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "16px", width: "90%", maxWidth: "640px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Record Exam Result</h2>
              <button onClick={closeRecordModal} style={{ background: "none", border: "none", fontSize: "22px", color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Candidate Search */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Search Candidate
                </label>
                {!selectedCandidate ? (
                  <>
                    <input
                      value={candidateSearch}
                      onChange={e => setCandidateSearch(e.target.value)}
                      placeholder="Type name to filter candidates..."
                      autoFocus
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}
                    />
                    <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", marginTop: "6px", maxHeight: "180px", overflowY: "auto", background: "white" }}>
                      {filteredCandidates.length === 0 ? (
                        <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>No candidates found.</p>
                      ) : filteredCandidates.map(app => (
                        <div key={app.id} onClick={() => selectCandidate(app)}
                          style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}>
                          <div style={{ fontWeight: "600", color: "#2c3e50" }}>{app.applicantName}</div>
                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>{app.applicantEmail}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#0369a1" }}>{selectedCandidate.applicantName}</div>
                      <div style={{ fontSize: "12px", color: "#7f8c8d" }}>{selectedCandidate.applicantEmail}</div>
                    </div>
                    <button onClick={() => { setSelectedCandidate(null); setCandidateSearch(""); setFilteredCandidates(applications); setCriteriaScores({}); }}
                      style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
                  </div>
                )}
              </div>

              {/* All Criteria Scores — shown once a candidate is selected */}
              {selectedCandidate && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
                    Exam Scores
                  </label>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Criteria</span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", textAlign: "center" }}>Score (max)</span>
                    </div>
                    {examCriteria.map((c, idx) => {
                      const val = criteriaScores[c.id] ?? "";
                      const score = parseFloat(val);
                      const threshold = (c.weight ?? 100) * passMark / 100;
                      const status = !isNaN(score) && val !== "" ? (score >= threshold ? "PASS" : "FAIL") : null;
                      const overMax = !isNaN(score) && score > (c.weight ?? 100);
                      return (
                        <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px", alignItems: "center", padding: "12px 16px", borderBottom: idx < examCriteria.length - 1 ? "1px solid #f3f4f6" : "none", background: overMax ? "#fff7f7" : "white" }}>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>{c.criteriaName}</div>
                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>Weight: {c.weight}%</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              min="0"
                              max={c.weight ?? 100}
                              step="0.01"
                              value={val}
                              onChange={e => setCriteriaScores(prev => ({ ...prev, [c.id]: e.target.value }))}
                              placeholder={`0–${c.weight ?? 100}`}
                              style={{
                                width: "110px",
                                padding: "7px 10px",
                                border: `2px solid ${overMax ? "#ef4444" : "#d1d5db"}`,
                                borderRadius: "8px",
                                fontSize: "14px",
                                textAlign: "center",
                                outline: "none"
                              }}
                            />
                            {overMax && <div style={{ fontSize: "10px", color: "#ef4444", marginTop: "2px" }}>Exceeds max</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={closeRecordModal} disabled={recording}
                style={{ padding: "10px 20px", background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
              <button onClick={recordResult} disabled={recording || !selectedCandidate}
                style={{ padding: "10px 20px", background: recording || !selectedCandidate ? "#9ca3af" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: recording || !selectedCandidate ? "not-allowed" : "pointer", fontSize: "14px" }}>
                {recording ? "Saving..." : "Save All Scores"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overall Status Modal */}
      {showStatusModal && selectedAppForStatus && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "16px", width: "90%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #f3f4f6" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Set Overall Status</h2>
            </div>
            
            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "20px", padding: "12px", background: "#f9fafb", borderRadius: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>Candidate: {selectedAppForStatus.applicantName}</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>Weighted Total: {calculateWeightedTotal(selectedAppForStatus.id)?.toFixed(2) || "N/A"}</div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>Overall Status</label>
                <select 
                  value={overallStatus}
                  onChange={e => setOverallStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}>
                  <option value="PASS">PASS (Shortlist)</option>
                  <option value="FAIL">FAIL (Reject)</option>
                </select>
                {overallStatus && (
                  <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", ...(overallStatus === "PASS" ? statusColor.PASS : statusColor.FAIL) }}>
                    Selected Status: {overallStatus}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={closeStatusModal} disabled={updatingStatus}
                style={{ padding: "10px 20px", background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
              <button onClick={updateOverallStatus} disabled={updatingStatus}
                style={{ padding: "10px 20px", background: updatingStatus ? "#9ca3af" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: updatingStatus ? "not-allowed" : "pointer", fontSize: "14px" }}>
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
