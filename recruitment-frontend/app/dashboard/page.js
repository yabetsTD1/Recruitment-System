"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import api from "../../services/api";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        setUser(parsed);
        fetchStats(parsed.role);
      }
    } catch (e) {}
  }, []);

  const fetchStats = async (role) => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (e) {}
  };

  if (!user) return null;

  if (user.role === "SUPER_ADMIN") return <SuperAdminHome stats={stats} user={user} />;
  if (user.role === "ADMIN") return <AdminHome stats={stats} user={user} />;
  return <EmployeeHome user={user} />;
}

// ── Super Admin Home ──────────────────────────────────────────────────────────
function SuperAdminHome({ stats, user }) {
  const cards = [
    { label: "Total Users", value: stats.totalUsers ?? 0, color: "#8e44ad", icon: "👥", href: "/dashboard/users" },
    { label: "Total Employees", value: stats.totalEmployees ?? 0, color: "#2980b9", icon: "👤", href: "/dashboard/users" },
    { label: "Total Recruitments", value: stats.totalRecruitments ?? 0, color: "#27ae60", icon: "📋", href: "/dashboard/recruitment/vacant-spaces" },
    { label: "Applications", value: stats.totalApplications ?? 0, color: "#e67e22", icon: "📄", href: "/dashboard/recruitment/filter-candidates" },
  ];

  const quickLinks = [
    { label: "Add System Admin", href: "/dashboard/users", icon: "➕", color: "#8e44ad" },
    { label: "Add Employee", href: "/dashboard/users", icon: "👤", color: "#2980b9" },
    { label: "Job Type Hierarchy", href: "/dashboard/job-types", icon: "🗂", color: "#27ae60" },
    { label: "Organization Profile", href: "/dashboard/org-profile", icon: "🏛", color: "#e67e22" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Super Admin Dashboard</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Welcome, {user.fullName || user.email}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {cards.map((c, i) => (
          <Link key={i} href={c.href} style={{ textDecoration: "none" }}>
            <div style={{ background: c.color, borderRadius: "6px", padding: "20px 18px", color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
              <p style={{ fontSize: "36px", fontWeight: "700", margin: "0 0 4px 0", lineHeight: 1 }}>{c.value}</p>
              <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{c.label}</p>
              <div style={{ position: "absolute", right: "14px", bottom: "10px", fontSize: "28px", opacity: 0.2 }}>{c.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ background: "#8e44ad", padding: "12px 18px" }}>
          <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>⚡ Quick Actions</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", padding: "20px" }}>
          {quickLinks.map((q, i) => (
            <Link key={i} href={q.href} style={{ textDecoration: "none" }}>
              <div style={{ border: `2px solid ${q.color}`, borderRadius: "8px", padding: "18px", textAlign: "center", cursor: "pointer", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = q.color + "15"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{q.icon}</div>
                <p style={{ color: q.color, fontWeight: "600", fontSize: "13px", margin: 0 }}>{q.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Admin Home ────────────────────────────────────────────────────────────────
function AdminHome({ stats, user }) {
  const [search, setSearch] = useState("");
  const [vacancies, setVacancies] = useState([]);

  useEffect(() => {
    api.get("/recruitments/internal-jobs")
      .then(r => setVacancies(r.data))
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Internal Posts", value: vacancies.length, color: "#27ae60", icon: "📌" },
    { label: "Vacant Spaces", value: stats.totalRecruitments ?? 0, color: "#2980b9", icon: "🏢" },
    { label: "Pending Requests", value: stats.pendingRequests ?? 0, color: "#e67e22", icon: "📝" },
    { label: "Hired This Month", value: stats.totalApplications ?? 0, color: "#8e44ad", icon: "🤝" },
  ];

  const filtered = vacancies.filter(v =>
    v.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    (v.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Welcome back, {user.fullName || user.email}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: c.color, borderRadius: "6px", padding: "20px 18px", color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", position: "relative", overflow: "hidden" }}>
            <p style={{ fontSize: "36px", fontWeight: "700", margin: "0 0 4px 0", lineHeight: 1 }}>{c.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{c.label}</p>
            <div style={{ position: "absolute", right: "14px", bottom: "10px", fontSize: "28px", opacity: 0.25 }}>{c.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ background: "#2980b9", padding: "12px 18px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>📌 Internal Vacancy</span>
        </div>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #ecf0f1", background: "#f8f9fa" }}>
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: "6px 12px", border: "1px solid #dce1e7", borderRadius: "4px", fontSize: "13px", outline: "none", width: "220px" }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f3f4" }}>
                {["Post Code", "Job Title", "Department", "Grade", "Close Date", "Applicants"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#5d6d7e", borderBottom: "1px solid #dce1e7", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>No internal vacancies posted yet.</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f3f4" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#2980b9", fontWeight: "600" }}>{row.batchCode || `#${row.id}`}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#2c3e50", fontWeight: "500" }}>{row.jobTitle}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{row.department || "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{row.hiringType || "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{row.closingDate || "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px" }}>
                    <span style={{ background: "#eaf4fb", color: "#2980b9", padding: "2px 10px", borderRadius: "10px", fontWeight: "600", fontSize: "12px" }}>{row.vacancyNumber}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f3f4", display: "flex", justifyContent: "flex-end" }}>
          <Link href="/dashboard/internal-vacancy" style={{ color: "#2980b9", fontSize: "12px", textDecoration: "none", fontWeight: "600" }}>View All →</Link>
        </div>
      </div>
    </div>
  );
}

// ── Employee Home ─────────────────────────────────────────────────────────────
function EmployeeHome({ user }) {
  const [vacancies, setVacancies] = useState([]);
  const [myApps, setMyApps] = useState([]);

  useEffect(() => {
    api.get("/recruitments/internal-jobs").then(r => setVacancies(r.data)).catch(() => {});
    api.get("/recruitments/my-applications").then(r => setMyApps(r.data)).catch(() => {});
  }, []);

  const underReview = myApps.filter(a => a.status === "UNDER_REVIEW").length;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>My Dashboard</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Welcome, {user.fullName || user.email}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Open Vacancies", value: vacancies.length, color: "#27ae60", icon: "📌" },
          { label: "My Applications", value: myApps.length, color: "#2980b9", icon: "📄" },
          { label: "Under Review", value: underReview, color: "#e67e22", icon: "🔍" },
        ].map((c, i) => (
          <div key={i} style={{ background: c.color, borderRadius: "6px", padding: "20px 18px", color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", position: "relative", overflow: "hidden" }}>
            <p style={{ fontSize: "36px", fontWeight: "700", margin: "0 0 4px 0", lineHeight: 1 }}>{c.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{c.label}</p>
            <div style={{ position: "absolute", right: "14px", bottom: "10px", fontSize: "28px", opacity: 0.25 }}>{c.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ background: "#27ae60", padding: "12px 18px" }}>
          <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>📌 Open Internal Vacancies</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f3f4" }}>
                {["Post Code", "Job Title", "Department", "Close Date", "Action"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#5d6d7e", borderBottom: "1px solid #dce1e7" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vacancies.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>No open vacancies at the moment.</td></tr>
              ) : vacancies.slice(0, 5).map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f3f4" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#2980b9", fontWeight: "600" }}>{row.batchCode || `#${row.id}`}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#2c3e50", fontWeight: "500" }}>{row.jobTitle}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{row.department || "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{row.closingDate || "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <Link href="/dashboard/internal-vacancy" style={{ background: "#27ae60", color: "white", padding: "4px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", textDecoration: "none" }}>Apply</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f3f4", display: "flex", justifyContent: "flex-end" }}>
          <Link href="/dashboard/internal-vacancy" style={{ color: "#27ae60", fontSize: "12px", textDecoration: "none", fontWeight: "600" }}>View All →</Link>
        </div>
      </div>
    </div>
  );
}
