-- Reserva pública desde la página del cliente: no hay operador logueado, así que user_id puede ser null
ALTER TABLE "rental_slots" ALTER COLUMN "user_id" DROP NOT NULL;
