import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Quiz, QuizResult, SchoolClass, Subject } from '../../types';
import { ManualMarkingModal } from '../teacher/ManualMarkingModal';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  User,
  GraduationCap,
  Download,
  Printer,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminClassMarksView: React.FC = () => {
  const { classes, quizzes, quizResults, users, studentDetails } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'graded'>('all');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'has_feedback' | 'no_feedback'>('all');
  const [search, setSearch] = useState('');

  // Selected result for detailed inspection
  const [inspectingResult, setInspectingResult] = useState<QuizResult | null>(null);

  // Available quizzes matching class and subject filters
  const filteredQuizzesList = useMemo(() => {
    return quizzes.filter((q) => {
      const matchClass =
        selectedClassId === 'all' ||
        q.classId === selectedClassId ||
        (q.assignedClassIds && q.assignedClassIds.includes(selectedClassId));
      const matchSub = selectedSubject === 'all' || q.subject === selectedSubject;
      return matchClass && matchSub;
    });
  }, [quizzes, selectedClassId, selectedSubject]);

  // Active appointed quiz object if selected
  const activeAppointedQuiz = useMemo(() => {
    if (selectedQuizId === 'all') return null;
    return quizzes.find((q) => q.id === selectedQuizId) || null;
  }, [quizzes, selectedQuizId]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return quizResults.filter((res) => {
      const quiz = quizzes.find((q) => q.id === res.quizId);
      const student = users.find((u) => u.id === res.studentId);
      const studentDetail = studentDetails.find((d) => d.studentId === res.studentId);
      const studentClassId = studentDetail?.classId || quiz?.classId;

      const matchClass = selectedClassId === 'all' || studentClassId === selectedClassId;
      const matchQuiz = selectedQuizId === 'all' || res.quizId === selectedQuizId;
      const matchSub = selectedSubject === 'all' || quiz?.subject === selectedSubject;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending_review' && res.status === 'pending_review') ||
        (statusFilter === 'graded' && res.status === 'graded');

      const hasFeedback = Boolean(res.teacherFeedback && res.teacherFeedback.trim().length > 0);
      const matchFeedback =
        feedbackFilter === 'all' ||
        (feedbackFilter === 'has_feedback' && hasFeedback) ||
        (feedbackFilter === 'no_feedback' && !hasFeedback);

      const matchSearch =
        !search ||
        (student?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (quiz?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (res.teacherFeedback || '').toLowerCase().includes(search.toLowerCase());

      return matchClass && matchQuiz && matchSub && matchStatus && matchFeedback && matchSearch;
    });
  }, [
    quizResults,
    quizzes,
    users,
    studentDetails,
    selectedClassId,
    selectedQuizId,
    selectedSubject,
    statusFilter,
    feedbackFilter,
    search,
  ]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredResults.length;
    if (total === 0)
      return {
        total: 0,
        avgPercentage: '0.0',
        pendingCount: 0,
        gradedCount: 0,
        feedbackCount: 0,
        passCount: 0,
        highScore: 0,
      };

    const sumPct = filteredResults.reduce((sum, r) => sum + r.percentage, 0);
    const avgPercentage = (sumPct / total).toFixed(1);
    const pendingCount = filteredResults.filter((r) => r.status === 'pending_review').length;
    const gradedCount = filteredResults.filter((r) => r.status === 'graded').length;
    const feedbackCount = filteredResults.filter(
      (r) => r.teacherFeedback && r.teacherFeedback.trim().length > 0
    ).length;
    const passCount = filteredResults.filter((r) => r.percentage >= 50).length;
    const highScore = Math.max(...filteredResults.map((r) => r.percentage), 0);

    return {
      total,
      avgPercentage,
      pendingCount,
      gradedCount,
      feedbackCount,
      passCount,
      highScore,
    };
  }, [filteredResults]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;

    const headers = [
      'Student Name',
      'Class Name',
      'Grade Level',
      'Quiz Title',
      'Subject',
      'Attempt',
      'Score Awarded',
      'Total Points',
      'Percentage (%)',
      'Grading Status',
      'Teacher Feedback',
      'Submission Date',
    ];

    const rows = filteredResults.map((result) => {
      const student = users.find((u) => u.id === result.studentId);
      const quiz = quizzes.find((q) => q.id === result.quizId);
      const studentDetail = studentDetails.find((d) => d.studentId === result.studentId);
      const studentClass = classes.find((c) => c.id === studentDetail?.classId);

      const cleanText = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;

      return [
        cleanText(student?.fullName || 'Student'),
        cleanText(studentClass?.name || 'Class'),
        cleanText(studentClass?.gradeLevel || ''),
        cleanText(quiz?.title || 'Quiz'),
        cleanText(quiz?.subject || ''),
        result.attemptNumber || 1,
        result.score,
        result.totalPoints,
        result.percentage,
        cleanText(result.status || 'graded'),
        cleanText(result.teacherFeedback || ''),
        cleanText(new Date(result.completedAt).toLocaleString()),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName =
      selectedQuizId !== 'all' && activeAppointedQuiz
        ? `${activeAppointedQuiz.title.replace(/\s+/g, '_')}_marksheet.csv`
        : 'school_class_marks_report.csv';
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeInspectingQuiz = inspectingResult
    ? quizzes.find((q) => q.id === inspectingResult.quizId)
    : null;
  const activeInspectingStudent = inspectingResult
    ? users.find((u) => u.id === inspectingResult.studentId)
    : null;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2 print:hidden">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            Administrative Academic Governance
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            All Class Marks & Appointed Quiz Feedback
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access marksheets across all classrooms, view student answer submissions, audit teacher feedback, and export records.
          </p>
        </div>

        {/* Action Buttons & Aggregate KPI chips */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredResults.length === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2 print:hidden"
            title="Download CSV Marksheet"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center gap-2 border border-slate-200 print:hidden"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Submissions</span>
            <div className="text-base font-black text-slate-800">{metrics.total}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600">Avg Mark</span>
            <div className="text-base font-black text-blue-900">{metrics.avgPercentage}%</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-center">
            <span className="text-[10px] uppercase font-bold text-purple-700">With Feedback</span>
            <div className="text-base font-black text-purple-900">{metrics.feedbackCount}</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-700">Pending Review</span>
            <div className="text-base font-black text-amber-800">{metrics.pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Appointed Quiz Highlight Card (if a specific quiz is selected) */}
      {activeAppointedQuiz && (
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl text-white shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-800/80 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-800 text-blue-200 uppercase tracking-wider">
                  {activeAppointedQuiz.subject}
                </span>
                <span className="text-xs text-blue-200">
                  Mode: <strong className="text-white uppercase">{activeAppointedQuiz.markingMode || 'auto'}</strong>
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Appointed Quiz: {activeAppointedQuiz.title}
              </h3>
              <p className="text-xs text-blue-200 max-w-2xl">{activeAppointedQuiz.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>
                  {activeAppointedQuiz.timeLimitMinutes > 0
                    ? `${activeAppointedQuiz.timeLimitMinutes} mins allocated`
                    : 'Unlimited Time'}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {activeAppointedQuiz.maxAttempts && activeAppointedQuiz.maxAttempts > 0
                    ? `Max ${activeAppointedQuiz.maxAttempts} Attempts`
                    : 'Unlimited Attempts'}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>{activeAppointedQuiz.questions?.length || 0} Questions</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/10 rounded-lg p-3">
              <span className="text-blue-200 text-[10px] uppercase font-bold">Class Average</span>
              <div className="text-lg font-black text-white">{metrics.avgPercentage}%</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <span className="text-blue-200 text-[10px] uppercase font-bold">High Score</span>
              <div className="text-lg font-black text-white">{metrics.highScore}%</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <span className="text-blue-200 text-[10px] uppercase font-bold">Pass Rate (&ge; 50%)</span>
              <div className="text-lg font-black text-white">
                {metrics.total > 0 ? Math.round((metrics.passCount / metrics.total) * 100) : 0}%
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <span className="text-blue-200 text-[10px] uppercase font-bold">Feedback Audit</span>
              <div className="text-lg font-black text-white">
                {metrics.feedbackCount} / {metrics.total}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 print:hidden">
        {/* Class selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedQuizId('all');
            }}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes ({classes.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.gradeLevel})
              </option>
            ))}
          </select>
        </div>

        {/* Appointed Quiz selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Appointed Quiz:</label>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Quizzes ({filteredQuizzesList.length})</option>
            {filteredQuizzesList.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Subject selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="English">English</option>
            <option value="Science">Science</option>
            <option value="Social Studies">Social Studies</option>
            <option value="Art & Technology">Art & Technology</option>
            <option value="Bahasa Melayu">Bahasa Melayu</option>
            <option value="History">History</option>
          </select>
        </div>

        {/* Status filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Grading Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Teacher Review</option>
            <option value="graded">Graded & Released</option>
          </select>
        </div>

        {/* Feedback filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Teacher Feedback:</label>
          <select
            value={feedbackFilter}
            onChange={(e) => setFeedbackFilter(e.target.value as any)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Submissions</option>
            <option value="has_feedback">With Written Feedback</option>
            <option value="no_feedback">Needs Feedback</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Search Keyword:</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Student, feedback..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
            <h3 className="font-bold text-slate-900 text-sm">
              Recorded Submissions & Feedback ({filteredResults.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Showing results across all appointed quizzes and class cohorts
          </span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No marks or submissions match your criteria</p>
            <p className="text-xs text-slate-400">
              Try adjusting your class, quiz, feedback, or status filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student & Class</th>
                  <th className="py-3 px-4">Appointed Quiz</th>
                  <th className="py-3 px-4">Attempt</th>
                  <th className="py-3 px-4">Score & %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Teacher Feedback</th>
                  <th className="py-3 px-4 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((result) => {
                  const student = users.find((u) => u.id === result.studentId);
                  const quiz = quizzes.find((q) => q.id === result.quizId);
                  const studentDetail = studentDetails.find((d) => d.studentId === result.studentId);
                  const studentClass = classes.find((c) => c.id === studentDetail?.classId);

                  return (
                    <tr key={result.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{student?.fullName || 'Student'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {studentClass?.name || 'Class'} ({studentClass?.gradeLevel})
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{quiz?.title || 'Quiz'}</div>
                        <div className="text-[10px] font-semibold text-blue-700">{quiz?.subject}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        Attempt #{result.attemptNumber || 1}
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
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            result.status === 'graded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {result.status === 'graded' ? 'Graded' : 'Pending Review'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {result.teacherFeedback ? (
                          <div className="flex items-start gap-1.5 text-slate-700 bg-blue-50/70 p-2 rounded-lg border border-blue-100 text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 italic font-medium">{result.teacherFeedback}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-slate-300" />
                            No feedback provided yet
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right print:hidden">
                        <button
                          type="button"
                          onClick={() => setInspectingResult(result)}
                          className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-xs"
                          title="Review student answers and inspect feedback"
                        >
                          <span>Review & Inspect</span>
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

      {/* Manual Marking / Inspecting Modal */}
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
