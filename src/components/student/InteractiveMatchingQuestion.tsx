import React, { useState, useMemo } from 'react';
import { MatchingPair } from '../../types';
import { MathText } from '../common/MathRenderer';
import { soundEffects } from '../../utils/soundEffects';
import {
  Link2,
  Unlink,
  Sparkles,
  GripVertical,
  CheckCircle2,
  RotateCcw,
  MousePointerClick,
  Layers,
} from 'lucide-react';

interface InteractiveMatchingQuestionProps {
  questionId: string;
  pairs: MatchingPair[];
  currentMatches: Record<string, string>; // left -> right
  onChange: (updatedMatches: Record<string, string>) => void;
  disabled?: boolean;
}

// Color palette for connected pairs so each connection has an intuitive visual identity
const PAIR_COLORS = [
  { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-900', badge: 'bg-blue-600 text-white' },
  { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-900', badge: 'bg-purple-600 text-white' },
  { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-900', badge: 'bg-emerald-600 text-white' },
  { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-900', badge: 'bg-amber-600 text-white' },
  { border: 'border-rose-500', bg: 'bg-rose-50', text: 'text-rose-900', badge: 'bg-rose-600 text-white' },
  { border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-900', badge: 'bg-cyan-600 text-white' },
];

export const InteractiveMatchingQuestion: React.FC<InteractiveMatchingQuestionProps> = ({
  pairs,
  currentMatches,
  onChange,
  disabled = false,
}) => {
  // Currently active/selected left item for tap-to-pair mode
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  // Item being dragged
  const [draggedRightItem, setDraggedRightItem] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // All available right-side options
  const allRightOptions = useMemo(() => {
    return pairs.map((p) => p.right);
  }, [pairs]);

  // Which right options are already assigned to which left item
  const assignedRightOptions = useMemo(() => {
    const set = new Set<string>();
    Object.values(currentMatches).forEach((val) => {
      if (typeof val === 'string' && val.trim()) {
        set.add(val);
      }
    });
    return set;
  }, [currentMatches]);

  // Total matched count
  const matchedCount = useMemo(() => {
    return pairs.filter((p) => Boolean(currentMatches[p.left])).length;
  }, [pairs, currentMatches]);

  const isComplete = pairs.length > 0 && matchedCount === pairs.length;

  // Handle pairing action
  const handlePair = (left: string, right: string) => {
    if (disabled) return;

    // Check if this right item was already paired to another left item, remove it if so
    const newMatches: Record<string, string> = { ...currentMatches };
    Object.keys(newMatches).forEach((key) => {
      if (newMatches[key] === right) {
        delete newMatches[key];
      }
    });

    newMatches[left] = right;
    onChange(newMatches);
    setSelectedLeft(null);

    soundEffects.playMatchSuccess();
  };

  const handleUnpair = (left: string) => {
    if (disabled) return;
    const newMatches = { ...currentMatches };
    delete newMatches[left];
    onChange(newMatches);
    soundEffects.playMatchDisconnect();
  };

  const handleReset = () => {
    if (disabled) return;
    onChange({});
    setSelectedLeft(null);
    soundEffects.playPop();
  };

  // Drag & Drop handlers for Right-side chips
  const handleDragStart = (e: React.DragEvent, rightItem: string) => {
    if (disabled) return;
    setDraggedRightItem(rightItem);
    e.dataTransfer.setData('text/plain', rightItem);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, leftItem: string) => {
    e.preventDefault();
    if (dragOverTarget !== leftItem) {
      setDragOverTarget(leftItem);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, leftItem: string) => {
    e.preventDefault();
    setDragOverTarget(null);
    const droppedRight = e.dataTransfer.getData('text/plain') || draggedRightItem;
    if (droppedRight) {
      handlePair(leftItem, droppedRight);
    }
    setDraggedRightItem(null);
  };

  return (
    <div className="space-y-4" id="interactive-matching-board">
      {/* Interactive Status & Instructions Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50/60 rounded-xl border border-amber-200/80">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Match Pairs ({matchedCount}/{pairs.length})
              </span>
              {isComplete && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full animate-bounce">
                  <CheckCircle2 className="w-3 h-3" /> All Paired!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Drag answers from the pool onto slots, or tap an item on the left then tap its match!
            </p>
          </div>
        </div>

        {matchedCount > 0 && !disabled && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-amber-100/70 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Unassigned Right Options Bank (Draggable & Clickable) */}
      <div className="p-3.5 bg-slate-100/90 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-amber-600" />
            Answer Pool (Drag or Tap to match):
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {pairs.length - assignedRightOptions.size} remaining
          </span>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[42px] items-center">
          {allRightOptions.map((rightOpt, idx) => {
            const isAssigned = assignedRightOptions.has(rightOpt);
            return (
              <div
                key={idx}
                draggable={!disabled && !isAssigned}
                onDragStart={(e) => handleDragStart(e, rightOpt)}
                onClick={() => {
                  if (disabled) return;
                  // If a left item is selected, immediately pair it!
                  if (selectedLeft) {
                    handlePair(selectedLeft, rightOpt);
                  } else {
                    soundEffects.playPop();
                  }
                }}
                className={`group px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 select-none transition-all ${
                  isAssigned
                    ? 'bg-slate-200/60 text-slate-400 border border-slate-300/60 opacity-50 cursor-not-allowed line-through'
                    : selectedLeft
                    ? 'bg-white text-slate-900 border-2 border-amber-500 shadow-md scale-105 cursor-pointer hover:bg-amber-50'
                    : 'bg-white text-slate-800 border border-slate-300 shadow-xs hover:border-amber-400 hover:shadow-sm cursor-grab active:cursor-grabbing'
                }`}
              >
                {!isAssigned && <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500" />}
                <span>
                  <MathText text={rightOpt} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Slots (Left items with their matching destination drop zones) */}
      <div className="space-y-3">
        {pairs.map((pair, pIdx) => {
          const matchedRight = currentMatches[pair.left];
          const isMatched = Boolean(matchedRight);
          const isSelectedForTap = selectedLeft === pair.left;
          const isOver = dragOverTarget === pair.left;
          const colorTheme = PAIR_COLORS[pIdx % PAIR_COLORS.length];

          return (
            <div
              key={pIdx}
              onDragOver={(e) => handleDragOver(e, pair.left)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, pair.left)}
              className={`p-3.5 rounded-xl border transition-all ${
                isOver
                  ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/40 shadow-md scale-[1.01]'
                  : isMatched
                  ? `${colorTheme.border} ${colorTheme.bg} shadow-xs`
                  : isSelectedForTap
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left Item Trigger */}
                <div
                  onClick={() => {
                    if (disabled) return;
                    if (isSelectedForTap) {
                      setSelectedLeft(null);
                    } else {
                      setSelectedLeft(pair.left);
                      soundEffects.playPop();
                    }
                  }}
                  className={`flex items-center gap-3 cursor-pointer py-1 px-2 rounded-lg transition-colors ${
                    isSelectedForTap ? 'bg-blue-100 text-blue-900 font-bold' : 'hover:bg-slate-100/70'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isMatched ? colorTheme.badge : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pIdx + 1}
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    <MathText text={pair.left} />
                  </div>
                  {isSelectedForTap && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-200/80 px-2 py-0.5 rounded-full animate-pulse">
                      Tap answer below
                    </span>
                  )}
                </div>

                {/* Connector & Drop Target / Paired Pill */}
                <div className="flex items-center gap-2 sm:w-1/2">
                  <span className="text-slate-300 hidden sm:inline">
                    <Link2 className={`w-4 h-4 ${isMatched ? 'text-amber-500' : 'text-slate-300'}`} />
                  </span>

                  {isMatched ? (
                    <div
                      className={`flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${colorTheme.border} bg-white shadow-xs animate-in zoom-in-95 duration-150`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          <MathText text={matchedRight} />
                        </span>
                      </div>

                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleUnpair(pair.left)}
                          title="Unlink match"
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        if (disabled) return;
                        setSelectedLeft(pair.left);
                        soundEffects.playPop();
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 border-dashed text-xs text-center font-medium cursor-pointer transition-all ${
                        isOver
                          ? 'border-amber-500 bg-amber-100 text-amber-900'
                          : isSelectedForTap
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-slate-300 hover:border-amber-400 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isOver
                        ? 'Drop here!'
                        : isSelectedForTap
                        ? 'Now tap a match from the pool above'
                        : 'Drop or tap match here'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
