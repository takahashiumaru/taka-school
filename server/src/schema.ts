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
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','guru') NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_users_email (email),
    KEY idx_users_school (school_id),
    CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
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

  `CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(100) PRIMARY KEY,
    mime_type VARCHAR(100) NOT NULL,
    size INT UNSIGNED NOT NULL,
    data LONGBLOB NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
]

export async function ensureSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql)
  }
}
