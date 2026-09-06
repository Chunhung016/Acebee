import React from 'react';
import { soundEffects } from '../../utils/soundEffects';
import { Edit3, CheckCircle2, Sparkles } from 'lucide-react';

interface FillInBlankInteractiveProps {
  questionId: string;
  questionText: string;
  value: string;
  caseSensitive?: boolean;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const FillInBlankInteractive: React.FC<FillInBlankInteractiveProps> = ({
  questionText,
  value,
  caseSensitive = false,
  onChange,
  disabled = false,
}) => {
  const hasText = value.trim().length > 0;

  return (
    <div className="space-y-4" id="fill-in-blank-interactive">
      {/* Interactive Input Field */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            Enter the missing term or calculation result:
          </span>
          {hasText && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3 h-3" /> Answer Logged
            </span>
          )}
        </label>

        <div className="relative">
          <input
            type="text"
            disabled={disabled}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (e.target.value.length === 1 && !hasText) {
                soundEffects.playPop();
              }
            }}
            placeholder="Type missing word or phrase..."
            className={`w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all focus:outline-none bg-white ${
              hasText
                ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                : 'border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800'
            }`}
          />

          {hasText && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            {caseSensitive
              ? '⚠️ Strict case-sensitive matching'
              : '✓ Case-insensitive (e.g. capital/lowercase both accepted)'}
          </span>
          <span className="font-mono">{value.length} characters</span>
        </div>
      </div>
    </div>
  );
};
