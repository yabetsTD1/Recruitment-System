package com.recruitment.recruitmentbackend.controller;

import com.recruitment.recruitmentbackend.entity.*;
import com.recruitment.recruitmentbackend.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/recruitments")
@RequiredArgsConstructor
public class RecruitmentController {

    private final RecruitmentRepository recruitmentRepository;
    private final RecruitmentRequestRepository requestRepository;
    private final RecruitmentPostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final UserRepository userRepository;
    private final JobQualificationRepository jobQualificationRepository;
    private final RecruitmentCriteriaRepository criteriaRepository;

    @Data
    static class RecruitmentRequest {
        @NotBlank String jobTitle;
        String department;
        String description;
        Integer vacancyNumber;
        String referralCode;
    }

    @Data
    static class PostRequest {
        @NotBlank String postType; // INTERNAL or EXTERNAL
        String closingDate;        // yyyy-MM-dd
        String remark;
    }

    // ── Request Form Data ──

    @GetMapping("/request-form-data")
    public ResponseEntity<?> getRequestFormData() {
        List<?> jobs = jobQualificationRepository.findAll().stream()
                .filter(jq -> jq.getStatus() == JobQualification.QualificationStatus.ACTIVE)
                .map(jq -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", jq.getId());
                    m.put("jobTitle", jq.getJobTitle());
                    m.put("grade", jq.getGrade() != null ? jq.getGrade() : "");
                    m.put("minDegree", jq.getMinDegree() != null ? jq.getMinDegree() : "");
                    m.put("minExperience", jq.getMinExperience() != null ? jq.getMinExperience() : "");
                    m.put("competencyFramework", jq.getCompetencyFramework() != null ? jq.getCompetencyFramework() : "");
                    m.put("jobTypeName", jq.getJobType() != null ? jq.getJobType().getName() : "");
                    return m;
                }).toList();

