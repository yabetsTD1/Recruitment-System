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
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 20px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#7f8c8d", padding: "40px" }}>Loading jobs...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
            <p style={{ fontSize: "16px" }}>No open positions at the moment.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map(job => (
              <div key={job.id} style={{ background: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>{job.jobTitle}</h2>
                      <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>Open</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {job.department && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>🏢 {job.department}</span>}
                      {job.jobLocation && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>📍 {job.jobLocation}</span>}
                      {job.salary && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>💰 {job.salary}</span>}
                      {job.hiringType && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>📄 {job.hiringType}</span>}
                      <span style={{ fontSize: "13px", color: "#7f8c8d" }}>👥 {job.vacancyNumber} position(s)</span>
                    </div>
                    {job.closingDate && (
                      <p style={{ fontSize: "12px", color: "#e67e22", fontWeight: "600", margin: 0 }}>
                        Deadline: {job.closingDate}
                      </p>
                    )}
                  </div>
                  <Link href={`/apply?id=${job.id}`}
                    style={{ padding: "10px 24px", background: "#2980b9", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" }}>
                    Apply Now
                  </Link>
                </div>
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
