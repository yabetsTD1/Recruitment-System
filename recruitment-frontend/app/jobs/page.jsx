"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch(`${API}/public/jobs`)
      .then(r => r.json())
      .then(d => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    (j.jobTitle || "").toLowerCase().includes(search.toLowerCase()) ||
    (j.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f0f3f4" }}>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(44,62,80,0.98)" : "rgba(44,62,80,0.92)",
        backdropFilter: "blur(8px)",
        boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.25)" : "none",
        transition: "all 0.3s", height: "56px", display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src="/logo.png" alt="INSA Logo" style={{ height: "38px", width: "38px", objectFit: "contain" }} />
            <span style={{ color: "white", fontWeight: "700", fontSize: "16px", letterSpacing: "0.5px" }}>INSA-ERP</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[{ label: "Home", href: "/" }, { label: "Jobs", href: "/jobs" }].map(item => (
              <Link key={item.label} href={item.href} style={{
                color: item.href === "/jobs" ? "white" : "rgba(255,255,255,0.85)",
                textDecoration: "none", padding: "6px 14px", borderRadius: "4px",
                fontSize: "13px", fontWeight: item.href === "/jobs" ? "700" : "500",
                background: item.href === "/jobs" ? "rgba(255,255,255,0.12)" : "transparent",
              }}>
                {item.label}
              </Link>
            ))}
            <Link href="/login" style={{
              marginLeft: "8px", background: "#2980b9", color: "white",
              textDecoration: "none", padding: "7px 18px", borderRadius: "4px",
              fontSize: "13px", fontWeight: "600",
            }}>
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div style={{
        backgroundImage: "url('/insa background.png')",
        backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
        paddingTop: "100px", paddingBottom: "48px", position: "relative", textAlign: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,37,47,0.75)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{ color: "white", fontSize: "36px", fontWeight: "700", margin: "0 0 10px 0" }}>Open Positions</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", margin: "0 0 24px 0" }}>
            {loading ? "Loading..." : `${jobs.length} position${jobs.length !== 1 ? "s" : ""} currently available`}
          </p>
          <input
            type="text"
            placeholder="Search by job title or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", maxWidth: "480px", padding: "12px 18px",
              border: "none", borderRadius: "6px", fontSize: "14px",
              outline: "none", boxSizing: "border-box",
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      {/* Job Listings */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#95a5a6", fontSize: "15px" }}>
            Loading jobs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: "12px", color: "#7f8c8d" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>📋</div>
            <p style={{ fontSize: "16px", margin: 0 }}>
              {jobs.length === 0 ? "No open positions at the moment. Check back soon." : "No jobs match your search."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            {filtered.map(job => (
              <div key={job.id} style={{
                background: "white", borderRadius: "10px", padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e8ecef",
                display: "flex", flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.13)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}>
                {/* Header */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", margin: 0, flex: 1, lineHeight: 1.3 }}>{job.jobTitle}</h3>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "700", background: "#d1fae5", color: "#065f46", whiteSpace: "nowrap" }}>OPEN</span>
                  </div>
                  {job.department && (
                    <p style={{ fontSize: "13px", color: "#7f8c8d", margin: 0 }}>🏢 {job.department}</p>
                  )}
                </div>

                {/* Details */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
                  marginBottom: "16px", padding: "14px", background: "#f8f9fa", borderRadius: "6px",
                }}>
                  {job.batchCode && (
                    <div>
                      <p style={{ fontSize: "10px", color: "#95a5a6", margin: "0 0 3px 0", fontWeight: "700", textTransform: "uppercase" }}>Batch Code</p>
                      <p style={{ fontSize: "13px", color: "#2c3e50", margin: 0, fontWeight: "600" }}>{job.batchCode}</p>
                    </div>
                  )}
                  {job.recruitmentType && (
                    <div>
                      <p style={{ fontSize: "10px", color: "#95a5a6", margin: "0 0 3px 0", fontWeight: "700", textTransform: "uppercase" }}>Type</p>
                      <p style={{ fontSize: "13px", color: "#2c3e50", margin: 0, fontWeight: "600" }}>{job.recruitmentType}</p>
                    </div>
                  )}
                  {job.salary && (
                    <div>
                      <p style={{ fontSize: "10px", color: "#95a5a6", margin: "0 0 3px 0", fontWeight: "700", textTransform: "uppercase" }}>Salary</p>
                      <p style={{ fontSize: "13px", color: "#27ae60", margin: 0, fontWeight: "600" }}>{job.salary}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: "10px", color: "#95a5a6", margin: "0 0 3px 0", fontWeight: "700", textTransform: "uppercase" }}>Vacancies</p>
                    <p style={{ fontSize: "13px", color: "#2c3e50", margin: 0, fontWeight: "600" }}>{job.vacancyNumber || 0} Position{job.vacancyNumber !== 1 ? "s" : ""}</p>
                  </div>
                  {(job.deadline || job.closingDate) && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <p style={{ fontSize: "10px", color: "#95a5a6", margin: "0 0 3px 0", fontWeight: "700", textTransform: "uppercase" }}>Deadline</p>
                      <p style={{ fontSize: "13px", color: "#e67e22", margin: 0, fontWeight: "700" }}>{job.deadline || job.closingDate}</p>
                    </div>
                  )}
                </div>

                {/* Extra info */}
                <div style={{ marginBottom: "16px", flex: 1 }}>
                  {job.jobLocation && <p style={{ fontSize: "12px", color: "#7f8c8d", margin: "0 0 5px 0" }}>📍 {job.jobLocation}</p>}
                  {job.employmentType && <p style={{ fontSize: "12px", color: "#7f8c8d", margin: "0 0 5px 0" }}>📄 {job.employmentType}</p>}
                  {job.hiringType && <p style={{ fontSize: "12px", color: "#7f8c8d", margin: 0 }}>🔖 {job.hiringType}</p>}
                </div>

                <Link href={`/jobs/${job.id}`} style={{
                  padding: "11px 20px", background: "#2980b9", color: "white",
                  borderRadius: "6px", textDecoration: "none", fontWeight: "600",
                  fontSize: "14px", textAlign: "center", display: "block",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#3498db"}
                onMouseLeave={e => e.currentTarget.style.background = "#2980b9"}>
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ background: "#2c3e50", color: "white", padding: "32px 24px 20px", marginTop: "40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <span style={{ fontWeight: "700", fontSize: "14px" }}>INSA-ERP Recruitment Portal</span>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>© 2025 Information Network Security Administration. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
