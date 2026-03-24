package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Integer userId);
}
