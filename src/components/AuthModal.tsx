import React, { useState } from 'react';
import { UserProfile, WorkerProfile, HostelName, UserRole } from '../types';
import { api, setStoredToken } from '../lib/api';
import {
  GraduationCap,
  Wrench,
  Shield,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile, workerProfile?: WorkerProfile) => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, defaultRole }) => {
  const [tab, setTab] = useState<'student_login' | 'student_register' | 'staff_login'>(
    defaultRole === 'worker' || defaultRole === 'admin' ? 'staff_login' : 'student_login'
  );

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [hostel, setHostel] = useState<HostelName>('Ruby');
  const [roomNumber, setRoomNumber] = useState('304');
  const [phone, setPhone] = useState('+91 98402 11111');
  const [regPassword, setRegPassword] = useState('Student@REC2026!');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      setStoredToken(res.token);
      onSuccess(res.profile, res.workerProfile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.registerStudent({
        name: name.trim(),
        email: regEmail.trim(),
        roll_number: rollNumber.trim(),
        department,
        hostel,
        room_number: roomNumber.trim(),
        phone,
        password: regPassword,
      });
      setStoredToken(res.token);
      onSuccess(res.profile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Instant login helper for demo
  const quickLoginAs = async (userEmail: string, userPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: userEmail, password: userPass });
      setStoredToken(res.token);
      onSuccess(res.profile, res.workerProfile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">REC Maintenance Portal</h2>
            <p className="text-xs text-slate-400">Rajalakshmi Engineering College (REC)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-lg">
            ✕
          </button>
        </div>

        {/* 1-Click Fast Instant Login Presets */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> 1-Click Instant Login:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickLoginAs('aravind.student@rec.ac.in', 'Student@REC2026!')}
              className="px-2.5 py-2 bg-blue-950/70 hover:bg-blue-900/90 text-blue-300 border border-blue-800/80 rounded-xl text-left text-[11px] font-semibold transition"
            >
              <div className="font-bold flex items-center gap-1 text-white">
                <GraduationCap className="w-3 h-3 text-blue-400" /> Student
              </div>
              <div className="text-[10px] text-blue-300/80">Ruby 304 (Aravind)</div>
            </button>
            <button
              type="button"
              onClick={() => quickLoginAs('murugan.plumber@rec.ac.in', 'Worker@REC2026!')}
              className="px-2.5 py-2 bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-800/80 rounded-xl text-left text-[11px] font-semibold transition"
            >
              <div className="font-bold flex items-center gap-1 text-white">
                <Wrench className="w-3 h-3 text-amber-400" /> Technician
              </div>
              <div className="text-[10px] text-amber-300/80">Plumber (Murugan)</div>
            </button>
            <button
              type="button"
              onClick={() => quickLoginAs('selvam.electrician@rec.ac.in', 'Worker@REC2026!')}
              className="px-2.5 py-2 bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-800/80 rounded-xl text-left text-[11px] font-semibold transition"
            >
              <div className="font-bold flex items-center gap-1 text-white">
                <Wrench className="w-3 h-3 text-amber-400" /> Technician
              </div>
              <div className="text-[10px] text-amber-300/80">Electrician (Selvam)</div>
            </button>
            <button
              type="button"
              onClick={() => quickLoginAs('admin@rec.ac.in', 'Admin@REC2026!')}
              className="px-2.5 py-2 bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 border border-purple-800/80 rounded-xl text-left text-[11px] font-semibold transition"
            >
              <div className="font-bold flex items-center gap-1 text-white">
                <Shield className="w-3 h-3 text-purple-400" /> Master Admin
              </div>
              <div className="text-[10px] text-purple-300/80">Full Campus Control</div>
            </button>
          </div>
        </div>

        {/* Role tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => { setTab('student_login'); setError(null); }}
            className={`py-2 rounded-lg transition ${tab === 'student_login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Student Sign In
          </button>
          <button
            onClick={() => { setTab('student_register'); setError(null); }}
            className={`py-2 rounded-lg transition ${tab === 'student_register' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            New Student
          </button>
          <button
            onClick={() => { setTab('staff_login'); setError(null); }}
            className={`py-2 rounded-lg transition ${tab === 'staff_login' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Staff / Admin
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STUDENT LOGIN FORM */}
        {tab === 'student_login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">College Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aravind.student@rec.ac.in"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In as Student'}
            </button>
          </form>
        )}

        {/* STUDENT REGISTRATION FORM */}
        {tab === 'student_register' && (
          <form onSubmit={handleRegisterStudent} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aravind Kumar"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">College Email *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="aravind@rec.ac.in"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="210701045"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white uppercase font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Hostel Block *</label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value as HostelName)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="Ruby">Ruby Hostel (Boys)</option>
                  <option value="Emerald">Emerald Hostel (Girls)</option>
                  <option value="Pearl">Pearl Hostel (Senior/PG)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Room Number *</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 304"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Computer Science & Engineering"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Password *</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-bold text-white rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 mt-1"
            >
              {loading ? 'Creating Student Profile...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* STAFF / ADMIN LOGIN FORM */}
        {tab === 'staff_login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Staff / Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rec.ac.in or murugan.plumber@rec.ac.in"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded-xl text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Verifying Credentials...' : 'Sign In as Staff / Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
