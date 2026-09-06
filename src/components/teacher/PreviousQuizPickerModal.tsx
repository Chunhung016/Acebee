import React, { useState, useMemo } from 'react';
import { Quiz, QuizQuestion } from '../../types';
import { MathText } from '../common/MathRenderer';
import {
  X,
  Search,
  BookOpen,
  HelpCircle,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface PreviousQuizPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: Quiz[];
  currentSubject?: string;
  onImportQuestions: (importedQuestions: QuizQuestion[], sourceQuiz?: Quiz, cloneFullSettings?: boolean) => void;
}

export const PreviousQuizPickerModal: React.FC<PreviousQuizPickerModalProps> = ({
  isOpen,
  onClose,
  quizzes = [],
  currentSubject,
  onImportQuestions,
}) => {
  const safeQuizzes = quizzes || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Record<string, boolean>>({});

  // Filter quizzes
  const filteredQuizzes = useMemo(() => {
    return safeQuizzes.filter((qz) => {
      if (!qz) return false;
      const matchesSearch =
        (qz.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (qz.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (qz.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || qz.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [safeQuizzes, searchQuery, selectedSubject]);

  if (!isOpen) return null;

  const handleToggleExpand = (quizId: string) => {
    setExpandedQuizId((prev) => (prev === quizId ? null : quizId));
  };

  const handleToggleQuestionCheck = (qId: string) => {
    setSelectedQuestionIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleSelectAllInQuiz = (quiz: Quiz) => {
    const next = { ...selectedQuestionIds };
    const allSelected = quiz.questions.every((q) => next[q.id]);
    quiz.questions.forEach((q) => {
      next[q.id] = !allSelected;
    });
    setSelectedQuestionIds(next);
  };

  const handleImportAllFromQuiz = (quiz: Quiz, cloneFullSettings: boolean = false) => {
    // Clone questions with fresh IDs
    const cloned = quiz.questions.map((q, idx) => ({
      ...q,
      id: `q-imported-${Date.now()}-${idx}`,
    }));
    onImportQuestions(cloned, quiz, cloneFullSettings);
    onClose();
  };

  const handleImportSelected = (quiz: Quiz) => {
    const selected = quiz.questions.filter((q) => selectedQuestionIds[q.id]);
    if (selected.length === 0) return;
    const cloned = selected.map((q, idx) => ({
      ...q,
      id: `q-imported-${Date.now()}-${idx}`,
    }));
    onImportQuestions(cloned, quiz, false);
    onClose();
  };

  const allSubjects = Array.from(new Set(safeQuizzes.map((q) => q?.subject).filter(Boolean))) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Re-Use Question Sets from Previous Quizzes
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Select any past or ongoing quiz to import questions directly into your active draft
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past quizzes by title, subject, or keywords..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-700 w-full sm:w-auto"
            >
              <option value="all">All Subjects ({quizzes.length})</option>
              {allSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {filteredQuizzes.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No matching quizzes found</p>
              <p className="text-[11px] text-slate-400">
                Try clearing your search query or subject filter.
              </p>
            </div>
          ) : (
            filteredQuizzes.map((qz) => {
              const isExpanded = expandedQuizId === qz.id;
              const selectedCount = qz.questions.filter((q) => selectedQuestionIds[q.id]).length;
              const totalPts = qz.questions.reduce((sum, q) => sum + (q.points || 1), 0);

              return (
                <div
                  key={qz.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:border-blue-300 transition-all"
                >
                  {/* Quiz Summary Card Bar */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {qz.subject}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {qz.questions.length} Questions
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {totalPts} Points
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Due: {new Date(qz.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{qz.title}</h4>
                      {qz.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{qz.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(qz.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            <span>Hide Preview</span>
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            <span>Preview Questions</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleImportAllFromQuiz(qz, false)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Append all questions to your current draft"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Use All ({qz.questions.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleImportAllFromQuiz(qz, true)}
                        className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Duplicate quiz title, subject, settings, and questions"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Clone Full Quiz</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Questions Preview Accordion */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-200 bg-white space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectAllInQuiz(qz)}
                            className="text-blue-700 hover:underline font-bold text-xs"
                          >
                            {qz.questions.every((q) => selectedQuestionIds[q.id])
                              ? 'Deselect All'
                              : 'Select All Questions'}
                          </button>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">
                            {selectedCount} of {qz.questions.length} selected
                          </span>
                        </div>

                        {selectedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleImportSelected(qz)}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Import Selected ({selectedCount}) Questions</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {qz.questions.map((q, qIdx) => {
                          const isChecked = Boolean(selectedQuestionIds[q.id]);
                          return (
                            <label
                              key={q.id}
                              className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                                isChecked
                                  ? 'border-blue-500 bg-blue-50/50'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleQuestionCheck(q.id)}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                              />

                              <div className="space-y-1 flex-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-800">Q{qIdx + 1}</span>
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    {q.type || 'mcq'}
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-700">
                                    {q.points || 1} pt(s)
                                  </span>
                                </div>

                                <div className="font-semibold text-slate-900 leading-snug">
                                  <MathText text={q.question} />
                                </div>

                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px] text-slate-600">
                                    {q.options.map((opt, oIdx) => (
                                      <div
                                        key={oIdx}
                                        className={`px-2 py-0.5 rounded flex items-center gap-1.5 ${
                                          oIdx === q.correctAnswerIndex
                                            ? 'bg-emerald-100/80 text-emerald-900 font-bold'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        <span className="text-[10px] opacity-75">
                                          {String.fromCharCode(65 + oIdx)}.
                                        </span>
                                        <span>
                                          <MathText text={opt} />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{quizzes.length} Quizzes available for re-use</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
