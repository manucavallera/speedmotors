ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'usdt';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cheque';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS down_payment_method varchar(20);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS first_installment_date date;
