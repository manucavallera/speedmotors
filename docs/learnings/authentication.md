# Authentication -- JWT + Passport + NestJS
~250 tokens

## Flujo
1. POST /auth/login { email, password }
2. auth.service valida con bcryptjs.compare()
3. Retorna { access_token: JWT }
4. Frontend guarda en localStorage, adjunta en cada request:
   Authorization: Bearer <token>

## JWT payload
{ sub: userId, email: string, role: 'admin' | 'vendedor' }

## Proteger un endpoint
@UseGuards(JwtAuthGuard)          -- a nivel controller o method
-- JwtAuthGuard esta en src/auth/jwt-auth.guard.ts
-- JwtStrategy valida el token y pone el user en request

## Obtener usuario logueado en controller
@Get('me')
getMe(@Request() req: { user: { sub: number; email: string; role: string } }) {
  return req.user
}

## Frontend: api.ts
-- axios instance con interceptor que agrega el token automaticamente
-- Si 401: redirige a /login
-- Usar siempre: import { api } from '../lib/api'

## Roles
-- 'admin': acceso total
-- 'vendedor': acceso restringido (sin settings, sin reportes de costos)
-- Guard de roles: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin')
