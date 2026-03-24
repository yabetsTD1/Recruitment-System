"use client";
import { useState } from "react";

export default function OrgProfilePage() {
  const [form, setForm] = useState({
    name: "INSA - Information Network Security Agency",
    shortName: "INSA",
    address: "Addis Ababa, Ethiopia",
    phone: "+251 11 XXX XXXX",
    email: "info@insa.gov.et",
    website: "https://www.insa.gov.et",
    mission: "To ensure the security of the national information infrastructure.",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>Organization Profile</h1>
        <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Manage organization information</p>
      </div>

      <div style={{ background: "white", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", maxWidth: "640px" }}>
        <div style={{ background: "#2c3e50", padding: "12px 18px" }}>
          <span style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>🏛 Organization Details</span>
        </div>
        <form onSubmit={handleSave} style={{ padding: "24px" }}>
          {[
            { label: "Organization Name", name: "name", type: "text" },
            { label: "Short Name / Acronym", name: "shortName", type: "text" },
            { label: "Address", name: "address", type: "text" },
            { label: "Phone", name: "phone", type: "text" },
            { label: "Email", name: "email", type: "email" },
            { label: "Website", name: "website", type: "text" },
          ].map(f => (
            <div key={f.name} style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>{f.label}</label>
              <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Mission Statement</label>
            <textarea value={form.mission} onChange={e => setForm({ ...form, mission: e.target.value })} rows={3}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button type="submit"
              style={{ padding: "10px 24px", background: "#2c3e50", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
              Save Changes
            </button>
            {saved && <span style={{ color: "#27ae60", fontSize: "13px", fontWeight: "600" }}>✓ Saved successfully</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
