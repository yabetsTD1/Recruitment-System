"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function ApplyVacancyPage() {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [applied, setApplied] = useState(false);
  const [appliedIds, setAppliedIds] = useState([]);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    api.get("/recruitments/my-applications").then(r => setAppliedIds(r.data.map(a => a.recruitmentId))).catch(() => {});
  }, []);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      api.get(search.trim() ? `/recruitments/internal-jobs?search=${encodeURIComponent(search)}` : "/recruitments/internal-jobs")
        .then(r => setResults(r.data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, search.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [search]);

  const selectRecruitment = (r) => {
    setSelected(r);
    setApplied(appliedIds.includes(r.id));
    setSearch("");
    setOpen(false);
  };

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      await api.post(`/recruitments/${selected.id}/apply`);
      setApplied(true);
      setAppliedIds(prev => [...prev, selected.id]);
      setShowConfirm(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Apply for Vacancy</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Select an internal vacancy and submit your application</p>
      </div>

      {/* Recruitment Selector */}
      <div style={{ background: "white", borderRadius: "8px", padding: "20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "8px" }}>Select Vacancy</label>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => { setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Click or type to search vacancies..."
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box" }}
        />
        {open && (
          <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", maxHeight: "200px", overflowY: "auto", background: "white" }}>
            {searching ? (
              <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>Searching...</p>
            ) : results.length === 0 ? (
              <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>No results</p>
            ) : results.map(r => (
              <div key={r.id} onMouseDown={() => selectRecruitment(r)}
                style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                <span style={{ fontWeight: "600", color: "#2c3e50" }}>{r.jobTitle}</span>
                <span style={{ color: "#9ca3af", marginLeft: "8px" }}>{r.batchCode}</span>
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#0369a1" }}>{selected.jobTitle}</span>
            <span style={{ fontSize: "12px", color: "#7f8c8d" }}>{selected.batchCode}</span>
            <button onClick={() => { setSelected(null); setApplied(false); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selected ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "48px", textAlign: "center", color: "#9ca3af", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a vacancy above to view details and apply</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #ecf0f1", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", margin: "0 0 4px 0" }}>{selected.jobTitle}</h2>
              <p style={{ color: "#7f8c8d", fontSize: "13px", margin: 0 }}>{selected.department || "—"}</p>
            </div>
            <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>Open</span>
          </div>

          {/* Details Grid */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #ecf0f1" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {[
                { label: "Batch Code", value: selected.batchCode || `#${selected.id}` },
                { label: "Vacancies", value: selected.vacancyNumber },
                { label: "Salary", value: selected.salary || "—" },
                { label: "Location", value: selected.jobLocation || "—" },
                { label: "Posting Date", value: selected.postingDate || "—" },
                { label: "Closing Date", value: selected.closingDate || "—" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#f8f9fa", borderRadius: "6px", padding: "12px 14px" }}>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 3px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</p>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {selected.jobDescription && (
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #ecf0f1" }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: "0 0 8px 0" }}>Job Description</p>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.6", margin: 0 }}>{selected.jobDescription}</p>
            </div>
          )}

          {/* Apply Button */}
          <div style={{ padding: "20px 24px" }}>
            {applied ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", background: "#d1fae5", borderRadius: "8px", border: "1px solid #6ee7b7" }}>
                <span style={{ fontSize: "18px" }}>✓</span>
                <div>
                  <p style={{ fontWeight: "700", color: "#065f46", margin: 0, fontSize: "14px" }}>Application Submitted</p>
                  <p style={{ color: "#047857", fontSize: "12px", margin: 0 }}>Your application has been received and is under review.</p>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowConfirm(true)}
                style={{ padding: "12px 32px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                Apply Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "6px" }}>Confirm Application</h2>
            <p style={{ color: "#7f8c8d", fontSize: "13px", marginBottom: "20px" }}>{selected.jobTitle} — {selected.department || "—"}</p>
            <div style={{ background: "#f8f9fa", borderRadius: "6px", padding: "12px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Post Code</p>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#2980b9", margin: 0 }}>{selected.batchCode || `#${selected.id}`}</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Closing Date</p>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{selected.closingDate || "—"}</p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "20px" }}>
              By submitting, you confirm your interest in this position. Your application will be reviewed by HR.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={handleApply} disabled={applying}
                style={{ flex: 1, padding: "10px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
                {applying ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
