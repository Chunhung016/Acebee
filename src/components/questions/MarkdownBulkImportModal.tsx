import React, { useState, useMemo } from 'react';
import { parseMarkdownQuestions, SAMPLE_MARKDOWN_TEMPLATES, ParsedQuestionDraft } from '../../utils/markdownQuestionParser';
import { Subject, QuestionType } from '../../types';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  HelpCircle,
  Copy,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface MarkdownBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: ParsedQuestionDraft[]) => void;
  targetContext?: 'bank' | 'quiz';
  defaultSubject?: Subject;
  defaultGrade?: string;
}

export const MarkdownBulkImportModal: React.FC<MarkdownBulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  targetContext = 'bank',
  defaultSubject = 'Mathematics',
  defaultGrade = 'Year 5',
}) => {
  const [markdownText, setMarkdownText] = useState<string>(SAMPLE_MARKDOWN_TEMPLATES.ALL_TYPES);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const parseResult = useMemo(() => {
    return parseMarkdownQuestions(markdownText, defaultSubject, defaultGrade);
  }, [markdownText, defaultSubject, defaultGrade]);

  if (!isOpen) return null;

  const handleLoadTemplate = (templateKey: keyof typeof SAMPLE_MARKDOWN_TEMPLATES) => {
    setMarkdownText(SAMPLE_MARKDOWN_TEMPLATES[templateKey]);
    setCopiedTemplate(templateKey);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const handleConfirmImport = () => {
    if (parseResult.questions.length === 0) return;
    onImport(parseResult.questions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Markdown Bulk Key-In & Import
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {targetContext === 'bank' ? 'Add to Question Bank' : 'Import to Quiz'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Rapidly key in or paste Markdown formatted questions for MCQ, Structure, Fill-in-the-blank, and Matching.
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

        {/* Template Quick Actions */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Load Sample Templates:
          </span>
          <button
            type="button"
            onClick={() => handleLoadTemplate('ALL_TYPES')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition-colors"
          >
            All 4 Question Types
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('MCQ_ONLY')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition-colors"
          >
            MCQ Only
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('STRUCTURE_ONLY')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition-colors"
          >
            Structured (Essay/Rubric)
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('FILL_IN_BLANK')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition-colors"
          >
            Fill in the Blank
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('MATCHING_ONLY')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-medium transition-colors"
          >
            Matching Pairs
          </button>
          {copiedTemplate && (
            <span className="ml-auto text-emerald-600 font-medium animate-pulse">
              Template loaded!
            </span>
          )}
        </div>

        {/* Content Body: Split Screen (Editor & Live Parsed Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden min-h-[380px]">
          {/* Left Column: Markdown Editor */}
          <div className="flex flex-col p-4 bg-white overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Markdown Key-In Editor
              </label>
              <div className="text-[11px] text-slate-400 font-mono">
                {markdownText.split('\n').length} lines
              </div>
            </div>
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="Paste or type markdown here... (e.g. ### MCQ | Mathematics | Year 5 | 2 pts)"
              className="flex-1 w-full p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none resize-none leading-relaxed transition-all"
            />
            <div className="mt-3 p-2.5 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] text-blue-900 leading-normal flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Markdown Quick Syntax:</strong>
                <br />
                <code className="text-blue-700">### MCQ | Subject | Grade | 2 pts | Topic</code>
                <br />
                <code className="text-blue-700">- [x] Correct Option</code> and <code className="text-blue-700">- [ ] Other Option</code>
                <br />
                <code className="text-blue-700">- Left Term -&gt; Right Match</code> (for Matching)
                <br />
                <code className="text-blue-700">The capital is [Paris].</code> (for Fill in Blank)
                <br />
                <code className="text-blue-700">&gt; Model: ... &gt; Guidelines: ...</code> (for Structure)
              </div>
            </div>
          </div>

          {/* Right Column: Live Parsed Preview */}
          <div className="flex flex-col p-4 bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Live Preview & Detection
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    parseResult.questions.length > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {parseResult.questions.length} Question{parseResult.questions.length === 1 ? '' : 's'} Detected
                </span>
              </div>
              {parseResult.errors.length > 0 && (
                <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {parseResult.errors.length} Warning{parseResult.errors.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {/* Parsing Errors Warning */}
            {parseResult.errors.length > 0 && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 space-y-0.5">
                {parseResult.errors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Parsed Cards List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {parseResult.questions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <Layers className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No questions parsed yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click one of the sample template buttons above or paste valid Markdown.
                  </p>
                </div>
              ) : (
                parseResult.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
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

                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </p>

                    {/* MCQ Options preview */}
                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 rounded text-[11px] flex items-center gap-1.5 border ${
                              oIdx === q.correctAnswerIndex
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-white border border-slate-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                            {oIdx === q.correctAnswerIndex && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Structure model preview */}
                    {q.type === 'structure' && (
                      <div className="p-2 bg-purple-50/60 rounded border border-purple-100 text-[11px] text-purple-900 space-y-1">
                        {q.modelAnswer && (
                          <p>
                            <strong>Model Answer:</strong> {q.modelAnswer}
                          </p>
                        )}
                        {q.guidelines && (
                          <p className="text-[10px] text-purple-700">
                            <strong>Rubrics:</strong> {q.guidelines}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Fill in Blank acceptable answers preview */}
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
                            <span className="font-medium">{pair.left}</span>
                            <ArrowRight className="w-3 h-3 text-amber-600 mx-2 shrink-0" />
                            <span className="font-semibold text-amber-800">{pair.right}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parseResult.questions.length > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ready to import {parseResult.questions.length} question
                {parseResult.questions.length === 1 ? '' : 's'}
              </span>
            ) : (
              <span>Write or paste questions above to see live preview.</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parseResult.questions.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Confirm Import ({parseResult.questions.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
