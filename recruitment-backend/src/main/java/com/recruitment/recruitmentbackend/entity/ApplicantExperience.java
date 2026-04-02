package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "applicant_experience")
@Data
@NoArgsConstructor
public class ApplicantExperience {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    @Column(name = "job_title", length = 200)
    private String jobTitle;

    @Column(name = "institution", length = 300)
    private String institution;

    @Column(name = "organization_type", length = 100)
    private String organizationType;

    @Column(name = "employment_type", length = 100)
    private String employmentType;

    @Column(name = "responsibility", columnDefinition = "TEXT")
    private String responsibility;

    @Column(name = "salary", length = 100)
    private String salary;

    @Column(name = "start_date", length = 20)
    private String startDate;

    @Column(name = "end_date", length = 20)
    private String endDate;

    @Column(name = "termination_reason", length = 300)
    private String terminationReason;
}
