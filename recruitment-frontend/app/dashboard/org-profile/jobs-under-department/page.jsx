"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function JobsUnderDepartmentPage() {
  const [orgUnits, setOrgUnits] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/admin/org-units").catch(() => ({ data: [] })),
      api.get("/admin/registered-jobs").catch(() => ({ data: [] })),
    ]).then(([u, j]) => {
      setOrgUnits(u.data);
      setJobs(j.data);
    }).finally(() => setLoading(false));
  }, []);

  // Jobs linked to a department via their description or a departmentId field
  const filtered = selected
    ? jobs.filter(j => String(j.departmentId) === String(selected) || (j.department || "") === (orgUnits.find(u => String(u.id) === String(selected))?.name || ""))
    : jobs;

  const selectedUnit = orgUnits.find(u => String(u.id) === String(selected));
  const departments = orgUnits.filter(u => u.unitType === "DEPARTMENT" || u.unitType === "DIVISION" || !u.unitType);

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700" }}>Jobs Under Department</h2>
        <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>View all jobs grouped by department / org unit</p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid #dde1e7", borderRadius: "7px", fontSize: "13px", outline: "none", minWidth: "240px" }}>
          <option value="">— All Departments —</option>
          {departments.map(u => <option key={u.id} value={u.id}>{u.name} [{u.unitType}]</option>)}
        </select>
        {selected && (
          <span style={{ fontSize: "13px", background: "#e8f5e9", color: "#27ae60", padding: "5px 14px", borderRadius: "20px", fontWeight: "600" }}>
            {selectedUnit?.name} — {filtered.length} job(s)
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>
              No jobs found{selected ? " for this department" : ""}. Register jobs and link them to departments via Register Jobs.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  {["Job Name", "Job Type", "Grade Level", "Required Skills"].map(h => (
                    <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(job => (
                  <tr key={job.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 18px", fontWeight: "600", fontSize: "14px" }}>{job.name}</td>
                    <td style={{ padding: "12px 18px", fontSize: "13px" }}>
                      {job.jobTypeName ? <span style={{ background: "#eaf0fb", color: "#2980b9", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{job.jobTypeName}</span> : "—"}
                    </td>
                    <td style={{ padding: "12px 18px", fontSize: "13px", color: "#555" }}>{job.gradeLevel || "—"}</td>
                    <td style={{ padding: "12px 18px", fontSize: "13px", color: "#555" }}>{job.requiredSkills || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
