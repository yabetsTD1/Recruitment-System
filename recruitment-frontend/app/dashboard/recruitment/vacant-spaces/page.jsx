"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusStyle = (s) => {
  if (s === "DRAFT") return { background: "#f3f4f6", color: "#374151" };
  if (s === "APPROVED" || s === "POSTED") return { background: "#d1fae5", color: "#065f46" };
  if (s === "REQUESTED") return { background: "#fef3c7", color: "#92400e" };
  return { background: "#fee2e2", color: "#b91c1c" };
};

const emptyForm = { jobTitle: "", department: "", vacancyNumber: 1, description: "" };

export default function VacantSpacesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/recruitments");
      setData(res.data);
      setError(null);
    } catch (e) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ jobTitle: item.jobTitle, department: item.department, vacancyNumber: item.vacancyNumber, description: item.description });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/recruitments/${editItem.id}`, form);
      } else {
        await api.post("/recruitments", form);
      }
      await fetch();
      setShowForm(false);
    } catch (e) {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this recruitment?")) return;
    try {
      await api.delete(`/recruitments/${id}`);
      await fetch();
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  const handleRequest = async (id) => {
    try {
      await api.post(`/recruitments/${id}/request`);
      await fetch();
    } catch (e) {
      alert("Failed to submit request.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Vacant Spaces</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Manage available positions in the organization</p>
        </div>
        <button onClick={openAdd}
          style={{ padding: "9px 20px", background: "#2980b9", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + Add Vacant Space
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Vacancies", value: data.reduce((s, d) => s + (d.vacancyNumber || 0), 0), color: "#2980b9" },
          { label: "Approved / Posted", value: data.filter(d => d.status === "APPROVED" || d.status === "POSTED").length, color: "#27ae60" },
          { label: "Pending Request", value: data.filter(d => d.status === "REQUESTED").length, color: "#e67e22" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              {["Job Title", "Department", "Vacancies", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#e74c3c" }}>{error}</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>No records found.</td></tr>
            ) : data.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                <td style={{ padding: "13px 18px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{row.jobTitle}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.department}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.vacancyNumber}</td>
                <td style={{ padding: "13px 18px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", ...statusStyle(row.status) }}>{row.status}</span>
                </td>
                <td style={{ padding: "13px 18px", display: "flex", gap: "8px", alignItems: "center" }}>
                  {row.status === "DRAFT" && (
                    <button onClick={() => handleRequest(row.id)} style={{ color: "#e67e22", background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Request</button>
                  )}
                  <button onClick={() => openEdit(row)} style={{ color: "#2980b9", background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Edit</button>
                  <button onClick={() => handleDelete(row.id)} style={{ color: "#e74c3c", background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "20px" }}>{editItem ? "Edit" : "Add"} Vacant Space</h2>
            <form onSubmit={handleSubmit}>
              {[
                { label: "Job Title", name: "jobTitle", type: "text" },
                { label: "Department", name: "department", type: "text" },
                { label: "Number of Vacancies", name: "vacancyNumber", type: "number" },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>{f.label}</label>
                  <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })} required
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: "10px", background: "#2980b9", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editItem ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
