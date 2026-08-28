ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'financiado_tercero';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS financing_provider varchar(120);
