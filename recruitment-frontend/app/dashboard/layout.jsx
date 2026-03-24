"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// Menu per role
const SUPER_ADMIN_MENU = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", href: "/dashboard" },
  { id: "users", label: "User Management", icon: "👥", href: "/dashboard/users" },
  { id: "job-types", label: "Job Type Hierarchy", icon: "🗂", href: "/dashboard/job-types" },
  { id: "org-profile", label: "Organization Profile", icon: "🏛", href: "/dashboard/org-profile" },
];

const ADMIN_MENU = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", href: "/dashboard" },
  { id: "job-qualification", label: "Job Qualification", icon: "🎓", href: "/dashboard/job-qualification" },
  {
    id: "recruitment", label: "Recruitment", icon: "📋",
    children: [
      { label: "Vacant Spaces", href: "/dashboard/recruitment/vacant-spaces" },
      { label: "Contract Expired Employee", href: "/dashboard/recruitment/contract-expired" },
      { label: "Recruitment Request", href: "/dashboard/recruitment/request" },
      { label: "Recruitment Approve", href: "/dashboard/recruitment/approval" },
      { label: "Maintain Advertisement", href: "/dashboard/recruitment/advertisement" },
      { label: "Recruitment Post", href: "/dashboard/recruitment/post" },
      { label: "Filter Candidates For Exam", href: "/dashboard/recruitment/filter-exam" },
      { label: "Degree Of Exam", href: "/dashboard/recruitment/degree-exam" },
      { label: "Record Result", href: "/dashboard/recruitment/record-result" },
      { label: "Filter Candidates", href: "/dashboard/recruitment/filter-candidates" },
      { label: "Approve Selected List", href: "/dashboard/recruitment/approve-selected" },
      { label: "Hire Candidate", href: "/dashboard/recruitment/hire" },
      { label: "Selected Candidate List", href: "/dashboard/recruitment/selected-lists" },
    ],
  },
  {
    id: "internal-vacancy", label: "Internal Vacancy", icon: "📌",
    children: [
      { label: "Vacancy Post", href: "/dashboard/internal-vacancy/vacancy-post" },
      { label: "Record Criteria", href: "/dashboard/internal-vacancy/record-criteria" },
      { label: "Apply Vacancy", href: "/dashboard/internal-vacancy/apply-vacancy" },
      { label: "View Registered Candidates", href: "/dashboard/internal-vacancy/registered-candidates" },
      { label: "Filter Candidate", href: "/dashboard/internal-vacancy/filter-candidate" },
      { label: "Record Result", href: "/dashboard/internal-vacancy/record-result" },
      { label: "Submit Candidates", href: "/dashboard/internal-vacancy/submit-candidates" },
      { label: "Approved Filter Candidate", href: "/dashboard/internal-vacancy/approved-filter" },
      { label: "Promote Candidates", href: "/dashboard/internal-vacancy/promote-candidates" },
    ],
  },
  { id: "hr-gap", label: "HR Gap Analysis", icon: "📊", href: "/dashboard/hr-gap" },
  { id: "hr-plan", label: "HR Plan", icon: "📅", href: "/dashboard/hr-plan" },
  { id: "employee", label: "Employees", icon: "👤", href: "/dashboard/users" },
];

const EMPLOYEE_MENU = [
  { id: "dashboard", label: "My Dashboard", icon: "⊞", href: "/dashboard" },
  { id: "internal-vacancy", label: "Internal Vacancies", icon: "📌", href: "/dashboard/internal-vacancy" },
  { id: "apply-vacancy", label: "Apply for Vacancy", icon: "✍️", href: "/dashboard/internal-vacancy/apply-vacancy" },
  { id: "my-applications", label: "My Applications", icon: "📄", href: "/dashboard/my-applications" },
];

function getMenu(role) {
  if (role === "SUPER_ADMIN") return SUPER_ADMIN_MENU;
  if (role === "ADMIN") return ADMIN_MENU;
  return EMPLOYEE_MENU;
}

