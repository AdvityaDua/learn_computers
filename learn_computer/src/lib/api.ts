import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './constants';

export type AppUser = {
  sub: string;
  email: string;
  role: string;
  fullName: string;
  profileImage?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AppUser;
};

export type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export type ListQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method?: HttpMethod;
  authToken?: string;
  body?: Record<string, unknown> | FormData;
  query?: Record<string, QueryValue>;
};

type FileFieldMap = Record<string, UploadFile | UploadFile[] | undefined>;

const API_ROOT = API_BASE_URL.replace(/\/+$/, '');

let activeAccessToken: string | null = null;
let inMemorySession: AuthResponse | null = null;

function joinUrl(path: string) {
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildQueryString(query?: Record<string, QueryValue>) {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    params.append(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const normalized = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (normalized.length > 0) {
        return normalized.join(', ');
      }
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  return 'Something went wrong';
}

function getAuthToken(explicitToken?: string) {
  const token = explicitToken ?? activeAccessToken;

  if (!token) {
    throw new Error('Authentication token is required for this request.');
  }

  return token;
}

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    formData.append(key, String(value));
    return;
  }

  formData.append(key, value as string);
}

function buildMultipartFormData(fields?: Record<string, unknown>, files?: FileFieldMap) {
  const formData = new FormData();

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          appendFormValue(formData, key, item);
        }
        continue;
      }

      appendFormValue(formData, key, value);
    }
  }

  if (files) {
    for (const [key, value] of Object.entries(files)) {
      if (!value) {
        continue;
      }

      const normalized = Array.isArray(value) ? value : [value];
      for (const file of normalized) {
        formData.append(key, {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as never);
      }
    }
  }

  return formData;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', authToken, body, query } = options;
  const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${joinUrl(path)}${buildQueryString(query)}`, {
    method,
    headers,
    body: body
      ? isMultipart
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  let payload: unknown = null;

  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    payload = await response.text().catch(() => null);
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload as T;
}

export function setActiveAccessToken(token?: string | null) {
  activeAccessToken = token ?? null;
}

export async function getStoredSession() {
  if (!inMemorySession) {
    try {
      const stored = await SecureStore.getItemAsync('auth_session');
      if (stored) {
        inMemorySession = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read session:', e);
    }
  }
  
  if (!inMemorySession) {
    return null;
  }

  setActiveAccessToken(inMemorySession.accessToken);
  return inMemorySession;
}

export async function storeSession(session: AuthResponse) {
  inMemorySession = session;
  setActiveAccessToken(session.accessToken);
  try {
    await SecureStore.setItemAsync('auth_session', JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export async function clearStoredSession() {
  inMemorySession = null;
  setActiveAccessToken(null);
  try {
    await SecureStore.deleteItemAsync('auth_session');
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

export async function login(email: string, password: string) {
  const session = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  await storeSession(session);
  return session;
}

export async function signup(
  fullName: string,
  email: string,
  password: string,
  role: 'student' | 'teacher' = 'student',
) {
  const session = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { fullName, email, password, role },
  });

  await storeSession(session);
  return session;
}

export async function loginWithGoogle(idToken: string) {
  const session = await request<AuthResponse>('/auth/google', {
    method: 'POST',
    body: { idToken },
  });

  await storeSession(session);
  return session;
}

export async function listActivities(query?: ListQuery, authToken?: string) {
  return request('/activities', {
    authToken: getAuthToken(authToken),
    query,
  });
}

export async function getActivity(id: string, authToken?: string) {
  return request(`/activities/${id}`, {
    authToken: getAuthToken(authToken),
  });
}

export async function uploadActivityImage(imageFile: UploadFile, authToken?: string) {
  return request<{ url: string }>('/activities/images', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(undefined, { imageFile }),
  });
}

export async function createActivity(
  fields: Record<string, unknown>,
  files?: { descriptionFile?: UploadFile; attachmentFile?: UploadFile },
  authToken?: string,
) {
  return request('/activities', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(fields, files),
  });
}

export async function updateActivity(
  id: string,
  fields: Record<string, unknown>,
  files?: { descriptionFile?: UploadFile; attachmentFile?: UploadFile },
  authToken?: string,
) {
  return request(`/activities/${id}`, {
    method: 'PATCH',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(fields, files),
  });
}

export async function deleteActivity(id: string, authToken?: string) {
  return request(`/activities/${id}`, {
    method: 'DELETE',
    authToken: getAuthToken(authToken),
  });
}

export async function getStudentDeadlines(authToken?: string) {
  return request('/progress/student/deadlines', {
    authToken: getAuthToken(authToken),
  });
}

export async function listAssignments(query?: ListQuery, authToken?: string) {
  return request('/assignments', {
    authToken: getAuthToken(authToken),
    query,
  });
}

export async function getAssignment(id: string, authToken?: string) {
  return request(`/assignments/${id}`, {
    authToken: getAuthToken(authToken),
  });
}

export async function uploadAssignmentImage(imageFile: UploadFile, authToken?: string) {
  return request<{ url: string }>('/assignments/images', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(undefined, { imageFile }),
  });
}

export async function createAssignment(
  fields: Record<string, unknown>,
  files?: { descriptionFile?: UploadFile; attachmentFile?: UploadFile },
  authToken?: string,
) {
  return request('/assignments', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(fields, files),
  });
}

export async function updateAssignment(
  id: string,
  fields: Record<string, unknown>,
  files?: { descriptionFile?: UploadFile; attachmentFile?: UploadFile },
  authToken?: string,
) {
  return request(`/assignments/${id}`, {
    method: 'PATCH',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(fields, files),
  });
}

export async function deleteAssignment(id: string, authToken?: string) {
  return request(`/assignments/${id}`, {
    method: 'DELETE',
    authToken: getAuthToken(authToken),
  });
}

export async function listLessons(
  query?: ListQuery & { type?: string },
  authToken?: string,
) {
  return request('/lessons', {
    authToken: getAuthToken(authToken),
    query,
  });
}

export async function getLesson(id: string, authToken?: string) {
  return request(`/lessons/${id}`, {
    authToken: getAuthToken(authToken),
  });
}

export async function createLesson(
  fields: Record<string, unknown>,
  files?: {
    descriptionFile?: UploadFile;
    documentFile?: UploadFile;
    videoFile?: UploadFile;
    thumbnailFile?: UploadFile;
  },
  authToken?: string,
) {
  return request('/lessons', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(fields, files),
  });
}

export async function updateLesson(
  id: string,
  fields: Record<string, unknown>,
  files?: {
    descriptionFile?: UploadFile;
    documentFile?: UploadFile;
    videoFile?: UploadFile;
    thumbnailFile?: UploadFile;
  },
  authToken?: string,
) {
  return request(`/lessons/${id}`, {
    method: 'PATCH',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(fields, files),
  });
}

export async function deleteLesson(id: string, authToken?: string) {
  return request(`/lessons/${id}`, {
    method: 'DELETE',
    authToken: getAuthToken(authToken),
  });
}

export async function listChapters(authToken?: string) {
  return request('/chapters', {
    authToken: getAuthToken(authToken),
  });
}

export async function getChapter(id: string, authToken?: string) {
  return request(`/chapters/${id}`, {
    authToken: getAuthToken(authToken),
  });
}

export async function createChapter(body: Record<string, unknown>, authToken?: string) {
  return request('/chapters', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body,
  });
}

export async function uploadChapterCover(id: string, coverImage: UploadFile, authToken?: string) {
  return request(`/chapters/${id}/cover`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(undefined, { coverImage }),
  });
}

export async function uploadChapterLessonCover(
  chapterId: string,
  lessonId: string,
  coverImage: UploadFile,
  authToken?: string,
) {
  return request(`/chapters/${chapterId}/lessons/${lessonId}/cover`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(undefined, { coverImage }),
  });
}

export async function addChapterLesson(
  chapterId: string,
  body: Record<string, unknown>,
  authToken?: string,
) {
  return request(`/chapters/${chapterId}/lessons`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body,
  });
}

export async function reorderChapterLessons(
  chapterId: string,
  body: Record<string, unknown>,
  authToken?: string,
) {
  return request(`/chapters/${chapterId}/lessons/reorder`, {
    method: 'PATCH',
    authToken: getAuthToken(authToken),
    body,
  });
}

export async function updateChapterLesson(
  chapterId: string,
  lessonId: string,
  body: Record<string, unknown>,
  authToken?: string,
) {
  return request(`/chapters/${chapterId}/lessons/${lessonId}`, {
    method: 'PATCH',
    authToken: getAuthToken(authToken),
    body,
  });
}

export async function removeChapterLesson(
  chapterId: string,
  lessonId: string,
  authToken?: string,
) {
  return request(`/chapters/${chapterId}/lessons/${lessonId}`, {
    method: 'DELETE',
    authToken: getAuthToken(authToken),
  });
}

export async function deleteChapter(id: string, authToken?: string) {
  return request(`/chapters/${id}`, {
    method: 'DELETE',
    authToken: getAuthToken(authToken),
  });
}

export async function uploadMaterials(
  files: UploadFile[],
  category: string,
  description: string,
  authToken?: string,
) {
  return request('/materials/upload', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData({ category, description }, { files }),
  });
}

export async function listMaterials(category?: string, authToken?: string) {
  return request('/materials', {
    authToken: getAuthToken(authToken),
    query: { category },
  });
}

export async function deleteMaterial(id: string, authToken?: string) {
  return request(`/materials/${id}`, {
    method: 'DELETE',
    authToken: getAuthToken(authToken),
  });
}

export async function getLessonProgress(authToken?: string) {
  return request('/progress/lessons', {
    authToken: getAuthToken(authToken),
  });
}

export async function markLessonCompleted(
  chapterId: string,
  lessonId: string,
  authToken?: string,
) {
  return request(`/progress/lessons/${chapterId}/${lessonId}/complete`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
  });
}

export async function markLessonAccessed(
  chapterId: string,
  lessonId: string,
  authToken?: string,
) {
  return request(`/progress/lessons/${chapterId}/${lessonId}/access`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
  });
}

export async function getLessonDetail(
  chapterId: string,
  lessonId: string,
  authToken?: string,
) {
  return request(`/progress/lesson-detail/${chapterId}/${lessonId}`, {
    authToken: getAuthToken(authToken),
  });
}

export async function submitQuizAnswers(
  chapterId: string,
  lessonId: string,
  quizId: string,
  answers: number[],
  authToken?: string,
) {
  return request(`/progress/lessons/${chapterId}/${lessonId}/quizzes/${quizId}/submit`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: { answers },
  });
}

export async function submitTaskSubmission(
  chapterId: string,
  lessonId: string,
  taskType: 'assignment' | 'activity',
  taskId: string,
  submissionFile: UploadFile,
  authToken?: string,
) {
  return request(`/progress/lessons/${chapterId}/${lessonId}/tasks/${taskType}/${taskId}/submit`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: buildMultipartFormData(undefined, { submissionFile }),
  });
}

export async function getAdminUserProgress(userId: string, authToken?: string) {
  return request(`/progress/admin/users/${userId}`, {
    authToken: getAuthToken(authToken),
  });
}

export async function listQuizzes(query?: ListQuery, authToken?: string) {
  return request('/quizzes', {
    authToken: getAuthToken(authToken),
    query,
  });
}

export async function getQuiz(id: string, authToken?: string) {
  return request(`/quizzes/${id}`, {
    authToken: getAuthToken(authToken),
  });
}

export async function createQuiz(body: Record<string, unknown>, authToken?: string) {
  return request('/quizzes', {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body,
  });
}

export async function updateQuiz(id: string, body: Record<string, unknown>, authToken?: string) {
  return request(`/quizzes/${id}`, {
    method: 'PATCH',
    authToken: getAuthToken(authToken),
    body,
  });
}

export async function deleteQuiz(id: string, authToken?: string) {
  return request(`/quizzes/${id}`, {
    method: 'DELETE',
    authToken: getAuthToken(authToken),
  });
}

export async function listUsers(authToken?: string) {
  return request('/users', {
    authToken: getAuthToken(authToken),
  });
}

export async function getUserProfile(authToken?: string) {
  return request('/users/profile_data', {
    authToken: getAuthToken(authToken),
  });
}

export async function getLeaderboard(
  params?: { classId?: string; schoolId?: string },
  authToken?: string,
) {
  return request('/progress/leaderboard', {
    authToken: getAuthToken(authToken),
    query: params,
  });
}

export async function deductStudentPoints(
  studentId: string,
  points: number,
  reason: string,
  authToken?: string,
) {
  return request(`/progress/students/${studentId}/deduct-points`, {
    method: 'POST',
    authToken: getAuthToken(authToken),
    body: { points, reason },
  });
}

export async function updateUserProfile(
  body: { fullName?: string; phone?: string },
  image?: UploadFile,
  authToken?: string,
) {
  return request('/users/profile', {
    method: 'PATCH',
    authToken: getAuthToken(authToken),
    body: image ? buildMultipartFormData(body, { image }) : body,
  });
}

export async function getMyTeachers(authToken?: string) {
  return request<{ _id: string; fullName: string; email: string; profileImage: string | null; phone: string | null; classIds: string[] }[]>('/users/my-teachers', {
    authToken: getAuthToken(authToken),
  });
}
