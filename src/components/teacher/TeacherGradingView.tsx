import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Quiz, QuizResult, SchoolClass } from '../../types';
import { ManualMarkingModal } from './ManualMarkingModal';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  BookOpen,
  User,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface TeacherGradingViewProps {
  currentClass?: SchoolClass;
}

export const TeacherGradingView: React.FC<TeacherGradingViewProps> = ({ currentClass }) => {
  const { currentUser, classes, quizzes, quizResults, users, studentDetails } = useApp();

  const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClass?.id || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'graded'>('all');
  const [search, setSearch] = useState('');

  // Active modal state
  const [inspectingResult, setInspectingResult] = useState<QuizResult | null>(null);

  // Quizzes belonging to teacher or assigned to classes
  const teacherQuizzes = useMemo(() => {
    return quizzes.filter(
      (q) =>
        q.teacherId === currentUser?.id ||
        (selectedClassId !== 'all' && (q.classId === selectedClassId || q.assignedClassIds?.includes(selectedClassId)))
    );
  }, [quizzes, currentUser, selectedClassId]);

  // Filtered results
  const relevantResults = useMemo(() => {
    return quizResults.filter((res) => {
      const quiz = quizzes.find((q) => q.id === res.quizId);
      const student = users.find((u) => u.id === res.studentId);
      const studentDetail = studentDetails.find((d) => d.studentId === res.studentId);
      const studentClassId = studentDetail?.classId || quiz?.classId;

      // Ensure this result belongs to teacher's quizzes or current class
      const isTeacherQuiz = quiz?.teacherId === currentUser?.id;
      const isTeacherClass = classes.some((c) => c.teacherId === currentUser?.id && c.id === studentClassId);
      if (!isTeacherQuiz && !isTeacherClass && studentClassId !== currentClass?.id) {
        return false;
      }

      const matchQuiz = selectedQuizId === 'all' || res.quizId === selectedQuizId;
      const matchClass = selectedClassId === 'all' || studentClassId === selectedClassId;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending_review' && res.status === 'pending_review') ||
        (statusFilter === 'graded' && res.status === 'graded');

      const matchSearch =
        !search ||
        (student?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (quiz?.title || '').toLowerCase().includes(search.toLowerCase());

      return matchQuiz && matchClass && matchStatus && matchSearch;
    });
  }, [
    quizResults,
    quizzes,
    users,
    studentDetails,
    currentUser,
    classes,
    currentClass,
    selectedQuizId,
    selectedClassId,
    statusFilter,
    search,
  ]);

  const pendingCount = useMemo(() => {
    return relevantResults.filter((r) => r.status === 'pending_review').length;
  }, [relevantResults]);

  const activeInspectingQuiz = inspectingResult
    ? quizzes.find((q) => q.id === inspectingResult.quizId)
    : null;
  const activeInspectingStudent = inspectingResult
    ? users.find((u) => u.id === inspectingResult.studentId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            Grading & Feedback Center
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Student Quiz Submissions & Marks Release
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Grade structured answers, assign points, write personalized feedback, and release final marks to students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase text-amber-700">Pending Review</div>
              <div className="text-lg font-black text-amber-900">{pendingCount} Submissions</div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-700">Graded & Released</div>
              <div className="text-lg font-black text-emerald-900">
                {relevantResults.length - pendingCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Class Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Classroom:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All My Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.gradeLevel})
              </option>
            ))}
          </select>
        </div>

        {/* Quiz Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Quiz Assignment:</label>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Quizzes ({quizzes.length})</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Review Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Submissions</option>
            <option value="pending_review">Pending Review (Action Required)</option>
            <option value="graded">Graded & Released</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Search Student:</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
            <h3 className="font-bold text-slate-900 text-sm">
              Submissions ({relevantResults.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click on any submission to grade structured questions, award points, and release feedback
          </span>
        </div>

        {relevantResults.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No submissions found</p>
            <p className="text-xs text-slate-400">
              When students complete their assigned quizzes, their attempts will appear here for grading.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Quiz & Subject</th>
                  <th className="py-3 px-4">Attempt</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Score & %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Feedback</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantResults.map((result) => {
                  const student = users.find((u) => u.id === result.studentId);
                  const quiz = quizzes.find((q) => q.id === result.quizId);
                  const studentDetail = studentDetails.find((d) => d.studentId === result.studentId);
                  const studentClass = classes.find((c) => c.id === studentDetail?.classId);

                  const isPending = result.status === 'pending_review';

                  return (
                    <tr
                      key={result.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{student?.fullName || 'Student'}</div>
                        <div className="text-[11px] text-slate-400">
                          {studentClass?.name || 'Class'} ({studentClass?.gradeLevel})
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{quiz?.title || 'Quiz'}</div>
                        <div className="text-[10px] font-semibold text-blue-700">{quiz?.subject}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        #{result.attemptNumber || 1}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {result.completedAt
                          ? new Date(result.completedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-black text-slate-900">
                          {result.score} / {result.totalPoints}
                        </div>
                        <div
                          className={`text-[11px] font-bold ${
                            result.percentage >= 70
                              ? 'text-emerald-700'
                              : result.percentage >= 50
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {result.percentage}%
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {isPending ? '⏳ Pending Review' : '✓ Released'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {result.teacherFeedback ? (
                          <div className="flex items-start gap-1 text-slate-700 bg-blue-50/60 p-1.5 rounded border border-blue-100 text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 italic">{result.teacherFeedback}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No feedback written</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setInspectingResult(result)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-all ${
                            isPending
                              ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold animate-pulse'
                              : 'bg-blue-900 hover:bg-blue-800 text-white'
                          }`}
                        >
                          <span>{isPending ? 'Grade & Release' : 'Edit Marks'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Marking Modal */}
      {inspectingResult && activeInspectingQuiz && (
        <ManualMarkingModal
          isOpen={Boolean(inspectingResult)}
          onClose={() => setInspectingResult(null)}
          result={inspectingResult}
          quiz={activeInspectingQuiz}
          student={activeInspectingStudent}
        />
      )}
    </div>
  );
};
