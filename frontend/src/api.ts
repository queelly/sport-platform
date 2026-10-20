let accessTokenMemory: string | null = sessionStorage.getItem('sp_access_token');

export function setAccessToken(token: string | null) {
  accessTokenMemory = token;
  if (token) {
    sessionStorage.setItem('sp_access_token', token);
  } else {
    sessionStorage.removeItem('sp_access_token');
  }
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export const getAuthToken = getAccessToken;

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessTokenMemory) {
    headers.set('Authorization', `Bearer ${accessTokenMemory}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retryOn401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
  }

  if (!response.ok) {
    let errBody: any = null;
    try {
      errBody = await response.json();
    } catch {
      // ignore
    }
    const msg = errBody?.message || `Ошибка запроса (${response.status})`;
    throw new ApiError(msg, response.status, errBody?.fieldErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function tryRefreshSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setAccessToken(null);
      return false;
    }
    const data = await res.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function uploadAttachmentFile(file: File, contextType = 'DISCUSSION') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('contextType', contextType);
  return apiFetch<{
    id: string;
    originalFilename: string;
    attachmentType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    mimeType: string;
    fileSize: number;
    downloadUrl: string;
    createdAt: string;
  }>('/api/v1/attachments', {
    method: 'POST',
    body: formData,
  });
}

export const SKILL_LABELS: Record<string, string> = {
  ANY: 'Любой уровень',
  BEGINNER: 'Начинающий',
  AMATEUR: 'Любитель',
  ADVANCED: 'Продвинутый',
  COMPETITIVE: 'Соревновательный',
};

export const ORG_TYPE_LABELS: Record<string, string> = {
  SPORTS_CLUB: 'Спортивная организация',
  COMMUNITY: 'Городское сообщество',
  FEDERATION: 'Спортивная федерация',
  SECTION: 'Секция / Студия',
  SCHOOL: 'Спортивная школа',
  OTHER: 'Другое объединение',
};

export const ORG_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-slate-100 text-slate-700' },
  PENDING_REVIEW: { label: 'На проверке администратора', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Проверенная организация', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REJECTED: { label: 'Отклонено (требует исправления)', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  NEEDS_REVISION: { label: 'Возвращено на доработку', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  SUSPENDED: { label: 'Приостановлена администратором', color: 'bg-rose-100 text-rose-900 border-rose-300' },
};

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  EVENT_COMPLAINT: 'Жалоба на мероприятие',
  USER_COMPLAINT: 'Жалоба на пользователя',
  ORGANIZATION_COMPLAINT: 'Жалоба на организацию',
  ACCOUNT_ISSUE: 'Проблема с аккаунтом',
  TECHNICAL_ISSUE: 'Техническая проблема',
  NOTIFICATION_ISSUE: 'Проблема с уведомлениями / VK',
  OTHER: 'Другое обращение',
};

export const TICKET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Открыт', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'В работе у администратора', color: 'bg-amber-100 text-amber-800' },
  WAITING_FOR_USER: { label: 'Ожидает вашего ответа', color: 'bg-purple-100 text-purple-800' },
  RESOLVED: { label: 'Решён', color: 'bg-emerald-100 text-emerald-800' },
  CLOSED: { label: 'Закрыт', color: 'bg-slate-200 text-slate-700' },
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье',
};

export function formatDateTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}
