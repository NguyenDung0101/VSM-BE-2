import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { promisify } from 'util';
import { extname } from 'path';
const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  async saveFile(file: Express.Multer.File, type: string) {
    const uploadPath = `./public/image/${type}`;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `${type}_${uniqueSuffix}${ext}`;
    fs.writeFileSync(`${uploadPath}/${filename}`, file.buffer);
    return `/image/${type}/${filename}`;
  }

  async deleteFile(fileUrl: string) {
    const path = `./public${fileUrl}`;
    if (fs.existsSync(path)) {
      await unlinkAsync(path);
    }
  }
}