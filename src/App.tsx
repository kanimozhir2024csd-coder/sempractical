import React, { useState, useEffect } from 'react';
import { UserProfile, WorkerProfile, UserRole } from './types';
import { api, getStoredToken, clearStoredToken, setStoredToken } from './lib/api';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { WorkerDashboard } from './components/WorkerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { ConfigStatusModal } from './components/ConfigStatusModal';
import {
  Sparkles,
  Shield,
  Wrench,
  GraduationCap,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  Camera,
  Mail,
  Zap,
  Cpu,
  Layers
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<UserRole | undefined>(undefined);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.profile);
      if (res.workerProfile) {
        setWorkerProfile(res.workerProfile);
      }
    } catch {
      clearStoredToken();
      setUser(null);
      setWorkerProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setWorkerProfile(null);
  };

  const handleAuthSuccess = (profile: UserProfile, worker?: WorkerProfile) => {
    setUser(profile);
    if (worker) setWorkerProfile(worker);
  };

  const handleQuickLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      setStoredToken(res.token);
      setUser(res.profile);
      if (res.workerProfile) {
        setWorkerProfile(res.workerProfile);
      }
    } catch (err: any) {
      alert(`Login error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openAuthWithRole = (role?: UserRole) => {
    setAuthDefaultRole(role);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-600/30 animate-pulse text-white">
            REC
          </div>
          <span className="text-xs text-slate-400 font-semibold tracking-wider">
            Loading TECH CAMPUS Systems...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={openAuthWithRole}
        onOpenConfig={() => setShowConfigModal(true)}
        onSwitchUser={handleQuickLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {user ? (
          <>
            {user.role === 'student' && <StudentDashboard user={user} />}
            {user.role === 'worker' && <WorkerDashboard user={user} workerProfile={workerProfile} />}
            {user.role === 'admin' && <AdminDashboard user={user} />}
          </>
        ) : (
          /* Public Landing Page */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-16">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Rajalakshmi Engineering College (REC)
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                AI-Powered Hostel Maintenance Management
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
                Comprehensive hostel facility operations with AI-assisted chatbot reporting, multimodal repair verification, automated skill-based worker dispatch, and instant resident sign-offs.
              </p>

              {/* 1-Click Demo Access Cards */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Instant Test Accounts (Click to enter immediately):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                  <button
                    onClick={() => handleQuickLogin('aravind.student@rec.ac.in', 'Student@REC2026!')}
                    className="p-4 bg-slate-900 hover:bg-slate-800 border border-blue-900/60 hover:border-blue-600 rounded-2xl text-left transition transform hover:-translate-y-0.5 shadow-lg group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <GraduationCap className="w-5 h-5 text-blue-400" />
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
                    </div>
                    <span className="font-bold text-sm text-white block">Student Portal</span>
                    <span className="text-xs text-slate-400">Ruby 304 (Aravind)</span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('murugan.plumber@rec.ac.in', 'Worker@REC2026!')}
                    className="p-4 bg-slate-900 hover:bg-slate-800 border border-amber-900/60 hover:border-amber-600 rounded-2xl text-left transition transform hover:-translate-y-0.5 shadow-lg group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Wrench className="w-5 h-5 text-amber-400" />
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                    </div>
                    <span className="font-bold text-sm text-white block">Technician Desk</span>
                    <span className="text-xs text-slate-400">Plumbing (Murugan)</span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('admin@rec.ac.in', 'Admin@REC2026!')}
                    className="p-4 bg-slate-900 hover:bg-slate-800 border border-purple-900/60 hover:border-purple-600 rounded-2xl text-left transition transform hover:-translate-y-0.5 shadow-lg group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
                    </div>
                    <span className="font-bold text-sm text-white block">Master Admin</span>
                    <span className="text-xs text-slate-400">Campus Operations</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => openAuthWithRole('student')}
                  className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95"
                >
                  Sign In with Credentials <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-6 py-3.5 rounded-2xl font-bold text-sm text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                >
                  System & Storage Architecture
                </button>
              </div>
            </div>

            {/* Hostels Covered */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 text-center space-y-2 hover:border-rose-900/50 transition">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center mx-auto text-sm border border-rose-500/30 shadow-inner">
                  RUBY
                </div>
                <h3 className="font-bold text-white text-base">Ruby Hostel</h3>
                <p className="text-xs text-slate-400">Boys Residential Block • 4 Floors • 120 Rooms</p>
                <span className="inline-block text-[10px] font-semibold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                  Full Maintenance Dispatch
                </span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 text-center space-y-2 hover:border-emerald-900/50 transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mx-auto text-sm border border-emerald-500/30 shadow-inner">
                  EMR
                </div>
                <h3 className="font-bold text-white text-base">Emerald Hostel</h3>
                <p className="text-xs text-slate-400">Girls Residential Block • 4 Floors • 120 Rooms</p>
                <span className="inline-block text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Full Maintenance Dispatch
                </span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 text-center space-y-2 hover:border-cyan-900/50 transition">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center mx-auto text-sm border border-cyan-500/30 shadow-inner">
                  PRL
                </div>
                <h3 className="font-bold text-white text-base">Pearl Hostel</h3>
                <p className="text-xs text-slate-400">Senior & PG Residential Block • 3 Floors • 90 Rooms</p>
                <span className="inline-block text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  Full Maintenance Dispatch
                </span>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl w-fit">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">AI Chatbot Intake</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Natural language conversation with multimodal image defect inspection and duplicate ticket suppression.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl w-fit">
                  <Wrench className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Automated Skill Dispatch</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time matching based on technician skill categories, hostel coverage, priority tier, and workload balancing.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Repair Verification</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Multimodal verification of original damage versus technician's completion photo before student sign-off.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl w-fit">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Embedded Persistence</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zero external database setup or configuration required. Runs seamlessly out of the box with pre-seeded data.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Rajalakshmi Engineering College (REC) • TECH CAMPUS Hostel Maintenance System</p>
        <p className="text-[11px] text-slate-600 mt-1">Hostels: Ruby • Emerald • Pearl | Exactly 3 Roles: Student, Worker, Admin</p>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultRole={authDefaultRole}
      />
      <ConfigStatusModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
}
