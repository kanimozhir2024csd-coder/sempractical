import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkerProfile, Complaint } from '../types';
import { api } from '../lib/api';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Camera,
  Play,
  FileCheck,
  Check,
  Building,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  X
} from 'lucide-react';

interface Props {
  user: UserProfile;
  workerProfile?: WorkerProfile | null;
}

export const WorkerDashboard: React.FC<Props> = ({ user, workerProfile: initialWorker }) => {
  const [worker, setWorker] = useState<WorkerProfile | null>(initialWorker || null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Repair Submission Modal State
  const [repairModalComplaint, setRepairModalComplaint] = useState<Complaint | null>(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [repairPhotoDataUrl, setRepairPhotoDataUrl] = useState<string | null>(null);
  const [repairPhotoMimeType, setRepairPhotoMimeType] = useState('image/jpeg');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWorkerData();
  }, []);

  const loadWorkerData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const meRes = await api.getMe();
      if (meRes.workerProfile) {
        setWorker(meRes.workerProfile);
      }
      const complaintsRes = await api.getComplaints();
      setComplaints(complaintsRes.complaints || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load worker dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (complaintId: string) => {
    setActionLoading(true);
    try {
      await api.acceptJob(complaintId);
      await loadWorkerData();
    } catch (err: any) {
      alert(`Error accepting job: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (complaintId: string) => {
    setActionLoading(true);
    try {
      await api.startJob(complaintId);
      await loadWorkerData();
    } catch (err: any) {
      alert(`Error starting job: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    setRepairPhotoMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setRepairPhotoDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRepair = async () => {
    if (!repairModalComplaint) return;
    if (!repairNotes.trim() || repairNotes.trim().length < 5) {
      alert('Please enter detailed repair notes (at least 5 characters).');
      return;
    }
    if (!repairPhotoDataUrl) {
      alert('Repair completion photo is mandatory.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.submitRepair(repairModalComplaint.id, {
        repairNotes: repairNotes.trim(),
        repairPhotoDataUrl,
        repairPhotoMimeType,
      });
      alert(`Repair submitted! AI Verification Result: ${res.verification.result}`);
      await loadWorkerData();
      setRepairModalComplaint(null);
      setRepairNotes('');
      setRepairPhotoDataUrl(null);
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const activeJobs = complaints.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status));
  const completedJobs = complaints.filter((c) => c.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {loadError && (
        <div className="p-4 rounded-2xl text-xs font-bold border bg-rose-950/80 text-rose-200 border-rose-700">
          Could not load technician data: {loadError}
        </div>
      )}
      {/* Technician Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-2xl shadow-inner">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700">
                  {worker?.specialization ? `${worker.specialization} Technician` : 'Certified Technician'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{user.email} • {user.phone || '+91 94441 12301'}</p>

              {/* Specialization & Skills */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span className="bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-700 text-indigo-300 font-bold text-[11px]">
                  Specialization: {worker?.specialization || 'General Maintenance'}
                </span>
                {worker?.skills.map((skill) => (
                  <span key={skill} className="bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700 text-slate-300 font-semibold uppercase text-[10px]">
                    {skill.replace(/_/g, ' ')}
                  </span>
                ))}
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 text-[11px]">
                  Coverage: {worker?.hostel_coverage.join(', ') || 'Ruby, Emerald, Pearl'}
                </span>
              </div>
            </div>
          </div>

          {/* Workload Gauge */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 min-w-[210px] text-center space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Workload</span>
            <div className="text-2xl font-black text-amber-400">
              {worker?.current_workload ?? activeJobs.length} <span className="text-sm text-slate-500 font-normal">/ {worker?.max_workload || 5} Jobs</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (((worker?.current_workload ?? activeJobs.length) / (worker?.max_workload || 5)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Repair Evidence Modal */}
      {repairModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-5 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Submit Repair Evidence • #{repairModalComplaint.id}
                </h3>
              </div>
              <button
                onClick={() => setRepairModalComplaint(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Original vs After preview comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Original Issue Photo</span>
                {repairModalComplaint.photos?.find((p) => p.photo_type === 'ORIGINAL_ISSUE') ? (
                  <img
                    src={repairModalComplaint.photos.find((p) => p.photo_type === 'ORIGINAL_ISSUE')?.file_url}
                    alt="Original defect"
                    className="w-full h-32 object-cover rounded-lg border border-slate-800"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center text-[11px] text-slate-500 bg-slate-900 rounded-lg">
                    No initial photo
                  </div>
                )}
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Repair Completion Photo *</span>
                {repairPhotoDataUrl ? (
                  <div className="relative group">
                    <img
                      src={repairPhotoDataUrl}
                      alt="Completed repair"
                      className="w-full h-32 object-cover rounded-lg border border-emerald-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setRepairPhotoDataUrl(null)}
                      className="absolute top-1 right-1 bg-black/60 text-rose-400 p-1 rounded hover:bg-black text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-white transition p-2 text-center"
                  >
                    <Camera className="w-6 h-6 text-amber-400 mb-1" />
                    <span className="text-[11px] font-semibold">Upload After Photo</span>
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Repair Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Repair Notes & Work Performed *
              </label>
              <textarea
                rows={3}
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="Explain the technical work completed (e.g. Replaced faulty inlet valve, sealed joint with Teflon, verified zero leak under full pressure)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong>Automated Multimodal Verification:</strong> Gemini AI compares the initial defect with your completion photo to verify genuine resolution before student sign-off.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRepairModalComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !repairPhotoDataUrl || !repairNotes.trim()}
                onClick={handleSubmitRepair}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying with Gemini AI...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Verify & Submit Completion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Assigned Maintenance Tasks ({activeJobs.length})
          </h2>
          <button
            onClick={loadWorkerData}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
            <h3 className="text-base font-bold text-white">No Pending Maintenance Jobs</h3>
            <p className="text-xs text-slate-400">All assigned jobs are completed. New complaints matching your skills will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition shadow-lg space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-400">{job.id}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{job.hostel} • {job.location_detail}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    job.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' :
                    job.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {job.priority} Priority
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{job.description}</p>

                {job.photos && job.photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <img
                      src={job.photos[0].file_url}
                      alt="Defect"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700"
                    />
                    <div className="text-[11px] text-slate-400">
                      <strong>AI Summary:</strong> {job.ai_validation_summary || 'Validated maintenance issue'}
                    </div>
                  </div>
                )}

                {/* Workflow Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  {job.status === 'ASSIGNED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAccept(job.id)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Job
                    </button>
                  )}
                  {job.status === 'ACCEPTED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleStart(job.id)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Work on Site
                    </button>
                  )}
                  {['IN_PROGRESS', 'REOPENED', 'REPAIR_VERIFICATION_FAILED'].includes(job.status) && (
                    <button
                      disabled={actionLoading}
                      onClick={() => setRepairModalComplaint(job)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Submit Repair & Verify
                    </button>
                  )}
                  {job.status === 'PENDING_STUDENT_VERIFICATION' && (
                    <div className="w-full py-2 text-center text-xs text-amber-300 bg-amber-950/40 border border-amber-800 rounded-xl font-medium">
                      Awaiting Resident Student Confirmation
                    </div>
                  )}
                  {job.status === 'PENDING_ADMIN_SIGN_OFF' && (
                    <div className="w-full py-2 text-center text-xs text-purple-300 bg-purple-950/40 border border-purple-800 rounded-xl font-medium">
                      Awaiting Admin Final Sign-Off
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History */}
      {completedJobs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-base font-bold text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Completed Repairs History ({completedJobs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedJobs.slice(0, 6).map((job) => (
              <div
                key={job.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-1.5 text-slate-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-300">{job.id}</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Closed</span>
                </div>
                <p className="text-slate-300 truncate">{job.description}</p>
                <div className="text-[10px] text-slate-500">
                  {job.hostel} {job.location_detail} • {new Date(job.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
