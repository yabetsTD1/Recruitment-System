"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusStyles = {
  EXPIRED: { background: "#fee2e2", color: "#b91c1c" },
  EXPIRING: { background: "#fef3c7", color: "#92400e" },
};

export default function ContractExpiredPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/employees/contract-expiring");
      setEmployees(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const expired = employees.filter((e) => e.expired);
  const expiring = employees.filter((e) => !e.expired);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#2c3e50",
            margin: 0,
          }}
        >
          Contract Expired Employees
        </h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>
          Manage employees with expiring or expired contracts
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Total", value: employees.length, color: "#2980b9" },
          { label: "Expired", value: expired.length, color: "#e74c3c" },
          { label: "Expiring Soon", value: expiring.length, color: "#f39c12" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: s.color,
              borderRadius: "6px",
              padding: "14px 16px",
              color: "white",
            }}
          >
            <p
              style={{
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 2px 0",
              }}
            >
              {s.value}
            </p>
            <p style={{ fontSize: "12px", margin: 0, opacity: 0.9 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #ecf0f1",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              {[
                "Employee ID",
                "Full Name",
                "Email",
                "Phone",
                "Department",
                "Position",
                "Contract End Date",
                "Status",
                "Days Until Expiry",
                "",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "11px 14px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#5d6d7e",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "#7f8c8d",
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: "#7f8c8d",
                  }}
                >
                  No contract expiring employees found.
                </td>
              </tr>
            ) : (
              employees.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontWeight: "700",
                      color: "#2980b9",
                      fontSize: "12px",
                    }}
                  >
                    {row.employeeId}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontWeight: "600",
                      color: "#2c3e50",
                      fontSize: "13px",
                    }}
                  >
                    {row.fullName}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "#7f8c8d",
                      fontSize: "12px",
                    }}
                  >
                    {row.email || "—"}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "#7f8c8d",
                      fontSize: "12px",
                    }}
                  >
                    {row.phone || "—"}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "#7f8c8d",
                      fontSize: "12px",
                    }}
                  >
                    {row.department || "—"}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "#7f8c8d",
                      fontSize: "12px",
                    }}
                  >
                    {row.position || "—"}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "#7f8c8d",
                      fontSize: "12px",
                    }}
                  >
                    {row.contractEndDate}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        ...statusStyles[row.expired ? "EXPIRED" : "EXPIRING"],
                      }}
                    >
                      {row.expired ? "Expired" : "Expiring"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "#7f8c8d",
                      fontSize: "12px",
                    }}
                  >
                    {row.daysUntilExpiry < 0
                      ? `${Math.abs(row.daysUntilExpiry)} days ago`
                      : `${row.daysUntilExpiry} days`}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <button
                      style={{
                        padding: "5px 12px",
                        background: "#27ae60",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "12px",
                      }}
                    >
                      Handle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
