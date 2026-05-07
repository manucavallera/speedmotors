import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { existsSync, mkdirSync, openSync, readSync, closeSync, unlinkSync } from 'fs'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

const uploadDir = join(process.cwd(), 'uploads')
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true })

function isValidImageMagicBytes(filePath: string): boolean {
  const buf = Buffer.alloc(12)
  const fd = openSync(filePath, 'r')
  readSync(fd, buf, 0, 12, 0)
  closeSync(fd)

  const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47
  const isGif = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46
  const isWebp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
                 buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50

  return isJpeg || isPng || isGif || isWebp
}

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (_, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `${unique}${extname(file.originalname)}`)
      },
    }),
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.startsWith('image/')) return cb(new BadRequestException('Solo se permiten imágenes'), false)
      cb(null, true)
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo')

    if (!isValidImageMagicBytes(file.path)) {
      unlinkSync(file.path)
      throw new BadRequestException('El archivo no es una imagen válida')
    }

    return { url: `/uploads/${file.filename}` }
  }
}
