export type UserRole = 'student' | 'worker' | 'admin';

export type HostelName = 'Ruby' | 'Emerald' | 'Pearl';

export type ComplaintCategory =
  | 'electrical'
  | 'plumbing'
  | 'water_supply'
  | 'bathroom'
  | 'drainage'
  | 'furniture'
  | 'room_maintenance'
  | 'cleanliness'
  | 'wifi_internet'
  | 'carpentry'
  | 'civil_painting'
  | 'furniture_fixtures'
  | 'cleaning_sanitation'
  | 'other'
  | string;

export type ComplaintPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'PENDING_AI_VALIDATION'
  | 'AI_REJECTED'
  | 'DUPLICATE_DETECTED'
  | 'PENDING_ADMIN_APPROVAL'
  | 'APPROVAL_REJECTED'
  | 'REGISTERED'
  | 'UNASSIGNED'
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'PENDING_REPAIR_VERIFICATION'
  | 'REPAIR_VERIFICATION_FAILED'
  | 'PENDING_STUDENT_VERIFICATION'
  | 'PENDING_ADMIN_SIGN_OFF'
  | 'REOPENED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ComplaintType = 'ROOM' | 'COMMON_AREA';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  roll_number?: string;
  department?: string;
  hostel?: HostelName;
  room_number?: string;
  phone?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WorkerProfile {
  id: string;
  profile_id: string;
  name?: string;
  email?: string;
  phone?: string;
  specialization: string; // e.g., 'Electrical', 'Plumbing', 'Furniture', 'Housekeeping', 'Network', 'General Maintenance'
  skillCategory?: string; // alias for specialization
  skills: string[];
  hostel_coverage: HostelName[];
  availability_status: 'available' | 'busy' | 'off_duty';
  current_workload: number;
  max_workload: number;
  is_active: boolean;
  created_at?: string;
}

export interface ComplaintPhoto {
  id: string;
  complaint_id: string;
  photo_type: 'ORIGINAL_ISSUE' | 'REPAIR_EVIDENCE';
  storage_path: string;
  file_url: string;
  uploaded_by: string;
  mime_type?: string;
  file_size?: number;
  created_at?: string;
}

export interface ComplaintAssignment {
  id: string;
  complaint_id: string;
  worker_id: string;
  assigned_by?: string;
  assignment_status: 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' | 'REASSIGNED' | 'COMPLETED';
  assignment_reason?: string;
  is_override?: boolean;
  reassignment_history?: Array<{
    previous_worker_id: string;
    new_worker_id: string;
    changed_by: string;
    reason: string;
    is_override?: boolean;
    timestamp: string;
  }>;
  assigned_at?: string;
  accepted_at?: string;
  completed_at?: string;
  worker_name?: string;
  worker_phone?: string;
  worker_specialization?: string;
}

export interface ComplaintCompletion {
  id: string;
  complaint_id: string;
  worker_id?: string;
  repair_notes?: string;
  evidence_photo_id?: string;
  ai_verification_status?: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  ai_verification_notes?: string;
  student_confirmed?: boolean;
  student_confirmation_notes?: string;
  student_confirmed_at?: string;
  admin_signed_off?: boolean;
  admin_signed_off_by?: string;
  admin_notes?: string;
  admin_signed_off_at?: string;
  created_at?: string;
}

