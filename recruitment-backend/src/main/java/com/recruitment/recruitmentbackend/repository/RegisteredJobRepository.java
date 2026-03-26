package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.RegisteredJob;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegisteredJobRepository extends JpaRepository<RegisteredJob, Integer> {}
