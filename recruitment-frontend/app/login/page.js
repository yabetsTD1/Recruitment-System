"use client";

import { useContext, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
import { keycloakLogin } from "../../services/authService";

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

// Inner component that reads search params (needs Suspense)
function LoginHandler() {
  const { loginUser } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const loggedOut = searchParams.get("logged_out");
    const error = searchParams.get("error");

    // Just logged out — stay on login page, redirect to Keycloak fresh
    if (loggedOut === "1") {
      window.history.replaceState({}, "", "/login");
      // Small delay so the URL is clean before redirecting
      setTimeout(() => {
        window.location.href = buildKeycloakAuthUrl();
      }, 100);
      return;
    }

    // Keycloak returned an error
    if (error) {
      console.error("Keycloak error:", error);
      window.history.replaceState({}, "", "/login");
      window.location.href = buildKeycloakAuthUrl();
      return;
    }

    // Keycloak callback with authorization code
    if (code) {
      window.history.replaceState({}, "", "/login");
      exchangeCodeForToken(code)
        .then(async (tokenData) => {
          const data = await keycloakLogin(tokenData.access_token);
          loginUser(data);
          router.push("/dashboard");
        })
        .catch((err) => {
          console.error("Login failed:", err);
          // On failure, redirect back to Keycloak to try again
          window.location.href = buildKeycloakAuthUrl();
        });
      return;
    }

    // No code, no logout — direct visit to /login, go straight to Keycloak
    window.location.href = buildKeycloakAuthUrl();
  }, []);

  // Show a minimal loading screen while redirecting/processing
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('/insa background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "white",
        borderRadius: "8px",
        padding: "48px 40px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        minWidth: "300px",
      }}>
        <img src="/logo.png" alt="INSA" style={{ width: "60px", height: "60px", objectFit: "contain", marginBottom: "20px" }} />
        <div style={{
          width: "36px", height: "36px",
          border: "3px solid #e5e7eb",
          borderTop: "3px solid #2980b9",
          borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: "14px", fontWeight: "600", color: "#2c3e50", margin: 0 }}>
          Redirecting to login...
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#2c3e50" }}>
        <div style={{ color: "white", fontSize: "14px" }}>Loading...</div>
      </div>
    }>
      <LoginHandler />
    </Suspense>
  );
}
