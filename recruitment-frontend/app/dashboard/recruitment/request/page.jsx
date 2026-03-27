"use client";
import { useState, useEffect, useContext } from "react";
import api from "@/services/api";
import { AuthContext } from "@/context/AuthContext";

const EMPLOYMENT_TYPES = ["PERMANENT", "CONTRACT", "TEMPORARY", "PART_TIME"];
const RECRUITMENT_TYPES = ["Recommendation", "Competition", "Direct Selection", "Transfer", "Recover"];
const POSITION_NAMES = [
  "General Director",
  "Deputy General Director",
  "Director",
  "Deputy Director",
  "Team Leader",
  "Senior Expert",
  "Expert",
  "Supervisor",
  "Officer",
  "Specialist",
  "Coordinator",
  "Analyst",
  "Technician",
  "Assistant",
  "Clerk",
];
const BUDGET_YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - 2 + i));
const ICF_OPTIONS = Array.from({ length: 15 }, (_, i) => String(i + 1));
const INCREMENT_STEPS = Array.from({ length: 20 }, (_, i) => String(i));

const statusStyles = {
  REQUESTED: { background: "#fef3c7", color: "#92400e" },
  APPROVED:  { background: "#d1fae5", color: "#065f46" },
  REJECTED:  { background: "#fee2e2", color: "#b91c1c" },
  DRAFT:     { background: "#f3f4f6", color: "#374151" },
  POSTED:    { background: "#dbeafe", color: "#1d4ed8" },
  CLOSED:    { background: "#f3f4f6", color: "#374151" },
};

