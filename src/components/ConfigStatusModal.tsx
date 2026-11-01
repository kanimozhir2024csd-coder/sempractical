import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ServiceConfigurationStatus } from '../types';
import {
  CheckCircle2,
  HardDrive,
  Sparkles,
  Mail,
  Shield,
  Layers,
  Building,
  Check,
  Copy,
  Users
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigStatusModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<ServiceConfigurationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getConfigStatus()
        .then(setStatus)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">System Architecture & Status</h2>
              <p className="text-xs text-slate-400">Rajalakshmi Engineering College (REC) Infrastructure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <>
              {/* Architecture Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Embedded Storage */}
                <div className="p-4 rounded-2xl border bg-emerald-950/30 border-emerald-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <HardDrive className="w-5 h-5 text-emerald-400" />
                    <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Standalone Ready
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Embedded Engine</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Zero-config persistence active. No external SQL/Supabase setup required. Data persists smoothly and immediately.
                  </p>
                </div>

                {/* Gemini AI */}
                <div className="p-4 rounded-2xl border bg-indigo-950/30 border-indigo-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span className="flex items-center gap-1 text-[11px] text-indigo-300 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      <CheckCircle2 className="w-3 h-3" /> Multimodal
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Gemini Multimodal AI</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    AI intake analysis and repair photo before/after verification with automatic resilient engineering fallback.
                  </p>
                </div>

                {/* Email / Notification System */}
                <div className="p-4 rounded-2xl border bg-purple-950/30 border-purple-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <span className="flex items-center gap-1 text-[11px] text-purple-300 font-bold bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Notification Engine</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Automated in-app notifications and completion email dispatch logged on verified ticket sign-off.
                  </p>
                </div>
              </div>

              {/* Hostels & Workload stats */}
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  Pre-Seeded Campus Residential Hostels
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="font-bold text-rose-400 block">Ruby Hostel (Boys)</span>
                    <span className="text-slate-400 block">4 Floors • 120 Rooms</span>
                    <span className="text-[10px] text-slate-500">Auto-dispatch enabled</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="font-bold text-emerald-400 block">Emerald Hostel (Girls)</span>
                    <span className="text-slate-400 block">4 Floors • 120 Rooms</span>
                    <span className="text-[10px] text-slate-500">Auto-dispatch enabled</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <span className="font-bold text-cyan-400 block">Pearl Hostel (Senior/PG)</span>
                    <span className="text-slate-400 block">3 Floors • 90 Rooms</span>
                    <span className="text-[10px] text-slate-500">Auto-dispatch enabled</span>
                  </div>
                </div>
              </div>

              {/* Quick Demo Credentials for Testing */}
              <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Quick Ready-to-Test Accounts (Zero Password Setup Needed)
                  </h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                    <div>
                      <span className="font-bold text-blue-400">Student:</span>{' '}
                      <code className="text-slate-200">aravind.student@rec.ac.in</code> (Pass: <code className="text-slate-300">Student@REC2026!</code>)
                    </div>
                    <button
                      onClick={() => copyToClipboard('aravind.student@rec.ac.in', 'student')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                    >
                      {copiedKey === 'student' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                    <div>
                      <span className="font-bold text-amber-400">Technician:</span>{' '}
                      <code className="text-slate-200">murugan.plumber@rec.ac.in</code> (Pass: <code className="text-slate-300">Worker@REC2026!</code>)
                    </div>
                    <button
                      onClick={() => copyToClipboard('murugan.plumber@rec.ac.in', 'worker')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                    >
                      {copiedKey === 'worker' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-700">
                    <div>
                      <span className="font-bold text-purple-400">Admin:</span>{' '}
                      <code className="text-slate-200">admin@rec.ac.in</code> (Pass: <code className="text-slate-300">Admin@REC2026!</code>)
                    </div>
                    <button
                      onClick={() => copyToClipboard('admin@rec.ac.in', 'admin')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1"
                    >
                      {copiedKey === 'admin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            Got it, Return to Portal
          </button>
        </div>
      </div>
    </div>
  );
};
