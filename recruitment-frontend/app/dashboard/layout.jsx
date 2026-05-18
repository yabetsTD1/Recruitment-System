"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/services/api";

// Menu per role
const SUPER_ADMIN_MENU = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", href: "/dashboard" },
  {
    id: "users",
    label: "User Management",
    icon: "👥",
    href: "/dashboard/users",
  },
  {
    id: "org-structure",
    label: "Organization Structure",
    icon: "🏢",
    href: "/dashboard/org-structure",
  },
  {
    id: "job-types",
    label: "Job Type Hierarchy",
    icon: "🗂",
    href: "/dashboard/job-types",
  },
  {
    id: "org-profile",
    label: "Organization Profile",
    icon: "🏛",
    href: "/dashboard/org-profile",
  },
  {
    id: "recruitment",
    label: "Recruitment",
    icon: "📋",
    children: [
      { label: "Recruitment Request", href: "/dashboard/recruitment/request" },
      { label: "Recruitment Approve", href: "/dashboard/recruitment/approval" },
      { label: "Recruitment Post", href: "/dashboard/recruitment/post" },
    ],
  },
];
const ADMIN_MENU = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", href: "/dashboard" },
  {
    id: "org-profile",
    label: "Organization Profile",
    icon: "⊞",
    children: [
      { label: "Organization Structure", href: "/dashboard/org-structure" },
      {
        label: "Salary Setting",
        href: "/dashboard/org-profile/salary-setting",
      },
      { label: "Register Jobs", href: "/dashboard/org-profile/register-jobs" },
      {
        label: "Register Job Qualification",
        href: "/dashboard/job-qualification",
      },
      {
        label: "Jobs Under Family",
        href: "/dashboard/org-profile/jobs-under-family",
      },
      {
        label: "Jobs Under Department",
        href: "/dashboard/org-profile/jobs-under-department",
      },
    ],
  },
  {
    id: "recruitment",
    label: "Recruitment",
    icon: "📋",
    children: [
      { label: "Vacant Spaces", href: "/dashboard/recruitment/vacant-spaces" },
      {
        label: "Contract Expired Employee",
        href: "/dashboard/recruitment/contract-expired",
      },
      { label: "Recruitment Request", href: "/dashboard/recruitment/request" },
      { label: "Recruitment Approve", href: "/dashboard/recruitment/approval" },
      {
        label: "Maintain Advertisement",
        href: "/dashboard/recruitment/advertisement",
      },
      { label: "Recruitment Post", href: "/dashboard/recruitment/post" },
      {
        label: "Filter Candidates For Exam",
        href: "/dashboard/recruitment/filter-exam",
      },
      { label: "Degree Of Exam", href: "/dashboard/recruitment/degree-exam" },
      { label: "Record Result", href: "/dashboard/recruitment/record-result" },
      {
        label: "Filter Candidates",
        href: "/dashboard/recruitment/filter-candidates",
      },
      {
        label: "Approve Selected List",
        href: "/dashboard/recruitment/approve-selected",
      },
      { label: "Hire Candidate", href: "/dashboard/recruitment/hire" },
      {
        label: "Selected Candidate List",
        href: "/dashboard/recruitment/selected-lists",
      },
    ],
  },
  {
    id: "internal-vacancy",
    label: "Internal Vacancy",
    icon: "📌",
    children: [
      {
        label: "Vacancy Post",
        href: "/dashboard/internal-vacancy/vacancy-post",
      },
      {
        label: "Record Criteria",
        href: "/dashboard/internal-vacancy/record-criteria",
      },
      {
        label: "Apply Vacancy",
        href: "/dashboard/internal-vacancy/apply-vacancy",
      },
      {
        label: "View Registered Candidates",
        href: "/dashboard/internal-vacancy/registered-candidates",
      },
      {
        label: "Record Result",
        href: "/dashboard/internal-vacancy/record-result",
      },
      {
        label: "Filter Candidate",
        href: "/dashboard/internal-vacancy/filter-candidate",
      },
      {
        label: "Submit Candidates",
        href: "/dashboard/internal-vacancy/submit-candidates",
      },
      {
        label: "Approved Filter Candidate",
        href: "/dashboard/internal-vacancy/approved-filter",
      },
      {
        label: "Promote Candidates",
        href: "/dashboard/internal-vacancy/promote-candidates",
      },
    ],
  },
  {
    id: "hr-gap",
    label: "HR Gap Analysis",
    icon: "📊",
    href: "/dashboard/hr-gap",
  },
  { id: "hr-plan", label: "HR Plan", icon: "📅", href: "/dashboard/hr-plan" },
  { id: "employee", label: "Employees", icon: "👤", href: "/dashboard/users" },
];

