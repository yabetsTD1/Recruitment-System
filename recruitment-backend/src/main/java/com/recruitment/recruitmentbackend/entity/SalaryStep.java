package com.recruitment.recruitmentbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "salary_steps")
@Data
@NoArgsConstructor
public class SalaryStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_setting_id", nullable = false)
    private SalarySetting salarySetting;

    @Column(name = "increment_step", nullable = false)
    private Integer incrementStep;  // e.g. 0, 1, 2, 3 ...

    @Column(name = "salary", nullable = false)
    private Long salary;
}
