import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { extname } from 'path';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson, LessonDocument } from './schemas/lesson.schema';

type LessonFiles = {
  descriptionFile?: Express.Multer.File[];
  documentFile?: Express.Multer.File[];
  videoFile?: Express.Multer.File[];
  thumbnailFile?: Express.Multer.File[];
};

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
  ) {}

  async create(dto: CreateLessonDto, files: LessonFiles, userId: string) {
    const description = files.descriptionFile?.[0];
    if (!description) {
      throw new BadRequestException('descriptionFile (.md) is required');
    }

    this.ensureMarkdown(description.originalname);

    let parsedTags: string[] = [];
    if (dto.tags) {
      try {
        parsedTags = JSON.parse(dto.tags);
      } catch {
        parsedTags = [];
      }
    }

    let parsedClassIds: string[] = ['Class 3'];
    if (dto.classIds) {
      try {
        parsedClassIds = JSON.parse(dto.classIds);
      } catch {
        parsedClassIds = ['Class 3'];
      }
    }

    return this.lessonModel.create({
      ...dto,
      tags: parsedTags,
      classIds: parsedClassIds,
      descriptionFilePath: this.toPublicPath(description.path),
      documentFilePath: files.documentFile?.[0]
        ? this.toPublicPath(files.documentFile[0].path)
        : '',
      videoFilePath: files.videoFile?.[0]
        ? this.toPublicPath(files.videoFile[0].path)
        : '',
      thumbnailFilePath: files.thumbnailFile?.[0]
        ? this.toPublicPath(files.thumbnailFile[0].path)
        : '',
      createdBy: new Types.ObjectId(userId),
    });
  }

  async findAll(page?: number, limit?: number, search?: string, type?: string) {
    const query: Record<string, unknown> = {};

    if (type?.trim()) {
      query.type = type.trim();
    }

    if (search?.trim()) {
      const pattern = new RegExp(search.trim(), 'i');
      query.$or = [{ title: pattern }, { tags: pattern }];
    }

    if (!page || !limit) {
      return this.lessonModel.find(query).sort({ createdAt: -1 });
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [items, total] = await Promise.all([
      this.lessonModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      this.lessonModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findOne(id: string) {
    this.ensureObjectId(id);
    const lesson = await this.lessonModel.findById(id);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  async update(id: string, dto: UpdateLessonDto, files: LessonFiles) {
    this.ensureObjectId(id);

    const updateData: Record<string, unknown> = {
      ...dto,
    };

    if (dto.tags !== undefined) {
      try {
        updateData.tags = JSON.parse(dto.tags as string);
      } catch {
        updateData.tags = [];
      }
    }

    if (dto.classIds !== undefined) {
      try {
        updateData.classIds = JSON.parse(dto.classIds as string);
      } catch {
        updateData.classIds = ['Class 3'];
      }
    }

    const description = files.descriptionFile?.[0];
    if (description) {
      this.ensureMarkdown(description.originalname);
      updateData.descriptionFilePath = this.toPublicPath(description.path);
    }

    const documentFile = files.documentFile?.[0];
    if (documentFile) {
      updateData.documentFilePath = this.toPublicPath(documentFile.path);
    }

    const videoFile = files.videoFile?.[0];
    if (videoFile) {
      updateData.videoFilePath = this.toPublicPath(videoFile.path);
    }

    const thumbnailFile = files.thumbnailFile?.[0];
    if (thumbnailFile) {
      updateData.thumbnailFilePath = this.toPublicPath(thumbnailFile.path);
    }

    const lesson = await this.lessonModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async remove(id: string) {
    this.ensureObjectId(id);
    const lesson = await this.lessonModel.findByIdAndDelete(id);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return { message: 'Lesson deleted successfully' };
  }

  private toPublicPath(path: string): string {
    return path.replace(/^uploads\//, '/uploads/').replace(/^\.\//, '/');
  }

  private ensureMarkdown(filename: string) {
    if (extname(filename).toLowerCase() !== '.md') {
      throw new BadRequestException('Description file must be .md format');
    }
  }

  private ensureObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id format');
    }
  }
}
