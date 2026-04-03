package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "employee_id", unique = true, nullable = false, length = 50)
    private String employeeId;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "email", unique = true, nullable = false, length = 150)
    private String email;

    @Column(name = "username", unique = true, length = 100)
    private String username;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "department", length = 150)
    private String department;

    @Column(name = "position", length = 150)
    private String position;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "title", length = 20)
    private String title;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "nation", length = 100)
    private String nation;

    @Column(name = "graduated_from", length = 200)
    private String graduatedFrom;

    @Column(name = "gpa", precision = 3, scale = 2)
    private java.math.BigDecimal gpa;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "other_info", columnDefinition = "TEXT")
    private String otherInfo;

    @Column(name = "contract_end_date")
    private java.time.LocalDate contractEndDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum EmployeeStatus { ACTIVE, INACTIVE }
}
