import React, { useState, useEffect } from 'react';
import { QuestionBankItem, QuestionType, Subject, MatchingPair, QuestionDifficulty } from '../../types';
import { MathToolbar, MathLivePreview, MathText } from '../common/MathRenderer';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  Hash,
  ArrowRight,
} from 'lucide-react';

interface SingleQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string }) => void;
  editingItem?: QuestionBankItem | null;
  defaultSubject?: Subject;
  defaultGrade?: string;
}

const SUBJECT_LIST: Subject[] = [
  'Mathematics',
  'Science',
  'English',
  'Bahasa Melayu',
  'History',
  'Geography',
  'Art',
  'Physical Education',
];

const GRADE_LEVELS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'];

export const SingleQuestionModal: React.FC<SingleQuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  defaultSubject = 'Mathematics',
  defaultGrade = 'Year 5',
}) => {
  const [type, setType] = useState<QuestionType>('mcq');
  const [subject, setSubject] = useState<Subject>(defaultSubject);
  const [gradeLevel, setGradeLevel] = useState<string>(defaultGrade);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [topic, setTopic] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [explanation, setExplanation] = useState<string>('');

  // MCQ state
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);

  // Structure state
  const [modelAnswer, setModelAnswer] = useState<string>('');
  const [guidelines, setGuidelines] = useState<string>('');
  const [wordLimit, setWordLimit] = useState<number | undefined>(undefined);

  // Fill in blank state
  const [acceptableAnswersText, setAcceptableAnswersText] = useState<string>('');
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);

  // Matching state
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([
    { left: '', right: '' },
    { left: '', right: '' },
  ]);

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setSubject(editingItem.subject);
      setGradeLevel(editingItem.gradeLevel);
      setDifficulty(editingItem.difficulty || 'medium');
      setTopic(editingItem.topic || '');
      setTags(editingItem.tags ? editingItem.tags.join(', ') : '');
      setQuestion(editingItem.question);
      setPoints(editingItem.points || 1);
      setExplanation(editingItem.explanation || '');

      if (editingItem.options) setOptions(editingItem.options);
      if (editingItem.correctAnswerIndex !== undefined) setCorrectAnswerIndex(editingItem.correctAnswerIndex);
      if (editingItem.modelAnswer) setModelAnswer(editingItem.modelAnswer);
      if (editingItem.guidelines) setGuidelines(editingItem.guidelines);
      if (editingItem.wordLimit) setWordLimit(editingItem.wordLimit);
      if (editingItem.acceptableAnswers) setAcceptableAnswersText(editingItem.acceptableAnswers.join(', '));
      if (editingItem.caseSensitive !== undefined) setCaseSensitive(editingItem.caseSensitive);
      if (editingItem.matchingPairs) setMatchingPairs(editingItem.matchingPairs);
    } else {
      setType('mcq');
      setSubject(defaultSubject);
      setGradeLevel(defaultGrade);
      setTopic('');
      setTags('');
      setQuestion('');
      setPoints(1);
      setExplanation('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setModelAnswer('');
      setGuidelines('');
      setWordLimit(undefined);
      setAcceptableAnswersText('');
      setCaseSensitive(false);
      setMatchingPairs([
        { left: '', right: '' },
        { left: '', right: '' },
      ]);
    }
  }, [editingItem, isOpen, defaultSubject, defaultGrade]);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const copy = [...options];
    copy[idx] = val;
    setOptions(copy);
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      const copy = options.filter((_, i) => i !== idx);
      setOptions(copy);
      if (correctAnswerIndex >= copy.length) {
        setCorrectAnswerIndex(0);
      }
    }
  };

  const handlePairChange = (idx: number, field: 'left' | 'right', val: string) => {
    const copy = [...matchingPairs];
    copy[idx] = { ...copy[idx], [field]: val };
    setMatchingPairs(copy);
  };

  const handleAddPair = () => {
    setMatchingPairs([...matchingPairs, { left: '', right: '' }]);
  };

  const handleRemovePair = (idx: number) => {
    if (matchingPairs.length > 2) {
      setMatchingPairs(matchingPairs.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string } = {
      ...(editingItem ? { id: editingItem.id } : {}),
      type,
      subject,
      gradeLevel,
      difficulty,
      topic: topic.trim() || 'General',
      tags: parsedTags,
      question: question.trim(),
      points: Number(points) || 1,
      explanation: explanation.trim() || undefined,
    };

    if (type === 'mcq') {
      payload.options = options.map((o) => o.trim()).filter(Boolean);
      payload.correctAnswerIndex = correctAnswerIndex;
    } else if (type === 'structure') {
      payload.modelAnswer = modelAnswer.trim() || undefined;
      payload.guidelines = guidelines.trim() || undefined;
      payload.wordLimit = wordLimit ? Number(wordLimit) : undefined;
    } else if (type === 'fill_in_blank') {
      payload.acceptableAnswers = acceptableAnswersText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      payload.caseSensitive = caseSensitive;
    } else if (type === 'matching') {
      payload.matchingPairs = matchingPairs.filter((p) => p.left.trim() && p.right.trim());
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingItem ? 'Edit Question' : 'Create New Question'}
            </h2>
            <p className="text-xs text-slate-500">
              Add a single question item with custom scoring rubrics to the central question bank.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Question Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Question Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'mcq', label: 'MCQ (Single Choice)', color: 'blue' },
                  { id: 'structure', label: 'Structured / Essay', color: 'purple' },
                  { id: 'fill_in_blank', label: 'Fill in Blank', color: 'emerald' },
                  { id: 'matching', label: 'Matching Pairs', color: 'amber' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    type === t.id
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject, Grade, Topic, Difficulty, Points Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUBJECT_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Fractions"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Points</label>
              <input
                type="number"
                min="1"
                max="50"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Prompt / Description *
              </label>
              <span className="text-[11px] text-slate-400">
                Supports LaTeX: <code className="text-blue-700">\frac{'{'}a{'}'}{'{'}b{'}'}</code>, <code className="text-blue-700">\sqrt{'{'}x{'}'}</code>, or natural <code className="text-blue-700">3/8</code>, <code className="text-blue-700">x^2</code>
              </span>
            </div>

            {/* Quick Math Tools */}
            <MathToolbar
              compact
              onInsert={(snippet) => {
                setQuestion((prev) => prev + snippet);
              }}
            />

            <textarea
              required
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the question text here... (e.g. Find the value of 3/8 + 2/5 or simplify sqrt(75))"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Math Live Preview */}
            <MathLivePreview rawText={question} />
          </div>

          {/* TYPE-SPECIFIC FIELDS */}

          {/* 1. MCQ Options */}
          {type === 'mcq' && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900">
                  Multiple Choice Options (Select the correct answer)
                </label>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctAnswerIndex === idx}
                      onChange={() => setCorrectAnswerIndex(idx)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <span className="w-6 text-xs font-bold text-slate-500">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Structured / Essay */}
          {type === 'structure' && (
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Model Answer / Marking Scheme
                </label>
                <textarea
                  rows={2}
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="Expected answer or key points teacher will check..."
                  className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <MathLivePreview rawText={modelAnswer} label="Model Answer Math Preview" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-purple-900 mb-1">
                    Grading Guidelines / Rubric
                  </label>
                  <input
                    type="text"
                    value={guidelines}
                    onChange={(e) => setGuidelines(e.target.value)}
                    placeholder="e.g. 1 mark for formula, 1 mark for final value"
                    className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-900 mb-1">
                    Word Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={wordLimit || ''}
                    onChange={(e) => setWordLimit(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 100"
                    className="w-full text-xs p-2 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Fill in Blank */}
          {type === 'fill_in_blank' && (
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  Acceptable Answers (Comma separated for variations) *
                </label>
                <input
                  type="text"
                  required
                  value={acceptableAnswersText}
                  onChange={(e) => setAcceptableAnswersText(e.target.value)}
                  placeholder="e.g. Paris, paris, Capital of France"
                  className="w-full text-xs p-2 rounded-lg border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-emerald-700 mt-1">
                  If the student's answer matches any of these phrases, it will be marked correct in auto mode.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                Case sensitive matching (exact capitalization required)
              </label>
            </div>
          )}

          {/* 4. Matching Pairs */}
          {type === 'matching' && (
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900">
                  Matching Pairs (Left Item matches Right Item)
                </label>
                <button
                  type="button"
                  onClick={handleAddPair}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Pair
                </button>
              </div>
              <div className="space-y-2">
                {matchingPairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={pair.left}
                      onChange={(e) => handlePairChange(idx, 'left', e.target.value)}
                      placeholder={`Left Item ${idx + 1}`}
                      className="flex-1 text-xs p-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <ArrowRight className="w-4 h-4 text-amber-600 shrink-0" />
                    <input
                      type="text"
                      required
                      value={pair.right}
                      onChange={(e) => handlePairChange(idx, 'right', e.target.value)}
                      placeholder={`Right Match ${idx + 1}`}
                      className="flex-1 text-xs p-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {matchingPairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePair(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Explanation (Shown after review)
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Why this answer is correct..."
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. algebra, exam, chapter1"
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all"
            >
              {editingItem ? 'Update Question' : 'Save to Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
