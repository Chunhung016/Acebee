import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuestionBankItem, QuestionType, Subject, QuestionDifficulty } from '../../types';
import { MarkdownBulkImportModal } from './MarkdownBulkImportModal';
import { SingleQuestionModal } from './SingleQuestionModal';
import { ParsedQuestionDraft } from '../../utils/markdownQuestionParser';
import { MathText } from '../common/MathRenderer';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckSquare,
  Square,
  Send,
  HelpCircle,
} from 'lucide-react';

interface QuestionBankViewProps {
  onCreateQuizFromQuestions?: (selectedQuestions: QuestionBankItem[]) => void;
}

const SUBJECT_LIST: (Subject | 'All')[] = [
  'All',
  'Mathematics',
  'Science',
  'English',
  'Bahasa Melayu',
  'History',
  'Geography',
  'Art',
  'Physical Education',
];

const QUESTION_TYPES: { id: QuestionType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'mcq', label: 'MCQ' },
  { id: 'structure', label: 'Structured' },
  { id: 'fill_in_blank', label: 'Fill in Blank' },
  { id: 'matching', label: 'Matching' },
];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ onCreateQuizFromQuestions }) => {
  const { questionBank, saveQuestionBankItem, bulkSaveQuestionBankItems, deleteQuestionBankItem, currentUser } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');

  // Modals state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  // Selection for Quiz Creation or Batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Distinct grade levels in bank
  const gradeLevels = useMemo(() => {
    const set = new Set<string>();
    questionBank.forEach((q) => {
      if (q.gradeLevel) set.add(q.gradeLevel);
    });
    return ['All', ...Array.from(set).sort()];
  }, [questionBank]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questionBank.filter((item) => {
      const matchesSearch =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesSubject = selectedSubject === 'All' || item.subject === selectedSubject;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesGrade = selectedGrade === 'All' || item.gradeLevel === selectedGrade;
      const matchesDifficulty =
        selectedDifficulty === 'all' || (item.difficulty || 'medium') === selectedDifficulty;

      return matchesSearch && matchesSubject && matchesType && matchesGrade && matchesDifficulty;
    });
  }, [questionBank, searchQuery, selectedSubject, selectedType, selectedGrade, selectedDifficulty]);

  const handleBulkImport = async (parsedDrafts: ParsedQuestionDraft[]) => {
    await bulkSaveQuestionBankItems(parsedDrafts);
  };

  const handleSaveSingle = async (
    item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string }
  ) => {
    await saveQuestionBankItem(item);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this question from the Question Bank?')) {
      await deleteQuestionBankItem(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const handleCreateQuizFromSelected = () => {
    if (onCreateQuizFromQuestions) {
      const selected = questionBank.filter((q) => selectedIds.has(q.id));
      onCreateQuizFromQuestions(selected);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Academic Question Bank</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {questionBank.length} Questions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Shared repository for teachers and administrators. Supports MCQ, Structured, Fill-in-the-blank, and Matching questions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Bulk Markdown Key-In
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingQuestion(null);
              setIsSingleModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Question
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, topic, or tag..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Subject Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as Subject | 'All')}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUBJECT_LIST.map((s) => (
                <option key={s} value={s}>
                  Subject: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {gradeLevels.map((g) => (
                <option key={g} value={g}>
                  Grade: {g}
                </option>
              ))}
            </select>
          </div>

          {/* Selection Bar Action */}
          <div className="md:col-span-2 flex items-center justify-end">
            {onCreateQuizFromQuestions && selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleCreateQuizFromSelected}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Create Quiz ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Question Type & Difficulty Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedType === t.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Difficulty:</span>
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedDifficulty === d
                      ? d === 'easy'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : d === 'hard'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : d === 'medium'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Select all toggle */}
          {filteredQuestions.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-50"
            >
              {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              Select All ({selectedIds.size}/{filteredQuestions.length})
            </button>
          )}
        </div>
      </div>

      {/* Questions List / Cards */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {questionBank.length === 0
              ? 'The question bank is currently empty. Use Bulk Markdown Key-In or click New Question to add questions.'
              : 'No questions match the current filter or search criteria. Try adjusting your filters.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl"
            >
              Bulk Markdown Key-In
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.map((q) => {
            const isSelected = selectedIds.has(q.id);
            return (
              <div
                key={q.id}
                onClick={() => handleToggleSelect(q.id)}
                className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20 bg-blue-50/10'
                    : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(q.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            q.type === 'mcq'
                              ? 'bg-blue-100 text-blue-800'
                              : q.type === 'structure'
                              ? 'bg-purple-100 text-purple-800'
                              : q.type === 'fill_in_blank'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {q.subject}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.difficulty === 'hard'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {q.difficulty || 'medium'}
                        </span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {q.gradeLevel}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Topic: <strong className="text-slate-700">{q.topic}</strong>
                        </span>
                        <span className="ml-auto text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {q.points} {q.points === 1 ? 'pt' : 'pts'}
                        </span>
                      </div>

                      {/* Question Text */}
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        <MathText text={q.question} inline={false} />
                      </h4>

                      {/* Type-Specific Preview */}
                      {q.type === 'mcq' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                                oIdx === q.correctAnswerIndex
                                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate leading-relaxed">
                                <MathText text={opt} />
                              </span>
                              {oIdx === q.correctAnswerIndex && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'structure' && (
                        <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                          {q.modelAnswer && (
                            <div>
                              <strong>Model Answer / Scheme:</strong> <MathText text={q.modelAnswer} />
                            </div>
                          )}
                          {q.guidelines && (
                            <p className="text-[11px] text-purple-700">
                              <strong>Marking Guidelines:</strong> {q.guidelines}
                            </p>
                          )}
                          {q.wordLimit && (
                            <p className="text-[11px] text-purple-600">
                              <strong>Word limit:</strong> {q.wordLimit} words
                            </p>
                          )}
                        </div>
                      )}

                      {q.type === 'fill_in_blank' && (
                        <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-0.5">
                          <div>
                            <strong>Acceptable Answers:</strong>{' '}
                            {q.acceptableAnswers?.join(', ') || 'None specified'}
                          </div>
                          {q.caseSensitive && (
                            <div className="text-[11px] text-emerald-700">
                              (Strict case sensitivity enforced)
                            </div>
                          )}
                        </div>
                      )}

                      {q.type === 'matching' && q.matchingPairs && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.matchingPairs.map((pair, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center justify-between p-2 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-950"
                            >
                              <span className="font-medium">{pair.left}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-600 mx-2 shrink-0" />
                              <span className="font-semibold text-amber-800">{pair.right}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation & Tags Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {q.tags &&
                            q.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          {q.explanation && (
                            <span className="italic text-slate-500 flex items-center gap-1">
                              Note: <MathText text={q.explanation} />
                            </span>
                          )}
                        </div>
                        <div>
                          Added by {q.createdByName || 'Staff'} •{' '}
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(q);
                        setIsSingleModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(q.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MarkdownBulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
        targetContext="bank"
        defaultSubject={selectedSubject === 'All' ? 'Mathematics' : selectedSubject}
        defaultGrade={selectedGrade === 'All' ? 'Year 5' : selectedGrade}
      />

      <SingleQuestionModal
        isOpen={isSingleModalOpen}
        onClose={() => {
          setIsSingleModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveSingle}
        editingItem={editingQuestion}
        defaultSubject={selectedSubject === 'All' ? 'Mathematics' : selectedSubject}
        defaultGrade={selectedGrade === 'All' ? 'Year 5' : selectedGrade}
      />
    </div>
  );
};
