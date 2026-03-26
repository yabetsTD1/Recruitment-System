"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const EMPTY = { name: "" };

export default function JobTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/job-types");
      setTypes(res.data);
    } catch {
      setMsg({ type: "error", text: "Failed to load job types." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/job-types/${editItem.id}`, { name: form.name.trim() });
        setMsg({ type: "success", text: "Job type updated." });
      } else {
        await api.post("/admin/job-types", { name: form.name.trim() });
        setMsg({ type: "success", text: "Job type created." });
      }
      await fetchTypes();
      setShowModal(false);
    } catch {
      setMsg({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.delete(`/admin/job-types/${item.id}`);
      setMsg({ type: "success", text: `"${item.name}" deleted.` });
      fetchTypes();
    } catch {
      setMsg({ type: "error", text: "Failed to delete." });
    }
  };

  const filtered = types.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700" }}>Job Types</h2>
          <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>Manage the list of job types used across the system</p>
        </div>
        <button onClick={openAdd}
          style={{ padding: "9px 20px", background: "#8e44ad", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
          + Add Job Type
        </button>
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", background: msg.type === "error" ? "#fdecea" : "#e8f5e9", color: msg.type === "error" ? "#c0392b" : "#27ae60", border: `1px solid ${msg.type === "error" ? "#f5c6cb" : "#c3e6cb"}` }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "700" }}>×</button>
        </div>
      )}

      {/* Stats + Search */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ background: "#f3e5f5", borderRadius: "10px", padding: "14px 22px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px", fontWeight: "700", color: "#8e44ad" }}>{types.length}</span>
          <span style={{ fontSize: "13px", color: "#7f8c8d" }}>Total Job Types</span>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search job types..."
          style={{ padding: "9px 14px", border: "1px solid #dde1e7", borderRadius: "7px", fontSize: "13px", outline: "none", minWidth: "220px" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>
            {types.length === 0 ? "No job types yet. Click \"+ Add Job Type\" to create one." : "No results match your search."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                {["#", "Job Type Name", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #eee" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "13px 20px", fontSize: "13px", color: "#9ca3af", width: "48px" }}>{idx + 1}</td>
                  <td style={{ padding: "13px 20px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8e44ad", flexShrink: 0, display: "inline-block" }}></span>
                      {item.name}
                    </div>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => openEdit(item)}
                        style={{ padding: "5px 14px", background: "#eaf0fb", color: "#2980b9", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item)}
                        style={{ padding: "5px 14px", background: "#fdecea", color: "#c0392b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{editItem ? "Edit Job Type" : "Add Job Type"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "6px" }}>
                  Job Type Name <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <input
                  autoFocus required
                  value={form.name} onChange={e => setForm({ name: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #dde1e7", fontSize: "14px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: "9px 20px", background: "#f3f4f6", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "9px 20px", background: saving ? "#95a5a6" : "#8e44ad", color: "white", border: "none", borderRadius: "7px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}>
                  {saving ? "Saving..." : editItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
