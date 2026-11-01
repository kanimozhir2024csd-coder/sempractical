import { Router, Request, Response } from 'express';
import { dbService, verifyPassword } from './db';
import { requireAuth, requireRole, createSessionToken, AuthenticatedRequest } from './authMiddleware';
import { validateComplaintWithGemini, verifyRepairWithGemini } from './geminiService';
import { sendComplaintCompletionEmail } from './emailService';
import { ComplaintCategory, HostelName, ComplaintPriority, ComplaintType } from '../src/types';

export const apiRouter = Router();

// 1. CONFIGURATION & HEALTH
apiRouter.get('/config/status', async (_req: Request, res: Response) => {
  const status = dbService.getConfigurationStatus();
  return res.json(status);
});

// 2. AUTHENTICATION & ONBOARDING
apiRouter.post('/auth/register-student', async (req: Request, res: Response) => {
  try {
    const { name, email, roll_number, department, hostel, room_number, phone, password } = req.body;
    if (!name || !email || !roll_number || !hostel || !room_number || !password) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, roll_number, hostel, room_number, and password are required.',
      });
    }

    if (!['Ruby', 'Emerald', 'Pearl'].includes(hostel)) {
      return res.status(400).json({ error: 'Hostel must be Ruby, Emerald, or Pearl.' });
    }

    const existingEmail = await dbService.getProfileByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const allProfiles = await dbService.getAllProfiles('student');
    const existingRoll = allProfiles.find(
      (p) => p.roll_number?.toLowerCase() === roll_number.trim().toLowerCase()
    );
    if (existingRoll) {
      return res.status(409).json({ error: `Roll number ${roll_number} is already registered.` });
    }

    const profile = await dbService.createProfile(
      {
        role: 'student',
        name: name.trim(),
        email: email.trim().toLowerCase(),
        roll_number: roll_number.trim().toUpperCase(),
        department: department?.trim(),
        hostel: hostel as HostelName,
        room_number: room_number.trim(),
        phone: phone?.trim(),
        is_active: true,
      },
      password
    );

    const token = createSessionToken(profile);
    return res.status(201).json({ profile, token });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Internal registration failure.' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const profile = await dbService.getProfileByEmail(email.trim().toLowerCase());
    if (!profile) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated.' });
    }

    const hash = await dbService.getPasswordHash(profile.id);
    if (!hash || !verifyPassword(password, hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSessionToken(profile);
    let workerProfile = null;
    if (profile.role === 'worker') {
      workerProfile = await dbService.getWorkerByProfileId(profile.id);
    }
    return res.json({ profile, workerProfile, token });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication service encountered an unexpected error.' });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const profile = req.user!;
  let workerProfile = null;
  if (profile.role === 'worker') {
    workerProfile = await dbService.getWorkerByProfileId(profile.id);
  }
  return res.json({ profile, workerProfile });
});

