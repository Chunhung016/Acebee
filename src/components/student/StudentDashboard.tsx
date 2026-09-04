import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Quiz } from '../../types';
import { QuizTakerModal } from './QuizTakerModal';
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
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    studentDetails,
    classes,
    users,
    quizzes,
    quizResults,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quizzes' | 'leaderboard' | 'grades' | 'teacher'>('quizzes');
  const [activeQuizForTaking, setActiveQuizForTaking] = useState<Quiz | null>(null);

  // Find student's detail and assigned class
  const studentDetail = studentDetails.find((d) => d.studentId === currentUser?.id);
  const studentClass = classes.find((c) => c.id === studentDetail?.classId) || classes[0];
  const teacherUser = users.find((u) => u.id === studentClass?.teacherId);

  // Quizzes for this student's class
  const classQuizzes = quizzes.filter((q) => q.classId === studentClass?.id);

  // Student's results
  const myResults = quizResults.filter((r) => r.studentId === currentUser?.id);
  const completedQuizIds = new Set(myResults.map((r) => r.quizId));

  const pendingQuizzes = classQuizzes.filter((q) => !completedQuizIds.has(q.id));
  const completedQuizzes = classQuizzes.filter((q) => completedQuizIds.has(q.id));

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            Homeroom Teacher: <strong className="text-white">{teacherUser?.fullName || 'Mr. David Miller'}</strong> (instructs all 5 subject modules)
          </p>
        </div>

        <div className="flex items-center gap-3 bg-blue-950/80 px-4 py-2.5 rounded-lg border border-blue-800/80 relative z-10 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-blue-200 uppercase font-mono tracking-wider font-semibold">Academic Average</span>
            <div className="text-xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">{overallAverage}%</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-800 text-blue-200 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5 text-blue-300" />
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'quizzes'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="student-tab-quizzes"
        >
          <BookOpen className="w-4 h-4" />
          Subject Quizzes ({pendingQuizzes.length} Pending)
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'leaderboard'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="student-tab-leaderboard"
        >
          <Trophy className="w-4 h-4" />
          Class Leaderboard ({leaderboardData.length} Scholars)
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'grades'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="student-tab-grades"
        >
          <TrendingUp className="w-4 h-4" />
          My Subject Mastery & Grades
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'teacher'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="student-tab-teacher"
        >
          <User className="w-4 h-4" />
          Assigned Homeroom Teacher
        </button>
      </div>

      {/* TAB 1: SUBJECT QUIZZES (PENDING & COMPLETED) */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
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
                <p className="mt-0.5">No pending quizzes assigned at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-xl border border-blue-200 hover:border-blue-300 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {quiz.subject}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {quiz.timeLimitMinutes} min limit
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
                        {quiz.questions.length} Questions
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
                ))}
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

                    <img
                      src={
                        scholar.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={scholar.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
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
              const subjQuizzes = classQuizzes.filter((q) => q.subject === subj);
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
            <img
              src={
                teacherUser?.avatarUrl ||
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
              }
              alt={teacherUser?.fullName}
              className="w-16 h-16 rounded-lg object-cover border border-slate-200"
              referrerPolicy="no-referrer"
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
