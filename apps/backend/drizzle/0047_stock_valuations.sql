CREATE TABLE IF NOT EXISTS "stock_valuations" (
  "id" serial PRIMARY KEY NOT NULL,
  "period" varchar(7) NOT NULL,
  "closed_at" timestamp DEFAULT now() NOT NULL,
  "available_units" integer NOT NULL,
  "reserved_units" integer NOT NULL,
  "total_units" integer NOT NULL,
  "total_cost" numeric(14, 2) NOT NULL,
  "total_sell" numeric(14, 2) NOT NULL,
  "potential_margin" numeric(14, 2) NOT NULL,
  "unpriced_sale_units" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "stock_valuation_lines" (
  "id" serial PRIMARY KEY NOT NULL,
  "valuation_id" integer NOT NULL,
  "brand" varchar(100) NOT NULL,
  "model" varchar(100) NOT NULL,
  "version" varchar(100),
  "available_units" integer NOT NULL,
  "reserved_units" integer NOT NULL,
  "total_units" integer NOT NULL,
  "cost_price" numeric(12, 2) NOT NULL,
  "sell_price" numeric(12, 2),
  "total_cost" numeric(14, 2) NOT NULL,
  "total_sell" numeric(14, 2) NOT NULL,
  "potential_margin" numeric(14, 2) NOT NULL,
  CONSTRAINT "stock_valuation_lines_valuation_id_stock_valuations_id_fk"
    FOREIGN KEY ("valuation_id") REFERENCES "public"."stock_valuations"("id")
    ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "stock_valuations_period_unique"
  ON "stock_valuations" USING btree ("period");

CREATE INDEX IF NOT EXISTS "stock_valuation_lines_valuation_idx"
  ON "stock_valuation_lines" USING btree ("valuation_id");
