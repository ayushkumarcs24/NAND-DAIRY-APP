-- Admin, Accountants, etc.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'milk-entry', 'fat-snf', 'report')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by_admin INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS samitis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code_4digit VARCHAR(4) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    samiti_id INTEGER REFERENCES samitis(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milk_entries (
    id SERIAL PRIMARY KEY,
    samiti_id INTEGER REFERENCES samitis(id) ON DELETE CASCADE,
    shift VARCHAR(10) CHECK (shift IN ('morning', 'evening')),
    entry_date DATE NOT NULL,
    milk_quantity_liters DECIMAL(10, 2) NOT NULL,
    entered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (samiti_id, shift, entry_date)
);


CREATE TABLE IF NOT EXISTS fat_snf_entries (
    id SERIAL PRIMARY KEY,
    milk_entry_id INTEGER UNIQUE REFERENCES milk_entries(id) ON DELETE CASCADE,
    fat_value DECIMAL(5, 2) NOT NULL,
    snf_value DECIMAL(5, 2) NOT NULL,
    rate_per_liter DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    entered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    samiti_id INTEGER REFERENCES samitis(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_milk DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
