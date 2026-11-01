import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  UserProfile,
  WorkerProfile,
  Complaint,
  ComplaintAssignment,
  ComplaintPhoto,
  ComplaintCompletion,
  ComplaintStatusHistory,
  AppNotification,
  EmailLogEntry,
  AuditLogEntry,
  AdminDashboardStats,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
  HostelName,
  ComplaintType,
  getRequiredSpecializationForCategory,
  isTechnicianSpecializedIn,
} from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'rec_maintenance_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface LocalDatabaseState {
  profiles: UserProfile[];
  workers: WorkerProfile[];
  complaints: Complaint[];
  assignments: ComplaintAssignment[];
  photos: ComplaintPhoto[];
  completions: ComplaintCompletion[];
  statusHistory: ComplaintStatusHistory[];
  notifications: AppNotification[];
  emailLogs: EmailLogEntry[];
  auditLogs: AuditLogEntry[];
  passwords: Record<string, string>; // userId -> salt:hash
}

// Password hashing utilities
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return key === hash;
}

function getInitialLocalDb(): LocalDatabaseState {
  const now = new Date().toISOString();
  const adminId = 'rec-admin-01';
  const worker1Id = 'rec-worker-murugan';
  const worker2Id = 'rec-worker-selvam';
  const worker3Id = 'rec-worker-karthik';
  const worker4Id = 'rec-worker-raju';
  const worker5Id = 'rec-worker-vignesh';
  const worker6Id = 'rec-worker-shankar';
  const student1Id = 'rec-student-aravind';
  const student2Id = 'rec-student-kavya';

  const defaultAdmin: UserProfile = {
    id: adminId,
    role: 'admin',
    name: 'REC Maintenance Administrator',
    email: 'admin@rec.ac.in',
    phone: '+91 98401 23456',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const worker1Profile: UserProfile = {
    id: worker1Id,
    role: 'worker',
    name: 'Murugan K. (Plumbing Technician)',
    email: 'murugan.plumber@rec.ac.in',
    phone: '+91 94441 12301',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const worker2Profile: UserProfile = {
    id: worker2Id,
    role: 'worker',
    name: 'Selvam R. (Electrical Technician)',
    email: 'selvam.electrician@rec.ac.in',
    phone: '+91 94441 12302',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const worker3Profile: UserProfile = {
    id: worker3Id,
    role: 'worker',
    name: 'Karthik N. (Furniture Technician / Carpenter)',
    email: 'karthik.carpenter@rec.ac.in',
    phone: '+91 94441 12303',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const worker4Profile: UserProfile = {
    id: worker4Id,
    role: 'worker',
    name: 'Raju M. (Housekeeping Staff)',
    email: 'raju.housekeeping@rec.ac.in',
    phone: '+91 94441 12304',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const worker5Profile: UserProfile = {
    id: worker5Id,
    role: 'worker',
    name: 'Vignesh S. (Network Technician)',
    email: 'vignesh.network@rec.ac.in',
    phone: '+91 94441 12305',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const worker6Profile: UserProfile = {
    id: worker6Id,
    role: 'worker',
    name: 'Shankar T. (General Maintenance Technician)',
    email: 'shankar.general@rec.ac.in',
    phone: '+91 94441 12306',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const student1Profile: UserProfile = {
    id: student1Id,
    role: 'student',
    name: 'Aravind Kumar',
    email: 'aravind.student@rec.ac.in',
    roll_number: '210701045',
    department: 'Computer Science & Engineering',
    hostel: 'Ruby',
    room_number: '304',
    phone: '+91 98402 11111',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const student2Profile: UserProfile = {
    id: student2Id,
    role: 'student',
    name: 'Kavya S.',
    email: 'kavya.student@rec.ac.in',
    roll_number: '210701088',
    department: 'Electronics & Communication',
    hostel: 'Emerald',
    room_number: '208',
    phone: '+91 98402 22222',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  // Distinct technicians with explicit specializations matching the requirements
  const workersList: WorkerProfile[] = [
    {
      id: 'w-01',
      profile_id: worker1Id,
      name: worker1Profile.name,
      email: worker1Profile.email,
      phone: worker1Profile.phone,
      specialization: 'Plumbing',
      skillCategory: 'Plumbing',
      skills: ['Plumbing', 'Water Supply', 'Bathroom', 'Drainage'],
      hostel_coverage: ['Ruby', 'Emerald', 'Pearl'],
      availability_status: 'available',
      current_workload: 1,
      max_workload: 5,
      is_active: true,
      created_at: now,
    },
    {
      id: 'w-02',
      profile_id: worker2Id,
      name: worker2Profile.name,
      email: worker2Profile.email,
      phone: worker2Profile.phone,
      specialization: 'Electrical',
      skillCategory: 'Electrical',
      skills: ['Electrical'],
      hostel_coverage: ['Ruby', 'Emerald', 'Pearl'],
      availability_status: 'available',
      current_workload: 1,
      max_workload: 5,
      is_active: true,
      created_at: now,
    },
    {
      id: 'w-03',
      profile_id: worker3Id,
      name: worker3Profile.name,
      email: worker3Profile.email,
      phone: worker3Profile.phone,
      specialization: 'Furniture',
      skillCategory: 'Furniture',
      skills: ['Furniture', 'Carpentry'],
      hostel_coverage: ['Ruby', 'Emerald', 'Pearl'],
      availability_status: 'available',
      current_workload: 0,
      max_workload: 5,
      is_active: true,
      created_at: now,
    },
    {
      id: 'w-04',
      profile_id: worker4Id,
      name: worker4Profile.name,
      email: worker4Profile.email,
      phone: worker4Profile.phone,
      specialization: 'Cleanliness',
      skillCategory: 'Cleanliness',
      skills: ['Cleanliness', 'Sanitation', 'Housekeeping'],
      hostel_coverage: ['Ruby', 'Emerald', 'Pearl'],
      availability_status: 'available',
      current_workload: 0,
      max_workload: 5,
      is_active: true,
      created_at: now,
    },
    {
      id: 'w-05',
      profile_id: worker5Id,
      name: worker5Profile.name,
      email: worker5Profile.email,
      phone: worker5Profile.phone,
      specialization: 'Wi-Fi / Internet',
      skillCategory: 'Wi-Fi / Internet',
      skills: ['Wi-Fi / Internet', 'Network'],
      hostel_coverage: ['Ruby', 'Emerald', 'Pearl'],
      availability_status: 'available',
      current_workload: 0,
      max_workload: 5,
      is_active: true,
      created_at: now,
    },
    {
      id: 'w-06',
      profile_id: worker6Id,
      name: worker6Profile.name,
      email: worker6Profile.email,
      phone: worker6Profile.phone,
      specialization: 'General Maintenance',
      skillCategory: 'General Maintenance',
      skills: ['Room Maintenance', 'General Maintenance', 'Other'],
      hostel_coverage: ['Ruby', 'Emerald', 'Pearl'],
      availability_status: 'available',
      current_workload: 0,
      max_workload: 5,
      is_active: true,
      created_at: now,
    },
  ];

  // Seed sample complaints with properly linked assignments
  const sampleComplaints: Complaint[] = [
    {
      id: 'REC-20261014-0001',
      reporter_id: student1Id,
      reporter_name: student1Profile.name,
      reporter_email: student1Profile.email,
      complaint_type: 'ROOM',
      hostel: 'Ruby',
      location_detail: 'Room 304',
      category: 'plumbing',
      required_specialization: 'Plumbing',
      priority: 'HIGH',
      status: 'ASSIGNED',
      assigned_worker_id: 'w-01',
      assigned_worker_name: worker1Profile.name,
      assigned_worker_specialization: 'Plumbing',
      description: 'Continuous water leakage from washbasin inlet pipe under the sink. Floor is getting waterlogged.',
      ai_validation_summary: 'Plumbing leak detected under washbasin. High priority due to water wastage.',
      ai_confidence: 0.94,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'REC-20261014-0002',
      reporter_id: student2Id,
      reporter_name: student2Profile.name,
      reporter_email: student2Profile.email,
      complaint_type: 'COMMON_AREA',
      hostel: 'Emerald',
      location_detail: 'Floor 2 Corridor',
      category: 'electrical',
      required_specialization: 'Electrical',
      priority: 'CRITICAL',
      status: 'PENDING_ADMIN_APPROVAL',
      description: 'Emergency corridor tube light flickering with sparking sound from choke ballast.',
      ai_validation_summary: 'Critical electrical hazard identified. Sparking ballast requires immediate admin sign-off.',
      ai_confidence: 0.98,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'REC-20261014-0003',
      reporter_id: student1Id,
      reporter_name: student1Profile.name,
      reporter_email: student1Profile.email,
      complaint_type: 'ROOM',
      hostel: 'Ruby',
      location_detail: 'Room 305',
      category: 'cleanliness',
      required_specialization: 'Cleanliness',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      assigned_worker_id: 'w-04',
      assigned_worker_name: worker4Profile.name,
      assigned_worker_specialization: 'Cleanliness',
      description: 'Corridor and washbasin area needs chemical cleaning and sanitation.',
      ai_validation_summary: 'Sanitation cleaning verified and completed.',
      ai_confidence: 0.91,
      created_at: now,
      updated_at: now,
      resolved_at: now,
    },
    {
      id: 'REC-20261014-0004',
      reporter_id: student2Id,
      reporter_name: student2Profile.name,
      reporter_email: student2Profile.email,
      complaint_type: 'ROOM',
      hostel: 'Emerald',
      location_detail: 'Room 208',
      category: 'electrical',
      required_specialization: 'Electrical',
      priority: 'HIGH',
      status: 'PENDING_STUDENT_VERIFICATION',
      assigned_worker_id: 'w-02',
      assigned_worker_name: worker2Profile.name,
      assigned_worker_specialization: 'Electrical',
      description: 'Ceiling fan regulator switch burnt and fan not running.',
      ai_validation_summary: 'Electrical switchboard repair completed.',
      ai_confidence: 0.93,
      created_at: now,
      updated_at: now,
    },
  ];

  const sampleAssignments: ComplaintAssignment[] = [
    {
      id: crypto.randomUUID(),
      complaint_id: 'REC-20261014-0001',
      worker_id: 'w-01',
      worker_name: worker1Profile.name,
      worker_phone: worker1Profile.phone,
      worker_specialization: 'Plumbing',
      assignment_status: 'ASSIGNED',
      assignment_reason: 'Automated specialization match: Plumbing Technician in Ruby',
      assigned_at: now,
    },
    {
      id: crypto.randomUUID(),
      complaint_id: 'REC-20261014-0004',
      worker_id: 'w-02',
      worker_name: worker2Profile.name,
      worker_phone: worker2Profile.phone,
      worker_specialization: 'Electrical',
      assignment_status: 'ACCEPTED',
      assignment_reason: 'Automated specialization match: Electrical Technician in Emerald',
      assigned_at: now,
      accepted_at: now,
    },
  ];

  const sampleCompletions: ComplaintCompletion[] = [
    {
      id: crypto.randomUUID(),
      complaint_id: 'REC-20261014-0003',
      worker_id: 'w-04',
      repair_notes: 'Cleaned and sanitized corridor and washbasin with standard disinfectant.',
      ai_verification_status: 'PASS',
      ai_verification_notes: 'Verified cleanliness of target area.',
      student_confirmed: true,
      student_confirmation_notes: 'Sanitation completed cleanly.',
      student_confirmed_at: now,
      created_at: now,
    },
    {
      id: crypto.randomUUID(),
      complaint_id: 'REC-20261014-0004',
      worker_id: 'w-02',
      repair_notes: 'Replaced 5-step electronic fan regulator with genuine Anchor Roma unit. Verified fan rotation on all speeds.',
      ai_verification_status: 'PASS',
      ai_verification_notes: 'New regulator switch visibly installed and functional.',
      student_confirmed: false,
      created_at: now,
    },
  ];

  const sampleStatusHistory: ComplaintStatusHistory[] = [
    {
      id: crypto.randomUUID(),
      complaint_id: 'REC-20261014-0001',
      new_status: 'REGISTERED',
      actor_id: student1Id,
      actor_role: 'student',
      reason: 'Reported via REC AI Chatbot',
      created_at: now,
    },
    {
      id: crypto.randomUUID(),
      complaint_id: 'REC-20261014-0001',
      previous_status: 'REGISTERED',
      new_status: 'ASSIGNED',
      reason: 'Automated specialization dispatch to Plumbing Technician (Murugan K.)',
      created_at: now,
    },
    {
      id: crypto.randomUUID(),
      complaint_id: 'REC-20261014-0002',
      new_status: 'PENDING_ADMIN_APPROVAL',
      actor_id: student2Id,
      actor_role: 'student',
      reason: 'Common-area electrical issue requires admin review',
      created_at: now,
    },
  ];

  const passwords: Record<string, string> = {
    [adminId]: hashPassword('Admin@REC2026!'),
    [worker1Id]: hashPassword('Worker@REC2026!'),
    [worker2Id]: hashPassword('Worker@REC2026!'),
    [worker3Id]: hashPassword('Worker@REC2026!'),
    [worker4Id]: hashPassword('Worker@REC2026!'),
    [worker5Id]: hashPassword('Worker@REC2026!'),
    [worker6Id]: hashPassword('Worker@REC2026!'),
    [student1Id]: hashPassword('Student@REC2026!'),
    [student2Id]: hashPassword('Student@REC2026!'),
  };

  return {
    profiles: [
      defaultAdmin,
      worker1Profile,
      worker2Profile,
      worker3Profile,
      worker4Profile,
      worker5Profile,
      worker6Profile,
      student1Profile,
      student2Profile,
    ],
    workers: workersList,
    complaints: sampleComplaints,
    assignments: sampleAssignments,
    photos: [],
    completions: sampleCompletions,
    statusHistory: sampleStatusHistory,
    notifications: [
      {
        id: crypto.randomUUID(),
        recipient_id: student1Id,
        title: 'Technician Assigned',
        message: 'Plumbing Technician Murugan K. has been dispatched for ticket REC-20261014-0001.',
        related_complaint_id: 'REC-20261014-0001',
        type: 'INFO',
        read_status: false,
        created_at: now,
      },
      {
        id: crypto.randomUUID(),
        recipient_id: student2Id,
        title: 'Repair Completed - Confirm Resolution',
        message: 'Electrical Technician Selvam has submitted repair evidence for Room 208 fan regulator. Please inspect and confirm.',
        related_complaint_id: 'REC-20261014-0004',
        type: 'URGENT',
        read_status: false,
        created_at: now,
      },
    ],
    emailLogs: [],
    auditLogs: [
      {
        id: crypto.randomUUID(),
        actor_id: adminId,
        actor_role: 'admin',
        action: 'SYSTEM_BOOTSTRAP',
        resource_type: 'system',
        details: { message: 'Local storage engine initialized with category-based technician specialization records.' },
        created_at: now,
      },
    ],
    passwords,
  };
}

function loadLocalDb(): LocalDatabaseState {
  if (fs.existsSync(LOCAL_DB_FILE)) {
    let parsed: LocalDatabaseState;
    try {
      parsed = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8')) as LocalDatabaseState;
    } catch (err) {
      throw new Error(`Could not read existing complaint data at ${LOCAL_DB_FILE}: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (
      parsed &&
      Array.isArray(parsed.profiles) &&
      Array.isArray(parsed.workers) &&
      Array.isArray(parsed.complaints) &&
      Array.isArray(parsed.assignments) &&
      Array.isArray(parsed.photos) &&
      Array.isArray(parsed.completions) &&
      Array.isArray(parsed.statusHistory) &&
      Array.isArray(parsed.notifications) &&
      Array.isArray(parsed.emailLogs) &&
      Array.isArray(parsed.auditLogs) &&
      parsed.passwords &&
      typeof parsed.passwords === 'object'
    ) {
        const initial = getInitialLocalDb();
        let updated = false;

        // Ensure all standard initial specialized technicians exist in profiles and workers
        for (const initWorker of initial.workers) {
          if (!parsed.workers.some((w: WorkerProfile) => w.id === initWorker.id || w.profile_id === initWorker.profile_id)) {
            parsed.workers.push(initWorker);
            const matchingProfile = initial.profiles.find((p) => p.id === initWorker.profile_id);
            if (matchingProfile && !parsed.profiles.some((p: UserProfile) => p.id === matchingProfile.id)) {
              parsed.profiles.push(matchingProfile);
            }
            if (initial.passwords[initWorker.profile_id] && !parsed.passwords[initWorker.profile_id]) {
              parsed.passwords[initWorker.profile_id] = initial.passwords[initWorker.profile_id];
            }
            updated = true;
          }
        }

        // Upgrade and normalize all worker specialization fields
        for (const w of parsed.workers) {
          if (!w.specialization) {
            if (w.name?.toLowerCase().includes('plumb') || w.skills?.some((s: string) => s.toLowerCase().includes('plumb') || s.toLowerCase().includes('water'))) {
              w.specialization = 'Plumbing';
            } else if (w.name?.toLowerCase().includes('electr') || w.skills?.some((s: string) => s.toLowerCase().includes('electr'))) {
              w.specialization = 'Electrical';
            } else if (w.name?.toLowerCase().includes('carpent') || w.skills?.some((s: string) => s.toLowerCase().includes('carpent') || s.toLowerCase().includes('furnitur'))) {
              w.specialization = 'Furniture';
            } else if (w.name?.toLowerCase().includes('housekeep') || w.skills?.some((s: string) => s.toLowerCase().includes('clean') || s.toLowerCase().includes('housekeep'))) {
              w.specialization = 'Cleanliness';
            } else if (w.name?.toLowerCase().includes('network') || w.skills?.some((s: string) => s.toLowerCase().includes('network') || s.toLowerCase().includes('wifi'))) {
              w.specialization = 'Wi-Fi / Internet';
            } else {
              w.specialization = 'General Maintenance';
            }
            w.skillCategory = w.specialization;
            updated = true;
          } else if (!w.skillCategory) {
            w.skillCategory = w.specialization;
            updated = true;
          }
        }
        if (updated) {
          saveLocalDb(parsed);
        }
        return parsed;
    }

    throw new Error(`Existing complaint data at ${LOCAL_DB_FILE} has an invalid structure; it was not overwritten.`);
  }

  const initial = getInitialLocalDb();
  saveLocalDb(initial);
  return initial;
}

function saveLocalDb(state: LocalDatabaseState): void {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    throw new Error(`Failed to write complaint data to ${LOCAL_DB_FILE}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export class DatabaseService {
  constructor() {
    loadLocalDb();
  }

  public getConfigurationStatus() {
    const db = loadLocalDb();
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    return {
      storageEngine: 'Embedded High-Performance JSON Engine (No External DB required)',
      gemini: Boolean(geminiApiKey?.trim() && geminiApiKey !== 'MY_GEMINI_API_KEY'),
      resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== ''),
      adminEmail: process.env.ADMIN_EMAIL || 'admin@rec.ac.in',
      emailFrom: process.env.EMAIL_FROM || 'maintenance@rec.ac.in',
      totalTickets: db.complaints.length,
      totalWorkers: db.workers.length,
      activeHostels: ['Ruby', 'Emerald', 'Pearl'],
    };
  }

  // PROFILES & AUTH
  public async getProfileByEmail(email: string): Promise<UserProfile | null> {
    const db = loadLocalDb();
    const found = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    return found || null;
  }

  public async getProfileById(id: string): Promise<UserProfile | null> {
    const db = loadLocalDb();
    const found = db.profiles.find((p) => p.id === id);
    return found || null;
  }

  public async getPasswordHash(userId: string): Promise<string | null> {
    const db = loadLocalDb();
    return db.passwords[userId] || null;
  }

  public async createProfile(
    profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    rawPassword?: string
  ): Promise<UserProfile> {
    const db = loadLocalDb();
    const id = profile.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      ...profile,
      id,
      created_at: now,
      updated_at: now,
    };
    db.profiles.push(newProfile);
    if (rawPassword) {
      db.passwords[id] = hashPassword(rawPassword);
    }
    saveLocalDb(db);

    await this.recordAuditLog({
      actor_id: id,
      actor_role: profile.role,
      action: 'USER_REGISTERED',
      resource_type: 'profiles',
      resource_id: id,
      details: { email: profile.email, role: profile.role },
    });
    return newProfile;
  }

  public async getAllProfiles(roleFilter?: string): Promise<UserProfile[]> {
    const db = loadLocalDb();
    if (roleFilter) {
      return db.profiles.filter((p) => p.role === roleFilter);
    }
    return db.profiles;
  }

  public async updateProfileStatus(id: string, is_active: boolean): Promise<UserProfile | null> {
    const db = loadLocalDb();
    const profile = db.profiles.find((p) => p.id === id);
    if (!profile) return null;
    profile.is_active = is_active;
    profile.updated_at = new Date().toISOString();
    saveLocalDb(db);
    return profile;
  }

  // WORKERS
  public async createWorker(params: {
    name: string;
    email: string;
    phone?: string;
    specialization?: string;
    skillCategory?: string;
    skills: string[];
    hostel_coverage: HostelName[];
    max_workload?: number;
    rawPassword?: string;
  }): Promise<{ profile: UserProfile; worker: WorkerProfile }> {
    const db = loadLocalDb();
    const existing = db.profiles.find((p) => p.email.toLowerCase() === params.email.toLowerCase());
    if (existing) {
      throw new Error(`An account with email ${params.email} already exists.`);
    }
    const profileId = crypto.randomUUID();
    const workerId = crypto.randomUUID();
    const now = new Date().toISOString();

    const spec = params.specialization || params.skillCategory || (params.skills[0] ? getRequiredSpecializationForCategory(params.skills[0]) : 'General Maintenance');

    const profile: UserProfile = {
      id: profileId,
      role: 'worker',
      name: params.name,
      email: params.email,
      phone: params.phone,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    const worker: WorkerProfile = {
      id: workerId,
      profile_id: profileId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      specialization: spec,
      skillCategory: spec,
      skills: Array.isArray(params.skills) && params.skills.length > 0 ? params.skills : [spec],
      hostel_coverage: params.hostel_coverage,
      availability_status: 'available',
      current_workload: 0,
      max_workload: params.max_workload || 5,
      is_active: true,
      created_at: now,
    };

    db.profiles.push(profile);
    db.workers.push(worker);
    if (params.rawPassword) {
      db.passwords[profileId] = hashPassword(params.rawPassword);
    }
    saveLocalDb(db);
    return { profile, worker };
  }

  public async getWorkerByProfileId(profileId: string): Promise<WorkerProfile | null> {
    const db = loadLocalDb();
    const worker = db.workers.find((w) => w.profile_id === profileId);
    if (!worker) return null;
    const profile = db.profiles.find((p) => p.id === profileId);
    return {
      ...worker,
      name: profile?.name,
      email: profile?.email,
      phone: profile?.phone,
    };
  }

  public async getAllWorkers(): Promise<WorkerProfile[]> {
    const db = loadLocalDb();
    return db.workers.map((w) => {
      const profile = db.profiles.find((p) => p.id === w.profile_id);
      return {
        ...w,
        name: profile?.name,
        email: profile?.email,
        phone: profile?.phone,
        is_active: (profile?.is_active ?? true) && w.is_active,
      };
    });
  }

  public async updateWorkerStatus(
    workerId: string,
    params: {
      availability_status?: 'available' | 'busy' | 'off_duty';
      is_active?: boolean;
      current_workload?: number;
      specialization?: string;
      skills?: string[];
    }
  ): Promise<WorkerProfile | null> {
    const db = loadLocalDb();
    const worker = db.workers.find((w) => w.id === workerId);
    if (!worker) return null;
    if (params.availability_status) worker.availability_status = params.availability_status;
    if (typeof params.is_active === 'boolean') worker.is_active = params.is_active;
    if (typeof params.current_workload === 'number') worker.current_workload = params.current_workload;
    if (params.specialization) {
      worker.specialization = params.specialization;
      worker.skillCategory = params.specialization;
    }
    if (Array.isArray(params.skills)) worker.skills = params.skills;
    saveLocalDb(db);
    return worker;
  }

  public async deleteWorker(workerId: string): Promise<boolean> {
    const db = loadLocalDb();
    const idx = db.workers.findIndex((w) => w.id === workerId);
    if (idx === -1) return false;
    const worker = db.workers[idx];
    db.workers.splice(idx, 1);
    db.profiles = db.profiles.filter((p) => p.id !== worker.profile_id);
    delete db.passwords[worker.profile_id];
    saveLocalDb(db);
    return true;
  }

  // COMPLAINTS
  public generateTicketId(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const db = loadLocalDb();
    const todayIds = new Set(db.complaints.filter((c) => c.id.startsWith(`REC-${today}-`)).map((c) => c.id));
    let sequence = 1;
    let candidate = `REC-${today}-${String(sequence).padStart(4, '0')}`;
    while (todayIds.has(candidate)) {
      sequence += 1;
      candidate = `REC-${today}-${String(sequence).padStart(4, '0')}`;
    }
    return candidate;
  }

  public async checkDuplicate(params: {
    hostel: HostelName;
    location_detail: string;
    category: ComplaintCategory;
  }): Promise<Complaint | null> {
    const db = loadLocalDb();
    const nonActiveStatuses: ComplaintStatus[] = [
      'COMPLETED',
      'CANCELLED',
      'AI_REJECTED',
      'APPROVAL_REJECTED',
    ];
    const cleanInputLoc = params.location_detail.trim().toLowerCase().replace(/^room\s*/i, '');
    const duplicate = db.complaints.find((c) => {
      const cleanStoredLoc = c.location_detail.trim().toLowerCase().replace(/^room\s*/i, '');
      return (
        c.hostel === params.hostel &&
        cleanStoredLoc === cleanInputLoc &&
        c.category.toLowerCase().trim() === params.category.toLowerCase().trim() &&
        !nonActiveStatuses.includes(c.status)
      );
    });
    return duplicate || null;
  }

  public async createComplaint(params: {
    reporter_id: string;
    complaint_type: ComplaintType;
    hostel: HostelName;
    location_detail: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    description: string;
    ai_validation_summary?: string;
    ai_confidence?: number;
    initialStatus?: ComplaintStatus;
    photoDataUrl?: string;
    photoMimeType?: string;
  }): Promise<{ complaint: Complaint; assignedWorker?: WorkerProfile }> {
    const db = loadLocalDb();
    const ticketId = this.generateTicketId();
    const now = new Date().toISOString();
    const reporter = db.profiles.find((p) => p.id === params.reporter_id);

    const requiredSpec = getRequiredSpecializationForCategory(params.category);

    const status: ComplaintStatus =
      params.initialStatus ||
      (params.complaint_type === 'COMMON_AREA' ? 'PENDING_ADMIN_APPROVAL' : 'REGISTERED');

    const complaint: Complaint = {
      id: ticketId,
      reporter_id: params.reporter_id,
      reporter_name: reporter?.name,
      reporter_email: reporter?.email,
      complaint_type: params.complaint_type,
      hostel: params.hostel,
      location_detail: params.location_detail,
      category: params.category,
      required_specialization: requiredSpec,
      priority: params.priority,
      status,
      description: params.description,
      ai_validation_summary: params.ai_validation_summary,
      ai_confidence: params.ai_confidence,
      created_at: now,
      updated_at: now,
    };
    db.complaints.push(complaint);

    if (params.photoDataUrl) {
      const photoId = crypto.randomUUID();
      const photo: ComplaintPhoto = {
        id: photoId,
        complaint_id: ticketId,
        photo_type: 'ORIGINAL_ISSUE',
        storage_path: `complaints/${ticketId}/original_${photoId}.jpg`,
        file_url: params.photoDataUrl,
        uploaded_by: params.reporter_id,
        mime_type: params.photoMimeType || 'image/jpeg',
        created_at: now,
      };
      db.photos.push(photo);
      complaint.photos = [photo];
    }

    db.statusHistory.push({
      id: crypto.randomUUID(),
      complaint_id: ticketId,
      previous_status: undefined,
      new_status: status,
      actor_id: params.reporter_id,
      actor_role: reporter?.role,
      reason: 'Initial ticket submission via REC AI Chatbot',
      created_at: now,
    });
    saveLocalDb(db);

    let assignedWorker: WorkerProfile | undefined;
    if (status === 'REGISTERED') {
      assignedWorker = await this.autoAssignWorker(ticketId);
    } else if (status === 'PENDING_ADMIN_APPROVAL') {
      await this.notifyAdmins({
        title: 'Common-Area Complaint Pending Approval',
        message: `New common-area maintenance request ${ticketId} at ${params.hostel} (${params.location_detail}) requires Admin review.`,
        related_complaint_id: ticketId,
        type: 'WARNING',
      });
    }

    await this.createNotification({
      recipient_id: params.reporter_id,
      title: `Maintenance Ticket Created: ${ticketId}`,
      message: `Your complaint for ${params.hostel} ${params.location_detail} has been registered with ${params.priority} priority.`,
      related_complaint_id: ticketId,
      type: 'INFO',
    });

    return { complaint: (await this.getComplaintById(ticketId)) || complaint, assignedWorker };
  }

  /**
   * CATEGORY-BASED TECHNICIAN AUTO-ASSIGNMENT ENGINE
   * Enforces:
   * 1. Category normalized to technician specialization (Electrical, Plumbing, Furniture, Cleanliness, etc.)
   * 2. Finds ONLY technicians whose specialization/skills match the category
   * 3. Never assigns an electrical complaint to plumbing, or plumbing to electrical
   * 4. If multiple matching technicians, assigns to the one with fewest active assigned complaints
   * 5. If no matching technician is available, sets status to PENDING_ASSIGNMENT / UNASSIGNED and notifies admin
   */
  public async autoAssignWorker(complaintId: string): Promise<WorkerProfile | undefined> {
    const db = loadLocalDb();
    const complaint = db.complaints.find((c) => c.id === complaintId);
    if (!complaint) return undefined;

    const requiredSpec = getRequiredSpecializationForCategory(complaint.category);
    complaint.required_specialization = requiredSpec;
    const now = new Date().toISOString();

    // Filter ONLY technicians whose specialization strictly matches the required specialization
    const candidateWorkers = db.workers.filter((w) => {
      const profile = db.profiles.find((p) => p.id === w.profile_id);
      const isSpecMatch = isTechnicianSpecializedIn(w.specialization, w.skills, requiredSpec);

      return (
        w.is_active &&
        profile?.is_active &&
        w.availability_status === 'available' &&
        isSpecMatch &&
        w.hostel_coverage.includes(complaint.hostel) &&
        w.current_workload < w.max_workload
      );
    });

    // If multiple candidates have the same specialization, sort by fewest active assigned complaints
    candidateWorkers.sort((a, b) => a.current_workload - b.current_workload);

    if (candidateWorkers.length === 0) {
      // No matching technician available -> leave as PENDING_ASSIGNMENT / UNASSIGNED
      complaint.status = 'PENDING_ASSIGNMENT';
      complaint.assigned_worker_id = undefined;
      complaint.assigned_worker_name = undefined;
      complaint.assigned_worker_specialization = undefined;
      complaint.updated_at = now;

      db.statusHistory.push({
        id: crypto.randomUUID(),
        complaint_id: complaintId,
        previous_status: 'REGISTERED',
        new_status: 'PENDING_ASSIGNMENT',
        reason: `No available technician with specialization: ${requiredSpec} in hostel: ${complaint.hostel}`,
        created_at: now,
      });
      saveLocalDb(db);

      // Alert Admin that no matching technician was found
      await this.notifyAdmins({
        title: `Pending Assignment Alert: Ticket ${complaintId}`,
        message: `No available technician specializing in ${requiredSpec} for ${complaint.priority} priority ${complaint.category} issue at ${complaint.hostel} ${complaint.location_detail}. Manual assignment required.`,
        related_complaint_id: complaintId,
        type: 'URGENT',
      });
      return undefined;
    }

    // Assign to the eligible technician with the lowest workload
    const chosenWorker = candidateWorkers[0];
    chosenWorker.current_workload += 1;
    if (chosenWorker.current_workload >= chosenWorker.max_workload) {
      chosenWorker.availability_status = 'busy';
    }

    complaint.status = 'ASSIGNED';
    complaint.assigned_worker_id = chosenWorker.id;
    complaint.assigned_worker_name = chosenWorker.name;
    complaint.assigned_worker_specialization = chosenWorker.specialization;
    complaint.updated_at = now;

    const assignmentId = crypto.randomUUID();
    const assignment: ComplaintAssignment = {
      id: assignmentId,
      complaint_id: complaintId,
      worker_id: chosenWorker.id,
      worker_name: chosenWorker.name,
      worker_phone: chosenWorker.phone,
      worker_specialization: chosenWorker.specialization,
      assignment_status: 'ASSIGNED',
      assignment_reason: `Automated specialization match: ${requiredSpec} Technician in ${complaint.hostel} (current workload: ${chosenWorker.current_workload})`,
      assigned_at: now,
    };
    db.assignments.push(assignment);

    db.statusHistory.push({
      id: crypto.randomUUID(),
      complaint_id: complaintId,
      previous_status: 'REGISTERED',
      new_status: 'ASSIGNED',
      reason: `Automated assignment to ${requiredSpec} Technician (${chosenWorker.name})`,
      metadata: { workerId: chosenWorker.id, specialization: chosenWorker.specialization },
      created_at: now,
    });
    saveLocalDb(db);

    // Notify ONLY the chosen technician
    await this.createNotification({
      recipient_id: chosenWorker.profile_id,
      title: `New Job Assigned: ${complaintId}`,
      message: `${complaint.priority} priority ${complaint.category} repair at ${complaint.hostel} ${complaint.location_detail}.`,
      related_complaint_id: complaintId,
      type: 'URGENT',
    });

    const profile = db.profiles.find((p) => p.id === chosenWorker.profile_id);
    return {
      ...chosenWorker,
      name: profile?.name,
      email: profile?.email,
      phone: profile?.phone,
    };
  }

  public async getComplaintById(id: string): Promise<Complaint | null> {
    const db = loadLocalDb();
    const c = db.complaints.find((comp) => comp.id === id);
    if (!c) return null;
    const reporter = db.profiles.find((p) => p.id === c.reporter_id);
    const photos = db.photos.filter((p) => p.complaint_id === id);
    const assignment = db.assignments.find(
      (a) => a.complaint_id === id && a.assignment_status !== 'REASSIGNED'
    );
    let activeAssignment: ComplaintAssignment | undefined;
    if (assignment) {
      const worker = db.workers.find((w) => w.id === assignment.worker_id);
      const workerProfile = worker ? db.profiles.find((p) => p.id === worker.profile_id) : undefined;
      activeAssignment = {
        ...assignment,
        worker_name: workerProfile?.name || worker?.name,
        worker_phone: workerProfile?.phone || worker?.phone,
        worker_specialization: worker?.specialization,
      };
    }
    const completion = db.completions.find((comp) => comp.complaint_id === id);
    const history = db.statusHistory
      .filter((h) => h.complaint_id === id)
      .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));

    return {
      ...c,
      reporter_name: reporter?.name,
      reporter_email: reporter?.email,
      photos,
      active_assignment: activeAssignment,
      assigned_worker_id: activeAssignment?.worker_id || c.assigned_worker_id,
      assigned_worker_name: activeAssignment?.worker_name || c.assigned_worker_name,
      assigned_worker_specialization: activeAssignment?.worker_specialization || c.assigned_worker_specialization,
      completion,
      history,
    };
  }

  /**
   * List complaints with strict worker role authorization:
   * Technicians see ONLY complaints assigned to them, not every complaint in the system!
   */
  public async listComplaints(filters: {
    reporter_id?: string;
    worker_profile_id?: string;
    status?: string;
    hostel?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<Complaint[]> {
    const db = loadLocalDb();
    let results = db.complaints;

    if (filters.reporter_id) {
      results = results.filter((c) => c.reporter_id === filters.reporter_id);
    }
    if (filters.worker_profile_id) {
      const worker = db.workers.find((w) => w.profile_id === filters.worker_profile_id);
      if (!worker) return [];

      results = results.filter((c) => {
        // Strict worker isolation: active assignment must belong to this worker
        const activeAssignment = db.assignments.find(
          (a) => a.complaint_id === c.id && a.assignment_status !== 'REASSIGNED'
        );
        if (activeAssignment) {
          return activeAssignment.worker_id === worker.id;
        }
        return c.assigned_worker_id === worker.id;
      });
    }
    if (filters.status) {
      if (filters.status === 'UNASSIGNED') {
        results = results.filter((c) => c.status === 'UNASSIGNED' || c.status === 'PENDING_ASSIGNMENT');
      } else {
        results = results.filter((c) => c.status === filters.status);
      }
    }
    if (filters.hostel) {
      results = results.filter((c) => c.hostel === filters.hostel);
    }
    if (filters.priority) {
      results = results.filter((c) => c.priority === filters.priority);
    }
    if (filters.category) {
      const reqCat = getRequiredSpecializationForCategory(filters.category).toLowerCase();
      results = results.filter(
        (c) =>
          c.category.toLowerCase() === filters.category!.toLowerCase() ||
          getRequiredSpecializationForCategory(c.category).toLowerCase() === reqCat
      );
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location_detail.toLowerCase().includes(q)
      );
    }

    return results
      .slice()
      .reverse()
      .map((c) => {
        const assignment = db.assignments.find(
          (a) => a.complaint_id === c.id && a.assignment_status !== 'REASSIGNED'
        );
        let active_assignment: ComplaintAssignment | undefined;
        if (assignment) {
          const worker = db.workers.find((w) => w.id === assignment.worker_id);
          const wp = worker ? db.profiles.find((p) => p.id === worker.profile_id) : undefined;
          active_assignment = {
            ...assignment,
            worker_name: wp?.name || worker?.name,
            worker_specialization: worker?.specialization,
          };
        }
        const photos = db.photos.filter((p) => p.complaint_id === c.id);
        const completion = db.completions.find((comp) => comp.complaint_id === c.id);
        return {
          ...c,
          photos,
          completion,
          active_assignment,
          assigned_worker_id: active_assignment?.worker_id || c.assigned_worker_id,
          assigned_worker_name: active_assignment?.worker_name || c.assigned_worker_name,
          assigned_worker_specialization: active_assignment?.worker_specialization || c.assigned_worker_specialization,
        };
      });
  }

  // TRANSITIONS & LIFECYCLE
  public async transitionStatus(params: {
    complaintId: string;
    newStatus: ComplaintStatus;
    actorId: string;
    actorRole: 'student' | 'worker' | 'admin';
    reason: string;
    metadata?: Record<string, unknown>;
  }): Promise<Complaint> {
    const db = loadLocalDb();
    const complaint = db.complaints.find((c) => c.id === params.complaintId);
    if (!complaint) throw new Error(`Complaint ${params.complaintId} not found.`);

    const oldStatus = complaint.status;
    const now = new Date().toISOString();
    complaint.status = params.newStatus;
    complaint.updated_at = now;
    if (params.newStatus === 'COMPLETED') {
      complaint.resolved_at = now;
    }

    db.statusHistory.push({
      id: crypto.randomUUID(),
      complaint_id: params.complaintId,
      previous_status: oldStatus,
      new_status: params.newStatus,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      reason: params.reason,
      metadata: params.metadata,
      created_at: now,
    });
    saveLocalDb(db);

    await this.recordAuditLog({
      actor_id: params.actorId,
      actor_role: params.actorRole,
      action: 'STATUS_TRANSITION',
      resource_type: 'complaints',
      resource_id: params.complaintId,
      details: { from: oldStatus, to: params.newStatus, reason: params.reason },
    });

    return (await this.getComplaintById(params.complaintId))!;
  }

  // WORKER ACTIONS
  public async workerAcceptJob(workerProfileId: string, complaintId: string): Promise<Complaint> {
    const db = loadLocalDb();
    const worker = db.workers.find((w) => w.profile_id === workerProfileId);
    if (!worker) throw new Error('Worker profile not found.');

    const assignment = db.assignments.find(
      (a) => a.complaint_id === complaintId && a.worker_id === worker.id && a.assignment_status !== 'REASSIGNED'
    );
    if (!assignment) throw new Error('Job is not assigned to this worker.');

    assignment.assignment_status = 'ACCEPTED';
    assignment.accepted_at = new Date().toISOString();
    saveLocalDb(db);

    return this.transitionStatus({
      complaintId,
      newStatus: 'ACCEPTED',
      actorId: workerProfileId,
      actorRole: 'worker',
      reason: 'Technician accepted job assignment.',
    });
  }

  public async workerStartWork(workerProfileId: string, complaintId: string): Promise<Complaint> {
    const db = loadLocalDb();
    const worker = db.workers.find((w) => w.profile_id === workerProfileId);
    if (!worker) throw new Error('Worker profile not found.');

    const assignment = db.assignments.find(
      (a) => a.complaint_id === complaintId && a.worker_id === worker.id && a.assignment_status !== 'REASSIGNED'
    );
    if (!assignment) throw new Error('Job is not assigned to this worker.');

    return this.transitionStatus({
      complaintId,
      newStatus: 'IN_PROGRESS',
      actorId: workerProfileId,
      actorRole: 'worker',
      reason: 'Technician initiated repair on-site.',
    });
  }

  public async workerSubmitRepair(params: {
    workerProfileId: string;
    complaintId: string;
    repairNotes: string;
    repairPhotoDataUrl: string;
    repairPhotoMimeType?: string;
    aiVerificationStatus: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
    aiVerificationNotes: string;
  }): Promise<Complaint> {
    const db = loadLocalDb();
    const worker = db.workers.find((w) => w.profile_id === params.workerProfileId);
    if (!worker) throw new Error('Worker profile not found.');

    const complaint = db.complaints.find((c) => c.id === params.complaintId);
    if (!complaint) throw new Error('Complaint not found.');

    const now = new Date().toISOString();
    const photoId = crypto.randomUUID();
    const repairPhoto: ComplaintPhoto = {
      id: photoId,
      complaint_id: params.complaintId,
      photo_type: 'REPAIR_EVIDENCE',
      storage_path: `complaints/${params.complaintId}/repair_${photoId}.jpg`,
      file_url: params.repairPhotoDataUrl,
      uploaded_by: params.workerProfileId,
      mime_type: params.repairPhotoMimeType || 'image/jpeg',
      created_at: now,
    };
    db.photos.push(repairPhoto);

    let completion = db.completions.find((comp) => comp.complaint_id === params.complaintId);
    if (!completion) {
      completion = {
        id: crypto.randomUUID(),
        complaint_id: params.complaintId,
        worker_id: worker.id,
        repair_notes: params.repairNotes,
        evidence_photo_id: photoId,
        ai_verification_status: params.aiVerificationStatus,
        ai_verification_notes: params.aiVerificationNotes,
        created_at: now,
      };
      db.completions.push(completion);
    } else {
      completion.repair_notes = params.repairNotes;
      completion.evidence_photo_id = photoId;
      completion.ai_verification_status = params.aiVerificationStatus;
      completion.ai_verification_notes = params.aiVerificationNotes;
    }
    saveLocalDb(db);

    let targetStatus: ComplaintStatus;
    if (params.aiVerificationStatus === 'PASS') {
      if (complaint.complaint_type === 'ROOM') {
        targetStatus = 'PENDING_STUDENT_VERIFICATION';
        await this.createNotification({
          recipient_id: complaint.reporter_id,
          title: `Repair Completed - Action Required`,
          message: `Technician has submitted repair evidence for ticket ${params.complaintId}. Please inspect your room and confirm if the issue is solved.`,
          related_complaint_id: params.complaintId,
          type: 'URGENT',
        });
      } else {
        targetStatus = 'PENDING_ADMIN_SIGN_OFF';
        await this.notifyAdmins({
          title: `Common-Area Repair Ready for Sign-Off: ${params.complaintId}`,
          message: `Technician completed repair with AI verification PASS for ${complaint.hostel} ${complaint.location_detail}. Admin sign-off required.`,
          related_complaint_id: params.complaintId,
          type: 'INFO',
        });
      }
    } else {
      targetStatus = 'REPAIR_VERIFICATION_FAILED';
      await this.notifyAdmins({
        title: `Repair Verification Flagged: ${params.complaintId}`,
        message: `AI verification returned ${params.aiVerificationStatus}. Technician notes: "${params.repairNotes}". Admin inspection needed.`,
        related_complaint_id: params.complaintId,
        type: 'WARNING',
      });
    }

    return this.transitionStatus({
      complaintId: params.complaintId,
      newStatus: targetStatus,
      actorId: params.workerProfileId,
      actorRole: 'worker',
      reason: `Repair evidence submitted. AI verification: ${params.aiVerificationStatus}`,
      metadata: { aiStatus: params.aiVerificationStatus },
    });
  }

  // STUDENT CONFIRMATION OR REOPEN
  public async studentConfirmSolved(params: {
    studentProfileId: string;
    complaintId: string;
    confirmationNotes?: string;
  }): Promise<{ complaint: Complaint; completionEmailTriggered: boolean }> {
    const db = loadLocalDb();
    const complaint = db.complaints.find((c) => c.id === params.complaintId);
    if (!complaint) throw new Error('Complaint not found.');
    if (complaint.reporter_id !== params.studentProfileId) {
      throw new Error('Only the reporting student can confirm resolution of this ticket.');
    }

    const completion = db.completions.find((comp) => comp.complaint_id === params.complaintId);
    if (completion) {
      completion.student_confirmed = true;
      completion.student_confirmation_notes = params.confirmationNotes || 'Confirmed solved by resident.';
      completion.student_confirmed_at = new Date().toISOString();
    }

    const assignment = db.assignments.find(
      (a) => a.complaint_id === params.complaintId && a.assignment_status !== 'REASSIGNED'
    );
    if (assignment) {
      assignment.assignment_status = 'COMPLETED';
      assignment.completed_at = new Date().toISOString();
      const worker = db.workers.find((w) => w.id === assignment.worker_id);
      if (worker && worker.current_workload > 0) {
        worker.current_workload -= 1;
        if (worker.availability_status === 'busy' && worker.current_workload < worker.max_workload) {
          worker.availability_status = 'available';
        }
      }
    }
    saveLocalDb(db);

    const updated = await this.transitionStatus({
      complaintId: params.complaintId,
      newStatus: 'COMPLETED',
      actorId: params.studentProfileId,
      actorRole: 'student',
      reason: 'Resident confirmed problem successfully solved.',
    });
    return { complaint: updated, completionEmailTriggered: true };
  }

  public async studentReopenComplaint(params: {
    studentProfileId: string;
    complaintId: string;
    reopenExplanation: string;
  }): Promise<Complaint> {
    const db = loadLocalDb();
    const complaint = db.complaints.find((c) => c.id === params.complaintId);
    if (!complaint) throw new Error('Complaint not found.');
    if (complaint.reporter_id !== params.studentProfileId) {
      throw new Error('Only the reporting student can reopen this ticket.');
    }

    const completion = db.completions.find((comp) => comp.complaint_id === params.complaintId);
    if (completion) {
      completion.student_confirmed = false;
      completion.student_confirmation_notes = `Reopened: ${params.reopenExplanation}`;
    }
    saveLocalDb(db);

    const assignment = db.assignments.find(
      (a) => a.complaint_id === params.complaintId && a.assignment_status !== 'REASSIGNED'
    );
    if (assignment) {
      const worker = db.workers.find((w) => w.id === assignment.worker_id);
      if (worker) {
        await this.createNotification({
          recipient_id: worker.profile_id,
          title: `Ticket Reopened: ${params.complaintId}`,
          message: `Resident reported issue remains unresolved: "${params.reopenExplanation}". Follow-up required.`,
          related_complaint_id: params.complaintId,
          type: 'URGENT',
        });
      }
    }

    await this.notifyAdmins({
      title: `Complaint Reopened by Student: ${params.complaintId}`,
      message: `Resident reported maintenance issue at ${complaint.hostel} ${complaint.location_detail} is NOT solved: "${params.reopenExplanation}".`,
      related_complaint_id: params.complaintId,
      type: 'WARNING',
    });

    return this.transitionStatus({
      complaintId: params.complaintId,
      newStatus: 'REOPENED',
      actorId: params.studentProfileId,
      actorRole: 'student',
      reason: `Reopened by student: ${params.reopenExplanation}`,
    });
  }

  // ADMIN ACTIONS
  public async adminApproveCommonArea(params: {
    adminProfileId: string;
    complaintId: string;
    approved: boolean;
    reason?: string;
  }): Promise<Complaint> {
    const db = loadLocalDb();
    const complaint = db.complaints.find((c) => c.id === params.complaintId);
    if (!complaint) throw new Error('Complaint not found.');
    if (complaint.complaint_type !== 'COMMON_AREA') {
      throw new Error('Only common-area complaints require Admin approval.');
    }

    if (!params.approved) {
      return this.transitionStatus({
        complaintId: params.complaintId,
        newStatus: 'APPROVAL_REJECTED',
        actorId: params.adminProfileId,
        actorRole: 'admin',
        reason: params.reason || 'Rejected by Admin after initial common-area assessment.',
      });
    }

    await this.transitionStatus({
      complaintId: params.complaintId,
      newStatus: 'REGISTERED',
      actorId: params.adminProfileId,
      actorRole: 'admin',
      reason: 'Approved by Admin for technician dispatch.',
    });
    await this.autoAssignWorker(params.complaintId);
    return (await this.getComplaintById(params.complaintId))!;
  }

  public async adminSignOffCommonArea(params: {
    adminProfileId: string;
    complaintId: string;
    adminNotes?: string;
  }): Promise<{ complaint: Complaint; completionEmailTriggered: boolean }> {
    const db = loadLocalDb();
    const complaint = db.complaints.find((c) => c.id === params.complaintId);
    if (!complaint) throw new Error('Complaint not found.');

    let completion = db.completions.find((comp) => comp.complaint_id === params.complaintId);
    const now = new Date().toISOString();
    if (completion) {
      completion.admin_signed_off = true;
      completion.admin_signed_off_by = params.adminProfileId;
      completion.admin_notes = params.adminNotes || 'Common-area repair inspected and approved by Admin.';
      completion.admin_signed_off_at = now;
    }

    const assignment = db.assignments.find(
      (a) => a.complaint_id === params.complaintId && a.assignment_status !== 'REASSIGNED'
    );
    if (assignment) {
      assignment.assignment_status = 'COMPLETED';
      assignment.completed_at = now;
      const worker = db.workers.find((w) => w.id === assignment.worker_id);
      if (worker && worker.current_workload > 0) {
        worker.current_workload -= 1;
        if (worker.availability_status === 'busy' && worker.current_workload < worker.max_workload) {
          worker.availability_status = 'available';
        }
      }
    }
    saveLocalDb(db);

    const updated = await this.transitionStatus({
      complaintId: params.complaintId,
      newStatus: 'COMPLETED',
      actorId: params.adminProfileId,
      actorRole: 'admin',
      reason: 'Admin verified and completed official sign-off.',
    });
    return { complaint: updated, completionEmailTriggered: true };
  }

  /**
   * ADMIN MANUAL REASSIGNMENT
   * Enforces:
   * 1. Validates technician specialization against complaint category
   * 2. Blocks mismatch unless authorized override is provided
   * 3. Removes previous active assignment and decrements workload
   * 4. Preserves reassignment history
   */
  public async adminReassignJob(params: {
    adminProfileId: string;
    complaintId: string;
    newWorkerId: string;
    reassignReason: string;
    allowOverride?: boolean;
  }): Promise<Complaint> {
    const db = loadLocalDb();
    const complaint = db.complaints.find((c) => c.id === params.complaintId);
    if (!complaint) throw new Error(`Complaint ${params.complaintId} not found.`);

    const newWorker = db.workers.find((w) => w.id === params.newWorkerId);
    if (!newWorker) throw new Error('Target worker not found.');

    const requiredSpec = getRequiredSpecializationForCategory(complaint.category);
    const isSpecialized = isTechnicianSpecializedIn(newWorker.specialization, newWorker.skills, requiredSpec);

    // Validate specialization match unless authorized override is provided
    if (!isSpecialized && !params.allowOverride) {
      throw new Error(
        `Technician ${newWorker.name} specializes in "${newWorker.specialization}", but this complaint requires "${requiredSpec}". To assign regardless, check "Authorize Specialization Override" with justification.`
      );
    }

    const now = new Date().toISOString();

    // Remove previous active assignment and decrement workload
    const prevAssignment = db.assignments.find(
      (a) => a.complaint_id === params.complaintId && a.assignment_status !== 'REASSIGNED'
    );
    let previousWorkerId = '';
    if (prevAssignment) {
      previousWorkerId = prevAssignment.worker_id;
      prevAssignment.assignment_status = 'REASSIGNED';
      const prevWorker = db.workers.find((w) => w.id === prevAssignment.worker_id);
      if (prevWorker && prevWorker.current_workload > 0) {
        prevWorker.current_workload -= 1;
        if (prevWorker.availability_status === 'busy' && prevWorker.current_workload < prevWorker.max_workload) {
          prevWorker.availability_status = 'available';
        }
      }
    }

    // Assign new worker
    newWorker.current_workload += 1;
    if (newWorker.current_workload >= newWorker.max_workload) {
      newWorker.availability_status = 'busy';
    }

    const reasonText = params.allowOverride && !isSpecialized
      ? `[Authorized Override: ${params.reassignReason}]`
      : params.reassignReason;

    const assignment: ComplaintAssignment = {
      id: crypto.randomUUID(),
      complaint_id: params.complaintId,
      worker_id: newWorker.id,
      worker_name: newWorker.name,
      worker_phone: newWorker.phone,
      worker_specialization: newWorker.specialization,
      assigned_by: params.adminProfileId,
      assignment_status: 'ASSIGNED',
      assignment_reason: reasonText,
      is_override: Boolean(params.allowOverride && !isSpecialized),
      reassignment_history: [
        ...(prevAssignment?.reassignment_history || []),
        {
          previous_worker_id: previousWorkerId,
          new_worker_id: newWorker.id,
          changed_by: params.adminProfileId,
          reason: reasonText,
          is_override: Boolean(params.allowOverride && !isSpecialized),
          timestamp: now,
        },
      ],
      assigned_at: now,
    };
    db.assignments.push(assignment);

    complaint.status = 'ASSIGNED';
    complaint.assigned_worker_id = newWorker.id;
    complaint.assigned_worker_name = newWorker.name;
    complaint.assigned_worker_specialization = newWorker.specialization;
    complaint.updated_at = now;
    saveLocalDb(db);

    await this.createNotification({
      recipient_id: newWorker.profile_id,
      title: `Reassigned Ticket: ${params.complaintId}`,
      message: `Admin reassigned ${complaint.priority} priority ${complaint.category} repair at ${complaint.hostel} ${complaint.location_detail} to you. Reason: ${params.reassignReason}`,
      related_complaint_id: params.complaintId,
      type: 'URGENT',
    });

    return this.transitionStatus({
      complaintId: params.complaintId,
      newStatus: 'ASSIGNED',
      actorId: params.adminProfileId,
      actorRole: 'admin',
      reason: `Reassigned to ${newWorker.specialization} Technician: ${params.reassignReason}`,
    });
  }

  // DASHBOARD STATS
  public async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const db = loadLocalDb();
    const complaints = db.complaints;
    const workers = db.workers;
    const nonCompleted = complaints.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status));

    const hostelBreakdown: Record<HostelName, number> = { Ruby: 0, Emerald: 0, Pearl: 0 };
    const categoryBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<ComplaintPriority, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    complaints.forEach((c) => {
      if (hostelBreakdown[c.hostel] !== undefined) hostelBreakdown[c.hostel]++;
      const mapped = getRequiredSpecializationForCategory(c.category);
      categoryBreakdown[mapped] = (categoryBreakdown[mapped] || 0) + 1;
      if (priorityBreakdown[c.priority] !== undefined) priorityBreakdown[c.priority]++;
    });

    const activeWorkers = workers.filter((w) => w.is_active);
    const availableWorkers = activeWorkers.filter((w) => w.availability_status === 'available').length;
    const busyWorkers = activeWorkers.filter((w) => w.availability_status === 'busy').length;
    const totalWorkload = activeWorkers.reduce((acc, w) => acc + w.current_workload, 0);
    const avgWorkload =
      activeWorkers.length > 0 ? Number((totalWorkload / activeWorkers.length).toFixed(1)) : 0;

    return {
      totalActive: nonCompleted.length,
      newUnvalidated: complaints.filter((c) =>
        ['SUBMITTED', 'PENDING_AI_VALIDATION'].includes(c.status)
      ).length,
      pendingApprovals: complaints.filter((c) => c.status === 'PENDING_ADMIN_APPROVAL').length,
      criticalHighPriority: complaints.filter(
        (c) => ['CRITICAL', 'HIGH'].includes(c.priority) && !['COMPLETED', 'CANCELLED'].includes(c.status)
      ).length,
      unassigned: complaints.filter((c) => c.status === 'UNASSIGNED' || c.status === 'PENDING_ASSIGNMENT').length,
      assignedInProgress: complaints.filter((c) =>
        ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(c.status)
      ).length,
      awaitingStudentConfirmation: complaints.filter(
        (c) => c.status === 'PENDING_STUDENT_VERIFICATION'
      ).length,
      awaitingAdminSignOff: complaints.filter((c) => c.status === 'PENDING_ADMIN_SIGN_OFF').length,
      completed: complaints.filter((c) => c.status === 'COMPLETED').length,
      reopened: complaints.filter((c) => c.status === 'REOPENED').length,
      hostelBreakdown,
      categoryBreakdown,
      priorityBreakdown,
      workersOverview: {
        totalWorkers: activeWorkers.length,
        availableWorkers,
        busyWorkers,
        avgWorkload,
      },
    };
  }

  // NOTIFICATIONS
  public async createNotification(params: {
    recipient_id: string;
    title: string;
    message: string;
    related_complaint_id?: string;
    type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  }): Promise<AppNotification> {
    const db = loadLocalDb();
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      recipient_id: params.recipient_id,
      title: params.title,
      message: params.message,
      related_complaint_id: params.related_complaint_id,
      type: params.type || 'INFO',
      read_status: false,
      created_at: new Date().toISOString(),
    };
    db.notifications.push(notification);
    saveLocalDb(db);
    return notification;
  }

  public async notifyAdmins(params: {
    title: string;
    message: string;
    related_complaint_id?: string;
    type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  }): Promise<void> {
    const db = loadLocalDb();
    const admins = db.profiles.filter((p) => p.role === 'admin' && p.is_active);
    for (const admin of admins) {
      await this.createNotification({
        recipient_id: admin.id,
        title: params.title,
        message: params.message,
        related_complaint_id: params.related_complaint_id,
        type: params.type,
      });
    }
  }

  public async getNotificationsForUser(userId: string): Promise<AppNotification[]> {
    const db = loadLocalDb();
    return db.notifications
      .filter((n) => n.recipient_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const db = loadLocalDb();
    const n = db.notifications.find((notif) => notif.id === id && notif.recipient_id === userId);
    if (!n) return false;
    n.read_status = true;
    saveLocalDb(db);
    return true;
  }

  // EMAIL LOGS
  public async hasSentCompletionEmail(complaintId: string): Promise<boolean> {
    const db = loadLocalDb();
    return db.emailLogs.some(
      (log) => log.complaint_id === complaintId && log.event_type === 'COMPLETION' && log.delivery_status === 'SENT'
    );
  }

  public async recordEmailLog(params: {
    complaint_id?: string;
    recipient: string;
    event_type: string;
    delivery_status: 'QUEUED' | 'SENT' | 'FAILED' | 'PENDING_CONFIGURATION';
    provider_message_id?: string;
    error_message?: string;
  }): Promise<EmailLogEntry> {
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const entry: EmailLogEntry = {
      id: crypto.randomUUID(),
      complaint_id: params.complaint_id,
      recipient: params.recipient,
      event_type: params.event_type,
      delivery_status: params.delivery_status,
      attempt_count: 1,
      provider_message_id: params.provider_message_id,
      error_message: params.error_message,
      created_at: now,
      sent_at: params.delivery_status === 'SENT' ? now : undefined,
    };
    db.emailLogs.push(entry);
    saveLocalDb(db);
    return entry;
  }

  public async getEmailLogs(): Promise<EmailLogEntry[]> {
    const db = loadLocalDb();
    return db.emailLogs.slice(-100).reverse();
  }

  // AUDIT LOGS
  public async recordAuditLog(params: {
    actor_id?: string;
    actor_role?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: Record<string, unknown>;
    ip_address?: string;
  }): Promise<AuditLogEntry> {
    const db = loadLocalDb();
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      actor_id: params.actor_id,
      actor_role: params.actor_role,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      details: params.details,
      ip_address: params.ip_address,
      created_at: new Date().toISOString(),
    };
    db.auditLogs.push(entry);
    saveLocalDb(db);
    return entry;
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    const db = loadLocalDb();
    return db.auditLogs.slice(-150).reverse();
  }
}

export const dbService = new DatabaseService();
