CREATE TYPE "reservation_status" AS ENUM ('vigente', 'concretada', 'cancelada');

CREATE TABLE "reservations" (
  "id" serial PRIMARY KEY,
  "reservation_number" varchar(20),
  "date" timestamp NOT NULL DEFAULT now(),
  "client_id" integer REFERENCES "clients"("id"),
  "client_name" varchar(100) NOT NULL,
  "client_dni" varchar(20),
  "client_address" varchar(200),
  "client_phone" varchar(30),
  "spouse_name" varchar(100),
  "spouse_dni" varchar(20),
  "vehicle_type" "vehicle_type" NOT NULL DEFAULT 'moto',
  "brand" varchar(50) NOT NULL,
  "model" varchar(50),
  "year" integer,
  "color" varchar(30),
  "motor_number" varchar(80),
  "chassis_number" varchar(80),
  "price" numeric(12,2),
  "deposit_amount" numeric(12,2),
  "notes" text,
  "status" "reservation_status" NOT NULL DEFAULT 'vigente',
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
