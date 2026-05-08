import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument, MaterialType } from './schemas/material.schema';
import { extname } from 'path';

function detectType(filename: string): MaterialType {
  const ext = extname(filename).toLowerCase();
  if (['.mp4', '.mov', '.webm', '.avi', '.mkv'].includes(ext)) return 'video';
  if (ext === '.pdf') return 'pdf';
  if (['.md', '.markdown'].includes(ext)) return 'markdown';
  return 'other';
}

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
  ) {}

  async createMany(
    files: Express.Multer.File[],
    category = 'general',
    description = '',
  ): Promise<MaterialDocument[]> {
    const docs = files.map((f) => ({
      originalName: f.originalname,
      filePath: f.path,
      type: detectType(f.originalname),
      sizeBytes: f.size,
      category,
      description,
    }));
    return this.materialModel.insertMany(docs) as unknown as MaterialDocument[];
  }

  async findAll(category?: string): Promise<MaterialDocument[]> {
    const filter = category ? { category } : {};
    return this.materialModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string): Promise<MaterialDocument> {
    const doc = await this.materialModel.findById(id);
    if (!doc) throw new NotFoundException('Material not found');
    return doc;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.materialModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Material not found');
    return { deleted: true };
  }
}
