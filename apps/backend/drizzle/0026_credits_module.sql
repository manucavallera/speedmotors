CREATE TYPE credit_status AS ENUM ('activo', 'pagado', 'cancelado');
CREATE TYPE credit_currency AS ENUM ('pesos', 'usd');

CREATE TABLE credits (
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

CREATE TABLE credit_payments (
  id SERIAL PRIMARY KEY,
  credit_id INTEGER NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_interest_charges (
  id SERIAL PRIMARY KEY,
  credit_id INTEGER NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  charge_date TIMESTAMP NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credits_client ON credits(client_id);
CREATE INDEX idx_credits_status ON credits(status);
CREATE INDEX idx_credit_payments_credit ON credit_payments(credit_id);
CREATE INDEX idx_credit_interest_credit ON credit_interest_charges(credit_id);
