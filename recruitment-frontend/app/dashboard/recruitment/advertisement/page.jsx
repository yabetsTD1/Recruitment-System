"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusStyles = {
  POSTED: { background: "#d1fae5", color: "#065f46" },
  CLOSED: { background: "#fee2e2", color: "#b91c1c" },
  APPROVED: { background: "#dbeafe", color: "#1d4ed8" },
  DRAFT: { background: "#f3f4f6", color: "#374151" },
};

export default function AdvertisementPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    try {
      setLoading(true);
      // Advertisements = posted/approved recruitments
      const res = await api.get("/recruitments");
      setData(res.data.filter(r => r.status === "POSTED" || r.status === "APPROVED" || r.status === "CLOSED"));
      setError(null);
    } catch (e) {
      setError("Failed to load advertisements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Maintain Advertisement</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>View and manage published job advertisements</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Ads", value: data.length, color: "#2980b9" },
          { label: "Active (Posted)", value: data.filter(d => d.status === "POSTED").length, color: "#27ae60" },
          { label: "Closed", value: data.filter(d => d.status === "CLOSED").length, color: "#e74c3c" },
        ].map((s, i) => (
          <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
            <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
            <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              {["#", "Job Title", "Department", "Vacancies", "Referral Code", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#e74c3c" }}>{error}</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>No advertisements yet. Post a recruitment first.</td></tr>
            ) : data.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                <td style={{ padding: "13px 18px", fontWeight: "600", color: "#2980b9", fontSize: "13px" }}>#{row.id}</td>
                <td style={{ padding: "13px 18px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{row.jobTitle}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.department}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.vacancyNumber}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.referralCode || "—"}</td>
                <td style={{ padding: "13px 18px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", ...statusStyles[row.status] }}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
