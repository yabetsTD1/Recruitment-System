package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.RecruitmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecruitmentRequestRepository extends JpaRepository<RecruitmentRequest, Integer> {
    List<RecruitmentRequest> findByRequestStatus(RecruitmentRequest.RequestStatus status);
    List<RecruitmentRequest> findByRecruitmentId(Integer recruitmentId);
}
