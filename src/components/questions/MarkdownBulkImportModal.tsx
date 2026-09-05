import React, { useState, useMemo, useRef } from 'react';
import { parseMarkdownQuestions, SAMPLE_MARKDOWN_TEMPLATES, ParsedQuestionDraft } from '../../utils/markdownQuestionParser';
import { Subject, QuizQuestion } from '../../types';
import { MathText, MathToolbar } from '../common/MathRenderer';
import { removeDollarDelimiters } from '../../utils/mathParser';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  HelpCircle,
  Layers,
  ArrowRight,
  Clipboard,
  Eraser,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2,
  Check,
} from 'lucide-react';

interface MarkdownBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (questions: ParsedQuestionDraft[]) => void;
  onImportQuestions?: (questions: QuizQuestion[]) => void;
  targetContext?: 'bank' | 'quiz';
  defaultSubject?: Subject;
  defaultGrade?: string;
}

export const MarkdownBulkImportModal: React.FC<MarkdownBulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onImportQuestions,
  targetContext = 'bank',
  defaultSubject = 'Mathematics',
  defaultGrade = 'Year 5',
}) => {
  const [markdownText, setMarkdownText] = useState<string>(SAMPLE_MARKDOWN_TEMPLATES.ALL_TYPES);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSyntaxExpanded, setIsSyntaxExpanded] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base'); // default base (16px) prevents iOS auto-zoom
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parseResult = useMemo(() => {
    return parseMarkdownQuestions(markdownText, defaultSubject, defaultGrade);
  }, [markdownText, defaultSubject, defaultGrade]);

  if (!isOpen) return null;

  const showTemporaryNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleLoadTemplate = (templateKey: keyof typeof SAMPLE_MARKDOWN_TEMPLATES) => {
    setMarkdownText(SAMPLE_MARKDOWN_TEMPLATES[templateKey]);
    setCopiedTemplate(templateKey);
    showTemporaryNotice(`Loaded ${templateKey.replace(/_/g, ' ')} template`);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setMarkdownText(text);
          showTemporaryNotice('Pasted from clipboard!');
          return;
        }
      }
      showTemporaryNotice('Clipboard was empty or inaccessible');
    } catch {
      showTemporaryNotice('Please tap inside the box and paste directly');
    }
  };

  const handleCleanDollarSigns = () => {
    const cleaned = removeDollarDelimiters(markdownText);
    setMarkdownText(cleaned);
    showTemporaryNotice('Removed all $ and delimiters!');
  };

  const handleClearText = () => {
    setMarkdownText('');
    showTemporaryNotice('Cleared text');
  };

  const handleConfirmImport = () => {
    if (parseResult.questions.length === 0) return;

    if (onImport) {
      onImport(parseResult.questions);
    }

    if (onImportQuestions) {
      const converted: QuizQuestion[] = parseResult.questions.map((q, idx) => ({
        id: `q-bulk-${Date.now()}-${idx}`,
        type: q.type,
        difficulty: q.difficulty || 'medium',
        topic: q.topic || 'General',
        question: q.question,
        points: q.points || 1,
        imageUrl: q.imageUrl,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        modelAnswer: q.modelAnswer,
        guidelines: q.guidelines,
        acceptableAnswers: q.acceptableAnswers,
        caseSensitive: q.caseSensitive,
        matchingPairs: q.matchingPairs
          ? q.matchingPairs.map((p, pIdx) => ({ id: `pair-${pIdx}`, left: p.left, right: p.right }))
          : undefined,
        explanation: q.explanation,
      }));
      onImportQuestions(converted);
    }

    onClose();
  };

  const fontSizeClass =
    fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm ${
        isFullscreen ? 'p-0' : 'p-0 sm:p-3 lg:p-6'
      }`}
    >
      <div
        className={`bg-white shadow-2xl border border-slate-200 w-full flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'h-[100dvh] max-h-[100dvh] rounded-none'
            : 'h-[100dvh] sm:h-[92vh] max-h-[100dvh] sm:max-h-[94vh] max-w-6xl rounded-none sm:rounded-2xl'
        }`}
      >
        {/* Header - Compact for Mobile */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Bulk Question Key-In
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                  {targetContext === 'bank' ? 'Question Bank' : 'Quiz'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Rapidly key in or paste questions for MCQ, Structure, Fill-in-the-blank, and Matching.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 transition-colors hidden sm:flex items-center"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Editor'}
              id="bulk-modal-fullscreen-toggle"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              id="bulk-modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar - Optimized with Horizontal Scrolling on iPhone */}
        <div className="px-3 sm:px-6 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            <span className="font-semibold text-slate-600 text-[11px] flex items-center gap-1 shrink-0 mr-0.5">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Templates:
            </span>
            <button
              type="button"
              onClick={() => handleLoadTemplate('ALL_TYPES')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors shrink-0 ${
                copiedTemplate === 'ALL_TYPES'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => handleLoadTemplate('MCQ_ONLY')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors shrink-0 ${
                copiedTemplate === 'MCQ_ONLY'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              MCQ
            </button>
            <button
              type="button"
              onClick={() => handleLoadTemplate('STRUCTURE_ONLY')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors shrink-0 ${
                copiedTemplate === 'STRUCTURE_ONLY'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              Structure
            </button>
            <button
              type="button"
              onClick={() => handleLoadTemplate('FILL_IN_BLANK')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors shrink-0 ${
                copiedTemplate === 'FILL_IN_BLANK'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              Blank
            </button>
            <button
              type="button"
              onClick={() => handleLoadTemplate('MATCHING_ONLY')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors shrink-0 ${
                copiedTemplate === 'MATCHING_ONLY'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              Matching
            </button>
          </div>

          {/* Utility Tools: Paste, Clean $, Clear */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {actionNotice && (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fade-in shrink-0">
                <Check className="w-3 h-3" />
                {actionNotice}
              </span>
            )}

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px] flex items-center gap-1 shadow-2xs shrink-0"
              title="Paste from clipboard"
              id="bulk-paste-btn"
            >
              <Clipboard className="w-3.5 h-3.5 text-blue-600" />
              <span>Paste</span>
            </button>

            <button
              type="button"
              onClick={handleCleanDollarSigns}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px] flex items-center gap-1 shadow-2xs shrink-0"
              title="Strip raw $ math delimiters"
              id="bulk-clean-dollar-btn"
            >
              <Eraser className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Clean</span> $
            </button>

            <button
              type="button"
              onClick={handleClearText}
              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors shrink-0"
              title="Clear input"
              id="bulk-clear-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Tabs Switcher */}
        <div className="flex border-b border-slate-200 lg:hidden bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all ${
              activeTab === 'editor'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Markdown Key-In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2.5 text-center text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Live Preview
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                parseResult.questions.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {parseResult.questions.length}
            </span>
          </button>
        </div>

        {/* Content Body: Split Screen (Editor & Live Parsed Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden min-h-0">
          {/* Left Column: Markdown Editor */}
          <div
            className={`flex flex-col p-3 sm:p-4 bg-white overflow-hidden gap-2 h-full ${
              activeTab === 'editor' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Sub-header with font size & line counter */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Input Area
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {markdownText.split('\n').length} lines • {markdownText.length} chars
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-400 mr-1 hidden sm:inline">Text Size:</span>
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-1.5 py-0.5 rounded font-mono ${
                    fontSize === 'sm' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('base')}
                  className={`px-1.5 py-0.5 rounded font-mono ${
                    fontSize === 'base' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-1.5 py-0.5 rounded font-mono ${
                    fontSize === 'lg' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Math quick tool buttons */}
            <div className="shrink-0">
              <MathToolbar
                compact
                onInsert={(snippet) => {
                  setMarkdownText((prev) => prev + snippet);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
              />
            </div>

            {/* Expansive Textarea (Fills all available height) */}
            <textarea
              ref={textareaRef}
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="Paste or type markdown questions here... (e.g. ### MCQ | Mathematics | Year 5 | 2 pts)"
              className={`flex-1 w-full h-full p-3 font-mono ${fontSizeClass} text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none resize-none leading-relaxed transition-all shadow-inner`}
              id="bulk-markdown-textarea"
            />

            {/* Collapsible Syntax Guide - Does not steal space on iPhone */}
            <div className="shrink-0 border border-blue-100 bg-blue-50/50 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setIsSyntaxExpanded(!isSyntaxExpanded)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-blue-900 hover:bg-blue-100/60 transition-colors"
                id="bulk-syntax-guide-toggle"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  Markdown Syntax Quick Guide
                </span>
                {isSyntaxExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isSyntaxExpanded && (
                <div className="p-3 border-t border-blue-100 bg-white/70 text-[11px] text-blue-950 space-y-1 font-mono leading-relaxed">
                  <p className="font-sans font-semibold text-slate-700">Quick Structure Format:</p>
                  <div>
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                      ### MCQ | Subject | Grade | 2 pts | Topic
                    </code>
                  </div>
                  <div>
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">- [x] Correct Option</code>{' '}
                    and <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">- [ ] Other Option</code>
                  </div>
                  <div>
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">- Left Term -&gt; Right Match</code>{' '}
                    (Matching)
                  </div>
                  <div>
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">The answer is [Paris].</code> (Fill in
                    Blank)
                  </div>
                  <div>
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">&gt; Model: ... &gt; Guidelines: ...</code>{' '}
                    (Structure)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Parsed Preview */}
          <div
            className={`flex flex-col p-3 sm:p-4 bg-slate-50 overflow-hidden h-full ${
              activeTab === 'preview' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Live Preview
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    parseResult.questions.length > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {parseResult.questions.length} Question{parseResult.questions.length === 1 ? '' : 's'}
                </span>
              </div>
              {parseResult.errors.length > 0 && (
                <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {parseResult.errors.length} Alert{parseResult.errors.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {/* Parsing Errors Warning */}
            {parseResult.errors.length > 0 && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 space-y-0.5 shrink-0">
                {parseResult.errors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Parsed Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {parseResult.questions.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <Layers className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No questions parsed yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Choose a sample template above or paste formatted markdown to preview parsed cards instantly.
                  </p>
                </div>
              ) : (
                parseResult.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-blue-200 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            q.type === 'mcq'
                              ? 'bg-blue-100 text-blue-700'
                              : q.type === 'structure'
                              ? 'bg-purple-100 text-purple-700'
                              : q.type === 'fill_in_blank'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {q.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {q.subject} • {q.gradeLevel}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {q.points} {q.points === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      <MathText text={q.question} />
                    </div>

                    {/* MCQ Options preview */}
                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-1.5 rounded border text-[11px] flex items-center gap-2 ${
                              optIdx === q.correctAnswerIndex
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border text-[10px] flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="truncate">
                              <MathText text={opt} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Structure details preview */}
                    {q.type === 'structure' && (q.modelAnswer || q.guidelines) && (
                      <div className="p-2 bg-purple-50/60 rounded border border-purple-100 text-[11px] text-purple-950 space-y-1">
                        {q.modelAnswer && (
                          <div>
                            <strong>Model Answer:</strong> <MathText text={q.modelAnswer} />
                          </div>
                        )}
                        {q.guidelines && (
                          <div>
                            <strong>Guidelines:</strong> <MathText text={q.guidelines} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fill in Blank preview */}
                    {q.type === 'fill_in_blank' && q.acceptableAnswers && (
                      <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100 text-[11px] text-emerald-900">
                        <strong>Accepted Answers:</strong> {q.acceptableAnswers.join(', ')}
                      </div>
                    )}

                    {/* Matching Pairs preview */}
                    {q.type === 'matching' && q.matchingPairs && (
                      <div className="space-y-1 pt-1">
                        {q.matchingPairs.map((pair, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center justify-between p-1.5 bg-amber-50/60 border border-amber-200/80 rounded text-[11px] text-amber-950"
                          >
                            <span className="font-medium">
                              <MathText text={pair.left} />
                            </span>
                            <ArrowRight className="w-3 h-3 text-amber-600 mx-2 shrink-0" />
                            <span className="font-semibold text-amber-800">
                              <MathText text={pair.right} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded flex items-center gap-1">
                        <strong>Explanation:</strong> <MathText text={q.explanation} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {parseResult.questions.length > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Ready: <strong>{parseResult.questions.length}</strong> question
                  {parseResult.questions.length === 1 ? '' : 's'}
                </span>
              </span>
            ) : (
              <span className="text-[11px]">Type or paste questions to import</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parseResult.questions.length === 0}
              onClick={handleConfirmImport}
              className="px-4 sm:px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5"
              id="bulk-confirm-import-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Import ({parseResult.questions.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
