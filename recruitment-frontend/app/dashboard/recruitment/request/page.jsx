"use client";
import { useState, useEffect, useRef, useContext } from "react";
import api from "@/services/api";
import { AuthContext } from "@/context/AuthContext";

const HIRING_TYPES = ["CONTRACT", "PERMANENT", "TEMPORARY"];
const IDENTIFICATION_METHODS = [
  "Written Exam",
  "Interview",
  "Written Exam & Interview",
  "Portfolio Review",
  "Practical Test",
];

const generateBatchCode = () => {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `REC-${ymd}-${rand}`;
};

const emptyForm = (recorderName = "") => ({
  jobQualificationId: "",
  jobTitle: "",
  department: "",
  vacancyNumber: 1,
  jobLocation: "",
  competencyFramework: "",
  recorderName,
  batchCode: "",
  salary: "",
  hiringType: "",
  candidateIdentificationMethod: "",
});

const statusStyles = {
  REQUESTED: { background: "#fef3c7", color: "#92400e" },
  APPROVED: { background: "#d1fae5", color: "#065f46" },
  REJECTED: { background: "#fee2e2", color: "#b91c1c" },
  DRAFT: { background: "#f3f4f6", color: "#374151" },
  POSTED: { background: "#dbeafe", color: "#1d4ed8" },
  CLOSED: { background: "#f3f4f6", color: "#374151" },
};

// Searchable job picker
function JobPicker({ jobs, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const selected = jobs.find(j => String(j.id) === String(value));
  const filtered = jobs.filter(j =>
    j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    (j.jobTypeName || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px",
        fontSize: "13px", cursor: "pointer", background: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: selected ? "#2c3e50" : "#9ca3af",
      }}>
        <span>{selected ? `${selected.jobTitle} (${selected.jobTypeName || ""})` : "-- Select Job --"}</span>
        <span style={{ fontSize: "10px", color: "#7f8c8d" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, background: "white",
          border: "1px solid #d1d5db", borderRadius: "5px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          zIndex: 200, marginTop: "2px",
        }}>
          <div style={{ padding: "8px" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search job title..."
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px", color: "#9ca3af", fontSize: "13px" }}>No active jobs found</div>
            ) : filtered.map(j => (
              <div key={j.id} onClick={() => { onChange(j); setOpen(false); setSearch(""); }}
                style={{
                  padding: "10px 12px", cursor: "pointer", fontSize: "13px",
                  background: String(value) === String(j.id) ? "#eaf4fb" : "transparent",
                  borderBottom: "1px solid #f3f4f6",
                }}>
                <div style={{ fontWeight: "600", color: "#2c3e50" }}>{j.jobTitle}</div>
                <div style={{ fontSize: "11px", color: "#7f8c8d" }}>{j.jobTypeName} {j.grade ? `· ${j.grade}` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecruitmentRequestPage() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [reqRes, formRes] = await Promise.all([
        api.get("/recruitments"),
        api.get("/recruitments/request-form-data"),
      ]);
      setRequests(reqRes.data.filter(r => r.status !== "DRAFT"));
      setJobs(formRes.data.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleJobSelect = (job) => {
    setForm(f => ({
      ...f,
      jobQualificationId: job.id,
      jobTitle: job.jobTitle,
      competencyFramework: job.competencyFramework || "",
      batchCode: generateBatchCode(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobQualificationId) { alert("Please select a job."); return; }
    setSaving(true);
    try {
      const res = await api.post("/recruitments/full-request", form);
      alert(`Request submitted! Batch Code: ${res.data.batchCode}`);
      await loadAll();
      setShowForm(false);
      setForm(emptyForm);
    } catch (e) {
      alert("Failed to submit request.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 11px", border: "1px solid #d1d5db",
    borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Recruitment Request</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Submit recruitment requests for approval</p>
        </div>
        <button onClick={() => { setForm(emptyForm(user?.fullName || "")); setShowForm(true); }}
          style={{ padding: "9px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + New Request
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Requests", value: requests.length, color: "#2980b9" },
          { label: "Approved", value: requests.filter(d => d.status === "APPROVED" || d.status === "POSTED").length, color: "#27ae60" },
          { label: "Pending", value: requests.filter(d => d.status === "REQUESTED").length, color: "#e67e22" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              {["Batch Code", "Job Title", "Location", "Hiring Type", "Salary", "Recorder", "Status"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>No requests yet. Click "+ New Request" to get started.</td></tr>
            ) : requests.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                <td style={{ padding: "11px 14px", fontWeight: "700", color: "#2980b9", fontSize: "12px" }}>{row.batchCode || `#${row.id}`}</td>
                <td style={{ padding: "11px 14px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{row.jobTitle}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.jobLocation || "—"}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.hiringType || "—"}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.salary || "—"}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.recorderName || "—"}</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", ...(statusStyles[row.status] || {}) }}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: "8px", width: "100%", maxWidth: "720px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #ecf0f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>New Recruitment Request</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7f8c8d" }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
              {/* Job Selector */}
              <div style={{ marginBottom: "20px", padding: "16px", background: "#f8f9fa", borderRadius: "6px", border: "1px solid #ecf0f1" }}>
                <label style={{ ...labelStyle, fontSize: "13px", color: "#2c3e50", marginBottom: "8px" }}>Select Job Position (Active Qualifications)</label>
                <JobPicker jobs={jobs} value={form.jobQualificationId} onChange={handleJobSelect} />
              </div>

              {/* Two-column grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={labelStyle}>Job Title</label>
                  <input value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Job Location</label>
                  <input value={form.jobLocation} onChange={e => setForm({ ...form, jobLocation: e.target.value })} required style={inputStyle} placeholder="e.g. Addis Ababa" />
                </div>
                <div>
                  <label style={labelStyle}>Number of Vacancies</label>
                  <input type="number" min="1" value={form.vacancyNumber} onChange={e => setForm({ ...form, vacancyNumber: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Salary</label>
                  <input value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} style={inputStyle} placeholder="e.g. 15,000 ETB" />
                </div>
                <div>
                  <label style={labelStyle}>Type of Hiring</label>
                  <select value={form.hiringType} onChange={e => setForm({ ...form, hiringType: e.target.value })} required style={inputStyle}>
                    <option value="">-- Select --</option>
                    {HIRING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Candidate Identification Method</label>
                  <select value={form.candidateIdentificationMethod} onChange={e => setForm({ ...form, candidateIdentificationMethod: e.target.value })} required style={inputStyle}>
                    <option value="">-- Select --</option>
                    {IDENTIFICATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Recorder Name</label>
                  <input value={form.recorderName} readOnly style={{ ...inputStyle, background: "#f3f4f6", color: "#374151", cursor: "not-allowed" }} />
                </div>
              </div>

              {/* Batch code preview */}
              <div style={{ marginTop: "14px", padding: "12px 16px", background: "#eaf4fb", borderRadius: "5px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "#7f8c8d", fontWeight: "600" }}>Batch Code:</span>
                {form.batchCode ? (
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#2980b9", letterSpacing: "0.5px" }}>{form.batchCode}</span>
                ) : (
                  <span style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>Auto-generated after selecting a job</span>
                )}
              </div>
              {/* Competency Framework */}
              <div style={{ marginTop: "14px" }}>
                <label style={labelStyle}>Competency Framework</label>
                <textarea value={form.competencyFramework} onChange={e => setForm({ ...form, competencyFramework: e.target.value })} rows={4}
                  style={{ ...inputStyle, resize: "vertical" }} placeholder="Auto-filled from job qualification, editable..." />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: "10px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
