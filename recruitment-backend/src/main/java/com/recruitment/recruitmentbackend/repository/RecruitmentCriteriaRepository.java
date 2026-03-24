package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.RecruitmentCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecruitmentCriteriaRepository extends JpaRepository<RecruitmentCriteria, Integer> {
    List<RecruitmentCriteria> findByRecruitmentId(Integer recruitmentId);
}
