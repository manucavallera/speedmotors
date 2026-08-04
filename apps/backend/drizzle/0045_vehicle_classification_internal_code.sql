ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "internal_code" varchar(100);
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "displacement" integer;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "version" varchar(100);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_internal_code_unique"
ON "vehicles" ("internal_code")
WHERE "internal_code" IS NOT NULL;
