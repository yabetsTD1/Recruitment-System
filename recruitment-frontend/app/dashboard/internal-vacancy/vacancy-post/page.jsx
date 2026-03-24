"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

export default function VacancyPostPage() {
  const [recruitments, setRecruitments] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [recSearch, setRecSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearching(true);
      api.get(recSearch.trim() ? `/recruitments/vacancy-posts?search=${encodeURIComponent(recSearch)}` : "/recruitments/vacancy-posts")
        .then(r => setRecruitments(r.data))
        .catch(() => setRecruitments([]))
        .finally(() => setSearching(false));
    }, recSearch.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [recSearch]);

  const selectRec = (r) => {
    setSelectedRec(r);
    setPost(r);
    setRecSearch("");
    setDropOpen(false);
  };

  const statusColor = (s) => {
    if (s === "POSTED") return { bg: "#dcfce7", color: "#15803d" };
    if (s === "CLOSED") return { bg: "#fee2e2", color: "#b91c1c" };
    if (s === "APPROVED") return { bg: "#dbeafe", color: "#1d4ed8" };
    return { bg: "#f3f4f6", color: "#6b7280" };
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Vacancy Post</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>View details of a posted internal vacancy</p>
      </div>

      {/* Recruitment Selector */}
      <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px", border: "1px solid #ecf0f1", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Recruitment</label>
        <input value={recSearch} onChange={e => setRecSearch(e.target.value)}
          onFocus={() => setDropOpen(true)} onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          placeholder="Click or type to search recruitments..."
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box" }} />
        {dropOpen && (
          <div style={{ border: "1px solid #d1d5db", borderRadius: "6px", maxHeight: "200px", overflowY: "auto", background: "white" }}>
            {searching ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>Searching...</p>
              : recruitments.length === 0 ? <p style={{ padding: "12px", color: "#9ca3af", fontSize: "13px", margin: 0 }}>No results</p>
              : recruitments.map(r => (
                <div key={r.id} onMouseDown={() => selectRec(r)}
                  style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <span style={{ fontWeight: "600", color: "#2c3e50" }}>{r.jobTitle}</span>
                  <span style={{ color: "#9ca3af", marginLeft: "8px" }}>{r.batchCode}</span>
                  <span style={{ color: "#9ca3af", marginLeft: "8px", fontSize: "11px" }}>({r.status})</span>
                </div>
              ))}
          </div>
        )}
        {selectedRec && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "6px", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#0369a1" }}>{selectedRec.jobTitle}</span>
            <span style={{ fontSize: "12px", color: "#7f8c8d" }}>{selectedRec.batchCode}</span>
            <button onMouseDown={() => { setSelectedRec(null); setPost(null); }}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}
      </div>

      {!selectedRec ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>Select a recruitment above to view its vacancy post.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d" }}>Loading...</div>
      ) : !post ? (
        <div style={{ background: "white", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#7f8c8d", border: "1px solid #ecf0f1" }}>
          <p style={{ fontSize: "15px", margin: 0 }}>No vacancy post found for this recruitment.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
            {[
              { label: "Vacancies", value: post.vacancyNumber, color: "#2980b9" },
              { label: "Applicants", value: post.applicantCount, color: "#27ae60" },
              { label: "Days Left", value: post.closingDate ? Math.max(0, Math.ceil((new Date(post.closingDate) - new Date()) / 86400000)) : "—", color: "#e67e22" },
            ].map((s, i) => (
              <div key={i} style={{ background: s.color, borderRadius: "6px", padding: "16px 18px", color: "white" }}>
                <p style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 2px 0" }}>{s.value}</p>
                <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Post Detail Card */}
          <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #ecf0f1", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #ecf0f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>{post.jobTitle}</h2>
                <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>{post.department || "—"}</p>
              </div>
              <span style={{ padding: "4px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: statusColor(post.status).bg, color: statusColor(post.status).color }}>
                {post.status}
              </span>
            </div>
            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {[
                { label: "Batch Code", value: post.batchCode },
                { label: "Job Location", value: post.jobLocation || "—" },
                { label: "Salary", value: post.salary || "—" },
                { label: "Post Date", value: post.postDate || "—" },
                { label: "Closing Date", value: post.closingDate || "—" },
                { label: "Applicants", value: post.applicantCount },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ fontSize: "11px", fontWeight: "700", color: "#7f8c8d", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px 0" }}>{f.label}</p>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
