"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DocumentsSection({
  expandedSections,
  toggleSection,
  goToPreviousStep,
  inputStyle,
  labelStyle,
}) {
  const [savedDocs, setSavedDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const email = typeof window !== "undefined" ? localStorage.getItem("externalEmail") : null;

  useEffect(() => {
    if (email) fetchDocs();
  }, [email]);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API}/public/applicant/document?email=${encodeURIComponent(email)}`);
      if (res.ok) setSavedDocs(await res.json());
    } catch {}
  };

  const handleFileUpload = async (e) => {
    if (!email) { setMsg("error:Not logged in."); return; }
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    setMsg("");
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("email", email);
        fd.append("file", file);
        const res = await fetch(`${API}/public/applicant/document`, { method: "POST", body: fd });
        if (!res.ok) { const d = await res.json(); setMsg("error:" + (d.message || "Upload failed.")); }
      }
      await fetchDocs();
      setMsg("success:Document(s) uploaded successfully.");
      setTimeout(() => setMsg(""), 4000);
    } catch { setMsg("error:Network error."); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this document?")) return;
    try {
      await fetch(`${API}/public/applicant/document/${id}`, { method: "DELETE" });
      setSavedDocs(prev => prev.filter(d => d.id !== id));
    } catch { setMsg("error:Failed to delete."); }
  };

  const handleDownload = (id, fileName) => {
    const a = document.createElement("a");
    a.href = `${API}/public/applicant/document/${id}/download`;
    a.download = fileName || "document";
    a.click();
  };

  return (
    <div style={{ marginBottom: "32px", background: "#ffffff", borderRadius: "12px", overflow: "hidden" }}>
      {/* Section Header */}
      <div onClick={() => toggleSection("documents")} className="section-header"
        style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", padding: "16px 24px", borderRadius: "12px",
          marginBottom: expandedSections.documents ? "24px" : "0", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 2px 8px rgba(20, 184, 166, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white" }}>
            Document Upload {savedDocs.length > 0 && <span style={{ fontSize: "13px", opacity: 0.85 }}>({savedDocs.length} saved)</span>}
          </h4>
        </div>
        <span style={{ color: "white", fontSize: "24px", fontWeight: "bold",
          transform: expandedSections.documents ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease", display: "inline-block" }}>›</span>
      </div>

      {expandedSections.documents && (
        <div className="animate-in">
          {/* Upload area */}
          <div style={{ marginBottom: "20px", background: "linear-gradient(to right, #f0fdfa, #ffffff)",
            padding: "24px", borderRadius: "12px", border: "2px dashed #14b8a6" }}>
            <label style={{ ...labelStyle, fontSize: "14px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                Upload CV / Documents (PDF)
              </div>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
              <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleFileUpload}
                style={{ display: "none" }} id="fileUpload" disabled={uploading} />
              <label htmlFor="fileUpload"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px",
                  background: uploading ? "#94a3b8" : "linear-gradient(135deg, #14b8a6, #0d9488)",
                  color: "white", borderRadius: "10px", cursor: uploading ? "not-allowed" : "pointer",
                  fontSize: "14px", fontWeight: "600", boxShadow: "0 2px 8px rgba(20,184,166,0.3)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {uploading ? "Uploading..." : "Choose Files"}
              </label>
              <span style={{ fontSize: "13px", color: "#64748b" }}>PDF, DOC, DOCX accepted</span>
            </div>
            {msg && (
              <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
                background: msg.startsWith("success:") ? "#d1fae5" : "#fee2e2",
                color: msg.startsWith("success:") ? "#065f46" : "#991b1b",
                border: `1px solid ${msg.startsWith("success:") ? "#a7f3d0" : "#fca5a5"}` }}>
                {msg.startsWith("success:") ? "✓ " : "⚠ "}{msg.split(":").slice(1).join(":")}
              </div>
            )}
          </div>

          {/* Saved documents table */}
          {savedDocs.length > 0 && (
            <div style={{ background: "white", borderRadius: "12px", overflow: "hidden",
              border: "2px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: "24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                  <tr>
                    {["No", "File Name", "Type", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "white" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {savedDocs.map((doc, idx) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid #e2e8f0" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                            <polyline points="13 2 13 9 20 9"/>
                          </svg>
                          {doc.fileName}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#fef3c7", padding: "3px 10px", borderRadius: "6px",
                          fontSize: "11px", fontWeight: "600", color: "#92400e" }}>
                          {doc.fileType || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button type="button" onClick={() => handleDownload(doc.id, doc.fileName)}
                            style={{ padding: "6px 14px", background: "#dbeafe", color: "#1d4ed8",
                              border: "1px solid #93c5fd", borderRadius: "8px", cursor: "pointer",
                              fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download
                          </button>
                          <button type="button" onClick={() => handleDelete(doc.id)}
                            style={{ padding: "6px 14px", background: "#fee2e2", color: "#991b1b",
                              border: "1px solid #fca5a5", borderRadius: "8px", cursor: "pointer",
                              fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {savedDocs.length === 0 && !uploading && (
            <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>
              No documents uploaded yet.
            </p>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "28px" }}>
            <button type="button" onClick={goToPreviousStep}
              style={{ padding: "12px 32px", background: "linear-gradient(135deg, #64748b, #475569)",
                color: "white", border: "none", borderRadius: "10px", cursor: "pointer",
                fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
