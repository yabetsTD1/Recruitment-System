"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

const statusStyles = {
  POSTED: { background: "#d1fae5", color: "#065f46" },
  CLOSED: { background: "#fee2e2", color: "#b91c1c" },
  APPROVED: { background: "#dbeafe", color: "#1d4ed8" },
  DRAFT: { background: "#f3f4f6", color: "#374151" },
};

const mediaTypeOptions = [
  "Facebook", "Twitter", "LinkedIn", "Instagram", 
  "Newspaper", "TV", "Radio", "Website", "Email", "Other"
];

export default function AdvertisementPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaForm, setMediaForm] = useState({ mediaType: "", mediaName: "", occurrence: 0 });
  const [editingMedia, setEditingMedia] = useState(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await api.get("/recruitments");
      setData(res.data.filter(r => r.status === "POSTED" || r.status === "APPROVED" || r.status === "CLOSED"));
      setError(null);
    } catch (e) {
      setError("Failed to load advertisements.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetch();
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/recruitments/advertisements/search?search=${encodeURIComponent(searchTerm)}`);
      // Group by recruitment
      const grouped = {};
      res.data.forEach(ad => {
        if (!grouped[ad.recruitmentId]) {
          grouped[ad.recruitmentId] = {
            id: ad.recruitmentId,
            jobTitle: ad.jobTitle,
            batchCode: ad.batchCode,
            department: ad.department,
            vacancyNumber: ad.vacancyNumber,
            status: ad.status
          };
        }
      });
      setData(Object.values(grouped));
      setError(null);
    } catch (e) {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadAdvertisements = async (recruitmentId) => {
    try {
      const res = await api.get(`/recruitments/${recruitmentId}/advertisements`);
      setAdvertisements(res.data);
    } catch (e) {
      alert("Failed to load media types.");
    }
  };

  const handleManageMedia = (recruitment) => {
    setSelectedRecruitment(recruitment);
    loadAdvertisements(recruitment.id);
  };

  const handleAddMedia = () => {
    setMediaForm({ mediaType: "", mediaName: "", occurrence: 0 });
    setEditingMedia(null);
    setShowMediaModal(true);
  };

  const handleEditMedia = (media) => {
    setMediaForm({ mediaType: media.mediaType, mediaName: media.mediaName, occurrence: media.occurrence });
    setEditingMedia(media);
    setShowMediaModal(true);
  };

  const handleSaveMedia = async () => {
    if (!mediaForm.mediaType || !mediaForm.mediaName) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      if (editingMedia) {
        await api.put(`/recruitments/advertisements/${editingMedia.id}`, mediaForm);
      } else {
        await api.post(`/recruitments/${selectedRecruitment.id}/advertisements`, mediaForm);
      }
      setShowMediaModal(false);
      loadAdvertisements(selectedRecruitment.id);
    } catch (e) {
      alert("Failed to save media type.");
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!confirm("Delete this media type?")) return;
    try {
      await api.delete(`/recruitments/advertisements/${mediaId}`);
      loadAdvertisements(selectedRecruitment.id);
    } catch (e) {
      alert("Failed to delete media type.");
    }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Maintain Advertisement</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>View and manage published job advertisements</p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search by batch code or job title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          style={{ 
            flex: 1, 
            padding: "10px 14px", 
            border: "1px solid #ddd", 
            borderRadius: "6px",
            fontSize: "14px"
          }}
        />
        <button 
          onClick={handleSearch}
          style={{ 
            padding: "10px 24px", 
            background: "#3498db", 
            color: "white", 
            border: "none", 
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Search
        </button>
        <button 
          onClick={fetch}
          style={{ 
            padding: "10px 24px", 
            background: "#95a5a6", 
            color: "white", 
            border: "none", 
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Reset
        </button>
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
              {["#", "Job Title", "Batch Code", "Department", "Vacancies", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#e74c3c" }}>{error}</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d" }}>No advertisements found.</td></tr>
            ) : data.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #f0f3f4" }}>
                <td style={{ padding: "13px 18px", fontWeight: "600", color: "#2980b9", fontSize: "13px" }}>#{row.id}</td>
                <td style={{ padding: "13px 18px", fontWeight: "600", color: "#2c3e50", fontSize: "13px" }}>{row.jobTitle}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.batchCode || "—"}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.department}</td>
                <td style={{ padding: "13px 18px", color: "#7f8c8d", fontSize: "13px" }}>{row.vacancyNumber}</td>
                <td style={{ padding: "13px 18px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", ...statusStyles[row.status] }}>{row.status}</span>
                </td>
                <td style={{ padding: "13px 18px" }}>
                  <button 
                    onClick={() => handleManageMedia(row)}
                    style={{ 
                      padding: "6px 12px", 
                      background: "#3498db", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  >
                    Manage Media
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Media Management Modal */}
      {selectedRecruitment && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{ 
            background: "white", 
            borderRadius: "8px", 
            padding: "24px", 
            width: "90%", 
            maxWidth: "800px",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#2c3e50" }}>
                  Advertisement Media Types
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#7f8c8d" }}>
                  {selectedRecruitment.jobTitle} - {selectedRecruitment.batchCode}
                </p>
              </div>
              <button 
                onClick={() => setSelectedRecruitment(null)}
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "24px", 
                  cursor: "pointer",
                  color: "#7f8c8d"
                }}
              >
                ×
              </button>
            </div>

            <button 
              onClick={handleAddMedia}
              style={{ 
                padding: "10px 20px", 
                background: "#27ae60", 
                color: "white", 
                border: "none", 
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                marginBottom: "16px"
              }}
            >
              + Add Media Type
            </button>

            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ecf0f1" }}>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  {["#", "Media Type", "Media Name", "Occurrence", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#5d6d7e", borderBottom: "2px solid #ecf0f1" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {advertisements.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#7f8c8d" }}>No media types added yet.</td></tr>
                ) : advertisements.map((ad, idx) => (
                  <tr key={ad.id} style={{ borderBottom: "1px solid #f0f3f4" }}>
                    <td style={{ padding: "10px", fontSize: "13px" }}>{idx + 1}</td>
                    <td style={{ padding: "10px", fontSize: "13px", fontWeight: "600" }}>{ad.mediaType}</td>
                    <td style={{ padding: "10px", fontSize: "13px" }}>{ad.mediaName}</td>
                    <td style={{ padding: "10px", fontSize: "13px" }}>{ad.occurrence}</td>
                    <td style={{ padding: "10px" }}>
                      <button 
                        onClick={() => handleEditMedia(ad)}
                        style={{ 
                          padding: "4px 10px", 
                          background: "#3498db", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          marginRight: "6px"
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteMedia(ad.id)}
                        style={{ 
                          padding: "4px 10px", 
                          background: "#e74c3c", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px"
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Media Modal */}
      {showMediaModal && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          zIndex: 1001
        }}>
          <div style={{ 
            background: "white", 
            borderRadius: "8px", 
            padding: "24px", 
            width: "90%", 
            maxWidth: "500px"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "700", color: "#2c3e50" }}>
              {editingMedia ? "Edit Media Type" : "Add Media Type"}
            </h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#5d6d7e" }}>
                Media Type *
              </label>
              <select
                value={mediaForm.mediaType}
                onChange={(e) => setMediaForm({ ...mediaForm, mediaType: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  border: "1px solid #ddd", 
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              >
                <option value="">--Select One--</option>
                {mediaTypeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#5d6d7e" }}>
                Media Name *
              </label>
              <input
                type="text"
                value={mediaForm.mediaName}
                onChange={(e) => setMediaForm({ ...mediaForm, mediaName: e.target.value })}
                placeholder="e.g., Facebook Page, Local Newspaper"
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  border: "1px solid #ddd", 
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#5d6d7e" }}>
                Occurrence
              </label>
              <input
                type="number"
                value={mediaForm.occurrence}
                onChange={(e) => setMediaForm({ ...mediaForm, occurrence: parseInt(e.target.value) || 0 })}
                min="0"
                style={{ 
                  width: "100%", 
                  padding: "10px", 
                  border: "1px solid #ddd", 
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowMediaModal(false)}
                style={{ 
                  padding: "10px 20px", 
                  background: "#95a5a6", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMedia}
                style={{ 
                  padding: "10px 20px", 
                  background: "#27ae60", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
