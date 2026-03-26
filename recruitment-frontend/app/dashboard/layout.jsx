"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Menu per role
const SUPER_ADMIN_MENU = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", href: "/dashboard" },
  { id: "users", label: "User Management", icon: "👥", href: "/dashboard/users" },
  { id: "org-structure", label: "Organization Structure", icon: "🏢", href: "/dashboard/org-structure" },
  { id: "job-types", label: "Job Types", icon: "🗂", href: "/dashboard/job-types" },
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* Header - Full Width at Top */}
      <header style={{ background: "#d3d5d7ff", height: "65px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 100, borderBottom: "2px solid #9ca3af" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* INSA Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
              <Image
                src="/logo.png"
                alt="INSA-ERP Logo"
                width={50}
                height={50}
                style={{ borderRadius: "4px" }}
              />
            </div>
            <div>
              <span style={{ color: "#1f2937", fontWeight: "700", fontSize: "16px", letterSpacing: "0.5px", whiteSpace: "nowrap", display: "block" }}>INSA-ERP</span>
              {user && (
                <span style={{ fontSize: "10px", background: roleBadge, color: "white", padding: "2px 8px", borderRadius: "10px", fontWeight: "600", whiteSpace: "nowrap" }}>
                  {(user.role || "").replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
          
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: "20px", padding: "6px", lineHeight: 1 }}>☰</button>
          
          <span style={{ color: "#9ca3af", fontSize: "20px", margin: "0 8px" }}>|</span>
          <span style={{ color: "#6b7280", fontSize: "14px" }}>
            {pathname === "/dashboard" ? "Dashboard" : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/" style={{ color: "#4b5563", textDecoration: "none", fontSize: "13px", padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: "4px" }}>Public Site</Link>
          <button onClick={handleLogout} style={{ background: "#e74c3c", color: "white", border: "none", borderRadius: "4px", padding: "6px 16px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>Logout</button>
        </div>
      </header>

      {/* Content Area - Sidebar + Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? "160px" : "70px",
        minWidth: sidebarOpen ? "240px" : "50px",
        transition: "all 0.3s ease",
        overflow: sidebarOpen ? "hidden" : "visible",
        background: "#031526ff",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        boxShadow: "2px 0 8px rgba(0,0,0,0.2)",
        marginTop: "-1px",
      }}>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", paddingTop: "6px" }}>
          {menu.map((item) => (
            <div key={item.id}>
              {item.children ? (
                <>
                  <button onClick={() => toggleMenu(item.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "space-between" : "center",
                    padding: sidebarOpen ? "10px 18px" : "10px 0", border: "none", cursor: "pointer", textAlign: "left",
                    background: expandedMenus[item.id] ? "rgba(41,128,185,0.3)" : isParentActive(item.children) ? "rgba(41,128,185,0.2)" : "transparent",
                    color: expandedMenus[item.id] ? "#5dade2" : "rgba(255,255,255,0.82)",
                    fontSize: "13px",
                    borderLeft: expandedMenus[item.id] || isParentActive(item.children) ? "3px solid #3498db" : "3px solid transparent",
                  }}
                    title={!sidebarOpen ? item.label : ""}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <span style={{ fontSize: "18px" }}>{item.icon}</span>
                      {sidebarOpen && <span style={{ fontWeight: "500", whiteSpace: "nowrap" }}>{item.label}</span>}
                    </div>
                    {sidebarOpen && (
                      <span style={{ fontSize: "9px", transform: expandedMenus[item.id] ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.25s", display: "inline-block", color: expandedMenus[item.id] ? "#5dade2" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>▶</span>
                    )}
                  </button>
                  <div style={{ maxHeight: expandedMenus[item.id] ? "900px" : "0px", overflow: "hidden", transition: "max-height 0.35s ease", background: "rgba(0,0,0,0.18)" }}>
                    {sidebarOpen && item.children.map((child) => (
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
                  display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "flex-start" : "center", gap: "9px",
                  padding: sidebarOpen ? "10px 18px" : "10px 0", textDecoration: "none",
                  background: isActive(item.href) ? "#2980b9" : "transparent",
                  color: isActive(item.href) ? "white" : "rgba(255,255,255,0.82)",
                  fontSize: "13px", fontWeight: "500",
                  borderLeft: isActive(item.href) ? "3px solid #5dade2" : "3px solid transparent",
                  whiteSpace: "nowrap",
                }}
                  title={!sidebarOpen ? item.label : ""}
                  onMouseEnter={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={(e) => { if (!isActive(item.href)) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  {sidebarOpen && item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#243342", flexShrink: 0, display: sidebarOpen ? "block" : "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "flex-start" : "center", gap: "9px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: roleBadge, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "13px", flexShrink: 0 }}>
                {(user.fullName || user.email || "U")[0].toUpperCase()}
              </div>
              {sidebarOpen && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "white", fontSize: "12px", fontWeight: "600", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.fullName || user.email}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 }}>{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#ffffffff" }}>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {children}
        </main>
      </div>

      </div>
    </div>
  );
}
