package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.JobQualificationEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobQualificationEntryRepository extends JpaRepository<JobQualificationEntry, Integer> {
    List<JobQualificationEntry> findByJobQualificationId(Integer jobQualificationId);
    void deleteByJobQualificationId(Integer jobQualificationId);
}
