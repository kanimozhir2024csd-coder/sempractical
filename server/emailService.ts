export interface SendCompletionEmailParams {
  complaintId: string;
  hostel: string;
  locationDetail: string;
  category: string;
  priority: string;
  description: string;
  workerName: string;
  repairNotes: string;
  completionTime: string;
  signOffActorName: string;
  signOffRole: 'student' | 'admin';
  aiVerificationSummary: string;
  studentEmail?: string;
}

export interface EmailDispatchResult {
  status: 'SENT' | 'FAILED' | 'PENDING_CONFIGURATION';
  providerMessageId?: string;
  error?: string;
  recipient: string;
}

export async function sendComplaintCompletionEmail(
  params: SendCompletionEmailParams
): Promise<EmailDispatchResult> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rec.ac.in';
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'maintenance@rec.ac.in';

  const emailSubject = `[COMPLETED] Ticket ${params.complaintId} - ${params.hostel} ${params.locationDetail} (${params.category.toUpperCase()})`;

  // If RESEND_API_KEY is provided, use native fetch to Resend API (zero extra package dependency)
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_RESEND_API_KEY') {
    try {
      const recipients = [adminEmail];
      if (params.studentEmail && params.studentEmail !== adminEmail) {
        recipients.push(params.studentEmail);
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `REC Tech Campus <${emailFrom}>`,
          to: recipients,
          subject: emailSubject,
          html: `
            <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:12px;">
              <div style="background:#1e3a8a; color:#fff; padding:16px 20px; border-radius:8px;">
                <h2 style="margin:0 0 4px 0;">Hostel Maintenance Completed</h2>
                <p style="margin:0; font-size:13px; opacity:0.9;">Rajalakshmi Engineering College (REC)</p>
              </div>
              <div style="padding:20px 0;">
                <p>Ticket <strong>${params.complaintId}</strong> at <strong>${params.hostel} ${params.locationDetail}</strong> has been confirmed as <strong>COMPLETED</strong>.</p>
                <p><strong>Category:</strong> ${params.category.toUpperCase()}</p>
                <p><strong>Technician:</strong> ${params.workerName}</p>
                <p><strong>Work Performed:</strong> ${params.repairNotes}</p>
                <p><strong>Sign-Off:</strong> ${params.signOffActorName} (${params.signOffRole})</p>
              </div>
              <div style="background:#f1f5f9; padding:12px; border-radius:6px; font-size:12px; color:#475569;">
                ${params.aiVerificationSummary}
              </div>
            </div>
          `,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          status: 'FAILED',
          recipient: adminEmail,
          error: data.message || `Resend API returned status ${res.status}`,
        };
      }

      return {
        status: 'SENT',
        recipient: adminEmail,
        providerMessageId: data.id || `resend-${Date.now()}`,
      };
    } catch (err: any) {
      console.error('[Resend Dispatch Error]:', err.message);
      return {
        status: 'FAILED',
        recipient: adminEmail,
        error: err.message || 'Resend dispatch failed.',
      };
    }
  }

  return {
    status: 'PENDING_CONFIGURATION',
    recipient: adminEmail,
    error: 'RESEND_API_KEY is not configured; no email was sent.',
  };
}
