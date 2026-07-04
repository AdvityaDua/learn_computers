import { SetMetadata } from '@nestjs/common';

export const CONTENT_MODEL_KEY = 'contentModelKind';

export type ContentModelKind = 'lesson' | 'quiz' | 'assignment' | 'activity';

/**
 * Tags a route with which content collection it touches, so TeacherContentAccessGuard knows
 * which model to look up `classIds` on. Routes without this decorator (e.g. a generic image
 * upload utility) skip the class-scoping check and only require the canEditCourses flag.
 */
export const ContentModel = (kind: ContentModelKind) =>
  SetMetadata(CONTENT_MODEL_KEY, kind);
