import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.startsWith('image/')) return cb(new BadRequestException('Solo se permiten imágenes'), false)
      cb(null, true)
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo')

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'speedmotors', resource_type: 'image' },
        (err, res) => err ? reject(err) : resolve(res as { secure_url: string }),
      ).end(file.buffer)
    })

    return { url: result.secure_url }
  }
}
