package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExamResultRepository extends JpaRepository<ExamResult, Integer> {
    
    @Query("SELECT er FROM ExamResult er WHERE er.application.id = :applicationId")
    List<ExamResult> findByApplicationId(@Param("applicationId") Integer applicationId);
    
    @Query("SELECT er FROM ExamResult er WHERE er.application.id = :applicationId AND er.criteria.id = :criteriaId")
    Optional<ExamResult> findByApplicationIdAndCriteriaId(@Param("applicationId") Integer applicationId, @Param("criteriaId") Integer criteriaId);
    
    @Query("SELECT er FROM ExamResult er WHERE er.application.recruitment.id = :recruitmentId")
    List<ExamResult> findByRecruitmentId(@Param("recruitmentId") Integer recruitmentId);
}
