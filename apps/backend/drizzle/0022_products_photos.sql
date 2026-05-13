ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "photos" jsonb NOT NULL DEFAULT '[]';
UPDATE "products" SET "photos" = jsonb_build_array("photo_url") WHERE "photo_url" IS NOT NULL AND "photo_url" != '';
