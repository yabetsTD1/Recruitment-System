"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

const UNIT_TYPES = ["DIRECTORATE", "DEPARTMENT", "DIVISION", "TEAM", "UNIT"];

const TYPE_COLORS = {
  DIRECTORATE: { bg: "#eaf0fb", color: "#2980b9", border: "#2980b9" },
  DEPARTMENT:  { bg: "#e8f5e9", color: "#27ae60", border: "#27ae60" },
  DIVISION:    { bg: "#fef9e7", color: "#d68910", border: "#e67e22" },
  TEAM:        { bg: "#fdecea", color: "#c0392b", border: "#e74c3c" },
  UNIT:        { bg: "#f3e5f5", color: "#8e44ad", border: "#8e44ad" },
};

const EMPTY = { name: "", code: "", description: "", parentId: "", unitType: "DEPARTMENT" };

// Build tree from flat list
function buildTree(nodes, parentId = null) {
  return nodes
    .filter(n => (n.parentId ?? null) === parentId)
    .map(n => ({ ...n, children: buildTree(nodes, n.id) }));
}

function TreeNode({ node, depth, onEdit, onDelete, onAddChild, readonly }) {
  const [open, setOpen] = useState(true);
  const tc = TYPE_COLORS[node.unitType] || TYPE_COLORS.DEPARTMENT;
  const hasChildren = node.children?.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? "24px" : "0" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "9px 14px", borderRadius: "8px", marginBottom: "4px",
        background: tc.bg, border: `1px solid ${tc.border}22`,
        borderLeft: `3px solid ${tc.border}`,
      }}>
        {/* Expand toggle */}
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: hasChildren ? "pointer" : "default", fontSize: "12px", color: "#9ca3af", width: "16px", flexShrink: 0 }}>
          {hasChildren ? (open ? "▼" : "▶") : "•"}
        </button>

        {/* Type badge */}
        <span style={{ fontSize: "10px", fontWeight: "700", padding: "1px 7px", borderRadius: "10px", background: tc.color, color: "white", flexShrink: 0 }}>
          {node.unitType}
        </span>

        {/* Name + code */}
        <span style={{ fontWeight: "700", fontSize: "14px", color: "#1f2937", flex: 1 }}>{node.name}</span>
        {node.code && <span style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>[{node.code}]</span>}
        {node.description && <span style={{ fontSize: "11px", color: "#b0b8c1", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.description}</span>}

        {/* Actions — hidden for readonly */}
        {!readonly && (
          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            <button onClick={() => onAddChild(node)} title="Add child unit"
              style={{ padding: "3px 9px", background: "#e8f5e9", color: "#27ae60", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>
              + Child
            </button>
            <button onClick={() => onEdit(node)} title="Edit"
              style={{ padding: "3px 9px", background: "#eaf0fb", color: "#2980b9", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>
              Edit
            </button>
            <button onClick={() => onDelete(node)} title="Delete"
              style={{ padding: "3px 9px", background: "#fdecea", color: "#c0392b", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {open && hasChildren && (
        <div style={{ borderLeft: "2px dashed #e5e7eb", marginLeft: "20px", paddingLeft: "4px" }}>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} readonly={readonly} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgStructurePage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [readonly, setReadonly] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setReadonly(user.role === "ADMIN");
    } catch {}
  }, []);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/org-units");
      setUnits(res.data);
    } catch {
      setMsg({ type: "error", text: "Failed to load org units." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = (parentNode = null) => {
    setEditId(null);
    setForm({ ...EMPTY, parentId: parentNode ? String(parentNode.id) : "" });
    setShowForm(true);
  };

  const openEdit = (node) => {
    setEditId(node.id);
    setForm({
      name: node.name,
      code: node.code || "",
      description: node.description || "",
      parentId: node.parentId != null ? String(node.parentId) : "",
      unitType: node.unitType || "DEPARTMENT",
    });
    setShowForm(true);
  };

  const handleDelete = async (node) => {
    if (!confirm(`Delete "${node.name}"? Its children will be moved up.`)) return;
    try {
      await api.delete(`/admin/org-units/${node.id}`);
      setMsg({ type: "success", text: `"${node.name}" deleted.` });
      fetchUnits();
    } catch {
      setMsg({ type: "error", text: "Failed to delete." });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setMsg({ type: "error", text: "Name is required." }); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        parentId: form.parentId !== "" ? form.parentId : null,
        unitType: form.unitType,
      };
      if (editId) {
        await api.put(`/admin/org-units/${editId}`, payload);
        setMsg({ type: "success", text: "Unit updated." });
      } else {
        await api.post("/admin/org-units", payload);
        setMsg({ type: "success", text: "Unit created." });
      }
      setShowForm(false);
      setForm(EMPTY);
      setEditId(null);
      fetchUnits();
    } catch {
      setMsg({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const tree = buildTree(units);

  const parentName = (id) => {
    const p = units.find(u => u.id === Number(id));
    return p ? p.name : "";
  };

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700" }}>Organization Structure</h2>
          <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>
            {readonly ? "View the hierarchical structure of INSA departments and units" : "Define the hierarchical structure of INSA departments and units"}
          </p>
        </div>
        {!readonly && (
          <button onClick={() => openCreate()}
            style={{ padding: "9px 20px", background: "#2980b9", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
            + Add Root Unit
          </button>
        )}
        {readonly && (
          <span style={{ fontSize: "12px", background: "#fef9e7", color: "#d68910", padding: "5px 12px", borderRadius: "20px", fontWeight: "600", border: "1px solid #f9e4b7" }}>
            View Only
          </span>
        )}
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", background: msg.type === "error" ? "#fdecea" : "#e8f5e9", color: msg.type === "error" ? "#c0392b" : "#27ae60", border: `1px solid ${msg.type === "error" ? "#f5c6cb" : "#c3e6cb"}` }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "700" }}>×</button>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        {UNIT_TYPES.map(t => {
          const tc = TYPE_COLORS[t];
          return (
            <span key={t} style={{ fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "12px", background: tc.bg, color: tc.color, border: `1px solid ${tc.border}44` }}>
              {t}
            </span>
          );
        })}
      </div>

      {/* Tree */}
      <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", minHeight: "200px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#7f8c8d" }}>Loading...</div>
        ) : tree.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#7f8c8d" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏢</div>
            <p style={{ margin: 0 }}>No units yet. Click "Add Root Unit" to get started.</p>
          </div>
        ) : (
          tree.map(node => (
            <TreeNode key={node.id} node={node} depth={0} onEdit={openEdit} onDelete={handleDelete} onAddChild={openCreate} readonly={readonly} />
          ))
        )}
      </div>

      {/* Form Modal — only for non-readonly */}
      {showForm && !readonly && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>{editId ? "Edit Unit" : "Add Unit"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              {/* Name */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "5px" }}>
                  Unit Name <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Information Security Directorate"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #dde1e7", fontSize: "14px", boxSizing: "border-box" }} />
              </div>

              {/* Code + Type row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "5px" }}>Code</label>
                  <input value={form.code} onChange={e => set("code", e.target.value)}
                    placeholder="e.g. ISD"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #dde1e7", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "5px" }}>Type</label>
                  <select value={form.unitType} onChange={e => set("unitType", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #dde1e7", fontSize: "14px", boxSizing: "border-box" }}>
                    {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Parent */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "5px" }}>Parent Unit</label>
                <select value={form.parentId} onChange={e => set("parentId", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #dde1e7", fontSize: "14px", boxSizing: "border-box" }}>
                  <option value="">— None (Root) —</option>
                  {units.filter(u => u.id !== editId).map(u => (
                    <option key={u.id} value={u.id}>{u.name} [{u.unitType}]</option>
                  ))}
                </select>
                {form.parentId && (
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#7f8c8d" }}>
                    Parent: {parentName(form.parentId)}
                  </p>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4a5568", marginBottom: "5px" }}>Description</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  rows={3} placeholder="Optional description..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #dde1e7", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: "9px 20px", background: "#f3f4f6", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "9px 20px", background: saving ? "#95a5a6" : "#2980b9", color: "white", border: "none", borderRadius: "7px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}>
                  {saving ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
