package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "job_qualification_entries")
@Data
@NoArgsConstructor
public class JobQualificationEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_qualification_id", nullable = false)
    private JobQualification jobQualification;

    @Column(name = "education_category", length = 200)
    private String educationCategory;   // e.g. Natural Science, Social Science

    @Column(name = "education_level", length = 100)
    private String educationLevel;      // e.g. BSc, MSc, PhD

    @Column(name = "field_of_study", length = 200)
    private String fieldOfStudy;        // e.g. Business management and Entrepreneurship

    @Column(name = "min_experience", length = 50)
    private String minExperience;       // e.g. 0, 2, 5

    @Column(name = "skill", columnDefinition = "TEXT")
    private String skill;

    @Column(name = "knowledge", columnDefinition = "TEXT")
    private String knowledge;

    @Column(name = "competency", columnDefinition = "TEXT")
    private String competency;
}