apiRouter.post('/auth/bootstrap-admin', async (req: Request, res: Response) => {
  try {
    const { bootstrapSecret, name, email, password } = req.body;
    const requiredSecret = process.env.ADMIN_BOOTSTRAP_SECRET || 'rec-admin-bootstrap-2026';
    if (!bootstrapSecret || bootstrapSecret !== requiredSecret) {
      return res.status(403).json({ error: 'Invalid admin bootstrap secret key.' });
    }

    const existing = await dbService.getProfileByEmail(email.trim().toLowerCase());
    if (existing) {
      const token = createSessionToken(existing);
      return res.json({ message: 'Admin account already active.', profile: existing, token });
    }

    const profile = await dbService.createProfile(
      {
        role: 'admin',
        name: name.trim(),
        email: email.trim().toLowerCase(),
        is_active: true,
      },
      password
    );
    const token = createSessionToken(profile);
    return res.status(201).json({ message: 'Admin account initialized successfully.', profile, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. AI COMPLAINT CHATBOT & VALIDATION
apiRouter.post('/complaints/ai-analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { description, imageBase64, imageMimeType, hostel, location } = req.body;
    if (!description || description.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a description of the issue.' });
    }

    const aiResult = await validateComplaintWithGemini({
      description: description.trim(),
      imageBase64,
      imageMimeType,
      hostel,
      location,
    });

    let duplicate = null;
    if (hostel && location && aiResult.category) {
      duplicate = await dbService.checkDuplicate({
        hostel: hostel as HostelName,
        location_detail: location,
        category: aiResult.category,
      });
    }

    return res.json({ success: true, aiServiceAvailable: true, aiResult, duplicate });
  } catch (err: any) {
    console.warn('[AI Analysis Notice]:', err.message);
    return res.status(500).json({ error: err.message || 'Validation service error' });
  }
});

apiRouter.post('/complaints/check-duplicate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { hostel, location_detail, category } = req.body;
  if (!hostel || !location_detail || !category) {
    return res.status(400).json({ error: 'Hostel, location_detail, and category are required.' });
  }
  const duplicate = await dbService.checkDuplicate({
    hostel: hostel as HostelName,
    location_detail: location_detail.trim(),
    category: category as ComplaintCategory,
  });
  return res.json({ isDuplicate: Boolean(duplicate), duplicate });
});

apiRouter.post('/complaints', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      complaint_type,
      hostel,
      location_detail,
      category,
      priority,
      description,
      ai_validation_summary,
      ai_confidence,
      photoDataUrl,
      photoMimeType,
    } = req.body;
    const user = req.user!;

    if (!complaint_type || !hostel || !location_detail || !category || !priority || !description) {
      return res.status(400).json({ error: 'All complaint fields are required.' });
    }

    const duplicate = await dbService.checkDuplicate({
      hostel: hostel as HostelName,
      location_detail: location_detail.trim(),
      category: category as ComplaintCategory,
    });
    if (duplicate) {
      return res.status(409).json({
        error: `An unresolved maintenance ticket (${duplicate.id}) already exists for ${hostel} ${location_detail}.`,
        duplicateTicketId: duplicate.id,
      });
    }

    const { complaint, assignedWorker } = await dbService.createComplaint({
      reporter_id: user.id,
      complaint_type: complaint_type as ComplaintType,
      hostel: hostel as HostelName,
      location_detail: location_detail.trim(),
      category: category as ComplaintCategory,
      priority: priority as ComplaintPriority,
      description: description.trim(),
      ai_validation_summary,
      ai_confidence,
      photoDataUrl,
      photoMimeType,
    });

    return res.status(201).json({ complaint, assignedWorker });
  } catch (err: any) {
    console.error('Create complaint error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create complaint ticket.' });
  }
});

apiRouter.get('/complaints', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, hostel, priority, category, search } = req.query as Record<string, string>;
    const filters: any = { status, hostel, priority, category, search };

    if (user.role === 'student') {
      filters.reporter_id = user.id;
    } else if (user.role === 'worker') {
      filters.worker_profile_id = user.id;
    }

    const complaints = await dbService.listComplaints(filters);
    return res.json({ complaints, total: complaints.length });
  } catch (err: any) {
    console.error('List complaints error:', err);
    return res.status(500).json({ error: 'Failed to retrieve complaints.' });
  }
});

apiRouter.get('/complaints/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaint = await dbService.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint ticket not found.' });
    }

    if (user.role === 'student' && complaint.reporter_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own complaints.' });
    }
    if (user.role === 'worker') {
      const worker = await dbService.getWorkerByProfileId(user.id);
      if (!worker || complaint.active_assignment?.worker_id !== worker.id) {
        return res.status(403).json({ error: 'Forbidden: You can only view jobs assigned to you.' });
      }
    }
    return res.json({ complaint });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch complaint details.' });
  }
});

