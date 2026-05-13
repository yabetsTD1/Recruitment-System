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
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, orgRes] = await Promise.all([
        api.get("/recruitments"),
        api.get("/admin/org-units"),
      ]);
      setData(recRes.data);
      setOrgUnits(Array.isArray(orgRes.data) ? orgRes.data : []);
      setError(null);
    } catch (e) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
      await fetchData();
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
      await fetchData();
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  const handleRequest = async (id) => {
    try {
      await api.post(`/recruitments/${id}/request`);
      await fetchData();
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
        {/* Search bar */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #ecf0f1", background: "#f8f9fa", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by job title or batch code..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShowAll(false); }}
            style={{ border: "none", outline: "none", fontSize: "13px", background: "transparent", flex: 1, color: "#2c3e50" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              {["Job Title", "Working Place", "Vacancies", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#e74c3c" }}>{error}</td></tr>
            ) : (() => {
                const q = search.toLowerCase().trim();
                const filtered = q
                  ? data.filter(row =>
                      (row.jobTitle || "").toLowerCase().includes(q) ||
                      (row.batchCode || "").toLowerCase().includes(q)
                    )
                  : data;
                const displayed = (search || showAll) ? filtered : filtered.slice(-5).reverse();
                if (filtered.length === 0) return (
                  <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>
                    {search ? "No results match your search." : "No records found."}
                  </td></tr>
                );
                return displayed.map((row) => (
                  <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                    <td style={{ padding: "13px 18px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{row.jobTitle}</td>
                    <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.jobLocation || row.department || "—"}</td>
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
                ));
              })()}
          </tbody>
        </table>
        {/* Show all / show less footer */}
        {!loading && !error && !search && data.length > 5 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f3f4", textAlign: "center" }}>
            <button onClick={() => setShowAll(v => !v)}
              style={{ background: "none", border: "none", color: "#2980b9", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
              {showAll ? `▲ Show recent 5 only` : `▼ Show all ${data.length} records`}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "20px" }}>{editItem ? "Edit" : "Add"} Vacant Space</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Job Title</label>
                <input type="text" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} required
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Working Place</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "white" }}>
                  <option value="">-- Select Working Place --</option>
                  {orgUnits.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Number of Vacancies</label>
                <input type="number" value={form.vacancyNumber} onChange={e => setForm({ ...form, vacancyNumber: e.target.value })} required
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
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
