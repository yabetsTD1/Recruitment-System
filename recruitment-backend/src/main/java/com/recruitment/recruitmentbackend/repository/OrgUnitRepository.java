package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.OrgUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrgUnitRepository extends JpaRepository<OrgUnit, Integer> {
    List<OrgUnit> findByParentId(Integer parentId);
    List<OrgUnit> findByParentIdIsNull();
}
