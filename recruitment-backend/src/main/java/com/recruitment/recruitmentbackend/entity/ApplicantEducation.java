package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "applicant_education")
@Data
@NoArgsConstructor
public class ApplicantEducation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    @Column(name = "institution", length = 300)
    private String institution;

    @Column(name = "field_of_study", length = 200)
    private String fieldOfStudy;

    @Column(name = "education_level", length = 100)
    private String educationLevel;

    @Column(name = "start_date", length = 20)
    private String startDate;

    @Column(name = "end_date", length = 20)
    private String endDate;

    @Column(name = "paid_by", length = 100)
    private String paidBy;

    @Column(name = "location", length = 200)
    private String location;
}
