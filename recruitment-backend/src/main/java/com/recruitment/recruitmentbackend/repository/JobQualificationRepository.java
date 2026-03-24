package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.JobQualification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobQualificationRepository extends JpaRepository<JobQualification, Integer> {
    List<JobQualification> findByJobTypeId(Integer jobTypeId);
}
