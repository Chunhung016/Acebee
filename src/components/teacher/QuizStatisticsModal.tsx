import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Quiz, QuizResult, QuizQuestion, CommentCategory } from '../../types';
import { MathText } from '../common/MathRenderer';
import { UserAvatar } from '../common/UserAvatar';
import {
  X,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  MessageCircle,
  Phone,
  Mail,
  Copy,
  BarChart3,
  TrendingUp,
  Search,
  Filter,
  Check,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Send,
  HelpCircle,
  UserCheck,
  AlertTriangle,
  FileCheck,
  ExternalLink,
} from 'lucide-react';

interface QuizStatisticsModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onReuseQuiz: (quiz: Quiz, cloneSettings?: boolean) => void;
  onOpenParentProfile: (
    studentId: string,
    quizContext?: {
      quizId: string;
      quizTitle: string;
      subject: string;
      score?: number;
      totalPoints?: number;
      percentage?: number;
    }
  ) => void;
}

export const QuizStatisticsModal: React.FC<QuizStatisticsModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onReuseQuiz,
  onOpenParentProfile,
}) => {
  const {
    users,
    classes,
    studentDetails,
    quizResults,
    updateQuizResult,
    postTeacherComment,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roster' | 'itemAnalysis' | 'distribution'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'pending' | 'unsubmitted'>('all');

  // Comment state for inline feedback on student submission
  const [activeCommentStudentId, setActiveCommentStudentId] = useState<string | null>(null);
  const [teacherFeedbackText, setTeacherFeedbackText] = useState('');
  const [sendToParent, setSendToParent] = useState(true);
  const [parentCommentCategory, setParentCommentCategory] = useState<CommentCategory>('positive');
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !quiz) return null;

  // Determine target classes assigned to this quiz
  const assignedClassIds = quiz.assignedClassIds && quiz.assignedClassIds.length > 0
    ? quiz.assignedClassIds
    : [quiz.classId];

  // Students belonging to assigned classes
  const assignedStudents = studentDetails
    .filter((d) => assignedClassIds.includes(d.classId))
    .map((d) => {
      const u = users.find((usr) => usr.id === d.studentId);
      return {
        detail: d,
        user: u,
      };
    })
    .filter((item) => Boolean(item.user));

  // Submissions for this quiz
  const submissionsForQuiz = quizResults.filter((r) => r.quizId === quiz.id);

  // Determine ongoing vs previous/completed
  const isPastDue = quiz.dueDate ? new Date(quiz.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) : false;
  const totalAssignedCount = assignedStudents.length;
  const totalSubmittedCount = submissionsForQuiz.length;
  const submissionRate = totalAssignedCount > 0 ? Math.round((totalSubmittedCount / totalAssignedCount) * 100) : 0;

  // Calculate scores & averages
  const scores = submissionsForQuiz
    .map((r) => (typeof r.percentage === 'number' ? r.percentage : 0))
    .filter((s) => !isNaN(s));
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const passCount = scores.filter((s) => s >= 50).length;
  const passRate = scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0;
  const pendingReviewCount = submissionsForQuiz.filter(
    (r) => r.status === 'pending_review' || (r.status as string) === 'awaiting_review'
  ).length;

  const questionsList = quiz.questions || [];
  const totalPoints = questionsList.reduce((sum, q) => sum + (q?.points || 1), 0);

  // Grade bands
  const distinctionCount = scores.filter((s) => s >= 80).length;
  const meritCount = scores.filter((s) => s >= 65 && s < 80).length;
  const passGradeCount = scores.filter((s) => s >= 50 && s < 65).length;
  const supportCount = scores.filter((s) => s < 50).length;

  // Filter students roster
  const filteredStudents = assignedStudents.filter(({ user }) => {
    if (!user) return false;
    const nameMatch =
      (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const result = submissionsForQuiz.find((r) => r.studentId === user.id);
    if (!nameMatch) return false;

    const isPending = result && (result.status === 'pending_review' || (result.status as string) === 'awaiting_review');
    if (statusFilter === 'graded') return result && !isPending;
    if (statusFilter === 'pending') return isPending;
    if (statusFilter === 'unsubmitted') return !result;
    return true;
  });

  // Question-by-question Item Analysis
  const itemAnalysis = questionsList.map((q, idx) => {
    let correctAnswersCount = 0;
    let attemptedCount = 0;
    const optionCounts: Record<number, number> = {};

    submissionsForQuiz.forEach((sub) => {
      const ansRec = sub.answers?.find((a) => a.questionId === q.id);
      if (ansRec) {
        attemptedCount++;
        if (ansRec.isCorrect || (ansRec.pointsAwarded && ansRec.pointsAwarded >= (q.points || 1))) {
          correctAnswersCount++;
        }
        const optIndex = typeof ansRec.selectedOption === 'number' ? ansRec.selectedOption : ansRec.selectedOptionIndex;
        if (typeof optIndex === 'number') {
          optionCounts[optIndex] = (optionCounts[optIndex] || 0) + 1;
        }
      }
    });

    const successRate = attemptedCount > 0 ? Math.round((correctAnswersCount / attemptedCount) * 100) : 0;

    return {
      index: idx + 1,
      question: q,
      attemptedCount,
      correctAnswersCount,
      successRate,
      optionCounts,
    };
  });

  // Handle saving teacher comment & parent note
  const handleSaveStudentFeedback = async (studentId: string, resultId?: string) => {
    if (!teacherFeedbackText.trim()) return;
    setCommentSaving(true);
    try {
      // 1. Update the quiz result if exists
      if (resultId) {
        await updateQuizResult(resultId, {
          teacherFeedback: teacherFeedbackText.trim(),
        });
      }

      // 2. If sendToParent is true, dispatch a teacher comment to the parent dashboard
      if (sendToParent) {
        const det = studentDetails.find((d) => d.studentId === studentId);
        postTeacherComment({
          studentId: studentId,
          parentId: det?.parentId || 'user-parent-1',
          category: parentCommentCategory,
          comment: `Feedback on ${quiz.subject} Quiz ("${quiz.title}"): ${teacherFeedbackText.trim()}`,
        });
      }

      setCommentSuccessMsg('Feedback saved and delivered successfully!');
      setTimeout(() => {
        setCommentSuccessMsg(null);
        setActiveCommentStudentId(null);
        setTeacherFeedbackText('');
      }, 1400);
    } catch (e) {
      console.error('Error saving feedback:', e);
    } finally {
      setCommentSaving(false);
    }
  };

  const getScoreBadge = (pct?: number) => {
    if (pct === undefined) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          Not Submitted
        </span>
      );
    }
    if (pct >= 80) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {pct}% • Distinction
        </span>
      );
    }
    if (pct >= 65) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          {pct}% • Merit
        </span>
      );
    }
    if (pct >= 50) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          {pct}% • Pass
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
        {pct}% • Needs Support
      </span>
    );
  };

  const targetClass = classes.find((c) => c.id === quiz.classId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {quiz.subject}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {targetClass?.name || 'Class Roster'}
              </span>
              {isPastDue ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                  Completed / Past Due
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ongoing Quiz
                </span>
              )}
              <span className="text-[10px] text-slate-400">
                Due: {new Date(quiz.dueDate).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-xs text-slate-300 line-clamp-1">{quiz.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Re-use question set action right in header */}
            <button
              type="button"
              onClick={() => onReuseQuiz(quiz)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Re-use this quiz's question set in the Quiz Creator"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Re-use Question Set</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Key Metrics Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-200 border-b border-slate-200 bg-slate-50/70 text-center shrink-0">
          <div className="p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-blue-600" /> Submissions
            </span>
            <div className="text-base font-extrabold text-slate-900">
              {totalSubmittedCount} / {totalAssignedCount}
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">{submissionRate}% Turnout</span>
          </div>

          <div className="p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <BarChart3 className="w-3 h-3 text-blue-600" /> Class Average
            </span>
            <div className="text-base font-extrabold text-blue-900">{averageScore}%</div>
            <span className="text-[10px] text-slate-500 font-semibold">
              {totalPoints > 0 ? `${Math.round((averageScore / 100) * totalPoints * 10) / 10} / ${totalPoints} pts` : ''}
            </span>
          </div>

          <div className="p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Award className="w-3 h-3 text-emerald-600" /> High / Low
            </span>
            <div className="text-base font-extrabold text-slate-900">
              {highestScore}% <span className="text-slate-400 font-normal">/</span> {lowestScore}%
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">Score Span</span>
          </div>

          <div className="p-3.5 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pass Rate
            </span>
            <div className="text-base font-extrabold text-emerald-700">{passRate}%</div>
            <span className="text-[10px] text-slate-500 font-semibold">{passCount} Passing</span>
          </div>

          <div className="p-3.5 space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" /> Pending Review
            </span>
            <div className="text-base font-extrabold text-amber-700">{pendingReviewCount}</div>
            <span className="text-[10px] text-slate-500 font-semibold">
              {quiz.markingMode === 'manual' ? 'Manual Marking' : 'Auto-Graded'}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 flex items-center gap-2 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Scores & Comments ({assignedStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('itemAnalysis')}
            className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'itemAnalysis'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Question-by-Question Item Analysis ({quiz.questions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('distribution')}
            className={`py-3 px-3 border-b-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'distribution'
                ? 'border-blue-600 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Mastery Bands & Distribution</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: STUDENT ROSTER & GIVING COMMENTS & PARENT LINK */}
          {activeTab === 'roster' && (
            <div className="space-y-3">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student by name or email..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  {(['all', 'graded', 'pending', 'unsubmitted'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                        statusFilter === st
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-2.5">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No students matching filter.
                  </div>
                ) : (
                  filteredStudents.map(({ user, detail }) => {
                    if (!user) return null;
                    const result = submissionsForQuiz.find((r) => r.studentId === user.id);
                    const isCommenting = activeCommentStudentId === user.id;

                    return (
                      <div
                        key={user.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Student Info */}
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.fullName} role="student" size="sm" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {user.fullName}
                                </span>
                                {result?.attemptNumber && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    Attempt #{result.attemptNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">{user.email}</span>
                            </div>
                          </div>

                          {/* Score and Status Badges */}
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {result ? (
                              <div className="text-right">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">
                                    {result.score} / {result.totalPoints} pts
                                  </span>
                                  {getScoreBadge(result.percentage)}
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Submitted {new Date(result.completedAt).toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Not Yet Submitted
                              </span>
                            )}

                            {/* Action Buttons: Give Comment & Parent Profile */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCommenting) {
                                    setActiveCommentStudentId(null);
                                  } else {
                                    setActiveCommentStudentId(user.id);
                                    setTeacherFeedbackText(result?.teacherFeedback || '');
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                  isCommenting
                                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                <span>{isCommenting ? 'Close' : 'Give Comment'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  onOpenParentProfile(user.id, {
                                    quizId: quiz.id,
                                    quizTitle: quiz.title,
                                    subject: quiz.subject,
                                    score: result?.score,
                                    totalPoints: result?.totalPoints || totalPoints,
                                    percentage: result?.percentage,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title={`View parent details for ${detail.parentName || 'Parent'}`}
                              >
                                <Users className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">Parent Profile:</span>
                                <span className="font-bold text-slate-900 truncate max-w-[110px]">
                                  {detail.parentName || 'Parent'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Existing Feedback preview if already written and not editing */}
                        {!isCommenting && result?.teacherFeedback && (
                          <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-slate-700 flex items-start gap-2">
                            <MessageCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-blue-900 block text-[11px]">
                                Logged Teacher Feedback:
                              </span>
                              <span>{result.teacherFeedback}</span>
                            </div>
                          </div>
                        )}

                        {/* Inline Expandable Comment Composer */}
                        {isCommenting && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-blue-200 space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                Write Feedback for {user.fullName}
                              </span>

                              {commentSuccessMsg && (
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {commentSuccessMsg}
                                </span>
                              )}
                            </div>

                            <textarea
                              rows={3}
                              value={teacherFeedbackText}
                              onChange={(e) => setTeacherFeedbackText(e.target.value)}
                              placeholder={`E.g., Great work on the calculation steps! Review question 3 on decimal conversion.`}
                              className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            />

                            {/* Option to send directly as behavioral/academic note to parent */}
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-2">
                              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={sendToParent}
                                  onChange={(e) => setSendToParent(e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                <span>
                                  Also post as private Behavioral / Academic Note to{' '}
                                  <strong className="text-blue-900">{detail.parentName || 'Parent'}</strong>
                                </span>
                              </label>

                              {sendToParent && (
                                <div className="flex items-center gap-2 pl-6">
                                  <span className="text-[11px] text-slate-500 font-medium">Category:</span>
                                  {(['positive', 'improvement', 'achievement', 'general'] as CommentCategory[]).map(
                                    (cat) => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setParentCommentCategory(cat)}
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize border ${
                                          parentCommentCategory === cat
                                            ? 'bg-blue-900 text-white border-blue-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        {cat}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveCommentStudentId(null)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                disabled={commentSaving || !teacherFeedbackText.trim()}
                                onClick={() => handleSaveStudentFeedback(user.id, result?.id)}
                                className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{commentSaving ? 'Saving...' : 'Save & Dispatch'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUESTION-BY-QUESTION ITEM ANALYSIS */}
          {activeTab === 'itemAnalysis' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between text-xs text-blue-950">
                <span className="font-semibold">
                  Item analysis identifies questions with low success rates so you can target review sessions or weakness practice drills.
                </span>
                <span className="font-bold shrink-0">{quiz.questions.length} Items Evaluated</span>
              </div>

              <div className="space-y-3">
                {itemAnalysis.map((item) => {
                  const q = item.question;
                  const isLowSuccess = item.attemptedCount > 0 && item.successRate < 50;
                  const isHighSuccess = item.attemptedCount > 0 && item.successRate >= 80;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border bg-white space-y-3 transition-all ${
                        isLowSuccess
                          ? 'border-amber-300 shadow-2xs'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            Q{item.index}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {q.type || 'mcq'}
                          </span>
                          <span className="text-xs font-bold text-blue-700">
                            {q.points || 1} pt(s)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isLowSuccess && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Weakness Area
                            </span>
                          )}

                          {isHighSuccess && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              High Mastery
                            </span>
                          )}

                          <span className="text-xs font-extrabold text-slate-900">
                            {item.successRate}% Success ({item.correctAnswersCount}/{item.attemptedCount} correct)
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-xs font-semibold text-slate-900 leading-relaxed pl-8">
                        <MathText text={q.question} />
                      </div>

                      {/* MCQ Option Breakdown */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const count = item.optionCounts[oIdx] || 0;
                            const optPct = item.attemptedCount > 0 ? Math.round((count / item.attemptedCount) * 100) : 0;
                            const isCorrect = oIdx === q.correctAnswerIndex;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold opacity-75">{String.fromCharCode(65 + oIdx)}.</span>
                                  <span className="truncate"><MathText text={opt} /></span>
                                  {isCorrect && (
                                    <span className="text-[10px] uppercase font-bold text-emerald-700 ml-1">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-semibold shrink-0 text-slate-500">
                                  {count} ({optPct}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Model answer or guidelines if structure */}
                      {q.modelAnswer && (
                        <div className="pl-8 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-800 block text-[11px] uppercase">
                            Model Answer & Rubric:
                          </span>
                          <p>{q.modelAnswer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SCORE DISTRIBUTION & BANDS */}
          {activeTab === 'distribution' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Cohort Mastery Distribution
                </h4>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Distinction (80% - 100%)
                      </span>
                      <span className="font-bold text-slate-900">
                        {distinctionCount} students ({totalSubmittedCount > 0 ? Math.round((distinctionCount / totalSubmittedCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${totalSubmittedCount > 0 ? (distinctionCount / totalSubmittedCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-blue-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Merit (65% - 79%)
                      </span>
                      <span className="font-bold text-slate-900">
                        {meritCount} students ({totalSubmittedCount > 0 ? Math.round((meritCount / totalSubmittedCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${totalSubmittedCount > 0 ? (meritCount / totalSubmittedCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-amber-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Pass (50% - 64%)
                      </span>
                      <span className="font-bold text-slate-900">
                        {passGradeCount} students ({totalSubmittedCount > 0 ? Math.round((passGradeCount / totalSubmittedCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${totalSubmittedCount > 0 ? (passGradeCount / totalSubmittedCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-rose-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        Needs Remediation (&lt; 50%)
                      </span>
                      <span className="font-bold text-slate-900">
                        {supportCount} students ({totalSubmittedCount > 0 ? Math.round((supportCount / totalSubmittedCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{
                          width: `${totalSubmittedCount > 0 ? (supportCount / totalSubmittedCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Suggestion */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">Targeted Intervention Recommendation</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {supportCount > 0
                      ? `${supportCount} student(s) would benefit from personalized remediation drills on this quiz topic.`
                      : 'Excellent cohort performance! All students achieved 50% or higher.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onReuseQuiz(quiz)}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Clone Quiz for Practice Retake</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Quiz ID: <code className="text-slate-700">{quiz.id}</code>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReuseQuiz(quiz)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Re-use Question Set</span>
            </button>

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
    </div>
  );
};
