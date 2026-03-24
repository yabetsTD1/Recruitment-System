package com.recruitment.recruitmentbackend.controller;

import com.recruitment.recruitmentbackend.entity.*;
import com.recruitment.recruitmentbackend.repository.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final RecruitmentRepository recruitmentRepository;
    private final RecruitmentPostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final PasswordEncoder passwordEncoder;

    @Data
    static class ApplyRequest {
        String fullName;
        String email;
        String phone;
        String location;
        String gender;
        String githubUrl;
        String linkedinUrl;
        String password;
        Integer recruitmentId;
    }

    // Public job listings — EXTERNAL only (posted + vacancyType = Outside)
    @GetMapping("/jobs")
    public ResponseEntity<?> getJobs() {
        LocalDate now = LocalDate.now();
        List<?> jobs = postRepository.findAll().stream()
                .filter(p -> p.getPostType() == RecruitmentPost.PostType.EXTERNAL
                        && p.getRecruitment().getStatus() == Recruitment.RecruitmentStatus.POSTED
                        && (p.getClosingDate() == null || !p.getClosingDate().isBefore(now)))
                .map(p -> {
                    Recruitment r = p.getRecruitment();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("jobTitle", r.getJobTitle());
                    m.put("department", r.getDepartment() != null ? r.getDepartment() : "");
                    m.put("vacancyNumber", r.getVacancyNumber() != null ? r.getVacancyNumber() : 0);
                    m.put("description", r.getDescription() != null ? r.getDescription() : "");
                    m.put("salary", r.getSalary() != null ? r.getSalary() : "");
                    m.put("jobLocation", r.getJobLocation() != null ? r.getJobLocation() : "");
                    m.put("hiringType", r.getHiringType() != null ? r.getHiringType() : "");
                    m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("batchCode", r.getBatchCode() != null ? r.getBatchCode() : "");
                    return m;
                }).toList();
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<?> getJob(@PathVariable Integer id) {
        LocalDate now = LocalDate.now();
        // Find the EXTERNAL post for this recruitment
        return postRepository.findAll().stream()
                .filter(p -> p.getRecruitment().getId().equals(id)
                        && p.getPostType() == RecruitmentPost.PostType.EXTERNAL)
                .findFirst()
                .map(p -> {
                    Recruitment r = p.getRecruitment();
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("jobTitle", r.getJobTitle());
                    m.put("department", r.getDepartment() != null ? r.getDepartment() : "");
                    m.put("vacancyNumber", r.getVacancyNumber() != null ? r.getVacancyNumber() : 0);
                    m.put("description", r.getDescription() != null ? r.getDescription() : "");
                    m.put("salary", r.getSalary() != null ? r.getSalary() : "");
                    m.put("jobLocation", r.getJobLocation() != null ? r.getJobLocation() : "");
                    m.put("hiringType", r.getHiringType() != null ? r.getHiringType() : "");
                    m.put("batchCode", r.getBatchCode() != null ? r.getBatchCode() : "");
                    m.put("closingDate", p.getClosingDate() != null ? p.getClosingDate().toString() : "");
                    m.put("status", r.getStatus().name());
                    return ResponseEntity.ok((Object) m);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // External application
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody ApplyRequest req) {
        Recruitment recruitment = recruitmentRepository.findById(req.getRecruitmentId())
                .orElse(null);
        if (recruitment == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Job not found."));
        }

        // Find or create applicant
        Applicant applicant = applicantRepository.findByEmail(req.getEmail()).orElseGet(() -> {
            Applicant a = new Applicant();
            a.setApplicantType(Applicant.ApplicantType.EXTERNAL);
            a.setFullName(req.getFullName());
            a.setEmail(req.getEmail());
            a.setPhone(req.getPhone());
            a.setLocation(req.getLocation());
            a.setGender(req.getGender());
            if (req.getGithubUrl() != null && !req.getGithubUrl().isEmpty()) a.setGithubUrl(req.getGithubUrl());
            if (req.getLinkedinUrl() != null && !req.getLinkedinUrl().isEmpty()) a.setLinkedinUrl(req.getLinkedinUrl());
            if (req.getPassword() != null && !req.getPassword().isEmpty()) {
                a.setPassword(passwordEncoder.encode(req.getPassword()));
            }
            return applicantRepository.save(a);
        });

        if (applicationRepository.existsByRecruitmentIdAndApplicantId(
                recruitment.getId(), applicant.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Already applied."));
        }

        Application app = new Application();
        app.setRecruitment(recruitment);
        app.setApplicant(applicant);
        app.setApplicationStatus(Application.ApplicationStatus.SUBMITTED);
        applicationRepository.save(app);

        return ResponseEntity.ok(Map.of("message", "Application submitted successfully."));
    }
}
