-- Catch-up idempotente para DB local: aplica 0025..0029 sin romper si algo ya existe.

-- 0025 product barcode
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode varchar(100);
CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique ON products(barcode) WHERE barcode IS NOT NULL;

-- 0026/0027 enums
DO $$ BEGIN CREATE TYPE credit_status AS ENUM ('activo','pagado','cancelado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE credit_currency AS ENUM ('pesos','usd'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE credit_type AS ENUM ('saldo_compuesto','cuotas_simples'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 0026 tables
CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  currency credit_currency NOT NULL DEFAULT 'pesos',
  original_amount NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  status credit_status NOT NULL DEFAULT 'activo',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_payments (
  id SERIAL PRIMARY KEY,
  credit_id INTEGER NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_interest_charges (
  id SERIAL PRIMARY KEY,
  credit_id INTEGER NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  charge_date TIMESTAMP NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_client ON credits(client_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credit_payments_credit ON credit_payments(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_interest_credit ON credit_interest_charges(credit_id);

-- 0027 columns + cuotas
ALTER TABLE credits ADD COLUMN IF NOT EXISTS credit_type credit_type NOT NULL DEFAULT 'saldo_compuesto';
ALTER TABLE credits ADD COLUMN IF NOT EXISTS first_due_date TIMESTAMP;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS installments_count INTEGER;

CREATE TABLE IF NOT EXISTS credit_installments (
  id SERIAL PRIMARY KEY,
  credit_id INTEGER NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  due_date TIMESTAMP NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  surcharge NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMP,
  paid_amount NUMERIC(12,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_installments_credit ON credit_installments(credit_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_installments_number ON credit_installments(credit_id, number);

-- 0028 principal_amount
ALTER TABLE credit_installments ADD COLUMN IF NOT EXISTS principal_amount NUMERIC(12,2);

-- 0029 cuenta corriente + sale link
ALTER TYPE sale_type ADD VALUE IF NOT EXISTS 'cuenta_corriente';
ALTER TABLE credits ADD COLUMN IF NOT EXISTS sale_id integer REFERENCES sales(id);
