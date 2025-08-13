-- Tabla usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'doctor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla pacientes
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    rut VARCHAR(15) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla admisiones
CREATE TABLE admissions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    admission_date DATE NOT NULL,
    diagnosis_code VARCHAR(10) NOT NULL,
    diagnosis_text VARCHAR(100),
    diagnosis_details TEXT,
    allergies TEXT,
    admitted_by VARCHAR(100) NOT NULL,
    bed VARCHAR(20),
    
    -- Campos de egreso
    discharge_date DATE,
    discharge_diagnosis VARCHAR(100),
    discharge_details TEXT,
    ranking INTEGER CHECK (ranking >= 0 AND ranking <= 6),
    deceased BOOLEAN DEFAULT FALSE,
    discharged_by VARCHAR(100),
    scheduled_discharge BOOLEAN DEFAULT FALSE,
    
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'discharged')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla observaciones
CREATE TABLE observations (
    id SERIAL PRIMARY KEY,
    admission_id INTEGER NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    observation TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla tareas pendientes
CREATE TABLE pending_tasks (
    id SERIAL PRIMARY KEY,
    admission_id INTEGER NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla eventos del timeline
CREATE TABLE timeline_events (
    id SERIAL PRIMARY KEY,
    admission_id INTEGER NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor performance
CREATE INDEX idx_patients_rut ON patients(rut);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_dates ON admissions(admission_date, discharge_date);
CREATE INDEX idx_admissions_scheduled ON admissions(scheduled_discharge);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admissions_updated_at BEFORE UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuarios por defecto (TEMPORAL - sin hash)
INSERT INTO users (username, password, full_name, role) VALUES
    ('admin', 'admin123', 'Administrador', 'admin'),
    ('doctor1', 'doctor123', 'Dr. María Silva', 'doctor'),
    ('doctor2', 'doctor123', 'Dr. Carlos Mendoza', 'doctor'),
    ('enfermera', 'enfermera123', 'Enf. Ana Rodríguez', 'nurse');
