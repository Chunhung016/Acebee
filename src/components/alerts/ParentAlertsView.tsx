import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ParentAlert } from '../../types';
import {
  Bell,
  Send,
  MessageCircle,
  Mail,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Megaphone,
  Layers,
  Settings,
  X,
  Phone,
  User,
} from 'lucide-react';

interface ParentAlertsViewProps {
  teacherClassId?: string;
}

export const ParentAlertsView: React.FC<ParentAlertsViewProps> = ({ teacherClassId }) => {
  const {
    parentAlerts,
    dismissParentAlert,
    updateParentAlertStatus,
    sendParentBroadcast,
    classes,
    studentDetails,
    users,
    schoolInfo,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'whatsapp' | 'email' | 'both'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'sent' | 'pending'>('all');
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);
  const [batchActionMsg, setBatchActionMsg] = useState<string | null>(null);

  // Broadcast modal state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastClassId, setBroadcastClassId] = useState<string>(teacherClassId || classes[0]?.id || '');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState<'whatsapp' | 'email' | 'both'>('both');
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Filter alerts by search, channel, status, and optionally class
  const filteredAlerts = useMemo(() => {
    return parentAlerts.filter((alert) => {
      const matchSearch =
        alert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.quizTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (alert.parentPhone && alert.parentPhone.includes(searchQuery)) ||
        (alert.parentEmail && alert.parentEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchChannel =
        selectedChannel === 'all' ||
        alert.channel === selectedChannel ||
        (selectedChannel === 'whatsapp' && alert.channel === 'both') ||
        (selectedChannel === 'email' && alert.channel === 'both');

      const matchStatus = selectedStatus === 'all' || alert.status === selectedStatus;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [parentAlerts, searchQuery, selectedChannel, selectedStatus]);

  // Metrics
  const metrics = useMemo(() => {
    const total = parentAlerts.length;
    const sent = parentAlerts.filter((a) => a.status === 'sent').length;
    const pending = parentAlerts.filter((a) => a.status === 'pending').length;
    const whatsapp = parentAlerts.filter((a) => a.channel === 'whatsapp' || a.channel === 'both').length;
    const email = parentAlerts.filter((a) => a.channel === 'email' || a.channel === 'both').length;

    return { total, sent, pending, whatsapp, email };
  }, [parentAlerts]);

  // Copy text to clipboard
  const handleCopyMessage = (alert: ParentAlert) => {
    navigator.clipboard.writeText(alert.messageText);
    setCopiedAlertId(alert.id);
    setTimeout(() => setCopiedAlertId(null), 2500);
  };

  // Launch WhatsApp Web URL
  const handleLaunchWhatsApp = (alert: ParentAlert) => {
    const rawPhone = alert.parentPhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(alert.messageText);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    updateParentAlertStatus(alert.id, 'sent');
  };

  // Launch Email mailto link
  const handleLaunchEmail = (alert: ParentAlert) => {
    const recipient = alert.parentEmail || '';
    const subject = encodeURIComponent(
      `Academic Update: ${alert.studentName} - ${alert.quizTitle} (${alert.percentage}%)`
    );
    const body = encodeURIComponent(alert.messageText);
    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;

    window.open(mailtoUrl, '_blank');
    updateParentAlertStatus(alert.id, 'sent');
  };

  // Batch dispatch all pending
  const handleBatchDispatchPending = () => {
    const pendingCount = parentAlerts.filter((a) => a.status === 'pending').length;
    if (pendingCount === 0) {
      setBatchActionMsg('All current alerts have already been marked as dispatched.');
      setTimeout(() => setBatchActionMsg(null), 3000);
      return;
    }

    parentAlerts.forEach((a) => {
      if (a.status === 'pending') {
        updateParentAlertStatus(a.id, 'sent');
      }
    });

    setBatchActionMsg(`Successfully dispatched ${pendingCount} pending WhatsApp & Email alerts.`);
    setTimeout(() => setBatchActionMsg(null), 4000);
  };

  // Send custom broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    const count = sendParentBroadcast(
      broadcastClassId,
      broadcastTitle.trim(),
      broadcastMessage.trim(),
      broadcastChannel
    );

    setBroadcastSuccess(`Broadcast successfully dispatched to ${count} parent(s) via ${broadcastChannel}!`);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => {
      setBroadcastSuccess(null);
      setIsBroadcastOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-6" id="parent-alerts-view">
      {/* Top Banner */}
      <div className="p-6 bg-linear-to-r from-emerald-900 via-teal-900 to-blue-950 rounded-2xl text-white shadow-md border border-emerald-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-100 text-xs font-mono uppercase tracking-wider">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
              Automated Parent Engagement Hub
            </div>
            <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Automated WhatsApp & Email Parent Alerts
            </h2>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Every quiz mark release and gradebook update generates an official WhatsApp & Email notification formatted for immediate delivery to linked parents and guardians.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Megaphone className="w-4 h-4 text-emerald-700" />
              <span>Broadcast Notice</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDispatchPending}
              className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/50 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Pending</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 relative z-10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 font-bold uppercase text-[10px] tracking-wider">
                Total Alerts
              </span>
              <Bell className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{metrics.total}</div>
            <p className="text-[11px] text-emerald-200 mt-0.5">Automated logs recorded</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 font-bold uppercase text-[10px] tracking-wider">
                Sent / Delivered
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{metrics.sent}</div>
            <p className="text-[11px] text-emerald-200 mt-0.5">Dispatched to parents</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200 font-bold uppercase text-[10px] tracking-wider">
                WhatsApp Channel
              </span>
              <MessageCircle className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{metrics.whatsapp}</div>
            <p className="text-[11px] text-emerald-200 mt-0.5">Direct chat payloads</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-blue-200 font-bold uppercase text-[10px] tracking-wider">
                Email Channel
              </span>
              <Mail className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{metrics.email}</div>
            <p className="text-[11px] text-blue-200 mt-0.5">Formal report cards</p>
          </div>
        </div>
      </div>

      {batchActionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{batchActionMsg}</span>
        </div>
      )}

      {/* Rules & Policies Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Active Automated Alert Policies</h4>
            <p className="text-slate-500">
              Auto-triggers WhatsApp message and Email upon teacher release of quiz scores
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Quiz Release: Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Parent Portal Sync: Realtime</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, parent, phone, email, or quiz..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 shrink-0">Channel:</span>
            {(['all', 'whatsapp', 'email', 'both'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setSelectedChannel(ch)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  selectedChannel === ch
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 shrink-0">Status:</span>
            {(['all', 'sent', 'pending'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  selectedStatus === st
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
          <MessageCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No Parent Alerts Found</h3>
          <p className="text-xs">
            {parentAlerts.length === 0
              ? 'When teachers mark and release quizzes in the Manual Grading or Batch Release tabs, automated WhatsApp and Email alerts will appear here.'
              : 'Try clearing your search query or filter to view more alerts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isCopied = copiedAlertId === alert.id;
            const hasPhone = Boolean(alert.parentPhone && alert.parentPhone.trim());
            const hasEmail = Boolean(alert.parentEmail && alert.parentEmail.trim());

            return (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs space-y-3 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          alert.channel === 'whatsapp'
                            ? 'bg-emerald-100 text-emerald-800'
                            : alert.channel === 'email'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {alert.channel === 'whatsapp' ? (
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                        ) : alert.channel === 'email' ? (
                          <Mail className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Layers className="w-3 h-3 text-purple-600" />
                        )}
                        <span>{alert.channel}</span>
                      </span>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          alert.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {alert.status === 'sent' ? 'Dispatched' : 'Pending'}
                      </span>

                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(alert.sentAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        Student: {alert.studentName}
                      </h4>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600">
                        Parent: <strong className="text-slate-800">{alert.parentName}</strong>
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-blue-900">
                        {alert.quizTitle} ({alert.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLaunchWhatsApp(alert)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Open WhatsApp Web pre-filled with this student's report"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Web</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchEmail(alert)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Open email draft with full grade summary"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(alert)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors"
                      title="Copy alert message text"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => dismissParentAlert(alert.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 text-xs transition-colors"
                      title="Dismiss alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Recipient Details Bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Parent Phone: <strong className="text-slate-800">{alert.parentPhone || 'Not provided'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Parent Email: <strong className="text-slate-800">{alert.parentEmail || 'Not provided'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] text-slate-500">Score Achieved:</span>
                    <span className="font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {alert.score} / {alert.totalPoints} ({alert.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Message preview body */}
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800">
                  {alert.messageText}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BROADCAST NOTICE MODAL */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Send Instant Parent Broadcast</h3>
                  <p className="text-[11px] text-slate-500">
                    Dispatches synchronized WhatsApp & Email notices to all parents in a class
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {broadcastSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Class *</label>
                <select
                  value={broadcastClassId}
                  onChange={(e) => setBroadcastClassId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Tomorrow's Science Quiz & Required Materials"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Channels *</label>
                <div className="flex gap-4">
                  {(['both', 'whatsapp', 'email'] as const).map((ch) => (
                    <label key={ch} className="flex items-center gap-1.5 cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="channel"
                        checked={broadcastChannel === ch}
                        onChange={() => setBroadcastChannel(ch)}
                        className="text-emerald-600"
                      />
                      <span>{ch === 'both' ? 'WhatsApp & Email' : ch}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Content *</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Draft your detailed message here. The school's official header and student name will be automatically populated..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
