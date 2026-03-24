package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "recruitment_criteria")
@Data
@NoArgsConstructor
public class RecruitmentCriteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruitment_id", nullable = false)
    private Recruitment recruitment;

    @Column(name = "criteria_name", nullable = false, length = 200)
    private String criteriaName;

    @Enumerated(EnumType.STRING)
    @Column(name = "criteria_type")
    private CriteriaType criteriaType;

    @Column(name = "is_required")
    private Boolean isRequired = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum CriteriaType { TEXT, NUMBER, DATE, BOOLEAN, SELECT }
}