// 4. WORKER WORKFLOW
apiRouter.post('/complaints/:id/accept', requireAuth, requireRole('worker'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaint = await dbService.workerAcceptJob(user.id, req.params.id);
    return res.json({ message: 'Job accepted.', complaint });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/complaints/:id/start', requireAuth, requireRole('worker'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaint = await dbService.workerStartWork(user.id, req.params.id);
    return res.json({ message: 'Repair initiated.', complaint });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/complaints/:id/submit-repair', requireAuth, requireRole('worker'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { repairNotes, repairPhotoDataUrl, repairPhotoMimeType } = req.body;

    if (!repairNotes || repairNotes.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide repair notes explaining what was fixed.' });
    }
    if (!repairPhotoDataUrl) {
      return res.status(400).json({ error: 'Repair completion photo is mandatory for verification.' });
    }

    const complaint = await dbService.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const originalPhoto = complaint.photos?.find((p) => p.photo_type === 'ORIGINAL_ISSUE');
    const verification = await verifyRepairWithGemini({
      originalPhotoBase64: originalPhoto?.file_url || repairPhotoDataUrl,
      originalMimeType: originalPhoto?.mime_type || 'image/jpeg',
      repairPhotoBase64: repairPhotoDataUrl,
      repairMimeType: repairPhotoMimeType || 'image/jpeg',
      repairNotes: repairNotes.trim(),
      category: complaint.category,
      description: complaint.description,
    });

    const updatedComplaint = await dbService.workerSubmitRepair({
      workerProfileId: user.id,
      complaintId: req.params.id,
      repairNotes: repairNotes.trim(),
      repairPhotoDataUrl,
      repairPhotoMimeType: repairPhotoMimeType || 'image/jpeg',
      aiVerificationStatus: verification.result,
      aiVerificationNotes: `${verification.visualSummary} - ${verification.reasoning} (${Math.round(verification.confidence * 100)}% confidence)`,
    });

    return res.json({
      message: `Repair submitted. AI Verification: ${verification.result}`,
      complaint: updatedComplaint,
      verification,
    });
  } catch (err: any) {
    console.error('Submit repair error:', err);
    return res.status(500).json({ error: err.message || 'Repair verification process failed.' });
  }
});

// 5. STUDENT CONFIRMATION / REOPEN
apiRouter.post('/complaints/:id/confirm-solved', requireAuth, requireRole('student'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { confirmationNotes } = req.body;
    const { complaint } = await dbService.studentConfirmSolved({
      studentProfileId: user.id,
      complaintId: req.params.id,
      confirmationNotes,
    });

    // Send completion email notification
    const emailResult = await sendComplaintCompletionEmail({
      complaintId: complaint.id,
      hostel: complaint.hostel,
      locationDetail: complaint.location_detail,
      category: complaint.category,
      priority: complaint.priority,
      description: complaint.description,
      workerName: complaint.active_assignment?.worker_name || 'Assigned Technician',
      repairNotes: complaint.completion?.repair_notes || 'Fixed and verified.',
      completionTime: new Date().toLocaleString(),
      signOffActorName: user.name,
      signOffRole: 'student',
      aiVerificationSummary: complaint.completion?.ai_verification_notes || 'AI Verified',
      studentEmail: user.email,
    });

    await dbService.recordEmailLog({
      complaint_id: complaint.id,
      recipient: emailResult.recipient,
      event_type: 'COMPLETION',
      delivery_status: emailResult.status,
      provider_message_id: emailResult.providerMessageId,
      error_message: emailResult.error,
    });

    return res.json({ message: 'Resolution confirmed. Complaint marked COMPLETED.', complaint });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/complaints/:id/reopen', requireAuth, requireRole('student'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { explanation } = req.body;
    if (!explanation || explanation.trim().length < 5) {
      return res.status(400).json({ error: 'Please explain what remains unresolved.' });
    }

    const complaint = await dbService.studentReopenComplaint({
      studentProfileId: user.id,
      complaintId: req.params.id,
      reopenExplanation: explanation.trim(),
    });
    return res.json({ message: 'Ticket reopened for technician follow-up.', complaint });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 6. ADMIN OPERATIONS
apiRouter.get('/admin/dashboard', requireAuth, requireRole('admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await dbService.getAdminDashboardStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to compute dashboard metrics.' });
  }
});

