"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusConfig = {
  SUBMITTED: { label: "Submitted", bg: "#dbeafe", color: "#1d4ed8" },
  UNDER_REVIEW: { label: "Under Review", bg: "#fef3c7", color: "#92400e" },
  SHORTLISTED: { label: "Shortlisted", bg: "#dcfce7", color: "#15803d" },
  REJECTED: { label: "Rejected", bg: "#fee2e2", color: "#b91c1c" },
  HIRED: { label: "Hired", bg: "#d1fae5", color: "#065f46" },
};

export default function MyApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recruitments/my-applications")
      .then(r => setApps(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const underReview = apps.filter(a => a.status === "UNDER_REVIEW").length;
  const shortlisted = apps.filter(a => a.status === "SHORTLISTED").length;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>My Applications</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Track your internal vacancy applications</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Applied", value: apps.length, color: "#2980b9" },
          { label: "Under Review", value: underReview, color: "#e67e22" },
          { label: "Shortlisted", value: shortlisted, color: "#27ae60" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ background: "#2980b9", padding: "12px 18px" }}>
          <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>📄 Application History</span>
        </div>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d", fontSize: "13px" }}>Loading...</div>
        ) : apps.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#7f8c8d" }}>
            <p style={{ fontSize: "32px", margin: "0 0 8px 0" }}>📭</p>
            <p style={{ fontSize: "14px", margin: 0 }}>You haven't applied to any vacancies yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0f3f4" }}>
                  {["Post Code", "Job Title", "Department", "Applied On", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#5d6d7e", borderBottom: "1px solid #dce1e7", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => {
                  const sc = statusConfig[app.status] || statusConfig.SUBMITTED;
                  return (
                    <tr key={app.id} style={{ borderBottom: "1px solid #f0f3f4" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <td style={{ padding: "10px 16px", fontSize: "13px", color: "#2980b9", fontWeight: "600" }}>{app.batchCode || "—"}</td>
                      <td style={{ padding: "10px 16px", fontSize: "13px", color: "#2c3e50", fontWeight: "500" }}>{app.jobTitle}</td>
                      <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{app.department || "—"}</td>
                      <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{app.appliedAt}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>{sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
