package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
@Entity
@Table(name = "recruitments")
@Data
@NoArgsConstructor
public class Recruitment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "job_title", nullable = false, length = 200)
    private String jobTitle;

    @Column(name = "department", length = 150)
    private String department;

    @Column(name = "referral_code", unique = true, length = 100)
    private String referralCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "vacancy_number")
    private Integer vacancyNumber;

    @Column(name = "job_location", length = 200)
    private String jobLocation;

    @Column(name = "competency_framework", columnDefinition = "TEXT")
    private String competencyFramework;

    @Column(name = "recorder_name", length = 200)
    private String recorderName;

    @Column(name = "batch_code", unique = true, length = 50)
    private String batchCode;

    @Column(name = "salary", length = 100)
    private String salary;

    @Column(name = "hiring_type", length = 50)
    private String hiringType;

    @Column(name = "candidate_identification_method", length = 200)
    private String candidateIdentificationMethod;

    @Column(name = "vacancy_type", length = 50)
    private String vacancyType; // "Inside" or "Outside"

    @Column(name = "icf", length = 20)
    private String icf;

    @Column(name = "increment_step", length = 20)
    private String incrementStep;

    @Column(name = "employment_type", length = 50)
    private String employmentType;

    @Column(name = "budget_year", length = 10)
    private String budgetYear;

    @Column(name = "recruitment_type", length = 100)
    private String recruitmentType;

    @Column(name = "position_name", length = 200)
    private String positionName;

    @Column(name = "class_code", length = 20)
    private String classCode;

    @Column(name = "pass_mark")
    private Double passMark = 60.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_qualification_id")
    private JobQualification jobQualification;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RecruitmentStatus status = RecruitmentStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum RecruitmentStatus { DRAFT, REQUESTED, APPROVED, REJECTED, POSTED, CLOSED }
}
