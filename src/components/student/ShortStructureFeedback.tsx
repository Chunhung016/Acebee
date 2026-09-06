import React, { useEffect, useRef, useState } from 'react';
import { soundEffects } from '../../utils/soundEffects';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
  ZoomIn,
  Smile,
  Zap,
} from 'lucide-react';

interface ShortStructureFeedbackProps {
  questionId: string;
  value: string;
  wordLimit?: number;
  attachmentUrl?: string;
  onChangeText: (text: string) => void;
  onChangeAttachment: (url: string) => void;
  disabled?: boolean;
}

const SENTENCE_STARTERS = [
  'Firstly, ',
  'In addition, ',
  'For example, ',
  'Based on this concept, ',
  'Therefore, ',
  'In conclusion, ',
];

export const ShortStructureFeedback: React.FC<ShortStructureFeedbackProps> = ({
  questionId,
  value,
  wordLimit = 120,
  attachmentUrl = '',
  onChangeText,
  onChangeAttachment,
  disabled = false,
}) => {
  const [lastMilestoneSound, setLastMilestoneSound] = useState<number>(0);
  const [showStarters, setShowStarters] = useState<boolean>(false);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  // Calculate percentage of target words
  const targetWords = wordLimit > 0 ? wordLimit : 60;
  const progressPercent = Math.min(100, Math.round((wordCount / targetWords) * 100));

  // Determine stage and encouragement
  const stage = (() => {
    if (wordCount === 0) {
      return {
        label: 'Empty response',
        message: 'Start typing your explanation or step-by-step reasoning below...',
        badgeClass: 'bg-slate-100 text-slate-600',
        ringColor: 'stroke-slate-300',
      };
    }
    if (wordCount < 8) {
      return {
        label: 'Drafting ✍️',
        message: 'Good start! Add more key points and supporting reasoning.',
        badgeClass: 'bg-blue-100 text-blue-800',
        ringColor: 'stroke-blue-500',
      };
    }
    if (wordCount < 20) {
      return {
        label: 'Expanding 🌿',
        message: 'Nice flow! Detail your observations, formulas, or examples.',
        badgeClass: 'bg-purple-100 text-purple-800',
        ringColor: 'stroke-purple-500',
      };
    }
    if (wordCount < 40) {
      return {
        label: 'Solid Answer 💡',
        message: 'Well explained! Make sure all parts of the question are answered.',
        badgeClass: 'bg-amber-100 text-amber-800',
        ringColor: 'stroke-amber-500',
      };
    }
    return {
      label: 'Comprehensive ⭐',
      message: 'Excellent detailed response! Ready for teacher review.',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      ringColor: 'stroke-emerald-500',
    };
  })();

  // Milestone audio feedback when student crosses 10, 25, 50 words
  useEffect(() => {
    const milestones = [10, 25, 45];
    for (const m of milestones) {
      if (wordCount >= m && lastMilestoneSound < m) {
        soundEffects.playMilestoneChime();
        setLastMilestoneSound(m);
        break;
      }
    }
    if (wordCount < lastMilestoneSound - 5) {
      setLastMilestoneSound(0);
    }
  }, [wordCount, lastMilestoneSound]);

  const insertStarter = (starter: string) => {
    if (disabled) return;
    const current = value || '';
    const needsSpace = current.length > 0 && !current.endsWith(' ') && !current.endsWith('\n');
    const updated = needsSpace ? `${current} ${starter}` : `${current}${starter}`;
    onChangeText(updated);
    soundEffects.playPop();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="space-y-3" id="short-structure-feedback-box">
      {/* Gamified Live Word & Quality Gauge */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 transition-all">
        <div className="flex items-center gap-3">
          {/* Progress Circular Gauge */}
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-purple-200/80 stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${stage.ringColor} transition-all duration-300`}
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-purple-950 font-mono">
              {wordCount}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${stage.badgeClass}`}>
                {stage.label}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
                {wordLimit ? ` / ${wordLimit} target` : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {stage.message}
            </p>
          </div>
        </div>

        {/* Sentence Starter Toggle */}
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowStarters(!showStarters)}
            className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-white/90 hover:bg-white px-2.5 py-1.5 rounded-lg border border-purple-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>{showStarters ? 'Hide Starters' : 'Sentence Starters'}</span>
          </button>
        )}
      </div>

      {/* Expandable Sentence Starter Chips */}
      {showStarters && !disabled && (
        <div className="p-3 rounded-xl bg-slate-50 border border-purple-100 animate-in fade-in slide-in-from-top-1">
          <span className="text-[11px] font-bold text-slate-600 block mb-2">
            Click to insert connector into your response:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SENTENCE_STARTERS.map((starter, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => insertStarter(starter)}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 hover:border-purple-300 border border-slate-200 text-purple-900 rounded-lg text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                + {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Textarea with Dynamic Visual Feedback */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          disabled={disabled}
          rows={6}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Type your structured answer here. Elaborate with full sentences, supporting concepts, formulas, or logical steps..."
          className={`w-full p-4 rounded-xl text-xs sm:text-sm transition-all focus:outline-none bg-white ${
            wordCount >= 25
              ? 'border-2 border-emerald-400/80 shadow-xs focus:ring-2 focus:ring-emerald-500/20'
              : wordCount > 0
              ? 'border-2 border-purple-400/80 shadow-xs focus:ring-2 focus:ring-purple-500/20'
              : 'border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
          }`}
        />

        {/* Live typing status corner tag */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] text-slate-400 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 font-mono">
            {charCount} chars
          </span>
        </div>
      </div>

      {/* Optional Handwritten / Photo Work Upload */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            Attach Written Paper Work (Optional)
          </span>
          {attachmentUrl && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChangeAttachment('');
                soundEffects.playPop();
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Remove Photo
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          Wrote calculations or essays on paper? Take a photo or upload it so your teacher can review your handwriting.
        </p>

        {!disabled && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              id={`upload-written-${questionId}`}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onChangeAttachment(reader.result as string);
                    soundEffects.playPop(700);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label
              htmlFor={`upload-written-${questionId}`}
              className="flex items-center gap-2 py-2 px-3.5 bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-950 text-xs font-bold rounded-lg cursor-pointer transition-all shadow-2xs active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-purple-700" />
              Upload Work Photo
            </label>

            <input
              type="text"
              value={attachmentUrl?.startsWith('data:') ? '' : attachmentUrl || ''}
              onChange={(e) => onChangeAttachment(e.target.value)}
              placeholder="Or paste image URL..."
              className="flex-1 min-w-[140px] text-xs p-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Attachment preview */}
        {attachmentUrl && (
          <div className="mt-2 relative rounded-xl overflow-hidden border border-purple-200 bg-white p-2 flex items-center justify-center">
            <img
              src={attachmentUrl}
              alt="Handwritten work submission"
              className={`object-contain rounded-lg transition-all ${
                isPhotoZoomed ? 'max-h-[380px] w-full' : 'max-h-[140px]'
              }`}
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg text-xs flex items-center gap-1 shadow-md cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span className="text-[10px]">{isPhotoZoomed ? 'Shrink' : 'Zoom'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
