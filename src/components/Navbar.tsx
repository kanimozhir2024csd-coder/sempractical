import React, { useState, useEffect } from 'react';
import { UserProfile, AppNotification, UserRole } from '../types';
import { api } from '../lib/api';
import {
  Bell,
  LogOut,
  Shield,
  Wrench,
  GraduationCap,
  Sparkles,
  Building2,
  Check,
  CheckCircle2,
  Cpu,
  UserCheck
} from 'lucide-react';

interface Props {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: (defaultRole?: UserRole) => void;
  onOpenConfig: () => void;
  onSwitchUser?: (email: string, password: string) => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  onLogout,
  onOpenAuth,
  onOpenConfig,
  onSwitchUser,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount((res.notifications || []).filter((n) => !n.read_status).length);
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-900/50 text-purple-300 border border-purple-700/60 shadow-sm">
            <Shield className="w-3.5 h-3.5" /> Admin
          </span>
        );
      case 'worker':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-900/50 text-amber-300 border border-amber-700/60 shadow-sm">
            <Wrench className="w-3.5 h-3.5" /> Technician
          </span>
        );
      case 'student':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-900/50 text-blue-300 border border-blue-700/60 shadow-sm">
            <GraduationCap className="w-3.5 h-3.5" /> Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & REC Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-black text-lg tracking-wider">
            REC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">TECH CAMPUS</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-950 text-indigo-400 border border-indigo-800">
                <Sparkles className="w-2.5 h-2.5" /> AI Maintenance
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Rajalakshmi Engineering College</p>
          </div>
        </div>

        {/* Hostels tags */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-medium">Campus Blocks:</span>
          <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-800/50 rounded-md font-semibold text-[11px]">Ruby</span>
          <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 rounded-md font-semibold text-[11px]">Emerald</span>
          <span className="px-2 py-0.5 bg-cyan-950/40 text-cyan-300 border border-cyan-800/50 rounded-md font-semibold text-[11px]">Pearl</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher if logged in */}
          {user && onSwitchUser && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-[11px]">
              <span className="text-slate-500 font-semibold px-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-indigo-400" /> Switch:
              </span>
              <button
                onClick={() => onSwitchUser('aravind.student@rec.ac.in', 'Student@REC2026!')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  user.role === 'student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => onSwitchUser('selvam.electrician@rec.ac.in', 'Worker@REC2026!')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  user.role === 'worker' && user.email.includes('electrician') ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Electrician
              </button>
              <button
                onClick={() => onSwitchUser('murugan.plumber@rec.ac.in', 'Worker@REC2026!')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  user.role === 'worker' && user.email.includes('plumber') ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🚰 Plumber
              </button>
              <button
                onClick={() => onSwitchUser('admin@rec.ac.in', 'Admin@REC2026!')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  user.role === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          )}

          {/* System Status / Architecture Modal button */}
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 transition"
            title="System & Storage Architecture Status"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">System Status</span>
          </button>

          {user ? (
            <>
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md shadow-rose-500/50">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Campus Alerts</span>
                      <span className="text-xs text-indigo-400 font-semibold">{unreadCount} Unread</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => !n.read_status && handleMarkRead(n.id)}
                            className={`p-2.5 rounded-xl text-xs transition cursor-pointer border ${
                              n.read_status
                                ? 'bg-slate-800/30 text-slate-400 border-slate-800'
                                : 'bg-slate-800/90 text-slate-200 border-indigo-500/50 shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-white text-[12px]">{n.title}</span>
                              {!n.read_status && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkRead(n.id);
                                  }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-semibold"
                                >
                                  <Check className="w-3 h-3" /> Mark Read
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                            <span className="block mt-1.5 text-[9px] text-slate-500 font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Pill */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="text-right">
                  <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                </div>
                {getRoleBadge(user.role)}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('student')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
