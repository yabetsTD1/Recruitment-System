package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Data
@NoArgsConstructor
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruitment_id", nullable = false)
    private Recruitment recruitment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_status")
    private ApplicationStatus applicationStatus = ApplicationStatus.SUBMITTED;

    @CreationTimestamp
    @Column(name = "applied_at", updatable = false)
    private LocalDateTime appliedAt;

    @Column(name = "written_score")
    private Integer writtenScore;

    @Column(name = "interview_score")
    private Integer interviewScore;

    @Column(name = "practical_score")
    private Integer practicalScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "is_promoted")
    private Boolean isPromoted = false;

    public enum ApplicationStatus { SUBMITTED, UNDER_REVIEW, SHORTLISTED, REJECTED, HIRED, PROMOTED }
}
