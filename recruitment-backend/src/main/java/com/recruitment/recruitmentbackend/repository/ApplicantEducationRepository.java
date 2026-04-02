package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.ApplicantEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicantEducationRepository extends JpaRepository<ApplicantEducation, Integer> {
    List<ApplicantEducation> findByApplicantId(Integer applicantId);
    void deleteByApplicantId(Integer applicantId);
}
