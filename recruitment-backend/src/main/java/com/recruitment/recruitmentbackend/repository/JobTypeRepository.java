package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.JobType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobTypeRepository extends JpaRepository<JobType, Integer> {
}
