import React, { useState, useEffect } from 'react';
import { UserProfile, Complaint } from '../types';
import { api } from '../lib/api';
import { ChatbotReporter } from './ChatbotReporter';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building,
  Wrench,
  FileCheck,
  Eye,
  RefreshCw,
  Send,
  X
} from 'lucide-react';

interface Props {
  user: UserProfile;
}

export const StudentDashboard: React.FC<Props> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.getComplaints();
      setComplaints(res.complaints || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your complaint history.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmSolved = async (complaintId: string) => {
    setActionLoading(true);
    try {
      const res = await api.confirmSolved(complaintId, { confirmationNotes: 'Confirmed resolved by student resident.' });
      showToast(res.message || 'Complaint resolution confirmed! Status updated to COMPLETED.', 'success');
      await loadComplaints();
      if (selectedTicket?.id === complaintId) {
        setSelectedTicket(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to confirm resolution.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenSubmit = async (complaintId: string) => {
    if (!reopenReason.trim() || reopenReason.trim().length < 4) {
      showToast('Please provide an explanation for reopening (at least 4 characters).', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.reopenComplaint(complaintId, { explanation: reopenReason.trim() });
      showToast(res.message || 'Ticket reopened for technician follow-up.', 'success');
      setShowReopenModal(null);
      setReopenReason('');
      await loadComplaints();
      if (selectedTicket?.id === complaintId) {
        setSelectedTicket(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reopen ticket.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const activeComplaints = complaints.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status));
  const pastComplaints = complaints.filter((c) => ['COMPLETED', 'CANCELLED'].includes(c.status));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_STUDENT_VERIFICATION':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">Awaiting Your Confirmation</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">In Progress</span>;
      case 'ASSIGNED':
      case 'ACCEPTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">Technician Assigned</span>;
      case 'REGISTERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Registered</span>;
      case 'UNASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">Queued for Dispatch</span>;
      case 'REOPENED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">Reopened</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">Completed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-lg transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700'
              : 'bg-rose-950/80 text-rose-200 border-rose-700'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100 px-2">
            ✕
          </button>
        </div>
      )}
      {loadError && (
        <div className="p-4 rounded-2xl text-xs font-bold border bg-rose-950/80 text-rose-200 border-rose-700">
          Could not load complaint tracking data: {loadError}
        </div>
      )}

      {/* Student Profile Card & Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black text-2xl shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                  Resident Student
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{user.email} • Roll: {user.roll_number}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  {user.hostel} Hostel
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold">
                  Room: {user.room_number || '304'}
                </span>
                {user.department && (
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400">
                    Dept: {user.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Button: AI Chatbot */}
          <div>
            <button
              onClick={() => setShowChatbot(true)}
              className="w-full md:w-auto px-7 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition transform active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-indigo-200" />
              Report Issue with AI Chatbot
            </button>
          </div>
        </div>
      </div>

      {/* AI Chatbot Modal */}
      {showChatbot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl">
            <ChatbotReporter
              user={user}
              onTicketCreated={(newTicket) => {
                setComplaints((prev) => {
                  const filtered = prev.filter((c) => c.id !== newTicket.id);
                  return [newTicket, ...filtered];
                });
              }}
              onClose={() => {
                setShowChatbot(false);
                loadComplaints();
              }}
            />
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <RotateCcw className="w-5 h-5" />
              Reopen Maintenance Ticket #{showReopenModal}
            </div>
            <p className="text-xs text-slate-300">
              Please explain why the issue is not solved. The assigned technician and campus administration will be notified immediately for on-site follow-up.
            </p>
            <textarea
              rows={4}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. The tap still drips when water pressure increases in the evening..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowReopenModal(null);
                  setReopenReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReopenSubmit(showReopenModal)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Submitting...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-4 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-400">{selectedTicket.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedTicket.hostel} • {selectedTicket.location_detail}
                </h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Status</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Issue Description</span>
                <p className="text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.active_assignment?.worker_name && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned Technician</span>
                    <span className="text-white font-bold text-xs">{selectedTicket.active_assignment.worker_name}</span>
                  </div>
                  {selectedTicket.active_assignment.worker_phone && (
                    <span className="text-slate-400 font-mono text-[11px]">{selectedTicket.active_assignment.worker_phone}</span>
                  )}
                </div>
              )}

              {selectedTicket.completion && (
                <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-800/40 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">Technician Repair Notes</span>
                  <p className="text-slate-200 text-xs">{selectedTicket.completion.repair_notes}</p>
                  {selectedTicket.completion.ai_verification_notes && (
                    <p className="text-[11px] text-indigo-300/80 italic">
                      AI Audit: {selectedTicket.completion.ai_verification_notes}
                    </p>
                  )}
                </div>
              )}

              {/* Photos Gallery */}
              {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Attached Photos</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTicket.photos.map((p) => (
                      <div key={p.id} className="space-y-1">
                        <img src={p.file_url} alt="Defect" className="w-full h-28 object-cover rounded-xl border border-slate-800" />
                        <span className="text-[10px] text-slate-400 font-mono block text-center">
                          {p.photo_type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Complaints Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Active Maintenance Tickets ({activeComplaints.length})
          </h2>
          <button
            onClick={loadComplaints}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : activeComplaints.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
            <h3 className="text-base font-bold text-white">No Open Maintenance Complaints</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your room and hostel facilities are in good order. If you encounter any plumbing, electrical, carpentry, or sanitation problems, click above to report via the AI Chatbot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition shadow-lg space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-400">{c.id}</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{c.hostel} • {c.location_detail}</h3>
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{c.description}</p>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase font-semibold text-[10px]">
                    {c.category.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    c.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    c.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {c.priority} Priority
                  </span>
                  {c.active_assignment?.worker_name && (
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <Wrench className="w-3 h-3 text-amber-400" />
                      {c.active_assignment.worker_name} {c.active_assignment.worker_specialization ? `(${c.active_assignment.worker_specialization})` : ''}
                    </span>
                  )}
                </div>

                {/* PENDING STUDENT VERIFICATION BANNER */}
                {c.status === 'PENDING_STUDENT_VERIFICATION' && (
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                      <FileCheck className="w-4 h-4" />
                      Technician Completed Repair - Please Inspect
                    </div>
                    {c.completion?.repair_notes && (
                      <p className="text-xs text-slate-200">
                        <strong>Technician Notes:</strong> {c.completion.repair_notes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleConfirmSolved(c.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Solved
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => setShowReopenModal(c.id)}
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                      >
                        Still Unresolved
                      </button>
                    </div>
                  </div>
                )}

                {/* View Details Link */}
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setSelectedTicket(c)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Ticket Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History Section */}
      {pastComplaints.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-base font-bold text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Resolved Complaint History ({pastComplaints.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedTicket(c)}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2 text-slate-400 hover:border-slate-700 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-300">{c.id}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Completed
                  </span>
                </div>
                <p className="text-slate-300">{c.description}</p>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>{c.hostel} {c.location_detail}</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
