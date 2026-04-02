package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "applicant_languages")
@Data
@NoArgsConstructor
public class ApplicantLanguage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private Applicant applicant;

    @Column(name = "language", length = 100)
    private String language;

    @Column(name = "writing", length = 50)
    private String writing;

    @Column(name = "listening", length = 50)
    private String listening;

    @Column(name = "reading", length = 50)
    private String reading;

    @Column(name = "speaking", length = 50)
    private String speaking;
}
