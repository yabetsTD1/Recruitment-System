"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function RecordCriteriaPage() {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ criteriaName: "", criteriaType: "", weight: "", description: "" });
  const [saving, setSaving] = useState(false);

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

  const selectRecruitment = async (r) => {
    setSelected(r);
    setSearch("");
    setResults([]);
    setOpen(false);
    setLoading(true);
    try {
      const res = await api.get(`/recruitments/${r.id}/criteria`);
      setCriteria(res.data);
    } catch {
      setCriteria([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ criteriaName: "", criteriaType: "", weight: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditItem(c);
    setForm({ criteriaName: c.criteriaName, criteriaType: c.criteriaType || "", weight: c.weight || "", description: c.description || "" });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/recruitments/${selected.id}/criteria/${editItem.id}`, form);
      } else {
        await api.post(`/recruitments/${selected.id}/criteria`, form);
      }
      const res = await api.get(`/recruitments/${selected.id}/criteria`);
      setCriteria(res.data);
      setShowModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save criteria.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this criteria?")) return;
    try {
      await api.delete(`/recruitments/${selected.id}/criteria/${id}`);
      setCriteria(prev => prev.filter(c => c.id !== id));
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Record Criteria</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Define evaluation criteria for a recruitment</p>
      </div>

      <div style={{ background: "white", borderRadius: "8px", padding: "20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "8px" }}>Select Recruitment</label>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Click or type to search recruitments..."
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
            <button onClick={() => { setSelected(null); setCriteria([]); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selected ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "48px", textAlign: "center", color: "#9ca3af", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to manage its criteria</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "8px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #ecf0f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "600", color: "#2c3e50", fontSize: "14px" }}>Criteria for: {selected.jobTitle}</span>
            <button onClick={openAdd}
              style={{ padding: "8px 16px", background: "#2980b9", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
              + Add Criteria
            </button>
          </div>
          {loading ? (
            <p style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>Loading...</p>
          ) : criteria.length === 0 ? (
            <p style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>No criteria recorded yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["#", "Criteria Name", "Type", "Weight", "Description", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", borderBottom: "1px solid #ecf0f1" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "#9ca3af" }}>{i + 1}</td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "600", color: "#2c3e50" }}>{c.criteriaName}</td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "#374151" }}>{c.criteriaType || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "#374151" }}>{c.weight || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: "13px", color: "#6b7280", maxWidth: "200px" }}>{c.description || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => openEdit(c)}
                          style={{ padding: "4px 10px", background: "#f0f9ff", color: "#2980b9", border: "1px solid #bae6fd", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Edit</button>
                        <button onClick={() => handleDelete(c.id)}
                          style={{ padding: "4px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "20px" }}>
              {editItem ? "Edit Criteria" : "Add Criteria"}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Criteria Name *</label>
                <input required value={form.criteriaName} onChange={e => setForm(p => ({ ...p, criteriaName: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Type</label>
                <select value={form.criteriaType} onChange={e => setForm(p => ({ ...p, criteriaType: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}>
                  <option value="">Select type...</option>
                  <option value="Education">Education</option>
                  <option value="Experience">Experience</option>
                  <option value="Skill">Skill</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Weight (%)</label>
                <input type="number" min="0" max="100" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: "10px", background: "#2980b9", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
