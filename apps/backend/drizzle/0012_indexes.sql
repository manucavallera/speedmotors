-- Performance indexes Sprint 2
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments (due_date);
CREATE INDEX IF NOT EXISTS idx_installments_sale_id ON installments (sale_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments (status);

CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales (user_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles (status);

CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders (due_date);
