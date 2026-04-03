package com.recruitment.recruitmentbackend.service;

import com.recruitment.recruitmentbackend.entity.Recruitment;
import com.recruitment.recruitmentbackend.entity.RecruitmentPost;
import com.recruitment.recruitmentbackend.repository.RecruitmentRepository;
import com.recruitment.recruitmentbackend.repository.RecruitmentPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

    private final RecruitmentRepository recruitmentRepository;
    private final RecruitmentPostRepository postRepository;

    public List<Recruitment> getAll() {
        return recruitmentRepository.findAll();
    }

    public List<RecruitmentPost> getActiveExternalPosts() {
        LocalDate now = LocalDate.now();
        return postRepository.findAll().stream()
                .filter(p -> p.getPostType() == RecruitmentPost.PostType.EXTERNAL
                        && p.getRecruitment().getStatus() == Recruitment.RecruitmentStatus.POSTED
                        && (p.getClosingDate() == null || !p.getClosingDate().isBefore(now)))
                .collect(Collectors.toList());
    }

    public List<RecruitmentPost> getActiveInternalPosts(String search) {
        LocalDate now = LocalDate.now();
        String q = search != null ? search.toLowerCase().trim() : "";
        return postRepository.findAll().stream()
                .filter(p -> p.getPostType() == RecruitmentPost.PostType.INTERNAL
                        && p.getRecruitment().getStatus() == Recruitment.RecruitmentStatus.POSTED
                        && (p.getClosingDate() == null || !p.getClosingDate().isBefore(now))
                        && (q.isEmpty()
                            || (p.getRecruitment().getJobTitle() != null && p.getRecruitment().getJobTitle().toLowerCase().contains(q))
                            || (p.getRecruitment().getBatchCode() != null && p.getRecruitment().getBatchCode().toLowerCase().contains(q))))
                .collect(Collectors.toList());
    }
}
