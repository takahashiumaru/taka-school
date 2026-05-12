import { pool } from "./db.js"

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS schools (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    phone VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    nip VARCHAR(40) NULL,
    phone VARCHAR(30) NULL,
    subject_specialty VARCHAR(120) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','staff','teacher','guru','headmaster','parent','student') NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_users_email (email),
    KEY idx_users_school (school_id),
    CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS education_levels (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(80) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_education_level (school_id, code),
    CONSTRAINT fk_edu_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS grade_levels (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    education_level_id INT UNSIGNED NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(80) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_grade_level (school_id, education_level_id, code),
    CONSTRAINT fk_grade_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_edu FOREIGN KEY (education_level_id) REFERENCES education_levels(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS academic_years (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    name VARCHAR(30) NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_academic_year (school_id, name),
    CONSTRAINT fk_year_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS semesters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    academic_year_id INT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    start_date DATE NULL,
    end_date DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_semester (school_id, academic_year_id, name),
    CONSTRAINT fk_sem_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_sem_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS majors (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    education_level_id INT UNSIGNED NOT NULL,
    name VARCHAR(80) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_major (school_id, education_level_id, name),
    CONSTRAINT fk_major_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_major_edu FOREIGN KEY (education_level_id) REFERENCES education_levels(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,


  `CREATE TABLE IF NOT EXISTS subjects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    education_level_id INT UNSIGNED NULL,
    code VARCHAR(30) NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_subject_code (school_id, code),
    KEY idx_subject_school (school_id),
    CONSTRAINT fk_subject_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_subject_edu FOREIGN KEY (education_level_id) REFERENCES education_levels(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS classes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    name VARCHAR(80) NOT NULL,
    grade_level VARCHAR(40) NULL,
    homeroom_teacher_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_classes_school (school_id),
    CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_classes_teacher FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS teacher_subjects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    teacher_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_teacher_subject_class (teacher_id, subject_id, class_id),
    KEY idx_ts_school (school_id),
    CONSTRAINT fk_ts_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS class_subjects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    teacher_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_class_subject (class_id, subject_id),
    KEY idx_cs_school (school_id),
    CONSTRAINT fk_cs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,


  `CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NULL,
    nis VARCHAR(40) NULL,
    name VARCHAR(120) NOT NULL,
    gender ENUM('L','P') NULL,
    birth_date DATE NULL,
    parent_name VARCHAR(120) NULL,
    parent_wa VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    status ENUM('aktif','lulus','keluar') NOT NULL DEFAULT 'aktif',
    photo_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_students_school (school_id),
    KEY idx_students_class (class_id),
    CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS admissions_applicants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NULL,
    academic_year VARCHAR(30) NULL,
    desired_class VARCHAR(80) NULL,
    name VARCHAR(120) NOT NULL,
    gender ENUM('L','P') NULL,
    birth_place VARCHAR(120) NULL,
    birth_date DATE NULL,
    parent_name VARCHAR(120) NULL,
    parent_wa VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    previous_school VARCHAR(160) NULL,
    document_url VARCHAR(500) NULL,
    birth_certificate_url VARCHAR(500) NULL,
    family_card_url VARCHAR(500) NULL,
    payment_proof_url VARCHAR(500) NULL,
    registration_invoice_url VARCHAR(500) NULL,
    status ENUM('new','submitted','verifying','interview','accepted','rejected','waitlisted','enrolled') NOT NULL DEFAULT 'new',
    interview_at VARCHAR(40) NULL,
    notes TEXT NULL,
    submitted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_admissions_school (school_id),
    KEY idx_admissions_status (school_id, status),
    CONSTRAINT fk_admissions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_admissions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS guardians (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    relation VARCHAR(40) NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NULL,
    whatsapp VARCHAR(30) NULL,
    email VARCHAR(160) NULL,
    occupation VARCHAR(120) NULL,
    address VARCHAR(255) NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_guardians_school (school_id),
    KEY idx_guardians_student (student_id),
    CONSTRAINT fk_guardian_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_guardian_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS user_student_links (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_student_link (school_id, user_id, student_id),
    KEY idx_usl_student (student_id),
    CONSTRAINT fk_usl_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_usl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_usl_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS user_guardian_links (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    guardian_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_guardian_link (school_id, user_id, guardian_id),
    KEY idx_ugl_student (student_id),
    CONSTRAINT fk_ugl_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_ugl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ugl_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE CASCADE,
    CONSTRAINT fk_ugl_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS user_teacher_links (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    teacher_user_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_teacher_link (school_id, user_id),
    CONSTRAINT fk_utl_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_utl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_utl_teacher FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,


  `CREATE TABLE IF NOT EXISTS library_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    author VARCHAR(120) NULL,
    category VARCHAR(80) NULL,
    stock INT NOT NULL DEFAULT 1,
    available_stock INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(80) NULL,
    location VARCHAR(120) NULL,
    quantity INT NOT NULL DEFAULT 1,
    condition_status ENUM('good','damaged','lost','maintenance') NOT NULL DEFAULT 'good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS extracurriculars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    coach_user_id INT UNSIGNED NULL,
    schedule_note VARCHAR(160) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS counseling_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NULL,
    category VARCHAR(80) NULL,
    title VARCHAR(160) NOT NULL,
    notes TEXT NULL,
    follow_up TEXT NULL,
    record_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS school_letters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    letter_no VARCHAR(80) NULL,
    type VARCHAR(80) NOT NULL,
    subject VARCHAR(180) NOT NULL,
    recipient VARCHAR(160) NULL,
    status ENUM('draft','issued','archived') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    status ENUM('hadir','izin','sakit','alpa') NOT NULL DEFAULT 'hadir',
    note VARCHAR(255) NULL,
    recorded_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_attendance (student_id, date),
    KEY idx_attendance_school (school_id),
    KEY idx_attendance_class_date (class_id, date),
    CONSTRAINT fk_att_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_user FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS schedules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '1=Mon..7=Sun',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(120) NOT NULL,
    teacher_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_sched_school (school_id),
    KEY idx_sched_class (class_id),
    CONSTRAINT fk_sched_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_sched_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_sched_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,


  `CREATE TABLE IF NOT EXISTS tasks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NULL,
    teacher_id INT UNSIGNED NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    due_date DATE NULL,
    status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_tasks_school (school_id),
    KEY idx_tasks_class (class_id),
    CONSTRAINT fk_task_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_task_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS spp_invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    period CHAR(7) NOT NULL COMMENT 'YYYY-MM',
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('belum','sebagian','lunas','lewat') NOT NULL DEFAULT 'belum',
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_at DATETIME NULL,
    method ENUM('cash','transfer','lain') NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_spp_period (student_id, period),
    KEY idx_spp_school (school_id),
    CONSTRAINT fk_spp_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_spp_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS fee_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category ENUM('spp','registration','uniform','book','exam','activity','catering','transport','other') NOT NULL DEFAULT 'other',
    is_recurring TINYINT(1) NOT NULL DEFAULT 0,
    default_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_fee_type (school_id, code),
    CONSTRAINT fk_fee_type_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS fee_rules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    fee_type_id INT UNSIGNED NOT NULL,
    education_level_id INT UNSIGNED NULL,
    grade_level_id INT UNSIGNED NULL,
    class_id INT UNSIGNED NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_day TINYINT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_fee_rules_school (school_id),
    CONSTRAINT fk_fee_rule_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_fee_rule_type FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE CASCADE,
    CONSTRAINT fk_fee_rule_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS payment_methods (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_info VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_payment_method (school_id, code),
    CONSTRAINT fk_payment_method_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS finance_invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    invoice_no VARCHAR(60) NOT NULL,
    period CHAR(7) NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    late_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('unpaid','partial','paid','overdue','cancelled') NOT NULL DEFAULT 'unpaid',
    note VARCHAR(255) NULL,
    spp_invoice_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_fin_invoice_no (school_id, invoice_no),
    UNIQUE KEY uniq_fin_spp (spp_invoice_id),
    KEY idx_fin_invoice_school (school_id),
    CONSTRAINT fk_fin_invoice_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_invoice_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_invoice_spp FOREIGN KEY (spp_invoice_id) REFERENCES spp_invoices(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS finance_invoice_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    invoice_id INT UNSIGNED NOT NULL,
    fee_type_id INT UNSIGNED NULL,
    description VARCHAR(180) NOT NULL,
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1,
    unit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_fin_item_invoice (invoice_id),
    CONSTRAINT fk_fin_item_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_item_invoice FOREIGN KEY (invoice_id) REFERENCES finance_invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_item_type FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS finance_payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    invoice_id INT UNSIGNED NOT NULL,
    payment_method_id INT UNSIGNED NULL,
    amount DECIMAL(12,2) NOT NULL,
    paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_no VARCHAR(100) NULL,
    note VARCHAR(255) NULL,
    created_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_fin_payment_invoice (invoice_id),
    CONSTRAINT fk_fin_payment_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_payment_invoice FOREIGN KEY (invoice_id) REFERENCES finance_invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
    CONSTRAINT fk_fin_payment_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS finance_discounts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NULL,
    fee_type_id INT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    type ENUM('fixed','percent') NOT NULL DEFAULT 'fixed',
    value DECIMAL(12,2) NOT NULL DEFAULT 0,
    starts_at DATE NULL,
    ends_at DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fin_discount_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_discount_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_discount_type FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS finance_late_fee_rules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    fee_type_id INT UNSIGNED NULL,
    grace_days INT NOT NULL DEFAULT 0,
    type ENUM('fixed','percent') NOT NULL DEFAULT 'fixed',
    value DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_amount DECIMAL(12,2) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fin_late_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_late_type FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS announcements (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    author_id INT UNSIGNED NULL,
    title VARCHAR(180) NOT NULL,
    body TEXT NOT NULL,
    target_class_id INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_ann_school (school_id),
    CONSTRAINT fk_ann_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_ann_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_ann_class FOREIGN KEY (target_class_id) REFERENCES classes(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS galleries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    cover_url VARCHAR(500) NULL,
    event_date DATE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_gal_school (school_id),
    CONSTRAINT fk_gal_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS gallery_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT UNSIGNED NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_galitem_gal (gallery_id),
    CONSTRAINT fk_galitem_gal FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    semester VARCHAR(60) NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_report (student_id, semester),
    KEY idx_rep_school (school_id),
    CONSTRAINT fk_rep_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_rep_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS assessment_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    name VARCHAR(80) NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_assessment_type (school_id, name),
    CONSTRAINT fk_assessment_type_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS grade_entries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NULL,
    assessment_type_id INT UNSIGNED NULL,
    semester_id INT UNSIGNED NULL,
    semester_label VARCHAR(60) NULL,
    score DECIMAL(5,2) NOT NULL,
    note VARCHAR(255) NULL,
    assessed_at DATE NULL,
    created_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_grade_school (school_id),
    KEY idx_grade_student (student_id),
    CONSTRAINT fk_grade_entry_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_entry_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_entry_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_grade_entry_type FOREIGN KEY (assessment_type_id) REFERENCES assessment_types(id) ON DELETE SET NULL,
    CONSTRAINT fk_grade_entry_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    CONSTRAINT fk_grade_entry_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS paud_development_aspects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_paud_aspect (school_id, name),
    CONSTRAINT fk_paud_aspect_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS paud_development_indicators (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    aspect_id INT UNSIGNED NOT NULL,
    description VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_paud_indicator_aspect (aspect_id),
    CONSTRAINT fk_paud_indicator_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_paud_indicator_aspect FOREIGN KEY (aspect_id) REFERENCES paud_development_aspects(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS paud_observations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    aspect_id INT UNSIGNED NULL,
    indicator_id INT UNSIGNED NULL,
    semester_id INT UNSIGNED NULL,
    semester_label VARCHAR(60) NULL,
    observation TEXT NOT NULL,
    level ENUM('BB','MB','BSH','BSB') NULL,
    observed_at DATE NULL,
    created_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_paud_obs_school (school_id),
    KEY idx_paud_obs_student (student_id),
    CONSTRAINT fk_paud_obs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_paud_obs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_paud_obs_aspect FOREIGN KEY (aspect_id) REFERENCES paud_development_aspects(id) ON DELETE SET NULL,
    CONSTRAINT fk_paud_obs_indicator FOREIGN KEY (indicator_id) REFERENCES paud_development_indicators(id) ON DELETE SET NULL,
    CONSTRAINT fk_paud_obs_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    CONSTRAINT fk_paud_obs_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS report_cards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    school_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NULL,
    semester_label VARCHAR(60) NOT NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    summary TEXT NULL,
    created_by INT UNSIGNED NULL,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_report_card (student_id, semester_label),
    KEY idx_report_card_school (school_id),
    CONSTRAINT fk_report_card_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_card_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_card_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_card_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
]


const ALTER_STATEMENTS: string[] = [
  `ALTER TABLE users MODIFY role ENUM('admin','staff','teacher','guru','headmaster','parent','student') NOT NULL`,
  `ALTER TABLE users ADD COLUMN nip VARCHAR(40) NULL AFTER email`,
  `ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL AFTER nip`,
  `ALTER TABLE users ADD COLUMN subject_specialty VARCHAR(120) NULL AFTER phone`,
  `ALTER TABLE classes ADD COLUMN education_level_id INT UNSIGNED NULL AFTER school_id`,
  `ALTER TABLE classes ADD COLUMN grade_level_id INT UNSIGNED NULL AFTER education_level_id`,
  `ALTER TABLE classes ADD COLUMN academic_year_id INT UNSIGNED NULL AFTER grade_level_id`,
  `ALTER TABLE classes ADD COLUMN major_id INT UNSIGNED NULL AFTER homeroom_teacher_id`,
  `ALTER TABLE students ADD COLUMN nisn VARCHAR(40) NULL AFTER nis`,
  `ALTER TABLE students ADD COLUMN email VARCHAR(160) NULL AFTER nisn`,
  `ALTER TABLE students ADD COLUMN phone VARCHAR(30) NULL AFTER email`,
  `ALTER TABLE students ADD COLUMN nickname VARCHAR(80) NULL AFTER name`,
  `ALTER TABLE students ADD COLUMN birth_place VARCHAR(120) NULL AFTER gender`,
  `ALTER TABLE students ADD COLUMN religion VARCHAR(60) NULL AFTER birth_date`,
  `ALTER TABLE students ADD COLUMN blood_type VARCHAR(5) NULL AFTER address`,
  `ALTER TABLE students ADD COLUMN allergies VARCHAR(255) NULL AFTER blood_type`,
  `ALTER TABLE students ADD COLUMN medical_notes TEXT NULL AFTER allergies`,
  `ALTER TABLE students ADD COLUMN emergency_contact_name VARCHAR(120) NULL AFTER medical_notes`,
  `ALTER TABLE students ADD COLUMN emergency_contact_phone VARCHAR(30) NULL AFTER emergency_contact_name`,
  `ALTER TABLE schedules ADD COLUMN subject_id INT UNSIGNED NULL AFTER class_id`,
  `ALTER TABLE schedules ADD INDEX idx_sched_subject (subject_id)`,
  `ALTER TABLE schedules ADD CONSTRAINT fk_sched_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL`,
  `ALTER TABLE schools ADD COLUMN plan_code VARCHAR(40) NOT NULL DEFAULT 'starter' AFTER address`,
  `ALTER TABLE schools ADD COLUMN subscription_status ENUM('trial','active','past_due','paused','cancelled') NOT NULL DEFAULT 'trial' AFTER plan_code`,
  `ALTER TABLE schools ADD COLUMN subscription_ends_at DATE NULL AFTER subscription_status`,
  `ALTER TABLE schools ADD COLUMN custom_domain VARCHAR(180) NULL AFTER subscription_ends_at`,
  `ALTER TABLE schools ADD COLUMN tenant_uid VARCHAR(80) NULL AFTER custom_domain`,
  `ALTER TABLE schools ADD UNIQUE KEY uniq_schools_custom_domain (custom_domain)`,
  `ALTER TABLE schools ADD UNIQUE KEY uniq_schools_tenant_uid (tenant_uid)`,
]

async function safeQuery(sql: string) {
  try { await pool.query(sql) } catch (e) {
    const code = (e as { code?: string }).code
    if (code !== "ER_DUP_FIELDNAME" && code !== "ER_CANT_CREATE_TABLE" && code !== "ER_DUP_KEYNAME" && code !== "ER_FK_DUP_NAME") throw e
  }
}

export async function ensureSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql)
  }
  for (const sql of ALTER_STATEMENTS) {
    await safeQuery(sql)
  }
}
