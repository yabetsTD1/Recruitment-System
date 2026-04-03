"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { login } from "../../services/authService";

export default function LoginPage() {
  const { loginUser } = useContext(AuthContext);
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      loginUser(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #2c3e50 0%, #1a252f 60%, #2980b9 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px", height: "64px",
            background: "linear-gradient(135deg, #2980b9, #1abc9c)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.2)" />
              <circle cx="12" cy="12" r="3" fill="white" />
            </svg>
          </div>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: "700", margin: 0, letterSpacing: "0.5px" }}>INSA-ERP</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "4px 0 0 0" }}>Recruitment Management System</p>
        </div>

        {/* Card */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "36px 32px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", margin: "0 0 6px 0" }}>Staff Login</h2>
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "0 0 28px 0" }}>Sign in to access your dashboard</p>

          {error && (
            <div style={{
              background: "#fdf2f2", border: "1px solid #f5c6cb",
              color: "#c0392b", padding: "10px 14px", borderRadius: "5px",
              fontSize: "13px", marginBottom: "20px",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#2c3e50", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@insa.gov.et"
                required
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1.5px solid #dce1e7", borderRadius: "5px",
                  fontSize: "14px", outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2980b9")}
                onBlur={(e) => (e.target.style.borderColor = "#dce1e7")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#2c3e50", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%", padding: "10px 40px 10px 12px",
                    border: "1.5px solid #dce1e7", borderRadius: "5px",
                    fontSize: "14px", outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2980b9")}
                  onBlur={(e) => (e.target.style.borderColor = "#dce1e7")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: "10px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#95a5a6", fontSize: "16px", padding: "2px",
                  }}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: loading ? "#85c1e9" : "#2980b9",
                color: "white", border: "none", borderRadius: "5px",
                fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#3498db"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#2980b9"; }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Default credentials hint */}
          <div style={{ marginTop: "20px", padding: "12px", background: "#f0f8ff", borderRadius: "5px", border: "1px solid #d6eaf8" }}>
            <p style={{ fontSize: "12px", color: "#2980b9", fontWeight: "600", margin: "0 0 4px 0" }}>Default Super Admin</p>
            <p style={{ fontSize: "12px", color: "#5d6d7e", margin: 0 }}>Email: admin@insa.gov.et</p>
            <p style={{ fontSize: "12px", color: "#5d6d7e", margin: "0 0 8px 0" }}>Password: admin123</p>
            <p style={{ fontSize: "12px", color: "#27ae60", fontWeight: "600", margin: "0 0 4px 0" }}>Converted Employees</p>
            <p style={{ fontSize: "12px", color: "#5d6d7e", margin: 0 }}>Email: (their registered email)</p>
            <p style={{ fontSize: "12px", color: "#5d6d7e", margin: 0 }}>Password: Welcome@123</p>
          </div>
        </div>

        {/* Back to public */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          >
            ← Back to Public Site
          </Link>
        </div>
      </div>
    </div>
  );
}
