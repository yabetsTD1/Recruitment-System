"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs`)
      .then(r => r.json())
      .then(d => setJobs(d))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    (j.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Header */}
      <div style={{ background: "#2c3e50", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: "#2980b9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛡️</div>
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>INSA Recruitment</span>
        </div>
        <Link href="/login" style={{ padding: "8px 18px", background: "#27ae60", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
          Staff Login
        </Link>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #2c3e50, #2980b9)", padding: "48px 40px", textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", margin: "0 0 10px 0" }}>Open Positions</h1>
        <p style={{ fontSize: "15px", opacity: 0.85, margin: "0 0 24px 0" }}>Join the Information Network Security Administration</p>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by job title or department..."
          style={{ width: "100%", maxWidth: "480px", padding: "12px 18px", borderRadius: "6px", border: "none", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Jobs */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#7f8c8d", padding: "40px" }}>Loading jobs...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
            <p style={{ fontSize: "16px" }}>No open positions at the moment.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            {filtered.map(job => (
              <div key={job.id} style={{ 
                background: "white", 
                borderRadius: "10px", 
                padding: "24px", 
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)", 
                border: "1px solid #e8ecef",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}>
                {/* Header */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: "700", color: "#2c3e50", margin: 0, flex: 1 }}>{job.jobTitle}</h2>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>OPEN</span>
                  </div>
                  {job.department && (
                    <p style={{ fontSize: "13px", color: "#7f8c8d", margin: "0 0 4px 0" }}>🏢 {job.department}</p>
                  )}
                </div>

                {/* Details Grid */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: "12px", 
                  marginBottom: "16px",
                  padding: "16px",
                  background: "#f8f9fa",
                  borderRadius: "6px"
                }}>
                  {job.batchCode && (
                    <div>
                      <p style={{ fontSize: "11px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>BATCH CODE</p>
                      <p style={{ fontSize: "13px", color: "#2c3e50", margin: 0, fontWeight: "600" }}>{job.batchCode}</p>
                    </div>
                  )}
                  {job.recruitmentType && (
                    <div>
                      <p style={{ fontSize: "11px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>TYPE</p>
                      <p style={{ fontSize: "13px", color: "#2c3e50", margin: 0, fontWeight: "600" }}>{job.recruitmentType}</p>
                    </div>
                  )}
                  {job.salary && (
                    <div>
                      <p style={{ fontSize: "11px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>SALARY</p>
                      <p style={{ fontSize: "13px", color: "#27ae60", margin: 0, fontWeight: "600" }}>{job.salary}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: "11px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>VACANCIES</p>
                    <p style={{ fontSize: "13px", color: "#2c3e50", margin: 0, fontWeight: "600" }}>{job.vacancyNumber || 0} Position{job.vacancyNumber !== 1 ? "s" : ""}</p>
                  </div>
                  {job.deadline && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p style={{ fontSize: "11px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>DEADLINE</p>
                      <p style={{ fontSize: "13px", color: "#e67e22", margin: 0, fontWeight: "700" }}>{job.deadline}</p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div style={{ marginBottom: "16px", flex: 1 }}>
                  {job.jobLocation && (
                    <p style={{ fontSize: "12px", color: "#7f8c8d", margin: "0 0 6px 0" }}>📍 {job.jobLocation}</p>
                  )}
                  {job.employmentType && (
                    <p style={{ fontSize: "12px", color: "#7f8c8d", margin: "0 0 6px 0" }}>📄 {job.employmentType}</p>
                  )}
                  {job.hiringType && (
                    <p style={{ fontSize: "12px", color: "#7f8c8d", margin: 0 }}>🔖 {job.hiringType}</p>
                  )}
                </div>

                {/* View Details Button */}
                <Link href={`/jobs/${job.id}`}
                  style={{ 
                    padding: "12px 24px", 
                    background: "#2980b9", 
                    color: "white", 
                    borderRadius: "6px", 
                    textDecoration: "none", 
                    fontWeight: "600", 
                    fontSize: "14px", 
                    textAlign: "center",
                    display: "block",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#3498db"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#2980b9"}>
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "12px", borderTop: "1px solid #ecf0f1" }}>
        © 2025 Information Network Security Administration. All rights reserved.
      </div>
    </div>
  );
}
