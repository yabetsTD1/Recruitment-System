package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_qualifications")
@Data
@NoArgsConstructor
public class JobQualification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_type_id", nullable = false)
    private JobType jobType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_job_id")
    private RegisteredJob registeredJob;

    @Column(name = "job_title", nullable = false, length = 200)
    private String jobTitle;

    @Column(name = "min_degree", length = 200)
    private String minDegree;

    @Column(name = "min_experience", length = 100)
    private String minExperience;

    @Column(name = "required_skills", columnDefinition = "TEXT")
    private String requiredSkills;

    @Column(name = "grade", length = 50)
    private String grade;

    @Column(name = "competency_framework", columnDefinition = "TEXT")
    private String competencyFramework;

    @Column(name = "full_description", columnDefinition = "TEXT")
    private String fullDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private QualificationStatus status = QualificationStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum QualificationStatus { DRAFT, ACTIVE }
}