        List<?> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null &&
                        (u.getRole().getRoleName().equals("ADMIN") || u.getRole().getRoleName().equals("SUPER_ADMIN")))
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("fullName", u.getFullName());
                    m.put("email", u.getEmail());
                    return m;
                }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("jobs", jobs);
        result.put("admins", admins);
        return ResponseEntity.ok(result);
    }

    // ── Full Recruitment Request ──

    @PostMapping("/full-request")
    public ResponseEntity<?> createFullRequest(@RequestBody Map<String, Object> body, Authentication auth) {
        Integer jobQualId = body.get("jobQualificationId") != null
                ? Integer.parseInt(body.get("jobQualificationId").toString()) : null;

        Recruitment r = new Recruitment();
        r.setJobTitle(body.getOrDefault("jobTitle", "").toString());
        r.setDepartment(body.getOrDefault("department", "").toString());
        r.setVacancyNumber(body.get("vacancyNumber") != null
                ? Integer.parseInt(body.get("vacancyNumber").toString()) : 1);
        r.setJobLocation(body.getOrDefault("jobLocation", "").toString());
        r.setCompetencyFramework(body.getOrDefault("competencyFramework", "").toString());
        r.setRecorderName(body.getOrDefault("recorderName", "").toString());
        r.setSalary(body.getOrDefault("salary", "").toString());
        r.setHiringType(body.getOrDefault("hiringType", "").toString());
        r.setCandidateIdentificationMethod(body.getOrDefault("candidateIdentificationMethod", "").toString());
        // auto-generate batch code: REC-YYYYMMDD-XXXX
        String batch = "REC-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        r.setBatchCode(batch);
        r.setStatus(Recruitment.RecruitmentStatus.REQUESTED);

        if (jobQualId != null) {
            jobQualificationRepository.findById(jobQualId).ifPresent(r::setJobQualification);
        }
        userRepository.findByEmail(auth.getName()).ifPresent(r::setCreatedBy);

        Recruitment saved = recruitmentRepository.save(r);

        // also create a request record
        com.recruitment.recruitmentbackend.entity.RecruitmentRequest rr =
                new com.recruitment.recruitmentbackend.entity.RecruitmentRequest();
        rr.setRecruitment(saved);
        userRepository.findByEmail(auth.getName()).ifPresent(rr::setRequestedBy);
        rr.setRequestStatus(com.recruitment.recruitmentbackend.entity.RecruitmentRequest.RequestStatus.PENDING);
        requestRepository.save(rr);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", saved.getId());
        resp.put("batchCode", saved.getBatchCode());
        resp.put("message", "Request submitted.");
        return ResponseEntity.ok(resp);
    }

    // ── Internal Jobs (for logged-in INSA employees) ──

    @GetMapping("/internal-jobs")
    public ResponseEntity<?> getInternalJobs(@RequestParam(required = false) String search) {
        LocalDate now = LocalDate.now();
        String q = search != null ? search.toLowerCase().trim() : "";
        List<?> jobs = postRepository.findAll().stream()
                .filter(p -> p.getPostType() == RecruitmentPost.PostType.INTERNAL
                        && p.getRecruitment().getStatus() == Recruitment.RecruitmentStatus.POSTED
                        && (p.getClosingDate() == null || !p.getClosingDate().isBefore(now))
                        && (q.isEmpty()
                            || (p.getRecruitment().getJobTitle() != null && p.getRecruitment().getJobTitle().toLowerCase().contains(q))
                            || (p.getRecruitment().getBatchCode() != null && p.getRecruitment().getBatchCode().toLowerCase().contains(q))))
                .map(p -> {
                    Recruitment r = p.getRecruitment();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("jobTitle", r.getJobTitle());
                    m.put("department", r.getDepartment() != null ? r.getDepartment() : "");
                    m.put("vacancyNumber", r.getVacancyNumber() != null ? r.getVacancyNumber() : 0);
                    m.put("salary", r.getSalary() != null ? r.getSalary() : "");
                    m.put("jobLocation", r.getJobLocation() != null ? r.getJobLocation() : "");
                    m.put("hiringType", r.getHiringType() != null ? r.getHiringType() : "");
                    m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("batchCode", r.getBatchCode() != null ? r.getBatchCode() : "");
                    m.put("competencyFramework", r.getCompetencyFramework() != null ? r.getCompetencyFramework() : "");
                    // qualification / criteria details
                    if (r.getJobQualification() != null) {
                        JobQualification jq = r.getJobQualification();
                        m.put("minDegree", jq.getMinDegree() != null ? jq.getMinDegree() : "");
                        m.put("minExperience", jq.getMinExperience() != null ? jq.getMinExperience() : "");
                        m.put("requiredSkills", jq.getRequiredSkills() != null ? jq.getRequiredSkills() : "");
                        m.put("grade", jq.getGrade() != null ? jq.getGrade() : "");
                        m.put("fullDescription", jq.getFullDescription() != null ? jq.getFullDescription() : "");
                        m.put("jobTypeName", jq.getJobType() != null ? jq.getJobType().getName() : "");
                    } else {
                        m.put("minDegree", ""); m.put("minExperience", ""); m.put("requiredSkills", "");
                        m.put("grade", ""); m.put("fullDescription", ""); m.put("jobTypeName", "");
                    }
                    return m;
                }).toList();
        return ResponseEntity.ok(jobs);
    }

    // ── CRUD ──

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(recruitmentRepository.findAll().stream().map(this::toMap).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOne(@PathVariable Integer id) {
        return recruitmentRepository.findById(id)
                .map(r -> ResponseEntity.ok(toMap(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody RecruitmentRequest req, Authentication auth) {
        Recruitment r = new Recruitment();
        r.setJobTitle(req.getJobTitle());
        r.setDepartment(req.getDepartment());
        r.setDescription(req.getDescription());
        r.setVacancyNumber(req.getVacancyNumber());
        r.setReferralCode(req.getReferralCode());
        r.setStatus(Recruitment.RecruitmentStatus.DRAFT);
        userRepository.findByEmail(auth.getName()).ifPresent(r::setCreatedBy);
        return ResponseEntity.ok(toMap(recruitmentRepository.save(r)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @RequestBody RecruitmentRequest req) {
        return recruitmentRepository.findById(id).map(r -> {
            r.setJobTitle(req.getJobTitle());
            r.setDepartment(req.getDepartment());
            r.setDescription(req.getDescription());
            r.setVacancyNumber(req.getVacancyNumber());
            return ResponseEntity.ok(toMap(recruitmentRepository.save(r)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        if (!recruitmentRepository.existsById(id)) return ResponseEntity.notFound().build();
        recruitmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    // ── Request ──

    @PostMapping("/{id}/request")
    public ResponseEntity<?> submitRequest(@PathVariable Integer id, Authentication auth) {
        return recruitmentRepository.findById(id).map(r -> {
            com.recruitment.recruitmentbackend.entity.RecruitmentRequest rr =
                    new com.recruitment.recruitmentbackend.entity.RecruitmentRequest();
            rr.setRecruitment(r);
            userRepository.findByEmail(auth.getName()).ifPresent(rr::setRequestedBy);
            rr.setRequestStatus(com.recruitment.recruitmentbackend.entity.RecruitmentRequest.RequestStatus.PENDING);
            r.setStatus(Recruitment.RecruitmentStatus.REQUESTED);
            recruitmentRepository.save(r);
            requestRepository.save(rr);
            return ResponseEntity.ok(Map.of("message", "Request submitted."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Approve / Reject ──

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Integer id,
                                     @RequestBody Map<String, String> body,
                                     Authentication auth) {
        return recruitmentRepository.findById(id).map(r -> {
            r.setStatus(Recruitment.RecruitmentStatus.APPROVED);
            String vacancyType = body.getOrDefault("vacancyType", "Inside");
            r.setVacancyType(vacancyType);
            recruitmentRepository.save(r);

            RecruitmentApproval approval = new RecruitmentApproval();
            approval.setRecruitment(r);
            approval.setApprovalStatus(RecruitmentApproval.ApprovalStatus.APPROVED);
            approval.setComment(body.getOrDefault("comment", ""));
            userRepository.findByEmail(auth.getName()).ifPresent(approval::setApprovedBy);
            return ResponseEntity.ok(Map.of("message", "Approved."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Integer id,
                                    @RequestBody Map<String, String> body,
                                    Authentication auth) {
        return recruitmentRepository.findById(id).map(r -> {
            r.setStatus(Recruitment.RecruitmentStatus.REJECTED);
            recruitmentRepository.save(r);
            return ResponseEntity.ok(Map.of("message", "Rejected."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Post ──

    @PostMapping("/{id}/post")
    public ResponseEntity<?> post(@PathVariable Integer id,
                                  @Valid @RequestBody PostRequest req) {
        return recruitmentRepository.findById(id).map(r -> {
            RecruitmentPost rp = new RecruitmentPost();
            rp.setRecruitment(r);
            rp.setPostType(RecruitmentPost.PostType.valueOf(req.getPostType()));
            if (req.getClosingDate() != null && !req.getClosingDate().isEmpty()) {
                rp.setClosingDate(LocalDate.parse(req.getClosingDate()));
            }
            if (req.getRemark() != null) rp.setRemark(req.getRemark());
            postRepository.save(rp);
            r.setStatus(Recruitment.RecruitmentStatus.POSTED);
            recruitmentRepository.save(r);
            return ResponseEntity.ok(Map.of("message", "Posted."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Close ──

    @PostMapping("/{id}/close")
    public ResponseEntity<?> close(@PathVariable Integer id) {
        return recruitmentRepository.findById(id).map(r -> {
            r.setStatus(Recruitment.RecruitmentStatus.CLOSED);
            recruitmentRepository.save(r);
            return ResponseEntity.ok(Map.of("message", "Closed."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Applications for a recruitment ──

    @GetMapping("/{id}/applications")
    public ResponseEntity<?> getApplications(@PathVariable Integer id) {
        return ResponseEntity.ok(applicationRepository.findByRecruitmentId(id).stream().map(this::appToMap).toList());
    }

    @GetMapping("/applications/hired")
    public ResponseEntity<?> getAllHired() {
        return ResponseEntity.ok(applicationRepository.findAll().stream()
                .filter(a -> a.getApplicationStatus() == Application.ApplicationStatus.HIRED)
                .map(this::appToMap).toList());
    }

    @GetMapping("/my-applications")
    public ResponseEntity<?> getMyApplications(Authentication auth) {
        return applicantRepository.findByEmail(auth.getName())
                .map(applicant -> ResponseEntity.ok(
                        applicationRepository.findByApplicantId(applicant.getId()).stream()
                                .map(a -> {
                                    Map<String, Object> m = new HashMap<>();
                                    m.put("id", a.getId());
                                    m.put("jobTitle", a.getRecruitment().getJobTitle());
                                    m.put("department", a.getRecruitment().getDepartment() != null ? a.getRecruitment().getDepartment() : "");
                                    m.put("batchCode", a.getRecruitment().getBatchCode() != null ? a.getRecruitment().getBatchCode() : "");
                                    m.put("appliedAt", a.getAppliedAt() != null ? a.getAppliedAt().toLocalDate().toString() : "");
                                    m.put("status", a.getApplicationStatus().name());
                                    m.put("recruitmentId", a.getRecruitment().getId());
                                    return m;
                                }).toList()
                ))
                .orElse(ResponseEntity.ok(List.of()));
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<?> applyInternal(@PathVariable Integer id, Authentication auth) {
        return recruitmentRepository.findById(id).map(r -> {
            // find or create applicant record for this employee
            Applicant applicant = applicantRepository.findByEmail(auth.getName()).orElseGet(() -> {
                Applicant a = new Applicant();
                a.setEmail(auth.getName());
                a.setApplicantType(Applicant.ApplicantType.INTERNAL);
                userRepository.findByEmail(auth.getName()).ifPresent(u -> a.setFullName(u.getFullName()));
                return applicantRepository.save(a);
            });

            if (applicationRepository.existsByRecruitmentIdAndApplicantId(r.getId(), applicant.getId())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Already applied."));
            }

            Application app = new Application();
            app.setRecruitment(r);
            app.setApplicant(applicant);
            app.setApplicationStatus(Application.ApplicationStatus.SUBMITTED);
            applicationRepository.save(app);

            return ResponseEntity.ok(Map.of("message", "Application submitted."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/applications/{appId}/status")
    public ResponseEntity<?> updateAppStatus(@PathVariable Integer appId,
                                             @RequestBody Map<String, String> body) {
        return applicationRepository.findById(appId).map(a -> {
            a.setApplicationStatus(Application.ApplicationStatus.valueOf(body.get("status")));
            applicationRepository.save(a);
            return ResponseEntity.ok(Map.of("message", "Status updated."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Vacancy Post (INTERNAL posted recruitments) ──

    @GetMapping("/vacancy-posts")
    public ResponseEntity<?> getVacancyPosts(@RequestParam(required = false) String search) {
        String q = search != null ? search.toLowerCase().trim() : "";
        List<?> result = postRepository.findAll().stream()
                .filter(p -> p.getPostType() == RecruitmentPost.PostType.INTERNAL
                        && (q.isEmpty()
                            || (p.getRecruitment().getJobTitle() != null && p.getRecruitment().getJobTitle().toLowerCase().contains(q))
                            || (p.getRecruitment().getBatchCode() != null && p.getRecruitment().getBatchCode().toLowerCase().contains(q))))
                .map(p -> {
                    Recruitment r = p.getRecruitment();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("postId", p.getId());
                    m.put("jobTitle", r.getJobTitle());
                    m.put("department", r.getDepartment() != null ? r.getDepartment() : "");
                    m.put("batchCode", r.getBatchCode() != null ? r.getBatchCode() : "");
                    m.put("vacancyNumber", r.getVacancyNumber() != null ? r.getVacancyNumber() : 0);
                    m.put("salary", r.getSalary() != null ? r.getSalary() : "");
                    m.put("jobLocation", r.getJobLocation() != null ? r.getJobLocation() : "");
                    m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("postDate", p.getPostDate() != null ? p.getPostDate().toLocalDate().toString() : "");
                    m.put("status", r.getStatus().name());
                    m.put("applicantCount", applicationRepository.findByRecruitmentId(r.getId()).size());
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }

    // ── Registered Candidates (all INTERNAL applications) ──

    @GetMapping("/internal-applications")
    public ResponseEntity<?> getInternalApplications() {
        List<?> result = applicationRepository.findAll().stream()
                .filter(a -> a.getApplicant().getApplicantType() == Applicant.ApplicantType.INTERNAL)
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", a.getId());
                    m.put("applicantName", a.getApplicant().getFullName() != null ? a.getApplicant().getFullName() : "");
                    m.put("applicantEmail", a.getApplicant().getEmail() != null ? a.getApplicant().getEmail() : "");
                    m.put("jobTitle", a.getRecruitment().getJobTitle());
                    m.put("department", a.getRecruitment().getDepartment() != null ? a.getRecruitment().getDepartment() : "");
                    m.put("batchCode", a.getRecruitment().getBatchCode() != null ? a.getRecruitment().getBatchCode() : "");
                    m.put("appliedAt", a.getAppliedAt() != null ? a.getAppliedAt().toLocalDate().toString() : "");
                    m.put("status", a.getApplicationStatus().name());
                    m.put("recruitmentId", a.getRecruitment().getId());
                    m.put("writtenScore", a.getWrittenScore());
                    m.put("interviewScore", a.getInterviewScore());
                    m.put("practicalScore", a.getPracticalScore());
                    m.put("totalScore", a.getTotalScore());
                    m.put("isPromoted", a.getIsPromoted() != null ? a.getIsPromoted() : false);
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }

    // ── Update scores for an application ──

    @PutMapping("/applications/{appId}/scores")
    public ResponseEntity<?> updateScores(@PathVariable Integer appId,
                                          @RequestBody Map<String, Object> body) {
        return applicationRepository.findById(appId).map(a -> {
            if (body.containsKey("writtenScore")) a.setWrittenScore(body.get("writtenScore") != null ? Integer.parseInt(body.get("writtenScore").toString()) : null);
            if (body.containsKey("interviewScore")) a.setInterviewScore(body.get("interviewScore") != null ? Integer.parseInt(body.get("interviewScore").toString()) : null);
            if (body.containsKey("practicalScore")) a.setPracticalScore(body.get("practicalScore") != null ? Integer.parseInt(body.get("practicalScore").toString()) : null);
            // recalculate total
            int count = 0; int sum = 0;
            if (a.getWrittenScore() != null) { sum += a.getWrittenScore(); count++; }
            if (a.getInterviewScore() != null) { sum += a.getInterviewScore(); count++; }
            if (a.getPracticalScore() != null) { sum += a.getPracticalScore(); count++; }
            a.setTotalScore(count > 0 ? Math.round((float) sum / count) : null);
            applicationRepository.save(a);
            return ResponseEntity.ok(Map.of("message", "Scores updated.", "totalScore", a.getTotalScore() != null ? a.getTotalScore() : 0));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Promote an application ──

    @PostMapping("/applications/{appId}/promote")
    public ResponseEntity<?> promoteApplication(@PathVariable Integer appId) {
        return applicationRepository.findById(appId).map(a -> {
            a.setApplicationStatus(Application.ApplicationStatus.PROMOTED);
            a.setIsPromoted(true);
            applicationRepository.save(a);
            return ResponseEntity.ok(Map.of("message", "Candidate promoted."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Criteria CRUD ──

    @GetMapping("/{id}/criteria")
    public ResponseEntity<?> getCriteria(@PathVariable Integer id) {
        return ResponseEntity.ok(criteriaRepository.findByRecruitmentId(id).stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("criteriaName", c.getCriteriaName());
            m.put("criteriaType", c.getCriteriaType() != null ? c.getCriteriaType().name() : "TEXT");
            m.put("isRequired", c.getIsRequired() != null ? c.getIsRequired() : true);
            m.put("recruitmentId", c.getRecruitment().getId());
            m.put("jobTitle", c.getRecruitment().getJobTitle());
            return m;
        }).toList());
    }

    @PostMapping("/{id}/criteria")
    public ResponseEntity<?> addCriteria(@PathVariable Integer id,
                                         @RequestBody Map<String, Object> body) {
        return recruitmentRepository.findById(id).map(r -> {
            RecruitmentCriteria c = new RecruitmentCriteria();
            c.setRecruitment(r);
            c.setCriteriaName(body.getOrDefault("criteriaName", "").toString());
            String type = body.getOrDefault("criteriaType", "TEXT").toString();
            c.setCriteriaType(RecruitmentCriteria.CriteriaType.valueOf(type));
            c.setIsRequired(body.get("isRequired") == null || Boolean.parseBoolean(body.get("isRequired").toString()));
            criteriaRepository.save(c);
            return ResponseEntity.ok(Map.of("message", "Criteria added."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/criteria/{criteriaId}")
    public ResponseEntity<?> deleteCriteria(@PathVariable Integer criteriaId) {
        if (!criteriaRepository.existsById(criteriaId)) return ResponseEntity.notFound().build();
        criteriaRepository.deleteById(criteriaId);
        return ResponseEntity.ok(Map.of("message", "Deleted."));
    }

    private Map<String, Object> appToMap(Application a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", a.getId());
        m.put("applicantName", a.getApplicant().getFullName() != null ? a.getApplicant().getFullName() : "");
        m.put("applicantEmail", a.getApplicant().getEmail() != null ? a.getApplicant().getEmail() : "");
        m.put("applicantPhone", a.getApplicant().getPhone() != null ? a.getApplicant().getPhone() : "");
        m.put("applicantLocation", a.getApplicant().getLocation() != null ? a.getApplicant().getLocation() : "");
        m.put("applicantGender", a.getApplicant().getGender() != null ? a.getApplicant().getGender() : "");
        m.put("applicantGithub", a.getApplicant().getGithubUrl() != null ? a.getApplicant().getGithubUrl() : "");
        m.put("applicantLinkedin", a.getApplicant().getLinkedinUrl() != null ? a.getApplicant().getLinkedinUrl() : "");
        m.put("applicantType", a.getApplicant().getApplicantType() != null ? a.getApplicant().getApplicantType().name() : "");
        m.put("status", a.getApplicationStatus().name());
        m.put("appliedAt", a.getAppliedAt() != null ? a.getAppliedAt().toString() : "");
        m.put("recruitmentId", a.getRecruitment().getId());
        m.put("jobTitle", a.getRecruitment().getJobTitle());
        return m;
    }

    private Map<String, Object> toMap(Recruitment r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("jobTitle", r.getJobTitle());
        m.put("department", r.getDepartment() != null ? r.getDepartment() : "");
        m.put("vacancyNumber", r.getVacancyNumber() != null ? r.getVacancyNumber() : 0);
        m.put("status", r.getStatus().name());
        m.put("referralCode", r.getReferralCode() != null ? r.getReferralCode() : "");
        m.put("description", r.getDescription() != null ? r.getDescription() : "");
        m.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        m.put("jobLocation", r.getJobLocation() != null ? r.getJobLocation() : "");
        m.put("batchCode", r.getBatchCode() != null ? r.getBatchCode() : "");
        m.put("salary", r.getSalary() != null ? r.getSalary() : "");
        m.put("hiringType", r.getHiringType() != null ? r.getHiringType() : "");
        m.put("recorderName", r.getRecorderName() != null ? r.getRecorderName() : "");
        m.put("candidateIdentificationMethod", r.getCandidateIdentificationMethod() != null ? r.getCandidateIdentificationMethod() : "");
        m.put("jobQualificationId", r.getJobQualification() != null ? r.getJobQualification().getId() : "");
        m.put("vacancyType", r.getVacancyType() != null ? r.getVacancyType() : "");
        // include post dates if posted
        postRepository.findAll().stream()
                .filter(p -> p.getRecruitment().getId().equals(r.getId()))
                .findFirst()
                .ifPresent(p -> {
                    m.put("postingDate", p.getPostDate() != null ? p.getPostDate().toLocalDate().toString() : "");
                    m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                });
        if (!m.containsKey("postingDate")) { m.put("postingDate", ""); m.put("closingDate", ""); }
        return m;
    }
}
