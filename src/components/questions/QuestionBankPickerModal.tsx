import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuestionBankItem, QuizQuestion, Subject } from '../../types';
import {
  Search,
  Filter,
  CheckCircle2,
  X,
  Plus,
  Layers,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface QuestionBankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestions: (questions: QuizQuestion[]) => void;
  filterSubject?: Subject;
}

export const QuestionBankPickerModal: React.FC<QuestionBankPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestions,
  filterSubject,
}) => {
  const { questionBank } = useApp();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>(filterSubject || 'All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const subjects = useMemo(() => {
    const set = new Set<string>();
    questionBank.forEach((q) => set.add(q.subject));
    return ['All', ...Array.from(set).sort()];
  }, [questionBank]);

  const filtered = useMemo(() => {
    return questionBank.filter((q) => {
      const matchesSearch =
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.topic.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === 'All' || q.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [questionBank, search, subjectFilter]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedBankItems = questionBank.filter((q) => selectedIds.has(q.id));
    const quizQuestions: QuizQuestion[] = selectedBankItems.map((item, idx) => ({
      id: `q-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      type: item.type,
      question: item.question,
      points: item.points || 1,
      options: item.options || [],
      correctAnswerIndex: item.correctAnswerIndex ?? 0,
      modelAnswer: item.modelAnswer,
      guidelines: item.guidelines,
      wordLimit: item.wordLimit,
      acceptableAnswers: item.acceptableAnswers,
      caseSensitive: item.caseSensitive,
      matchingPairs: item.matchingPairs,
      explanation: item.explanation,
    }));

    onSelectQuestions(quizQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Select Questions from Question Bank
              </h2>
              <p className="text-xs text-slate-500">
                Pick pre-made questions to add directly into your quiz.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question bank by keyword or topic..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  Subject: {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No questions found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Try a different search keyword or subject filter.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          item.type === 'mcq'
                            ? 'bg-blue-100 text-blue-800'
                            : item.type === 'structure'
                            ? 'bg-purple-100 text-purple-800'
                            : item.type === 'fill_in_blank'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.subject}
                      </span>
                      <span className="text-xs text-slate-500">{item.gradeLevel}</span>
                      <span className="ml-auto text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {item.points} {item.points === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {item.question}
                    </p>

                    {item.type === 'mcq' && item.options && (
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        Options: {item.options.join(' | ')}
                      </div>
                    )}
                    {item.type === 'structure' && item.modelAnswer && (
                      <div className="text-[11px] text-purple-700 line-clamp-1 italic">
                        Model: {item.modelAnswer}
                      </div>
                    )}
                    {item.type === 'fill_in_blank' && item.acceptableAnswers && (
                      <div className="text-[11px] text-emerald-700 line-clamp-1">
                        Answers: {item.acceptableAnswers.join(', ')}
                      </div>
                    )}
                    {item.type === 'matching' && item.matchingPairs && (
                      <div className="text-[11px] text-amber-800 line-clamp-1">
                        {item.matchingPairs.length} Matching Pairs
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {selectedIds.size} Question{selectedIds.size === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Selected to Quiz ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