function getRoleBadgeColor(role) {
  if (role === "SUPER_ADMIN") return "#8e44ad";
  if (role === "ADMIN") return "#2980b9";
  return "#27ae60";
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { router.push("/login"); return; }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      // auto-expand active parent
      getMenu(parsed.role).forEach((item) => {
        if (item.children?.some((c) => pathname === c.href)) {
          setExpandedMenus((prev) => ({ ...prev, [item.id]: true }));
        }
      });
    } catch (e) {}
  }, []);

  const toggleMenu = (id) => setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleLogout = () => { localStorage.clear(); router.push("/"); };
  const isActive = (href) => pathname === href;
  const isParentActive = (children) => children?.some((c) => pathname === c.href);

  const menu = user ? getMenu(user.role) : [];
  const roleBadge = user ? getRoleBadgeColor(user.role) : "#2980b9";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? "255px" : "0px",
        minWidth: sidebarOpen ? "255px" : "0px",
        transition: "all 0.3s ease",
        overflow: "hidden",
        background: "#2c3e50",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
      }}>

        {/* Logo */}
        <div style={{ padding: "12px 16px", background: "#243342", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          {/* INSA SVG Logo */}
          <svg width="42" height="46" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            {/* Shield — left half red, right half blue */}
            <path d="M50 4 L10 22 L10 62 Q10 88 50 102 Q90 88 90 62 L90 22 Z" fill="none" stroke="url(#shieldGrad)" strokeWidth="5" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="shieldGrad" x1="10" y1="0" x2="90" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c0392b"/>
                <stop offset="50%" stopColor="#8e44ad"/>
                <stop offset="100%" stopColor="#2980b9"/>
              </linearGradient>
            </defs>
            {/* Key stem */}
            <rect x="47" y="54" width="6" height="30" rx="2" fill="#7f8c8d"/>
            <rect x="47" y="74" width="10" height="3" rx="1" fill="#555"/>
            <rect x="47" y="80" width="7" height="3" rx="1" fill="#555"/>
            {/* Outer red ring */}
            <circle cx="50" cy="40" r="18" fill="none" stroke="#c0392b" strokeWidth="5"/>
            {/* White ring */}
            <circle cx="50" cy="40" r="12" fill="white"/>
            {/* Inner dark circle (key head) */}
            <circle cx="50" cy="40" r="8" fill="#4a4a7a"/>
            {/* Shine */}
            <circle cx="47" cy="37" r="2.5" fill="rgba(255,255,255,0.35)"/>
          </svg>
          <div>
            <span style={{ color: "white", fontWeight: "700", fontSize: "15px", letterSpacing: "0.5px", whiteSpace: "nowrap", display: "block" }}>INSA-ERP</span>
            {user && (
              <span style={{ fontSize: "10px", background: roleBadge, color: "white", padding: "1px 7px", borderRadius: "10px", fontWeight: "600", whiteSpace: "nowrap" }}>
                {(user.role || "").replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", paddingTop: "6px" }}>
          {menu.map((item) => (
            <div key={item.id}>
              {item.children ? (
                <>
                  <button onClick={() => toggleMenu(item.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 18px", border: "none", cursor: "pointer", textAlign: "left",
                    background: expandedMenus[item.id] ? "rgba(41,128,185,0.3)" : isParentActive(item.children) ? "rgba(41,128,185,0.2)" : "transparent",
                    color: expandedMenus[item.id] ? "#5dade2" : "rgba(255,255,255,0.82)",
                    fontSize: "13px",
                    borderLeft: expandedMenus[item.id] || isParentActive(item.children) ? "3px solid #3498db" : "3px solid transparent",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <span style={{ fontSize: "14px" }}>{item.icon}</span>
                      <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: "9px", transform: expandedMenus[item.id] ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.25s", display: "inline-block", color: expandedMenus[item.id] ? "#5dade2" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>▶</span>
                  </button>
                  <div style={{ maxHeight: expandedMenus[item.id] ? "900px" : "0px", overflow: "hidden", transition: "max-height 0.35s ease", background: "rgba(0,0,0,0.18)" }}>
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 16px 8px 40px", textDecoration: "none",
                        background: isActive(child.href) ? "#2980b9" : "transparent",
                        color: isActive(child.href) ? "white" : "rgba(255,255,255,0.65)",
                        fontSize: "12.5px",
                        borderLeft: isActive(child.href) ? "3px solid #5dade2" : "3px solid transparent",
                        whiteSpace: "nowrap",
                      }}
                        onMouseEnter={(e) => { if (!isActive(child.href)) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { if (!isActive(child.href)) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontSize: "12px", opacity: 0.6 }}>📄</span>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link href={item.href} style={{
                  display: "flex", alignItems: "center", gap: "9px",
                  padding: "10px 18px", textDecoration: "none",
                  background: isActive(item.href) ? "#2980b9" : "transparent",
                  color: isActive(item.href) ? "white" : "rgba(255,255,255,0.82)",
                  fontSize: "13px", fontWeight: "500",
                  borderLeft: isActive(item.href) ? "3px solid #5dade2" : "3px solid transparent",
                  whiteSpace: "nowrap",
                }}
                  onMouseEnter={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: "14px" }}>{item.icon}</span>
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#243342", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: roleBadge, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "13px", flexShrink: 0 }}>
                {(user.fullName || user.email || "U")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "white", fontSize: "12px", fontWeight: "600", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.fullName || user.email}
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#ecf0f1" }}>
        <header style={{ background: "#2c3e50", height: "48px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.75)", fontSize: "18px", padding: "4px", lineHeight: 1 }}>☰</button>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>
              {pathname === "/dashboard" ? "Dashboard" : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "12px", padding: "4px 12px", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "3px" }}>Public Site</Link>
            <button onClick={handleLogout} style={{ background: "#e74c3c", color: "white", border: "none", borderRadius: "3px", padding: "5px 14px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Logout</button>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
