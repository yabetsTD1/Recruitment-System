"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

const inputStyle = {
  width: "100%", 
  padding: "11px 14px", 
  borderRadius: "8px",
  border: "2px solid #e2e8f0", 
  fontSize: "14px", 
  outline: "none",
  boxSizing: "border-box", 
  background: "#fff", 
  color: "#2c3e50",
  transition: "all 0.3s ease",
  fontFamily: "inherit"
};

const labelStyle = { 
  fontSize: "13px", 
  fontWeight: "600", 
  color: "#334155", 
  marginBottom: "6px", 
  display: "block",
  letterSpacing: "0.01em"
};

function ApplyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const jobId = params.get("id");

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "", middleName: "", lastName: "", title: "", dateOfBirth: "", 
    residentialAddress: "", email: "", gender: "", maritalStatus: "", 
    phoneNumber1: "", phoneNumber2: "", githubUrl: "", linkedinUrl: "",
  });

  const [education, setEducation] = useState([
    { institution: "", fieldOfStudy: "", educationLevel: "", startDate: "", endDate: "", paidBy: "", location: "" }
  ]);

  const [certifications, setCertifications] = useState([
    { professionalLicense: "", startDate: "", institution: "", skills: "", endDate: "", location: "" }
  ]);

  const [experience, setExperience] = useState([
    { jobTitle: "", institution: "", organizationType: "", startDate: "", terminationReason: "", employmentType: "", responsibility: "", salary: "", endDate: "" }
  ]);

  const [languages, setLanguages] = useState([
    { language: "", writing: "", listening: "", reading: "", speaking: "" }
  ]);

  const [documents, setDocuments] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [expandedSections, setExpandedSections] = useState({
    candidateDetails: true,
    education: false,
    certifications: false,
    experience: false,
    language: false,
    documents: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!jobId) { setLoadingJob(false); return; }
    fetch(`${API}/public/jobs/${jobId}`)
      .then(r => r.json())
      .then(d => setJob(d))
      .catch(() => setJob(null))
      .finally(() => setLoadingJob(false));
  }, [jobId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addEducation = () => {
    setEducation([...education, { institution: "", fieldOfStudy: "", educationLevel: "", startDate: "", endDate: "", paidBy: "", location: "" }]);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, { professionalLicense: "", startDate: "", institution: "", skills: "", endDate: "", location: "" }]);
  };

  const removeCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index, field, value) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);
  };

  const addExperience = () => {
    setExperience([...experience, { jobTitle: "", institution: "", organizationType: "", startDate: "", terminationReason: "", employmentType: "", responsibility: "", salary: "", endDate: "" }]);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const addLanguage = () => {
    setLanguages([...languages, { language: "", writing: "", listening: "", reading: "", speaking: "" }]);
  };

  const removeLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const updateLanguage = (index, field, value) => {
    const updated = [...languages];
    updated[index][field] = value;
    setLanguages(updated);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      fileName: file.name,
      fileType: file.type,
      file: file
    }));
    setDocuments([...documents, ...newDocs]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phoneNumber1.trim() || !form.gender) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...form, 
          recruitmentId: Number(jobId),
          education: education,
          certifications: certifications,
          experience: experience,
          languages: languages
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Submission failed."); return; }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return <div style={{ textAlign: "center", padding: "80px", color: "#7f8c8d" }}>Loading...</div>;
  }

  if (!jobId || !job) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>❌</div>
        <p style={{ color: "#7f8c8d", fontSize: "16px" }}>Job not found.</p>
        <Link href="/jobs" style={{ color: "#2980b9", fontWeight: "600" }}>← Back to Jobs</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>Application Submitted!</h2>
        <p style={{ color: "#7f8c8d", fontSize: "15px", marginBottom: "24px" }}>
          Thank you for applying to <strong>{job.jobTitle}</strong>. We'll be in touch.
        </p>
        <Link href="/jobs" style={{ padding: "10px 24px", background: "#2980b9", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "600" }}>
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <style jsx>{`
        input:not([disabled]):hover,
        select:hover,
        textarea:hover {
          border-color: #cbd5e1 !important;
        }
        
        input:not([disabled]):focus,
        select:focus,
        textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        input[disabled] {
          background: #f8fafc !important;
          color: #64748b !important;
          cursor: not-allowed !important;
        }
        
        button:not([disabled]):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        button:not([disabled]):active {
          transform: translateY(0);
        }
        
        .section-header {
          transition: all 0.3s ease;
        }
        
        .section-header:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(91, 124, 153, 0.3);
        }
        
        .entry-card {
          transition: all 0.3s ease;
        }
        
        .entry-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
      
      <div style={{ 
        background: "white", 
        borderRadius: "16px", 
        padding: "48px 56px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
        border: "1px solid #e2e8f0" 
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px", 
          marginBottom: "32px", 
          paddingBottom: "24px", 
          borderBottom: "3px solid #e2e8f0" 
        }}>
          <div style={{ 
            width: "48px", 
            height: "48px", 
            borderRadius: "12px", 
            background: "linear-gradient(135deg, #3b82f6, #2563eb)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: "0", 
              fontSize: "22px", 
              fontWeight: "700", 
              color: "#1e293b",
              letterSpacing: "-0.02em"
            }}>
              Application Form
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            marginBottom: "12px" 
          }}>
            {[
              { num: 1, label: "Personal Info" },
              { num: 2, label: "Education" },
              { num: 3, label: "Certifications" },
              { num: 4, label: "Experience" },
              { num: 5, label: "Languages" },
              { num: 6, label: "Documents" }
            ].map((step) => (
              <div key={step.num} style={{ 
                flex: 1, 
                textAlign: "center",
                opacity: currentStep >= step.num ? 1 : 0.4
              }}>
                <div style={{ 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  background: currentStep >= step.num 
                    ? "linear-gradient(135deg, #3b82f6, #2563eb)" 
                    : "#e2e8f0",
                  color: currentStep >= step.num ? "white" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 6px",
                  fontWeight: "700",
                  fontSize: "14px",
                  transition: "all 0.3s ease"
                }}>
                  {currentStep > step.num ? "✓" : step.num}
                </div>
                <div style={{ 
                  fontSize: "11px", 
                  fontWeight: "600",
                  color: currentStep >= step.num ? "#1e293b" : "#94a3b8"
                }}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ 
            height: "6px", 
            background: "#e2e8f0", 
            borderRadius: "3px",
            overflow: "hidden"
          }}>
            <div style={{ 
              height: "100%", 
              background: "linear-gradient(90deg, #3b82f6, #2563eb)",
              width: `${(currentStep / totalSteps) * 100}%`,
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {error && (
          <div style={{ 
            background: "linear-gradient(135deg, #fee2e2, #fecaca)", 
            color: "#991b1b", 
            padding: "14px 18px", 
            borderRadius: "10px", 
            fontSize: "14px", 
            marginBottom: "24px", 
            border: "2px solid #fca5a5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "500"
          }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Batch Code Section - Always visible */}
          {currentStep === 1 && (
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
          )}

          {/* Step 1: Candidate Details Section */}
          {currentStep === 1 && (
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
            {/* Left Column */}
            <div>
              <label style={labelStyle}>First Name: <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} placeholder="ABEBE" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
            </div>

            {/* Right Column */}
            <div>
              <label style={labelStyle}>Middle Name:</label>
              <input style={inputStyle} placeholder="KEBEDE" value={form.middleName} onChange={e => set("middleName", e.target.value)} />
            </div>

            {/* Left Column */}
            <div>
              <label style={labelStyle}>Last Name: <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} placeholder="LEMMA" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
            </div>

            {/* Right Column */}
            <div>
              <label style={labelStyle}>Gender: <span style={{ color: "#e74c3c" }}>*</span></label>
              <select style={inputStyle} value={form.gender} onChange={e => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Left Column */}
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

            {/* Right Column */}
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

            {/* Left Column */}
            <div>
              <label style={labelStyle}>Date of Birth:</label>
              <input type="date" style={inputStyle} placeholder="13/04/1990" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
            </div>

            {/* Right Column */}
            <div>
              <label style={labelStyle}>Phone Number 1: <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} type="tel" placeholder="091-234-5678" value={form.phoneNumber1} onChange={e => set("phoneNumber1", e.target.value)} />
            </div>

            {/* Left Column */}
            <div>
              <label style={labelStyle}>Residential Address:</label>
              <input style={inputStyle} placeholder="Addis Ababa" value={form.residentialAddress} onChange={e => set("residentialAddress", e.target.value)} />
            </div>

            {/* Right Column */}
            <div>
              <label style={labelStyle}>Phone Number 2:</label>
              <input style={inputStyle} type="tel" placeholder="091-345-6789" value={form.phoneNumber2} onChange={e => set("phoneNumber2", e.target.value)} />
            </div>

            {/* Left Column - Full Width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Email: <span style={{ color: "#e74c3c" }}>*</span></label>
              <input style={inputStyle} type="email" placeholder="abebe.kebede@gmail.com" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>

            {/* Optional Links - Left */}
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

            {/* Next Button for Candidate Details */}
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
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
                  gap: "8px"
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
          )}

          {/* Step 2: Education Section */}
          {currentStep === 2 && (
          <div style={{ 
            marginBottom: "32px", 
            paddingTop: "8px",
            background: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('education')}
              className="section-header"
              style={{ 
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", 
                padding: "16px 24px", 
                borderRadius: "12px", 
                marginBottom: expandedSections.education ? "24px" : "0",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.2)"
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
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", letterSpacing: "-0.01em" }}>
                  Education
                </h4>
              </div>
              <span style={{ 
                color: "white", 
                fontSize: "24px", 
                fontWeight: "bold", 
                transform: expandedSections.education ? "rotate(90deg)" : "rotate(0deg)", 
                transition: "transform 0.3s ease",
                display: "inline-block"
              }}>
                ›
              </span>
            </div>
            
            {expandedSections.education && (
            <div className="animate-in">
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
              <button 
                type="button" 
                onClick={addEducation} 
                style={{ 
                  padding: "10px 20px", 
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  cursor: "pointer", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Entry
              </button>
            </div>

            {education.map((edu, index) => (
              <div key={index} className="entry-card" style={{ 
                background: "linear-gradient(to bottom, #ffffff, #f8fafc)", 
                padding: "24px", 
                borderRadius: "12px", 
                marginBottom: "16px", 
                position: "relative",
                border: "2px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "8px",
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    </svg>
                    Entry {index + 1}
                  </div>
                  {education.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeEducation(index)} 
                      style={{ 
                        background: "linear-gradient(135deg, #fee2e2, #fecaca)", 
                        color: "#991b1b", 
                        border: "2px solid #fca5a5", 
                        borderRadius: "8px", 
                        padding: "6px 14px", 
                        cursor: "pointer", 
                        fontSize: "12px", 
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 28px" }}>
                  {/* Left Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Education Level:</label>
                      <input style={inputStyle} placeholder="Enter Education Level" value={edu.educationLevel} onChange={e => updateEducation(index, "educationLevel", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Start Date:</label>
                      <input type="date" style={inputStyle} placeholder="Enter Start Date" value={edu.startDate} onChange={e => updateEducation(index, "startDate", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Location:</label>
                      <input style={inputStyle} placeholder="Enter Location" value={edu.location} onChange={e => updateEducation(index, "location", e.target.value)} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Institution:</label>
                      <input style={inputStyle} placeholder="Enter Institution" value={edu.institution} onChange={e => updateEducation(index, "institution", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Field of Study:</label>
                      <input style={inputStyle} placeholder="Enter Field Of Study" value={edu.fieldOfStudy} onChange={e => updateEducation(index, "fieldOfStudy", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Paid By:</label>
                      <input style={inputStyle} placeholder="Enter Payment Source" value={edu.paidBy} onChange={e => updateEducation(index, "paidBy", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>End Date:</label>
                      <input type="date" style={inputStyle} placeholder="Enter End Date" value={edu.endDate} onChange={e => updateEducation(index, "endDate", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Save Button for this entry */}
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button 
                    type="button" 
                    style={{ 
                      padding: "10px 28px", 
                      background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)"
                    }}
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            ))}

            {/* Next Button for Education */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
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
                  boxShadow: "0 4px 12px rgba(100, 116, 139, 0.3)",
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
                  gap: "8px"
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
          )}

          {/* Step 3: License and Certifications Section */}
          {currentStep === 3 && (
          <div style={{ 
            marginBottom: "32px", 
            paddingTop: "8px",
            background: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('certifications')}
              className="section-header"
              style={{ 
                background: "linear-gradient(135deg, #f59e0b, #d97706)", 
                padding: "16px 24px", 
                borderRadius: "12px", 
                marginBottom: expandedSections.certifications ? "24px" : "0",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)"
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
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", letterSpacing: "-0.01em" }}>
                  License and Certifications
                </h4>
              </div>
              <span style={{ 
                color: "white", 
                fontSize: "24px", 
                fontWeight: "bold", 
                transform: expandedSections.certifications ? "rotate(90deg)" : "rotate(0deg)", 
                transition: "transform 0.3s ease",
                display: "inline-block"
              }}>
                ›
              </span>
            </div>
            
            {expandedSections.certifications && (
            <div className="animate-in">
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
              <button 
                type="button" 
                onClick={addCertification} 
                style={{ 
                  padding: "10px 20px", 
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  cursor: "pointer", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Entry
              </button>
            </div>

            {certifications.map((cert, index) => (
              <div key={index} className="entry-card" style={{ 
                background: "linear-gradient(to bottom, #ffffff, #f8fafc)", 
                padding: "24px", 
                borderRadius: "12px", 
                marginBottom: "16px", 
                position: "relative",
                border: "2px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "8px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    </svg>
                    Entry {index + 1}
                  </div>
                  {certifications.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeCertification(index)} 
                      style={{ 
                        background: "linear-gradient(135deg, #fee2e2, #fecaca)", 
                        color: "#991b1b", 
                        border: "2px solid #fca5a5", 
                        borderRadius: "8px", 
                        padding: "6px 14px", 
                        cursor: "pointer", 
                        fontSize: "12px", 
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 28px" }}>
                  {/* Left Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Professional Licenses:</label>
                      <input style={inputStyle} placeholder="Enter Certification" value={cert.professionalLicense} onChange={e => updateCertification(index, "professionalLicense", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Start Date:</label>
                      <input type="date" style={inputStyle} placeholder="Select Start Date" value={cert.startDate} onChange={e => updateCertification(index, "startDate", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Institution:</label>
                      <input style={inputStyle} placeholder="Enter Institution" value={cert.institution} onChange={e => updateCertification(index, "institution", e.target.value)} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Skills:</label>
                      <input style={inputStyle} placeholder="Enter Skill" value={cert.skills} onChange={e => updateCertification(index, "skills", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>End Date:</label>
                      <input type="date" style={inputStyle} placeholder="Select Start Date" value={cert.endDate} onChange={e => updateCertification(index, "endDate", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Location:</label>
                      <input style={inputStyle} placeholder="Enter Location" value={cert.location} onChange={e => updateCertification(index, "location", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Save Button for this entry */}
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button 
                    type="button" 
                    style={{ 
                      padding: "10px 28px", 
                      background: "linear-gradient(135deg, #f59e0b, #d97706)", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
                    }}
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            ))}

            {/* Navigation Buttons for Certifications */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
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
                  boxShadow: "0 4px 12px rgba(100, 116, 139, 0.3)",
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
                  gap: "8px"
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
          )}

          {/* Step 4: Experience Section */}
          {currentStep === 4 && (
          <div style={{ 
            marginBottom: "32px", 
            paddingTop: "8px",
            background: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('experience')}
              className="section-header"
              style={{ 
                background: "linear-gradient(135deg, #06b6d4, #0891b2)", 
                padding: "16px 24px", 
                borderRadius: "12px", 
                marginBottom: expandedSections.experience ? "24px" : "0",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(6, 182, 212, 0.2)"
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
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", letterSpacing: "-0.01em" }}>
                  Work Experience
                </h4>
              </div>
              <span style={{ 
                color: "white", 
                fontSize: "24px", 
                fontWeight: "bold", 
                transform: expandedSections.experience ? "rotate(90deg)" : "rotate(0deg)", 
                transition: "transform 0.3s ease",
                display: "inline-block"
              }}>
                ›
              </span>
            </div>
            
            {expandedSections.experience && (
            <div className="animate-in">
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
              <button 
                type="button" 
                onClick={addExperience} 
                style={{ 
                  padding: "10px 20px", 
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  cursor: "pointer", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Experience
              </button>
            </div>

            {experience.map((exp, index) => (
              <div key={index} className="entry-card" style={{ 
                background: "linear-gradient(to bottom, #ffffff, #f8fafc)", 
                padding: "24px", 
                borderRadius: "12px", 
                marginBottom: "16px", 
                position: "relative",
                border: "2px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "8px",
                    background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    Entry {index + 1}
                  </div>
                  {experience.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeExperience(index)} 
                      style={{ 
                        background: "linear-gradient(135deg, #fee2e2, #fecaca)", 
                        color: "#991b1b", 
                        border: "2px solid #fca5a5", 
                        borderRadius: "8px", 
                        padding: "6px 14px", 
                        cursor: "pointer", 
                        fontSize: "12px", 
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 28px" }}>
                  {/* Left Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Job Title:</label>
                      <input style={inputStyle} placeholder="Enter Job Title" value={exp.jobTitle} onChange={e => updateExperience(index, "jobTitle", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Institution:</label>
                      <input style={inputStyle} placeholder="Enter Institution" value={exp.institution} onChange={e => updateExperience(index, "institution", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Organization Type:</label>
                      <select style={inputStyle} value={exp.organizationType} onChange={e => updateExperience(index, "organizationType", e.target.value)}>
                        <option value="">Select One</option>
                        <option value="Government">Government</option>
                        <option value="Private">Private</option>
                        <option value="NGO">NGO</option>
                        <option value="International">International</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Start Date:</label>
                      <input type="date" style={inputStyle} placeholder="Enter Start Date" value={exp.startDate} onChange={e => updateExperience(index, "startDate", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Termination Reason:</label>
                      <input style={inputStyle} placeholder="Enter Termination Reason" value={exp.terminationReason} onChange={e => updateExperience(index, "terminationReason", e.target.value)} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Employment Type:</label>
                      <select style={inputStyle} value={exp.employmentType} onChange={e => updateExperience(index, "employmentType", e.target.value)}>
                        <option value="">Select One</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Responsibility:</label>
                      <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} placeholder="Enter Responsibility" value={exp.responsibility} onChange={e => updateExperience(index, "responsibility", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Salary:</label>
                      <input style={inputStyle} placeholder="Enter Salary" value={exp.salary} onChange={e => updateExperience(index, "salary", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>End Date:</label>
                      <input type="date" style={inputStyle} placeholder="Enter End Date" value={exp.endDate} onChange={e => updateExperience(index, "endDate", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Save Button for this entry */}
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button 
                    type="button" 
                    style={{ 
                      padding: "10px 28px", 
                      background: "linear-gradient(135deg, #06b6d4, #0891b2)", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)"
                    }}
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            ))}

            {/* Navigation Buttons for Experience */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
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
                  boxShadow: "0 4px 12px rgba(100, 116, 139, 0.3)",
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
                  gap: "8px"
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
          )}

          {/* Step 5: Language Section */}
          {currentStep === 5 && (
          <div style={{ 
            marginBottom: "32px", 
            paddingTop: "8px",
            background: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            {/* Section Header */}
            <div 
              onClick={() => toggleSection('language')}
              className="section-header"
              style={{ 
                background: "linear-gradient(135deg, #ec4899, #db2777)", 
                padding: "16px 24px", 
                borderRadius: "12px", 
                marginBottom: expandedSections.language ? "24px" : "0",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.2)"
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
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "white", letterSpacing: "-0.01em" }}>
                  Language Proficiency
                </h4>
              </div>
              <span style={{ 
                color: "white", 
                fontSize: "24px", 
                fontWeight: "bold", 
                transform: expandedSections.language ? "rotate(90deg)" : "rotate(0deg)", 
                transition: "transform 0.3s ease",
                display: "inline-block"
              }}>
                ›
              </span>
            </div>
            
            {expandedSections.language && (
            <div className="animate-in">
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
              <button 
                type="button" 
                onClick={addLanguage} 
                style={{ 
                  padding: "10px 20px", 
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  cursor: "pointer", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Language
              </button>
            </div>

            {languages.map((lang, index) => (
              <div key={index} className="entry-card" style={{ 
                background: "linear-gradient(to bottom, #ffffff, #f8fafc)", 
                padding: "24px", 
                borderRadius: "12px", 
                marginBottom: "16px", 
                position: "relative",
                border: "2px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "8px",
                    background: "linear-gradient(135deg, #ec4899, #db2777)",
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                    </svg>
                    Entry {index + 1}
                  </div>
                  {languages.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeLanguage(index)} 
                      style={{ 
                        background: "linear-gradient(135deg, #fee2e2, #fecaca)", 
                        color: "#991b1b", 
                        border: "2px solid #fca5a5", 
                        borderRadius: "8px", 
                        padding: "6px 14px", 
                        cursor: "pointer", 
                        fontSize: "12px", 
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 28px" }}>
                  {/* Left Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Language:</label>
                      <input style={inputStyle} placeholder="Enter Language" value={lang.language} onChange={e => updateLanguage(index, "language", e.target.value)} />
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Writing:</label>
                      <select style={inputStyle} value={lang.writing} onChange={e => updateLanguage(index, "writing", e.target.value)}>
                        <option value="">Select One</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Listening:</label>
                      <select style={inputStyle} value={lang.listening} onChange={e => updateLanguage(index, "listening", e.target.value)}>
                        <option value="">Select One</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Reading:</label>
                      <select style={inputStyle} value={lang.reading} onChange={e => updateLanguage(index, "reading", e.target.value)}>
                        <option value="">Select One</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ ...labelStyle, fontSize: "12px" }}>Speaking:</label>
                      <select style={inputStyle} value={lang.speaking} onChange={e => updateLanguage(index, "speaking", e.target.value)}>
                        <option value="">Select One</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button for this entry */}
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button 
                    type="button" 
                    style={{ 
                      padding: "10px 28px", 
                      background: "linear-gradient(135deg, #ec4899, #db2777)", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)"
                    }}
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            ))}

            {/* Language Table Display */}
            {languages.some(l => l.language) && (
              <div style={{ 
                marginTop: "24px", 
                background: "white", 
                borderRadius: "12px", 
                overflow: "hidden", 
                border: "2px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "linear-gradient(135deg, #ec4899, #db2777)" }}>
                    <tr>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "white", borderRight: "1px solid rgba(255,255,255,0.2)" }}>No</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "white", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Language</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "white", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Reading</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "white", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Writing</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "white", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Speaking</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", fontWeight: "600", color: "white" }}>Listening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.filter(l => l.language).map((lang, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0", transition: "background 0.2s ease" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1e293b", fontWeight: "600" }}>{lang.language}</td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                          <span style={{ 
                            background: lang.reading ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "#f1f5f9",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: lang.reading ? "#1e40af" : "#64748b"
                          }}>
                            {lang.reading || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                          <span style={{ 
                            background: lang.writing ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "#f1f5f9",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: lang.writing ? "#1e40af" : "#64748b"
                          }}>
                            {lang.writing || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                          <span style={{ 
                            background: lang.speaking ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "#f1f5f9",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: lang.speaking ? "#1e40af" : "#64748b"
                          }}>
                            {lang.speaking || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
                          <span style={{ 
                            background: lang.listening ? "linear-gradient(135deg, #dbeafe, #bfdbfe)" : "#f1f5f9",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: lang.listening ? "#1e40af" : "#64748b"
                          }}>
                            {lang.listening || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Navigation Buttons for Language */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
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
                  boxShadow: "0 4px 12px rgba(100, 116, 139, 0.3)",
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
                  gap: "8px"
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
          )}

          {/* Step 6: Document Upload Section */}
          {currentStep === 6 && (
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

            {/* Navigation Buttons for Documents */}
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
          )}

          {/* Submit Button - Only visible on last step */}
          {currentStep === totalSteps && (
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", 
              padding: "16px", 
              background: submitting ? "#95a5a6" : "linear-gradient(135deg, #10b981, #059669)",
              color: "white", 
              border: "none", 
              borderRadius: "10px", 
              fontSize: "16px",
              fontWeight: "700", 
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}
          >
            {submitting ? "Submitting..." : "Submit Application"}
            {!submitting && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13"/>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
          )}
        </form>
      </div>

      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <Link href="/jobs" style={{ color: "#7f8c8d", fontSize: "13px", textDecoration: "none" }}>← Back to all jobs</Link>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  const [activePage, setActivePage] = useState("apply");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarItems = [
    { id: "home", label: "Home", icon: "🏠", href: "/" },
    { id: "jobs", label: "Job List", icon: "📋", href: "/jobs" },
    { id: "apply", label: "Candidate Profile", icon: "👤", href: "#", active: true },
    { id: "status", label: "Applied Job Status", icon: "📊", href: "#" },
    { id: "account", label: "Account", icon: "⚙️", href: "#" },
    { id: "logout", label: "Logout", icon: "🚪", href: "#" },
  ];

  return (
    <div style={{ height: "100vh", background: "#f5f7fa", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Global Styles */}
      <style jsx global>{`
        /* Custom Scrollbar for Sidebar */
        nav::-webkit-scrollbar {
          width: 6px;
        }
        
        nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        nav::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }
        
        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
      
      {/* Header - Fixed */}
      <div style={{ 
        background: "#ffffff", 
        padding: "16px 40px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: "transparent",
              border: "1px solid #e5e7eb",
              color: "#6b7280",
              padding: "8px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              marginRight: "8px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          
          <img 
            src="/logo.png" 
            alt="INSA Logo" 
            style={{ 
              height: "36px", 
              width: "auto",
              objectFit: "contain"
            }} 
          />
          <span style={{ color: "#1f2937", fontWeight: "700", fontSize: "16px" }}>አማ ሪ | REC</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>Welcome, Applicant</span>
          <Link href="/login" style={{ padding: "7px 16px", background: "#10b981", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
            Staff Login
          </Link>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Sidebar - Fixed */}
        <div style={{ 
          width: sidebarCollapsed ? "60px" : "220px", 
          background: "#1e293b", 
          boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s ease",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          height: "100%"
        }}>
          {/* User Profile Section */}
          <div style={{ 
            padding: sidebarCollapsed ? "12px 8px" : "14px 16px", 
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center",
            transition: "padding 0.3s ease",
            flexShrink: 0
          }}>
            <div style={{ 
              width: sidebarCollapsed ? "30px" : "44px", 
              height: sidebarCollapsed ? "30px" : "44px", 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #3b82f6, #2563eb)", 
              margin: "0 auto 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: sidebarCollapsed ? "15px" : "20px",
              border: "2px solid rgba(59, 130, 246, 0.3)",
              transition: "all 0.3s ease"
            }}>
              👤
            </div>
            {!sidebarCollapsed && (
              <>
                <h3 style={{ 
                  color: "white", 
                  fontSize: "13px", 
                  fontWeight: "600", 
                  margin: "0 0 3px 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  abebe kebede
                </h3>
                <div style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "4px",
                  background: "rgba(16, 185, 129, 0.15)",
                  padding: "2px 7px",
                  borderRadius: "8px"
                }}>
                  <span style={{ 
                    width: "5px", 
                    height: "5px", 
                    borderRadius: "50%", 
                    background: "#10b981",
                    display: "inline-block"
                  }}></span>
                  <span style={{ color: "#10b981", fontSize: "10px", fontWeight: "600" }}>Active</span>
                </div>
              </>
            )}
          </div>

          {/* Navigation Items - Scrollable */}
          <nav style={{ 
            flex: 1, 
            padding: "16px 0",
            overflowY: "auto",
            overflowX: "hidden"
          }}>
            {sidebarItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  if (item.href === "#") e.preventDefault();
                  setActivePage(item.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: sidebarCollapsed ? "12px 0" : "12px 20px",
                  color: item.id === activePage ? "white" : "rgba(255,255,255,0.6)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: item.id === activePage ? "600" : "500",
                  background: item.id === activePage ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  borderLeft: item.id === activePage ? "3px solid #3b82f6" : "3px solid transparent",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  if (item.id !== activePage) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (item.id !== activePage) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }
                }}
                title={sidebarCollapsed ? item.label : ""}
              >
                <span style={{ fontSize: "16px", minWidth: "16px" }}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <span style={{ 
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Collapse Toggle Button at Bottom */}
          <div style={{ 
            padding: sidebarCollapsed ? "12px 8px" : "12px 16px", 
            borderTop: "1px solid rgba(255,255,255,0.08)",
            transition: "padding 0.3s ease",
            flexShrink: 0
          }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                width: "100%",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                color: "#3b82f6",
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
              }}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                style={{
                  transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease"
                }}
              >
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          overflowX: "hidden",
          height: "100%"
        }}>
          <Suspense fallback={<div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d" }}>Loading...</div>}>
            <ApplyForm />
          </Suspense>

          <div style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "12px", borderTop: "1px solid #ecf0f1", marginTop: "32px" }}>
            © 2025 Information Network Security Administration. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
