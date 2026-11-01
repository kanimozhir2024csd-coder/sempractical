import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  WorkerProfile,
  Complaint,
  AdminDashboardStats,
  AuditLogEntry,
  EmailLogEntry,
  ComplaintCategory,
  HostelName,
  ComplaintPriority,
  getRequiredSpecializationForCategory,
  isTechnicianSpecializedIn,
} from '../types';
import { api } from '../lib/api';
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Wrench,
  FileText,
  Mail,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  Plus,
  Send,
  Eye,
  FileCheck,
  Building,
  RotateCcw
} from 'lucide-react';

interface Props {
  user: UserProfile;
}

export const AdminDashboard: React.FC<Props> = ({ user }) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'complaints' | 'workers' | 'users' | 'audit' | 'email'>('complaints');

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterHostel, setFilterHostel] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState<Complaint | null>(null);
  const [newWorkerId, setNewWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [allowOverride, setAllowOverride] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New worker form state
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('Worker@REC2026!');
  const [newWorkerSpecialization, setNewWorkerSpecialization] = useState('Electrical');
  const [newWorkerSkills, setNewWorkerSkills] = useState<string[]>(['Electrical']);
  const [newWorkerHostels, setNewWorkerHostels] = useState<HostelName[]>(['Ruby', 'Emerald', 'Pearl']);

  useEffect(() => {
    loadAllAdminData();
  }, [filterStatus, filterHostel, filterPriority, filterCategory]);

  const loadAllAdminData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [statsRes, complaintsRes, workersRes] = await Promise.all([
        api.getDashboardStats(),
        api.getComplaints({
          status: filterStatus || undefined,
          hostel: filterHostel || undefined,
          priority: filterPriority || undefined,
          category: filterCategory || undefined,
          search: searchQuery || undefined,
        }),
        api.getWorkers(),
      ]);
      setStats(statsRes);
      setComplaints(complaintsRes.complaints || []);
      setWorkers(workersRes.workers || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const loadSecondaryData = async (tab: 'users' | 'audit' | 'email') => {
    try {
      if (tab === 'users') {
        const res = await api.getUsers();
        setUsers(res.users || []);
      } else if (tab === 'audit') {
        const res = await api.getAuditLogs();
        setAuditLogs(res.logs || []);
      } else if (tab === 'email') {
        const res = await api.getEmailLogs();
        setEmailLogs(res.logs || []);
      }
    } catch (err) {
      alert(`Could not load ${tab} data: ${err instanceof Error ? err.message : 'Unknown API error.'}`);
    }
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    if (['users', 'audit', 'email'].includes(tab)) {
      loadSecondaryData(tab);
    }
  };

  const handleApproveCommonArea = async (complaintId: string, approved: boolean) => {
    const reason = approved ? 'Approved by Admin for technician dispatch' : 'Rejected by Admin after initial inspection';
    setActionLoading(true);
    try {
      await api.approveCommonArea(complaintId, { approved, reason });
      alert(approved ? 'Common-area complaint approved & worker dispatched.' : 'Complaint marked as rejected.');
      await loadAllAdminData();
      setSelectedComplaint(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOffCommonArea = async (complaintId: string) => {
    const adminNotes = 'Common-area repair inspected and certified by Admin on site.';
    setActionLoading(true);
    try {
      await api.signOffCommonArea(complaintId, { adminNotes });
      alert('Repair officially signed off. Status updated to COMPLETED.');
      await loadAllAdminData();
      setSelectedComplaint(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignSubmit = async () => {
    if (!showReassignModal || !newWorkerId || !reassignReason.trim()) {
      alert('Please select a technician and state the reassignment reason.');
      return;
    }
    setActionLoading(true);
    try {
      await api.reassignJob(showReassignModal.id, {
        newWorkerId,
        reassignReason: reassignReason.trim(),
        allowOverride,
      });
      alert('Job reassigned successfully.');
      setShowReassignModal(null);
      setNewWorkerId('');
      setReassignReason('');
      setAllowOverride(false);
      await loadAllAdminData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerEmail || !newWorkerPassword) {
      alert('Please fill all required worker fields.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createWorker({
        name: newWorkerName.trim(),
        email: newWorkerEmail.trim().toLowerCase(),
        phone: newWorkerPhone.trim(),
        specialization: newWorkerSpecialization,
        skills: newWorkerSkills,
        hostel_coverage: newWorkerHostels,
        password: newWorkerPassword,
      });
      alert('Technician account created successfully with specialization.');
      setShowAddWorkerModal(false);
      setNewWorkerName('');
      setNewWorkerEmail('');
      setNewWorkerPhone('');
      await loadAllAdminData();
    } catch (err: any) {
      alert(`Failed to create worker: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {loadError && (
        <div className="p-4 rounded-2xl text-xs font-bold border bg-rose-950/80 text-rose-200 border-rose-700">
          Could not load admin dashboard data: {loadError}
        </div>
      )}
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-2xl shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">REC Campus Maintenance Operations</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-900/60 text-purple-300 border border-purple-700">
                Master Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Hostel Dispatch Management, Technician Workloads & Multi-Stage Verification</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddWorkerModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add Technician
          </button>
          <button
            onClick={loadAllAdminData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Active</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.totalActive}</span>
          </div>
          <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-2xl shadow">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">Critical & High</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">{stats.criticalHighPriority}</span>
          </div>
          <div className="bg-slate-900 border border-amber-900/40 p-4 rounded-2xl shadow">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">Pending Approval</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.pendingApprovals}</span>
          </div>
          <div className="bg-slate-900 border border-indigo-900/40 p-4 rounded-2xl shadow">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">Unassigned</span>
            <span className="text-2xl font-black text-indigo-400 mt-1 block">{stats.unassigned}</span>
          </div>
          <div className="bg-slate-900 border border-purple-900/40 p-4 rounded-2xl shadow">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block">Admin Sign-Off</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">{stats.awaitingAdminSignOff}</span>
          </div>
          <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-2xl shadow">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">Completed</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.completed}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('complaints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> All Complaints ({complaints.length})
        </button>
        <button
          onClick={() => handleTabChange('workers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'workers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" /> Technicians ({workers.length})
        </button>
        <button
          onClick={() => handleTabChange('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Students & Users
        </button>
        <button
          onClick={() => handleTabChange('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" /> Audit Trail
        </button>
        <button
          onClick={() => handleTabChange('email')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'email' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" /> Completion Notifications
        </button>
      </div>

      {/* TAB 1: ALL COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search ticket ID or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAllAdminData()}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 w-52"
              />
              <select
                value={filterHostel}
                onChange={(e) => setFilterHostel(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">All Hostels</option>
                <option value="Ruby">Ruby Hostel</option>
                <option value="Emerald">Emerald Hostel</option>
                <option value="Pearl">Pearl Hostel</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_ADMIN_APPROVAL">Pending Admin Approval</option>
                <option value="UNASSIGNED">Unassigned</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_ADMIN_SIGN_OFF">Awaiting Admin Sign-Off</option>
                <option value="PENDING_STUDENT_VERIFICATION">Awaiting Student Verification</option>
                <option value="REOPENED">Reopened</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{complaints.length} Records</span>
          </div>

          {/* Complaints Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Ticket ID</th>
                    <th className="px-4 py-3">Hostel & Location</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Worker</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto" />
                      </td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No maintenance complaints found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-400">{c.id}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white">{c.hostel}</span> • {c.location_detail}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white capitalize">{c.category.replace(/_/g, ' ')}</div>
                          <div className="text-[10px] text-indigo-400 font-medium">
                            Needs: {getRequiredSpecializationForCategory(c.category)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            c.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.active_assignment?.worker_name ? (
                            <div>
                              <span className="text-white font-medium block">{c.active_assignment.worker_name}</span>
                              <span className="text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800 font-semibold inline-block mt-0.5">
                                {c.active_assignment.worker_specialization || 'Assigned'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-rose-400 font-semibold italic text-[11px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900">
                              Pending Assignment
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedComplaint(c)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setShowReassignModal(c)}
                            className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-lg text-[11px] font-medium transition"
                          >
                            Reassign
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICIANS */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workers.map((w) => (
              <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{w.name}</h3>
                    <div className="text-xs text-indigo-400 font-bold mt-0.5">
                      Specialization: {w.specialization || 'General Maintenance'}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{w.email}</p>
                    <p className="text-xs text-slate-400">{w.phone}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    w.availability_status === 'available' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {w.availability_status}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Covered Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {w.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase">
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Workload:</span>
                  <span className="font-bold text-amber-400">{w.current_workload} / {w.max_workload} Active Jobs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENTS & USERS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Hostel & Room</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono">{u.email}</td>
                  <td className="px-4 py-3 uppercase font-bold text-[10px]">
                    <span className={`px-2 py-0.5 rounded ${
                      u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      u.role === 'worker' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{u.roll_number || '—'}</td>
                  <td className="px-4 py-3">{u.hostel ? `${u.hostel} (${u.room_number || 'Room N/A'})` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Actor Role</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-white">{log.action}</td>
                  <td className="px-4 py-3 font-mono text-indigo-400">{log.resource_id || log.resource_type}</td>
                  <td className="px-4 py-3 uppercase text-[10px]">{log.actor_role || 'SYSTEM'}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{JSON.stringify(log.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: RESEND EMAIL LOGS */}
      {activeTab === 'email' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Dispatched At</th>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Delivery Status</th>
                <th className="px-4 py-3">Message ID / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {emailLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    No completion emails logged yet. When tickets reach COMPLETED status, email logs are recorded here automatically.
                  </td>
                </tr>
              ) : (
                emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{log.complaint_id || '—'}</td>
                    <td className="px-4 py-3 font-mono">{log.recipient}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {log.delivery_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {log.provider_message_id || log.error_message || 'Delivered'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* INSPECT DETAIL MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-400">{selectedComplaint.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedComplaint.hostel} • {selectedComplaint.location_detail}
                </h3>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {selectedComplaint.description}
            </p>

            {/* Photos */}
            {selectedComplaint.photos && selectedComplaint.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {selectedComplaint.photos.map((p) => (
                  <div key={p.id} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      {p.photo_type.replace('_', ' ')}
                    </span>
                    <img src={p.file_url} alt="Photo" className="w-full h-36 object-cover rounded-xl border border-slate-800" />
                  </div>
                ))}
              </div>
            )}

            {/* Special Action: Approve Common-Area */}
            {selectedComplaint.status === 'PENDING_ADMIN_APPROVAL' && (
              <div className="bg-amber-950/40 border border-amber-500/50 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-amber-300 block">Common-Area Maintenance Approval Required</span>
                <p className="text-xs text-slate-300">
                  Review this common-area defect report. Approving will automatically assign a certified technician covering {selectedComplaint.hostel}.
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApproveCommonArea(selectedComplaint.id, true)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                  >
                    Approve & Dispatch Worker
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApproveCommonArea(selectedComplaint.id, false)}
                    className="px-4 py-2 bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 rounded-xl text-xs font-bold transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Special Action: Final Sign-Off Common-Area */}
            {selectedComplaint.status === 'PENDING_ADMIN_SIGN_OFF' && (
              <div className="bg-purple-950/40 border border-purple-500/50 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-purple-300 block">Common-Area Final Sign-Off Required</span>
                <p className="text-xs text-slate-300">
                  Technician completed repair and passed AI verification. Complete inspection sign-off to finalize ticket.
                </p>
                <button
                  disabled={actionLoading}
                  onClick={() => handleSignOffCommonArea(selectedComplaint.id)}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg"
                >
                  Confirm Sign-Off & Mark Completed
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {showReassignModal && (() => {
        const targetReqSpec = getRequiredSpecializationForCategory(showReassignModal.category);
        const selectedTech = workers.find((w) => w.id === newWorkerId);
        const isMismatch = selectedTech
          ? !isTechnicianSpecializedIn(selectedTech.specialization, selectedTech.skills, targetReqSpec)
          : false;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-base text-white">Reassign Job #{showReassignModal.id}</h3>
                  <div className="text-xs text-indigo-400 font-semibold">
                    Category: {showReassignModal.category} → Requires: {targetReqSpec} Technician
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowReassignModal(null);
                    setAllowOverride(false);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-semibold">Select Technician</label>
                <select
                  value={newWorkerId}
                  onChange={(e) => {
                    setNewWorkerId(e.target.value);
                    setAllowOverride(false);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="">-- Choose technician --</option>
                  {workers.map((w) => {
                    const matches = isTechnicianSpecializedIn(w.specialization, w.skills, targetReqSpec);
                    return (
                      <option key={w.id} value={w.id}>
                        {matches ? '✓ [Matching] ' : '⚠️ [Mismatch] '}
                        {w.name} ({w.specialization || 'General'}) - Workload: {w.current_workload} jobs
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Mismatch Warning & Override */}
              {isMismatch && (
                <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-xs text-amber-200 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    Specialization Mismatch
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This ticket requires a <strong>{targetReqSpec} Technician</strong>, but{' '}
                    <strong>{selectedTech?.name}</strong> specializes in{' '}
                    <strong>{selectedTech?.specialization || 'General Maintenance'}</strong>.
                  </p>
                  <label className="flex items-start gap-2 pt-1 font-semibold text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowOverride}
                      onChange={(e) => setAllowOverride(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Authorize Specialization Override (Mandatory reason will be recorded in assignment history)</span>
                  </label>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-semibold">
                  Reassignment Reason {isMismatch && <span className="text-rose-400">* (Justification required)</span>}
                </label>
                <textarea
                  rows={2}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder={
                    isMismatch
                      ? 'State why this technician is assigned despite specialization mismatch...'
                      : 'e.g. Workload rebalancing, technician on medical leave...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowReassignModal(null);
                    setAllowOverride(false);
                  }}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading || !newWorkerId || !reassignReason.trim() || (isMismatch && !allowOverride)}
                  onClick={handleReassignSubmit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition"
                >
                  {isMismatch ? 'Reassign with Override' : 'Reassign Technician'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD WORKER MODAL */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <form onSubmit={handleCreateWorker} className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-white">Provision New Technician (Admin Only)</h3>
            <p className="text-xs text-slate-400">Technicians cannot self-register; accounts must be created by campus administration.</p>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Technician Full Name *</label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="e.g. Ramesh V."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={newWorkerEmail}
                  onChange={(e) => setNewWorkerEmail(e.target.value)}
                  placeholder="ramesh.electrician@rec.ac.in"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  placeholder="+91 94441 55555"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Technician Specialization *</label>
                <select
                  value={newWorkerSpecialization}
                  onChange={(e) => {
                    const spec = e.target.value;
                    setNewWorkerSpecialization(spec);
                    setNewWorkerSkills([spec]);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold text-indigo-300"
                >
                  <option value="Electrical">⚡ Electrical Technician</option>
                  <option value="Plumbing">🚰 Plumbing Technician</option>
                  <option value="Furniture">🪑 Furniture Technician / Carpenter</option>
                  <option value="Cleanliness">🧹 Housekeeping Staff</option>
                  <option value="Wi-Fi / Internet">📶 Network Technician</option>
                  <option value="General Maintenance">🔧 General Maintenance Technician</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newWorkerPassword}
                  onChange={(e) => setNewWorkerPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowAddWorkerModal(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
