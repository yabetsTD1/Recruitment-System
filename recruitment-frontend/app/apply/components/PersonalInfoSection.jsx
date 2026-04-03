import { useState } from "react";

export default function PersonalInfoSection({
  form,
  set,
  expandedSections,
  toggleSection,
  goToNextStep,
  inputStyle,
  labelStyle,
  job,
}) {
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  const handleUpdate = async () => {
    const email = typeof window !== "undefined" ? localStorage.getItem("externalEmail") : null;
    if (!email) { setUpdateMsg("error:Not logged in."); return; }
    setUpdating(true);
    setUpdateMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/applicant/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          phoneNumber1: form.phoneNumber1,
          phoneNumber2: form.phoneNumber2,
          residentialAddress: form.residentialAddress,
          gender: form.gender,
          title: form.title,
          maritalStatus: form.maritalStatus,
          dateOfBirth: form.dateOfBirth,
          githubUrl: form.githubUrl,
          linkedinUrl: form.linkedinUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setUpdateMsg("error:" + (data.message || "Update failed.")); return; }
      setUpdateMsg("success:Profile updated successfully.");
      setTimeout(() => setUpdateMsg(""), 4000);
    } catch { setUpdateMsg("error:Network error. Please try again."); }
    finally { setUpdating(false); }
  };

  return (
    <>
      {/* Batch Code Section */}
      <div style={{
        marginBottom: "32px",
        paddingBottom: "28px",
        borderBottom: "3px solid #f1f5f9",
        background: "linear-gradient(to right, #f8fafc, #ffffff)",
        padding: "24px",
        borderRadius: "12px",
        border: "2px solid #e2e8f0"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Batch Code:</label>
            <input style={inputStyle} value={job?.batchCode || ""} disabled />
          </div>
          <div>
            <label style={labelStyle}>Recruited Job Title:</label>
            <input style={inputStyle} value={job?.jobTitle || ""} disabled />
          </div>
        </div>
      </div>

      {/* Candidate Details Section */}
      <div style={{
        marginBottom: "32px",
        background: "#ffffff",
        borderRadius: "12px",
        overflow: "hidden"
      }}>
        <div
          onClick={() => toggleSection('candidateDetails')}
          className="section-header"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            padding: "16px 24px",
            borderRadius: "12px",
            marginBottom: expandedSections.candidateDetails ? "24px" : "0",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)"
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", letterSpacing: "-0.01em" }}>
              Candidate Details
            </h3>
          </div>
          <span style={{
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
            transform: expandedSections.candidateDetails ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            display: "inline-block"
          }}>
            ›
          </span>
        </div>

        {expandedSections.candidateDetails && (
          <div className="animate-in" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px 32px",
            padding: "28px",
            background: "#fafbfc"
          }}>
            {/* Full Name Row */}
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>First Name: <span style={{ color: "#e74c3c" }}>*</span></label>
                <input style={inputStyle} placeholder="ABEBE" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Middle Name:</label>
                <input style={inputStyle} placeholder="KEBEDE" value={form.middleName} onChange={e => set("middleName", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Last Name: <span style={{ color: "#e74c3c" }}>*</span></label>
                <input style={inputStyle} placeholder="LEMMA" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Gender: <span style={{ color: "#e74c3c" }}>*</span></label>
              <select style={inputStyle} value={form.gender} onChange={e => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Title:</label>
              <select style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)}>
                <option value="">Select</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Marital Status:</label>
              <select style={inputStyle} value={form.maritalStatus} onChange={e => set("maritalStatus", e.target.value)}>
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Date of Birth:</label>
              <input type="date" style={inputStyle} placeholder="13/04/1990" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Phone Number 1: <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} type="tel" placeholder="091-234-5678" value={form.phoneNumber1} onChange={e => set("phoneNumber1", e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Residential Address:</label>
              <input style={inputStyle} placeholder="Addis Ababa" value={form.residentialAddress} onChange={e => set("residentialAddress", e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Phone Number 2:</label>
              <input style={inputStyle} type="tel" placeholder="091-345-6789" value={form.phoneNumber2} onChange={e => set("phoneNumber2", e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Email: <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} type="email" placeholder="abebe.kebede@gmail.com" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>

            <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #f0f3f4", paddingTop: "20px", marginTop: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
                <div>
                  <label style={labelStyle}>GitHub Profile <span style={{ color: "#95a5a6", fontWeight: "400" }}>(optional)</span></label>
                  <input style={inputStyle} placeholder="https://github.com/username" value={form.githubUrl} onChange={e => set("githubUrl", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>LinkedIn Profile <span style={{ color: "#95a5a6", fontWeight: "400" }}>(optional)</span></label>
                  <input style={inputStyle} placeholder="https://linkedin.com/in/username" value={form.linkedinUrl} onChange={e => set("linkedinUrl", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Update + Next Buttons */}
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                {updateMsg && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
                    background: updateMsg.startsWith("success:") ? "#d1fae5" : "#fee2e2",
                    color: updateMsg.startsWith("success:") ? "#065f46" : "#991b1b",
                    border: `1px solid ${updateMsg.startsWith("success:") ? "#a7f3d0" : "#fca5a5"}`,
                  }}>
                    {updateMsg.startsWith("success:") ? "✓ " : "⚠ "}{updateMsg.split(":").slice(1).join(":")}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                style={{
                  padding: "12px 28px",
                  background: updating ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: updating ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                {updating ? "Updating..." : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Update Profile
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                style={{
                  padding: "12px 32px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                Next Section
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
