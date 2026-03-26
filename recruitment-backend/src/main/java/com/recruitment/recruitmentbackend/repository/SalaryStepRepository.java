package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.SalaryStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryStepRepository extends JpaRepository<SalaryStep, Integer> {
    List<SalaryStep> findBySalarySettingIdOrderByIncrementStep(Integer salarySettingId);
    void deleteBySalarySettingId(Integer salarySettingId);
}
