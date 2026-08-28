ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'reventa';
CREATE TABLE IF NOT EXISTS resellers (
  id serial PRIMARY KEY,
  name varchar(150) NOT NULL,
  phone varchar(50),
  notes varchar(500),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS resale_consignments (
  id serial PRIMARY KEY,
  reseller_id integer NOT NULL REFERENCES resellers(id),
  vehicle_id integer NOT NULL REFERENCES vehicles(id),
  delivered_at date NOT NULL,
  agreed_price numeric(12,2) NOT NULL,
  sold_at date,
  sold_price numeric(12,2),
  created_at timestamp NOT NULL DEFAULT now()
);
