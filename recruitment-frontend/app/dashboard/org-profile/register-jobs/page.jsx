"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

const CLASS_OPTIONS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T"];
const EMPTY = { jobTypeId: "", classCode: "" };

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "white" };

export default function RegisterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterJobType, setFilterJobType] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [msg, setMsg] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [j, t] = await Promise.all([
        api.get("/admin/registered-jobs").catch(() => ({ data: [] })),
        api.get("/admin/job-types").catch(() => ({ data: [] })),
      ]);
      setJobs(j.data);
      setJobTypes(t.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When job type selected, auto-set name = job type name
  const handleJobTypeChange = (jtId) => {
    set("jobTypeId", jtId);
  };

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ jobTypeId: item.jobTypeId ? String(item.jobTypeId) : "", classCode: item.classCode || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobTypeId) { setMsg({ type: "error", text: "Please select a Job." }); return; }
    if (!form.classCode) { setMsg({ type: "error", text: "Please select a Class." }); return; }
    setSaving(true);
    try {
      // name = job type name
      const jt = jobTypes.find(t => String(t.id) === String(form.jobTypeId));
      const payload = { name: jt?.name || "", jobTypeId: form.jobTypeId, classCode: form.classCode };
      if (editItem) {
        await api.put(`/admin/registered-jobs/${editItem.id}`, payload);
        setMsg({ type: "success", text: "Updated." });
      } else {
        await api.post("/admin/registered-jobs", payload);
        setMsg({ type: "success", text: "Job registered." });
      }
      await fetchAll();
      setShowModal(false);
    } catch { setMsg({ type: "error", text: "Failed to save." }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}" (Class ${item.classCode})?`)) return;
    try {
      await api.delete(`/admin/registered-jobs/${item.id}`);
      setJobs(j => j.filter(x => x.id !== item.id));
      setMsg({ type: "success", text: "Deleted." });
    } catch { setMsg({ type: "error", text: "Failed to delete." }); }
  };

  const goToQualification = (item) => {
    // Navigate to job-qualification with the registered job pre-selected via query param
    router.push(`/dashboard/job-qualification?jobId=${item.id}`);
  };

  const filtered = jobs.filter(j =>
    (!filterJobType || String(j.jobTypeId) === String(filterJobType)) &&
    (!filterClass   || j.classCode === filterClass)
  );

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Register Jobs</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Register jobs by selecting a job type and class</p>
        </div>
        <button onClick={openAdd} style={{ padding: "9px 20px", background: "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + Register Job
        </button>
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", background: msg.type === "error" ? "#fdecea" : "#e8f5e9", color: msg.type === "error" ? "#c0392b" : "#27ae60", border: `1px solid ${msg.type === "error" ? "#f5c6cb" : "#c3e6cb"}` }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "700" }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Total Registered", value: jobs.length, color: "#27ae60" },
          { label: "Job Types Used", value: new Set(jobs.map(j => j.jobTypeId).filter(Boolean)).size, color: "#2980b9" },
          { label: "Classes Used", value: new Set(jobs.map(j => j.classCode).filter(Boolean)).size, color: "#8e44ad" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "8px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #ecf0f1", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: "180px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#7f8c8d", marginBottom: "5px", textTransform: "uppercase" }}>Job</label>
          <select value={filterJobType} onChange={e => setFilterJobType(e.target.value)} style={inp}>
            <option value="">All Jobs</option>
            {jobTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "120px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#7f8c8d", marginBottom: "5px", textTransform: "uppercase" }}>Class</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={inp}>
            <option value="">All Classes</option>
            {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(filterJobType || filterClass) && (
          <button onClick={() => { setFilterJobType(""); setFilterClass(""); }}
            style={{ padding: "9px 14px", background: "#ecf0f1", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#7f8c8d" }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>
            {jobs.length === 0 ? "No jobs registered yet. Click \"+ Register Job\" to get started." : "No jobs match your filters."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
              <tr>
                {["#", "Job", "Class", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f9fafb" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#9ca3af" }}>{idx + 1}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>{item.name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#f3e5f5", color: "#8e44ad", padding: "3px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: "700" }}>{item.classCode || "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => goToQualification(item)}
                        style={{ padding: "5px 12px", background: "#eaf4fb", color: "#2980b9", border: "1px solid #bae6fd", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                        → Qualification
                      </button>
                      <button onClick={() => openEdit(item)}
                        style={{ padding: "5px 12px", background: "#f0fdf4", color: "#27ae60", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item)}
                        style={{ padding: "5px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
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

      {/* Modal — only Job + Class */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#2c3e50" }}>{editItem ? "Edit Job" : "Register Job"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>
                  Job <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <select required value={form.jobTypeId} onChange={e => handleJobTypeChange(e.target.value)} style={inp}>
                  <option value="">-- Select Job --</option>
                  {jobTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>
                  Class <span style={{ color: "#e74c3c" }}>*</span>
                </label>
                <select required value={form.classCode} onChange={e => set("classCode", e.target.value)} style={inp}>
                  <option value="">-- Select Class --</option>
                  {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: "9px 20px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "9px 20px", background: saving ? "#95a5a6" : "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}>
                  {saving ? "Saving..." : editItem ? "Update" : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
