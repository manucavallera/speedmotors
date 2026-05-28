-- Monto base (sin interés). Si paga antes de 20 días previos al vto se cobra principal_amount en lugar de amount.
ALTER TABLE credit_installments ADD COLUMN principal_amount NUMERIC(12,2);
