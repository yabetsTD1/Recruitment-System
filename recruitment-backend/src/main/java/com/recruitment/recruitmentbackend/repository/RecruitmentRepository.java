package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.Recruitment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecruitmentRepository extends JpaRepository<Recruitment, Integer> {
    List<Recruitment> findByStatus(Recruitment.RecruitmentStatus status);
}
