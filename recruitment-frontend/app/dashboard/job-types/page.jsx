"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const depthColors = ["#8e44ad", "#2980b9", "#27ae60", "#e67e22", "#e74c3c"];
const depthIcons = ["🗂", "📁", "📄", "🔹", "▪"];

export default function JobTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", parentId: "" });
  const [saving, setSaving] = useState(false);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/job-types");
      setTypes(res.data);
      setError(null);
    } catch (e) {
      setError("Failed to load job types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const roots = types.filter(t => !t.parentId || t.parentId === "");
  const getChildren = (parentId) => types.filter(t => String(t.parentId) === String(parentId));

  const openAdd = (parentId = null) => {
    setEditItem(null);
    setForm({ name: "", parentId: parentId !== null ? String(parentId) : "" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, parentId: item.parentId ? String(item.parentId) : "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        parentId: form.parentId !== "" ? form.parentId : null,
      };
      if (editItem) {
        await api.put(`/admin/job-types/${editItem.id}`, payload);
      } else {
        await api.post("/admin/job-types", payload);
      }
      await fetchTypes();
      setShowModal(false);
    } catch (e) {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteType = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its children?`)) return;
    try {
      await api.delete(`/admin/job-types/${id}`);
      await fetchTypes();
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  const parentName = form.parentId
    ? types.find(t => String(t.id) === String(form.parentId))?.name
    : null;

  const TreeNode = ({ item, depth }) => {
    const children = getChildren(item.id);
    const color = depthColors[Math.min(depth, depthColors.length - 1)];
    const icon = depthIcons[Math.min(depth, depthIcons.length - 1)];

    return (
      <div style={{ marginLeft: depth > 0 ? "28px" : "0", position: "relative" }}>
        {depth > 0 && (
          <div style={{ position: "absolute", left: "-16px", top: "0", bottom: "0", width: "1px", background: "rgba(0,0,0,0.1)" }} />
        )}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: "white", borderRadius: "6px",
          marginBottom: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          borderLeft: `3px solid ${color}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px" }}>{icon}</span>
            <span style={{ fontWeight: depth === 0 ? "700" : "500", color: "#2c3e50", fontSize: "14px" }}>{item.name}</span>
            {children.length > 0 && (
              <span style={{ background: "#eaf4fb", color: "#2980b9", fontSize: "11px", padding: "1px 8px", borderRadius: "10px", fontWeight: "600" }}>
                {children.length} sub
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => openAdd(item.id)} title={`Add child under "${item.name}"`}
              style={{ padding: "4px 10px", background: color, color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "700", lineHeight: 1 }}>
              +
            </button>
            <button onClick={() => openEdit(item)}
              style={{ padding: "4px 10px", background: "#eaf4fb", color: "#2980b9", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
              Edit
            </button>
            <button onClick={() => deleteType(item.id, item.name)}
              style={{ padding: "4px 10px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
              Delete
            </button>
          </div>
        </div>
        {children.map(child => <TreeNode key={child.id} item={child} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Job Type Hierarchy</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Manage job categories and their hierarchy</p>
        </div>
        <button onClick={() => openAdd(null)}
          style={{ padding: "9px 20px", background: "#8e44ad", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + Add Root Category
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Total Types", value: types.length, color: "#8e44ad" },
          { label: "Root Categories", value: roots.length, color: "#2980b9" },
          { label: "Sub Types", value: types.length - roots.length, color: "#27ae60" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#f8f9fa", borderRadius: "6px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#7f8c8d", padding: "32px" }}>Loading...</p>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <p style={{ color: "#e74c3c", marginBottom: "12px" }}>{error}</p>
            <button onClick={fetchTypes} style={{ padding: "8px 18px", background: "#2980b9", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Retry</button>
          </div>
        ) : roots.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7f8c8d", padding: "32px" }}>No job types yet. Add one to get started.</p>
        ) : (
          roots.map(root => <TreeNode key={root.id} item={root} depth={0} />)
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "4px" }}>
              {editItem ? "Edit Job Type" : "Add Job Type"}
            </h2>
            <p style={{ fontSize: "13px", color: "#7f8c8d", marginBottom: "18px" }}>
              {editItem ? `Editing: ${editItem.name}` : parentName ? `Adding under: ` : "Adding as root category"}
              {!editItem && parentName && <strong style={{ color: "#2980b9" }}>{parentName}</strong>}
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  required autoFocus
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Parent Category</label>
                <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none" }}>
                  <option value="">— None (Root Category) —</option>
                  {types.filter(t => !editItem || t.id !== editItem.id).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: "10px", background: "#8e44ad", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editItem ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
