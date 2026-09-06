import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WeaknessPracticeRecord, Class } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  Zap,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface TeacherRemediationViewProps {
  currentClass?: Class;
}

export const TeacherRemediationView: React.FC<TeacherRemediationViewProps> = ({ currentClass }) => {
  const { weaknessPractices, studentDetails, markWeaknessPracticeNoticed } = useApp();

  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'unnoticed' | 'noticed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingRecord, setInspectingRecord] = useState<WeaknessPracticeRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter practices relevant to this class if selected
  const classStudentIds = useMemo(() => {
    if (!currentClass) return new Set<string>();
    return new Set(studentDetails.filter((d) => d.classId === currentClass.id).map((d) => d.studentId));
  }, [currentClass, studentDetails]);

  const classPractices = useMemo(() => {
    return weaknessPractices.filter((p) => {
      if (!currentClass) return true;
      if (p.classId && p.classId === currentClass.id) return true;
      if (classStudentIds.has(p.studentId)) return true;
      return false;
    });
  }, [weaknessPractices, currentClass, classStudentIds]);

  // Apply filters
  const filteredPractices = useMemo(() => {
    return classPractices.filter((p) => {
      const matchStudent = selectedStudentFilter === 'all' || p.studentId === selectedStudentFilter;
      const matchStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'unnoticed' && !p.teacherNoticed) ||
        (selectedStatusFilter === 'noticed' && p.teacherNoticed);
      const matchQuery =
        searchQuery.trim() === '' ||
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subject.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStudent && matchStatus && matchQuery;
    });
  }, [classPractices, selectedStudentFilter, selectedStatusFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = classPractices.length;
    const uniqueStudents = new Set(classPractices.map((p) => p.studentId)).size;
    const avgScore =
      total > 0
        ? Math.round(classPractices.reduce((sum, p) => sum + p.scorePercentage, 0) / total)
        : 0;
    const unnoticedCount = classPractices.filter((p) => !p.teacherNoticed).length;

    // Top practiced topics
    const topicFrequency: Record<string, number> = {};
    classPractices.forEach((p) => {
      topicFrequency[p.topic] = (topicFrequency[p.topic] || 0) + 1;
    });
    const sortedTopics = Object.entries(topicFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { total, uniqueStudents, avgScore, unnoticedCount, sortedTopics };
  }, [classPractices]);

  // Unique students in this class who practiced
  const practicingStudents = useMemo(() => {
    const map = new Map<string, string>();
    classPractices.forEach((p) => map.set(p.studentId, p.studentName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [classPractices]);

  const handleMarkNoticed = async (practiceId: string, studentName: string) => {
    await markWeaknessPracticeNoticed(practiceId);
    setActionSuccessMsg(`Acknowledged recovery practice for ${studentName}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
    if (inspectingRecord && inspectingRecord.id === practiceId) {
      setInspectingRecord({ ...inspectingRecord, teacherNoticed: true });
    }
  };

  const handleMarkAllNoticed = async () => {
    const unnoticed = classPractices.filter((p) => !p.teacherNoticed);
    for (const p of unnoticed) {
      await markWeaknessPracticeNoticed(p.id);
    }
    setActionSuccessMsg(`Acknowledged all ${unnoticed.length} student practice sessions`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6" id="teacher-remediation-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-blue-950 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-amber-200 text-xs font-mono uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              Proactive Student Remediation Logs
            </div>
            <h2 className="text-xl font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Student Error Weakness Practice Tracker
            </h2>
            <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
              Whenever students review their diagnostic analysis and practice 10-question recovery drills, their sessions, scores, and answered items are recorded here for your review and encouragement.
            </p>
          </div>

          {metrics.unnoticedCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllNoticed}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Acknowledge All New ({metrics.unnoticedCount})</span>
            </button>
          )}
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 relative z-10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">
              Total Drills Completed
            </div>
            <div className="text-2xl font-black text-white mt-1">{metrics.total} Sessions</div>
            <p className="text-[11px] text-blue-200 mt-0.5">10 questions each</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">
              Engaged Students
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {metrics.uniqueStudents} Students
            </div>
            <p className="text-[11px] text-blue-200 mt-0.5">Taking proactive practice</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">
              Average Drill Accuracy
            </div>
            <div className="text-2xl font-black text-white mt-1">{metrics.avgScore}%</div>
            <p className="text-[11px] text-blue-200 mt-0.5">Across all completed sets</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-amber-300 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
              <span>Awaiting Review</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{metrics.unnoticedCount} Drills</div>
            <p className="text-[11px] text-amber-200 mt-0.5">Student initiative notices</p>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student, topic, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {practicingStudents.length > 0 && (
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="all">All Practicing Students ({practicingStudents.length})</option>
              {practicingStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                selectedStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({classPractices.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('unnoticed')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 ${
                selectedStatusFilter === 'unnoticed'
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>New</span>
              {metrics.unnoticedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center">
                  {metrics.unnoticedCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('noticed')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                selectedStatusFilter === 'noticed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reviewed
            </button>
          </div>
        </div>

        {metrics.sortedTopics.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold">Hot Topics:</span>
            {metrics.sortedTopics.map(([topic, count]) => (
              <span
                key={topic}
                className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100 font-bold"
              >
                {topic} ({count})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Practices Table / Cards */}
      {filteredPractices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
            No Practice Sessions Logged Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When students in {currentClass?.name || 'this class'} identify weak topics in their profile and click &ldquo;Practice&rdquo;, their completed 10-question drills will automatically show up here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Topic & Subject</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4">Completed At</th>
                  <th className="py-3 px-4 text-center">Teacher Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPractices.map((record) => {
                  const minutes = Math.floor(record.timeSpentSeconds / 60);
                  const seconds = record.timeSpentSeconds % 60;
                  const isHigh = record.scorePercentage >= 80;
                  const isMid = record.scorePercentage >= 60 && record.scorePercentage < 80;

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !record.teacherNoticed ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Student */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={record.studentName} role="student" size="sm" />
                          <div>
                            <div className="font-bold text-slate-900">{record.studentName}</div>
                            <div className="text-[10px] text-slate-500">
                              {record.className || currentClass?.name || 'Student'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Topic */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{record.topic}</div>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {record.subject}
                          </span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-black text-sm ${
                              isHigh ? 'text-emerald-600' : isMid ? 'text-amber-600' : 'text-rose-600'
                            }`}
                          >
                            {record.scorePercentage}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {record.correctAnswers}/{record.totalQuestions} correct
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-center text-slate-600 font-mono text-[11px]">
                        {minutes}m {seconds}s
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(record.completedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Teacher Notice Status */}
                      <td className="py-3 px-4 text-center">
                        {record.teacherNoticed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Reviewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full animate-pulse">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Needs Notice
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!record.teacherNoticed && (
                            <button
                              type="button"
                              onClick={() => handleMarkNoticed(record.id, record.studentName)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                              title="Mark this student practice session as reviewed"
                            >
                              <Check className="w-3 h-3" />
                              <span>Acknowledge</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setInspectingRecord(record)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
                            title="Inspect 10 questions and student answers"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Inspect 10 Qs</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECT PRACTICE MODAL OVERLAY */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-blue-100">
                    {inspectingRecord.subject}
                  </span>
                  <span className="text-xs text-blue-200">
                    Completed by <strong className="text-white">{inspectingRecord.studentName}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mt-1">
                  10-Question Drill: {inspectingRecord.topic}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500">Score:</span>{' '}
                  <strong
                    className={`font-black text-sm ${
                      inspectingRecord.scorePercentage >= 80
                        ? 'text-emerald-600'
                        : inspectingRecord.scorePercentage >= 60
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {inspectingRecord.correctAnswers}/{inspectingRecord.totalQuestions} (
                    {inspectingRecord.scorePercentage}%)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Time Taken:</span>{' '}
                  <strong className="text-slate-800 font-mono">
                    {Math.floor(inspectingRecord.timeSpentSeconds / 60)}m{' '}
                    {inspectingRecord.timeSpentSeconds % 60}s
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!inspectingRecord.teacherNoticed ? (
                  <button
                    type="button"
                    onClick={() => handleMarkNoticed(inspectingRecord.id, inspectingRecord.studentName)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge Practice</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Teacher Acknowledged
                  </span>
                )}
              </div>
            </div>

            {/* Questions breakdown */}
            <div className="p-6 overflow-y-auto space-y-4 divide-y divide-slate-100 flex-1">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Question-by-Question Diagnostic Review ({inspectingRecord.answersSummary?.length || 0} Questions)</span>
              </h4>

              {inspectingRecord.answersSummary && inspectingRecord.answersSummary.length > 0 ? (
                inspectingRecord.answersSummary.map((ans, idx) => (
                  <div key={idx} className="pt-4 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">{ans.questionText}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          ans.isCorrect
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {ans.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7">
                      <div
                        className={`p-2.5 rounded-lg border text-xs ${
                          ans.isCorrect
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50/70 border-rose-200 text-rose-900'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Student Response:
                        </span>
                        <span className="font-medium mt-0.5 block">{ans.selectedAnswer || 'No answer'}</span>
                      </div>

                      {!ans.isCorrect && (
                        <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-900 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                            Correct Answer:
                          </span>
                          <span className="font-medium mt-0.5 block">{ans.correctAnswer}</span>
                        </div>
                      )}
                    </div>

                    {ans.explanation && (
                      <div className="ml-7 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                        <strong className="text-slate-800">Concept Explanation:</strong> {ans.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Detailed question responses were not recorded for this legacy attempt.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
