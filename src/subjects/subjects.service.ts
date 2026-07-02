import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, SubjectDocument } from './schemas/subject.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name)
    private readonly subjectModel: Model<SubjectDocument>,
  ) {}

  async create(dto: CreateSubjectDto, userId: string): Promise<SubjectDocument> {
    const created = new this.subjectModel({
      name: dto.name,
      description: dto.description ?? '',
      classId: new Types.ObjectId(dto.classId),
      color: dto.color ?? '#cb444a',
      icon: dto.icon ?? 'BookOpen',
      createdBy: new Types.ObjectId(userId),
    });
    return created.save();
  }

  async findAll(classId?: string) {
    const filter: Record<string, unknown> = {};
    if (classId && Types.ObjectId.isValid(classId)) {
      filter.classId = new Types.ObjectId(classId);
    }
    return this.subjectModel.find(filter).sort({ createdAt: 1 }).lean();
  }

  async update(id: string, dto: Partial<CreateSubjectDto>): Promise<SubjectDocument> {
    const setFields: Record<string, unknown> = {};
    if (dto.name !== undefined) setFields.name = dto.name;
    if (dto.description !== undefined) setFields.description = dto.description;
    if (dto.color !== undefined) setFields.color = dto.color;
    if (dto.icon !== undefined) setFields.icon = dto.icon;
    if (dto.classId !== undefined) setFields.classId = new Types.ObjectId(dto.classId);

    const updated = await this.subjectModel.findByIdAndUpdate(
      id,
      { $set: setFields },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Subject not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.subjectModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Subject not found');
    return { deleted: true };
  }
}
