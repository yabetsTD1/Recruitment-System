package com.recruitment.recruitmentbackend.repository;

import com.recruitment.recruitmentbackend.entity.RecruitmentPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecruitmentPostRepository extends JpaRepository<RecruitmentPost, Integer> {
    List<RecruitmentPost> findByPostType(RecruitmentPost.PostType postType);
    List<RecruitmentPost> findByRecruitmentId(Integer recruitmentId);
}
