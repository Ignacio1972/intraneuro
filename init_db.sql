-- init_db.sql - INTRANEURO Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'doctor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    rut VARCHAR(15) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admissions table
CREATE TABLE IF NOT EXISTS admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    admission_date DATE NOT NULL,
    diagnosis_code VARCHAR(10) NOT NULL,
    diagnosis_text VARCHAR(100),
    diagnosis_details TEXT,
    allergies TEXT,
    admitted_by VARCHAR(100) NOT NULL,
    discharge_date DATE,
    discharge_diagnosis VARCHAR(10),
    discharge_details TEXT,
    ranking INTEGER,
    deceased BOOLEAN DEFAULT 0,
    discharged_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Observations table
CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL,
    observation TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admission_id) REFERENCES admissions(id)
);

-- Timeline events table
CREATE TABLE IF NOT EXISTS timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admission_id) REFERENCES admissions(id)
);

-- Indexes for performance
CREATE INDEX idx_patients_rut ON patients(rut);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_dates ON admissions(admission_date, discharge_date);

-- Insert default users
INSERT INTO users (username, password, full_name, role) VALUES
    ('admin', 'admin123', 'Administrador', 'admin'),
    ('doctor1', 'doctor123', 'Dr. María Silva', 'doctor'),
    ('doctor2', 'doctor123', 'Dr. Carlos Mendoza', 'doctor'),
    ('enfermera', 'enfermera123', 'Enf. Ana Rodríguez', 'nurse');

-- View for active patients with details
CREATE VIEW active_patients_view AS
SELECT 
    p.id,
    p.name,
    p.age,
    p.rut,
    p.phone,
    a.id as admission_id,
    a.admission_date,
    a.diagnosis_code,
    a.diagnosis_text,
    a.diagnosis_details,
    a.allergies,
    a.admitted_by,
    julianday('now') - julianday(a.admission_date) as days_in_hospital
FROM patients p
JOIN admissions a ON p.id = a.patient_id
WHERE a.status = 'active'
ORDER BY a.admission_date DESC;

-- View for discharged patients
CREATE VIEW discharged_patients_view AS
SELECT 
    p.id,
    p.name,
    p.age,
    p.rut,
    p.phone,
    a.id as admission_id,
    a.admission_date,
    a.discharge_date,
    a.diagnosis_code,
    a.diagnosis_text,
    a.discharge_diagnosis,
    a.ranking,
    a.deceased,
    a.discharged_by,
    julianday(a.discharge_date) - julianday(a.admission_date) as total_days
FROM patients p
JOIN admissions a ON p.id = a.patient_id
WHERE a.status = 'discharged'
ORDER BY a.discharge_date DESC;
