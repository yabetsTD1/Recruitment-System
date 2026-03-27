-- Run this manually in MySQL before starting the app:
-- mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS recruitment_system;
USE recruitment_system;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status ENUM('ACTIVE','DISABLED') DEFAULT 'ACTIVE',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(150),
    position VARCHAR(150),
    phone VARCHAR(30),
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS applicants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_type ENUM('INTERNAL','EXTERNAL') NOT NULL,
    employee_id INT,
    full_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(30),
    password VARCHAR(255),
    location VARCHAR(200),
    gender VARCHAR(20),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    gpa DECIMAL(3,2),
    experience_years INT,
    graduated_from VARCHAR(200),
    nation VARCHAR(100),
    physical_disability VARCHAR(200),
    relevant_skills TEXT,
    other_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS recruitments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_title VARCHAR(200) NOT NULL,
    department VARCHAR(150),
    referral_code VARCHAR(100) UNIQUE,
    description TEXT,
    vacancy_number INT,
    status ENUM('DRAFT','REQUESTED','APPROVED','REJECTED','POSTED','CLOSED') DEFAULT 'DRAFT',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recruitment_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruitment_id INT NOT NULL,
    criteria_name VARCHAR(200) NOT NULL,
    criteria_type ENUM('TEXT','NUMBER','DATE','BOOLEAN','SELECT','EXAM'),
    is_required BOOLEAN DEFAULT TRUE,
    weight DOUBLE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruitment_id) REFERENCES recruitments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recruitment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruitment_id INT NOT NULL,
    requested_by INT,
    request_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    request_note TEXT,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruitment_id) REFERENCES recruitments(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recruitment_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruitment_id INT NOT NULL,
    approved_by INT,
    approval_status ENUM('APPROVED','REJECTED'),
    comment TEXT,
    approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruitment_id) REFERENCES recruitments(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recruitment_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruitment_id INT NOT NULL,
    post_type ENUM('INTERNAL','EXTERNAL') NOT NULL,
    post_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closing_date DATE,
    FOREIGN KEY (recruitment_id) REFERENCES recruitments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruitment_id INT NOT NULL,
    applicant_id INT NOT NULL,
    application_status ENUM('SUBMITTED','UNDER_REVIEW','SHORTLISTED','REJECTED','HIRED') DEFAULT 'SUBMITTED',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruitment_id) REFERENCES recruitments(id),
    FOREIGN KEY (applicant_id) REFERENCES applicants(id)
);

CREATE TABLE IF NOT EXISTS application_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    criteria_id INT NOT NULL,
    answer TEXT,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES recruitment_criteria(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES job_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_qualifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_type_id INT NOT NULL,
    job_title VARCHAR(200) NOT NULL,
    min_degree VARCHAR(200),
    min_experience VARCHAR(100),
    required_skills TEXT,
    grade VARCHAR(50),
    competency_framework TEXT,
    full_description TEXT,
    status ENUM('DRAFT','ACTIVE') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_type_id) REFERENCES job_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruitment_id INT NOT NULL,
    media_type VARCHAR(100),
    media_name VARCHAR(200),
    occurrence INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruitment_id) REFERENCES recruitments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    criteria_id INT NOT NULL,
    result_score DOUBLE,
    status ENUM('PASS','FAIL'),
    recorded_by INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES recruitment_criteria(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Run this if the recruitments table already exists without pass_mark:
-- ALTER TABLE recruitments ADD COLUMN IF NOT EXISTS pass_mark DOUBLE DEFAULT 60.0;
