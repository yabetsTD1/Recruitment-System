"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function JobsUnderFamilyPage() {
  const [jobTypes, setJobTypes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/admin/job-types").catch(() => ({ data: [] })),
      api.get("/admin/registered-jobs").catch(() => ({ data: [] })),
    ]).then(([t, j]) => {
      setJobTypes(t.data);
      setJobs(j.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = selected ? jobs.filter(j => String(j.jobTypeId) === String(selected)) : jobs;
  const selectedType = jobTypes.find(t => String(t.id) === String(selected));

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700" }}>Jobs Under Family</h2>
        <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>View all jobs grouped by job type (family)</p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid #dde1e7", borderRadius: "7px", fontSize: "13px", outline: "none", minWidth: "220px" }}>
          <option value="">— All Job Families —</option>
          {jobTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {selected && (
          <span style={{ fontSize: "13px", background: "#eaf0fb", color: "#2980b9", padding: "5px 14px", borderRadius: "20px", fontWeight: "600" }}>
            {selectedType?.name} — {filtered.length} job(s)
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", padding: "48px", textAlign: "center", color: "#7f8c8d", background: "white", borderRadius: "12px" }}>
              No jobs found{selected ? " for this family" : ""}.
            </div>
          ) : filtered.map(job => (
            <div key={job.id} style={{ background: "white", borderRadius: "10px", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: "3px solid #2980b9" }}>
              <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "6px" }}>{job.name}</div>
              <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "4px" }}>
                <span style={{ background: "#eaf0fb", color: "#2980b9", padding: "1px 8px", borderRadius: "10px", fontWeight: "600" }}>{job.jobTypeName || "—"}</span>
              </div>
              {job.gradeLevel && <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>Grade: {job.gradeLevel}</div>}
              {job.requiredSkills && <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>Skills: {job.requiredSkills}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
