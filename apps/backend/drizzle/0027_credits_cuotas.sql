-- Tipo de crédito: saldo compuesto (viejo) o cuotas simples (nuevo)
CREATE TYPE credit_type AS ENUM ('saldo_compuesto', 'cuotas_simples');

ALTER TABLE credits ADD COLUMN credit_type credit_type NOT NULL DEFAULT 'saldo_compuesto';
ALTER TABLE credits ADD COLUMN first_due_date TIMESTAMP;
ALTER TABLE credits ADD COLUMN installments_count INTEGER;

-- Cuotas planificadas (solo se llenan si credit_type = 'cuotas_simples')
CREATE TABLE credit_installments (
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

CREATE INDEX idx_credit_installments_credit ON credit_installments(credit_id);
CREATE UNIQUE INDEX uq_credit_installments_number ON credit_installments(credit_id, number);
