"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filtered = jobs.filter(
    (j) =>
      (j.jobTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const navBg = scrolled ? "rgba(44,62,80,0.98)" : "rgba(44,62,80,0.92)";

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f0f3f4" }}>

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg,
        backdropFilter: "blur(8px)",
        boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.25)" : "none",
        transition: "all 0.3s",
        height: "56px",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="34" height="38" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 4 L10 22 L10 62 Q10 88 50 102 Q90 88 90 62 L90 22 Z" fill="none" stroke="url(#ng)" strokeWidth="5" strokeLinejoin="round"/>
              <defs><linearGradient id="ng" x1="10" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c0392b"/><stop offset="50%" stopColor="#8e44ad"/><stop offset="100%" stopColor="#2980b9"/></linearGradient></defs>
              <rect x="47" y="54" width="6" height="28" rx="2" fill="#7f8c8d"/>
              <circle cx="50" cy="40" r="18" fill="none" stroke="#c0392b" strokeWidth="5"/>
              <circle cx="50" cy="40" r="12" fill="white"/>
              <circle cx="50" cy="40" r="8" fill="#4a4a7a"/>
            </svg>
            <span style={{ color: "white", fontWeight: "700", fontSize: "16px", letterSpacing: "0.5px" }}>INSA-ERP</span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[
              { label: "Home", href: "/" },
              { label: "Jobs", href: "/jobs" },
            ].map((item) => (
              <Link key={item.label} href={item.href} style={{
                color: "rgba(255,255,255,0.85)", textDecoration: "none",
                padding: "6px 14px", borderRadius: "4px", fontSize: "13px", fontWeight: "500",
              }}>
                {item.label}
              </Link>
            ))}
            <Link href="/login" style={{
              marginLeft: "8px",
              background: "#2980b9", color: "white", textDecoration: "none",
              padding: "7px 18px", borderRadius: "4px", fontSize: "13px", fontWeight: "600",
            }}>
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #2c3e50 0%, #1a252f 60%, #2980b9 100%)",
        paddingTop: "120px", paddingBottom: "80px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(41,128,185,0.3)", border: "1px solid rgba(41,128,185,0.5)", borderRadius: "20px", padding: "6px 16px", marginBottom: "24px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1abc9c", display: "inline-block" }}></span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px" }}>
              {loading ? "Loading positions..." : `${jobs.length} Position${jobs.length !== 1 ? "s" : ""} Open`}
            </span>
          </div>
          <h1 style={{ color: "white", fontSize: "48px", fontWeight: "700", margin: "0 0 16px 0", lineHeight: 1.2 }}>
            INSA Recruitment Portal
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "17px", margin: "0 0 36px 0", lineHeight: 1.6 }}>
            Find your next opportunity at the Information Network Security Administration. Browse open positions and apply directly online.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/jobs" style={{ background: "#2980b9", color: "white", textDecoration: "none", padding: "12px 32px", borderRadius: "4px", fontWeight: "600", fontSize: "15px" }}>
              Browse All Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar — real counts */}
      <div style={{ background: "#2980b9" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { value: loading ? "—" : String(jobs.length), label: "Open Positions" },
            { value: loading ? "—" : String(new Set(jobs.map((j: any) => j.department).filter(Boolean)).size), label: "Departments Hiring" },
            { value: loading ? "—" : String(jobs.reduce((s: number, j: any) => s + (j.vacancyNumber || 0), 0)), label: "Total Vacancies" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
              <p style={{ color: "white", fontWeight: "700", fontSize: "22px", margin: 0 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", margin: "2px 0 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Job Listings */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Open Positions</h2>
            <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Current vacancies available for application</p>
          </div>
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 14px", border: "1px solid #dce1e7", borderRadius: "4px", fontSize: "13px", outline: "none", width: "220px" }}
          />
        </div>

        <div style={{ background: "white", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#95a5a6", fontSize: "14px" }}>Loading jobs...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0f3f4" }}>
                  {["Job Title", "Department", "Location", "Deadline", "Action"].map((h) => (
                    <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#5d6d7e", borderBottom: "1px solid #dce1e7" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id} style={{ borderBottom: "1px solid #f0f3f4" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f8f9fa")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "white")}
                  >
                    <td style={{ padding: "12px 18px", fontWeight: "600", color: "#2c3e50", fontSize: "14px" }}>
                      {job.jobTitle}
                      {job.vacancyNumber > 0 && (
                        <span style={{ marginLeft: "8px", fontSize: "11px", color: "#7f8c8d", fontWeight: "400" }}>
                          ({job.vacancyNumber} opening{job.vacancyNumber !== 1 ? "s" : ""})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 18px", color: "#5d6d7e", fontSize: "13px" }}>{job.department || "—"}</td>
                    <td style={{ padding: "12px 18px", color: "#5d6d7e", fontSize: "13px" }}>{job.jobLocation || "—"}</td>
                    <td style={{ padding: "12px 18px", color: job.closingDate ? "#e67e22" : "#5d6d7e", fontSize: "13px", fontWeight: job.closingDate ? "600" : "400" }}>
                      {job.closingDate || "Open"}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <Link href={`/apply?id=${job.id}`} style={{ background: "#2980b9", color: "white", textDecoration: "none", padding: "6px 16px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#3498db")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#2980b9")}
                      >
                        Apply Now
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#95a5a6", fontSize: "14px" }}>
                      {jobs.length === 0 ? "No open positions at the moment." : "No jobs match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#2c3e50", color: "white", padding: "40px 24px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", marginBottom: "32px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <svg width="28" height="30" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 4 L10 22 L10 62 Q10 88 50 102 Q90 88 90 62 L90 22 Z" fill="none" stroke="url(#fg)" strokeWidth="6" strokeLinejoin="round"/>
                  <defs><linearGradient id="fg" x1="10" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#c0392b"/><stop offset="100%" stopColor="#2980b9"/></linearGradient></defs>
                  <circle cx="50" cy="40" r="14" fill="none" stroke="#c0392b" strokeWidth="4"/>
                  <circle cx="50" cy="40" r="7" fill="#4a4a7a"/>
                  <rect x="47" y="52" width="6" height="22" rx="2" fill="#7f8c8d"/>
                </svg>
                <span style={{ fontWeight: "700", fontSize: "15px" }}>INSA-ERP</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                Information Network Security Administration — Recruitment Portal
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px", color: "rgba(255,255,255,0.9)" }}>Quick Links</h4>
              {[{ label: "Home", href: "/" }, { label: "Jobs", href: "/jobs" }].map((l) => (
                <div key={l.label} style={{ marginBottom: "8px" }}>
                  <Link href={l.href} style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: "13px" }}>{l.label}</Link>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px", color: "rgba(255,255,255,0.9)" }}>Contact</h4>
              {["hr@insa.gov.et", "+251 11 XXX XXXX", "Addis Ababa, Ethiopia"].map((c) => (
                <p key={c} style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "0 0 8px 0" }}>{c}</p>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>
              © 2025 INSA Recruitment System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
