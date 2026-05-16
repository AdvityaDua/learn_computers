import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { School, SchoolDocument } from './school.schema';
import { CreateSchoolDto } from './dto/create-school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectModel(School.name)
    private readonly schoolModel: Model<SchoolDocument>,
  ) {}

  async create(dto: CreateSchoolDto): Promise<SchoolDocument> {
    const existing = await this.schoolModel.findOne({
      code: dto.code.toUpperCase(),
    });
    if (existing)
      throw new ConflictException(
        `School with code ${dto.code} already exists`,
      );
    return this.schoolModel.create({
      ...dto,
      code: dto.code.toUpperCase(),
      assignedClasses: dto.assignedClasses ?? ['Class 3'],
      teacherIds: dto.teacherIds?.map((id) => new Types.ObjectId(id)) ?? [],
      isActive: dto.isActive ?? true,
    });
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const query: Record<string, unknown> = {};
    if (search?.trim())
      query.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { code: new RegExp(search.trim(), 'i') },
      ];

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [items, total] = await Promise.all([
      this.schoolModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      this.schoolModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  async findOne(id: string): Promise<SchoolDocument> {
    const school = await this.schoolModel.findById(id);
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async update(
    id: string,
    dto: Partial<CreateSchoolDto>,
  ): Promise<SchoolDocument> {
    const patch: any = { ...dto };
    if (patch.code) patch.code = patch.code.toUpperCase();
    if (dto.teacherIds)
      patch.teacherIds = dto.teacherIds.map((id) => new Types.ObjectId(id));

    const school = await this.schoolModel.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async remove(id: string): Promise<{ message: string }> {
    const school = await this.schoolModel.findByIdAndDelete(id);
    if (!school) throw new NotFoundException('School not found');
    return { message: 'School deleted' };
  }

  async toggleActive(id: string): Promise<SchoolDocument> {
    const school = await this.schoolModel.findById(id);
    if (!school) throw new NotFoundException('School not found');
    school.isActive = !school.isActive;
    return school.save();
  }
}