apiRouter.post('/admin/complaints/:id/approve', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { approved, reason } = req.body;
    const complaint = await dbService.adminApproveCommonArea({
      adminProfileId: user.id,
      complaintId: req.params.id,
      approved: Boolean(approved),
      reason,
    });
    return res.json({ message: approved ? 'Common-area complaint approved.' : 'Complaint rejected.', complaint });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/complaints/:id/sign-off', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { adminNotes } = req.body;
    const { complaint } = await dbService.adminSignOffCommonArea({
      adminProfileId: user.id,
      complaintId: req.params.id,
      adminNotes,
    });

    const emailResult = await sendComplaintCompletionEmail({
      complaintId: complaint.id,
      hostel: complaint.hostel,
      locationDetail: complaint.location_detail,
      category: complaint.category,
      priority: complaint.priority,
      description: complaint.description,
      workerName: complaint.active_assignment?.worker_name || 'Assigned Technician',
      repairNotes: complaint.completion?.repair_notes || 'Fixed and verified.',
      completionTime: new Date().toLocaleString(),
      signOffActorName: user.name,
      signOffRole: 'admin',
      aiVerificationSummary: complaint.completion?.ai_verification_notes || 'AI Verified',
    });

    await dbService.recordEmailLog({
      complaint_id: complaint.id,
      recipient: emailResult.recipient,
      event_type: 'COMPLETION',
      delivery_status: emailResult.status,
      provider_message_id: emailResult.providerMessageId,
      error_message: emailResult.error,
    });

    return res.json({ message: 'Common-area repair signed off. Status updated to COMPLETED.', complaint });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/complaints/:id/reassign', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { newWorkerId, reassignReason, allowOverride } = req.body;
    if (!newWorkerId || !reassignReason) {
      return res.status(400).json({ error: 'Target technician ID and reassignment reason are required.' });
    }

    const complaint = await dbService.adminReassignJob({
      adminProfileId: user.id,
      complaintId: req.params.id,
      newWorkerId,
      reassignReason: reassignReason.trim(),
      allowOverride: Boolean(allowOverride),
    });
    return res.json({ message: 'Ticket reassigned successfully.', complaint });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/workers', requireAuth, requireRole('admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const workers = await dbService.getAllWorkers();
    return res.json({ workers });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to list workers.' });
  }
});

apiRouter.post('/admin/workers', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, specialization, skills, hostel_coverage, max_workload, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const workerSkills = Array.isArray(skills) && skills.length > 0 ? skills : [specialization || 'General Maintenance'];
    const workerCoverage = Array.isArray(hostel_coverage) && hostel_coverage.length > 0 ? hostel_coverage : ['Ruby', 'Emerald', 'Pearl'];

    const result = await dbService.createWorker({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      specialization: specialization || workerSkills[0],
      skills: workerSkills,
      hostel_coverage: workerCoverage,
      max_workload: max_workload ? Number(max_workload) : 5,
      rawPassword: password,
    });
    return res.status(201).json({ message: 'Technician account created successfully.', worker: result.worker });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/admin/workers/:id', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { availability_status, is_active } = req.body;
    const updated = await dbService.updateWorkerStatus(req.params.id, { availability_status, is_active });
    return res.json({ worker: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/users', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.query.role as string | undefined;
    const users = await dbService.getAllProfiles(role);
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve user accounts.' });
  }
});

apiRouter.get('/admin/audit-logs', requireAuth, requireRole('admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await dbService.getAuditLogs();
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load audit trail.' });
  }
});

apiRouter.get('/admin/email-logs', requireAuth, requireRole('admin'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await dbService.getEmailLogs();
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load email logs.' });
  }
});

// 7. NOTIFICATIONS
apiRouter.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const notifications = await dbService.getNotificationsForUser(req.user!.id);
  return res.json({ notifications });
});

apiRouter.patch('/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const success = await dbService.markNotificationRead(req.params.id, req.user!.id);
  return res.json({ success });
});