const EMPLOYEE_MENU = [
  { id: "dashboard", label: "My Dashboard", icon: "⊞", href: "/dashboard" },
  {
    id: "internal-vacancy",
    label: "Internal Vacancies",
    icon: "📌",
    href: "/dashboard/internal-vacancy",
  },
  {
    id: "my-applications",
    label: "My Applications",
    icon: "📄",
    href: "/dashboard/my-applications",
  },
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

function isAdminRole(role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(0);
  const [pendingPost, setPendingPost] = useState(0);
  const notifRef = useRef(null);

  const fetchNotifCounts = async (currentUser) => {
    try {
      const res = await api.get("/recruitments");
      const list = res.data || [];
      const role = currentUser?.role;
      const name = currentUser?.fullName || "";
      const email = currentUser?.email || "";

      if (role === "SUPER_ADMIN") {
        // SUPER_ADMIN sees all pending approval requests (REQUESTED status)
        setPendingApproval(list.filter(r => r.status === "REQUESTED").length);
        setPendingPost(0); // SUPER_ADMIN does NOT see post notifications
      } else if (role === "ADMIN") {
        // ADMIN sees post notifications for recruitments THEY recorded (match by name OR email)
        const myApproved = list.filter(r =>
          r.status === "APPROVED" &&
          (
            (name && r.recorderName === name) ||
            (email && r.recorderName === email)
          )
        );
        setPendingApproval(0);
        setPendingPost(myApproved.length);
      } else {
        setPendingApproval(0);
        setPendingPost(0);
      }
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      // auto-expand active parent
      getMenu(parsed.role).forEach((item) => {
        if (item.children?.some((c) => pathname === c.href)) {
          setExpandedMenus((prev) => ({ ...prev, [item.id]: true }));
        }
      });
      // fetch notification counts for ADMIN/SUPER_ADMIN
      if (isAdminRole(parsed.role)) {
        fetchNotifCounts(parsed);
      }
    } catch (e) {}
  }, []);

  const toggleMenu = (id) =>
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const handleLogout = () => {
    const token = localStorage.getItem("token");
    localStorage.clear();

    // Detect if the stored token is a Keycloak token by checking the issuer claim
    let isKeycloakToken = false;
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          if (payload.iss && payload.iss.includes("localhost:9090")) {
            isKeycloakToken = true;
          }
        }
      } catch (_) {}
    }

    if (isKeycloakToken) {
      // Keycloak end-session — kills the SSO session so clicking SSO again shows the login form
      const keycloakLogoutUrl =
        "http://localhost:9090/realms/recruitment-system/protocol/openid-connect/logout" +
        "?post_logout_redirect_uri=" + encodeURIComponent("http://localhost:3000/login?logged_out=1") +
        "&client_id=recruitment-app";
      window.location.href = keycloakLogoutUrl;
    } else {
      router.push("/login");
    }
  };
  const isActive = (href) => pathname === href;
  const isParentActive = (children) =>
    children?.some((c) => pathname === c.href);

  const menu = user ? getMenu(user.role) : [];
  const roleBadge = user ? getRoleBadgeColor(user.role) : "#2980b9";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Header - Full Width at Top */}
      <header
        style={{
          background: "#d3d5d7ff",
          height: "65px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 100,
          borderBottom: "2px solid #9ca3af",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* INSA Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
              }}
            >
              <Image
                src="/logo.png"
                alt="INSA-ERP Logo"
                width={50}
                height={50}
                style={{ borderRadius: "4px" }}
              />
            </div>
            <div>
              <span
                style={{
                  color: "#1f2937",
                  fontWeight: "700",
                  fontSize: "16px",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                INSA-ERP
              </span>
              {user && (
                <span
                  style={{
                    fontSize: "10px",
                    background: roleBadge,
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  {(user.role || "").replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#4b5563",
              fontSize: "20px",
              padding: "6px",
              lineHeight: 1,
            }}
          >
            ☰
          </button>

          <span style={{ color: "#9ca3af", fontSize: "20px", margin: "0 8px" }}>
            |
          </span>
          <span style={{ color: "#6b7280", fontSize: "14px" }}>
            {pathname === "/dashboard"
              ? "Dashboard"
              : pathname
                  .split("/")
                  .filter(Boolean)
                  .pop()
                  ?.replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Notification Bell */}
          {user && isAdminRole(user.role) && (
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => { setNotifOpen(v => !v); fetchNotifCounts(user); }}
                style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: "4px", display: "flex", alignItems: "center" }}
                title="Notifications"
              >
                <span style={{ fontSize: "22px" }}>🔔</span>
                {(pendingApproval + pendingPost) > 0 && (
                  <span style={{
                    position: "absolute", top: "0", right: "0",
                    background: "#e74c3c", color: "white",
                    borderRadius: "50%", width: "17px", height: "17px",
                    fontSize: "10px", fontWeight: "700",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1,
                  }}>
                    {pendingApproval + pendingPost}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "white", borderRadius: "10px", width: "300px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb",
                  zIndex: 200, overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: "700", fontSize: "13px", color: "#1f2937" }}>
                    Notifications
                  </div>

                  {pendingApproval === 0 && pendingPost === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                      No pending actions
                    </div>
                  ) : (
                    <div>
                      {pendingApproval > 0 && (
                        <Link href="/dashboard/recruitment/approval"
                          onClick={() => { setNotifOpen(false); setPendingApproval(0); }}
                          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", textDecoration: "none", borderBottom: "1px solid #f9fafb" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}
                        >
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                            📋
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
                              Recruitment Approval
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
                              {pendingApproval} request{pendingApproval !== 1 ? "s" : ""} awaiting approval
                            </p>
                          </div>
                          <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: "12px", padding: "2px 8px", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
                            {pendingApproval}
                          </span>
                        </Link>
                      )}

                      {pendingPost > 0 && (
                        <Link href={user?.role === "ADMIN" ? "/dashboard/recruitment/request" : "/dashboard/recruitment/post"}
                          onClick={() => { setNotifOpen(false); setPendingPost(0); }}
                          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", textDecoration: "none" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                          onMouseLeave={e => e.currentTarget.style.background = "white"}
                        >
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                            📢
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
                              {user?.role === "ADMIN" ? "Your Request Approved" : "Recruitment Post"}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
                              {pendingPost} of your recruitment{pendingPost !== 1 ? "s" : ""} {user?.role === "ADMIN" ? "ha" + (pendingPost !== 1 ? "ve" : "s") + " been approved" : "ready to post"}
                            </p>
                          </div>
                          <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: "12px", padding: "2px 8px", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
                            {pendingPost}
                          </span>
                        </Link>
                      )}
                    </div>
                  )}

                  <div style={{ padding: "8px 16px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
                    <button onClick={() => { fetchNotifCounts(user); }}
                      style={{ background: "none", border: "none", color: "#2980b9", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      Refresh
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: roleBadge,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "13px",
                  flexShrink: 0,
                }}
              >
                {(user.fullName || user.email || "U")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    color: "#2c3e50",
                    fontSize: "12px",
                    fontWeight: "600",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.fullName || user.email}
                </p>
                <p
                  style={{
                    color: "#7f8c8d",
                    fontSize: "11px",
                    margin: 0,
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "6px 16px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content Area - Sidebar + Main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside
          style={{
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
          }}
        >
          {/* Nav */}
          <nav style={{ flex: 1, overflowY: "auto", paddingTop: "6px" }}>
            {menu.map((item) => (
              <div key={item.id}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: sidebarOpen
                          ? "space-between"
                          : "center",
                        padding: sidebarOpen ? "10px 18px" : "10px 0",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        background: expandedMenus[item.id]
                          ? "rgba(41,128,185,0.3)"
                          : isParentActive(item.children)
                            ? "rgba(41,128,185,0.2)"
                            : "transparent",
                        color: expandedMenus[item.id]
                          ? "#5dade2"
                          : "rgba(255,255,255,0.82)",
                        fontSize: "13px",
                        borderLeft:
                          expandedMenus[item.id] ||
                          isParentActive(item.children)
                            ? "3px solid #3498db"
                            : "3px solid transparent",
                      }}
                      title={!sidebarOpen ? item.label : ""}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "9px",
                        }}
                      >
                        <span style={{ fontSize: "18px" }}>{item.icon}</span>
                        {sidebarOpen && (
                          <span
                            style={{ fontWeight: "500", whiteSpace: "nowrap" }}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                      {sidebarOpen && (
                        <span
                          style={{
                            fontSize: "9px",
                            transform: expandedMenus[item.id]
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                            transition: "transform 0.25s",
                            display: "inline-block",
                            color: expandedMenus[item.id]
                              ? "#5dade2"
                              : "rgba(255,255,255,0.4)",
                            flexShrink: 0,
                          }}
                        >
                          ▶
                        </span>
                      )}
                    </button>
                    <div
                      style={{
                        maxHeight: expandedMenus[item.id] ? "900px" : "0px",
                        overflow: "hidden",
                        transition: "max-height 0.35s ease",
                        background: "rgba(0,0,0,0.18)",
                      }}
                    >
                      {sidebarOpen &&
                        item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch={false}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 16px 8px 40px",
                              textDecoration: "none",
                              background: isActive(child.href)
                                ? "#2980b9"
                                : "transparent",
                              color: isActive(child.href)
                                ? "white"
                                : "rgba(255,255,255,0.65)",
                              fontSize: "12.5px",
                              borderLeft: isActive(child.href)
                                ? "3px solid #5dade2"
                                : "3px solid transparent",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive(child.href))
                                e.currentTarget.style.background =
                                  "rgba(255,255,255,0.06)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive(child.href))
                                e.currentTarget.style.background =
                                  "transparent";
                            }}
                          >
                            <span style={{ fontSize: "12px", opacity: 0.6 }}>
                              📄
                            </span>
                            {child.label}
                          </Link>
                        ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      gap: "9px",
                      padding: sidebarOpen ? "10px 18px" : "10px 0",
                      textDecoration: "none",
                      background: isActive(item.href)
                        ? "#2980b9"
                        : "transparent",
                      color: isActive(item.href)
                        ? "white"
                        : "rgba(255,255,255,0.82)",
                      fontSize: "13px",
                      fontWeight: "500",
                      borderLeft: isActive(item.href)
                        ? "3px solid #5dade2"
                        : "3px solid transparent",
                      whiteSpace: "nowrap",
                    }}
                    title={!sidebarOpen ? item.label : ""}
                    onMouseEnter={(e) => {
                      if (!isActive(item.href))
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.href))
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>{item.icon}</span>
                    {sidebarOpen && item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#ffffffff",
          }}
        >
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              position: "relative",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
