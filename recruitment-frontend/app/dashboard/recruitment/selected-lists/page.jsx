"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function SelectedCandidateListsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/recruitments/applications/hired").then(r => {
      setApplications(r.data);
      setLoading(false);
    }).catch(() => { setError("Failed to load hired candidates"); setLoading(false); });
  }, []);

  const filtered = applications.filter(a =>
    a.applicantName.toLowerCase().includes(search.toLowerCase()) ||
    a.applicantEmail.toLowerCase().includes(search.toLowerCase()) ||
    (a.jobTitle || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Selected Candidate Lists</h1>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>All hired candidates across all recruitments</p>
        </div>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Hired", value: applications.length, color: "#10b981" },
          { label: "Recruitments Covered", value: new Set(applications.map(a => a.recruitmentId)).size, color: "#3b82f6" },
        ].map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: "32px", fontWeight: "700", color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <input type="text" placeholder="Search by name, email or job title..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", maxWidth: "360px", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none" }} />
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>No hired candidates found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
              <tr>
                {["#", "Candidate Name", "Email", "Job Title", "Applied At", "Status"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} style={{ borderTop: "1px solid #f9fafb" }}>
                  <td style={{ padding: "14px 20px", color: "#9ca3af", fontWeight: "600" }}>{i + 1}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "14px", flexShrink: 0 }}>
                        {row.applicantName ? row.applicantName[0].toUpperCase() : "?"}
                      </div>
                      <span style={{ fontWeight: "600", color: "#1f2937" }}>{row.applicantName}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.applicantEmail}</td>
                  <td style={{ padding: "14px 20px", color: "#374151", fontWeight: "500" }}>{row.jobTitle}</td>
                  <td style={{ padding: "14px 20px", color: "#6b7280" }}>{row.appliedAt ? row.appliedAt.slice(0, 10) : "—"}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: "#d1fae5", color: "#065f46" }}>HIRED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
