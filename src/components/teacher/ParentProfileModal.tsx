import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommentCategory } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  X,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  MessageCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Calendar,
  Award,
  BookOpen,
  User,
  HeartHandshake,
  ExternalLink,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface ParentProfileModalProps {
  studentId: string | null;
  quizContext?: {
    quizId: string;
    quizTitle: string;
    subject: string;
    score?: number;
    totalPoints?: number;
    percentage?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ParentProfileModal: React.FC<ParentProfileModalProps> = ({
  studentId,
  quizContext,
  isOpen,
  onClose,
}) => {
  const {
    users,
    studentDetails,
    classes,
    quizzes,
    quizResults,
    teacherComments,
    parentAlerts,
    postTeacherComment,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'compose'>('profile');
  const [commentCategory, setCommentCategory] = useState<CommentCategory>('positive');
  const [commentText, setCommentText] = useState(
    quizContext?.percentage !== undefined
      ? `Dear Parent, regarding the recent ${quizContext.subject} quiz ("${quizContext.quizTitle}"), your child achieved ${quizContext.score}/${quizContext.totalPoints} (${quizContext.percentage}%). `
      : ''
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !studentId) return null;

  const studentUser = users.find((u) => u.id === studentId);
  const detail = studentDetails.find((d) => d.studentId === studentId);
  const studentClass = classes.find((c) => c.id === detail?.classId);

  // Identify parent user
  const parentUser = users.find(
    (u) =>
      u.id === detail?.parentId ||
      (detail?.parentEmail && u.email?.toLowerCase() === detail.parentEmail.toLowerCase())
  );

  const parentName = detail?.parentName || parentUser?.fullName || 'Parent / Guardian';
  const parentPhone = detail?.parentPhone || parentUser?.phoneNumber || '';
  const parentEmail = detail?.parentEmail || parentUser?.email || '';
  const residentialAddress = detail?.address || 'Address pending on record';
  const emergencyContact = detail?.emergencyContact || 'Not specified';

  // Find all children linked to this parent
  const linkedChildren = studentDetails.filter(
    (d) =>
      (detail?.parentId && d.parentId === detail.parentId) ||
      (detail?.parentPhone && d.parentPhone === detail.parentPhone) ||
      d.studentId === studentId
  );

  // Student's recent results
  const studentResults = quizResults
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const averagePercentage =
    studentResults.length > 0
      ? (
          studentResults.reduce((acc, r) => acc + r.percentage, 0) / studentResults.length
        ).toFixed(1)
      : 'N/A';

  // Comments sent to this parent/student
  const studentComments = teacherComments
    .filter((c) => c.studentId === studentId || (detail?.parentId && c.parentId === detail.parentId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Alerts sent to this parent
  const studentAlerts = parentAlerts
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  // WhatsApp click-to-chat URL
  const cleanDigits = parentPhone.replace(/[^\d+]/g, '');
  const waPhone = cleanDigits.startsWith('+')
    ? cleanDigits.replace('+', '')
    : cleanDigits.length === 10
    ? `1${cleanDigits}`
    : cleanDigits;

  const defaultWaText = quizContext?.quizTitle
    ? `Hello ${parentName}, this is ${currentUser?.fullName || 'the teacher'} from ACEBEE Academy regarding ${studentUser?.fullName}'s progress in ${quizContext.subject} (${quizContext.quizTitle}). Score: ${quizContext.score}/${quizContext.totalPoints} (${quizContext.percentage}%).`
    : `Hello ${parentName}, this is ${currentUser?.fullName || 'the teacher'} from ACEBEE Academy regarding ${studentUser?.fullName}.`;

  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(defaultWaText)}`;
  const mailUrl = `mailto:${parentEmail}?subject=${encodeURIComponent(
    `ACEBEE Academy - Academic Progress for ${studentUser?.fullName || 'Student'}`
  )}&body=${encodeURIComponent(defaultWaText)}`;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSending(true);
    try {
      postTeacherComment({
        studentId: studentId,
        parentId: detail?.parentId || parentUser?.id || 'user-parent-1',
        category: commentCategory,
        comment: commentText.trim(),
      });

      setSendSuccessMsg('Academic note successfully dispatched to parent dashboard!');
      setTimeout(() => {
        setSendSuccessMsg(null);
        setCommentText('');
        setActiveTab('history');
      }, 1500);
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryPill = (cat: CommentCategory) => {
    switch (cat) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'improvement':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'achievement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-lg shrink-0">
              {parentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-tight">{parentName}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Parent / Legal Guardian
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Linked Student: <strong className="text-white">{studentUser?.fullName}</strong> ({studentClass?.name || 'Class'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close parent profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Contact Action Bar */}
        <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            {parentPhone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Parent</span>
              </a>
            )}

            {parentPhone && (
              <a
                href={`tel:${parentPhone}`}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>{parentPhone}</span>
              </a>
            )}

            {parentEmail && (
              <a
                href={mailUrl}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>{parentEmail}</span>
              </a>
            )}
          </div>

          {/* Quick Context Pill */}
          {quizContext && (
            <div className="text-[11px] font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {quizContext.quizTitle}:{' '}
                <strong className="text-slate-900">
                  {quizContext.score}/{quizContext.totalPoints} ({quizContext.percentage}%)
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 flex items-center gap-2 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Parent Profile & Contact</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Communication History ({studentComments.length + studentAlerts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'compose'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>Send Direct Note</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: PARENT PROFILE & CONTACT DETAILS */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-600" /> Primary Phone
                  </span>
                  <p className="text-sm font-bold text-slate-900">{parentPhone || 'Not provided'}</p>
                  <p className="text-[11px] text-slate-500">Verified for SMS & WhatsApp notifications</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-600" /> Email Address
                  </span>
                  <p className="text-sm font-bold text-slate-900">{parentEmail || 'Not provided'}</p>
                  <p className="text-[11px] text-slate-500">Registered on Parent Portal</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600" /> Residential Address
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">{residentialAddress}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" /> Emergency Contact
                  </span>
                  <p className="text-xs font-semibold text-slate-800">{emergencyContact}</p>
                  <p className="text-[11px] text-slate-500">Secondary contact in case of emergency</p>
                </div>
              </div>

              {/* Linked Children Enrolled in Academy */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-blue-600" />
                  <span>Linked Enrolled Children ({linkedChildren.length})</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkedChildren.map((ch) => {
                    const chUser = users.find((u) => u.id === ch.studentId);
                    const chClass = classes.find((c) => c.id === ch.classId);
                    const chResults = quizResults.filter((r) => r.studentId === ch.studentId);
                    const chAvg =
                      chResults.length > 0
                        ? (chResults.reduce((a, r) => a + r.percentage, 0) / chResults.length).toFixed(1)
                        : 'N/A';

                    return (
                      <div
                        key={ch.id}
                        className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar name={chUser?.fullName} role="student" size="sm" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{chUser?.fullName}</div>
                            <div className="text-[11px] text-slate-500">{chClass?.name || 'Class'}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Avg Score</span>
                          <span className="text-xs font-bold text-blue-700">
                            {chAvg !== 'N/A' ? `${chAvg}%` : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Quiz Performance of Primary Student */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Recent Academic Performance ({studentUser?.fullName})</span>
                  </span>
                  <span className="text-xs font-bold text-blue-700">
                    Overall GPA: {averagePercentage !== 'N/A' ? `${averagePercentage}%` : 'Pending'}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {studentResults.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No completed quizzes on record yet.
                    </div>
                  ) : (
                    studentResults.slice(0, 5).map((res) => {
                      const qz = quizzes.find((q) => q.id === res.quizId);
                      return (
                        <div
                          key={res.id}
                          className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {qz?.title || 'Subject Quiz'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {qz?.subject} • Completed {new Date(res.completedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-xs border ${
                                res.percentage >= 80
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : res.percentage >= 60
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {res.score}/{res.totalPoints} ({res.percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMMUNICATION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Showing private teacher notes and automated parent alerts for this household
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>New Note</span>
                </button>
              </div>

              {studentComments.length === 0 && studentAlerts.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">No prior communications recorded</p>
                  <p className="text-[11px] text-slate-400">
                    Use the 'Send Direct Note' tab to send praise or feedback to this parent.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {/* Behavioral Comments */}
                  {studentComments.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryPill(
                              comm.category
                            )}`}
                          >
                            {comm.category} Note
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-semibold ${
                            comm.isRead ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {comm.isRead ? '✓ Read by Parent' : '○ Pending Parent Review'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">{comm.comment}</p>
                    </div>
                  ))}

                  {/* Automated Parent Alerts */}
                  {studentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                          Quiz Result Alert • {alert.subject}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700">
                          Score: {alert.score}/{alert.totalPoints} ({alert.percentage}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">{alert.messageText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPOSE NOTE */}
          {activeTab === 'compose' && (
            <form onSubmit={handleSendComment} className="space-y-4">
              {sendSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{sendSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Classification
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['positive', 'improvement', 'achievement', 'general'] as CommentCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCommentCategory(cat)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                          commentCategory === cat
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Quick Template Starters */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Quick Starters:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    `Demonstrated excellent understanding during today's assessment.`,
                    `Has made noticeable improvement in problem-solving and attentiveness.`,
                    `Recommend practicing foundational practice drills over the weekend.`,
                    `Outstanding dedication and participation in class discussions.`,
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCommentText((prev) => (prev ? `${prev} ${tpl}` : tpl))}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] border border-slate-200 transition-colors text-left"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Content (Delivered Privately to Parent Dashboard)
                </label>
                <textarea
                  rows={4}
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write clear, constructive feedback or commendations for the parents..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Parent will receive this notice upon their next login
                </span>

                <button
                  type="submit"
                  disabled={isSending || !commentText.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Dispatch Note to Parent'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Student ID: {studentId}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
