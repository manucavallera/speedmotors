CREATE TYPE "reminder_type" AS ENUM ('impuesto', 'factura', 'vencimiento', 'otro');
CREATE TYPE "reminder_status" AS ENUM ('pendiente', 'pagado', 'vencido');
CREATE TYPE "reminder_recurrence" AS ENUM ('ninguna', 'mensual', 'trimestral', 'anual');

CREATE TABLE "reminders" (
  "id" serial PRIMARY KEY,
  "type" "reminder_type" NOT NULL DEFAULT 'otro',
  "title" varchar(150) NOT NULL,
  "description" text,
  "due_date" timestamp NOT NULL,
  "amount" numeric(12,2),
  "status" "reminder_status" NOT NULL DEFAULT 'pendiente',
  "recurrence" "reminder_recurrence" NOT NULL DEFAULT 'ninguna',
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
