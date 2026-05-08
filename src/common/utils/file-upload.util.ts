import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

const sanitizeFilename = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_.]/g, '');

export const buildDiskStorage = (folder: string) =>
  diskStorage({
    destination: `./uploads/${folder}`,
    filename: (_req, file, cb) => {
      const name = sanitizeFilename(file.originalname.replace(extname(file.originalname), ''));
      const extension = extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${name}${extension}`);
    },
  });

export const markdownFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const extension = extname(file.originalname).toLowerCase();
  if (extension !== '.md') {
    cb(new BadRequestException('Only .md files are allowed for descriptions'), false);
    return;
  }
  cb(null, true);
};

export const fileSizeLimit = 10 * 1024 * 1024;
