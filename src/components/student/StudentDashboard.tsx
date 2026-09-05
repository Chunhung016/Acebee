import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Quiz } from '../../types';
import { QuizTakerModal } from './QuizTakerModal';
import { UserAvatar } from '../common/UserAvatar';
import { StudentWeakAreaDiagnostics } from './StudentWeakAreaDiagnostics';
import {
  Award,
  BookOpen,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  TrendingUp,
  User,
  Phone,
  Mail,
  Medal,
  Calendar,
  Brain,
  Menu,
  X,
  ChevronRight,
  RefreshCw,
  Filter,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    studentDetails,
    classes,
    users,
    quizzes,
    quizResults,
    supabaseSyncInfo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quizzes' | 'diagnostics' | 'leaderboard' | 'grades' | 'teacher'>('quizzes');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeQuizForTaking, setActiveQuizForTaking] = useState<Quiz | null>(null);

  // Filter controls for Quizzes view - defaults to 'all' so every published quiz is instantly visible
  const [scopeFilter, setScopeFilter] = useState<'assigned' | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Auto-sync with Firestore whenever student enters dashboard to guarantee newest quizzes are loaded
  useEffect(() => {
    supabaseSyncInfo.syncWithSupabase().catch(() => {});
  }, []);

  // Find student's detail and assigned class
  const studentDetail = studentDetails.find((d) => d.studentId === currentUser?.id);
  const studentClass =
    classes.find((c) => c.id === studentDetail?.classId) ||
    classes.find((c) => c.gradeLevel === 'Year 5') ||
    classes[0];
  const teacherUser = users.find((u) => u.id === studentClass?.teacherId);

  // Robust Quiz Assignment Matcher
  // Ensures published quizzes appear whether matched by classId, assignedClassIds, gradeLevel, teacher, or all-school
  const isDirectlyAssignedQuiz = (q: Quiz): boolean => {
    // 1. Quizzes explicitly tagged for all cohorts or unassigned
    if (!q.classId || q.classId === 'all' || q.assignedClassIds?.includes('all')) {
      return true;
    }
    // 2. Direct match with student's assigned class ID
    if (studentClass && (q.classId === studentClass.id || q.assignedClassIds?.includes(studentClass.id))) {
      return true;
    }
    // 3. Direct match with studentDetail record class ID
    if (studentDetail?.classId && (q.classId === studentDetail.classId || q.assignedClassIds?.includes(studentDetail.classId))) {
      return true;
    }
    // 4. Grade level match (e.g. Year 5)
    const quizClass = classes.find((c) => c.id === q.classId);
    if (
      quizClass?.gradeLevel &&
      studentClass?.gradeLevel &&
      quizClass.gradeLevel.toLowerCase() === studentClass.gradeLevel.toLowerCase()
    ) {
      return true;
    }
    // 5. Homeroom teacher match
    if (teacherUser && q.teacherId === teacherUser.id) {
      return true;
    }
    return false;
  };

  // Quizzes directly matching student's cohort
  const directAssignedQuizzes = useMemo(() => {
    return quizzes.filter(isDirectlyAssignedQuiz);
  }, [quizzes, studentClass, studentDetail, classes, teacherUser]);

  // Quizzes based on active filters, sorted with newest published assessments first
  const displayedQuizzes = useMemo(() => {
    let list = quizzes;
    if (scopeFilter === 'assigned') {
      list = directAssignedQuizzes.length > 0 ? directAssignedQuizzes : quizzes;
    }
    if (subjectFilter !== 'all') {
      list = list.filter((q) => q.subject === subjectFilter);
    }
    return [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [quizzes, scopeFilter, subjectFilter, directAssignedQuizzes]);

  // Student's results
  const myResults = quizResults.filter((r) => r.studentId === currentUser?.id);
  const completedQuizIds = new Set(myResults.map((r) => r.quizId));

  const pendingQuizzes = displayedQuizzes.filter((q) => !completedQuizIds.has(q.id));
  const completedQuizzes = displayedQuizzes.filter((q) => completedQuizIds.has(q.id));

  // Compute Class Leaderboard
  const classStudentDetails = studentDetails.filter((d) => d.classId === studentClass?.id);
  const leaderboardData = useMemo(() => {
    return classStudentDetails
      .map((det) => {
        const student = users.find((u) => u.id === det.studentId);
        const results = quizResults.filter((r) => r.studentId === det.studentId);
        const totalQuizzes = results.length;
        const totalScore = results.reduce((acc, r) => acc + r.score, 0);
        const maxScore = results.reduce((acc, r) => acc + r.totalPoints, 0);
        const avgPercentage =
          totalQuizzes > 0
            ? Number((results.reduce((acc, r) => acc + r.percentage, 0) / totalQuizzes).toFixed(1))
            : 0;

        return {
          studentId: det.studentId,
          name: student?.fullName || 'Student',
          email: student?.email || '',
          avatarUrl: student?.avatarUrl,
          totalQuizzes,
          totalScore,
          maxScore,
          avgPercentage,
        };
      })
      .sort((a, b) => b.avgPercentage - a.avgPercentage || b.totalScore - a.totalScore);
  }, [classStudentDetails, users, quizResults]);

  // Overall GPA / Average calculation for this student
  const overallAverage =
    myResults.length > 0
      ? (
          myResults.reduce((acc, r) => acc + r.percentage, 0) / myResults.length
        ).toFixed(1)
      : '0.0';

  const fiveSubjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Art & Technology'] as const;

  interface StudentNavItem {
    id: 'quizzes' | 'diagnostics' | 'leaderboard' | 'grades' | 'teacher';
    label: string;
    icon: React.ElementType;
    count?: number;
    highlight?: boolean;
  }

  const studentNavItems: StudentNavItem[] = [
    { id: 'quizzes', label: 'Subject Quizzes', icon: BookOpen, count: pendingQuizzes.length > 0 ? pendingQuizzes.length : undefined, highlight: pendingQuizzes.length > 0 },
    { id: 'diagnostics', label: 'Weak Area Diagnostics', icon: Brain },
    { id: 'leaderboard', label: `Class Leaderboard (${leaderboardData.length})`, icon: Trophy },
    { id: 'grades', label: 'Mastery & Grades', icon: TrendingUp },
    { id: 'teacher', label: 'Homeroom Teacher', icon: User },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-100/70">
      {/* Mobile Sidebar Header & Toggle */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-16 z-30">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={currentUser?.fullName} role="student" size="sm" />
          <div>
            <div className="font-bold text-xs text-white">{currentUser?.fullName}</div>
            <div className="text-[10px] text-slate-400">{studentClass?.name || 'ACEBEE Student'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* LMS Vertical Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 z-40 w-64 xl:w-72 bg-slate-900 text-slate-300 flex flex-col justify-between
          h-[calc(100vh-4rem)] border-r border-slate-800/80 transition-transform duration-200 ease-in-out shrink-0
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Student Profile Card */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={currentUser?.fullName} role="student" size="md" />
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-blue-400 font-semibold tracking-wider">
                  <Award className="w-3 h-3 text-blue-400" />
                  Student Portal
                </div>
                <h2 className="text-xs font-bold text-white truncate">{currentUser?.fullName}</h2>
                <div className="text-[11px] text-slate-400 truncate">{studentClass?.name}</div>
              </div>
            </div>

            {/* Academic GPA badge */}
            <div className="p-2.5 rounded-lg bg-blue-950/70 border border-blue-800/60 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-blue-200">Academic Average</span>
              <div className="flex items-center gap-1 text-sm font-extrabold text-white">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{overallAverage}%</span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 py-1">
              Student Modules
            </div>
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  id={`student-tab-${item.id}`}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.highlight
                          ? 'bg-amber-500 text-white animate-pulse'
                          : isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.count} Pending
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>5 Core Subject Modules</span>
          </div>
          <p className="text-[10px] text-slate-500">Teacher: {teacherUser?.fullName || 'David Miller'}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Banner */}
        <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-md border border-blue-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-mono uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-blue-300" />
              Student Academic Workspace • {studentClass?.name}
            </div>
            <h1 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Welcome back, {currentUser?.fullName}
            </h1>
            <p className="text-xs text-blue-200 mt-1 leading-relaxed">
              Homeroom Teacher: <strong className="text-white">{teacherUser?.fullName || 'Mr. David Miller'}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10 shrink-0">
            {/* Live Sync Trigger */}
            <button
              type="button"
              onClick={() => supabaseSyncInfo.syncWithSupabase()}
              disabled={supabaseSyncInfo.isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/90 hover:bg-blue-950 text-blue-100 text-xs font-semibold border border-blue-800/80 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
              title="Click to fetch newest quizzes from Cloud Firestore"
              id="student-sync-refresh-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${supabaseSyncInfo.isSyncing ? 'animate-spin text-amber-300' : 'text-emerald-400'}`} />
              <span>{supabaseSyncInfo.isSyncing ? 'Syncing...' : 'Live Sync'}</span>
              {supabaseSyncInfo.lastSyncedAt && (
                <span className="text-[10px] text-blue-300 ml-1 font-mono">({supabaseSyncInfo.lastSyncedAt})</span>
              )}
            </button>

            <div className="flex items-center gap-3 bg-blue-950/80 px-4 py-2 rounded-xl border border-blue-800/80">
              <div className="text-right">
                <span className="text-[10px] text-blue-200 uppercase font-mono tracking-wider font-semibold">Academic Average</span>
                <div className="text-xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">{overallAverage}%</div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-800 text-blue-200 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5 text-blue-300" />
              </div>
            </div>
          </div>
        </div>

      {/* TAB 1: SUBJECT QUIZZES (PENDING & COMPLETED) */}
      {activeTab === 'quizzes' && (
        <div className="space-y-5">
          {/* Cohort & Subject Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Scope:
              </span>
              <button
                type="button"
                onClick={() => setScopeFilter('assigned')}
                id="filter-scope-assigned"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scopeFilter === 'assigned'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                My Cohort ({studentClass?.name || 'Class'}) ({directAssignedQuizzes.length})
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                id="filter-scope-all"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scopeFilter === 'all'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All School Quizzes ({quizzes.length})
              </button>
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                id="student-subject-filter"
              >
                <option value="all">All Subjects</option>
                {fiveSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Friendly notice if fallback is active */}
          {scopeFilter === 'assigned' && directAssignedQuizzes.length === 0 && quizzes.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                No assessments are exclusively tagged for <strong>{studentClass?.name || 'your class'}</strong> yet. Showing all {quizzes.length} published school quizzes below for your self-directed learning and practice.
              </span>
            </div>
          )}

          {/* Pending Quizzes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <h3 className="font-bold text-slate-900 text-base font-['Plus_Jakarta_Sans',sans-serif]">
                Pending Quizzes to Complete ({pendingQuizzes.length})
              </h3>
            </div>

            {pendingQuizzes.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">You are all caught up!</p>
                <p className="mt-0.5">No pending quizzes matching your filter at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingQuizzes.map((quiz) => {
                  const isAssignedToMe = isDirectlyAssignedQuiz(quiz);
                  const isRecent = quiz.createdAt && Date.now() - new Date(quiz.createdAt).getTime() < 86400000 * 3;
                  return (
                    <div
                      key={quiz.id}
                      className={`bg-white rounded-xl border p-5 shadow-xs space-y-3 flex flex-col justify-between transition-shadow hover:shadow-sm ${
                        isAssignedToMe ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              {quiz.subject}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {classes.find((c) => c.id === quiz.classId)?.name || 'All Cohorts'}
                            </span>
                            {isAssignedToMe && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                Assigned to Cohort
                              </span>
                            )}
                            {isRecent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                Fresh
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            {quiz.timeLimitMinutes} min
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base font-['Plus_Jakarta_Sans',sans-serif]">
                          {quiz.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {quiz.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {quiz.questions.length} Questions • {quiz.totalPoints || quiz.questions.reduce((s, q) => s + (q.points || 1), 0)} Pts
                        </span>
                        <button
                          onClick={() => setActiveQuizForTaking(quiz)}
                          className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs active:scale-98 transition-colors"
                          id={`start-quiz-btn-${quiz.id}`}
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Start Assessment</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Quizzes */}
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-3">
              Completed Assessments ({completedQuizzes.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedQuizzes.map((quiz) => {
                const result = myResults.find((r) => r.quizId === quiz.id);
                return (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {quiz.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                        Score: {result?.percentage}%
                      </span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">{quiz.title}</h5>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>{result?.score} / {result?.totalPoints} points</span>
                      <button
                        onClick={() => setActiveQuizForTaking(quiz)}
                        className="text-blue-700 font-semibold hover:underline"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: WEAK AREA DIAGNOSTICS */}
      {activeTab === 'diagnostics' && <StudentWeakAreaDiagnostics />}

      {/* TAB 2: CLASS LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-base flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  Class Academic Leaderboard: {studentClass?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Ranked dynamically based on verified quiz performance across all 5 subjects
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {leaderboardData.map((scholar, index) => {
              const isCurrentUser = scholar.studentId === currentUser?.id;
              return (
                <div
                  key={scholar.studentId}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                    isCurrentUser ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Rank Badge */}
                    <div className="w-8 flex items-center justify-center font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                      {index === 0 ? (
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs shadow-xs">
                          🥇
                        </div>
                      ) : index === 1 ? (
                        <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center text-xs">
                          🥈
                        </div>
                      ) : index === 2 ? (
                        <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-xs">
                          🥉
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 font-bold">#{index + 1}</span>
                      )}
                    </div>

                    <UserAvatar
                      name={scholar.name}
                      avatarUrl={scholar.avatarUrl}
                      role="student"
                      size="md"
                      className="w-10 h-10 rounded-lg"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{scholar.name}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-900 text-white">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {scholar.totalQuizzes} quizzes completed
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                      {scholar.avgPercentage}%
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {scholar.totalScore} total pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT MASTERY & GRADES */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fiveSubjects.map((subj) => {
              const subjQuizzes = displayedQuizzes.filter((q) => q.subject === subj);
              const subjResults = myResults.filter((r) =>
                subjQuizzes.some((q) => q.id === r.quizId)
              );
              const avg =
                subjResults.length > 0
                  ? (
                      subjResults.reduce((acc, r) => acc + r.percentage, 0) /
                      subjResults.length
                    ).toFixed(1)
                  : 'N/A';

              return (
                <div
                  key={subj}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{subj}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        avg !== 'N/A' && Number(avg) >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : avg !== 'N/A'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {avg !== 'N/A' ? `${avg}%` : 'Not Assessed'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${avg !== 'N/A' ? avg : 0}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {subjResults.length} of {subjQuizzes.length} Quizzes Submitted
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ASSIGNED HOMEROOM TEACHER */}
      {activeTab === 'teacher' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs max-w-xl space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={teacherUser?.fullName || 'Teacher'}
              avatarUrl={teacherUser?.avatarUrl}
              role="teacher"
              size="xl"
            />
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                Homeroom Instructor
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                {teacherUser?.fullName || 'Mr. David Miller'}
              </h3>
              <p className="text-xs text-slate-500">{studentClass?.name}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Office Phone: {teacherUser?.phoneNumber || '+1 (555) 234-8901'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email: {teacherUser?.email || 'david.miller@acebee.edu'}</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            <strong>Scope of Instruction:</strong> As your dedicated homeroom faculty member, {teacherUser?.fullName} teaches and evaluates your coursework across all 5 core modules: Mathematics, English, Science, Social Studies, and Art & Technology.
          </div>
        </div>
      )}
      </main>

      {/* Active Quiz Taker Modal */}
      {activeQuizForTaking && (
        <QuizTakerModal
          quiz={activeQuizForTaking}
          onClose={() => setActiveQuizForTaking(null)}
        />
      )}
    </div>
  );
};
