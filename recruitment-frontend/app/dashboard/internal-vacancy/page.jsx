"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function InternalVacancyPage() {
  const [role, setRole] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setRole(JSON.parse(u).role);
    } catch (e) {}
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vacRes, appRes] = await Promise.all([
        api.get("/recruitments/internal-jobs"),
        api.get("/recruitments/my-applications").catch(() => ({ data: [] })),
      ]);
      setVacancies(vacRes.data);
      setAppliedIds(appRes.data.map(a => a.recruitmentId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    if (appliedIds.includes(id)) return;
    setApplying(id);
    try {
      await api.post(`/recruitments/${id}/apply`);
      setAppliedIds(prev => [...prev, id]);
      setDetailItem(prev => prev?.id === id ? { ...prev, _applied: true } : prev);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to apply.");
    } finally {
      setApplying(null);
    }
  };

  const isEmployee = role === "EMPLOYEE";

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Internal Vacancy</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Browse and apply to internal job openings</p>
      </div>

      {/* Search bar */}
      <div style={{ background: "white", borderRadius: "6px", border: "1px solid #ecf0f1", padding: "10px 14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search by batch code or job title..."
          value={search}
          onChange={e => { setSearch(e.target.value); setShowAll(false); }}
          style={{ border: "none", outline: "none", fontSize: "13px", background: "transparent", flex: 1, color: "#2c3e50" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Vacancies", value: vacancies.length, color: "#2980b9" },
          { label: "Open", value: vacancies.length, color: "#27ae60" },
          { label: "Applied", value: appliedIds.length, color: "#8e44ad" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#7f8c8d", padding: "32px" }}>Loading...</p>
      ) : vacancies.length === 0 ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          No internal vacancies posted yet.
        </div>
      ) : (() => {
          const q = search.toLowerCase().trim();
          const filtered = vacancies.filter(v =>
            !q ||
            (v.batchCode || "").toLowerCase().includes(q) ||
            (v.jobTitle || "").toLowerCase().includes(q)
          );
          // oldest 5 = first 5 (API returns by id asc, oldest first)
          const visible = (q || showAll) ? filtered : filtered.slice(0, 5);
          return (
            <>
              {filtered.length === 0 ? (
                <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
                  No vacancies match your search.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                  {visible.map((item) => {
            const applied = appliedIds.includes(item.id);
            const isApplying = applying === item.id;
            return (
              <div key={item.id} style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>Open</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#2980b9" }}>{item.batchCode || `#${item.id}`}</span>
                </div>
                <h3 style={{ fontWeight: "700", color: "#2c3e50", fontSize: "16px", margin: "0 0 4px 0" }}>{item.jobTitle}</h3>
                <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "0 0 10px 0" }}>{item.department || "—"}</p>
                <div style={{ background: "#f8f9fa", borderRadius: "6px", padding: "10px", marginBottom: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Salary</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{item.salary || "—"}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Location</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{item.jobLocation || "—"}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Vacancies</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{item.vacancyNumber}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0" }}>Closing Date</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{item.closingDate || "—"}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setDetailItem(item)}
                    style={{ flex: 1, padding: "8px", border: "1px solid #2980b9", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px", background: "white", color: "#2980b9" }}>
                    View Details
                  </button>
                  {isEmployee && (
                    <button
                      onClick={() => handleApply(item.id)}
                      disabled={applied || isApplying}
                      style={{
                        flex: 1, padding: "8px", border: "none", borderRadius: "6px",
                        cursor: applied || isApplying ? "not-allowed" : "pointer",
                        fontWeight: "600", fontSize: "13px",
                        background: applied ? "#dcfce7" : isApplying ? "#a8d5b5" : "#27ae60",
                        color: applied ? "#15803d" : "white",
                      }}>
                      {applied ? "✓ Applied" : isApplying ? "Submitting..." : "Apply Now"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
                </div>
              )}
              {/* Show all / Show less footer */}
              {!q && filtered.length > 5 && (
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button onClick={() => setShowAll(v => !v)}
                    style={{ background: "none", border: "none", color: "#2980b9", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                    {showAll ? "▲ Show oldest 5 only" : `▼ Show all ${filtered.length} vacancies`}
                  </button>
                </div>
              )}
            </>
          );
        })()}

      {/* Detail Modal */}
      {detailItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
            {/* Header */}
            <div style={{ background: "#2c3e50", padding: "20px 24px", borderRadius: "10px 10px 0 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", margin: "0 0 4px 0", fontWeight: "600" }}>{detailItem.batchCode || `#${detailItem.id}`}</p>
                <h2 style={{ color: "white", fontSize: "18px", fontWeight: "700", margin: 0 }}>{detailItem.jobTitle}</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", margin: "4px 0 0 0" }}>{detailItem.department || "—"}</p>
              </div>
              <button onClick={() => setDetailItem(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Status badge */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                <span style={{ background: "#d1fae5", color: "#065f46", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>Open</span>
                {detailItem.hiringType && <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>{detailItem.hiringType}</span>}
                {detailItem.grade && <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>{detailItem.grade}</span>}
              </div>

              {/* Key info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "Salary", value: detailItem.salary },
                  { label: "Location", value: detailItem.jobLocation },
                  { label: "Vacancies", value: detailItem.vacancyNumber },
                  { label: "Closing Date", value: detailItem.closingDate },
                  { label: "Job Type", value: detailItem.jobTypeName },
                  { label: "Department", value: detailItem.department },
                ].map((f, i) => f.value ? (
                  <div key={i} style={{ background: "#f8f9fa", borderRadius: "6px", padding: "10px 12px" }}>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 2px 0", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</p>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>{f.value}</p>
                  </div>
                ) : null)}
              </div>

              {/* Qualification Requirements */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#2c3e50", margin: "0 0 12px 0", paddingBottom: "8px", borderBottom: "2px solid #ecf0f1" }}>📋 Qualification Requirements</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {detailItem.minDegree && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0 }}>Min. Degree</span>
                      <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{detailItem.minDegree}</p>
                    </div>
                  )}
                  {detailItem.minExperience && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0 }}>Experience</span>
                      <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{detailItem.minExperience}</p>
                    </div>
                  )}
                  {detailItem.requiredSkills && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0 }}>Skills</span>
                      <p style={{ fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.5" }}>{detailItem.requiredSkills}</p>
                    </div>
                  )}
                  {detailItem.competencyFramework && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0 }}>Competency</span>
                      <p style={{ fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.5" }}>{detailItem.competencyFramework}</p>
                    </div>
                  )}
                  {!detailItem.minDegree && !detailItem.minExperience && !detailItem.requiredSkills && !detailItem.competencyFramework && (
                    <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>No specific qualification requirements listed.</p>
                  )}
                </div>
              </div>

              {/* Full description */}
              {detailItem.fullDescription && (
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#2c3e50", margin: "0 0 8px 0", paddingBottom: "8px", borderBottom: "2px solid #ecf0f1" }}>📝 Job Description</p>
                  <p style={{ fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{detailItem.fullDescription}</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "10px", paddingTop: "16px", borderTop: "1px solid #ecf0f1" }}>
                <button onClick={() => setDetailItem(null)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                  Close
                </button>
                {isEmployee && (
                  <button
                    onClick={() => handleApply(detailItem.id)}
                    disabled={appliedIds.includes(detailItem.id) || applying === detailItem.id}
                    style={{
                      flex: 2, padding: "10px", border: "none", borderRadius: "6px",
                      cursor: appliedIds.includes(detailItem.id) || applying === detailItem.id ? "not-allowed" : "pointer",
                      fontWeight: "600", fontSize: "13px",
                      background: appliedIds.includes(detailItem.id) ? "#dcfce7" : applying === detailItem.id ? "#a8d5b5" : "#27ae60",
                      color: appliedIds.includes(detailItem.id) ? "#15803d" : "white",
                    }}>
                    {appliedIds.includes(detailItem.id) ? "✓ Already Applied" : applying === detailItem.id ? "Submitting..." : "Apply for this Position"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
