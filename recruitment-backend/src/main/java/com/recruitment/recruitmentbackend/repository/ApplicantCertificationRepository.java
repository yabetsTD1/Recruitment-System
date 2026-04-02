package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.ApplicantCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicantCertificationRepository extends JpaRepository<ApplicantCertification, Integer> {
    List<ApplicantCertification> findByApplicantId(Integer applicantId);
    void deleteByApplicantId(Integer applicantId);
}
