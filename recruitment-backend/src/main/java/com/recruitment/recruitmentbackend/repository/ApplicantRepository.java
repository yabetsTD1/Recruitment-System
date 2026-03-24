package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ApplicantRepository extends JpaRepository<Applicant, Integer> {
    Optional<Applicant> findByEmail(String email);
    boolean existsByEmail(String email);
}
