package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.ApplicantExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicantExperienceRepository extends JpaRepository<ApplicantExperience, Integer> {
    List<ApplicantExperience> findByApplicantId(Integer applicantId);
    void deleteByApplicantId(Integer applicantId);
}
