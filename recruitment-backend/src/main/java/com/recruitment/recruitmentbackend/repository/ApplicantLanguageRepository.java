package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.ApplicantLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicantLanguageRepository extends JpaRepository<ApplicantLanguage, Integer> {
    List<ApplicantLanguage> findByApplicantId(Integer applicantId);
    void deleteByApplicantId(Integer applicantId);
}
