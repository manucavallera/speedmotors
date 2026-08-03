-- Al separar Caja SpeedMotors y Caja Marina, cada área debe poder tener su propia sesión abierta.
-- Reemplaza el índice viejo de 0017, que permitía una sola caja abierta en todo el sistema.
DROP INDEX IF EXISTS cash_sessions_one_open;

CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_one_open_per_area
  ON cash_sessions (area)
  WHERE status = 'abierta';
