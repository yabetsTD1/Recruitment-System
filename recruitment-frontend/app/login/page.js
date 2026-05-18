"use client";

import { useState, useContext, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../../context/AuthContext";
import { login, keycloakLogin } from "../../services/authService";

const KEYCLOAK_URL = "http://localhost:9090";
const KEYCLOAK_REALM = "recruitment-system";
const KEYCLOAK_CLIENT_ID = "recruitment-app";

function getRedirectUri() {
  return `${window.location.origin}/login`;
}

function buildKeycloakAuthUrl() {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid profile email",
  });
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params}`;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    code,
  });
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed: ${errText}`);
  }
  return res.json();
}

// Separate component that uses useSearchParams (requires Suspense in App Router)
function KeycloakCallback({ onSuccess, onError, onLoading }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // If we just logged out, don't process any code
    if (searchParams.get("logged_out") === "1") {
      window.history.replaceState({}, "", "/login");
      return;
    }

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      onError(`Keycloak error: ${error}`);
      window.history.replaceState({}, "", "/login");
      return;
    }

    if (!code) return;

    window.history.replaceState({}, "", "/login");
    onLoading(true);

    exchangeCodeForToken(code)
      .then(async (tokenData) => {
        const data = await keycloakLogin(tokenData.access_token);
        onSuccess(data);
        router.push("/dashboard");
      })
      .catch((err) => {
        console.error("Keycloak callback error:", err);
        onError("Keycloak login failed: " + err.message);
        onLoading(false);
      });
  }, []);

  return null;
}

export default function LoginPage() {
  const { loginUser } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [kcLoading, setKcLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      loginUser(data);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeycloakLogin = () => {
    window.location.href = buildKeycloakAuthUrl();
  };

  if (kcLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#2c3e50", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔐</div>
          <p style={{ fontSize: "16px", fontWeight: "600" }}>Completing Keycloak login...</p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('/insa background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "20px",
    }}>
      {/* Keycloak callback handler — reads ?code= from URL */}
      <Suspense fallback={null}>
        <KeycloakCallback
          onSuccess={(data) => loginUser(data)}
          onError={(msg) => setError(msg)}
          onLoading={(v) => setKcLoading(v)}
        />
      </Suspense>

      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ margin: "0 auto 14px", width: "80px", height: "80px" }}>
            <img src="/logo.png" alt="INSA Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
          <p style={{ color: "#7f8c8d", fontSize: "13px", margin: "0 0 24px 0" }}>Sign in to access your dashboard</p>

          {error && (
            <div style={{
              background: "#fdf2f2", border: "1px solid #f5c6cb",
              color: "#c0392b", padding: "10px 14px", borderRadius: "5px",
              fontSize: "13px", marginBottom: "20px",
            }}>
              {error}
            </div>
          )}

          {/* Keycloak SSO Button */}
          <button
            type="button"
            onClick={handleKeycloakLogin}
            style={{
              width: "100%", padding: "11px",
              background: "#e8f4fd",
              color: "#1a5276",
              border: "1.5px solid #aed6f1",
              borderRadius: "5px",
              fontSize: "14px", fontWeight: "700",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              marginBottom: "20px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d6eaf8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#e8f4fd")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#1a5276" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="#1a5276" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Login with Keycloak SSO
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: "#ecf0f1" }} />
            <span style={{ fontSize: "12px", color: "#95a5a6", fontWeight: "600" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#ecf0f1" }} />
          </div>

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

          {/* Credentials hint */}
          <div style={{ marginTop: "20px", padding: "12px", background: "#f0f8ff", borderRadius: "5px", border: "1px solid #d6eaf8" }}>
            <p style={{ fontSize: "12px", color: "#2980b9", fontWeight: "600", margin: "0 0 4px 0" }}>Default Super Admin</p>
            <p style={{ fontSize: "12px", color: "#5d6d7e", margin: 0 }}>Email: admin@insa.gov.et</p>
            <p style={{ fontSize: "12px", color: "#5d6d7e", margin: "0 0 8px 0" }}>Password: admin123</p>
            <p style={{ fontSize: "12px", color: "#27ae60", fontWeight: "600", margin: "0 0 4px 0" }}>Keycloak SSO</p>
            <p style={{ fontSize: "12px", color: "#5d6d7e", margin: 0 }}>Roles: SUPER_ADMIN · ADMIN · EMPLOYEE</p>
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
