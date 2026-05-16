import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Quiz, QuizDocument } from './schemas/quiz.schema';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
  ) {}

  async create(dto: CreateQuizDto, userId: string) {
    const description = dto.description ?? '';
    const descriptionFilePath = await this.writeMarkdownFile(
      description,
      'quiz-description',
    );
    return this.quizModel.create({
      ...dto,
      classIds:
        dto.classIds && dto.classIds.length > 0 ? dto.classIds : ['Class 3'],
      description,
      descriptionFilePath,
      createdBy: new Types.ObjectId(userId),
    });
  }

  async findAll(page?: number, limit?: number, search?: string) {
    const query: Record<string, unknown> = {};
    if (search?.trim()) {
      query.title = new RegExp(search.trim(), 'i');
    }

    if (!page || !limit) {
      const quizzes = await this.quizModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean();
      return Promise.all(quizzes.map((quiz) => this.decorateForResponse(quiz)));
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [rows, total] = await Promise.all([
      this.quizModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      this.quizModel.countDocuments(query),
    ]);

    const items = await Promise.all(
      rows.map((quiz) => this.decorateForResponse(quiz)),
    );
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
    const quiz = await this.quizModel.findById(id).lean();
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return this.decorateForResponse(quiz);
  }

  async update(id: string, dto: UpdateQuizDto) {
    this.ensureObjectId(id);
    const patch: Partial<Quiz> & { descriptionFilePath?: string } = { ...dto };
    if (dto.classIds && dto.classIds.length === 0) {
      patch.classIds = ['Class 3'];
    }
    if (dto.description !== undefined) {
      patch.descriptionFilePath = await this.writeMarkdownFile(
        dto.description,
        'quiz-description',
      );
    }
    const quiz = await this.quizModel
      .findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      })
      .lean();
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return this.decorateForResponse(quiz);
  }

  async remove(id: string) {
    this.ensureObjectId(id);
    const quiz = await this.quizModel.findByIdAndDelete(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return { message: 'Quiz deleted successfully' };
  }

  async updateDueDate(id: string, dueDate: string) {
    this.ensureObjectId(id);
    const update: any = {};
    if (dueDate) {
      update.dueDate = new Date(dueDate);
    } else {
      update.$unset = { dueDate: 1 };
    }
    const quiz = await this.quizModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean();
    if (!quiz) throw new NotFoundException('Quiz not found');
    return this.decorateForResponse(quiz);
  }

  private async decorateForResponse(quiz: any) {
    const description = await this.resolveMarkdownText(
      quiz.descriptionFilePath,
      quiz.description ?? '',
    );
    return { ...quiz, description };
  }

  private async writeMarkdownFile(
    content: string,
    prefix: string,
  ): Promise<string> {
    const dir = join(process.cwd(), 'uploads', 'quizzes');
    await mkdir(dir, { recursive: true });
    const filename = `${prefix}-${Date.now()}.md`;
    const filePath = join(dir, filename);
    await writeFile(filePath, content, 'utf8');
    return `/uploads/quizzes/${filename}`;
  }

  private async resolveMarkdownText(
    path: string | undefined,
    fallback: string,
  ): Promise<string> {
    if (!path) return fallback;
    try {
      const absolutePath = join(process.cwd(), path.replace(/^\//, ''));
      return await readFile(absolutePath, 'utf8');
    } catch {
      return fallback;
    }
  }

  private ensureObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id format');
    }
  }
}
