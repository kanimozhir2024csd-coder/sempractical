import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, HostelName, ComplaintCategory, ComplaintPriority, ComplaintType, Complaint } from '../types';
import { api } from '../lib/api';
import {
  Sparkles,
  Camera,
  Upload,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Building,
  Check,
  AlertTriangle,
  RotateCcw,
  Wrench,
  FileText
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onTicketCreated: (complaint: Complaint) => void;
  onClose?: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  type?: 'regular' | 'analysis' | 'followup' | 'confirmation' | 'success' | 'rejection' | 'duplicate' | 'ai_fallback';
  data?: any;
}

export const ChatbotReporter: React.FC<Props> = ({ user, onTicketCreated, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hello ${user.name}! I am your REC AI Maintenance Assistant.\n\nPlease describe the maintenance defect you are experiencing in your hostel or room (you can also attach a photo for multimodal inspection).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Form & conversation states
  const [inputDescription, setInputDescription] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Dispatch parameters
  const [complaintType, setComplaintType] = useState<ComplaintType>('ROOM');
  const [hostel, setHostel] = useState<HostelName>(user.hostel || 'Ruby');
  const [locationDetail, setLocationDetail] = useState(user.room_number ? `Room ${user.room_number}` : 'Room 304');
  const [detectedCategory, setDetectedCategory] = useState<ComplaintCategory>('plumbing');
  const [detectedPriority, setDetectedPriority] = useState<ComplaintPriority>('MEDIUM');
  const [aiSummary, setAiSummary] = useState('');
  const [aiConfidence, setAiConfidence] = useState(0.9);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  // Active step
  const [currentStep, setCurrentStep] = useState<'intake' | 'followup' | 'confirmation' | 'success'>('intake');
  const [createdTicket, setCreatedTicket] = useState<Complaint | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStep, isAnalyzing]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSubmissionError('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    setSubmissionError(null);
    setPhotoMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendInitial = async () => {
    if (!inputDescription.trim()) {
      setSubmissionError('Please describe the maintenance issue before sending.');
      return;
    }
    const desc = inputDescription.trim();
    setProblemDescription(desc);
    setInputDescription('');
    setSubmissionError(null);

    const userMsgId = Date.now().toString();
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: desc,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: { photo: photoDataUrl },
      },
    ];
    setMessages(newMessages);
    setIsAnalyzing(true);
    await runAnalysis(desc, photoDataUrl, photoMimeType, newMessages);
  };

  const runAnalysis = async (
    desc: string,
    photoUrl: string | null,
    photoMime: string,
    currentMessages: Message[]
  ) => {
    setIsAnalyzing(true);
    setSubmissionError(null);
    try {
      const res = await api.analyzeComplaint({
        description: desc,
        imageBase64: photoUrl || undefined,
        imageMimeType: photoMime,
        hostel,
        location: locationDetail,
      });

      const { aiResult, duplicate } = res;
      if (!aiResult) {
        throw new Error('Analysis completed.');
      }

      if (!aiResult.isValidMaintenance) {
        setMessages([
          ...currentMessages,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `⚠️ Inspection Notice:\n\n${aiResult.rejectionReason || 'The description does not depict a standard hostel maintenance defect.'}\n\nPlease clarify the issue or attach a photo of the defect.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'rejection',
          },
        ]);
        setIsAnalyzing(false);
        return;
      }

      setDetectedCategory(aiResult.category);
      setDetectedPriority(aiResult.priority);
      setAiSummary(aiResult.issueSummary || desc);
      setAiConfidence(aiResult.confidence || 0.9);

      if (duplicate) {
        setMessages([
          ...currentMessages,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `ℹ️ Note: An active ticket (${duplicate.id}) already exists for ${duplicate.hostel} ${duplicate.location_detail} with ${duplicate.category} issue.\nCurrent status: ${duplicate.status}. You may still proceed if this is a separate issue.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'duplicate',
            data: duplicate,
          },
        ]);
      }

      if (aiResult.followUpQuestions && aiResult.followUpQuestions.length > 0) {
        setFollowUpQuestions(aiResult.followUpQuestions);
        setCurrentStep('followup');
        setMessages([
          ...currentMessages,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `Identified issue: ${aiResult.category.toUpperCase().replace('_', ' ')} (${aiResult.priority} Priority)\n${aiResult.issueSummary}\n\nTo ensure our technician brings the exact right spares and tools, please provide quick clarification:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'followup',
            data: { questions: aiResult.followUpQuestions },
          },
        ]);
      } else {
        setCurrentStep('confirmation');
        setMessages([
          ...currentMessages,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: `Analysis complete! Category identified as ${aiResult.category.toUpperCase().replace('_', ' ')} with ${aiResult.priority} priority.\n\nPlease review your dispatch details and click Confirm to generate your maintenance ticket.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'confirmation',
          },
        ]);
      }
    } catch (err) {
      setInputDescription(desc);
      setSubmissionError(
        `Complaint analysis could not be completed. ${err instanceof Error ? err.message : 'Please try again.'}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFollowUpProceed = () => {
    setCurrentStep('confirmation');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Thank you for the clarification. Review your ticket summary below and confirm dispatch.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'confirmation',
      },
    ]);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    let fullDescription = problemDescription || inputDescription || 'Maintenance request submitted via AI Chatbot.';
    if (Object.keys(followUpAnswers).length > 0) {
      const clarifications = Object.entries(followUpAnswers)
        .filter(([_, ans]) => ans && ans.trim().length > 0)
        .map(([q, ans]) => `[Q: ${q}] -> ${ans.trim()}`)
        .join('\n');
      if (clarifications) {
        fullDescription += `\n\nClarifications:\n${clarifications}`;
      }
    }

    try {
      const res = await api.createComplaint({
        complaint_type: complaintType,
        hostel,
        location_detail: locationDetail.trim() || `Room ${user.room_number || '304'}`,
        category: detectedCategory,
        priority: detectedPriority,
        description: fullDescription.trim(),
        ai_validation_summary: aiSummary ? `${aiSummary} (Confidence: ${Math.round(aiConfidence * 100)}%)` : 'Submitted via AI Chatbot',
        ai_confidence: aiConfidence,
        photoDataUrl: photoDataUrl || undefined,
        photoMimeType,
      });

      const { complaint, assignedWorker } = res;
      setCreatedTicket(complaint);
      setCurrentStep('success');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: `🎉 Complaint Successfully Registered!\n\nTicket ID: ${complaint.id}\nStatus: ${complaint.status}\nLocation: ${complaint.hostel} ${complaint.location_detail}\nCategory: ${complaint.category.toUpperCase().replace('_', ' ')} (${complaint.priority} Priority)\nAssigned Technician: ${assignedWorker?.name || 'Queued for certified campus technician'}\n\nYou can track repair progress in your dashboard.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'success',
          data: complaint,
        },
      ]);
      onTicketCreated(complaint);
    } catch (err: any) {
      console.error('Complaint registration error:', err);
      const errMsg = err.message || 'Failed to register complaint.';
      setSubmissionError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[680px] max-h-[88vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl text-slate-100">
      {/* Bot Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800/95 border-b border-slate-700 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              REC AI Maintenance Intake Chatbot
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400">Intelligent Defect Inspection & Automated Technician Dispatch</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-700/60 transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
              {msg.data?.photo && (
                <div className="mt-2.5 rounded-xl overflow-hidden border border-white/20 max-w-[220px]">
                  <img src={msg.data.photo} alt="Maintenance defect" className="w-full h-auto object-cover" />
                </div>
              )}
              <span className={`block mt-1 text-[9px] ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-indigo-500/50 rounded-2xl rounded-bl-none p-4 text-xs text-indigo-300 flex items-center gap-3 shadow-lg">
              <Sparkles className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
              <span>AI Inspector evaluating defect details, category & priority...</span>
            </div>
          </div>
        )}

        {/* STEP: FOLLOW-UP CLARIFICATIONS */}
        {currentStep === 'followup' && followUpQuestions.length > 0 && (
          <div className="bg-slate-800/90 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-400" />
              Technician Clarification Questions
            </span>
            <p className="text-xs text-slate-300">
              Please answer the following so our technician arrives with the right tools:
            </p>
            <div className="space-y-2.5">
              {followUpQuestions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200 block">
                    {idx + 1}. {q}
                  </label>
                  <input
                    type="text"
                    placeholder="Type details here..."
                    value={followUpAnswers[q] || ''}
                    onChange={(e) => setFollowUpAnswers({ ...followUpAnswers, [q]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleFollowUpProceed}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
            >
              Continue to Confirmation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP: CONFIRMATION & REGISTRATION CARD */}
        {currentStep === 'confirmation' && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Dispatch Confirmation Card
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Verified ({Math.round(aiConfidence * 100)}%)
              </span>
            </div>

            {submissionError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>Request Error:</strong> {submissionError}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Complaint Type</label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value as ComplaintType)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs w-full focus:outline-none focus:border-indigo-500"
                >
                  <option value="ROOM">Resident Room</option>
                  <option value="COMMON_AREA">Common Area</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Hostel</label>
                <select
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value as HostelName)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs w-full focus:outline-none focus:border-indigo-500"
                >
                  <option value="Ruby">Ruby Hostel (Boys)</option>
                  <option value="Emerald">Emerald Hostel (Girls)</option>
                  <option value="Pearl">Pearl Hostel (Senior/PG)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Room / Specific Location</label>
                <input
                  type="text"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="e.g. Room 304 or Floor 2 Washroom"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                  Category &amp; Specialization
                </label>
                <select
                  value={detectedCategory}
                  onChange={(e) => setDetectedCategory(e.target.value as ComplaintCategory)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs w-full font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="electrical">⚡ Electrical → Electrical Technician</option>
                  <option value="plumbing">🚰 Plumbing → Plumbing Technician</option>
                  <option value="water_supply">💧 Water Supply → Plumbing Technician</option>
                  <option value="bathroom">🚿 Bathroom → Plumbing Technician</option>
                  <option value="drainage">🕳️ Drainage → Plumbing Technician</option>
                  <option value="furniture">🪑 Furniture → Furniture / Carpenter</option>
                  <option value="room_maintenance">🚪 Room Maintenance → General Maintenance</option>
                  <option value="cleanliness">🧹 Cleanliness → Housekeeping Staff</option>
                  <option value="wifi_internet">📶 Wi-Fi / Internet → Network Technician</option>
                  <option value="other">🔧 Other → General Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Priority</label>
                <select
                  value={detectedPriority}
                  onChange={(e) => setDetectedPriority(e.target.value as ComplaintPriority)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs w-full uppercase font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Problem Description</label>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200">
                  {problemDescription || inputDescription || 'Maintenance request submitted via AI Chatbot.'}
                </div>
              </div>
              {photoDataUrl && (
                <div className="col-span-2">
                  <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Attached Defect Photo</label>
                  <img src={photoDataUrl} alt="Defect" className="h-24 w-auto rounded-xl border border-slate-700 object-cover" />
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (problemDescription) {
                    runAnalysis(problemDescription, photoDataUrl, photoMimeType, messages);
                  }
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Re-check
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Recording Ticket...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Confirm & Submit Maintenance Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP: SUCCESS CARD */}
        {currentStep === 'success' && createdTicket && (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Ticket #{createdTicket.id} Successfully Registered
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your complaint has been validated and recorded. Technician dispatch is initiated based on skill coverage for <strong>{createdTicket.hostel} {createdTicket.location_detail}</strong>.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                View in Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentStep('intake');
                  setPhotoDataUrl(null);
                  setInputDescription('');
                  setProblemDescription('');
                  setCreatedTicket(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Report Another Issue
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Only active during intake) */}
      {currentStep === 'intake' && (
        <div className="p-4 bg-slate-800/95 border-t border-slate-700 space-y-3">
          {submissionError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{submissionError}</span>
            </div>
          )}
          {photoDataUrl && (
            <div className="flex items-center justify-between bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <img src={photoDataUrl} alt="Thumbnail" className="w-8 h-8 rounded-lg object-cover border border-slate-600" />
                <span className="text-slate-300 truncate max-w-[200px]">Photo attached for AI verification</span>
              </div>
              <button
                onClick={() => setPhotoDataUrl(null)}
                className="text-slate-400 hover:text-rose-400 text-xs px-2 py-0.5 rounded hover:bg-slate-800"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shadow-inner"
              title="Attach or Capture Defect Photo"
            >
              <Camera className="w-5 h-5 text-indigo-400" />
            </button>
            <input
              type="text"
              value={inputDescription}
              onChange={(e) => setInputDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleSendInitial()}
              placeholder="Describe the defect (e.g. washbasin tap is leaking heavily in bathroom 304)..."
              disabled={isAnalyzing}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
            <button
              onClick={handleSendInitial}
              disabled={isAnalyzing || !inputDescription.trim()}
              className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-lg shadow-indigo-600/25 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
