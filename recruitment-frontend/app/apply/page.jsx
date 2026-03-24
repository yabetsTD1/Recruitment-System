"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: "7px",
  border: "1px solid #dde1e7", fontSize: "14px", outline: "none",
  boxSizing: "border-box", background: "#fff", color: "#2c3e50",
};

const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "5px", display: "block" };

function ApplyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const jobId = params.get("id");

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", location: "",
    gender: "", githubUrl: "", linkedinUrl: "",
  });

  useEffect(() => {
    if (!jobId) { setLoadingJob(false); return; }
    fetch(`${API}/public/jobs/${jobId}`)
      .then(r => r.json())
      .then(d => setJob(d))
      .catch(() => setJob(null))
      .finally(() => setLoadingJob(false));
  }, [jobId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.location.trim() || !form.gender) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, recruitmentId: Number(jobId) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Submission failed."); return; }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return <div style={{ textAlign: "center", padding: "80px", color: "#7f8c8d" }}>Loading...</div>;
  }

  if (!jobId || !job) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>❌</div>
        <p style={{ color: "#7f8c8d", fontSize: "16px" }}>Job not found.</p>
        <Link href="/jobs" style={{ color: "#2980b9", fontWeight: "600" }}>← Back to Jobs</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>Application Submitted!</h2>
        <p style={{ color: "#7f8c8d", fontSize: "15px", marginBottom: "24px" }}>
          Thank you for applying to <strong>{job.jobTitle}</strong>. We'll be in touch.
        </p>
        <Link href="/jobs" style={{ padding: "10px 24px", background: "#2980b9", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "600" }}>
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto", padding: "32px 20px" }}>
      {/* Job summary card */}
      <div style={{ background: "white", borderRadius: "10px", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", borderLeft: "4px solid #2980b9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#2c3e50" }}>{job.jobTitle}</h2>
          <span style={{ fontSize: "12px", background: "#d1fae5", color: "#065f46", padding: "2px 10px", borderRadius: "20px", fontWeight: "700" }}>Open</span>
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: job.description ? "10px" : 0 }}>
          {job.department && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>🏢 {job.department}</span>}
          {job.jobLocation && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>📍 {job.jobLocation}</span>}
          {job.salary && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>💰 {job.salary}</span>}
          {job.hiringType && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>📄 {job.hiringType}</span>}
          {job.vacancyNumber > 0 && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>👥 {job.vacancyNumber} position(s)</span>}
          {job.batchCode && <span style={{ fontSize: "13px", color: "#7f8c8d" }}>🔖 {job.batchCode}</span>}
        </div>
        {job.closingDate && (
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#e67e22", fontWeight: "600" }}>
            Deadline: {new Date(job.closingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}
        {job.description && (
          <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#555", lineHeight: "1.6", borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
            {job.description}
          </p>
        )}
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "28px 28px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#2c3e50" }}>Your Information</h3>

        {error && (
          <div style={{ background: "#fdecea", color: "#c0392b", padding: "10px 14px", borderRadius: "7px", fontSize: "13px", marginBottom: "16px", border: "1px solid #f5c6cb" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1: Full Name */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Full Name <span style={{ color: "#e74c3c" }}>*</span></label>
            <input style={inputStyle} placeholder="e.g. Abebe Kebede" value={form.fullName} onChange={e => set("fullName", e.target.value)} />
          </div>

          {/* Row 2: Email + Phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Email <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Phone <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} type="tel" placeholder="+251 9XX XXX XXX" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>

          {/* Row 3: Location + Gender */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Location <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} placeholder="e.g. Addis Ababa" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Gender <span style={{ color: "#e74c3c" }}>*</span></label>
              <select style={inputStyle} value={form.gender} onChange={e => set("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Row 4: GitHub + LinkedIn (optional) */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>GitHub Profile <span style={{ color: "#95a5a6", fontWeight: "400" }}>(optional)</span></label>
            <input style={inputStyle} placeholder="https://github.com/username" value={form.githubUrl} onChange={e => set("githubUrl", e.target.value)} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>LinkedIn Profile <span style={{ color: "#95a5a6", fontWeight: "400" }}>(optional)</span></label>
            <input style={inputStyle} placeholder="https://linkedin.com/in/username" value={form.linkedinUrl} onChange={e => set("linkedinUrl", e.target.value)} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "12px", background: submitting ? "#95a5a6" : "#2980b9",
              color: "white", border: "none", borderRadius: "7px", fontSize: "15px",
              fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>

      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <Link href="/jobs" style={{ color: "#7f8c8d", fontSize: "13px", textDecoration: "none" }}>← Back to all jobs</Link>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9" }}>
      {/* Header */}
      <div style={{ background: "#2c3e50", padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <svg width="32" height="36" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 4 L10 22 L10 62 Q10 88 50 102 Q90 88 90 62 L90 22 Z" fill="none" stroke="url(#sg2)" strokeWidth="5" strokeLinejoin="round"/>
            <defs><linearGradient id="sg2" x1="10" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c0392b"/><stop offset="50%" stopColor="#8e44ad"/><stop offset="100%" stopColor="#2980b9"/></linearGradient></defs>
            <rect x="47" y="54" width="6" height="28" rx="2" fill="#7f8c8d"/>
            <circle cx="50" cy="40" r="18" fill="none" stroke="#c0392b" strokeWidth="5"/>
            <circle cx="50" cy="40" r="12" fill="white"/>
            <circle cx="50" cy="40" r="8" fill="#4a4a7a"/>
          </svg>
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>INSA Recruitment</span>
        </div>
        <Link href="/login" style={{ padding: "7px 16px", background: "#27ae60", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
          Staff Login
        </Link>
      </div>

      <div style={{ padding: "32px 20px 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#2c3e50", margin: "0 0 4px" }}>Apply for Position</h1>
        <p style={{ color: "#7f8c8d", fontSize: "14px", margin: "0 0 24px" }}>Fill in your details below to submit your application</p>
      </div>

      <Suspense fallback={<div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d" }}>Loading...</div>}>
        <ApplyForm />
      </Suspense>

      <div style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "12px", borderTop: "1px solid #ecf0f1", marginTop: "32px" }}>
        © 2025 Information Network Security Administration. All rights reserved.
      </div>
    </div>
  );
}
