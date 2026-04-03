package com.recruitment.recruitmentbackend.service;

import com.recruitment.recruitmentbackend.entity.Applicant;
import com.recruitment.recruitmentbackend.entity.Application;
import com.recruitment.recruitmentbackend.entity.Employee;
import com.recruitment.recruitmentbackend.entity.Role;
import com.recruitment.recruitmentbackend.entity.User;
import com.recruitment.recruitmentbackend.repository.ApplicantRepository;
import com.recruitment.recruitmentbackend.repository.ApplicationRepository;
import com.recruitment.recruitmentbackend.repository.EmployeeRepository;
import com.recruitment.recruitmentbackend.repository.RoleRepository;
import com.recruitment.recruitmentbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ApplicantService {

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Application> getHiredApplications() {
        return applicationRepository.findByApplicationStatus(Application.ApplicationStatus.HIRED);
    }

    /**
     * Converts a hired applicant into an Employee record and optionally creates a system User account.
     * All applicant fields are copied to the Employee. The employeeId is set to "EMP-{applicantId}".
     * The Applicant.employee reference is updated to point to the new Employee.
     */
    public Map<String, Object> convertToEmployee(Integer applicantId, String tempPassword) {
        Applicant a = applicantRepository.findById(applicantId)
                .orElseThrow(() -> new IllegalArgumentException("Applicant not found."));

        String fullName = a.getFullName() != null ? a.getFullName()
                : ((a.getFirstName() != null ? a.getFirstName() : "") + " "
                + (a.getMiddleName() != null ? a.getMiddleName() + " " : "")
                + (a.getLastName() != null ? a.getLastName() : "")).trim();

        // Use applicant's own ID as the employee ID
        String empId = "EMP-" + applicantId;

        // Create or update Employee record
        Employee employee;
        boolean alreadyExists = a.getEmail() != null && employeeRepository.findByEmail(a.getEmail()).isPresent();
        if (alreadyExists) {
            employee = employeeRepository.findByEmail(a.getEmail()).get();
        } else {
            employee = new Employee();
        }

        // Copy all fields from Applicant → Employee
        employee.setEmployeeId(empId);
        employee.setFullName(fullName);
        employee.setEmail(a.getEmail() != null ? a.getEmail() : "");
        employee.setUsername(a.getEmail() != null ? a.getEmail() : empId);
        employee.setPhone(a.getPhone() != null ? a.getPhone() : "");
        employee.setGender(a.getGender());
        employee.setTitle(a.getTitle());
        employee.setLocation(a.getLocation());
        employee.setNation(a.getNation());
        employee.setGraduatedFrom(a.getGraduatedFrom());
        employee.setGpa(a.getGpa());
        employee.setExperienceYears(a.getExperienceYears());
        employee.setGithubUrl(a.getGithubUrl());
        employee.setLinkedinUrl(a.getLinkedinUrl());
        employee.setOtherInfo(a.getOtherInfo());
        // Position from the hired job title (from application)
        applicationRepository.findByApplicantId(applicantId).stream()
                .filter(app -> app.getApplicationStatus() == com.recruitment.recruitmentbackend.entity.Application.ApplicationStatus.HIRED)
                .findFirst()
                .ifPresent(app -> {
                    if (app.getRecruitment() != null) {
                        employee.setPosition(app.getRecruitment().getJobTitle());
                        employee.setDepartment(app.getRecruitment().getDepartment());
                    }
                });

        if (!alreadyExists) {
            String pwd = (tempPassword != null && !tempPassword.isEmpty()) ? tempPassword : "Welcome@123";
            employee.setPassword(passwordEncoder.encode(pwd));
        }
        employee.setStatus(Employee.EmployeeStatus.ACTIVE);
        Employee savedEmployee = employeeRepository.save(employee);

        // Link applicant back to the employee record
        a.setEmployee(savedEmployee);
        applicantRepository.save(a);

        // Create system User account if not already exists
        Integer userId = null;
        if (a.getEmail() != null && !userRepository.existsByEmail(a.getEmail())) {
            Role role = roleRepository.findByRoleName("EMPLOYEE").orElseThrow();
            User user = new User();
            user.setFullName(fullName);
            user.setUsername(a.getEmail());
            user.setEmail(a.getEmail());
            String pwd = (tempPassword != null && !tempPassword.isEmpty()) ? tempPassword : "Welcome@123";
            user.setPassword(passwordEncoder.encode(pwd));
            user.setRole(role);
            user.setStatus(User.UserStatus.ACTIVE);
            User saved = userRepository.save(user);
            userId = saved.getId();
        } else if (a.getEmail() != null) {
            userId = userRepository.findByEmail(a.getEmail()).map(User::getId).orElse(null);
        }

        return Map.of(
                "employeeId", savedEmployee.getId(),
                "employeeCode", empId,
                "userId", userId != null ? userId : "",
                "message", "Converted to employee successfully."
        );
    }
}
