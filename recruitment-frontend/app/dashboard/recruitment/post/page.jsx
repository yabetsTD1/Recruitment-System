"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const today = () => new Date().toISOString().split("T")[0];

const isClosed = (closingDate) => {
  if (!closingDate) return false;
  return new Date(closingDate) < new Date(today());
};

export default function RecruitmentPostPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ postingDate: today(), closingDate: "", passingDays: "", remark: "" });
  const [saving, setSaving] = useState(false);

  // Add N working days (Mon-Fri) to a date string, return yyyy-MM-dd
  const addWorkingDays = (startDateStr, days) => {
    if (!startDateStr || !days || days <= 0) return "";
    const d = new Date(startDateStr);
    let count = 0;
    while (count < days) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay(); // 0=Sun, 6=Sat
      if (dow !== 0 && dow !== 6) count++;
    }
    return d.toISOString().split("T")[0];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/recruitments");
      const list = res.data;
      // auto-close any posted jobs past their closing date
      for (const r of list) {
        if (r.status === "POSTED" && r.closingDate && isClosed(r.closingDate)) {
          try { await api.post(`/recruitments/${r.id}/close`); } catch (_) {}
        }
      }
      // reload after potential closes
      const res2 = await api.get("/recruitments");
      setData(res2.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSelect = (row) => {
    setSelected(row);
    setForm({ postingDate: today(), closingDate: row.closingDate || "", passingDays: "", remark: "" });
  };

  const handlePost = async () => {
    if (!selected) return;
    if (!form.closingDate) { alert("Please set a closing date."); return; }
    setSaving(true);
    try {
      const postType = selected.vacancyType === "Outside" ? "EXTERNAL"
        : selected.vacancyType === "Both" ? "BOTH"
        : "INTERNAL";

      if (postType === "BOTH") {
        // Create both INTERNAL and EXTERNAL posts
        await api.post(`/recruitments/${selected.id}/post`, {
          postType: "INTERNAL",
          closingDate: form.closingDate,
          remark: form.remark,
        });
        await api.post(`/recruitments/${selected.id}/post`, {
          postType: "EXTERNAL",
          closingDate: form.closingDate,
          remark: form.remark,
        });
      } else {
        await api.post(`/recruitments/${selected.id}/post`, {
          postType,
          closingDate: form.closingDate,
          remark: form.remark,
        });
      }
      await loadData();
      setSelected(null);
    } catch (e) {
      alert("Failed to post.");
    } finally {
      setSaving(false);
    }
  };

  const approved = data.filter(d => d.status === "APPROVED");
  const posted = data.filter(d => d.status === "POSTED");
  const closed = data.filter(d => d.status === "CLOSED");

  const inputStyle = {
    width: "100%", padding: "8px 11px", border: "1px solid #d1d5db",
    borderRadius: "4px", fontSize: "13px", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px",
  };
  const readonlyStyle = { ...inputStyle, background: "#f3f4f6", cursor: "not-allowed" };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Recruitment Post</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Publish approved recruitments as job postings</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Total", value: data.length, color: "#2980b9" },
          { label: "Ready to Post", value: approved.length, color: "#8e44ad" },
          { label: "Posted", value: posted.length, color: "#27ae60" },
          { label: "Closed", value: closed.length, color: "#7f8c8d" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "14px 16px", color: "white" }}>
            <p style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "12px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px", alignItems: "start" }}>
        {/* Left: approved list */}
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f8f9fa", borderBottom: "1px solid #ecf0f1", fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>
            Approved — Ready to Post ({approved.length})
          </div>
          {loading ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#7f8c8d" }}>Loading...</p>
          ) : approved.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
              No approved recruitments. Approve from the Approval page first.
            </p>
          ) : approved.map((row) => (
            <div key={row.id} onClick={() => handleSelect(row)}
              style={{
                padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f0f3f4",
                background: selected?.id === row.id ? "#eaf4fb" : "white",
                borderLeft: selected?.id === row.id ? "3px solid #2980b9" : "3px solid transparent",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#2c3e50", margin: "0 0 2px 0" }}>{row.jobTitle}</p>
                  <p style={{ fontSize: "11px", color: "#7f8c8d", margin: 0 }}>
                    {row.batchCode || `#${row.id}`} ·
                    <span style={{
                      marginLeft: "6px", padding: "1px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: "700",
                      background: row.vacancyType === "Outside" ? "#dbeafe" : "#d1fae5",
                      color: row.vacancyType === "Outside" ? "#1d4ed8" : "#065f46",
                    }}>{row.vacancyType === "Outside" ? "External" : "Internal"}</span>
                  </p>
                </div>
                <span style={{ fontSize: "11px", color: "#7f8c8d" }}>{row.vacancyNumber} pos.</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: post form */}
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f8f9fa", borderBottom: "1px solid #ecf0f1", fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>
            {selected ? "Post Details" : "Select a recruitment to post"}
          </div>

          {!selected ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
              Click an approved recruitment from the list to publish it
            </div>
          ) : (
            <div style={{ padding: "20px" }}>
              {/* Info section */}
              <div style={{ padding: "14px", background: "#f8f9fa", borderRadius: "6px", border: "1px solid #ecf0f1", marginBottom: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={labelStyle}>Batch Code</label>
                    <input value={selected.batchCode || `#${selected.id}`} readOnly style={readonlyStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Job Title</label>
                    <input value={selected.jobTitle} readOnly style={readonlyStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Recorder Name</label>
                    <input value={selected.recorderName || "—"} readOnly style={readonlyStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Vacancy Type</label>
                    <input value={selected.vacancyType === "Outside" ? "External" : "Internal"} readOnly
                      style={{ ...readonlyStyle, fontWeight: "700",
                        color: selected.vacancyType === "Outside" ? "#1d4ed8" : "#065f46",
                        background: selected.vacancyType === "Outside" ? "#dbeafe" : "#d1fae5",
                      }} />
                  </div>
                </div>
              </div>

              {/* Posting dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={labelStyle}>Posting Date *</label>
                  <input type="date" value={form.postingDate}
                    onChange={e => {
                      const pd = e.target.value;
                      const cd = form.passingDays ? addWorkingDays(pd, Number(form.passingDays)) : form.closingDate;
                      setForm(f => ({ ...f, postingDate: pd, closingDate: cd }));
                    }}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Passing Days (working days)</label>
                  <input
                    type="number" min="1" placeholder="e.g. 5"
                    value={form.passingDays}
                    onChange={e => {
                      const days = e.target.value;
                      const cd = days ? addWorkingDays(form.postingDate, Number(days)) : "";
                      setForm(f => ({ ...f, passingDays: days, closingDate: cd }));
                    }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Closing Date *</label>
                  <input type="date" value={form.closingDate}
                    onChange={e => setForm(f => ({ ...f, closingDate: e.target.value, passingDays: "" }))}
                    min={form.postingDate} style={inputStyle} />
                </div>
              </div>

              {/* Remark */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Remark</label>
                <textarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })}
                  rows={3} placeholder="Optional remark..."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Visibility note */}
              <div style={{
                padding: "10px 14px", borderRadius: "5px", marginBottom: "16px", fontSize: "12px", fontWeight: "600",
                background: selected.vacancyType === "Outside" ? "#dbeafe" : selected.vacancyType === "Both" ? "#fef3c7" : "#d1fae5",
                color: selected.vacancyType === "Outside" ? "#1d4ed8" : selected.vacancyType === "Both" ? "#92400e" : "#065f46",
              }}>
                {selected.vacancyType === "Outside"
                  ? "🌐 Will be visible on the public jobs page (external applicants)"
                  : selected.vacancyType === "Both"
                  ? "🌐🏢 Will be visible to both external applicants and INSA employees"
                  : "🏢 Will be visible to INSA employees only (internal)"}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setSelected(null)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button onClick={handlePost} disabled={saving}
                  style={{ flex: 2, padding: "10px", background: "#27ae60", color: "white", border: "none", borderRadius: "5px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Publishing..." : "Save & Publish"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posted jobs table */}
      <div style={{ marginTop: "24px", background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "#f8f9fa", borderBottom: "1px solid #ecf0f1", fontSize: "13px", fontWeight: "700", color: "#2c3e50" }}>
          Posted Recruitments
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              {["#", "Batch Code", "Job Title", "Type", "Posting Date", "Closing Date", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
            ) : [...posted, ...closed].length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>No records found.</td></tr>
            ) : [...posted, ...closed].map((row, idx) => {
              const expired = row.closingDate && isClosed(row.closingDate);
              return (
                <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4", opacity: row.status === "CLOSED" ? 0.6 : 1 }}>
                  <td style={{ padding: "10px 14px", fontSize: "12px", color: "#7f8c8d" }}>{idx + 1}</td>
                  <td style={{ padding: "10px 14px", fontWeight: "700", color: "#2980b9", fontSize: "12px" }}>{row.batchCode || `#${row.id}`}</td>
                  <td style={{ padding: "10px 14px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{row.jobTitle}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700",
                      background: row.vacancyType === "Outside" ? "#dbeafe" : "#d1fae5",
                      color: row.vacancyType === "Outside" ? "#1d4ed8" : "#065f46",
                    }}>{row.vacancyType === "Outside" ? "External" : "Internal"}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "12px", color: "#7f8c8d" }}>{row.postingDate || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: "12px", color: expired ? "#e74c3c" : "#7f8c8d", fontWeight: expired ? "700" : "400" }}>
                    {row.closingDate || "—"}
                    {expired && <span style={{ marginLeft: "4px", fontSize: "10px" }}>⚠ Expired</span>}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                      background: row.status === "POSTED" ? "#d1fae5" : "#f3f4f6",
                      color: row.status === "POSTED" ? "#065f46" : "#374151",
                    }}>{row.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