const inp = { width: "100%", padding: "8px 11px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "white" };
const lbl = { display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" };

// Build tree from flat list
function buildOrgTree(units, parentId = null) {
  return units
    .filter(u => (u.parentId ?? null) === parentId)
    .map(u => ({ ...u, children: buildOrgTree(units, u.id) }));
}

function OrgTreeNode({ node, value, onSelect, expandedIds, toggleExpand, depth }) {
  const hasChildren = node.children?.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = value === node.name;

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "4px",
          paddingLeft: `${8 + depth * 16}px`, paddingRight: "8px",
          paddingTop: "7px", paddingBottom: "7px",
          background: isSelected ? "#eaf4fb" : "transparent",
          borderBottom: "1px solid #f9fafb",
          cursor: "pointer",
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8f9fa"; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Expand/collapse toggle */}
        <span
          onMouseDown={e => { e.stopPropagation(); if (hasChildren) toggleExpand(node.id); }}
          style={{
            width: "18px", height: "18px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", color: "#9ca3af",
            cursor: hasChildren ? "pointer" : "default",
            visibility: hasChildren ? "visible" : "hidden",
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </span>

        {/* Label — clicking selects */}
        <span
          onMouseDown={() => onSelect(node.name)}
          style={{
            flex: 1, fontSize: "13px",
            fontWeight: depth === 0 ? "700" : "400",
            color: isSelected ? "#2980b9" : "#2c3e50",
          }}
        >
          {node.name}
        </span>
        {node.unitType && (
          <span style={{ fontSize: "10px", color: "#9ca3af", flexShrink: 0 }}>[{node.unitType}]</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div style={{ borderLeft: "2px solid #e5e7eb", marginLeft: `${16 + depth * 16}px` }}>
          {node.children.map(child => (
            <OrgTreeNode
              key={child.id}
              node={child}
              value={value}
              onSelect={onSelect}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgUnitTreePicker({ orgUnits, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const tree = buildOrgTree(orgUnits);
  const selected = orgUnits.find(u => u.name === value);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Expand all roots by default when tree opens
  const handleOpen = () => {
    if (!open) {
      const rootIds = new Set(orgUnits.filter(u => !u.parentId).map(u => u.id));
      setExpandedIds(rootIds);
    }
    setOpen(o => !o);
  };

  return (
    <div style={{ position: "relative" }}>
      <div onClick={handleOpen} style={{
        ...inp, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
        color: selected ? "#2c3e50" : "#9ca3af",
      }}>
        <span>{selected ? selected.name : "--Select One--"}</span>
        <span style={{ fontSize: "10px", color: "#7f8c8d", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, background: "white",
          border: "1px solid #d1d5db", borderRadius: "5px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          zIndex: 300, maxHeight: "280px", overflowY: "auto", marginTop: "2px",
        }}>
          <div onMouseDown={() => { onChange(""); setOpen(false); }}
            style={{ padding: "8px 12px", fontSize: "13px", color: "#9ca3af", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}>
            --Select One--
          </div>
          {tree.length === 0 ? (
            <div style={{ padding: "12px", color: "#9ca3af", fontSize: "13px" }}>No org units found</div>
          ) : tree.map(node => (
            <OrgTreeNode
              key={node.id}
              node={node}
              value={value}
              onSelect={(name) => { onChange(name); setOpen(false); }}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = (requesterName = "") => ({
  jobQualificationId: "",
  jobTitle: "",
  department: "",
  vacancyNumber: "",
  jobLocation: "",
  competencyFramework: "",
  recorderName: requesterName,
  batchCode: "",
  salary: "",
  hiringType: "",
  candidateIdentificationMethod: "",
  icf: "",
  incrementStep: "",
  employmentType: "",
  budgetYear: "",
  remark: "",
  recruitmentType: "",
  positionName: "",
});

export default function RecruitmentRequestPage() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [selectedJob, setSelectedJob] = useState(null);
  const [qualEntries, setQualEntries] = useState([]); // entries from job qualification
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editId, setEditId] = useState(null); // id of request being edited

  const loadAll = async () => {
    setLoading(true);
    try {
      const [reqRes, formRes] = await Promise.all([
        api.get("/recruitments"),
        api.get("/recruitments/request-form-data"),
      ]);
      setRequests(reqRes.data.filter(r => r.status !== "DRAFT"));
      setJobs(formRes.data.jobs || []);
      setOrgUnits(formRes.data.orgUnits || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleJobSelect = async (e) => {
    const jqId = e.target.value;
    const job = jobs.find(j => String(j.id) === String(jqId));
    setSelectedJob(job || null);
    // Generate batch code immediately on job selection
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const batchCode = jqId ? `REC-${ymd}-${rand}` : "";
    setForm(f => ({
      ...f,
      jobQualificationId: jqId,
      jobTitle: job?.jobTitle || "",
      competencyFramework: job?.competencyFramework || "",
      icf: job?.icf || f.icf,
      salary: "",          // free text — admin fills manually
      positionName: job?.jobTitle || "",
      batchCode,
    }));
    // Fetch qualification entries for the selected job
    if (jqId) {
      try {
        const res = await api.get(`/admin/job-qualifications/${jqId}/entries`);
        setQualEntries(res.data || []);
      } catch { setQualEntries([]); }
    } else {
      setQualEntries([]);
    }
  };

  const openEdit = async (row) => {
    setEditId(row.id);
    setForm({
      jobQualificationId: row.jobQualificationId || "",
      jobTitle: row.jobTitle || "",
      department: row.department || "",
      vacancyNumber: row.vacancyNumber || "",
      jobLocation: row.jobLocation || "",
      competencyFramework: row.competencyFramework || "",
      recorderName: row.recorderName || user?.fullName || "",
      batchCode: row.batchCode || "",
      salary: row.salary || "",
      hiringType: row.hiringType || "",
      candidateIdentificationMethod: row.candidateIdentificationMethod || "",
      icf: row.icf || "",
      incrementStep: row.incrementStep || "",
      employmentType: row.employmentType || row.hiringType || "",
      budgetYear: row.budgetYear || "",
      remark: row.remark || "",
      recruitmentType: row.recruitmentType || "",
      positionName: row.positionName || "",
    });
    // Load qualification entries if available
    if (row.jobQualificationId) {
      try {
        const res = await api.get(`/admin/job-qualifications/${row.jobQualificationId}/entries`);
        setQualEntries(res.data || []);
      } catch { setQualEntries([]); }
    } else {
      setQualEntries([]);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobQualificationId) { setMsg({ type: "error", text: "Please select a Required Job." }); return; }
    if (!form.jobLocation) { setMsg({ type: "error", text: "Please select a Working Place." }); return; }
    setSaving(true);
    try {
      const payload = { ...form, recorderName: user?.fullName || form.recorderName };
      if (editId) {
        await api.put(`/recruitments/full-request/${editId}`, payload);
        setMsg({ type: "success", text: "Request updated successfully." });
      } else {
        const res = await api.post("/recruitments/full-request", payload);
        setMsg({ type: "success", text: `Request submitted! Batch Code: ${res.data.batchCode}` });
      }
      await loadAll();
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm(user?.fullName || ""));
      setSelectedJob(null);
      setQualEntries([]);
    } catch {
      setMsg({ type: "error", text: editId ? "Failed to update request." : "Failed to submit request." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Recruitment Request</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Submit recruitment requests for approval</p>
        </div>
        <button onClick={() => { setForm(emptyForm(user?.fullName || "")); setSelectedJob(null); setQualEntries([]); setEditId(null); setShowForm(true); }}
          style={{ padding: "9px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + New Request
        </button>
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", background: msg.type === "error" ? "#fdecea" : "#e8f5e9", color: msg.type === "error" ? "#c0392b" : "#27ae60", border: `1px solid ${msg.type === "error" ? "#f5c6cb" : "#c3e6cb"}` }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "700" }}>×</button>
        </div>
      )}

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

      {/* Requests table */}
      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              {["Batch Code", "Job Title", "Working Place", "Employment Type", "Salary", "Requester", "Status", ""].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>No requests yet.</td></tr>
            ) : requests.map(row => (
              <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                <td style={{ padding: "11px 14px", fontWeight: "700", color: "#2980b9", fontSize: "12px" }}>{row.batchCode || `#${row.id}`}</td>
                <td style={{ padding: "11px 14px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{row.jobTitle}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.jobLocation || "—"}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.employmentType || row.hiringType || "—"}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.salary || "—"}</td>
                <td style={{ padding: "11px 14px", color: "#7f8c8d", fontSize: "12px" }}>{row.recorderName || "—"}</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", ...(statusStyles[row.status] || {}) }}>{row.status}</span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  {row.status === "REQUESTED" && (
                    <button onClick={() => openEdit(row)}
                      style={{ padding: "5px 12px", background: "#eaf4fb", color: "#2980b9", border: "1px solid #bae6fd", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "780px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ padding: "18px 28px", borderBottom: "1px solid #ecf0f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>{editId ? "Edit Recruitment Request" : "New Recruitment Request"}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7f8c8d" }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>

              {/* Row 1: Working Place + Required Jobs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={lbl}>Working Place <span style={{ color: "#e74c3c" }}>*</span></label>
                  <OrgUnitTreePicker
                    orgUnits={orgUnits}
                    value={form.jobLocation}
                    onChange={v => set("jobLocation", v)}
                  />
                </div>
                <div>
                  <label style={lbl}>Required Job <span style={{ color: "#e74c3c" }}>*</span></label>
                  <select required value={form.jobQualificationId} onChange={handleJobSelect} style={inp}>
                    <option value="">--Select One--</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.jobTitle} {j.classCode ? `[${j.classCode}]` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: ICF + Increment Step */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={lbl}>INSA Competency Framework (ICF) <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "400" }}>(from qualification)</span></label>
                  <div style={{ ...inp, background: "#f3f4f6", color: form.icf ? "#2c3e50" : "#9ca3af", cursor: "default", minHeight: "36px", display: "flex", alignItems: "center" }}>
                    {form.icf || "— auto-filled when job is selected —"}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Increment Step</label>
                  <select value={form.incrementStep} onChange={e => set("incrementStep", e.target.value)} style={inp}>
                    <option value="">--Select One--</option>
                    {INCREMENT_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Qualification entries table (from selected job) */}
              <div style={{ marginBottom: "16px", border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      {["No", "Education Level", "Field of Study", "Min Experience"].map(h => (
                        <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {qualEntries.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                        {form.jobQualificationId ? "No qualification entries for this job." : "Select a Required Job above to see qualification requirements."}
                      </td></tr>
                    ) : qualEntries.map((en, idx) => (
                      <tr key={en.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                        <td style={{ padding: "10px 12px", fontSize: "13px", color: "#9ca3af" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px" }}>{en.educationLevel || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px" }}>{en.fieldOfStudy || "—"}</td>
                        <td style={{ padding: "10px 12px", fontSize: "13px" }}>{en.minExperience || "0"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Row 3: Required Number + Employment Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={lbl}>Required Number <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input required type="number" min="1" value={form.vacancyNumber} onChange={e => set("vacancyNumber", e.target.value)} style={inp} placeholder="e.g. 2" />
                </div>
                <div>
                  <label style={lbl}>Employment Type <span style={{ color: "#e74c3c" }}>*</span></label>
                  <select required value={form.employmentType} onChange={e => set("employmentType", e.target.value)} style={inp}>
                    <option value="">---Select One---</option>
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: Budget Year + Remark */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={lbl}>Budget Year</label>
                  <select value={form.budgetYear} onChange={e => set("budgetYear", e.target.value)} style={inp}>
                    <option value="">--- Select ---</option>
                    {BUDGET_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Remark</label>
                  <textarea value={form.remark} onChange={e => set("remark", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
                </div>
              </div>

              {/* Row 5: Recruitment Type + Batch Code */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={lbl}>Recruitment Type <span style={{ color: "#e74c3c" }}>*</span></label>
                  <select required value={form.recruitmentType} onChange={e => set("recruitmentType", e.target.value)} style={inp}>
                    <option value="">--Select One--</option>
                    {RECRUITMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Batch Code</label>
                  <div style={{ ...inp, background: "#f3f4f6", color: "#2980b9", fontWeight: "700", cursor: "default", minHeight: "36px", display: "flex", alignItems: "center" }}>
                    {form.batchCode || <span style={{ color: "#9ca3af", fontWeight: "400", fontStyle: "italic" }}>Auto-generated when job is selected</span>}
                  </div>
                </div>
              </div>

              {/* Row 6: Requester + Position Name + Salary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={lbl}>Requester</label>
                  <input value={user?.fullName || form.recorderName} readOnly style={{ ...inp, background: "#f3f4f6", cursor: "not-allowed" }} />
                </div>
                <div>
                  <label style={lbl}>Position Name</label>
                  <select value={form.positionName} onChange={e => set("positionName", e.target.value)} style={inp}>
                    <option value="">--Select One--</option>
                    {POSITION_NAMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Salary</label>
                  <input value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="e.g. 15,000 ETB" style={inp} />
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                  style={{ flex: 1, padding: "11px", border: "1px solid #d1d5db", borderRadius: "6px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: "11px", background: saving ? "#95a5a6" : "#27ae60", color: "white", border: "none", borderRadius: "6px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", fontSize: "14px" }}>
                  {saving ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Request" : "Request")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
