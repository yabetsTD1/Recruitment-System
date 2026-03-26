package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "salary_settings")
@Data
@NoArgsConstructor
public class SalarySetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "class_code", length = 20)
    private String classCode;       // e.g. O, A, B, C ...

    @Column(name = "icf", length = 20)
    private String icf;             // Increment Classification Factor e.g. 1-10

    @Column(name = "beginning_salary")
    private Long beginningSalary;

    @Column(name = "max_salary")
    private Long maxSalary;
}
