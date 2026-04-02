"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PersonalInfoSection from "./components/PersonalInfoSection";
import EducationSection from "./components/EducationSection";
import CertificationsSection from "./components/CertificationsSection";
import ExperienceSection from "./components/ExperienceSection";
import LanguageSection from "./components/LanguageSection";
import DocumentsSection from "./components/DocumentsSection";

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

function ApplyForm({ jobIdOverride }) {
  const params = useSearchParams();
  const jobId = jobIdOverride || params.get("id");
  const emailParam = params.get("email");

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
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

  useEffect(() => {
    const email = emailParam || (typeof window !== "undefined" ? localStorage.getItem("externalEmail") : null);
    if (!email) { setProfileLoaded(true); return; }
    if (emailParam && typeof window !== "undefined") {
      localStorage.setItem("externalEmail", emailParam);
    }
    fetch(`${API}/public/applicant/profile?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(profile => {
        if (profile && profile.email) {
          setForm(f => ({
            ...f,
            firstName: profile.firstName || "",
            middleName: profile.middleName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            phoneNumber1: profile.phone || "",
            phoneNumber2: profile.phoneNumber2 || "",
            residentialAddress: profile.location || "",
            gender: profile.gender || "",
            maritalStatus: profile.maritalStatus || "",
            dateOfBirth: profile.dateOfBirth || "",
            githubUrl: profile.githubUrl || "",
            linkedinUrl: profile.linkedinUrl || "",
          }));
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, [emailParam]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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

  if (loadingJob || !profileLoaded) {
    return <div style={{ textAlign: "center", padding: "80px", color: "#7f8c8d" }}>Loading...</div>;
  }

  if (!jobId) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
        <p style={{ color: "#7f8c8d", fontSize: "16px" }}>Please select a job from the Job List to apply.</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>❌</div>
        <p style={{ color: "#7f8c8d", fontSize: "16px" }}>Job not found.</p>
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
        input:not([disabled]):hover, select:hover, textarea:hover { border-color: #cbd5e1 !important; }
        input:not([disabled]):focus, select:focus, textarea:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important; }
        input[disabled] { background: #f8fafc !important; color: #64748b !important; cursor: not-allowed !important; }
        button:not([disabled]):hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        button:not([disabled]):active { transform: translateY(0); }
        .section-header { transition: all 0.3s ease; }
        .section-header:hover { transform: translateX(4px); box-shadow: 0 4px 12px rgba(91, 124, 153, 0.3); }
        .entry-card { transition: all 0.3s ease; }
        .entry-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: slideDown 0.3s ease-out; }
      `}</style>

      <div style={{ background: "white", borderRadius: "16px", padding: "48px 56px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", paddingBottom: "24px", borderBottom: "3px solid #e2e8f0" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0", fontSize: "22px", fontWeight: "700", color: "#1e293b", letterSpacing: "-0.02em" }}>Application Form</h3>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>Step {currentStep} of {totalSteps}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            {[
              { num: 1, label: "Personal Info" },
              { num: 2, label: "Education" },
              { num: 3, label: "Certifications" },
              { num: 4, label: "Experience" },
              { num: 5, label: "Languages" },
              { num: 6, label: "Documents" }
            ].map((step) => (
              <div key={step.num} style={{ flex: 1, textAlign: "center", opacity: currentStep >= step.num ? 1 : 0.4 }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: currentStep >= step.num ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#e2e8f0", color: currentStep >= step.num ? "white" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontWeight: "700", fontSize: "14px", transition: "all 0.3s ease" }}>
                  {currentStep > step.num ? "✓" : step.num}
                </div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: currentStep >= step.num ? "#1e293b" : "#94a3b8" }}>{step.label}</div>
              </div>
            ))}
          </div>
          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #3b82f6, #2563eb)", width: `${(currentStep / totalSteps) * 100}%`, transition: "width 0.3s ease" }}></div>
          </div>
        </div>

        {error && (
          <div style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#991b1b", padding: "14px 18px", borderRadius: "10px", fontSize: "14px", marginBottom: "24px", border: "2px solid #fca5a5", display: "flex", alignItems: "center", gap: "10px", fontWeight: "500" }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <PersonalInfoSection
              form={form}
              set={set}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              goToNextStep={goToNextStep}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
              job={job}
            />
          )}

          {currentStep === 2 && (
            <EducationSection
              education={education}
              setEducation={setEducation}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              goToNextStep={goToNextStep}
              goToPreviousStep={goToPreviousStep}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
            />
          )}

          {currentStep === 3 && (
            <CertificationsSection
              certifications={certifications}
              setCertifications={setCertifications}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              goToNextStep={goToNextStep}
              goToPreviousStep={goToPreviousStep}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
            />
          )}

          {currentStep === 4 && (
            <ExperienceSection
              experience={experience}
              setExperience={setExperience}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              goToNextStep={goToNextStep}
              goToPreviousStep={goToPreviousStep}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
            />
          )}

          {currentStep === 5 && (
            <LanguageSection
              languages={languages}
              setLanguages={setLanguages}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              goToNextStep={goToNextStep}
              goToPreviousStep={goToPreviousStep}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
            />
          )}

          {currentStep === 6 && (
            <DocumentsSection
              documents={documents}
              setDocuments={setDocuments}
              handleFileUpload={handleFileUpload}
              removeDocument={removeDocument}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              goToPreviousStep={goToPreviousStep}
              submitting={submitting}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
            />
          )}

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
  const router = useRouter();
  const [activePage, setActivePage] = useState("apply");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [applicant, setApplicant] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [fullName, setFullName] = useState("Applicant");
  const [selectedJobId, setSelectedJobId] = useState(null);

  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyMsg, setApplyMsg] = useState({});
  const [viewingJob, setViewingJob] = useState(null); // job detail modal
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);

  const applyForJob = async (jobId) => {
    const email = localStorage.getItem("externalEmail");
    if (!email) { router.push(`/external-auth?jobId=${jobId}`); return; }
    setApplyingJobId(jobId);
    try {
      // Fetch applicant profile to get their details
      const profileRes = await fetch(`${API}/public/applicant/profile?email=${encodeURIComponent(email)}`);
      const profile = await profileRes.json();
      // Submit application
      const res = await fetch(`${API}/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName || "",
          middleName: profile.middleName || "",
          lastName: profile.lastName || "",
          email: profile.email || email,
          phone: profile.phone || "",
          gender: profile.gender || "",
          location: profile.location || "",
          recruitmentId: Number(jobId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApplyMsg(p => ({ ...p, [jobId]: data.message || "Failed to apply" }));
        setTimeout(() => setApplyMsg(p => { const n = { ...p }; delete n[jobId]; return n; }), 4000);
        return;
      }
      // Refresh applications list
      const appsRes = await fetch(`${API}/public/applicant/applications?email=${encodeURIComponent(email)}`);
      const apps = await appsRes.json();
      if (Array.isArray(apps)) setApplications(apps);
      setApplyMsg(p => ({ ...p, [jobId]: "success" }));
    } catch {
      setApplyMsg(p => ({ ...p, [jobId]: "Network error" }));
      setTimeout(() => setApplyMsg(p => { const n = { ...p }; delete n[jobId]; return n; }), 4000);
    } finally {
      setApplyingJobId(null);
    }
  };

  const hasApplied = (jobId) => applications.some(a => a.recruitmentId === jobId);

  const viewJobDetails = (jobId) => {
    setLoadingJobDetail(true);
    setViewingJob(null);
    fetch(`${API}/public/jobs/${jobId}`)
      .then(r => r.json())
      .then(d => setViewingJob(d))
      .catch(() => setViewingJob(null))
      .finally(() => setLoadingJobDetail(false));
  };

  useEffect(() => {
    const storedName = localStorage.getItem("externalName") || "";
    if (storedName) setFullName(storedName);
    const email = localStorage.getItem("externalEmail");
    if (!email) { setDataLoaded(true); return; }
    Promise.all([
      fetch(`${API}/public/applicant/profile?email=${encodeURIComponent(email)}`).then(r => r.json()).catch(() => null),
      fetch(`${API}/public/jobs`).then(r => r.json()).catch(() => []),
      fetch(`${API}/public/applicant/applications?email=${encodeURIComponent(email)}`).then(r => r.json()).catch(() => []),
    ]).then(([profile, jobList, appList]) => {
      if (profile) {
        setApplicant(profile);
        if (profile.fullName) setFullName(profile.fullName);
      }
      setJobs(Array.isArray(jobList) ? jobList : []);
      const apps = Array.isArray(appList) ? appList : [];
      setApplications(apps);
      const notifs = [];
      const today = new Date();
      apps.forEach(app => {
        if (app.status === "SHORTLISTED" || app.status === "HIRED")
          notifs.push({ type: "success", msg: `Your application for "${app.jobTitle}" has been approved!`, icon: "🎉" });
        else if (app.status === "REJECTED")
          notifs.push({ type: "error", msg: `Your application for "${app.jobTitle}" was not successful.`, icon: "❌" });
        if (app.closingDate) {
          const daysLeft = Math.ceil((new Date(app.closingDate) - today) / 86400000);
          if (daysLeft >= 0 && daysLeft <= 5)
            notifs.push({ type: "warning", msg: `Deadline for "${app.jobTitle}" closes in ${daysLeft} day(s)!`, icon: "⏰" });
        }
      });
      setNotifications(notifs);
      setDataLoaded(true);
    });
  }, []);

  const logout = () => {
    localStorage.removeItem("externalEmail");
    localStorage.removeItem("externalName");
    localStorage.removeItem("externalToken");
    localStorage.removeItem("pendingJobId");
    window.location.href = "/";
  };

  const statusStyle = {
    SUBMITTED:    { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    UNDER_REVIEW: { bg: "#dbeafe", color: "#1d4ed8", label: "Under Review" },
    SHORTLISTED:  { bg: "#d1fae5", color: "#065f46", label: "Approved" },
    HIRED:        { bg: "#ede9fe", color: "#5b21b6", label: "Hired" },
    REJECTED:     { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  };

  const sidebarItems = [
    { id: "home",    label: "Home",              icon: "🏠" },
    { id: "jobs",    label: "Job List",           icon: "📋" },
    { id: "apply",   label: "Candidate Profile",  icon: "👤" },
    { id: "status",  label: "Applied Job Status", icon: "📊" },
    { id: "account", label: "Account",            icon: "⚙️" },
    { id: "logout",  label: "Logout",             icon: "🚪", action: logout },
  ];

  return (
    <div style={{ height: "100vh", background: "#f5f7fa", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif" }}>
      <style jsx global>{`
        nav::-webkit-scrollbar { width: 6px; }
        nav::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderBottom: "1px solid #e5e7eb", flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 10px", borderRadius: "6px", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <img src="/logo.png" alt="INSA" style={{ height: "34px", objectFit: "contain" }} />
          <span style={{ fontWeight: "700", fontSize: "15px", color: "#1f2937" }}>አማ ሪ | REC</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {notifications.length > 0 && (
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setActivePage("home")}>
              <span style={{ fontSize: "20px" }}>🔔</span>
              <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
                {notifications.length}
              </span>
            </div>
          )}
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "13px" }}>
            {fullName[0]?.toUpperCase() || "A"}
          </div>
          <span style={{ fontSize: "13px", color: "#374151", fontWeight: "600" }}>{fullName}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{ width: sidebarCollapsed ? "58px" : "220px", background: "#1e293b", display: "flex", flexDirection: "column", transition: "width 0.3s ease", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: sidebarCollapsed ? "14px 8px" : "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <div style={{ width: sidebarCollapsed ? "30px" : "44px", height: sidebarCollapsed ? "30px" : "44px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: sidebarCollapsed ? "14px" : "18px", transition: "all 0.3s" }}>
              {fullName[0]?.toUpperCase() || "A"}
            </div>
            {!sidebarCollapsed && (
              <>
                <div style={{ color: "white", fontSize: "12px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(16,185,129,0.15)", padding: "2px 8px", borderRadius: "8px", marginTop: "4px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                  <span style={{ color: "#10b981", fontSize: "10px", fontWeight: "600" }}>Active</span>
                </div>
              </>
            )}
          </div>
          <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
            {sidebarItems.map(item => (
              <button key={item.id}
                onClick={() => { if (item.action) item.action(); else setActivePage(item.id); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: sidebarCollapsed ? "12px 0" : "12px 20px", background: activePage === item.id ? "rgba(59,130,246,0.15)" : "transparent", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: activePage === item.id ? "3px solid #3b82f6" : "3px solid transparent", color: activePage === item.id ? "white" : "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: activePage === item.id ? "600" : "500", cursor: "pointer", justifyContent: sidebarCollapsed ? "center" : "flex-start", transition: "all 0.2s" }}>
                <span style={{ fontSize: "16px", minWidth: "16px" }}>{item.icon}</span>
                {!sidebarCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </button>
            ))}
          </nav>
          <div style={{ padding: sidebarCollapsed ? "10px 8px" : "10px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ width: "100%", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", padding: "7px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", fontWeight: "600" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflowY: "auto", height: "100%" }}>

          {/* HOME */}
          {activePage === "home" && (
            <div style={{ padding: "28px 32px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1f2937", margin: "0 0 4px 0" }}>Welcome back, {fullName.split(" ")[0]} 👋</h1>
              <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "24px" }}>Here's your recruitment overview</p>

              {notifications.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notifications</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {notifications.map((n, i) => (
                      <div key={i} style={{ padding: "12px 16px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", background: n.type === "success" ? "#d1fae5" : n.type === "error" ? "#fee2e2" : "#fef3c7", border: `1px solid ${n.type === "success" ? "#a7f3d0" : n.type === "error" ? "#fca5a5" : "#fde68a"}` }}>
                        <span style={{ fontSize: "18px" }}>{n.icon}</span>
                        <span style={{ fontSize: "13px", fontWeight: "500", color: n.type === "success" ? "#065f46" : n.type === "error" ? "#991b1b" : "#92400e" }}>{n.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: "Total Applied", value: applications.length, color: "#3b82f6", icon: "📝" },
                  { label: "Pending", value: applications.filter(a => ["SUBMITTED","UNDER_REVIEW"].includes(a.status)).length, color: "#f59e0b", icon: "⏳" },
                  { label: "Approved", value: applications.filter(a => ["SHORTLISTED","HIRED"].includes(a.status)).length, color: "#10b981", icon: "✅" },
                  { label: "Rejected", value: applications.filter(a => a.status === "REJECTED").length, color: "#ef4444", icon: "❌" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: "28px", fontWeight: "700", color: s.color, margin: 0 }}>{s.value}</p>
                      <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>{s.label}</p>
                    </div>
                    <span style={{ fontSize: "22px" }}>{s.icon}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937", margin: 0 }}>Open Positions</h3>
                  <button onClick={() => setActivePage("jobs")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>View All →</button>
                </div>
                {jobs.slice(0, 5).map(job => (
                  <div key={job.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f9fafb" }}>
                    <div>
                      <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "13px" }}>{job.jobTitle}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{job.department || job.jobLocation || "—"}{job.closingDate ? ` · Closes ${job.closingDate}` : ""}</div>
                    </div>
                    {hasApplied(job.id)
                      ? <span style={{ padding: "5px 14px", background: "#d1fae5", color: "#065f46", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>✓ Applied</span>
                      : applyMsg[job.id] && applyMsg[job.id] !== "success"
                      ? <span style={{ padding: "5px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>{applyMsg[job.id]}</span>
                      : <button onClick={() => applyForJob(job.id)} disabled={applyingJobId === job.id}
                          style={{ padding: "5px 14px", background: applyingJobId === job.id ? "#94a3b8" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: applyingJobId === job.id ? "not-allowed" : "pointer" }}>
                          {applyingJobId === job.id ? "Applying..." : "Apply"}
                        </button>
                    }
                  </div>
                ))}
                {jobs.length === 0 && <p style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>No open positions at the moment.</p>}
              </div>
            </div>
          )}

          {/* JOB LIST */}
          {activePage === "jobs" && (
            <div style={{ padding: "28px 32px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1f2937", margin: "0 0 20px 0" }}>Available Positions</h1>
              <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
                {jobs.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>No open positions at the moment.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                      <tr>
                        {["#", "Job Title", "Department", "Location", "Vacancies", "Closing Date", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#374151" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job, i) => (
                        <tr key={job.id} style={{ borderTop: "1px solid #f9fafb" }}>
                          <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "13px" }}>{i + 1}</td>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1f2937", fontSize: "13px" }}>{job.jobTitle}</td>
                          <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{job.department || "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{job.jobLocation || "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{job.vacancyNumber || "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>{job.closingDate || "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {hasApplied(job.id)
                                ? <span style={{ padding: "5px 12px", background: "#d1fae5", color: "#065f46", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>✓ Applied</span>
                                : applyMsg[job.id] && applyMsg[job.id] !== "success"
                                ? <span style={{ padding: "5px 12px", background: "#fee2e2", color: "#b91c1c", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>{applyMsg[job.id]}</span>
                                : <button onClick={() => applyForJob(job.id)} disabled={applyingJobId === job.id}
                                    style={{ padding: "5px 12px", background: applyingJobId === job.id ? "#94a3b8" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: applyingJobId === job.id ? "not-allowed" : "pointer" }}>
                                    {applyingJobId === job.id ? "Applying..." : "Apply"}
                                  </button>
                              }
                              <button type="button" onClick={() => viewJobDetails(job.id)}
                                style={{ padding: "5px 12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* CANDIDATE PROFILE (Apply Form) */}
          {activePage === "apply" && (
            <Suspense fallback={<div style={{ textAlign: "center", padding: "60px", color: "#7f8c8d" }}>Loading...</div>}>
              <ApplyForm key={selectedJobId || "no-job"} jobIdOverride={selectedJobId} />
            </Suspense>
          )}

          {/* APPLIED JOB STATUS */}
          {activePage === "status" && (
            <div style={{ padding: "28px 32px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1f2937", margin: "0 0 20px 0" }}>Applied Job Status</h1>
              <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", overflow: "hidden" }}>
                {applications.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
                    <p>You haven't applied to any positions yet.</p>
                    <button onClick={() => setActivePage("jobs")} style={{ marginTop: "12px", padding: "9px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Browse Jobs</button>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                      <tr>
                        {["#", "Job Title", "Department", "Applied Date", "Closing Date", "Status"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#374151" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app, i) => {
                        const s = statusStyle[app.status] || { bg: "#f3f4f6", color: "#374151", label: app.status };
                        return (
                          <tr key={app.id} style={{ borderTop: "1px solid #f9fafb" }}>
                            <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "13px" }}>{i + 1}</td>
                            <td style={{ padding: "12px 16px", fontWeight: "600", color: "#1f2937", fontSize: "13px" }}>{app.jobTitle}</td>
                            <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{app.department || "—"}</td>
                            <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>{app.appliedAt ? app.appliedAt.slice(0, 10) : "—"}</td>
                            <td style={{ padding: "12px 16px", color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>{app.closingDate || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: s.bg, color: s.color }}>{s.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {activePage === "account" && (
            <div style={{ padding: "28px 32px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1f2937", margin: "0 0 20px 0" }}>My Account</h1>
              <div style={{ background: "white", borderRadius: "12px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", maxWidth: "640px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "22px" }}>
                    {fullName[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <div style={{ fontSize: "17px", fontWeight: "700", color: "#1f2937" }}>{fullName}</div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>{applicant?.email}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[
                    { label: "First Name", value: applicant?.firstName },
                    { label: "Middle Name", value: applicant?.middleName },
                    { label: "Last Name", value: applicant?.lastName },
                    { label: "Email", value: applicant?.email },
                    { label: "Phone", value: applicant?.phone },
                    { label: "Gender", value: applicant?.gender },
                    { label: "Location", value: applicant?.location },
                    { label: "Marital Status", value: applicant?.maritalStatus },
                    { label: "Date of Birth", value: applicant?.dateOfBirth },
                    { label: "GPA", value: applicant?.gpa },
                    { label: "Experience (years)", value: applicant?.experienceYears },
                    { label: "Graduated From", value: applicant?.graduatedFrom },
                  ].filter(f => f.value).map((f, i) => (
                    <div key={i}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{f.label}</div>
                      <div style={{ fontSize: "14px", color: "#1f2937", fontWeight: "500" }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
                  <button onClick={() => setActivePage("apply")}
                    style={{ padding: "10px 20px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "12px", borderTop: "1px solid #ecf0f1" }}>
            © 2025 Information Network Security Administration. All rights reserved.
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      {(loadingJobDetail || viewingJob) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setViewingJob(null)}>
          <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            {loadingJobDetail ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>Loading job details...</div>
            ) : viewingJob && (
              <>
                {/* Modal Header */}
                <div style={{ padding: "24px 28px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937", margin: 0 }}>{viewingJob.jobTitle}</h2>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>Open</span>
                    </div>
                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                      {viewingJob.department && <span style={{ fontSize: "12px", color: "#6b7280" }}>🏢 {viewingJob.department}</span>}
                      {viewingJob.jobLocation && <span style={{ fontSize: "12px", color: "#6b7280" }}>📍 {viewingJob.jobLocation}</span>}
                      {viewingJob.salary && <span style={{ fontSize: "12px", color: "#6b7280" }}>💰 {viewingJob.salary}</span>}
                    </div>
                  </div>
                  <button onClick={() => setViewingJob(null)}
                    style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af", lineHeight: 1, padding: "4px" }}>×</button>
                </div>

                {/* Key Info */}
                <div style={{ padding: "16px 28px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", borderBottom: "1px solid #f3f4f6" }}>
                  {[
                    { label: "Batch Code", value: viewingJob.batchCode },
                    { label: "Vacancies", value: viewingJob.vacancyNumber ? `${viewingJob.vacancyNumber} Position(s)` : null },
                    { label: "Closing Date", value: viewingJob.closingDate },
                    { label: "Employment Type", value: viewingJob.employmentType },
                    { label: "Hiring Type", value: viewingJob.hiringType },
                    { label: "Recruitment Type", value: viewingJob.recruitmentType },
                  ].filter(i => i.value).map((item, idx) => (
                    <div key={idx} style={{ background: "#f9fafb", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{item.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {viewingJob.description && (
                  <div style={{ padding: "16px 28px", borderBottom: "1px solid #f3f4f6" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#374151", marginBottom: "10px" }}>Job Description</h3>
                    <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.7", whiteSpace: "pre-wrap", margin: 0 }}>{viewingJob.description}</p>
                  </div>
                )}

                {/* Qualifications */}
                {(viewingJob.qualificationEntries?.length > 0 || viewingJob.minDegree) && (
                  <div style={{ padding: "16px 28px", borderBottom: "1px solid #f3f4f6" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#374151", marginBottom: "10px" }}>Requirements</h3>
                    {viewingJob.qualificationEntries?.length > 0 ? viewingJob.qualificationEntries.map((e, i) => (
                      <div key={i} style={{ marginBottom: "8px", fontSize: "13px", color: "#4b5563" }}>
                        {e.educationLevel && <div>📚 Education: {e.educationLevel}</div>}
                        {e.fieldOfStudy && <div>📖 Field: {e.fieldOfStudy}</div>}
                        {e.minExperience && <div>⏱ Experience: {e.minExperience} year(s)</div>}
                        {e.skill && <div>🔧 Skills: {e.skill}</div>}
                      </div>
                    )) : (
                      <div style={{ fontSize: "13px", color: "#4b5563" }}>
                        {viewingJob.minDegree && <div>📚 Education: {viewingJob.minDegree}</div>}
                        {viewingJob.requiredSkills && <div>🔧 Skills: {viewingJob.requiredSkills}</div>}
                      </div>
                    )}
                  </div>
                )}

                {/* Apply Button */}
                <div style={{ padding: "20px 28px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button onClick={() => setViewingJob(null)}
                    style={{ padding: "10px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                    Close
                  </button>
                  {hasApplied(viewingJob.id) ? (
                    <span style={{ padding: "10px 20px", background: "#d1fae5", color: "#065f46", borderRadius: "8px", fontSize: "13px", fontWeight: "700" }}>✓ Already Applied</span>
                  ) : (
                    <button onClick={() => { setViewingJob(null); applyForJob(viewingJob.id); }}
                      disabled={applyingJobId === viewingJob.id}
                      style={{ padding: "10px 24px", background: applyingJobId === viewingJob.id ? "#94a3b8" : "linear-gradient(135deg, #27ae60, #229954)", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: applyingJobId === viewingJob.id ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(39,174,96,0.3)" }}>
                      {applyingJobId === viewingJob.id ? "Applying..." : "Apply Now →"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
