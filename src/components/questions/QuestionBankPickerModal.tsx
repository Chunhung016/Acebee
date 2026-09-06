import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuestionBankItem, QuizQuestion, Subject } from '../../types';
import { MathText } from '../common/MathRenderer';
import { removeDollarDelimiters } from '../../utils/mathParser';
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
  defaultSubject?: Subject;
}

export const QuestionBankPickerModal: React.FC<QuestionBankPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestions,
  filterSubject,
  defaultSubject,
}) => {
  const { questionBank } = useApp();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>(filterSubject || defaultSubject || 'All');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const subjects = useMemo(() => {
    const set = new Set<string>();
    questionBank.forEach((q) => set.add(q.subject));
    return ['All', ...Array.from(set).sort()];
  }, [questionBank]);

  const availableTopics = useMemo(() => {
    const map = new Map<string, number>();
    questionBank.forEach((q) => {
      if (subjectFilter === 'All' || q.subject === subjectFilter) {
        if (q.topic) {
          map.set(q.topic, (map.get(q.topic) || 0) + 1);
        }
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [questionBank, subjectFilter]);

  const filtered = useMemo(() => {
    return questionBank.filter((q) => {
      const qText = search.trim().toLowerCase();
      const matchesSearch =
        !qText ||
        q.question.toLowerCase().includes(qText) ||
        q.topic.toLowerCase().includes(qText);
      const matchesSubject = subjectFilter === 'All' || q.subject === subjectFilter;
      const matchesTopic = topicFilter === 'All' || q.topic === topicFilter;
      const matchesType = typeFilter === 'all' || q.type === typeFilter;
      return matchesSearch && matchesSubject && matchesTopic && matchesType;
    });
  }, [questionBank, search, subjectFilter, topicFilter, typeFilter]);

  // Group filtered questions by topic (or subject)
  const groupedQuestions = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((item) => {
      const groupKey = item.topic ? `${item.subject} • ${item.topic}` : item.subject;
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(item);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      groupKey: key,
      items,
    }));
  }, [filtered]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (items: typeof filtered) => {
    const allSelected = items.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      items.forEach((i) => {
        if (allSelected) {
          next.delete(i.id);
        } else {
          next.add(i.id);
        }
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((q) => q.id)));
    }
  };

  const handleConfirm = () => {
    const selectedBankItems = questionBank.filter((q) => selectedIds.has(q.id));
    const quizQuestions: QuizQuestion[] = selectedBankItems.map((item, idx) => ({
      id: `q-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      type: item.type,
      difficulty: item.difficulty || 'medium',
      topic: item.topic || 'General',
      question: removeDollarDelimiters(item.question),
      points: item.points || 1,
      imageUrl: item.imageUrl,
      options: item.options ? item.options.map(removeDollarDelimiters) : [],
      correctAnswerIndex: item.correctAnswerIndex ?? 0,
      modelAnswer: item.modelAnswer ? removeDollarDelimiters(item.modelAnswer) : undefined,
      guidelines: item.guidelines ? removeDollarDelimiters(item.guidelines) : undefined,
      wordLimit: item.wordLimit,
      acceptableAnswers: item.acceptableAnswers ? item.acceptableAnswers.map(removeDollarDelimiters) : undefined,
      caseSensitive: item.caseSensitive,
      matchingPairs: item.matchingPairs
        ? item.matchingPairs.map((p) => ({ id: p.id, left: removeDollarDelimiters(p.left), right: removeDollarDelimiters(p.right) }))
        : undefined,
      explanation: item.explanation ? removeDollarDelimiters(item.explanation) : undefined,
    }));

    onSelectQuestions(quizQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
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
                Categorized by curriculum subject and chapter topics. Pick questions to add to this quiz.
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
        <div className="px-6 py-3 border-b border-slate-200 bg-white space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search question bank by keyword, topic, or formula..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setTopicFilter('All');
                }}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Subjects' : s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Formats</option>
                <option value="mcq">MCQ</option>
                <option value="structure">Structured / Essay</option>
                <option value="fill_in_blank">Fill in Blank</option>
                <option value="matching">Matching Pairs</option>
              </select>
            </div>
          </div>

          {/* Topic chips ribbon */}
          {availableTopics.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-thin">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Topics:
              </span>
              <button
                type="button"
                onClick={() => setTopicFilter('All')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  topicFilter === 'All'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Topics
              </button>
              {availableTopics.map(([top, count]) => (
                <button
                  key={top}
                  type="button"
                  onClick={() => setTopicFilter(top)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                    topicFilter === top
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{top}</span>
                  <span className={`text-[10px] ${topicFilter === top ? 'text-blue-200' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick select all bar */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Showing {filtered.length} matching questions</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {selectedIds.size === filtered.length && filtered.length > 0
                  ? 'Deselect All'
                  : `Select All (${filtered.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Questions list categorized by group */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No questions found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Try a different search keyword, topic, or subject filter.
              </p>
            </div>
          ) : (
            groupedQuestions.map((group) => {
              const allInGroupSelected = group.items.every((i) => selectedIds.has(i.id));
              return (
                <div key={group.groupKey} className="space-y-2">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      {group.groupKey}
                      <span className="text-[10px] font-normal text-slate-500">
                        ({group.items.length})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSelectGroup(group.items)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      {allInGroupSelected ? 'Deselect Category' : 'Select Category'}
                    </button>
                  </div>

                  {/* Group Items */}
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
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

                            <div className="text-xs font-semibold text-slate-900 leading-snug">
                              <MathText text={removeDollarDelimiters(item.question)} />
                            </div>

                            {item.imageUrl && (
                              <div className="my-1.5 max-w-[160px] rounded border border-slate-200 p-1 bg-slate-50">
                                <img
                                  src={item.imageUrl}
                                  alt="Visual aid"
                                  className="max-h-[70px] object-contain rounded"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            {item.type === 'mcq' && item.options && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                                <span>Options:</span>
                                {item.options.map((opt, oIdx) => (
                                  <span key={oIdx} className="inline-flex items-center">
                                    {oIdx > 0 && <span className="mx-1 text-slate-300">|</span>}
                                    <MathText text={removeDollarDelimiters(opt)} />
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.type === 'structure' && item.modelAnswer && (
                              <div className="text-[11px] text-purple-700 line-clamp-1 italic">
                                Model: {removeDollarDelimiters(item.modelAnswer)}
                              </div>
                            )}
                            {item.type === 'fill_in_blank' && item.acceptableAnswers && (
                              <div className="text-[11px] text-emerald-700 line-clamp-1">
                                Answers: {item.acceptableAnswers.map(removeDollarDelimiters).join(', ')}
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
                    })}
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
