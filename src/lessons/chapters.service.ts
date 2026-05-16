import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Lesson, LessonDocument, LessonType } from './schemas/lesson.schema';
import {
  Chapter,
  ChapterDocument,
  ChapterLessonItemType,
} from './schemas/chapter.schema';
import { Quiz, QuizDocument } from '../quizzes/schemas/quiz.schema';
import {
  Assignment,
  AssignmentDocument,
} from '../assignments/schemas/assignment.schema';
import {
  Activity,
  ActivityDocument,
} from '../activities/schemas/activity.schema';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { CreateChapterLessonDto } from './dto/create-chapter-lesson.dto';
import {
  ChapterLessonItemDto,
  UpdateChapterLessonDto,
} from './dto/update-chapter-lesson.dto';
import { ReorderChapterLessonsDto } from './dto/reorder-chapter-lessons.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectModel(Chapter.name)
    private readonly chapterModel: Model<ChapterDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
  ) {}

  async create(
    dto: CreateChapterDto,
    userId: string,
  ): Promise<ChapterDocument> {
    const chapterDescription = dto.description ?? '';
    const chapterDescriptionFilePath = await this.writeMarkdownFile(
      chapterDescription,
      'chapter-description',
    );

    const created = new this.chapterModel({
      title: dto.title,
      description: chapterDescription,
      descriptionFilePath: chapterDescriptionFilePath,
      lessons: [],
      createdBy: new Types.ObjectId(userId),
    });
    return created.save();
  }

  async findAll() {
    const chapters = await this.chapterModel
      .find()
      .sort({ createdAt: 1 })
      .lean();
    return Promise.all(
      chapters.map((chapter) => this.decorateChapterForResponse(chapter)),
    );
  }

  async findOne(id: string) {
    this.ensureObjectId(id, 'Invalid chapter id format');
    const doc = await this.chapterModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Chapter not found');
    return this.decorateChapterForResponse(doc);
  }

  async addLesson(chapterId: string, dto: CreateChapterLessonDto) {
    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) throw new NotFoundException('Chapter not found');

    const nextOrder = chapter.lessons.length;
    const lessonDescription = dto.description ?? '';
    const lessonDescriptionFilePath = await this.writeMarkdownFile(
      lessonDescription,
      'lesson-description',
    );

    chapter.lessons.push({
      title: dto.title,
      description: lessonDescription,
      descriptionFilePath: lessonDescriptionFilePath,
      order: nextOrder,
      items: [],
    } as never);

    return chapter.save();
  }

  async reorderLessons(chapterId: string, dto: ReorderChapterLessonsDto) {
    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) throw new NotFoundException('Chapter not found');

    if (dto.lessonIds.length !== chapter.lessons.length) {
      throw new BadRequestException(
        'lessonIds must include all chapter lessons',
      );
    }

    const existingIds = new Set(
      chapter.lessons.map((lesson: any) => lesson._id.toString()),
    );
    const providedIds = new Set(dto.lessonIds);

    if (
      providedIds.size !== existingIds.size ||
      [...providedIds].some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestException('lessonIds do not match chapter lessons');
    }

    chapter.lessons.forEach((lesson: any) => {
      lesson.order = dto.lessonIds.indexOf(lesson._id.toString());
    });

    await chapter.save();
    return this.findOne(chapterId);
  }

  async updateLesson(
    chapterId: string,
    lessonId: string,
    dto: UpdateChapterLessonDto,
  ) {
    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) throw new NotFoundException('Chapter not found');

    const lesson = (chapter.lessons as any).id(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found in chapter');

    if (dto.title !== undefined) {
      lesson.title = dto.title;
    }

    if (dto.description !== undefined) {
      lesson.description = dto.description;
      lesson.descriptionFilePath = await this.writeMarkdownFile(
        dto.description,
        'lesson-description',
      );
    }

    if (dto.items !== undefined) {
      await this.ensureItemsExist(dto.items);
      lesson.items = dto.items.map((item, idx) => ({
        type: item.type,
        refId: new Types.ObjectId(item.refId),
        order: idx,
      })) as never;
    }

    await chapter.save();
    return this.findOne(chapterId);
  }

  async removeLesson(chapterId: string, lessonId: string) {
    const chapter = await this.chapterModel.findById(chapterId);
    if (!chapter) throw new NotFoundException('Chapter not found');

    const lesson = (chapter.lessons as any).id(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found in chapter');

    lesson.deleteOne();

    chapter.lessons.forEach((entry, idx) => {
      entry.order = idx;
    });

    await chapter.save();
    return this.findOne(chapterId);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.chapterModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Chapter not found');
    return { deleted: true };
  }

  private async ensureItemsExist(items: ChapterLessonItemDto[]) {
    for (const item of items) {
      this.ensureObjectId(item.refId, `Invalid ${item.type} id format`);
      const objectId = new Types.ObjectId(item.refId);
      let exists = false;

      if (item.type === ChapterLessonItemType.Video) {
        exists = Boolean(await this.lessonModel.exists({ _id: objectId }));
      } else if (item.type === ChapterLessonItemType.Quiz) {
        exists = Boolean(await this.quizModel.exists({ _id: objectId }));
      } else if (item.type === ChapterLessonItemType.Assignment) {
        exists = Boolean(await this.assignmentModel.exists({ _id: objectId }));
      } else {
        exists = Boolean(await this.activityModel.exists({ _id: objectId }));
      }

      if (!exists) {
        throw new BadRequestException(`${item.type} not found: ${item.refId}`);
      }

      if (item.type === ChapterLessonItemType.Video) {
        const lesson = await this.lessonModel
          .findById(item.refId)
          .select('type')
          .lean();
        if (!lesson || lesson.type !== LessonType.Video) {
          throw new BadRequestException(
            'Only video lessons can be added as video items',
          );
        }
      }
    }
  }

  private ensureObjectId(id: string, message: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(message);
    }
  }

  async updateChapterCover(chapterId: string, file: Express.Multer.File) {
    this.ensureObjectId(chapterId, 'Invalid chapter id');
    if (!file) throw new BadRequestException('No image file provided');
    const filePath = `/uploads/chapters/${file.filename}`;
    await this.chapterModel.updateOne(
      { _id: chapterId },
      { coverImageFilePath: filePath },
    );
    return { coverImageFilePath: filePath };
  }

  async updateLessonCover(
    chapterId: string,
    lessonId: string,
    file: Express.Multer.File,
  ) {
    this.ensureObjectId(chapterId, 'Invalid chapter id');
    if (!file) throw new BadRequestException('No image file provided');
    const filePath = `/uploads/chapters/${file.filename}`;
    await this.chapterModel.updateOne(
      { _id: chapterId, 'lessons._id': new Types.ObjectId(lessonId) },
      { $set: { 'lessons.$.coverImageFilePath': filePath } },
    );
    return { coverImageFilePath: filePath };
  }

  private async decorateChapterForResponse(chapter: any) {
    const chapterDescription = await this.resolveMarkdownText(
      chapter.descriptionFilePath,
      chapter.description ?? '',
    );

    const lessons = await Promise.all(
      [...(chapter.lessons ?? [])]
        .sort((a, b) => a.order - b.order)
        .map(async (lesson) => ({
          ...lesson,
          description: await this.resolveMarkdownText(
            lesson.descriptionFilePath,
            lesson.description ?? '',
          ),
          items: [...(lesson.items ?? [])].sort((a, b) => a.order - b.order),
        })),
    );

    return {
      ...chapter,
      description: chapterDescription,
      lessons,
    };
  }

  private async writeMarkdownFile(content: string, prefix: string) {
    const dir = join(process.cwd(), 'uploads', 'chapters');
    await mkdir(dir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${prefix}.md`;
    const absolutePath = join(dir, filename);
    await writeFile(absolutePath, content, 'utf8');

    return `/uploads/chapters/${filename}`;
  }

  private async resolveMarkdownText(path: string, fallback: string) {
    if (!path) {
      return fallback;
    }

    try {
      const absolutePath = join(process.cwd(), path.replace(/^\//, ''));
      return await readFile(absolutePath, 'utf8');
    } catch {
      return fallback;
    }
  }
}