export interface ComplaintStatusHistory {
  id: string;
  complaint_id: string;
  previous_status?: ComplaintStatus;
  new_status: ComplaintStatus;
  actor_id?: string;
  actor_role?: UserRole;
  reason?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface Complaint {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_email?: string;
  complaint_type: ComplaintType;
  hostel: HostelName;
  location_detail: string;
  category: ComplaintCategory;
  required_specialization?: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  description: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  assigned_worker_specialization?: string;
  ai_validation_summary?: string;
  ai_confidence?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  photos?: ComplaintPhoto[];
  active_assignment?: ComplaintAssignment;
  completion?: ComplaintCompletion;
  history?: ComplaintStatusHistory[];
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  related_complaint_id?: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  read_status: boolean;
  created_at: string;
}

export interface EmailLogEntry {
  id: string;
  complaint_id?: string;
  recipient: string;
  event_type: string;
  delivery_status: 'QUEUED' | 'SENT' | 'FAILED' | 'PENDING_CONFIGURATION';
  attempt_count: number;
  provider_message_id?: string;
  error_message?: string;
  created_at: string;
  sent_at?: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  actor_role?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AdminDashboardStats {
  totalActive: number;
  newUnvalidated: number;
  pendingApprovals: number;
  criticalHighPriority: number;
  unassigned: number;
  assignedInProgress: number;
  awaitingStudentConfirmation: number;
  awaitingAdminSignOff: number;
  completed: number;
  reopened: number;
  hostelBreakdown: Record<HostelName, number>;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<ComplaintPriority, number>;
  workersOverview: {
    totalWorkers: number;
    availableWorkers: number;
    busyWorkers: number;
    avgWorkload: number;
  };
}

export interface ServiceConfigurationStatus {
  storageEngine: string;
  gemini: boolean;
  resend: boolean;
  adminEmail: string;
  emailFrom: string;
  totalTickets: number;
  totalWorkers: number;
  activeHostels: string[];
}

/**
 * Canonical technician specialization domains:
 * - ELECTRICAL: Electrical Technician
 * - PLUMBING: Plumbing Technician (includes Water Supply, Bathroom, Drainage)
 * - FURNITURE: Furniture Technician / Carpenter
 * - CLEANLINESS: Housekeeping Staff
 * - NETWORK: Network Technician (Wi-Fi / Internet)
 * - GENERAL_MAINTENANCE: General Maintenance Technician (Room Maintenance, Civil, Other)
 */
export type CanonicalSpecialization =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'FURNITURE'
  | 'CLEANLINESS'
  | 'NETWORK'
  | 'GENERAL_MAINTENANCE';

export function getCanonicalSpecialization(input: string): CanonicalSpecialization {
  if (!input) return 'GENERAL_MAINTENANCE';
  const clean = input.toLowerCase().trim().replace(/[-_/\s]+/g, ' ');

  if (
    clean.includes('electr') ||
    clean.includes('light') ||
    clean.includes('fan') ||
    clean.includes('socket') ||
    clean.includes('power') ||
    clean.includes('switch') ||
    clean.includes('mcb') ||
    clean.includes('wiring')
  ) {
    return 'ELECTRICAL';
  }

  if (
    clean.includes('plumb') ||
    clean.includes('water supply') ||
    clean.includes('water') ||
    clean.includes('bath') ||
    clean.includes('drain') ||
    clean.includes('pipe') ||
    clean.includes('tap') ||
    clean.includes('leak') ||
    clean.includes('sink') ||
    clean.includes('toilet') ||
    clean.includes('flush')
  ) {
    return 'PLUMBING';
  }

  if (
    clean.includes('furnitur') ||
    clean.includes('carpent') ||
    clean.includes('wood') ||
    clean.includes('cot') ||
    clean.includes('bed') ||
    clean.includes('desk') ||
    clean.includes('chair') ||
    clean.includes('table') ||
    clean.includes('almirah') ||
    clean.includes('cupboard')
  ) {
    return 'FURNITURE';
  }

  if (
    clean.includes('clean') ||
    clean.includes('housekeep') ||
    clean.includes('sanitat') ||
    clean.includes('sweep') ||
    clean.includes('dust') ||
    clean.includes('garbage') ||
    clean.includes('waste')
  ) {
    return 'CLEANLINESS';
  }

  if (
    clean.includes('wifi') ||
    clean.includes('wi fi') ||
    clean.includes('internet') ||
    clean.includes('network') ||
    clean.includes('lan') ||
    clean.includes('router')
  ) {
    return 'NETWORK';
  }

  if (
    clean.includes('room main') ||
    clean.includes('civil') ||
    clean.includes('paint') ||
    clean.includes('wall') ||
    clean.includes('tile') ||
    clean.includes('general') ||
    clean.includes('other')
  ) {
    return 'GENERAL_MAINTENANCE';
  }

  return 'GENERAL_MAINTENANCE';
}

/**
 * Normalizes complaint categories and maps them to the required technician specialization:
 * - Electrical → Electrical Technician only
 * - Plumbing → Plumbing Technician only
 * - Water Supply → Plumbing Technician
 * - Bathroom → Plumbing Technician
 * - Drainage → Plumbing Technician
 * - Furniture → Furniture Technician / Carpenter
 * - Room Maintenance → General Maintenance Technician
 * - Cleanliness → Housekeeping Staff
 * - Wi-Fi / Internet → Network Technician
 * - Other → General Maintenance Technician
 */
export function getRequiredSpecializationForCategory(category: string): string {
  const canonical = getCanonicalSpecialization(category);
  switch (canonical) {
    case 'ELECTRICAL':
      return 'Electrical';
    case 'PLUMBING':
      return 'Plumbing';
    case 'FURNITURE':
      return 'Furniture';
    case 'CLEANLINESS':
      return 'Cleanliness';
    case 'NETWORK':
      return 'Wi-Fi / Internet';
    case 'GENERAL_MAINTENANCE':
    default:
      if (category && category.toLowerCase().includes('room')) {
        return 'Room Maintenance';
      }
      return 'General Maintenance';
  }
}

/**
 * Validates whether a technician's specialization or skills match the required specialization.
 * Strictly prevents assigning electrical complaints to plumbing technicians, or plumbing complaints to electrical technicians.
 */
export function isTechnicianSpecializedIn(
  technicianSpecialization: string,
  technicianSkills: string[] | undefined,
  requiredSpecializationOrCategory: string
): boolean {
  if (!technicianSpecialization && (!technicianSkills || technicianSkills.length === 0)) {
    return false;
  }

  const targetCanonical = getCanonicalSpecialization(requiredSpecializationOrCategory);
  const techCanonical = getCanonicalSpecialization(technicianSpecialization);

  // Direct canonical match
  if (targetCanonical === techCanonical) {
    return true;
  }

  // Also check skills array
  if (Array.isArray(technicianSkills)) {
    return technicianSkills.some(
      (skill) => getCanonicalSpecialization(skill) === targetCanonical
    );
  }

  return false;
}
