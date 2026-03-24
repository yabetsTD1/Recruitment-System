"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusStyles = {
  REQUESTED: { background: "#fef3c7", color: "#92400e" },
  APPROVED: { background: "#d1fae5", color: "#065f46" },
  REJECTED: { background: "#fee2e2", color: "#b91c1c" },
  DRAFT: { background: "#f3f4f6", color: "#374151" },
  POSTED: { background: "#dbeafe", color: "#1d4ed8" },
};

const VACANCY_TYPES = ["Inside", "Outside"];

export default function RecruitmentApprovalPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ remark: "", vacancyType: "Inside", action: "" });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/recruitments");
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSelect = (row) => {
    setSelected(row);
    setForm({ remark: "", vacancyType: "Inside", action: "" });
  };

  const handleSave = async () => {
    if (!selected || !form.action) { alert("Please choose Approve or Reject."); return; }
    setSaving(true);
    try {
      const endpoint = form.action === "approve"
        ? `/recruitments/${selected.id}/approve`
        : `/recruitments/${selected.id}/reject`;
      await api.post(endpoint, { comment: form.remark, vacancyType: form.vacancyType });
      await loadData();
      setSelected(null);
    } catch (e) {
      alert("Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const requested = data.filter(d => d.status === "REQUESTED");
  const approved = data.filter(d => d.status === "APPROVED" || d.status === "POSTED");
  const rejected = data.filter(d => d.status === "REJECTED");

  const inputStyle = {
    width: "100%", padding: "7px 10px", border: "1px solid #d1d5db",
    borderRadius: "4px", fontSize: "13px", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px",
  };
  const readonlyStyle = {
    ...inputStyle, background: "#f3f4f6", color: "#374151", cursor: "not-allowed",
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Recruitment Approval</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Review and approve or reject recruitment requests</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Awaiting Approval", value: requested.length, color: "#e67e22" },
          { label: "Approved", value: approved.length, color: "#27ae60" },
          { label: "Rejected", value: rejected.length, color: "#e74c3c" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "14px 18px", color: "white" }}>
            <p style={{ fontSize: "26px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        {/* Left: list */}
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f8f9fa", borderBottom: "1px solid #ecf0f1", fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>
            Recruitment Requests
          </div>
          {loading ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#7f8c8d" }}>Loading...</p>
          ) : data.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#7f8c8d" }}>No requests yet.</p>
          ) : (
            <div>
              {data.map((row, idx) => (
                <div key={row.id} onClick={() => handleSelect(row)}
                  style={{
                    padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f0f3f4",
                    background: selected?.id === row.id ? "#eaf4fb" : "white",
                    borderLeft: selected?.id === row.id ? "3px solid #2980b9" : "3px solid transparent",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#7f8c8d" }}>{idx + 1}.</span>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>{row.jobTitle}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#7f8c8d" }}>
                        {row.batchCode || `#${row.id}`} · {row.recorderName || "—"}
                      </div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "700", ...statusStyles[row.status] }}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail form */}
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f8f9fa", borderBottom: "1px solid #ecf0f1", fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>
            {selected ? "Approval Detail" : "Select a request to review"}
          </div>

          {!selected ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
              Click a request from the list to review it
            </div>
          ) : (
            <div style={{ padding: "20px" }}>
              {/* Top info row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", padding: "14px", background: "#f8f9fa", borderRadius: "6px", border: "1px solid #ecf0f1" }}>
                <div>
                  <label style={labelStyle}>Job Title</label>
                  <input value={selected.jobTitle || ""} readOnly style={readonlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input value={selected.department || "—"} readOnly style={readonlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Batch Code</label>
                  <input value={selected.batchCode || `#${selected.id}`} readOnly style={readonlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Recorder Name</label>
                  <input value={selected.recorderName || "—"} readOnly style={readonlyStyle} />
                </div>
              </div>

              {/* Second row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Serial No.</label>
                  <input value={selected.id} readOnly style={readonlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Vacancies</label>
                  <input value={selected.vacancyNumber || 1} readOnly style={readonlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hiring Type</label>
                  <input value={selected.hiringType || "—"} readOnly style={readonlyStyle} />
                </div>
              </div>

              {/* Salary + Location */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Salary</label>
                  <input value={selected.salary || "—"} readOnly style={readonlyStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Job Location</label>
                  <input value={selected.jobLocation || "—"} readOnly style={readonlyStyle} />
                </div>
              </div>

              {/* Approval fields */}
              <div style={{ borderTop: "1px solid #ecf0f1", paddingTop: "16px", marginTop: "4px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={labelStyle}>Vacancy Type</label>
                    <select value={form.vacancyType} onChange={e => setForm({ ...form, vacancyType: e.target.value })}
                      style={{ ...inputStyle, background: selected.status !== "REQUESTED" ? "#f3f4f6" : "white" }}
                      disabled={selected.status !== "REQUESTED"}>
                      {VACANCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <input value={selected.status} readOnly style={{
                      ...readonlyStyle,
                      ...(statusStyles[selected.status] || {}),
                      fontWeight: "700",
                    }} />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Remark / Comment</label>
                  <textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })}
                    rows={3} disabled={selected.status !== "REQUESTED"}
                    placeholder={selected.status !== "REQUESTED" ? "Already processed" : "Enter remark..."}
                    style={{ ...inputStyle, resize: "vertical", background: selected.status !== "REQUESTED" ? "#f3f4f6" : "white" }} />
                </div>

                {selected.status === "REQUESTED" && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => setForm(f => ({ ...f, action: "approve" }))}
                      style={{
                        flex: 1, padding: "9px", border: "2px solid #27ae60", borderRadius: "5px",
                        fontWeight: "700", fontSize: "13px", cursor: "pointer",
                        background: form.action === "approve" ? "#27ae60" : "white",
                        color: form.action === "approve" ? "white" : "#27ae60",
                      }}>
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => setForm(f => ({ ...f, action: "reject" }))}
                      style={{
                        flex: 1, padding: "9px", border: "2px solid #e74c3c", borderRadius: "5px",
                        fontWeight: "700", fontSize: "13px", cursor: "pointer",
                        background: form.action === "reject" ? "#e74c3c" : "white",
                        color: form.action === "reject" ? "white" : "#e74c3c",
                      }}>
                      ✗ Reject
                    </button>
                    <button onClick={handleSave} disabled={saving || !form.action}
                      style={{
                        flex: 1, padding: "9px", background: form.action ? "#2980b9" : "#d1d5db",
                        color: "white", border: "none", borderRadius: "5px",
                        fontWeight: "700", fontSize: "13px",
                        cursor: saving || !form.action ? "not-allowed" : "pointer",
                        opacity: saving ? 0.7 : 1,
                      }}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}

                {selected.status !== "REQUESTED" && (
                  <div style={{ padding: "10px 14px", borderRadius: "5px", fontSize: "13px", fontWeight: "600", textAlign: "center", ...statusStyles[selected.status] }}>
                    This request has been {selected.status.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
