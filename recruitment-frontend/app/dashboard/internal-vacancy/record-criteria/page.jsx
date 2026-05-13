"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function RecordCriteriaPage() {
  const [results, setResults] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [criteriaForm, setCriteriaForm] = useState({ criteriaType: "", weight: "" });
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});

  const criteriaTypes = [
    "InterviewExam",
    "WrittenExam",
    "PsychometricExam",
    "PracticalExam",
    "OralExam",
    "TechnicalExam",
  ];

  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      api.get(recSearch.trim() ? `/recruitments/vacancy-posts?search=${encodeURIComponent(recSearch)}` : "/recruitments/vacancy-posts")
        .then(r => setResults(r.data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, recSearch.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [recSearch]);

  const selectRec = (r) => {
    setSelectedRec(r);
    setRecSearch("");
    setDropOpen(false);
    loadCriteria(r.id);
  };

  const loadCriteria = async (recId) => {
    try {
      const res = await api.get(`/recruitments/${recId}/criteria`);
      const examCriteria = res.data.filter(c => c.criteriaType === "EXAM");
      setCriteria(examCriteria);
      const cols = {};
      examCriteria.forEach(c => { cols[c.id] = true; });
      setVisibleColumns(cols);
    } catch {
      setError("Failed to load criteria");
    }
  };

  const handleAddCriteria = () => {
    setCriteriaForm({ criteriaType: "", weight: "" });
    setEditingCriteria(null);
    setShowCriteriaModal(true);
  };

  const handleEditCriteria = (c) => {
    setCriteriaForm({ criteriaType: c.criteriaName, weight: c.weight || "" });
    setEditingCriteria(c);
    setShowCriteriaModal(true);
  };

  const handleSaveCriteria = async () => {
    if (!criteriaForm.criteriaType || !criteriaForm.weight) {
      alert("Please fill in all fields");
      return;
    }
    const newWeight = parseFloat(criteriaForm.weight);
    if (isNaN(newWeight) || newWeight <= 0) {
      alert("Weight must be a positive number");
      return;
    }
    const otherWeightsTotal = criteria
      .filter(c => !editingCriteria || c.id !== editingCriteria.id)
      .reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
    const newTotal = otherWeightsTotal + newWeight;
    if (newTotal > 100) {
      alert(`Cannot save: total weight would be ${newTotal}%. Remaining available weight is ${(100 - otherWeightsTotal).toFixed(2)}%.`);
      return;
    }
    try {
      if (editingCriteria) {
        await api.put(`/recruitments/criteria/${editingCriteria.id}`, {
          criteriaName: criteriaForm.criteriaType,
          criteriaType: "EXAM",
          weight: newWeight,
        });
      } else {
        await api.post(`/recruitments/${selectedRec.id}/criteria`, {
          criteriaName: criteriaForm.criteriaType,
          criteriaType: "EXAM",
          weight: newWeight,
          isRequired: true,
        });
      }
      setShowCriteriaModal(false);
      loadCriteria(selectedRec.id);
    } catch {
      setError("Failed to save criteria");
    }
  };

  const handleDeleteCriteria = async (criteriaId) => {
    if (!confirm("Delete this criteria?")) return;
    try {
      await api.delete(`/recruitments/criteria/${criteriaId}`);
      loadCriteria(selectedRec.id);
    } catch {
      setError("Failed to delete criteria");
    }
  };

  const toggleColumn = (criteriaId) => {
    setVisibleColumns(prev => ({ ...prev, [criteriaId]: !prev[criteriaId] }));
  };

  const totalWeight = criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Record Criteria</h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>Manage exam criteria and enter scores for shortlisted internal candidates</p>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontWeight: "700" }}>×</button>
        </div>
      )}

      {/* Recruitment Selector */}
      <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Select Internal Recruitment
        </label>
        <input value={recSearch} onChange={e => setRecSearch(e.target.value)}
          onFocus={() => setDropOpen(true)} onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          placeholder="Search by job title or batch code..."
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box" }} />
        {dropOpen && (
          <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", maxHeight: "200px", overflowY: "auto", background: "white" }}>
            {searching ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>Searching...</p>
              : results.filter(r => {
                  const q = recSearch.toLowerCase().trim();
                  return !q || (r.jobTitle || "").toLowerCase().includes(q) || (r.batchCode || "").toLowerCase().includes(q);
                }).length === 0 ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>No results</p>
              : results.filter(r => {
                  const q = recSearch.toLowerCase().trim();
                  return !q || (r.jobTitle || "").toLowerCase().includes(q) || (r.batchCode || "").toLowerCase().includes(q);
                }).map(r => (
                <div key={r.id} onMouseDown={() => selectRec(r)}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <span style={{ fontWeight: "600", color: "#2c3e50" }}>{r.jobTitle}</span>
                  <span style={{ color: "#9ca3af", marginLeft: "8px" }}>{r.batchCode}</span>
                </div>
              ))}
          </div>
        )}
        {selectedRec && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#0369a1" }}>{selectedRec.jobTitle}</span>
            <span style={{ fontSize: "12px", color: "#7f8c8d" }}>{selectedRec.batchCode}</span>
            <button onClick={() => { setSelectedRec(null); setCriteria([]); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to manage exam criteria and scores.</p>
        </div>
      ) : (
        <>
          {/* Criteria Detail Section */}
          <div style={{ background: "#e0f2fe", padding: "16px 20px", borderRadius: "8px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0c4a6e" }}>Criteria Detail</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleAddCriteria}
                  style={{ padding: "8px 16px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                  Add
                </button>
                <button onClick={() => setShowColumnsModal(true)}
                  style={{ padding: "8px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                  Columns
                </button>
              </div>
            </div>

            {criteria.length === 0 ? (
              <div style={{ background: "white", padding: "30px", borderRadius: "8px", textAlign: "center", color: "#9ca3af" }}>
                No criteria defined. Click "Add" to create exam criteria.
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      {["No", "Criteria", "Weight (%)", "Action"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#475569", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((c, idx) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontSize: "13px" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "600" }}>{c.criteriaName}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px" }}>{c.weight || 0} %</td>
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => handleEditCriteria(c)}
                            style={{ padding: "4px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", marginRight: "6px" }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteCriteria(c.id)}
                            style={{ padding: "4px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                      <td colSpan={2} style={{ padding: "12px 16px", fontSize: "13px" }}>Total Weight</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: totalWeight === 100 ? "#10b981" : "#ef4444" }}>{totalWeight} %</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {totalWeight !== 100 && criteria.length > 0 && (
              <div style={{ marginTop: "12px", padding: "10px 14px", background: "#fef3c7", borderRadius: "6px", fontSize: "13px", color: "#92400e" }}>
                ⚠️ Warning: Total weight should equal 100%. Current total: {totalWeight}%
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Criteria Modal */}
      {showCriteriaModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", width: "90%", maxWidth: "500px" }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "18px", fontWeight: "700", color: "#1f2937" }}>
              {editingCriteria ? "Edit Criteria" : "Add Criteria"}
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Criteria Type</label>
              <select value={criteriaForm.criteriaType} onChange={e => setCriteriaForm({ ...criteriaForm, criteriaType: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }}>
                <option value="">--Select One--</option>
                {criteriaTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>Weight (%)</label>
              <input type="number" min="0" max="100" value={criteriaForm.weight}
                onChange={e => setCriteriaForm({ ...criteriaForm, weight: e.target.value })}
                placeholder="e.g., 25"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
              {(() => {
                const otherTotal = criteria.filter(c => !editingCriteria || c.id !== editingCriteria.id).reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
                const remaining = 100 - otherTotal;
                return <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: remaining > 0 ? "#6b7280" : "#ef4444" }}>Remaining available: {remaining.toFixed(2)}%</p>;
              })()}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCriteriaModal(false)}
                style={{ padding: "10px 24px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                Cancel
              </button>
              <button onClick={handleSaveCriteria}
                style={{ padding: "10px 24px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                {editingCriteria ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Columns Modal */}
      {showColumnsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "28px", width: "90%", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "18px", fontWeight: "700", color: "#1f2937" }}>Show/Hide Columns</h3>
            <div style={{ marginBottom: "24px" }}>
              {criteria.map(c => (
                <div key={c.id} style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="checkbox" checked={visibleColumns[c.id] || false} onChange={() => toggleColumn(c.id)}
                    style={{ cursor: "pointer", width: "18px", height: "18px" }} />
                  <label style={{ fontSize: "14px", color: "#374151", cursor: "pointer" }} onClick={() => toggleColumn(c.id)}>{c.criteriaName}</label>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowColumnsModal(false)}
                style={{ padding: "10px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
