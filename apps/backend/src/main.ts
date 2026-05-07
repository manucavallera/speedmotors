import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173']
  app.enableCors({ origin: allowedOrigins, credentials: true })

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))

  const uploadDir = join(process.cwd(), 'uploads')
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })
  app.useStaticAssets(uploadDir, { prefix: '/uploads' })
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
