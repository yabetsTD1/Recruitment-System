"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

const CLASS_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];
const ICF_OPTIONS = Array.from({ length: 15 }, (_, i) => String(i + 1));

const EMPTY_GRADE = { classCode: "", icf: "", beginningSalary: "", maxSalary: "" };
const EMPTY_STEP  = { incrementStep: "", salary: "" };

export default function SalarySettingPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);   // currently selected pay grade
  const [gradeForm, setGradeForm] = useState(EMPTY_GRADE);
  const [editGradeId, setEditGradeId] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [stepForm, setStepForm] = useState(EMPTY_STEP);
  const [editStepId, setEditStepId] = useState(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/salary-settings");
      setGrades(res.data);
      // keep selected in sync
      if (selected) {
        const updated = res.data.find(g => g.id === selected.id);
        setSelected(updated || null);
      }
    } catch {
      setMsg({ type: "error", text: "Failed to load salary settings." });
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { fetchGrades(); }, []); // eslint-disable-line

  const setG = (k, v) => setGradeForm(f => ({ ...f, [k]: v }));
  const setSt = (k, v) => setStepForm(f => ({ ...f, [k]: v }));

  // ── Pay Grade CRUD ──────────────────────────────────────────────────────────
  const openAddGrade = () => { setEditGradeId(null); setGradeForm(EMPTY_GRADE); setShowGradeModal(true); };
  const openEditGrade = (g) => {
    setEditGradeId(g.id);
    setGradeForm({ classCode: g.classCode, icf: g.icf, beginningSalary: String(g.beginningSalary), maxSalary: String(g.maxSalary) });
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        classCode: gradeForm.classCode,
        icf: gradeForm.icf,
        beginningSalary: Number(gradeForm.beginningSalary),
        maxSalary: Number(gradeForm.maxSalary),
      };
      if (editGradeId) {
        await api.put(`/admin/salary-settings/${editGradeId}`, payload);
        setMsg({ type: "success", text: "Pay grade updated." });
      } else {
        await api.post("/admin/salary-settings", payload);
        setMsg({ type: "success", text: "Pay grade created." });
      }
      setShowGradeModal(false);
      await fetchGrades();
    } catch {
      setMsg({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const deleteGrade = async (g) => {
    if (!confirm(`Delete pay grade Class ${g.classCode} / ICF ${g.icf} and all its steps?`)) return;
    try {
      await api.delete(`/admin/salary-settings/${g.id}`);
      if (selected?.id === g.id) setSelected(null);
      setMsg({ type: "success", text: "Deleted." });
      fetchGrades();
    } catch {
      setMsg({ type: "error", text: "Failed to delete." });
    }
  };

  // ── Step CRUD ───────────────────────────────────────────────────────────────
  const openAddStep = () => { setEditStepId(null); setStepForm(EMPTY_STEP); setShowStepModal(true); };
  const openEditStep = (st) => {
    setEditStepId(st.id);
    setStepForm({ incrementStep: String(st.incrementStep), salary: String(st.salary) });
    setShowStepModal(true);
  };

  const handleStepSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const payload = { incrementStep: Number(stepForm.incrementStep), salary: Number(stepForm.salary) };
      if (editStepId) {
        await api.put(`/admin/salary-steps/${editStepId}`, payload);
        setMsg({ type: "success", text: "Step updated." });
      } else {
        await api.post(`/admin/salary-settings/${selected.id}/steps`, payload);
        setMsg({ type: "success", text: "Step added." });
      }
      setShowStepModal(false);
      await fetchGrades();
    } catch {
      setMsg({ type: "error", text: "Failed to save step." });
    } finally {
      setSaving(false);
    }
  };

  const deleteStep = async (st) => {
    if (!confirm(`Delete step ${st.incrementStep}?`)) return;
    try {
      await api.delete(`/admin/salary-steps/${st.id}`);
      setMsg({ type: "success", text: "Step deleted." });
      fetchGrades();
    } catch {
      setMsg({ type: "error", text: "Failed to delete step." });
    }
  };

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #c8d6e5", borderRadius: "4px", fontSize: "14px", boxSizing: "border-box", background: "white" };
  const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "5px", textAlign: "right", paddingRight: "12px" };

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50", maxWidth: "960px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700" }}>Salary Setting</h2>
          <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>Define pay grades and increment steps</p>
        </div>
        <button onClick={openAddGrade}
          style={{ padding: "9px 20px", background: "#2980b9", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
          + Add Pay Grade
        </button>
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", borderRadius: "7px", marginBottom: "16px", fontSize: "13px", background: msg.type === "error" ? "#fdecea" : "#e8f5e9", color: msg.type === "error" ? "#c0392b" : "#27ae60", border: `1px solid ${msg.type === "error" ? "#f5c6cb" : "#c3e6cb"}` }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "700" }}>×</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "340px 1fr" : "1fr", gap: "20px" }}>

        {/* Left — Pay Grades list */}
        <div>
          <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ background: "#d6eaf8", padding: "10px 16px", fontWeight: "700", fontSize: "13px", color: "#1a5276", borderBottom: "1px solid #aed6f1" }}>
              Pay Grades
            </div>
            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
            ) : grades.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#7f8c8d", fontSize: "13px" }}>No pay grades yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f4f6f7" }}>
                  <tr>
                    {["Class", "ICF", "Begin Salary", "Max Salary", "Steps", ""].map(h => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#7f8c8d", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grades.map(g => (
                    <tr key={g.id}
                      onClick={() => setSelected(selected?.id === g.id ? null : g)}
                      style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: selected?.id === g.id ? "#eaf4fb" : "white" }}
                      onMouseEnter={e => { if (selected?.id !== g.id) e.currentTarget.style.background = "#f8f9fa"; }}
                      onMouseLeave={e => { if (selected?.id !== g.id) e.currentTarget.style.background = "white"; }}>
                      <td style={{ padding: "10px 12px", fontWeight: "700", color: "#2980b9" }}>{g.classCode}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px" }}>{g.icf}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px" }}>{Number(g.beginningSalary).toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px" }}>{Number(g.maxSalary).toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: "#eaf0fb", color: "#2980b9", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                          {(g.steps || []).length}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditGrade(g)}
                            style={{ padding: "3px 9px", background: "#eaf0fb", color: "#2980b9", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Edit</button>
                          <button onClick={() => deleteGrade(g)}
                            style={{ padding: "3px 9px", background: "#fdecea", color: "#c0392b", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right — Pay Grade detail + steps */}
        {selected && (
          <div>
            {/* Pay Grade info card */}
            <div style={{ background: "#d6eaf8", borderRadius: "8px", padding: "0", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ background: "#aed6f1", padding: "10px 16px", fontWeight: "700", fontSize: "13px", color: "#1a5276" }}>Pay Grade</div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "10px 0", alignItems: "center" }}>
                  <label style={labelStyle}>Class:</label>
                  <div style={{ ...inputStyle, background: "#f4f6f7", color: "#2c3e50", fontWeight: "700" }}>{selected.classCode}</div>

                  <label style={labelStyle}>ICF:</label>
                  <div style={{ ...inputStyle, background: "#f4f6f7", color: "#2c3e50" }}>{selected.icf}</div>

                  <label style={labelStyle}>Beginning Salary:</label>
                  <div style={{ ...inputStyle, background: "#f4f6f7" }}>{Number(selected.beginningSalary).toLocaleString()}</div>

                  <label style={labelStyle}>Max Salary:</label>
                  <div style={{ ...inputStyle, background: "#f4f6f7" }}>{Number(selected.maxSalary).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Add Detail button */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <button onClick={openAddStep}
                style={{ padding: "9px 28px", background: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
                Add Detail
              </button>
            </div>

            {/* Steps table */}
            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#d5d8dc" }}>
                  <tr>
                    {["S/N", "Increment Step ⇅", "Salary:", "Option"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#2c3e50", borderBottom: "1px solid #bdc3c7" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(selected.steps || []).length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#7f8c8d", fontSize: "13px" }}>No steps yet. Click "Add Detail" to add increment steps.</td></tr>
                  ) : (
                    (selected.steps || []).map((st, idx) => (
                      <tr key={st.id} style={{ borderBottom: "1px solid #f3f4f6" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}>
                        <td style={{ padding: "10px 16px", fontSize: "13px", color: "#7f8c8d" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600" }}>{st.incrementStep}</td>
                        <td style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", color: "#27ae60" }}>{Number(st.salary).toLocaleString()}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => openEditStep(st)}
                              style={{ padding: "4px 12px", background: "none", border: "none", color: "#2980b9", cursor: "pointer", fontSize: "13px", fontWeight: "600", textDecoration: "underline" }}>
                              Edit
                            </button>
                            <button onClick={() => deleteStep(st)}
                              style={{ padding: "4px 10px", background: "#fdecea", color: "#c0392b", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pay Grade Modal */}
      {showGradeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowGradeModal(false)}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: "#d6eaf8", padding: "14px 20px", borderRadius: "10px 10px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1a5276" }}>{editGradeId ? "Edit Pay Grade" : "Add Pay Grade"}</h3>
              <button onClick={() => setShowGradeModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7f8c8d" }}>×</button>
            </div>
            <form onSubmit={handleGradeSubmit} style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Class: <span style={{ color: "#e74c3c" }}>*</span></label>
                <select required value={gradeForm.classCode} onChange={e => setG("classCode", e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <label style={{ ...labelStyle, marginBottom: 0 }}>ICF: <span style={{ color: "#e74c3c" }}>*</span></label>
                <select required value={gradeForm.icf} onChange={e => setG("icf", e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {ICF_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>

                <label style={{ ...labelStyle, marginBottom: 0 }}>Beginning Salary: <span style={{ color: "#e74c3c" }}>*</span></label>
                <input required type="number" min="0" value={gradeForm.beginningSalary} onChange={e => setG("beginningSalary", e.target.value)} placeholder="e.g. 25498" style={inputStyle} />

                <label style={{ ...labelStyle, marginBottom: 0 }}>Max Salary: <span style={{ color: "#e74c3c" }}>*</span></label>
                <input required type="number" min="0" value={gradeForm.maxSalary} onChange={e => setG("maxSalary", e.target.value)} placeholder="e.g. 37559" style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowGradeModal(false)}
                  style={{ padding: "8px 18px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ padding: "8px 18px", background: saving ? "#95a5a6" : "#2980b9", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}>
                  {saving ? "Saving..." : editGradeId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showStepModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowStepModal(false)}>
          <div style={{ background: "white", borderRadius: "10px", width: "100%", maxWidth: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: "#d5d8dc", padding: "14px 20px", borderRadius: "10px 10px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#2c3e50" }}>
                {editStepId ? "Edit Step" : "Add Increment Step"}
                {selected && <span style={{ fontSize: "12px", fontWeight: "400", marginLeft: "8px", color: "#7f8c8d" }}>Class {selected.classCode} / ICF {selected.icf}</span>}
              </h3>
              <button onClick={() => setShowStepModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#7f8c8d" }}>×</button>
            </div>
            <form onSubmit={handleStepSubmit} style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "12px", alignItems: "center" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Increment Step: <span style={{ color: "#e74c3c" }}>*</span></label>
                <input required type="number" min="0" value={stepForm.incrementStep} onChange={e => setSt("incrementStep", e.target.value)} placeholder="e.g. 1"
                  style={inputStyle} />

                <label style={{ ...labelStyle, marginBottom: 0 }}>Salary: <span style={{ color: "#e74c3c" }}>*</span></label>
                <input required type="number" min="0" value={stepForm.salary} onChange={e => setSt("salary", e.target.value)} placeholder="e.g. 26355"
                  style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                <button type="button" onClick={() => setShowStepModal(false)}
                  style={{ padding: "8px 18px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ padding: "8px 18px", background: saving ? "#95a5a6" : "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px" }}>
                  {saving ? "Saving..." : editStepId ? "Update" : "Add Detail"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
