-- Migration 002: Allow one vehicle to be mapped to multiple samitis
-- Replaces the single samiti_id column on vehicles with a junction table

-- Step 1: Create the junction table
CREATE TABLE IF NOT EXISTS vehicle_samiti_mappings (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    samiti_id INTEGER NOT NULL REFERENCES samitis(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (vehicle_id, samiti_id)  -- prevent duplicate mappings
);

-- Step 2 & 3: Migrate existing data and drop the column, ONLY if the column exists
DO $$
BEGIN
    IF EXISTS(SELECT *
              FROM information_schema.columns
              WHERE table_name='vehicles' AND column_name='samiti_id')
    THEN
        INSERT INTO vehicle_samiti_mappings (vehicle_id, samiti_id)
        SELECT id, samiti_id
        FROM vehicles
        WHERE samiti_id IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        ALTER TABLE vehicles DROP COLUMN samiti_id;
    END IF;
END $$;
