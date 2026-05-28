-- Add cuenta_corriente to sale_type enum
ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'cuenta_corriente';

-- Link auto-created credits back to their originating sale
ALTER TABLE credits ADD COLUMN IF NOT EXISTS sale_id integer REFERENCES sales(id);
