import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class, ClassDocument } from './class.schema';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private readonly classModel: Model<ClassDocument>,
  ) {}

  async create(dto: CreateClassDto): Promise<ClassDocument> {
    return this.classModel.create({
      ...dto,
      schoolIds: dto.schoolIds?.map(id => new Types.ObjectId(id)) ?? [],
      teacherIds: dto.teacherIds?.map(id => new Types.ObjectId(id)) ?? [],
    });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const query: Record<string, unknown> = {};
    if (search?.trim()) query.name = new RegExp(search.trim(), 'i');

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [items, total] = await Promise.all([
      this.classModel.find(query)
        .populate('schoolIds', 'name code')
        .populate('teacherIds', 'fullName email')
        .sort({ grade: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      this.classModel.countDocuments(query),
    ]);

    return { items, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) || 1 };
  }

  async findOne(id: string): Promise<ClassDocument> {
    const classDoc = await this.classModel.findById(id)
      .populate('schoolIds', 'name code')
      .populate('teacherIds', 'fullName email');
    if (!classDoc) throw new NotFoundException('Class not found');
    return classDoc;
  }

  async update(id: string, dto: Partial<CreateClassDto>): Promise<ClassDocument> {
    const patch: any = { ...dto };
    if (dto.schoolIds) patch.schoolIds = dto.schoolIds.map(id => new Types.ObjectId(id));
    if (dto.teacherIds) patch.teacherIds = dto.teacherIds.map(id => new Types.ObjectId(id));

    const classDoc = await this.classModel.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!classDoc) throw new NotFoundException('Class not found');
    return classDoc;
  }

  async remove(id: string): Promise<{ message: string }> {
    const classDoc = await this.classModel.findByIdAndDelete(id);
    if (!classDoc) throw new NotFoundException('Class not found');
    return { message: 'Class deleted' };
  }

  async assignTeacher(classId: string, teacherId: string) {
    const classDoc = await this.classModel.findByIdAndUpdate(
      classId,
      { $addToSet: { teacherIds: new Types.ObjectId(teacherId) } },
      { new: true }
    );
    if (!classDoc) throw new NotFoundException('Class not found');
    return classDoc;
  }

  async removeTeacher(classId: string, teacherId: string) {
    const classDoc = await this.classModel.findByIdAndUpdate(
      classId,
      { $pull: { teacherIds: new Types.ObjectId(teacherId) } },
      { new: true }
    );
    if (!classDoc) throw new NotFoundException('Class not found');
    return classDoc;
  }
}
