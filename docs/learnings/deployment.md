# Deployment -- SpeedMotors
~250 tokens

## Entorno actual
- Dev: Docker Compose (PostgreSQL) + npm workspaces local
- No hay CI/CD configurado todavia

## Checklist pre-deploy backend
- [ ] Variables de entorno en .env (JWT_SECRET, DATABASE_URL, PORT)
- [ ] npm run build --workspace=apps/backend -> dist/
- [ ] Migraciones aplicadas en DB de produccion
- [ ] node dist/main (o PM2: pm2 start dist/main.js)

## Checklist pre-deploy frontend
- [ ] VITE_API_URL apuntando a backend de produccion
- [ ] npm run build --workspace=apps/frontend -> dist/
- [ ] Servir dist/ con nginx o equivalente

## Variables de entorno backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/speedmotors
JWT_SECRET=secreto-largo-y-random
PORT=3000
NODE_ENV=production

## Variables de entorno frontend (.env)
VITE_API_URL=https://api.tudominio.com

## Docker Compose para produccion (pendiente configurar)
-- Agregar servicio backend al docker-compose.yml
-- Agregar servicio frontend (nginx) al docker-compose.yml
-- Usar volumes para persistencia de PostgreSQL

## Migraciones en produccion
npm run db:generate   -- genera SQL desde schema.ts
npm run db:migrate    -- aplica en la DB apuntada por DATABASE_URL
