"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/services/api";

const emptyForm = {
  jobTypeId: "",
  jobTitle: "",
  minDegree: "",
  minExperience: "",
  requiredSkills: "",
  grade: "",
  competencyFramework: "",
  fullDescription: "",
  status: "DRAFT",
};

// Build a tree from flat list
function buildTree(types, parentId = null) {
  return types
    .filter(t => {
      const pid = t.parentId === "" ? null : t.parentId;
      return pid == parentId;
    })
    .map(t => ({ ...t, children: buildTree(types, t.id) }));
}

// Recursive tree node component
function TreeNode({ node, selectedId, onSelect, expandedIds, toggleExpand, depth }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = String(selectedId) === String(node.id);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 10px",
          paddingLeft: `${10 + depth * 18}px`,
          cursor: "pointer",
          background: isSelected ? "#eaf4fb" : "transparent",
          borderRadius: "4px",
          userSelect: "none",
        }}
      >
        {/* expand/collapse toggle */}
        <span
          onClick={(e) => { e.stopPropagation(); if (hasChildren) toggleExpand(node.id); }}
          style={{
            width: "16px",
            fontSize: "10px",
            color: "#7f8c8d",
            flexShrink: 0,
            visibility: hasChildren ? "visible" : "hidden",
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </span>
        {/* label — clicking selects */}
        <span
          onClick={() => onSelect(node)}
          style={{
            flex: 1,
            fontSize: "13px",
            color: isSelected ? "#2980b9" : "#2c3e50",
            fontWeight: isSelected ? "700" : "400",
            marginLeft: "4px",
          }}
        >
          {node.name}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
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

// Custom tree dropdown
function JobTypeTreePicker({ jobTypes, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const ref = useRef(null);

  const tree = buildTree(jobTypes);
  const selected = jobTypes.find(t => String(t.id) === String(value));

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelect = (node) => {
    onChange(node.id);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          padding: "9px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "5px",
          fontSize: "13px",
          cursor: "pointer",
          background: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",
          color: selected ? "#2c3e50" : "#9ca3af",
        }}
      >
        <span>{selected ? selected.name : "-- Select Job Type --"}</span>
        <span style={{ fontSize: "10px", color: "#7f8c8d" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "white",
          border: "1px solid #d1d5db",
          borderRadius: "5px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          zIndex: 100,
          maxHeight: "220px",
          overflowY: "auto",
          marginTop: "2px",
        }}>
          {tree.length === 0 ? (
            <div style={{ padding: "12px", color: "#9ca3af", fontSize: "13px" }}>No job types found</div>
          ) : tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              selectedId={value}
              onSelect={handleSelect}
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

export default function JobQualificationPage() {
  const [data, setData] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [jqRes, jtRes] = await Promise.all([
        api.get("/admin/job-qualifications"),
        api.get("/admin/job-types"),
      ]);
      setData(jqRes.data);
      setJobTypes(jtRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      jobTypeId: item.jobTypeId,
      jobTitle: item.jobTitle,
      minDegree: item.minDegree,
      minExperience: item.minExperience,
      requiredSkills: item.requiredSkills,
      grade: item.grade,
      competencyFramework: item.competencyFramework,
      fullDescription: item.fullDescription,
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobTypeId) { alert("Please select a Job Type."); return; }
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/job-qualifications/${editItem.id}`, form);
      } else {
        await api.post("/admin/job-qualifications", form);
      }
      await loadAll();
      setShowForm(false);
    } catch (e) {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this qualification?")) return;
    try {
      await api.delete(`/admin/job-qualifications/${id}`);
      await loadAll();
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  const statusBadge = (s) => ({
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    background: s === "ACTIVE" ? "#d1fae5" : "#fef3c7",
    color: s === "ACTIVE" ? "#065f46" : "#92400e",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Job Qualification</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Define minimum qualifications and requirements for each position</p>
        </div>
        <button onClick={openAdd}
          style={{ padding: "9px 20px", background: "#2980b9", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + Add Qualification
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Positions", value: data.length, color: "#2980b9" },
          { label: "Active", value: data.filter(d => d.status === "ACTIVE").length, color: "#27ae60" },
          { label: "Draft", value: data.filter(d => d.status === "DRAFT").length, color: "#e67e22" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#7f8c8d" }}>Loading...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#7f8c8d", background: "white", borderRadius: "8px", border: "1px solid #ecf0f1" }}>
          No qualifications found. Click "+ Add Qualification" to get started.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {data.map((item) => (
            <div key={item.id} style={{ background: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontWeight: "700", color: "#2c3e50", fontSize: "15px", margin: "0 0 4px 0" }}>{item.jobTitle}</h3>
                  <p style={{ fontSize: "12px", color: "#7f8c8d", margin: "0 0 6px 0" }}>{item.jobTypeName}</p>
                  <span style={statusBadge(item.status)}>{item.status}</span>
                </div>
                {item.grade && (
                  <span style={{ padding: "4px 12px", borderRadius: "5px", fontSize: "12px", fontWeight: "700", background: "#eaf4fb", color: "#2980b9" }}>{item.grade}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {item.minDegree && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "14px" }}>🎓</span>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Min. Degree</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{item.minDegree}</p>
                    </div>
                  </div>
                )}
                {item.minExperience && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "14px" }}>⏱️</span>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Min. Experience</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{item.minExperience}</p>
                    </div>
                  </div>
                )}
                {item.requiredSkills && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "14px" }}>💡</span>
                    <div>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Required Skills</p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{item.requiredSkills}</p>
                    </div>
                  </div>
                )}
              </div>

              {(item.competencyFramework || item.fullDescription) && (
                <div style={{ borderTop: "1px solid #f0f3f4", paddingTop: "10px", marginBottom: "12px" }}>
                  <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    style={{ background: "none", border: "none", color: "#2980b9", cursor: "pointer", fontSize: "12px", fontWeight: "600", padding: 0 }}>
                    {expanded === item.id ? "▲ Hide Details" : "▼ Show Details"}
                  </button>
                  {expanded === item.id && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {item.competencyFramework && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 3px 0", fontWeight: "600" }}>Competency Framework</p>
                          <p style={{ fontSize: "13px", color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>{item.competencyFramework}</p>
                        </div>
                      )}
                      {item.fullDescription && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 3px 0", fontWeight: "600" }}>Full Description</p>
                          <p style={{ fontSize: "13px", color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>{item.fullDescription}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f0f3f4" }}>
                <button onClick={() => openEdit(item)}
                  style={{ flex: 1, padding: "7px", background: "#eaf4fb", color: "#2980b9", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>Edit</button>
                <button onClick={() => handleDelete(item.id)}
                  style={{ flex: 1, padding: "7px", background: "#fef2f2", color: "#e74c3c", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "560px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "20px" }}>
              {editItem ? "Edit Qualification" : "Add Job Qualification"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Job Type</label>
                <JobTypeTreePicker
                  jobTypes={jobTypes}
                  value={form.jobTypeId}
                  onChange={(id) => setForm({ ...form, jobTypeId: id })}
                />
              </div>

              {[
                { label: "Job Title", name: "jobTitle", type: "text" },
                { label: "Minimum Degree", name: "minDegree", type: "text" },
                { label: "Minimum Experience", name: "minExperience", type: "text" },
                { label: "Required Skills", name: "requiredSkills", type: "text" },
                { label: "Grade", name: "grade", type: "text" },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>{f.label}</label>
                  <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    required={f.name === "jobTitle"}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Competency Framework</label>
                <textarea value={form.competencyFramework} onChange={e => setForm({ ...form, competencyFramework: e.target.value })} rows={3}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Full Description</label>
                <textarea value={form.fullDescription} onChange={e => setForm({ ...form, fullDescription: e.target.value })} rows={4}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                </select>
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
