"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

const STATUS_COLORS = {
  ACTIVE: { bg: "#e8f5e9", color: "#27ae60", label: "Active" },
  INACTIVE: { bg: "#fce4ec", color: "#c0392b", label: "Inactive" },
};

function getRowStyle(emp) {
  if (!emp.contractEndDate) return {};
  if (emp.expired) return { background: "#fff5f5", borderLeft: "3px solid #e74c3c" };
  if (emp.daysUntilExpiry <= 7) return { background: "#fff8e1", borderLeft: "3px solid #e67e22" };
  return { background: "#f0fff4", borderLeft: "3px solid #27ae60" };
}

function getBadgeStyle(emp) {
  if (emp.expired) return { background: "#fdecea", color: "#c0392b", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
  if (emp.daysUntilExpiry <= 7) return { background: "#fff3cd", color: "#e67e22", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
  return { background: "#e8f5e9", color: "#27ae60", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 };
}

function getBadgeLabel(emp) {
  if (emp.expired) return `Expired ${Math.abs(emp.daysUntilExpiry)}d ago`;
  if (emp.daysUntilExpiry === 0) return "Expires today";
  return `${emp.daysUntilExpiry}d left`;
}

export default function ContractExpiredPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | expired | expiring
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/employees/contract-expiring");
      setEmployees(res.data);
    } catch {
      setMsg({ type: "error", text: "Failed to load employees." });
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

  const filtered = employees.filter(e => {
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

  const expiredCount = employees.filter(e => e.expired).length;
  const expiringCount = employees.filter(e => !e.expired).length;

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif", color: "#2c3e50" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Contract Expiry Monitor</h2>
      <p style={{ margin: "0 0 24px", color: "#7f8c8d", fontSize: 14 }}>
        Employees with contracts expired or expiring within 30 days
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
          { label: "Total Flagged", value: employees.length, bg: "#eaf0fb", color: "#2980b9", icon: "📋" },
          { label: "Expired", value: expiredCount, bg: "#fdecea", color: "#c0392b", icon: "🔴" },
          { label: "Expiring Soon", value: expiringCount, bg: "#fff8e1", color: "#e67e22", icon: "🟡" },
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

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "all", label: "All" },
            { key: "expired", label: "Expired" },
            { key: "expiring", label: "Expiring Soon" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: filter === f.key ? "#2980b9" : "#ecf0f1",
                color: filter === f.key ? "#fff" : "#2c3e50",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, ID, department..."
          style={{
            padding: "7px 14px", borderRadius: 8, border: "1px solid #ddd",
            fontSize: 13, minWidth: 240, outline: "none"
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#7f8c8d" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#7f8c8d" }}>
          {employees.length === 0 ? "No employees with expiring contracts found." : "No results match your filter."}
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                {["Employee ID", "Name", "Department", "Position", "Contract End", "Status", "Expiry", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #eee" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id} style={{ ...getRowStyle(emp), borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#2980b9" }}>{emp.employeeId}</td>
                  <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600 }}>{emp.fullName}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>{emp.department || "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#555" }}>{emp.position || "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>
                    {emp.contractEndDate ? new Date(emp.contractEndDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      ...STATUS_COLORS[emp.status],
                      padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600
                    }}>
                      {STATUS_COLORS[emp.status]?.label || emp.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={getBadgeStyle(emp)}>{getBadgeLabel(emp)}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {emp.status === "ACTIVE" ? (
                      <button
                        disabled={actionLoading === emp.id}
                        onClick={() => handleStatusChange(emp, "INACTIVE")}
                        style={{
                          padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                          background: "#e74c3c", color: "#fff", fontSize: 12, fontWeight: 600,
                          opacity: actionLoading === emp.id ? 0.6 : 1
                        }}
                      >
                        {actionLoading === emp.id ? "..." : "Deactivate"}
                      </button>
                    ) : (
                      <button
                        disabled={actionLoading === emp.id}
                        onClick={() => handleStatusChange(emp, "ACTIVE")}
                        style={{
                          padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                          background: "#27ae60", color: "#fff", fontSize: 12, fontWeight: 600,
                          opacity: actionLoading === emp.id ? 0.6 : 1
                        }}
                      >
                        {actionLoading === emp.id ? "..." : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
