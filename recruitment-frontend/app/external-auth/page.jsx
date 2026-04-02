"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

function ExternalAuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const jobId = params.get("jobId");

  const [mode, setMode] = useState("login"); // login | register
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [reg, setReg] = useState({ firstName: "", middleName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setL = (k, v) => setLoginForm(f => ({ ...f, [k]: v }));
  const setR = (k, v) => setReg(f => ({ ...f, [k]: v }));

  const saveSession = (email, fullName, token) => {
    localStorage.setItem("externalEmail", email);
    localStorage.setItem("externalName", fullName);
    localStorage.setItem("externalToken", token);
    if (jobId) localStorage.setItem("pendingJobId", jobId);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!loginForm.email.trim() || !loginForm.password) { setError("Email and password are required."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/public/applicant/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Invalid email or password."); return; }
      saveSession(data.email || loginForm.email.trim(), data.fullName || "", data.token || "");
      // If came from a job, redirect to apply with that job
      if (jobId) {
        router.push(`/apply?id=${jobId}&email=${encodeURIComponent(data.email || loginForm.email.trim())}`);
      } else {
        router.push("/apply");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!reg.firstName.trim() || !reg.lastName.trim()) { setError("First and last name are required."); return; }
    if (!reg.email.trim()) { setError("Email is required."); return; }
    if (!reg.password) { setError("Password is required."); return; }
    if (reg.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (reg.password !== reg.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/public/applicant/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: reg.firstName.trim(), middleName: reg.middleName.trim(),
          lastName: reg.lastName.trim(), email: reg.email.trim(),
          phone: reg.phone.trim(), password: reg.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Registration failed."); return; }
      const fullName = [reg.firstName, reg.middleName, reg.lastName].filter(Boolean).join(" ");
      saveSession(reg.email.trim(), fullName, data.token || "ext_" + btoa(reg.email.trim()));
      // If came from a job, redirect to apply with that job
      if (jobId) {
        router.push(`/apply?id=${jobId}&email=${encodeURIComponent(reg.email.trim())}`);
      } else {
        router.push("/apply");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const fieldStyle = {
    display: "flex", alignItems: "center", gap: "10px",
    border: "1.5px solid #e0e0e0", borderRadius: "8px",
    padding: "12px 14px", background: "white", width: "100%", boxSizing: "border-box",
  };
  const inputBase = {
    border: "none", outline: "none", fontSize: "14px",
    color: "#333", background: "transparent", flex: 1, width: "100%",
  };
  const lbl = { display: "block", fontSize: "14px", fontWeight: "700", color: "#1a1a2e", marginBottom: "8px" };

  return (
    <div style={{
      minHeight: "100vh", background: "#f0f2f5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', Arial, sans-serif", padding: "20px",
    }}>
      <div style={{
        background: "white", borderRadius: "16px", width: "100%", maxWidth: "420px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)", overflow: "hidden",
      }}>

        {/* Logo Section */}
        <div style={{ background: "#f8f9fa", padding: "28px 24px 20px", textAlign: "center", borderBottom: "1px solid #eee" }}>
          <div style={{ width: "90px", height: "90px", margin: "0 auto 12px" }}>
            <img src="/logo.png" alt="INSA Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f97316" }}></div>
            <span style={{ fontSize: "16px", color: "#2d3748", fontWeight: "600", letterSpacing: "0.5px" }}>INSA REC</span>
          </div>
        </div>

        {/* Form Section */}
        <div style={{ padding: "28px 28px 20px" }}>
          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #ffcdd2", color: "#c62828", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "18px" }}>
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "18px" }}>
                <label style={lbl}>Username (Email)</label>
                <div style={fieldStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                  <input type="email" style={inputBase} placeholder="your.email@example.com"
                    value={loginForm.email} onChange={e => setL("email", e.target.value)} autoFocus />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={lbl}>Password</label>
                <div style={fieldStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showPass ? "text" : "password"} style={inputBase}
                    placeholder="Enter your password" value={loginForm.password}
                    onChange={e => setL("password", e.target.value)} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#7c3aed", display: "flex", alignItems: "center" }}>
                    {showPass
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading ? "#93c5fd" : "#3b5bdb",
                  color: "white", border: "none", borderRadius: "8px",
                  fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.5px", transition: "background 0.2s",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2f4ac0"; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#3b5bdb"; }}>
                {loading ? "Signing in..." : "Login"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px" }}>
                <button type="button" onClick={() => { setMode("register"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#3b5bdb", fontWeight: "700", fontSize: "14px", cursor: "pointer", padding: 0 }}>
                  New User
                </button>
                <button type="button"
                  style={{ background: "none", border: "none", color: "#3b5bdb", fontWeight: "700", fontSize: "14px", cursor: "pointer", padding: 0 }}>
                  Forgot Password?
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Full Name <span style={{ color: "#e63946" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { key: "firstName", ph: "First", req: true },
                    { key: "middleName", ph: "Middle", req: false },
                    { key: "lastName", ph: "Last", req: true },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ ...fieldStyle, padding: "10px 12px" }}>
                        <input style={{ ...inputBase, fontSize: "13px" }} placeholder={f.ph}
                          value={reg[f.key]} onChange={e => setR(f.key, e.target.value)} />
                      </div>
                      <p style={{ fontSize: "11px", color: "#9e9e9e", margin: "3px 0 0 2px" }}>{f.ph}{f.req ? " *" : ""}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={lbl}>Email <span style={{ color: "#e63946" }}>*</span></label>
                <div style={fieldStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
                  </svg>
                  <input type="email" style={inputBase} placeholder="your.email@example.com"
                    value={reg.email} onChange={e => setR("email", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={lbl}>Phone Number</label>
                <div style={fieldStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <input type="tel" style={inputBase} placeholder="091-234-5678"
                    value={reg.phone} onChange={e => setR("phone", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={lbl}>Password <span style={{ color: "#e63946" }}>*</span></label>
                <div style={fieldStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showRegPass ? "text" : "password"} style={inputBase}
                    placeholder="Min 6 characters" value={reg.password}
                    onChange={e => setR("password", e.target.value)} />
                  <button type="button" onClick={() => setShowRegPass(!showRegPass)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#7c3aed", display: "flex", alignItems: "center" }}>
                    {showRegPass
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={lbl}>Confirm Password <span style={{ color: "#e63946" }}>*</span></label>
                <div style={fieldStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type="password" style={inputBase} placeholder="Repeat password"
                    value={reg.confirmPassword} onChange={e => setR("confirmPassword", e.target.value)} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "14px",
                  background: loading ? "#93c5fd" : "#3b5bdb",
                  color: "white", border: "none", borderRadius: "8px",
                  fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2f4ac0"; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#3b5bdb"; }}>
                {loading ? "Creating account..." : "Register"}
              </button>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button type="button" onClick={() => { setMode("login"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#3b5bdb", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                  ← Back to Login
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #eee", textAlign: "center", background: "#f8f9fa" }}>
          <p style={{ fontSize: "12px", color: "#9e9e9e", margin: 0 }}>© 2024 - INSA REC - Online Application</p>
        </div>
      </div>
    </div>
  );
}

export default function ExternalAuthPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "80px" }}>Loading...</div>}>
      <ExternalAuthForm />
    </Suspense>
  );
}
