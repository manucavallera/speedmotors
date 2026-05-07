# Quick Start -- SpeedMotors

## Levantar entorno
docker-compose up -d                          # PostgreSQL en :5432
npm run dev:backend                            # NestJS en :3000
npm run dev:frontend                           # Vite en :5173

## Credenciales dev
DB  : postgresql://speedmotors:speedmotors123@localhost:5432/speedmotors
User: admin@speedmotors.com / admin123

## Login y obtener token
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@speedmotors.com","password":"admin123"}'

## Health check
curl -s http://localhost:3000/api/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173

## DB -- operaciones frecuentes
# Query de lectura
docker exec speedmotors-db psql -U speedmotors -d speedmotors -c "SELECT * FROM vehicles LIMIT 5;"

# Agregar columna (patron establecido)
docker exec speedmotors-db psql -U speedmotors -d speedmotors \
  -c "ALTER TABLE nombre ADD COLUMN IF NOT EXISTS campo tipo;"

## Drizzle
npm run db:generate    # generar migracion desde schema.ts
npm run db:migrate     # aplicar migracion
npm run db:seed        # poblar datos iniciales

## Build produccion
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend

## Flujo para agregar feature
1. Editar schema.ts (si toca DB)
2. ALTER TABLE en Docker (si toca DB)
3. Crear/editar service -> controller -> module
4. Editar page en frontend
5. Reiniciar backend
