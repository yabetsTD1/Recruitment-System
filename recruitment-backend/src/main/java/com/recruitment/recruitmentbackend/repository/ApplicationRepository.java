package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByRecruitmentId(Integer recruitmentId);
    List<Application> findByApplicantId(Integer applicantId);
    boolean existsByRecruitmentIdAndApplicantId(Integer recruitmentId, Integer applicantId);
    List<Application> findByApplicationStatus(Application.ApplicationStatus status);
}
