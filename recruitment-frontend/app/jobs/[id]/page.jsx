"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    fetch(`${API}/public/jobs/${jobId}`)
      .then(r => r.json())
      .then(d => setJob(d))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApply = () => {
    // Check if already logged in as external user
    const token = typeof window !== "undefined" ? localStorage.getItem("externalToken") : null;
    if (token) {
      // Already logged in — go to apply page with job
      router.push(`/apply?jobId=${jobId}`);
    } else {
      // Not logged in — go to external auth
      router.push(`/external-auth?jobId=${jobId}`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <p style={{ color: "#7f8c8d", fontSize: "16px" }}>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ background: "#2c3e50", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>INSA Recruitment</span>
          <Link href="/jobs" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", textDecoration: "none" }}>← Back to Jobs</Link>
        </div>
        <div style={{ maxWidth: "800px", margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>❌</div>
          <h1 style={{ fontSize: "22px", color: "#2c3e50", marginBottom: "12px" }}>Job Not Found</h1>
          <p style={{ color: "#7f8c8d", marginBottom: "24px" }}>This position may have been closed or doesn't exist.</p>
          <Link href="/jobs" style={{ padding: "10px 24px", background: "#2980b9", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "600" }}>
            Browse Open Positions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#2c3e50", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", background: "#2980b9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🛡️</div>
          <span style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>INSA Recruitment</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/jobs" style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", textDecoration: "none" }}>← All Jobs</Link>
          <Link href="/login" style={{ padding: "7px 16px", background: "#27ae60", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>Staff Login</Link>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px" }}>
        {/* Job Header Card */}
        <div style={{ background: "white", borderRadius: "12px", padding: "28px 32px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937", margin: 0 }}>{job.jobTitle}</h1>
                <span style={{ padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>Open</span>
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {job.department && <span style={{ fontSize: "13px", color: "#6b7280" }}>🏢 {job.department}</span>}
                {job.jobLocation && <span style={{ fontSize: "13px", color: "#6b7280" }}>📍 {job.jobLocation}</span>}
                {job.salary && <span style={{ fontSize: "13px", color: "#6b7280" }}>💰 {job.salary}</span>}
                {job.employmentType && <span style={{ fontSize: "13px", color: "#6b7280" }}>📄 {job.employmentType}</span>}
              </div>
            </div>
            <button onClick={handleApply}
              style={{ padding: "12px 28px", background: "linear-gradient(135deg, #27ae60, #229954)", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 12px rgba(39,174,96,0.3)", whiteSpace: "nowrap" }}>
              Apply Now →
            </button>
          </div>
        </div>

        {/* Key Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "20px" }}>
          {[
            { label: "Batch Code", value: job.batchCode },
            { label: "Vacancies", value: job.vacancyNumber ? `${job.vacancyNumber} Position(s)` : null },
            { label: "Hiring Type", value: job.hiringType },
            { label: "Recruitment Type", value: job.recruitmentType },
            { label: "Closing Date", value: job.closingDate, highlight: true },
          ].filter(i => i.value).map((item, idx) => (
            <div key={idx} style={{ background: "white", borderRadius: "8px", padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{item.label}</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: item.highlight ? "#f59e0b" : "#1f2937" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {job.description && (
          <div style={{ background: "white", borderRadius: "12px", padding: "24px 28px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937", marginBottom: "14px" }}>Job Description</h2>
            <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{job.description}</div>
          </div>
        )}

        {/* Qualifications */}
        {(job.qualificationEntries?.length > 0 || job.minDegree || job.requiredSkills) && (
          <div style={{ background: "white", borderRadius: "12px", padding: "24px 28px", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>Requirements & Qualifications</h2>
            {job.qualificationEntries?.length > 0 ? job.qualificationEntries.map((entry, i) => (
              <div key={i} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: i < job.qualificationEntries.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                {entry.educationLevel && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Education: </span><span style={{ fontSize: "14px", color: "#1f2937" }}>{entry.educationLevel}</span></div>}
                {entry.fieldOfStudy && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Field: </span><span style={{ fontSize: "14px", color: "#1f2937" }}>{entry.fieldOfStudy}</span></div>}
                {entry.minExperience && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Experience: </span><span style={{ fontSize: "14px", color: "#1f2937" }}>{entry.minExperience} year(s)</span></div>}
                {entry.skill && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Skills: </span><span style={{ fontSize: "14px", color: "#1f2937" }}>{entry.skill}</span></div>}
              </div>
            )) : (
              <div>
                {job.minDegree && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Education: </span><span style={{ fontSize: "14px", color: "#1f2937" }}>{job.minDegree}</span></div>}
                {job.requiredSkills && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "12px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Skills: </span><span style={{ fontSize: "14px", color: "#1f2937" }}>{job.requiredSkills}</span></div>}
              </div>
            )}
          </div>
        )}

        {/* Apply CTA */}
        <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: "12px", padding: "28px 32px", textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "white", marginBottom: "8px" }}>Ready to Apply?</h3>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "20px" }}>Join the Information Network Security Administration team.</p>
          <button onClick={handleApply}
            style={{ padding: "13px 40px", background: "linear-gradient(135deg, #27ae60, #229954)", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 12px rgba(39,174,96,0.3)" }}>
            Apply Now →
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "12px", borderTop: "1px solid #ecf0f1", marginTop: "32px" }}>
        © 2025 Information Network Security Administration. All rights reserved.
      </div>
    </div>
  );
}
