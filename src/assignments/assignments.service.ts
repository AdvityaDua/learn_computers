import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { extname } from 'path';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

type AssignmentFiles = {
  descriptionFile?: Express.Multer.File[];
  attachmentFile?: Express.Multer.File[];
};

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
  ) {}

  /** Inline image upload — called by the markdown editor. Returns public URL. */
  uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('imageFile is required');
    }
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    if (!allowed.includes(extname(file.originalname).toLowerCase())) {
      throw new BadRequestException('Only image files are allowed');
    }
    return { url: this.toPublicPath(file.path) };
  }

  async create(
    dto: CreateAssignmentDto,
    files: AssignmentFiles,
    userId: string,
  ) {
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

    let parsedFileTypes: string[] = [];
    if (dto.acceptedFileTypes) {
      try {
        parsedFileTypes = JSON.parse(dto.acceptedFileTypes);
      } catch {
        parsedFileTypes = [];
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

    return this.assignmentModel.create({
      title: dto.title,
      descriptionFilePath: this.toPublicPath(description.path),
      attachmentFilePath: files.attachmentFile?.[0]
        ? this.toPublicPath(files.attachmentFile[0].path)
        : '',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      tags: parsedTags,
      points: dto.points != null ? Number(dto.points) : undefined,
      createdBy: new Types.ObjectId(userId),
      requiresSubmission:
        dto.requiresSubmission === 'true' || dto.requiresSubmission === '1',
      acceptedFileTypes: parsedFileTypes,
      classIds: parsedClassIds,
    });
  }

  async findAll(page?: number, limit?: number, search?: string) {
    const query: Record<string, unknown> = {};

    if (search?.trim()) {
      const pattern = new RegExp(search.trim(), 'i');
      query.$or = [{ title: pattern }, { tags: pattern }];
    }

    if (!page || !limit) {
      return this.assignmentModel.find(query).sort({ createdAt: -1 });
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [items, total] = await Promise.all([
      this.assignmentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      this.assignmentModel.countDocuments(query),
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
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto, files: AssignmentFiles) {
    this.ensureObjectId(id);

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.tags !== undefined) {
      try {
        updateData.tags = JSON.parse(dto.tags as string);
      } catch {
        updateData.tags = [];
      }
    }
    if (dto.points != null) updateData.points = Number(dto.points);
    if (dto.requiresSubmission !== undefined) {
      updateData.requiresSubmission =
        dto.requiresSubmission === 'true' || dto.requiresSubmission === '1';
    }
    if (dto.acceptedFileTypes !== undefined) {
      try {
        updateData.acceptedFileTypes = JSON.parse(
          dto.acceptedFileTypes as string,
        );
      } catch {
        updateData.acceptedFileTypes = [];
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

    const attachment = files.attachmentFile?.[0];
    if (attachment) {
      updateData.attachmentFilePath = this.toPublicPath(attachment.path);
    }

    const assignment = await this.assignmentModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async remove(id: string) {
    this.ensureObjectId(id);
    const assignment = await this.assignmentModel.findByIdAndDelete(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    return { message: 'Assignment deleted successfully' };
  }

  async updateDueDate(id: string, dueDate: string) {
    this.ensureObjectId(id);
    const update: any = {};
    if (dueDate) {
      update.dueDate = new Date(dueDate);
    } else {
      update.$unset = { dueDate: 1 };
    }
    const assignment = await this.assignmentModel.findByIdAndUpdate(
      id,
      update,
      { new: true },
    );
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
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
