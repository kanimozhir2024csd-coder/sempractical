import {
  UserProfile,
  WorkerProfile,
  Complaint,
  AdminDashboardStats,
  ServiceConfigurationStatus,
  AppNotification,
  AuditLogEntry,
  EmailLogEntry,
  ComplaintCategory,
  HostelName,
  ComplaintPriority,
  ComplaintType,
} from '../types';

const TOKEN_KEY = 'rec_tech_campus_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    const reason = err instanceof Error ? ` ${err.message}` : '';
    throw new Error(`Could not reach the application API. Check that the backend is running.${reason}`);
  }

  const responseText = await response.text();
  let data: unknown;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    if (response.ok) {
      throw new Error(`The API returned an invalid response (HTTP ${response.status}).`);
    }
    data = { error: responseText.slice(0, 300) };
  }

  if (!response.ok) {
    const apiError =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : '';
    throw new Error(apiError || `Request failed with status ${response.status}.`);
  }

  return data as T;
}

export const api = {
  // Config & Health
  getConfigStatus: () => request<ServiceConfigurationStatus>('/config/status'),

  // Auth
  registerStudent: (payload: {
    name: string;
    email: string;
    roll_number: string;
    department?: string;
    hostel: HostelName;
    room_number: string;
    phone?: string;
    password: string;
  }) =>
    request<{ profile: UserProfile; token: string }>('/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ profile: UserProfile; workerProfile?: WorkerProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{ profile: UserProfile; workerProfile?: WorkerProfile }>('/auth/me'),

  bootstrapAdmin: (payload: { bootstrapSecret: string; name: string; email: string; password: string }) =>
    request<{ message: string; profile: UserProfile; token: string }>('/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // AI Multimodal & Duplicate Checking
  analyzeComplaint: (payload: {
    description: string;
    imageBase64?: string;
    imageMimeType?: string;
    hostel?: string;
    location?: string;
  }) =>
    request<{
      success?: boolean;
      aiServiceAvailable?: boolean;
      errorMessage?: string;
      aiResult?: {
        isValidMaintenance: boolean;
        rejectionReason?: string;
        category: ComplaintCategory;
        priority: ComplaintPriority;
        confidence: number;
        reasoning: string;
        issueSummary: string;
        followUpQuestions: string[];
      };
      duplicate: Complaint | null;
    }>('/complaints/ai-analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  checkDuplicate: (payload: { hostel: HostelName; location_detail: string; category: ComplaintCategory }) =>
    request<{ isDuplicate: boolean; duplicate: Complaint | null }>('/complaints/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createComplaint: (payload: {
    complaint_type: ComplaintType;
    hostel: HostelName;
    location_detail: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    description: string;
    ai_validation_summary?: string;
    ai_confidence?: number;
    photoDataUrl?: string;
    photoMimeType?: string;
  }) =>
    request<{ complaint: Complaint; assignedWorker?: WorkerProfile }>('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getComplaints: (params: Record<string, string | undefined> = {}) => {
    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    }
    const qs = new URLSearchParams(cleanParams).toString();
    return request<{ complaints: Complaint[]; total: number }>(`/complaints${qs ? `?${qs}` : ''}`);
  },

  getComplaint: (id: string) =>
    request<{ complaint: Complaint }>(`/complaints/${id}`),

  // Worker workflow
  acceptJob: (complaintId: string) =>
    request<{ message: string; complaint: Complaint }>(`/complaints/${complaintId}/accept`, {
      method: 'POST',
    }),

  startJob: (complaintId: string) =>
    request<{ message: string; complaint: Complaint }>(`/complaints/${complaintId}/start`, {
      method: 'POST',
    }),

  submitRepair: (
    complaintId: string,
    payload: {
      repairNotes: string;
      repairPhotoDataUrl: string;
      repairPhotoMimeType?: string;
    }
  ) =>
    request<{
      message: string;
      complaint: Complaint;
      verification: {
        result: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
        confidence: number;
        visualSummary: string;
        reasoning: string;
      };
    }>(`/complaints/${complaintId}/submit-repair`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Student workflow
  confirmSolved: (complaintId: string, payload: { confirmationNotes?: string }) =>
    request<{ message: string; complaint: Complaint }>(`/complaints/${complaintId}/confirm-solved`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reopenComplaint: (complaintId: string, payload: { explanation: string }) =>
    request<{ message: string; complaint: Complaint }>(`/complaints/${complaintId}/reopen`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin workflow
  getDashboardStats: () =>
    request<AdminDashboardStats>('/admin/dashboard'),

  approveCommonArea: (complaintId: string, payload: { approved: boolean; reason?: string }) =>
    request<{ message: string; complaint: Complaint }>(`/admin/complaints/${complaintId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  signOffCommonArea: (complaintId: string, payload: { adminNotes?: string }) =>
    request<{ message: string; complaint: Complaint }>(`/admin/complaints/${complaintId}/sign-off`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reassignJob: (complaintId: string, payload: { newWorkerId: string; reassignReason: string; allowOverride?: boolean }) =>
    request<{ message: string; complaint: Complaint }>(`/admin/complaints/${complaintId}/reassign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getWorkers: () =>
    request<{ workers: WorkerProfile[] }>('/admin/workers'),

  createWorker: (payload: {
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
    skills: string[];
    hostel_coverage: HostelName[];
    max_workload?: number;
    password: string;
  }) =>
    request<{ message: string; worker: WorkerProfile }>('/admin/workers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateWorkerStatus: (id: string, payload: { availability_status?: string; is_active?: boolean }) =>
    request<{ worker: WorkerProfile }>(`/admin/workers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getUsers: (role?: string) =>
    request<{ users: UserProfile[] }>(`/admin/users${role ? `?role=${role}` : ''}`),

  getAuditLogs: () =>
    request<{ logs: AuditLogEntry[] }>('/admin/audit-logs'),

  getEmailLogs: () =>
    request<{ logs: EmailLogEntry[] }>('/admin/email-logs'),

  // Notifications
  getNotifications: () =>
    request<{ notifications: AppNotification[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
};
