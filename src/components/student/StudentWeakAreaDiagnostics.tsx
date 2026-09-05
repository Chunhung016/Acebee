import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Brain,
  Sparkles,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Award,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BarChart2,
  Flame,
  Check,
} from 'lucide-react';
import { Subject, QuizQuestion } from '../../types';

interface TopicDiagnostic {
  topic: string;
  subject: Subject | string;
  totalAttempts: number;
  correctAttempts: number;
  totalPoints: number;
  earnedPoints: number;
  accuracy: number;
  status: 'critical' | 'developing' | 'mastered';
  missedQuestions: {
    questionText: string;
    quizTitle: string;
    studentResponse: string;
    correctAnswer: string;
    explanation?: string;
    difficulty?: string;
  }[];
}

export const StudentWeakAreaDiagnostics: React.FC = () => {
  const { currentUser, quizzes, quizResults, questionBank } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'critical' | 'developing' | 'mastered'>('all');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState<string | null>(null);

  // Filter student's released or completed results
  const myResults = useMemo(() => {
    return quizResults.filter(
      (r) => r.studentId === currentUser?.id && r.status !== 'in_progress'
    );
  }, [quizResults, currentUser?.id]);

  // Map of questionId -> question details from quizzes + question bank
  const questionMap = useMemo(() => {
    const map = new Map<
      string,
      {
        question: QuizQuestion;
        quizTitle: string;
        subject: Subject | string;
        topic: string;
        difficulty?: string;
      }
    >();

    quizzes.forEach((quiz) => {
      quiz.questions.forEach((q) => {
        // Find if exists in question bank to get topic
        const bankMatch = questionBank.find(
          (b) => b.id === q.id || b.question.trim() === q.question.trim()
        );
        const topic = bankMatch?.topic || quiz.title.split('-')[0].trim() || 'General Concept';
        const difficulty = bankMatch?.difficulty || 'medium';

        map.set(q.id, {
          question: q,
          quizTitle: quiz.title,
          subject: quiz.subject,
          topic,
          difficulty,
        });
      });
    });

    return map;
  }, [quizzes, questionBank]);

  // Aggregate diagnostics by Topic
  const diagnosticsData = useMemo(() => {
    const topicStats: Record<
      string,
      {
        topic: string;
        subject: Subject | string;
        totalAttempts: number;
        correctAttempts: number;
        totalPoints: number;
        earnedPoints: number;
        missedQuestions: TopicDiagnostic['missedQuestions'];
      }
    > = {};

    myResults.forEach((result) => {
      const quiz = quizzes.find((q) => q.id === result.quizId);
      const defaultSubject = quiz?.subject || 'General Studies';

      result.answers.forEach((ans) => {
        const qMeta = questionMap.get(ans.questionId);
        const topic = qMeta?.topic || quiz?.title || 'Core Subject Skills';
        const subject = qMeta?.subject || defaultSubject;
        const qObj = qMeta?.question;

        if (!topicStats[topic]) {
          topicStats[topic] = {
            topic,
            subject,
            totalAttempts: 0,
            correctAttempts: 0,
            totalPoints: 0,
            earnedPoints: 0,
            missedQuestions: [],
          };
        }

        const stat = topicStats[topic];
        stat.totalAttempts += 1;
        const maxPts = ans.maxPoints ?? qObj?.points ?? 1;
        const earned = ans.pointsAwarded ?? (ans.isCorrect ? maxPts : 0);
        stat.totalPoints += maxPts;
        stat.earnedPoints += earned;

        if (ans.isCorrect) {
          stat.correctAttempts += 1;
        } else {
          // Format student response and correct answer
          let studentResponse = 'No answer';
          let correctAnswer = 'See explanation';

          if (qObj) {
            if (!qObj.type || qObj.type === 'mcq') {
              if (ans.selectedOption !== undefined && ans.selectedOption >= 0 && qObj.options) {
                studentResponse = `${String.fromCharCode(65 + ans.selectedOption)}. ${
                  qObj.options[ans.selectedOption] || ''
                }`;
              }
              if (qObj.correctAnswerIndex !== undefined && qObj.options) {
                correctAnswer = `${String.fromCharCode(65 + qObj.correctAnswerIndex)}. ${
                  qObj.options[qObj.correctAnswerIndex] || ''
                }`;
              }
            } else if (qObj.type === 'structure' || qObj.type === 'fill_in_blank') {
              studentResponse = ans.textAnswer || 'Blank / Unattempted';
              correctAnswer = qObj.modelAnswer || qObj.acceptableAnswers?.join(' / ') || 'Refer to rubric';
            } else if (qObj.type === 'matching') {
              studentResponse = ans.matchedPairs
                ? ans.matchedPairs.map((p) => `${p.left} → ${p.right || '?'}`).join(', ')
                : 'Incomplete';
              correctAnswer = qObj.matchingPairs
                ? qObj.matchingPairs.map((p) => `${p.left} → ${p.right}`).join(', ')
                : 'Exact pairs';
            }
          }

          stat.missedQuestions.push({
            questionText: qObj?.question || 'Question text unavailable',
            quizTitle: qMeta?.quizTitle || quiz?.title || 'Quiz Assessment',
            studentResponse,
            correctAnswer,
            explanation: qObj?.explanation || qObj?.guidelines,
            difficulty: qMeta?.difficulty,
          });
        }
      });
    });

    const list: TopicDiagnostic[] = Object.values(topicStats).map((item) => {
      const accuracy =
        item.totalPoints > 0
          ? Number(((item.earnedPoints / item.totalPoints) * 100).toFixed(1))
          : 0;

      let status: 'critical' | 'developing' | 'mastered' = 'mastered';
      if (accuracy < 60) {
        status = 'critical';
      } else if (accuracy < 80) {
        status = 'developing';
      }

      return {
        ...item,
        accuracy,
        status,
      };
    });

    // Sort by accuracy ascending (weakest topics first)
    return list.sort((a, b) => a.accuracy - b.accuracy);
  }, [myResults, quizzes, questionMap]);

  // Filtered by subject & status
  const filteredDiagnostics = useMemo(() => {
    return diagnosticsData.filter((item) => {
      const matchSubject = selectedSubject === 'all' || item.subject === selectedSubject;
      const matchStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;
      return matchSubject && matchStatus;
    });
  }, [diagnosticsData, selectedSubject, selectedStatusFilter]);

  // Overall statistics
  const summaryStats = useMemo(() => {
    const criticalCount = diagnosticsData.filter((d) => d.status === 'critical').length;
    const developingCount = diagnosticsData.filter((d) => d.status === 'developing').length;
    const masteredCount = diagnosticsData.filter((d) => d.status === 'mastered').length;
    const totalMissed = diagnosticsData.reduce((sum, d) => sum + d.missedQuestions.length, 0);

    return { criticalCount, developingCount, masteredCount, totalMissed };
  }, [diagnosticsData]);

  // Practice questions recommended from question bank for weak topics
  const recommendedPracticeQuestions = useMemo(() => {
    if (!selectedPracticeTopic) {
      // Pick top critical topics
      const criticalTopics = diagnosticsData
        .filter((d) => d.status === 'critical')
        .map((d) => d.topic.toLowerCase());

      return questionBank
        .filter((q) => criticalTopics.some((t) => q.topic.toLowerCase().includes(t) || t.includes(q.topic.toLowerCase())))
        .slice(0, 5);
    }

    return questionBank
      .filter((q) => q.topic.toLowerCase().includes(selectedPracticeTopic.toLowerCase()))
      .slice(0, 6);
  }, [selectedPracticeTopic, diagnosticsData, questionBank]);

  const uniqueSubjects = Array.from(new Set(diagnosticsData.map((d) => d.subject)));

  return (
    <div className="space-y-6" id="student-weak-area-diagnostics">
      {/* Header Banner */}
      <div className="p-6 bg-linear-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl text-white shadow-md border border-blue-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-mono uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5 text-blue-300" />
              AI & Diagnostic Analytics Engine
            </div>
            <h2 className="text-xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Weak Area Diagnostics & Smart Review
            </h2>
            <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
              Analyzes every completed quiz item, error pattern, and subject topic to pinpoint your exact knowledge gaps and build tailored recovery recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-blue-950/80 px-3.5 py-2 rounded-xl border border-blue-800 text-xs shrink-0">
            <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
            <span>Updated live from {myResults.length} quiz assessments</span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 relative z-10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-rose-300 font-bold uppercase text-[10px] tracking-wider">
                Needs Immediate Focus
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{summaryStats.criticalCount} Topics</div>
            <p className="text-[11px] text-blue-200 mt-0.5">Mastery under 60%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold uppercase text-[10px] tracking-wider">
                Developing Mastery
              </span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{summaryStats.developingCount} Topics</div>
            <p className="text-[11px] text-blue-200 mt-0.5">Mastery 60% - 79%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-bold uppercase text-[10px] tracking-wider">
                Strong Strengths
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{summaryStats.masteredCount} Topics</div>
            <p className="text-[11px] text-blue-200 mt-0.5">Mastery 80% & above</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-blue-200 font-bold uppercase text-[10px] tracking-wider">
                Identified Mistakes
              </span>
              <HelpCircle className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{summaryStats.totalMissed} Items</div>
            <p className="text-[11px] text-blue-200 mt-0.5">Logged with correct explanations</p>
          </div>
        </div>
      </div>

      {/* Filter and Switcher Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700">Filter by Subject:</span>
          <button
            type="button"
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedSubject === 'all'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Subjects ({diagnosticsData.length})
          </button>
          {uniqueSubjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedSubject === sub
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700">Status:</span>
          {(['all', 'critical', 'developing', 'mastered'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                selectedStatusFilter === st
                  ? st === 'critical'
                    ? 'bg-rose-600 text-white'
                    : st === 'developing'
                    ? 'bg-amber-600 text-white'
                    : st === 'mastered'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Diagnostic Topic Cards */}
      {filteredDiagnostics.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No Weak Areas Found in Selected Filter!</h3>
          <p className="text-xs">
            Complete more quizzes or adjust the filter to view deep concept breakdowns.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiagnostics.map((diag) => {
            const isExpanded = expandedTopic === diag.topic;
            return (
              <div
                key={diag.topic}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  diag.status === 'critical'
                    ? 'border-rose-200 shadow-xs'
                    : diag.status === 'developing'
                    ? 'border-amber-200 shadow-xs'
                    : 'border-slate-200'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          diag.status === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : diag.status === 'developing'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {diag.status === 'critical'
                          ? 'Needs Urgent Review'
                          : diag.status === 'developing'
                          ? 'Developing'
                          : 'Mastered'}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {diag.subject}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {diag.totalAttempts} total attempts ({diag.missedQuestions.length} missed)
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                      {diag.topic}
                    </h3>

                    {/* Actionable Advice */}
                    <p className="text-xs text-slate-600">
                      {diag.status === 'critical' ? (
                        <span className="text-rose-700 font-medium">
                          ⚠️ Focus Area: Review foundational definitions, formulas, and step-by-step problem sets for this topic.
                        </span>
                      ) : diag.status === 'developing' ? (
                        <span className="text-amber-700 font-medium">
                          💡 Solid foundation, but occasional mistakes in application or structured justifications.
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">
                          🎉 Excellent command of concepts and high accuracy across assessments.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Accuracy Bar & Toggle */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right min-w-[100px]">
                      <div className="text-xs font-bold text-slate-500">Topic Mastery</div>
                      <div
                        className={`text-xl font-black ${
                          diag.status === 'critical'
                            ? 'text-rose-600'
                            : diag.status === 'developing'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {diag.accuracy}%
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            diag.status === 'critical'
                              ? 'bg-rose-500'
                              : diag.status === 'developing'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, diag.accuracy)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPracticeTopic(diag.topic)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Practice</span>
                      </button>

                      {diag.missedQuestions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedTopic(isExpanded ? null : diag.topic)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                          title="Inspect mistakes"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-700" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-700" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Missed Questions Breakdown */}
                {isExpanded && diag.missedQuestions.length > 0 && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Mistakes & Explanations ({diag.missedQuestions.length} items)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Reviewing your past errors solidifies memory retention
                      </span>
                    </div>

                    <div className="space-y-3">
                      {diag.missedQuestions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">
                              From: {q.quizTitle}
                            </span>
                            {q.difficulty && (
                              <span className="px-2 py-0.5 rounded capitalize bg-slate-100 font-medium">
                                {q.difficulty}
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-slate-900">{q.questionText}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                              <span className="text-[10px] font-bold text-rose-800 uppercase block">
                                Your Submission:
                              </span>
                              <span className="text-rose-950 font-medium">{q.studentResponse}</span>
                            </div>

                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                                Correct Answer:
                              </span>
                              <span className="text-emerald-950 font-semibold">{q.correctAnswer}</span>
                            </div>
                          </div>

                          {q.explanation && (
                            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-950 text-[11px] space-y-0.5">
                              <span className="font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Key Concept / Explanation:
                              </span>
                              <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SMART RECOMMENDED PRACTICE DRILLS (FROM QUESTION BANK) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
              <Flame className="w-4 h-4 text-amber-500" />
              Smart Practice Recommendations
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mt-0.5">
              Targeted Drills for {selectedPracticeTopic || 'Identified Weak Areas'}
            </h3>
            <p className="text-xs text-slate-500">
              Curated from the school's verified question bank to reinforce difficult concepts
            </p>
          </div>

          {selectedPracticeTopic && (
            <button
              type="button"
              onClick={() => setSelectedPracticeTopic(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
            >
              Reset to all weak topics
            </button>
          )}
        </div>

        {recommendedPracticeQuestions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No specific drills cataloged for this topic yet. Your teacher will assign focused quiz items shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPracticeQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {q.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Topic: <strong className="text-slate-700">{q.topic}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        q.difficulty === 'easy'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : q.difficulty === 'hard'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {q.difficulty || 'medium'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 leading-snug">{q.question}</p>

                  {q.type === 'mcq' && q.options && (
                    <div className="space-y-1 text-xs">
                      {q.options.slice(0, 4).map((opt, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700"
                        >
                          <span className="font-bold mr-1.5">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {q.explanation && (
                  <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Tip:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
