package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.ApplicantDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicantDocumentRepository extends JpaRepository<ApplicantDocument, Integer> {
    List<ApplicantDocument> findByApplicantId(Integer applicantId);
    void deleteByApplicantId(Integer applicantId);
}
