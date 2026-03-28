"use client";
import { useState, useEffect, useContext } from "react";
import api from "@/services/api";
import { AuthContext } from "@/context/AuthContext";

const statusStyles = {
  REQUESTED: { background: "#fef3c7", color: "#92400e" },
  APPROVED:  { background: "#d1fae5", color: "#065f46" },
  REJECTED:  { background: "#fee2e2", color: "#b91c1c" },
  DRAFT:     { background: "#f3f4f6", color: "#374151" },
  POSTED:    { background: "#dbeafe", color: "#1d4ed8" },
  CLOSED:    { background: "#f3f4f6", color: "#374151" },
};

const AD_TYPES = ["Internal", "External", "Both"];
const DECISIONS = ["APPROVED", "REJECTED"];

const inp = { width: "100%", padding: "8px 11px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "white" };
const ro  = { ...inp, background: "#f3f4f6", cursor: "not-allowed", color: "#374151" };
const lbl = { display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" };

function InfoRow({ label, value }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input value={value || "—"} readOnly style={ro} />
    </div>
  );
}

export default function RecruitmentApprovalPage() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ comment: "", advertisementType: "", decision: "", vacancyType: "Inside" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/recruitments");
      setData(res.data.filter(r => r.status !== "DRAFT"));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSelect = async (row) => {
    setSelected(row);
    setForm({ comment: "", advertisementType: "", decision: "", vacancyType: "Inside" });
    setMsg(null);
    // Load qualification entries if jobQualificationId exists
    if (row.jobQualificationId) {
      try {
        const res = await api.get(`/admin/job-qualifications/${row.jobQualificationId}/entries`);
        setEntries(res.data);
      } catch { setEntries([]); }
    } else {
      setEntries([]);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!form.decision) { setMsg({ type: "error", text: "Please select a Decision." }); return; }
    setSaving(true);
    try {
      const endpoint = form.decision === "APPROVED"
        ? `/recruitments/${selected.id}/approve`
        : `/recruitments/${selected.id}/reject`;
      await api.post(endpoint, {
        comment: form.comment,
        vacancyType: form.advertisementType === "External" ? "Outside"
          : form.advertisementType === "Both" ? "Both"
          : "Inside",
        advertisementType: form.advertisementType,
      });
      setMsg({ type: "success", text: `Request ${form.decision.toLowerCase()} successfully.` });
      await loadData();
      // refresh selected
      const updated = (await api.get("/recruitments")).data.find(r => r.id === selected.id);
      if (updated) setSelected(updated);
    } catch {
      setMsg({ type: "error", text: "Action failed. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const requested = data.filter(d => d.status === "REQUESTED");
  const approved  = data.filter(d => d.status === "APPROVED" || d.status === "POSTED");
  const rejected  = data.filter(d => d.status === "REJECTED");

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" }}>

        {/* Left: requests list */}
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f8f9fa", borderBottom: "1px solid #ecf0f1", fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>
            Requests ({data.length})
          </div>
          {loading ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#7f8c8d" }}>Loading...</p>
          ) : data.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#7f8c8d" }}>No requests yet.</p>
          ) : data.map((row, idx) => (
            <div key={row.id} onClick={() => handleSelect(row)}
              style={{
                padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f0f3f4",
                background: selected?.id === row.id ? "#eaf4fb" : "white",
                borderLeft: selected?.id === row.id ? "3px solid #2980b9" : "3px solid transparent",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#2c3e50", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {idx + 1}. {row.jobTitle}
                  </div>
                  <div style={{ fontSize: "11px", color: "#7f8c8d" }}>
                    {row.batchCode || `#${row.id}`} · {row.recorderName || "—"}
                  </div>
                </div>
                <span style={{ padding: "2px 7px", borderRadius: "20px", fontSize: "10px", fontWeight: "700", flexShrink: 0, ...statusStyles[row.status] }}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: detail */}
        {!selected ? (
          <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", padding: "60px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
            Click a request from the list to review it
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {msg && (
              <div style={{ padding: "10px 16px", borderRadius: "7px", fontSize: "13px", background: msg.type === "error" ? "#fdecea" : "#e8f5e9", color: msg.type === "error" ? "#c0392b" : "#27ae60", border: `1px solid ${msg.type === "error" ? "#f5c6cb" : "#c3e6cb"}` }}>
                {msg.text}
                <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "700" }}>×</button>
              </div>
            )}

            {/* Section 1: Requested Information */}
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "#d6eaf8", borderBottom: "1px solid #aed6f1", fontSize: "13px", fontWeight: "700", color: "#1a5276" }}>
                Requested Information
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <InfoRow label="Working Place" value={selected.jobLocation} />
                  <InfoRow label="Required Job Type" value={selected.jobTitle} />
                  <InfoRow label="Job Grade / Class" value={selected.classCode} />
                  <InfoRow label="INSA Competency Framework (ICF)" value={selected.icf} />
                </div>

                {/* Qualification entries table */}
                <div style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr>
                        {["No", "Education Level", "Field of Study", "Min Experience"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>No qualification entries.</td></tr>
                      ) : entries.map((en, idx) => (
                        <tr key={en.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                          <td style={{ padding: "8px 12px", fontSize: "13px", color: "#9ca3af" }}>{idx + 1}</td>
                          <td style={{ padding: "8px 12px", fontSize: "13px" }}>{en.educationLevel || "—"}</td>
                          <td style={{ padding: "8px 12px", fontSize: "13px" }}>{en.fieldOfStudy || "—"}</td>
                          <td style={{ padding: "8px 12px", fontSize: "13px" }}>{en.minExperience || "0"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <InfoRow label="Required Number" value={selected.vacancyNumber} />
                  <InfoRow label="Employment Type" value={selected.employmentType || selected.hiringType} />
                  <InfoRow label="Requester Name" value={selected.recorderName} />
                  <InfoRow label="Recruitment Type" value={selected.recruitmentType} />
                  <InfoRow label="Budget Year" value={selected.budgetYear || (selected.createdAt ? selected.createdAt.slice(0, 4) : "—")} />
                  <InfoRow label="Increment Step" value={selected.incrementStep || "0"} />
                  <InfoRow label="Position Name" value={selected.positionName} />
                  <InfoRow label="Salary" value={selected.salary} />
                </div>
              </div>
            </div>

            {/* Section 2: Approval */}
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "#d6eaf8", borderBottom: "1px solid #aed6f1", fontSize: "13px", fontWeight: "700", color: "#1a5276" }}>
                Approval
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={lbl}>Batch Code</label>
                    <input value={selected.batchCode || `#${selected.id}`} readOnly style={ro} />
                  </div>
                  <div>
                    <label style={lbl}>Advertisement Type</label>
                    <select
                      value={form.advertisementType}
                      onChange={e => setForm(f => ({ ...f, advertisementType: e.target.value }))}
                      disabled={selected.status !== "REQUESTED"}
                      style={{ ...inp, background: selected.status !== "REQUESTED" ? "#f3f4f6" : "white" }}>
                      <option value="">---- Select One ----</option>
                      {AD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Comment Given</label>
                    <textarea
                      value={form.comment}
                      onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                      disabled={selected.status !== "REQUESTED"}
                      rows={3}
                      style={{ ...inp, resize: "vertical", background: selected.status !== "REQUESTED" ? "#f3f4f6" : "white" }} />
                  </div>
                  <div>
                    <label style={lbl}>Decision <span style={{ color: "#e74c3c" }}>*</span></label>
                    <select
                      value={form.decision}
                      onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}
                      disabled={selected.status !== "REQUESTED"}
                      style={{ ...inp, background: selected.status !== "REQUESTED" ? "#f3f4f6" : "white" }}>
                      <option value="">--Select One--</option>
                      {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Approved By</label>
                    <input value={user?.fullName || "—"} readOnly style={ro} />
                  </div>
                </div>

                {selected.status === "REQUESTED" ? (
                  <button onClick={handleSave} disabled={saving || !form.decision}
                    style={{
                      width: "100%", padding: "11px", background: saving || !form.decision ? "#95a5a6" : "#27ae60",
                      color: "white", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "14px",
                      cursor: saving || !form.decision ? "not-allowed" : "pointer",
                    }}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                ) : (
                  <div style={{ padding: "10px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", textAlign: "center", ...statusStyles[selected.status] }}>
                    This request has already been {selected.status.toLowerCase()}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
