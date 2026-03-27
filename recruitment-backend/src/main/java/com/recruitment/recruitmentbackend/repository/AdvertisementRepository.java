package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.Advertisement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AdvertisementRepository extends JpaRepository<Advertisement, Integer> {
    List<Advertisement> findByRecruitmentId(Integer recruitmentId);
    void deleteByRecruitmentId(Integer recruitmentId);
    
    @Query("SELECT a FROM Advertisement a JOIN a.recruitment r WHERE " +
           "LOWER(r.batchCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(r.jobTitle) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Advertisement> searchByBatchCodeOrJobTitle(@Param("search") String search);
}
