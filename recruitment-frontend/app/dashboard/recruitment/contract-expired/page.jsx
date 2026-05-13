"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

const STATUS_COLORS = {
  ACTIVE:   { bg: "#e8f5e9", color: "#27ae60", label: "Active" },
  INACTIVE: { bg: "#fce4ec", color: "#c0392b", label: "Inactive" },
};

const APP_STATUS_COLORS = {
  SUBMITTED:    { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" },
  SHORTLISTED:  { bg: "#d1fae5", color: "#065f46", label: "Shortlisted" },
  HIRED:        { bg: "#ede9fe", color: "#5b21b6", label: "Hired" },
  REJECTED:     { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  UNDER_REVIEW: { bg: "#fef3c7", color: "#92400e", label: "Under Review" },
};

function getRowStyle(item) {
  if (!item.contractEndDate) return {};
  if (item.expired) return { background: "#fff5f5", borderLeft: "3px solid #e74c3c" };
  if (item.daysUntilExpiry <= 7) return { background: "#fff8e1", borderLeft: "3px solid #e67e22" };
  return { background: "#f0fff4", borderLeft: "3px solid #27ae60" };
}

function getBadgeStyle(item) {
  if (!item.contractEndDate) return { background: "#f3f4f6", color: "#6b7280", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
  if (item.expired) return { background: "#fdecea", color: "#c0392b", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
  if (item.daysUntilExpiry <= 7) return { background: "#fff3cd", color: "#e67e22", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
  return { background: "#e8f5e9", color: "#27ae60", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
}

function getBadgeLabel(item) {
  if (!item.contractEndDate) return "No end date";
  if (item.expired) return `Expired ${Math.abs(item.daysUntilExpiry)}d ago`;
  if (item.daysUntilExpiry === 0) return "Expires today";
  return `${item.daysUntilExpiry}d left`;
}

export default function ContractExpiredPage() {
  const [employees, setEmployees] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("employees"); // employees | applicants
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, appRes] = await Promise.all([
        api.get("/admin/employees/contract-expiring"),
        api.get("/admin/applicants/contract"),
      ]);
      setEmployees(empRes.data);
      setApplicants(appRes.data);
    } catch {
      setMsg({ type: "error", text: "Failed to load data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (emp, newStatus) => {
    setActionLoading(emp.id);
    try {
      await api.put(`/admin/employees/${emp.id}/status`, { status: newStatus });
      setMsg({ type: "success", text: `${emp.fullName} marked as ${newStatus}.` });
      fetchData();
    } catch {
      setMsg({ type: "error", text: "Failed to update status." });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEmployees = employees.filter(e => {
    const matchFilter =
      filter === "all" ||
      (filter === "expired" && e.expired) ||
      (filter === "expiring" && !e.expired);
    const matchSearch =
      !search ||
      e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()) ||
      e.position?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filteredApplicants = applicants.filter(a => {
    const matchSearch =
      !search ||
      a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
      a.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      a.department?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const expiredCount = employees.filter(e => e.expired).length;
  const expiringCount = employees.filter(e => !e.expired).length;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif", color: "#2c3e50" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Contract Management</h2>
      <p style={{ margin: "0 0 24px", color: "#7f8c8d", fontSize: 14 }}>
        All contract employees and applicants for contract positions
      </p>

      {msg && (
        <div style={{
          padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14,
          background: msg.type === "error" ? "#fdecea" : "#e8f5e9",
          color: msg.type === "error" ? "#c0392b" : "#27ae60",
          border: `1px solid ${msg.type === "error" ? "#f5c6cb" : "#c3e6cb"}`
        }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Contract Employees", value: employees.length, bg: "#eaf0fb", color: "#2980b9", icon: "👥" },
          { label: "Expired",            value: expiredCount,     bg: "#fdecea", color: "#c0392b", icon: "🔴" },
          { label: "Active Contracts",   value: expiringCount,    bg: "#fff8e1", color: "#e67e22", icon: "🟡" },
          { label: "Contract Applicants", value: applicants.length, bg: "#ede9fe", color: "#5b21b6", icon: "📋" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 12, padding: "16px 24px",
            minWidth: 140, flex: 1, display: "flex", alignItems: "center", gap: 12
          }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#7f8c8d" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
        {[
          { key: "employees", label: `Contract Employees (${employees.length})` },
          { key: "applicants", label: `Contract Applicants (${applicants.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(""); setFilter("all"); }}
            style={{
              padding: "10px 24px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
              background: "none", borderBottom: activeTab === tab.key ? "2px solid #2980b9" : "2px solid transparent",
              color: activeTab === tab.key ? "#2980b9" : "#6b7280", marginBottom: "-2px"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {activeTab === "employees" && (
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "all", label: "All" },
              { key: "expired", label: "Expired" },
              { key: "expiring", label: "Expiring Soon" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: filter === f.key ? "#2980b9" : "#ecf0f1",
                  color: filter === f.key ? "#fff" : "#2c3e50",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={activeTab === "employees" ? "Search by name, ID, department..." : "Search by name, job title, batch code..."}
          style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, minWidth: 260, outline: "none" }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#7f8c8d" }}>Loading...</div>
      ) : activeTab === "employees" ? (
        /* ── EMPLOYEES TABLE ── */
        filteredEmployees.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "#7f8c8d" }}>
            {employees.length === 0 ? "No contract employees found." : "No results match your filter."}
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["Employee ID", "Name", "Department", "Position", "Contract End", "Status", "Expiry", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} style={{ ...getRowStyle(emp), borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#2980b9" }}>{emp.employeeId}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600 }}>{emp.fullName}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>{emp.department || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>{emp.position || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>
                      {emp.contractEndDate ? new Date(emp.contractEndDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ ...STATUS_COLORS[emp.status], padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {STATUS_COLORS[emp.status]?.label || emp.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={getBadgeStyle(emp)}>{getBadgeLabel(emp)}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {emp.status === "ACTIVE" ? (
                        <button disabled={actionLoading === emp.id} onClick={() => handleStatusChange(emp, "INACTIVE")}
                          style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "#e74c3c", color: "#fff", fontSize: 12, fontWeight: 600, opacity: actionLoading === emp.id ? 0.6 : 1 }}>
                          {actionLoading === emp.id ? "..." : "Deactivate"}
                        </button>
                      ) : (
                        <button disabled={actionLoading === emp.id} onClick={() => handleStatusChange(emp, "ACTIVE")}
                          style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "#27ae60", color: "#fff", fontSize: 12, fontWeight: 600, opacity: actionLoading === emp.id ? 0.6 : 1 }}>
                          {actionLoading === emp.id ? "..." : "Reactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ── CONTRACT APPLICANTS TABLE ── */
        filteredApplicants.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "#7f8c8d" }}>
            {applicants.length === 0 ? "No applicants for contract positions found." : "No results match your search."}
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["Name", "Email", "Job Title", "Batch Code", "Department", "Contract Start", "Contract End", "Expiry", "App. Status"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map(a => {
                  const appStatus = APP_STATUS_COLORS[a.applicationStatus] || { bg: "#f3f4f6", color: "#374151", label: a.applicationStatus };
                  return (
                    <tr key={a.id} style={{ ...getRowStyle(a), borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600 }}>{a.fullName || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>{a.email || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#2980b9" }}>{a.jobTitle}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>{a.batchCode || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>{a.department || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>
                        {a.contractStartDate ? new Date(a.contractStartDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>
                        {a.contractEndDate ? new Date(a.contractEndDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={getBadgeStyle(a)}>{getBadgeLabel(a)}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ ...appStatus, padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          {appStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
