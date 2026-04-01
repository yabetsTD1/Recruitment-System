"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8;
  };

  const validatePhone = (phone) => {
    // Basic phone validation (10-15 digits)
    const re = /^[0-9]{10,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isLogin) {
      if (!formData.fullName.trim()) {
        setError("Full name is required");
        return;
      }
      if (!validatePhone(formData.phone)) {
        setError("Please enter a valid phone number (10-15 digits)");
        return;
      }
      if (!validatePassword(formData.password)) {
        setError("Password must be at least 8 characters long");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login logic
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.email,
            password: formData.password
          })
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push(redirectTo);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Invalid email or password");
        }
      } else {
        // Registration logic
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone
          })
        });

        if (response.ok) {
          setIsLogin(true);
          setFormData({
            email: formData.email,
            password: "",
            confirmPassword: "",
            fullName: "",
            phone: ""
          });
          setError("");
          alert("Registration successful! Please login with your credentials.");
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Registration failed. Email may already be in use.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('/bg-pattern.jpg')",
      backgroundColor: "#4a5568",
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      {/* Login Card */}
      <div style={{
        background: "rgba(255, 255, 255, 0.98)",
        borderRadius: "8px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        width: "100%",
        maxWidth: "420px",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
          padding: "24px",
          textAlign: "center"
        }}>
          <h1 style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            color: "white",
            margin: 0,
            letterSpacing: "2px"
          }}>
            {isLogin ? "LOGIN" : "REGISTER"}
          </h1>
        </div>

        {/* Logo and Brand */}
        <div style={{ 
          textAlign: "center", 
          padding: "32px 32px 24px",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <div style={{ 
            width: "100px", 
            height: "100px", 
            margin: "0 auto 16px",
            position: "relative"
          }}>
            <Image 
              src="/logo.png" 
              alt="INSA Logo" 
              width={100} 
              height={100}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "12px"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#f97316"
            }}></div>
            <span style={{ 
              fontSize: "16px", 
              color: "#2d3748",
              fontWeight: "600",
              letterSpacing: "0.5px"
            }}>
              INSA REC
            </span>
          </div>
        </div>

        {/* Form Container */}
        <div style={{ padding: "32px" }}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "6px",
              fontSize: "13px",
              marginBottom: "20px",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  fontSize: "13px", 
                  fontWeight: "600", 
                  color: "#2d3748",
                  marginBottom: "8px"
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    outline: "none",
                    background: "white"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "13px", 
                fontWeight: "600", 
                color: "#2d3748",
                marginBottom: "8px"
              }}>
                Username (Email)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "18px",
                  color: "#64748b"
                }}>✉</span>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    outline: "none",
                    background: "white"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {!isLogin && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  fontSize: "13px", 
                  fontWeight: "600", 
                  color: "#2d3748",
                  marginBottom: "8px"
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+251 912 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    outline: "none",
                    background: "white"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: isLogin ? "16px" : "20px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "13px", 
                fontWeight: "600", 
                color: "#2d3748",
                marginBottom: "8px"
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "18px",
                  color: "#64748b"
                }}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 42px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    outline: "none",
                    background: "white"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e0";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "4px"
                  }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  fontSize: "13px", 
                  fontWeight: "600", 
                  color: "#2d3748",
                  marginBottom: "8px"
                }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "18px",
                    color: "#64748b"
                  }}>🔒</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    style={{
                      width: "100%",
                      padding: "12px 42px 12px 42px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      transition: "all 0.2s ease",
                      outline: "none",
                      background: "white"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#cbd5e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                      padding: "4px"
                    }}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                background: loading ? "#94a3b8" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.5px"
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = "#1d4ed8")}
              onMouseLeave={(e) => !loading && (e.target.style.background = "#2563eb")}
            >
              {loading ? "Please wait..." : (isLogin ? "Login" : "Create Account")}
            </button>
          </form>

          {/* Links */}
          <div style={{ 
            marginTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px"
          }}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  fullName: "",
                  phone: ""
                });
              }}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                cursor: "pointer",
                fontWeight: "600",
                padding: 0,
                textDecoration: "none"
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.target.style.textDecoration = "none"}
            >
              {isLogin ? "New User" : "Back to Login"}
            </button>
            
            {isLogin && (
              <Link 
                href="/auth/forgot-password" 
                style={{ 
                  color: "#2563eb", 
                  textDecoration: "none",
                  fontWeight: "600"
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                Forgot Password?
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: "center", 
          padding: "20px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0"
        }}>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            © 2024 - INSA REC - Online Application
          </p>
        </div>
      </div>
    </div>
  );
}
