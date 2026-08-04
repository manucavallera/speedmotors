-- Teléfono de la marina para que el cliente avise por WhatsApp al reservar un turno
ALTER TABLE turnera_config ADD COLUMN IF NOT EXISTS whatsapp varchar(30);
