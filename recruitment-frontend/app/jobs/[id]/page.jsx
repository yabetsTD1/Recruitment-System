"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/${jobId}`)
        .then(r => r.json())
        .then(d => setJob(d))
        .catch(() => setJob(null))
        .finally(() => setLoading(false));
    }
  }, [jobId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#7f8c8d", fontSize: "16px" }}>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
        {/* Header */}
        <div style={{ background: "#2c3e50", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", background: "#2980b9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛡️</div>
            <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>INSA Recruitment</span>
          </div>
          <Link href="/login" style={{ padding: "8px 18px", background: "#27ae60", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
            Staff Login
          </Link>
        </div>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>❌</div>
          <h1 style={{ fontSize: "24px", color: "#2c3e50", marginBottom: "12px" }}>Job Not Found</h1>
          <p style={{ color: "#7f8c8d", marginBottom: "24px" }}>The job you're looking for doesn't exist or has been closed.</p>
          <Link href="/jobs" style={{ padding: "12px 24px", background: "#2980b9", color: "white", borderRadius: "6px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Header */}
      <div style={{ background: "#2c3e50", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: "#2980b9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛡️</div>
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>INSA Recruitment</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/jobs" style={{ padding: "8px 18px", background: "#34495e", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
            ← Back to Jobs
          </Link>
          <Link href="/login" style={{ padding: "8px 18px", background: "#27ae60", color: "white", borderRadius: "5px", textDecoration: "none", fontWeight: "600", fontSize: "13px" }}>
            Staff Login
          </Link>
        </div>
      </div>

      {/* Job Detail Content */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Job Header */}
        <div style={{ background: "white", borderRadius: "10px", padding: "32px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#2c3e50", margin: 0, flex: 1 }}>{job.jobTitle}</h1>
            <span style={{ padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>OPEN</span>
          </div>
          
          {job.department && (
            <p style={{ fontSize: "16px", color: "#7f8c8d", margin: "0 0 24px 0" }}>🏢 {job.department}</p>
          )}

          {/* Key Information Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "20px",
            padding: "24px",
            background: "#f8f9fa",
            borderRadius: "8px"
          }}>
            {job.batchCode && (
              <div>
                <p style={{ fontSize: "12px", color: "#95a5a6", margin: "0 0 6px 0", fontWeight: "600", textTransform: "uppercase" }}>Batch Code</p>
                <p style={{ fontSize: "16px", color: "#2c3e50", margin: 0, fontWeight: "700" }}>{job.batchCode}</p>
              </div>
            )}
            {job.recruitmentType && (
              <div>
                <p style={{ fontSize: "12px", color: "#95a5a6", margin: "0 0 6px 0", fontWeight: "600", textTransform: "uppercase" }}>Recruitment Type</p>
                <p style={{ fontSize: "16px", color: "#2c3e50", margin: 0, fontWeight: "700" }}>{job.recruitmentType}</p>
              </div>
            )}
            {job.salary && (
              <div>
                <p style={{ fontSize: "12px", color: "#95a5a6", margin: "0 0 6px 0", fontWeight: "600", textTransform: "uppercase" }}>Salary</p>
                <p style={{ fontSize: "16px", color: "#27ae60", margin: 0, fontWeight: "700" }}>{job.salary}</p>
              </div>
            )}
            <div>
              <p style={{ fontSize: "12px", color: "#95a5a6", margin: "0 0 6px 0", fontWeight: "600", textTransform: "uppercase" }}>Vacancies</p>
              <p style={{ fontSize: "16px", color: "#2c3e50", margin: 0, fontWeight: "700" }}>{job.vacancyNumber || 0} Position{job.vacancyNumber !== 1 ? "s" : ""}</p>
            </div>
            {(job.deadline || job.closingDate) && (
              <div>
                <p style={{ fontSize: "12px", color: "#95a5a6", margin: "0 0 6px 0", fontWeight: "600", textTransform: "uppercase" }}>Application Deadline</p>
                <p style={{ fontSize: "16px", color: "#e67e22", margin: 0, fontWeight: "700" }}>{job.deadline || job.closingDate}</p>
              </div>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div style={{ background: "white", borderRadius: "10px", padding: "32px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#2c3e50", marginBottom: "20px" }}>Job Details</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {job.jobLocation && (
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>📍</span>
                <div>
                  <p style={{ fontSize: "13px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>Location</p>
                  <p style={{ fontSize: "15px", color: "#2c3e50", margin: 0 }}>{job.jobLocation}</p>
                </div>
              </div>
            )}
            
            {job.employmentType && (
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <div>
                  <p style={{ fontSize: "13px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>Employment Type</p>
                  <p style={{ fontSize: "15px", color: "#2c3e50", margin: 0 }}>{job.employmentType}</p>
                </div>
              </div>
            )}
            
            {job.hiringType && (
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>🔖</span>
                <div>
                  <p style={{ fontSize: "13px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>Hiring Type</p>
                  <p style={{ fontSize: "15px", color: "#2c3e50", margin: 0 }}>{job.hiringType}</p>
                </div>
              </div>
            )}

            {job.positionName && (
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>💼</span>
                <div>
                  <p style={{ fontSize: "13px", color: "#95a5a6", margin: "0 0 4px 0", fontWeight: "600" }}>Position Name</p>
                  <p style={{ fontSize: "15px", color: "#2c3e50", margin: 0 }}>{job.positionName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Description */}
        {job.description && (
          <div style={{ background: "white", borderRadius: "10px", padding: "32px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#2c3e50", marginBottom: "16px" }}>Job Description</h2>
            <div style={{ fontSize: "15px", color: "#5d6d7e", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {job.description}
            </div>
          </div>
        )}

        {/* Requirements & Qualifications */}
        {((job.qualificationEntries && job.qualificationEntries.length > 0) || job.minDegree || job.requiredSkills || job.competency || job.competencyFramework) ? (
          <div style={{ background: "white", borderRadius: "10px", padding: "32px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#2c3e50", marginBottom: "24px" }}>Requirements & Qualifications</h2>
            
            {/* Display qualification entries if available */}
            {job.qualificationEntries && job.qualificationEntries.length > 0 ? (
              job.qualificationEntries.map((entry, index) => (
                <div key={entry.id || index} style={{ marginBottom: index < job.qualificationEntries.length - 1 ? "32px" : "0", paddingBottom: index < job.qualificationEntries.length - 1 ? "32px" : "0", borderBottom: index < job.qualificationEntries.length - 1 ? "2px solid #f0f3f4" : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Education Level */}
                    {entry.educationLevel && (
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>Education Level:</h3>
                        <p style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7", margin: 0 }}>{entry.educationLevel}</p>
                      </div>
                    )}

                    {/* Field of Study */}
                    {entry.fieldOfStudy && (
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>Field Of Study:</h3>
                        <p style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7", margin: 0 }}>{entry.fieldOfStudy}</p>
                      </div>
                    )}

                    {/* Min Experience */}
                    {entry.minExperience && (
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>Min Experience:</h3>
                        <p style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7", margin: 0 }}>{entry.minExperience} {entry.minExperience === "1" ? "year" : "years"}</p>
                      </div>
                    )}

                    {/* Education Category as Qualification */}
                    {entry.educationCategory && (
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>QUALIFICATION:</h3>
                        <p style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7", margin: 0 }}>{entry.educationCategory}</p>
                      </div>
                    )}

                    {/* Knowledge */}
                    {entry.knowledge && (
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>KNOWLEDGE:</h3>
                        <div style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7" }}>
                          {entry.knowledge.split('\n').filter(line => line.trim()).map((line, idx) => (
                            <p key={idx} style={{ margin: "0 0 8px 0" }}>• {line.trim()}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {entry.skill && (
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>SKILL:</h3>
                        <div style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7" }}>
                          {entry.skill.split('\n').filter(line => line.trim()).map((line, idx) => (
                            <p key={idx} style={{ margin: "0 0 8px 0" }}>• {line.trim()}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Competency */}
                    {entry.competency && (
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>KEY COMPETENCY:</h3>
                        <div style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7" }}>
                          {entry.competency.split('\n').filter(line => line.trim()).map((line, idx) => (
                            <p key={idx} style={{ margin: "0 0 8px 0" }}>• {line.trim()}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback: Display old format from JobQualification entity */
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {job.minDegree && (
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>Education Level:</h3>
                    <p style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7", margin: 0 }}>{job.minDegree}</p>
                  </div>
                )}

                {job.minExperience && (
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>Min Experience:</h3>
                    <p style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7", margin: 0 }}>{job.minExperience}</p>
                  </div>
                )}

                {job.minDegree && (
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>QUALIFICATION:</h3>
                    <p style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7", margin: 0 }}>{job.minDegree}</p>
                  </div>
                )}

                {(job.competencyFramework || job.competency) && (
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>KNOWLEDGE:</h3>
                    <div style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7" }}>
                      {(job.competencyFramework || job.competency).split('\n').filter(line => line.trim()).map((line, idx) => (
                        <p key={idx} style={{ margin: "0 0 8px 0" }}>• {line.trim()}</p>
                      ))}
                    </div>
                  </div>
                )}

                {job.requiredSkills && (
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#2c3e50", marginBottom: "8px" }}>SKILL:</h3>
                    <div style={{ fontSize: "14px", color: "#5d6d7e", lineHeight: "1.7" }}>
                      {job.requiredSkills.split('\n').filter(line => line.trim()).map((line, idx) => (
                        <p key={idx} style={{ margin: "0 0 8px 0" }}>• {line.trim()}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Apply Button */}
        <div style={{ background: "white", borderRadius: "10px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#2c3e50", marginBottom: "12px" }}>Ready to Apply?</h3>
          <p style={{ fontSize: "14px", color: "#7f8c8d", marginBottom: "24px" }}>Submit your application and join the Information Network Security Administration team.</p>
          <Link href={`/auth/login?redirect=/apply?id=${job.id}`}
            style={{ 
              padding: "14px 40px", 
              background: "#27ae60", 
              color: "white", 
              borderRadius: "6px", 
              textDecoration: "none", 
              fontWeight: "700", 
              fontSize: "16px",
              display: "inline-block",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#229954"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#27ae60"}>
            Apply Now →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "12px", borderTop: "1px solid #ecf0f1" }}>
        © 2025 Information Network Security Administration. All rights reserved.
      </div>
    </div>
  );
}
