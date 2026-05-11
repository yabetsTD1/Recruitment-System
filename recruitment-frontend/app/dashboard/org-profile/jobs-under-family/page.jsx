"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";

// Build a tree from flat job types list
function buildTree(jobTypes) {
  const map = {};
  const roots = [];
  jobTypes.forEach(jt => { map[jt.id] = { ...jt, children: [] }; });
  jobTypes.forEach(jt => {
    if (jt.parentId && map[jt.parentId]) {
      map[jt.parentId].children.push(map[jt.id]);
    } else {
      roots.push(map[jt.id]);
    }
  });
  return roots;
}

// Collect all descendant IDs of a node (including itself)
function collectIds(node) {
  const ids = [node.id];
  (node.children || []).forEach(c => ids.push(...collectIds(c)));
  return ids;
}

function JobTypeNode({ node, jobs, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);

  // Jobs directly under this job type
  const directJobs = jobs.filter(j => String(j.jobTypeId) === String(node.id));
  const hasChildren = node.children && node.children.length > 0;
  const allDescendantIds = collectIds(node);
  const totalJobs = jobs.filter(j => allDescendantIds.includes(Number(j.jobTypeId))).length;

  const indentPx = depth * 20;
  const isRoot = depth === 0;

  return (
    <div style={{ marginBottom: isRoot ? "16px" : "0" }}>
      {/* Node header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: `${isRoot ? "12px" : "9px"} 16px`,
          marginLeft: `${indentPx}px`,
          background: isRoot
            ? "linear-gradient(135deg, #1e3a5f, #2980b9)"
            : depth === 1
            ? "#eaf0fb"
            : "#f4f6f8",
          borderRadius: isRoot ? "10px 10px 0 0" : "6px",
          cursor: (hasChildren || directJobs.length > 0) ? "pointer" : "default",
          borderLeft: !isRoot ? `3px solid ${depth === 1 ? "#2980b9" : "#bdc3c7"}` : "none",
          marginBottom: "2px",
          userSelect: "none",
        }}
      >
        {/* Expand/collapse icon */}
        {(hasChildren || directJobs.length > 0) ? (
          <span style={{ fontSize: "12px", color: isRoot ? "white" : "#2980b9", minWidth: "14px" }}>
            {expanded ? "▼" : "▶"}
          </span>
        ) : (
          <span style={{ minWidth: "14px" }} />
        )}

        {/* Icon */}
        <span style={{ fontSize: isRoot ? "18px" : "14px" }}>
          {isRoot ? "📁" : hasChildren ? "📂" : "📋"}
        </span>

        {/* Name */}
        <span style={{
          fontWeight: isRoot ? "700" : depth === 1 ? "600" : "500",
          fontSize: isRoot ? "15px" : "13px",
          color: isRoot ? "white" : "#2c3e50",
          flex: 1,
        }}>
          {node.name}
        </span>

        {/* Job count badge */}
        {totalJobs > 0 && (
          <span style={{
            background: isRoot ? "rgba(255,255,255,0.2)" : "#2980b9",
            color: isRoot ? "white" : "white",
            padding: "2px 10px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
          }}>
            {totalJobs} job{totalJobs !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          marginLeft: `${indentPx + (isRoot ? 0 : 4)}px`,
          borderLeft: isRoot ? "none" : "2px solid #e5e7eb",
          paddingLeft: isRoot ? "0" : "12px",
          background: isRoot ? "white" : "transparent",
          borderRadius: isRoot ? "0 0 10px 10px" : "0",
          boxShadow: isRoot ? "0 2px 8px rgba(0,0,0,0.07)" : "none",
          marginBottom: isRoot ? "4px" : "0",
          overflow: "hidden",
        }}>
          {/* Child job types */}
          {hasChildren && node.children.map(child => (
            <JobTypeNode key={child.id} node={child} jobs={jobs} depth={depth + 1} />
          ))}

          {/* Direct jobs under this type */}
          {directJobs.length > 0 && (
            <div style={{ padding: isRoot && !hasChildren ? "12px 16px" : "8px 0 8px 8px" }}>
              {directJobs.map(job => (
                <div key={job.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 14px",
                  background: "#f9fafb",
                  borderRadius: "6px",
                  marginBottom: "4px",
                  border: "1px solid #f0f0f0",
                }}>
                  <span style={{ fontSize: "14px" }}>💼</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "13px", color: "#1f2937" }}>{job.name}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
                      {job.classCode && (
                        <span style={{ fontSize: "11px", background: "#dbeafe", color: "#1d4ed8", padding: "1px 7px", borderRadius: "8px", fontWeight: "600" }}>
                          Class: {job.classCode}
                        </span>
                      )}
                      {job.icf && (
                        <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "1px 7px", borderRadius: "8px", fontWeight: "600" }}>
                          ICF: {job.icf}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!hasChildren && directJobs.length === 0 && (
            <div style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "12px", fontStyle: "italic" }}>
              No jobs registered under this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobsUnderFamilyPage() {
  const [jobTypes, setJobTypes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/admin/job-types").catch(() => ({ data: [] })),
      api.get("/admin/registered-jobs").catch(() => ({ data: [] })),
    ]).then(([t, j]) => {
      setJobTypes(t.data);
      setJobs(j.data);
    }).finally(() => setLoading(false));
  }, []);

  const tree = buildTree(jobTypes);

  // Filter: if search is active, only show job types/jobs matching the search
  const filteredJobs = search.trim()
    ? jobs.filter(j =>
        j.name.toLowerCase().includes(search.toLowerCase()) ||
        (j.classCode || "").toLowerCase().includes(search.toLowerCase()) ||
        (j.icf || "").toLowerCase().includes(search.toLowerCase()) ||
        (j.jobTypeName || "").toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  const totalJobs = jobs.length;
  const totalFamilies = tree.length;

  return (
    <div style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "700" }}>Jobs Under Family</h2>
        <p style={{ margin: 0, color: "#7f8c8d", fontSize: "14px" }}>
          Browse registered jobs organized by their job family hierarchy
        </p>
      </div>

      {/* Stats + Search */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ background: "white", borderRadius: "8px", padding: "12px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0", textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#2980b9" }}>{totalFamilies}</div>
            <div style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "600" }}>Root Families</div>
          </div>
          <div style={{ background: "white", borderRadius: "8px", padding: "12px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0", textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: "700", color: "#27ae60" }}>{totalJobs}</div>
            <div style={{ fontSize: "11px", color: "#7f8c8d", fontWeight: "600" }}>Total Jobs</div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search jobs by name, class code, ICF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1px solid #dde1e7", borderRadius: "7px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#7f8c8d" }}>Loading...</div>
      ) : search.trim() ? (
        /* Search results — flat list */
        <div>
          <div style={{ marginBottom: "12px", fontSize: "13px", color: "#6b7280" }}>
            {filteredJobs.length} result{filteredJobs.length !== 1 ? "s" : ""} for "{search}"
          </div>
          {filteredJobs.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", background: "white", borderRadius: "10px" }}>
              No jobs match your search.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {filteredJobs.map(job => (
                <div key={job.id} style={{ background: "white", borderRadius: "10px", padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: "3px solid #2980b9" }}>
                  <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "6px", color: "#1f2937" }}>{job.name}</div>
                  <div style={{ fontSize: "12px", color: "#7f8c8d", marginBottom: "6px" }}>
                    <span style={{ background: "#eaf0fb", color: "#2980b9", padding: "1px 8px", borderRadius: "10px", fontWeight: "600" }}>
                      {job.jobTypeName || "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {job.classCode && (
                      <span style={{ fontSize: "11px", background: "#dbeafe", color: "#1d4ed8", padding: "1px 7px", borderRadius: "8px", fontWeight: "600" }}>
                        Class: {job.classCode}
                      </span>
                    )}
                    {job.icf && (
                      <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "1px 7px", borderRadius: "8px", fontWeight: "600" }}>
                        ICF: {job.icf}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tree.length === 0 ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af", background: "white", borderRadius: "10px" }}>
          No job families found. Add job types first.
        </div>
      ) : (
        /* Tree view */
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {tree.map(root => (
            <JobTypeNode key={root.id} node={root} jobs={filteredJobs} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
