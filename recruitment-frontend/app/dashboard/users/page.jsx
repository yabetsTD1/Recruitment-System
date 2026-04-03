"use client";
import { useState, useEffect, useContext } from "react";
import api from "@/services/api";
import { AuthContext } from "@/context/AuthContext";

const ROLES = ["ADMIN", "EMPLOYEE"];

const emptyForm = { fullName: "", username: "", email: "", password: "", roleName: "EMPLOYEE" };

export default function UsersPage() {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [users, setUsers] = useState([]);
  const [hiredApplicants, setHiredApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // users | hired
  const [activeRoleGroup, setActiveRoleGroup] = useState(null); // SUPER_ADMIN | ADMIN | EMPLOYEE
  const [roleModal, setRoleModal] = useState(null); // { id, currentRole }
  const [newRole, setNewRole] = useState("EMPLOYEE");
  const [roleChanging, setRoleChanging] = useState(false);
  const [converting, setConverting] = useState(null); // applicantId being converted

  useEffect(() => { loadUsers(); loadHiredApplicants(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const loadHiredApplicants = async () => {
    try {
      const res = await api.get("/admin/hired-applicants");
      setHiredApplicants(res.data);
    } catch { setHiredApplicants([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/users", form);
      setShowModal(false);
      setForm(emptyForm);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create user.");
    } finally { setSaving(false); }
  };

  const toggleUser = async (id) => {
    try { await api.put(`/admin/users/${id}/toggle`); loadUsers(); } catch {}
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try { await api.delete(`/admin/users/${id}`); loadUsers(); } catch {}
  };

  const openRoleModal = (u) => {
    setRoleModal(u);
    setNewRole(u.role === "SUPER_ADMIN" ? "ADMIN" : u.role);
    setError("");
  };

  const handleChangeRole = async () => {
    if (!roleModal) return;
    setRoleChanging(true);
    try {
      await api.put(`/admin/users/${roleModal.id}/role`, { roleName: newRole });
      setRoleModal(null);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to change role.");
    } finally { setRoleChanging(false); }
  };

  const handleConvert = async (applicantId, applicantName, email) => {
    if (!confirm(`Convert "${applicantName}" to an employee?\n\nA system account will be created:\n  Email: ${email}\n  Password: Welcome@123\n\nThey can log in at /login with these credentials.`)) return;
    setConverting(applicantId);
    try {
      await api.post(`/admin/hired-applicants/${applicantId}/convert`, { tempPassword: "Welcome@123" });
      loadHiredApplicants();
      loadUsers();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to convert.");
    } finally { setConverting(null); }
  };

  const filtered = users.filter(u => {
    return (
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredHired = hiredApplicants
    .filter(a => !a.isEmployee) // hide already-converted
    .filter(a =>
      a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.jobTitle?.toLowerCase().includes(search.toLowerCase())
    );

  const roleColor = (role) => {
    if (role === "SUPER_ADMIN") return { bg: "#f3e8ff", color: "#7c3aed" };
    if (role === "ADMIN") return { bg: "#dbeafe", color: "#1d4ed8" };
    return { bg: "#dcfce7", color: "#15803d" };
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", margin: 0 }}>User Management</h1>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "4px 0 0 0" }}>Manage system admins, employees and hired applicants</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => { setShowModal(true); setError(""); setForm(emptyForm); }}
            style={{ padding: "9px 20px", background: "#8e44ad", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
            + Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", borderBottom: "2px solid #e5e7eb" }}>
        {[
          { id: "users", label: `System Users (${users.length})` },
          { id: "hired", label: `Hired Applicants (${hiredApplicants.filter(a => !a.isEmployee).length})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "9px 20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600",
              background: activeTab === tab.id ? "#8e44ad" : "transparent",
              color: activeTab === tab.id ? "white" : "#6b7280",
              borderRadius: "6px 6px 0 0",
              borderBottom: activeTab === tab.id ? "2px solid #8e44ad" : "none",
              marginBottom: "-2px",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #ecf0f1", background: "#f8f9fa", display: "flex", gap: "12px", alignItems: "center" }}>
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: "7px 12px", border: "1px solid #dce1e7", borderRadius: "4px", fontSize: "13px", outline: "none", width: "280px" }} />
          <span style={{ color: "#7f8c8d", fontSize: "13px" }}>
            {activeTab === "users" ? `${filtered.length} user${filtered.length !== 1 ? "s" : ""}` : `${filteredHired.length} hired`}
          </span>
        </div>

        {/* System Users Tab */}
        {activeTab === "users" && (
          loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
          ) : (() => {
            const groups = [
              { role: "SUPER_ADMIN", label: "Super Admin", badge: { bg: "#f3e8ff", color: "#7c3aed" }, border: "#c4b5fd", cardBg: "#7c3aed" },
              { role: "ADMIN",       label: "Admin",       badge: { bg: "#dbeafe", color: "#1d4ed8" }, border: "#93c5fd", cardBg: "#1d4ed8" },
              { role: "EMPLOYEE",    label: "Employee",    badge: { bg: "#dcfce7", color: "#15803d" }, border: "#86efac", cardBg: "#15803d" },
            ];
            const activeGroup = groups.find(g => g.role === activeRoleGroup);
            const activeGroupUsers = activeGroup ? filtered.filter(u => u.role === activeGroup.role) : [];
            return (
              <div style={{ padding: "16px" }}>
                {/* Clickable summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "20px" }}>
                  {groups.map(g => {
                    const count = filtered.filter(u => u.role === g.role).length;
                    const isActive = activeRoleGroup === g.role;
                    return (
                      <div key={g.role}
                        onClick={() => setActiveRoleGroup(isActive ? null : g.role)}
                        style={{
                          background: isActive ? g.cardBg : "white",
                          borderRadius: "8px", padding: "16px 20px", cursor: "pointer",
                          boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.08)",
                          border: `2px solid ${isActive ? g.cardBg : g.border}`,
                          transition: "all 0.2s",
                          color: isActive ? "white" : g.badge.color,
                        }}>
                        <p style={{ fontSize: "32px", fontWeight: "700", margin: "0 0 4px 0" }}>{count}</p>
                        <p style={{ fontSize: "13px", margin: 0, opacity: 0.9 }}>{g.label}{count !== 1 ? "s" : ""}</p>
                        <p style={{ fontSize: "11px", margin: "6px 0 0 0", opacity: 0.7 }}>
                          {isActive ? "▲ Hide" : "▼ View"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Selected group table */}
                {activeGroup && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", paddingBottom: "6px", borderBottom: `2px solid ${activeGroup.border}` }}>
                      <span style={{ background: activeGroup.badge.bg, color: activeGroup.badge.color, padding: "3px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                        {activeGroup.label}
                      </span>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>{activeGroupUsers.length} user{activeGroupUsers.length !== 1 ? "s" : ""}</span>
                    </div>
                    {activeGroupUsers.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#9ca3af", margin: "8px 0 0 4px" }}>No {activeGroup.label.toLowerCase()} users.</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8f9fa" }}>
                              {["Full Name", "Username", "Email", "Status", "Created", ...(isSuperAdmin ? ["Actions"] : [])].map(h => (
                                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#5d6d7e", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {activeGroupUsers.map(u => (
                              <tr key={u.id} style={{ borderBottom: "1px solid #f0f3f4" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                                <td style={{ padding: "9px 14px", fontSize: "13px", fontWeight: "600", color: "#2c3e50" }}>{u.fullName}</td>
                                <td style={{ padding: "9px 14px", fontSize: "13px", color: "#5d6d7e" }}>{u.username}</td>
                                <td style={{ padding: "9px 14px", fontSize: "13px", color: "#5d6d7e" }}>{u.email}</td>
                                <td style={{ padding: "9px 14px" }}>
                                  <span style={{ background: u.status === "ACTIVE" ? "#dcfce7" : "#fee2e2", color: u.status === "ACTIVE" ? "#15803d" : "#b91c1c", padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>{u.status}</span>
                                </td>
                                <td style={{ padding: "9px 14px", fontSize: "12px", color: "#7f8c8d" }}>{u.createdAt ? u.createdAt.split("T")[0] : "-"}</td>
                                {isSuperAdmin && (
                                  <td style={{ padding: "9px 14px" }}>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                      {u.role !== "SUPER_ADMIN" && (
                                        <button onClick={() => openRoleModal(u)}
                                          style={{ padding: "4px 10px", background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>
                                          Change Role
                                        </button>
                                      )}
                                      <button onClick={() => toggleUser(u.id)}
                                        style={{ padding: "4px 10px", background: u.status === "ACTIVE" ? "#fef3c7" : "#dcfce7", color: u.status === "ACTIVE" ? "#92400e" : "#15803d", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>
                                        {u.status === "ACTIVE" ? "Disable" : "Enable"}
                                      </button>
                                      {u.role !== "SUPER_ADMIN" && (
                                        <button onClick={() => deleteUser(u.id)}
                                          style={{ padding: "4px 10px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* Hired Applicants Tab */}
        {activeTab === "hired" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0f3f4" }}>
                  {["Full Name", "Email", "Phone", "Position", "Hired Date", "Employee Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#5d6d7e", borderBottom: "1px solid #dce1e7", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHired.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#7f8c8d", fontSize: "14px" }}>No hired applicants found.</td></tr>
                ) : filteredHired.map((a, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f3f4" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}>
                    <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: "600", color: "#2c3e50" }}>{a.fullName}</td>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{a.email || "—"}</td>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{a.phone || "—"}</td>
                    <td style={{ padding: "10px 16px", fontSize: "13px", color: "#5d6d7e" }}>{a.jobTitle || "—"}</td>
                    <td style={{ padding: "10px 16px", fontSize: "12px", color: "#7f8c8d" }}>{a.appliedAt || "—"}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{
                        background: a.isEmployee ? "#dcfce7" : (a.hasAccount ? "#dbeafe" : "#fef3c7"),
                        color: a.isEmployee ? "#15803d" : (a.hasAccount ? "#1d4ed8" : "#92400e"),
                        padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700"
                      }}>
                        {a.isEmployee ? "Employee" : (a.hasAccount ? "Has Account" : "Not Converted")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {!a.isEmployee && isSuperAdmin && (
                        <button
                          onClick={() => handleConvert(a.applicantId, a.fullName, a.email)}
                          disabled={converting === a.applicantId}
                          style={{
                            padding: "4px 12px", background: converting === a.applicantId ? "#e5e7eb" : "#dcfce7",
                            color: converting === a.applicantId ? "#9ca3af" : "#15803d",
                            border: "1px solid #bbf7d0", borderRadius: "4px", cursor: converting === a.applicantId ? "not-allowed" : "pointer",
                            fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap"
                          }}>
                          {converting === a.applicantId ? "Converting..." : "Convert to Employee"}
                        </button>
                      )}
                      {a.isEmployee && (
                        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>✓ {a.empCode || "Converted"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {roleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "6px" }}>Change Role</h2>
            <p style={{ fontSize: "13px", color: "#7f8c8d", marginBottom: "20px" }}>
              Changing role for: <strong>{roleModal.fullName}</strong>
            </p>
            {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: "5px", fontSize: "13px", marginBottom: "14px" }}>{error}</div>}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>Current Role</label>
              <div style={{ padding: "9px 12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "5px", fontSize: "13px", color: "#374151" }}>
                {roleModal.role}
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>New Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none" }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => { setRoleModal(null); setError(""); }}
                style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                Cancel
              </button>
              <button type="button" onClick={handleChangeRole} disabled={roleChanging}
                style={{ flex: 1, padding: "10px", background: "#8e44ad", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: "pointer", fontSize: "13px", opacity: roleChanging ? 0.7 : 1 }}>
                {roleChanging ? "Saving..." : "Change Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && isSuperAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "20px" }}>Add New User</h2>
            {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: "5px", fontSize: "13px", marginBottom: "14px" }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              {[
                { label: "Full Name", name: "fullName", type: "text" },
                { label: "Username", name: "username", type: "text" },
                { label: "Email", name: "email", type: "email" },
                { label: "Password", name: "password", type: "password" },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>{f.label}</label>
                  <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })} required
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Role</label>
                <select value={form.roleName} onChange={e => setForm({ ...form, roleName: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "5px", fontSize: "13px", outline: "none" }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "5px", fontWeight: "600", color: "#374151", background: "white", cursor: "pointer", fontSize: "13px" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: "10px", background: "#8e44ad", color: "white", border: "none", borderRadius: "5px", fontWeight: "600", cursor: "pointer", fontSize: "13px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
