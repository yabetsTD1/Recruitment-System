package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recruitment_posts")
@Data
@NoArgsConstructor
public class RecruitmentPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruitment_id", nullable = false)
    private Recruitment recruitment;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false)
    private PostType postType;

    @CreationTimestamp
    @Column(name = "post_date", updatable = false)
    private LocalDateTime postDate;

    @Column(name = "closing_date")
    private LocalDate closingDate;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    public enum PostType { INTERNAL, EXTERNAL }
}
