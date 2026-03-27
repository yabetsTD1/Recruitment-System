"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/services/api";

const ICF_OPTIONS   = Array.from({ length: 15 }, (_, i) => String(i + 1));
const EDU_CATS      = ["Natural Science", "Social Science", "Engineering", "Health Science", "Law", "Business", "Arts", "Other"];
const EDU_LEVELS    = ["Certificate", "Diploma", "BSc / BA", "MSc / MA", "PhD", "Other"];

const EMPTY_JQ  = { registeredJobId: "", jobTypeId: "", jobFamilyName: "", jobTitle: "", grade: "", competencyFramework: "", icf: "", status: "ACTIVE" };
const EMPTY_ENT = { educationCategory: "", educationLevel: "", fieldOfStudy: "", minExperience: "0", skill: "", knowledge: "", competency: "" };

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", outline: "none", boxSizing: "border-box", background: "white" };

export default function JobQualificationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>}>
      <JobQualificationContent />
    </Suspense>
  );
}

function JobQualificationContent() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const [qualifications, setQualifications] = useState([]);
  const [registeredJobs, setRegisteredJobs] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJob, setFilterJob] = useState(preselectedJobId || "");
  const [filterIcf, setFilterIcf] = useState("");
  const [selected, setSelected] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showJqModal, setShowJqModal] = useState(false);
  const [editJq, setEditJq] = useState(null);
  const [jqForm, setJqForm] = useState(EMPTY_JQ);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [entryForm, setEntryForm] = useState(EMPTY_ENT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [jq, rj, jt] = await Promise.all([
        api.get("/admin/job-qualifications").catch(() => ({ data: [] })),
        api.get("/admin/registered-jobs").catch(() => ({ data: [] })),
        api.get("/admin/job-types").catch(() => ({ data: [] })),
      ]);
      setQualifications(jq.data);
      setRegisteredJobs(rj.data);
      setJobTypes(jt.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchEntries = useCallback(async (id) => {
    setLoadingEntries(true);
    try { const r = await api.get(`/admin/job-qualifications/${id}/entries`); setEntries(r.data); }
    catch { setEntries([]); }
    finally { setLoadingEntries(false); }
  }, []);

  const selectJq = (jq) => { setSelected(jq); fetchEntries(jq.id); };
  const setJ = (k, v) => setJqForm(f => ({ ...f, [k]: v }));
  const setE = (k, v) => setEntryForm(f => ({ ...f, [k]: v }));

  const handleJobChange = (rjId) => {
    setJ("registeredJobId", rjId);
    const rj = registeredJobs.find(j => String(j.id) === String(rjId));
    if (rj) {
      setJ("jobTitle", rj.name);
      setJ("grade", rj.classCode || "");
      // Job Family = parent of the job type (if exists), else the job type itself
      if (rj.jobTypeId) {
        const jt = jobTypes.find(t => String(t.id) === String(rj.jobTypeId));
        if (jt) {
          if (jt.parentId) {
            // has a parent — use parent as the family
            const parent = jobTypes.find(t => String(t.id) === String(jt.parentId));
            setJ("jobTypeId", parent ? String(parent.id) : String(jt.id));
            setJ("jobFamilyName", parent ? parent.name : jt.name);
          } else {
            // no parent — this IS the root family
            setJ("jobTypeId", String(jt.id));
            setJ("jobFamilyName", jt.name);
          }
        }
      } else {
        setJ("jobTypeId", "");
        setJ("jobFamilyName", "");
      }
    }
  };

  const openAddJq = () => { setEditJq(null); setJqForm(EMPTY_JQ); setShowJqModal(true); };
  const openEditJq = (jq) => {
    setEditJq(jq);
    // Compute job family name from jobTypeId
    let familyName = "";
    if (jq.jobTypeId) {
      const jt = jobTypes.find(t => String(t.id) === String(jq.jobTypeId));
      familyName = jt ? jt.name : "";
    }
    // Grade from registered job
    const rj = registeredJobs.find(j => String(j.id) === String(jq.registeredJobId));
    setJqForm({
      registeredJobId: jq.registeredJobId ? String(jq.registeredJobId) : "",
      jobTypeId: String(jq.jobTypeId || ""),
      jobFamilyName: familyName,
      jobTitle: jq.jobTitle,
      grade: rj?.classCode || jq.grade || "",
      competencyFramework: jq.competencyFramework || "",
      icf: jq.icf || "",
      status: jq.status,
    });
    setShowJqModal(true);
  };

  const handleJqSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...jqForm, jobTypeId: jqForm.jobTypeId || null, registeredJobId: jqForm.registeredJobId || null };
      if (editJq) { await api.put(`/admin/job-qualifications/${editJq.id}`, payload); }
      else { await api.post("/admin/job-qualifications", payload); }
      setMsg({ type: "success", text: editJq ? "Updated." : "Qualification created." });
      setShowJqModal(false); await fetchAll();
      if (selected) fetchEntries(selected.id);
    } catch { setMsg({ type: "error", text: "Failed to save." }); }
    finally { setSaving(false); }
  };

  const deleteJq = async (jq) => {
    if (!confirm(`Delete qualification for "${jq.jobTitle}"?`)) return;
    try {
      await api.delete(`/admin/job-qualifications/${jq.id}`);
      if (selected?.id === jq.id) { setSelected(null); setEntries([]); }
      setMsg({ type: "success", text: "Deleted." }); fetchAll();
    } catch { setMsg({ type: "error", text: "Failed to delete." }); }
  };

  const openAddEntry = () => { setEditEntry(null); setEntryForm(EMPTY_ENT); setShowEntryModal(true); };
  const openEditEntry = (en) => {
    setEditEntry(en);
    setEntryForm({ educationCategory: en.educationCategory, educationLevel: en.educationLevel, fieldOfStudy: en.fieldOfStudy, minExperience: en.minExperience, skill: en.skill, knowledge: en.knowledge, competency: en.competency });
    setShowEntryModal(true);
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    try {
      if (editEntry) { await api.put(`/admin/job-qualification-entries/${editEntry.id}`, entryForm); }
      else { await api.post(`/admin/job-qualifications/${selected.id}/entries`, entryForm); }
      setMsg({ type: "success", text: editEntry ? "Entry updated." : "Entry added." });
      setShowEntryModal(false); fetchEntries(selected.id);
    } catch { setMsg({ type: "error", text: "Failed to save entry." }); }
    finally { setSaving(false); }
  };

  const deleteEntry = async (en) => {
    if (!confirm("Delete this entry?")) return;
    try { await api.delete(`/admin/job-qualification-entries/${en.id}`); fetchEntries(selected.id); }
    catch { setMsg({ type: "error", text: "Failed to delete." }); }
  };

  const filtered = qualifications.filter(jq =>
    (!filterJob || String(jq.registeredJobId) === String(filterJob)) &&
    (!filterIcf || (jq.icf || "") === filterIcf)
  );
  const list = filterJob || filterIcf ? filtered : qualifications;

  const statusBadge = (s) => ({ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: s === "ACTIVE" ? "#d1fae5" : "#fef3c7", color: s === "ACTIVE" ? "#065f46" : "#92400e" });

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Job Qualification</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Define qualification requirements for each registered job</p>
        </div>
        <button onClick={openAddJq} style={{ padding: "9px 20px", background: "#2980b9", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + Add Qualification
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
          { label: "Total Qualifications", value: qualifications.length, color: "#2980b9" },
          { label: "Active", value: qualifications.filter(q => q.status === "ACTIVE").length, color: "#27ae60" },
          { label: "Draft", value: qualifications.filter(q => q.status === "DRAFT").length, color: "#e67e22" },
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
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#7f8c8d", marginBottom: "5px", textTransform: "uppercase" }}>Job Title</label>
          <select value={filterJob} onChange={e => setFilterJob(e.target.value)} style={inp}>
            <option value="">All Jobs</option>
            {registeredJobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#7f8c8d", marginBottom: "5px", textTransform: "uppercase" }}>Competency Framework</label>
          <select value={filterIcf} onChange={e => setFilterIcf(e.target.value)} style={inp}>
            <option value="">All</option>
            {ICF_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        {(filterJob || filterIcf) && (
          <button onClick={() => { setFilterJob(""); setFilterIcf(""); }}
            style={{ padding: "9px 14px", background: "#ecf0f1", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#7f8c8d" }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
        ) : list.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>
            {qualifications.length === 0 ? "No qualifications yet. Click \"+ Add Qualification\" to get started." : "No results match your filters."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
              <tr>
                {["#", "Job Title", "Job Type", "Grade", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((jq, idx) => (
                <tr key={jq.id} style={{ borderBottom: "1px solid #f9fafb" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#9ca3af" }}>{idx + 1}</td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>{jq.jobTitle}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {jq.jobTypeName ? <span style={{ background: "#eaf4fb", color: "#2980b9", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{jq.jobTypeName}</span> : <span style={{ color: "#9ca3af" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", color: "#8e44ad" }}>{jq.grade || "—"}</td>
                  <td style={{ padding: "12px 16px" }}><span style={statusBadge(jq.status)}>{jq.status}</span></td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => selectJq(jq)} style={{ padding: "5px 12px", background: "#e8f5e9", color: "#27ae60", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>Add Qualification</button>
                      <button onClick={() => openEditJq(jq)} style={{ padding: "5px 12px", background: "#eaf4fb", color: "#2980b9", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>Edit</button>
                      <button onClick={() => deleteJq(jq)} style={{ padding: "5px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail popup modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => { setSelected(null); setEntries([]); }}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "860px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#2c3e50" }}>Qualification Detail — {selected.jobTitle}</h2>
              <button onClick={() => { setSelected(null); setEntries([]); }} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px", background: "#f8f9fa", borderRadius: "8px", padding: "16px" }}>
                {[
                  { label: "Job Title", value: selected.jobTitle },
                  { label: "Job Family", value: selected.jobTypeName || "—" },
                  { label: "Grade / Class", value: selected.grade || "—" },
                  { label: "INSA Competency Framework (ICF)", value: selected.icf || selected.competencyFramework || "—" },
                ].map(f => (
                  <div key={f.label}>
                    <p style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", margin: "0 0 3px", textTransform: "uppercase" }}>{f.label}</p>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", margin: 0 }}>{f.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#374151" }}>Education Requirements</h3>
                <button onClick={openAddEntry} style={{ padding: "7px 18px", background: "#2980b9", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}>
                  + Add Qualification
                </button>
              </div>

              <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                    <tr>
                      {["#", "Education Category", "Education Level", "Field of Study", "Min Exp.", "Actions"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEntries ? (
                      <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
                    ) : entries.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>No records found.</td></tr>
                    ) : entries.map((en, idx) => (
                      <tr key={en.id} style={{ borderBottom: "1px solid #f9fafb" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#9ca3af" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "600" }}>{en.educationCategory || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: "13px" }}>{en.educationLevel || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: "13px" }}>{en.fieldOfStudy || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: "13px" }}>{en.minExperience}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: "5px" }}>
                            <button onClick={() => openEditEntry(en)} style={{ padding: "4px 10px", background: "#eaf4fb", color: "#2980b9", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Edit</button>
                            <button onClick={() => deleteEntry(en)} style={{ padding: "4px 10px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JQ Modal */}
      {showJqModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowJqModal(false)}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#2c3e50" }}>{editJq ? "Edit Qualification" : "Add Job Qualification"}</h2>
              <button onClick={() => setShowJqModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <form onSubmit={handleJqSubmit} style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Job Title <span style={{ color: "#e74c3c" }}>*</span></label>
                <select required value={jqForm.registeredJobId} onChange={e => handleJobChange(e.target.value)} style={inp}>
                  <option value="">-- Select Job --</option>
                  {registeredJobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Job Family</label>
                  <div style={{ ...inp, background: "#f3f4f6", color: jqForm.jobFamilyName ? "#2c3e50" : "#9ca3af", cursor: "default", minHeight: "38px", display: "flex", alignItems: "center" }}>
                    {jqForm.jobFamilyName || "— auto-filled from Job —"}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Class</label>
                  <div style={{ ...inp, background: "#f3f4f6", color: jqForm.grade ? "#8e44ad" : "#9ca3af", fontWeight: "700", cursor: "default", minHeight: "38px", display: "flex", alignItems: "center" }}>
                    {jqForm.grade || "— auto-filled from Job —"}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>INSA Competency Framework (ICF)</label>
                <select value={jqForm.icf} onChange={e => setJ("icf", e.target.value)} style={inp}>
                  <option value="">-- Select --</option>
                  {ICF_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Status</label>
                <select value={jqForm.status} onChange={e => setJ("status", e.target.value)} style={inp}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowJqModal(false)} style={{ padding: "9px 20px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "9px 20px", background: saving ? "#95a5a6" : "#2980b9", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}>
                  {saving ? "Saving..." : editJq ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {showEntryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowEntryModal(false)}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "620px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#2c3e50" }}>{editEntry ? "Edit Entry" : "Add Qualification Entry"}</h2>
              <button onClick={() => setShowEntryModal(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <form onSubmit={handleEntrySubmit} style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Education Category</label>
                  <select value={entryForm.educationCategory} onChange={e => setE("educationCategory", e.target.value)} style={inp}>
                    <option value="">-- Select --</option>
                    {EDU_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Field of Study</label>
                  <input value={entryForm.fieldOfStudy} onChange={e => setE("fieldOfStudy", e.target.value)} placeholder="e.g. Computer Science" style={inp} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Education Level</label>
                  <select value={entryForm.educationLevel} onChange={e => setE("educationLevel", e.target.value)} style={inp}>
                    <option value="">-- Select --</option>
                    {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Min Experience (years)</label>
                  <input type="number" min="0" value={entryForm.minExperience} onChange={e => setE("minExperience", e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Skill</label>
                  <textarea value={entryForm.skill} onChange={e => setE("skill", e.target.value)} rows={4} placeholder="Describe skills..." style={{ ...inp, resize: "vertical" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Knowledge</label>
                  <textarea value={entryForm.knowledge} onChange={e => setE("knowledge", e.target.value)} rows={4} placeholder="Enter knowledge..." style={{ ...inp, resize: "vertical" }} />
                </div>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Competency</label>
                <textarea value={entryForm.competency} onChange={e => setE("competency", e.target.value)} rows={3} placeholder="List competencies..." style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowEntryModal(false)} style={{ padding: "9px 20px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: "9px 20px", background: saving ? "#95a5a6" : "#27ae60", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}>
                  {saving ? "Saving..." : editEntry ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
