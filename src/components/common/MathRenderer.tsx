import React, { useMemo } from 'react';
import { renderMathToHtml, hasMathNotation } from '../../utils/mathParser';

interface MathTextProps {
  text?: string | null;
  className?: string;
  inline?: boolean;
}

/**
 * Renders text containing mathematical notations (fractions, surds, powers, symbols, etc.)
 * with authentic mathematical typesetting via KaTeX.
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  inline = true,
}) => {
  if (!text) return null;

  const html = useMemo(() => {
    return renderMathToHtml(text);
  }, [text]);

  const Tag = inline ? 'span' : 'div';

  return (
    <Tag
      className={`math-rendered-content ${inline ? 'inline-block align-middle' : 'block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface MathToolbarProps {
  onInsert: (snippet: string) => void;
  className?: string;
  compact?: boolean;
}

/**
 * Interactive math toolbar for quick formula and symbol insertion
 * during question writing and rubric drafting.
 */
export const MathToolbar: React.FC<MathToolbarProps> = ({
  onInsert,
  className = '',
  compact = false,
}) => {
  const tools = [
    { label: 'Fraction', symbol: 'a/b', snippet: '\\frac{numerator}{denominator}', title: 'Stacked Fraction (e.g. \\frac{3}{8} or 3/8)' },
    { label: 'Surd', symbol: '√x', snippet: '\\sqrt{x}', title: 'Square Root / Surd (e.g. \\sqrt{75} or sqrt(75))' },
    { label: 'Cube Root', symbol: '∛x', snippet: '\\sqrt[3]{x}', title: 'Cube / N-th Root (e.g. \\sqrt[3]{27})' },
    { label: 'Power', symbol: 'xⁿ', snippet: 'x^{2}', title: 'Exponent / Power (e.g. x^2 or x^{n})' },
    { label: 'Plus/Minus', symbol: '±', snippet: '\\pm ', title: 'Plus-minus sign (\\pm or +/-)' },
    { label: 'Multiply', symbol: '×', snippet: '\\times ', title: 'Multiplication sign' },
    { label: 'Divide', symbol: '÷', snippet: '\\div ', title: 'Division sign' },
    { label: 'Pi', symbol: 'π', snippet: '\\pi ', title: 'Pi symbol' },
    { label: 'Less Equal', symbol: '≤', snippet: '\\le ', title: 'Less than or equal to' },
    { label: 'Greater Equal', symbol: '≥', snippet: '\\ge ', title: 'Greater than or equal to' },
    { label: 'Not Equal', symbol: '≠', snippet: '\\neq ', title: 'Not equal to' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs ${className}`}>
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 select-none">
        Math Tools:
      </span>
      {tools.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => onInsert(t.snippet)}
          title={t.title}
          className="px-2 py-1 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-lg font-mono text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
        >
          <span className="font-bold text-amber-700">{t.symbol}</span>
          {!compact && <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">{t.label}</span>}
        </button>
      ))}
    </div>
  );
};

interface MathLivePreviewProps {
  rawText: string;
  label?: string;
  className?: string;
}

/**
 * Live preview card for question writers showing how formulas will appear to students
 */
export const MathLivePreview: React.FC<MathLivePreviewProps> = ({
  rawText,
  label = 'Mathematics Live Preview',
  className = '',
}) => {
  const hasMath = useMemo(() => hasMathNotation(rawText), [rawText]);

  if (!rawText.trim() || !hasMath) return null;

  return (
    <div className={`mt-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-sm ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-amber-200/60 text-xs font-semibold text-amber-900">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {label}
        </span>
        <span className="text-[10px] text-amber-700 font-normal">
          Formatted with proper fractions, surds & powers
        </span>
      </div>
      <div className="text-slate-900 font-medium leading-relaxed">
        <MathText text={rawText} inline={false} />
      </div>
    </div>
  );
};
