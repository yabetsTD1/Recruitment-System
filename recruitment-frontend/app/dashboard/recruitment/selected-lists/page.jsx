"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/services/api";

const ALL_COLUMNS = [
  { key: "no",          label: "No" },
  { key: "fullName",    label: "Full Name" },
  { key: "phone",       label: "Mobile No" },
  { key: "gender",      label: "Gender" },
  { key: "graduatedFrom", label: "Graduated From" },
  { key: "experience",  label: "Experience" },
  { key: "nation",      label: "Nation" },
  { key: "interview",   label: "Interview" },
  { key: "practical",   label: "Practical" },
  { key: "psychometric",label: "Psychometric" },
  { key: "gpa",         label: "GPA" },
  { key: "totalResult", label: "Total Result" },
];

export default function SelectedCandidateListsPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [examCriteria, setExamCriteria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showColumns, setShowColumns] = useState(false);
  const [visibleCols, setVisibleCols] = useState(
    Object.fromEntries(ALL_COLUMNS.map(c => [c.key, true]))
  );
  const [tableSearch, setTableSearch] = useState("");
  const printRef = useRef();

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
    Promise.all([
      api.get(`/recruitments/${r.id}/applications`),
      api.get(`/recruitments/${r.id}/exam-results`).catch(() => ({ data: [] })),
      api.get(`/recruitments/${r.id}/exam-criteria`).catch(() => ({ data: [] })),
    ])
      .then(([appsRes, resultsRes, criteriaRes]) => {
        setApplications(appsRes.data.filter(a => a.status === "SHORTLISTED" || a.status === "HIRED"));
        setExamResults(resultsRes.data);
        setExamCriteria(criteriaRes.data);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load data"); setLoading(false); });
  };

  const getExamScore = (appId, criteriaName) => {
    const criteria = examCriteria.find(c => c.criteriaName?.toLowerCase().includes(criteriaName.toLowerCase()));
    if (!criteria) return null;
    const result = examResults.find(r => r.applicationId === appId && r.criteriaId === criteria.id);
    return result ? result.resultScore : null;
  };

  const getTotal = (appId) => {
    const results = examResults.filter(r => r.applicationId === appId);
    if (results.length === 0) return null;
    return results.reduce((sum, r) => sum + (r.resultScore || 0), 0);
  };

  const toggleCol = (key) => setVisibleCols(p => ({ ...p, [key]: !p[key] }));

  const handlePrint = () => {
    const cols = ALL_COLUMNS.filter(c => visibleCols[c.key]);
    const rows = applications.map((app, idx) => cols.map(c => {
      switch (c.key) {
        case "no": return idx + 1;
        case "fullName": return app.applicantName || "";
        case "phone": return app.applicantPhone || "";
        case "gender": return app.applicantGender || "";
        case "graduatedFrom": return app.graduatedFrom || "";
        case "experience": return app.experienceYears ? `${app.experienceYears} years` : "";
        case "nation": return app.nation || "";
        case "interview": return getExamScore(app.id, "interview") ?? "";
        case "practical": return getExamScore(app.id, "practical") ?? "";
        case "psychometric": return getExamScore(app.id, "psycho") ?? "";
        case "gpa": return app.gpa ?? "";
        case "totalResult": { const t = getTotal(app.id); return t !== null ? t.toFixed(2) : ""; }
        default: return "";
      }
    }));

    const tableRows = rows.map((row, i) =>
      `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        ${row.map(cell => `<td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px">${cell}</td>`).join("")}
      </tr>`
    ).join("");

    const html = `
      <html><head><title>Selected Candidates</title>
      <style>body{font-family:Arial,sans-serif;margin:24px} table{width:100%;border-collapse:collapse} @media print{button{display:none}}</style>
      </head><body>
        <h2 style="margin:0 0 4px;font-size:18px;color:#1f2937">Selected Candidates List</h2>
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280">Recruitment: ${selectedRec?.jobTitle || ""} &nbsp;|&nbsp; Batch: ${selectedRec?.batchCode || ""}</p>
        <p style="margin:0 0 16px;font-size:12px;color:#9ca3af">Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr style="background:#1f2937">
            ${cols.map(c => `<th style="padding:10px 12px;text-align:left;font-size:12px;color:white;border:1px solid #374151">${c.label}</th>`).join("")}
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:11px;color:#9ca3af">Total: ${applications.length} candidate(s)</p>
      </body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const handleExport = () => {
    const cols = ALL_COLUMNS.filter(c => visibleCols[c.key]);

    // Build XLS-compatible HTML table (Excel opens HTML tables as .xls)
    const headerRow = cols.map(c =>
      `<th style="background:#1f2937;color:white;font-weight:bold;padding:8px;border:1px solid #ccc">${c.label}</th>`
    ).join("");

    const dataRows = applications.map((app, idx) => {
      const cells = cols.map(c => {
        let val;
        switch (c.key) {
          case "no": val = idx + 1; break;
          case "fullName": val = app.applicantName || ""; break;
          case "phone": val = app.applicantPhone || ""; break;
          case "gender": val = app.applicantGender || ""; break;
          case "graduatedFrom": val = app.graduatedFrom || ""; break;
          case "experience": val = app.experienceYears ? `${app.experienceYears} years` : ""; break;
          case "nation": val = app.nation || ""; break;
          case "interview": val = getExamScore(app.id, "interview") ?? ""; break;
          case "practical": val = getExamScore(app.id, "practical") ?? ""; break;
          case "psychometric": val = getExamScore(app.id, "psycho") ?? ""; break;
          case "gpa": val = app.gpa ?? ""; break;
          case "totalResult": { const t = getTotal(app.id); val = t !== null ? t.toFixed(2) : ""; break; }
          default: val = "";
        }
        return `<td style="padding:6px 10px;border:1px solid #e5e7eb">${val}</td>`;
      }).join("");
      return `<tr style="background:${idx % 2 === 0 ? '#fff' : '#f9fafb'}">${cells}</tr>`;
    }).join("");

    const xlsContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>Selected Candidates</x:Name>
      <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head><body>
        <table>
          <tr><td colspan="${cols.length}" style="font-size:16px;font-weight:bold;padding:8px">Selected Candidates List</td></tr>
          <tr><td colspan="${cols.length}" style="font-size:12px;color:#666;padding:4px 8px">
            Recruitment: ${selectedRec?.jobTitle || ""} | Batch: ${selectedRec?.batchCode || ""} | Date: ${new Date().toLocaleDateString()}
          </td></tr>
          <tr><td colspan="${cols.length}"></td></tr>
          <tr>${headerRow}</tr>
          ${dataRows}
          <tr><td colspan="${cols.length}" style="padding:8px;font-size:11px;color:#999">Total: ${applications.length} candidate(s)</td></tr>
        </table>
      </body></html>`;

    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected_candidates_${selectedRec?.batchCode || "list"}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleColumns = ALL_COLUMNS.filter(c => visibleCols[c.key]);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Selected Candidate Lists</h1>
        <p style={{ color: "#6b7280", marginTop: "4px" }}>View all selected (shortlisted/hired) candidates by recruitment</p>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{error}</div>}

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

      {/* Stats */}
      {selectedRec && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Selected Candidates", value: applications.length, color: "#10b981" },
            { label: "Shortlisted", value: applications.filter(a => a.status === "SHORTLISTED").length, color: "#3b82f6" },
            { label: "Hired", value: applications.filter(a => a.status === "HIRED").length, color: "#8b5cf6" },
          ].map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: "32px", fontWeight: "700", color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table Card */}
      <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search candidate by name..." value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              style={{ border: "none", outline: "none", fontSize: "13px", background: "transparent", flex: 1 }} />
            {tableSearch && <button onClick={() => setTableSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "14px", padding: 0 }}>×</button>}
          </div>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>List of selected candidates</span>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowColumns(p => !p)}
              style={{ padding: "7px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "7px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
              ☰ Columns
            </button>
            {showColumns && (
              <div style={{ position: "absolute", right: 0, top: "110%", background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px 16px", zIndex: 20, minWidth: "180px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                {ALL_COLUMNS.map(c => (
                  <label key={c.key} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0", cursor: "pointer", fontSize: "13px", color: "#374151" }}>
                    <input type="checkbox" checked={visibleCols[c.key]} onChange={() => toggleCol(c.key)} style={{ cursor: "pointer" }} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : !selectedRec ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Select a recruitment above to view selected candidates.</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>No records found.</div>
        ) : (
          <div ref={printRef} style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                <tr>
                  {visibleColumns.map(c => (
                    <th key={c.key} style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151", whiteSpace: "nowrap" }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.filter(app => !tableSearch.trim() || (app.applicantName || "").toLowerCase().includes(tableSearch.toLowerCase())).map((app, idx) => (
                  <tr key={app.id} style={{ borderTop: "1px solid #f9fafb" }}>
                    {visibleColumns.map(c => {
                      let val;
                      switch (c.key) {
                        case "no": val = idx + 1; break;
                        case "fullName": val = <span style={{ fontWeight: "600", color: "#1f2937" }}>{app.applicantName}</span>; break;
                        case "phone": val = app.applicantPhone || "—"; break;
                        case "gender": val = app.applicantGender || "—"; break;
                        case "graduatedFrom": val = app.graduatedFrom || "—"; break;
                        case "experience": val = app.experienceYears ? `${app.experienceYears}y` : "—"; break;
                        case "nation": val = app.nation || "—"; break;
                        case "interview": val = getExamScore(app.id, "interview") ?? "—"; break;
                        case "practical": val = getExamScore(app.id, "practical") ?? "—"; break;
                        case "psychometric": val = getExamScore(app.id, "psycho") ?? "—"; break;
                        case "gpa": val = app.gpa ?? "—"; break;
                        case "totalResult": {
                          const t = getTotal(app.id);
                          val = <span style={{ fontWeight: "700", color: t !== null ? "#065f46" : "#9ca3af" }}>{t !== null ? t.toFixed(2) : "—"}</span>;
                          break;
                        }
                        default: val = "—";
                      }
                      return <td key={c.key} style={{ padding: "14px 16px", fontSize: "13px", color: "#4b5563" }}>{val}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print / Export */}
        {selectedRec && applications.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: "12px" }}>
            <button onClick={handlePrint}
              style={{ padding: "9px 24px", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
              Print
            </button>
            <button onClick={handleExport}
              style={{ padding: "9px 24px", background: "none", color: "#3b82f6", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
              XLS.xls
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
