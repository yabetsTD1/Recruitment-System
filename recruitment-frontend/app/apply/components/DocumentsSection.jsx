export default function DocumentsSection({
  documents,
  setDocuments,
  handleFileUpload,
  removeDocument,
  expandedSections,
  toggleSection,
  goToPreviousStep,
  submitting,
  inputStyle,
  labelStyle,
}) {
  return (
    <div style={{
      marginBottom: "32px",
      paddingTop: "8px",
      background: "#ffffff",
      borderRadius: "12px",
      overflow: "hidden"
    }}>
      {/* Section Header */}
      <div
        onClick={() => toggleSection('documents')}
        className="section-header"
        style={{
          background: "linear-gradient(135deg, #14b8a6, #0d9488)",
          padding: "16px 24px",
          borderRadius: "12px",
          marginBottom: expandedSections.documents ? "24px" : "0",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(20, 184, 166, 0.2)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", letterSpacing: "-0.01em" }}>
            Document Upload
          </h4>
        </div>
        <span style={{
          color: "white",
          fontSize: "24px",
          fontWeight: "bold",
          transform: expandedSections.documents ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease",
          display: "inline-block"
        }}>
          ›
        </span>
      </div>

      {expandedSections.documents && (
        <div className="animate-in">
          <div style={{
            marginBottom: "24px",
            background: "linear-gradient(to right, #f0fdfa, #ffffff)",
            padding: "24px",
            borderRadius: "12px",
            border: "2px dashed #14b8a6"
          }}>
            <label style={{ ...labelStyle, fontSize: "14px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                Upload your CV Document (PDF format)
              </div>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="fileUpload"
              />
              <label
                htmlFor="fileUpload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                  color: "white",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(20, 184, 166, 0.3)"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Choose Files
              </label>
              <span style={{
                fontSize: "14px",
                color: documents.length > 0 ? "#14b8a6" : "#64748b",
                fontWeight: documents.length > 0 ? "600" : "400"
              }}>
                {documents.length > 0 ? `✓ ${documents.length} file(s) selected` : "No file selected"}
              </span>
            </div>
          </div>

          {/* Documents Table */}
          {documents.length > 0 && (
            <div style={{
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              border: "2px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              marginBottom: "24px"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "white", width: "60px" }}>No</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "white" }}>File Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "white", width: "150px" }}>File Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "white", width: "120px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0", transition: "background 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1e293b", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                          <polyline points="13 2 13 9 20 9"/>
                        </svg>
                        {doc.fileName}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>
                        <span style={{
                          background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#92400e"
                        }}>
                          {doc.fileType}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => removeDocument(idx)}
                          style={{
                            padding: "6px 14px",
                            background: "linear-gradient(135deg, #fee2e2, #fecaca)",
                            color: "#991b1b",
                            border: "2px solid #fca5a5",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginTop: "28px" }}>
            <button
              type="button"
              onClick={goToPreviousStep}
              style={{
                padding: "12px 32px",
                background: "linear-gradient(135deg, #64748b, #475569)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 8px rgba(100, 116, 139, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
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
