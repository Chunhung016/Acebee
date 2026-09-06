import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
  Zap,
} from 'lucide-react';
import { MathText } from '../common/MathRenderer';
import { soundFX } from '../../utils/soundEffects';
import { InteractiveMatchingQuestion } from './InteractiveMatchingQuestion';
import { ShortStructureFeedback } from './ShortStructureFeedback';
import {
  InteractivePracticeQuestion,
  extractPracticeQuestions,
} from '../../utils/practiceQuestionExtractor';
import { QuestionBankItem, Quiz, WeaknessPracticeRecord, WeaknessPracticeAnswer } from '../../types';

interface WeaknessPracticeOverlayProps {
  topic: string;
  subject: string;
  questionBank: QuestionBankItem[];
  quizzes: Quiz[];
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  onClose: () => void;
  onRecordCompleted: (record: WeaknessPracticeRecord) => Promise<void>;
}

export const WeaknessPracticeOverlay: React.FC<WeaknessPracticeOverlayProps> = ({
  topic,
  subject,
  questionBank,
  quizzes,
  studentId,
  studentName,
  classId,
  className,
  onClose,
  onRecordCompleted,
}) => {
  // Extract 10 themed questions for this topic
  const questions = useMemo(() => {
    return extractPracticeQuestions(topic, subject, questionBank, quizzes);
  }, [topic, subject, questionBank, quizzes]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [typedAnswers, setTypedAnswers] = useState<Record<number, string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, Record<string, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState<Record<number, boolean>>({});
  const [structureCorrectness, setStructureCorrectness] = useState<Record<number, boolean>>({});
  const [matchingCorrectness, setMatchingCorrectness] = useState<Record<number, boolean>>({});
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(soundFX.isMuted);
  const [isCompleted, setIsCompleted] = useState(false);
  const [expandedReviewIdx, setExpandedReviewIdx] = useState<number | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isCompleted) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted]);

  const currentQ = questions[currentIndex];
  const hasAnsweredCurrent =
    currentQ.type === 'mcq'
      ? selectedAnswers[currentIndex] !== undefined
      : currentQ.type === 'structure'
      ? (typedAnswers[currentIndex] || '').trim().length > 0
      : Object.keys(matchingAnswers[currentIndex] || {}).length > 0;
  const currentIsSubmitted = isSubmitted[currentIndex];

  // Toggle sound
  const handleToggleMute = () => {
    const next = !isMuted;
    soundFX.isMuted = next;
    setIsMuted(next);
  };

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Select Option (MCQ)
  const handleSelectOption = (optIdx: number) => {
    if (currentIsSubmitted) return;

    soundFX.playClick();
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIdx }));
    setIsSubmitted((prev) => ({ ...prev, [currentIndex]: true }));

    const isCorrect = optIdx === currentQ.correctOptionIndex;
    if (isCorrect) {
      soundFX.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      if (newStreak >= 3) {
        soundFX.playStreak();
      }
    } else {
      soundFX.playIncorrect();
      setStreak(0);
    }
  };

  // Submit Short Structure response
  const handleSubmitStructure = () => {
    if (currentIsSubmitted) return;
    const text = (typedAnswers[currentIndex] || '').trim();
    if (!text) return;

    soundFX.playClick();
    setIsSubmitted((prev) => ({ ...prev, [currentIndex]: true }));

    // Check against acceptable answers or word length
    const lower = text.toLowerCase();
    const isExactMatch = currentQ.acceptableAnswers?.some(
      (a) => a.toLowerCase().trim() === lower
    );
    const isModelMatch =
      currentQ.correctAnswerText &&
      lower.includes(currentQ.correctAnswerText.toLowerCase().trim());
    const isSufficientLength = text.split(/\s+/).filter(Boolean).length >= 4;

    const isCorrect = Boolean(isExactMatch || isModelMatch || isSufficientLength);
    setStructureCorrectness((prev) => ({ ...prev, [currentIndex]: isCorrect }));

    if (isCorrect) {
      soundFX.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      if (newStreak >= 3) soundFX.playStreak();
    } else {
      soundFX.playIncorrect();
      setStreak(0);
    }
  };

  // Submit Matching response
  const handleSubmitMatching = () => {
    if (currentIsSubmitted) return;
    const matches = matchingAnswers[currentIndex] || {};
    if (Object.keys(matches).length === 0) return;

    soundFX.playClick();
    setIsSubmitted((prev) => ({ ...prev, [currentIndex]: true }));

    const pairs = currentQ.matchingPairs || [];
    const isAllCorrect =
      pairs.length > 0 &&
      pairs.every((p) => matches[p.id] === p.right || matches[p.left] === p.right);

    setMatchingCorrectness((prev) => ({ ...prev, [currentIndex]: isAllCorrect }));

    if (isAllCorrect) {
      soundFX.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      if (newStreak >= 3) soundFX.playStreak();
    } else {
      soundFX.playIncorrect();
      setStreak(0);
    }
  };

  // Next Question or Finish
  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      soundFX.playClick();
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Complete Drill!
      finishDrill();
    }
  };

  // Calculate results
  const scoreResults = useMemo(() => {
    let correctCount = 0;
    const answersSummary: WeaknessPracticeAnswer[] = [];

    questions.forEach((q, idx) => {
      let isCorrect = false;
      let selectedAnswerText = 'No answer';
      let correctAnswerText = q.explanation || 'See concept explanation';

      if (q.type === 'mcq') {
        const selected = selectedAnswers[idx];
        isCorrect = selected === q.correctOptionIndex;
        selectedAnswerText =
          selected !== undefined && q.options && q.options[selected]
            ? q.options[selected]
            : 'No answer';
        correctAnswerText =
          q.options && q.correctOptionIndex !== undefined
            ? q.options[q.correctOptionIndex]
            : q.correctAnswerText || 'See explanation';
      } else if (q.type === 'structure') {
        isCorrect = structureCorrectness[idx] ?? false;
        selectedAnswerText = typedAnswers[idx] || 'No answer submitted';
        correctAnswerText =
          q.correctAnswerText || q.acceptableAnswers?.join(' / ') || q.explanation;
      } else if (q.type === 'matching') {
        isCorrect = matchingCorrectness[idx] ?? false;
        const matches = matchingAnswers[idx] || {};
        selectedAnswerText = Object.entries(matches)
          .map(([k, v]) => `${k} -> ${v}`)
          .join(', ') || 'No matches made';
        correctAnswerText = (q.matchingPairs || [])
          .map((p) => `${p.left} -> ${p.right}`)
          .join(', ');
      }

      if (isCorrect) correctCount++;

      answersSummary.push({
        questionId: q.id,
        questionText: q.question,
        questionType: q.type,
        selectedAnswer: selectedAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect,
        explanation: q.explanation,
      });
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const xpEarned = correctCount * 15 + maxStreak * 5 + 50;

    return {
      correctCount,
      totalCount: questions.length,
      percentage,
      xpEarned,
      answersSummary,
    };
  }, [
    questions,
    selectedAnswers,
    typedAnswers,
    matchingAnswers,
    structureCorrectness,
    matchingCorrectness,
    maxStreak,
  ]);

  // Finish drill and fire celebration + persist to Firestore
  const finishDrill = async () => {
    setIsCompleted(true);
    soundFX.playFanfare();

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }

    // Persist to Firestore & Local Context
    setSavingRecord(true);
    const newRecord: WeaknessPracticeRecord = {
      id: `prac-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId,
      studentName,
      classId,
      className,
      topic,
      subject,
      totalQuestions: questions.length,
      correctAnswers: scoreResults.correctCount,
      scorePercentage: scoreResults.percentage,
      timeSpentSeconds: secondsElapsed,
      completedAt: new Date().toISOString(),
      xpEarned: scoreResults.xpEarned,
      answersSummary: scoreResults.answersSummary,
      teacherNoticed: false,
    };

    try {
      await onRecordCompleted(newRecord);
      setSavedSuccess(true);
    } catch (err) {
      console.error('Failed to log weakness practice record:', err);
    } finally {
      setSavingRecord(false);
    }
  };

  // Keyboard navigation for power users (1-4 or A-D, Enter to continue)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      if (!currentIsSubmitted) {
        if (e.key >= '1' && e.key <= '4') {
          handleSelectOption(parseInt(e.key, 10) - 1);
        } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
          const idx = e.key.toLowerCase().charCodeAt(0) - 97;
          handleSelectOption(idx);
        }
      } else if (e.key === 'Enter') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompleted, currentIsSubmitted, currentIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      id="weakness-practice-overlay-modal"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {subject}
                </span>
                <span className="text-[11px] font-bold text-slate-300">
                  Weakness Recovery Drill (10 Questions)
                </span>
              </div>
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] truncate max-w-xs sm:max-w-md">
                {topic}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            {streak > 1 && !isCompleted && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{streak} Streak!</span>
              </div>
            )}

            {/* Timer */}
            <div className="flex items-center gap-1 text-xs text-slate-300 font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            {/* Mute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (
                  isCompleted ||
                  window.confirm('Are you sure you want to exit? Your progress in this drill will not be logged.')
                ) {
                  onClose();
                }
              }}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close practice overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 10-Question Visual Progress Dots Bar */}
        {!isCompleted && (
          <div className="px-5 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1.5 w-full">
              {questions.map((q, idx) => {
                const isAnswered = isSubmitted[idx];
                const isCorrect =
                  q.type === 'mcq'
                    ? selectedAnswers[idx] === q.correctOptionIndex
                    : q.type === 'structure'
                    ? structureCorrectness[idx]
                    : matchingCorrectness[idx];
                const isCurrent = idx === currentIndex;

                return (
                  <div
                    key={idx}
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'bg-blue-600 ring-2 ring-blue-300 h-2.5'
                        : isAnswered
                        ? isCorrect
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                        : 'bg-slate-200'
                    }`}
                    title={`Question ${idx + 1} (${q.type.toUpperCase()})`}
                  />
                );
              })}
            </div>
            <div className="text-[11px] font-bold text-slate-600 font-mono shrink-0 pl-2">
              {currentIndex + 1} / 10
            </div>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {!isCompleted ? (
            /* ACTIVE QUESTION VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Question Header Meta */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    Question {currentIndex + 1} of 10
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentQ.type === 'mcq' ? 'Multiple Choice' : currentQ.type === 'matching' ? 'Matching Pairs' : 'Short Structure'}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      currentQ.difficulty === 'easy'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : currentQ.difficulty === 'hard'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {currentQ.difficulty} difficulty
                  </span>
                </div>

                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  +15 XP for correct response
                </span>
              </div>

              {/* Question Statement */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-['Plus_Jakarta_Sans',sans-serif]">
                  <MathText text={currentQ.question} />
                </div>
              </div>

              {/* TYPE 1: MULTIPLE CHOICE OPTIONS GRID */}
              {currentQ.type === 'mcq' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                    <span>Choose the correct answer:</span>
                    <span className="hidden sm:inline text-[11px] text-slate-400">
                      Keyboard: Press 1-4 or A-D
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQ.options?.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentIndex] === optIdx;
                      const isCorrectAnswer = currentQ.correctOptionIndex === optIdx;

                      let cardStyle =
                        'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800';

                      if (currentIsSubmitted) {
                        if (isCorrectAnswer) {
                          cardStyle =
                            'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200';
                        } else if (isSelected) {
                          cardStyle =
                            'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-200';
                        } else {
                          cardStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        cardStyle = 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-200';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(optIdx)}
                          disabled={currentIsSubmitted}
                          className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-4 transition-all ${cardStyle}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                currentIsSubmitted && isCorrectAnswer
                                  ? 'bg-emerald-600 text-white'
                                  : currentIsSubmitted && isSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-sm font-semibold leading-normal">
                              <MathText text={opt} />
                            </span>
                          </div>

                          {/* Interactive Feedback Icon */}
                          {currentIsSubmitted && (
                            <div className="shrink-0">
                              {isCorrectAnswer ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in zoom-in-50" />
                              ) : isSelected ? (
                                <XCircle className="w-5 h-5 text-rose-600 animate-in zoom-in-50" />
                              ) : null}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TYPE 2: SHORT STRUCTURED TYPED ANSWER */}
              {currentQ.type === 'structure' && (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                    <span>Type your reasoned explanation or calculation:</span>
                    <span className="text-[11px] text-slate-400">Word count: {(typedAnswers[currentIndex] || '').trim().split(/\s+/).filter(Boolean).length} words</span>
                  </div>

                  <div className="relative">
                    <textarea
                      value={typedAnswers[currentIndex] || ''}
                      onChange={(e) => {
                        if (!currentIsSubmitted) {
                          setTypedAnswers((prev) => ({ ...prev, [currentIndex]: e.target.value }));
                        }
                      }}
                      disabled={currentIsSubmitted}
                      placeholder="Type your explanation, formula or step-by-step reasoning here..."
                      rows={4}
                      className="w-full p-4 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-700"
                    />
                  </div>

                  {/* Sentence starter pills */}
                  {!currentIsSubmitted && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Sentence Starters:</span>
                      {['Because ', 'Firstly, ', 'Based on the rule, ', 'Therefore, '].map((st, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setTypedAnswers((prev) => ({
                              ...prev,
                              [currentIndex]: (prev[currentIndex] || '') + st,
                            }));
                          }}
                          className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                        >
                          +{st}
                        </button>
                      ))}
                    </div>
                  )}

                  {!currentIsSubmitted && (
                    <button
                      type="button"
                      onClick={handleSubmitStructure}
                      disabled={!(typedAnswers[currentIndex] || '').trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Answer for Instant Evaluation</span>
                    </button>
                  )}
                </div>
              )}

              {/* TYPE 3: MATCHING PAIRS */}
              {currentQ.type === 'matching' && currentQ.matchingPairs && currentQ.matchingPairs.length > 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-slate-500">
                    <span>Connect related concept definitions and terms:</span>
                  </div>

                  <InteractiveMatchingQuestion
                    questionId={currentQ.id}
                    pairs={currentQ.matchingPairs}
                    currentMatches={matchingAnswers[currentIndex] || {}}
                    onChange={(updatedMatches) => {
                      if (!currentIsSubmitted) {
                        setMatchingAnswers((prev) => ({ ...prev, [currentIndex]: updatedMatches }));
                      }
                    }}
                    disabled={currentIsSubmitted}
                  />

                  {!currentIsSubmitted && (
                    <button
                      type="button"
                      onClick={handleSubmitMatching}
                      disabled={Object.keys(matchingAnswers[currentIndex] || {}).length === 0}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Lock In & Check Matches</span>
                    </button>
                  )}
                </div>
              )}

              {/* Instant Explanatory Feedback Drawer */}
              {currentIsSubmitted && (() => {
                const isCorrect =
                  currentQ.type === 'mcq'
                    ? selectedAnswers[currentIndex] === currentQ.correctOptionIndex
                    : currentQ.type === 'structure'
                    ? structureCorrectness[currentIndex]
                    : matchingCorrectness[currentIndex];

                return (
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border space-y-2 animate-in fade-in slide-in-from-top-2 ${
                      isCorrect
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/80 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Spot On! Great Work
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            Mistake Analyzed • Learn and Remember
                          </>
                        )}
                      </span>
                      {isCorrect && (
                        <span className="text-xs font-bold text-emerald-700">+15 XP</span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed text-slate-800">
                      <strong className="text-slate-900">Explanation: </strong>
                      <MathText text={currentQ.explanation} />
                    </div>

                    {currentQ.correctAnswerText && currentQ.type === 'structure' && (
                      <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200 text-xs">
                        <strong className="text-slate-900">Model Answer: </strong>
                        <span>{currentQ.correctAnswerText}</span>
                      </div>
                    )}

                    {currentQ.learningTip && (
                      <div className="pt-2 mt-2 border-t border-slate-200/60 text-xs text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          <strong>Key Takeaway:</strong> {currentQ.learningTip}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* COMPLETION & CELEBRATION VIEW */
            <div className="space-y-6 animate-in zoom-in-95 duration-300" id="practice-completed-screen">
              {/* Celebration Hero Card */}
              <div className="text-center p-6 sm:p-8 rounded-3xl bg-linear-to-b from-blue-50 to-indigo-50/40 border border-blue-200 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Award className="w-9 h-9 text-amber-300" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Drill Completed • {topic}
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mt-2">
                    {scoreResults.percentage >= 80
                      ? 'Outstanding Mastery!'
                      : scoreResults.percentage >= 60
                      ? 'Great Progress Made!'
                      : 'Valuable Practice Recorded!'}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    You completed all 10 practice questions extracted for this weak concept. Each mistake
                    analyzed bridges your learning gap.
                  </p>
                </div>

                {/* Performance Metrics Bento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Score
                    </span>
                    <span className="text-xl font-extrabold text-blue-700 font-['Plus_Jakarta_Sans',sans-serif]">
                      {scoreResults.correctCount} / 10
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      ({scoreResults.percentage}%)
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      XP Earned
                    </span>
                    <span className="text-xl font-extrabold text-amber-600 font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center gap-1">
                      +{scoreResults.xpEarned}
                    </span>
                    <span className="text-[11px] text-slate-500 block">Academic XP</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Max Streak
                    </span>
                    <span className="text-xl font-extrabold text-rose-600 font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center gap-1">
                      🔥 {maxStreak}
                    </span>
                    <span className="text-[11px] text-slate-500 block">In a row</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Time Spent
                    </span>
                    <span className="text-xl font-extrabold text-slate-800 font-mono">
                      {formatTime(secondsElapsed)}
                    </span>
                    <span className="text-[11px] text-slate-500 block">Focused Drill</span>
                  </div>
                </div>

                {/* Teacher Notification Status Alert */}
                <div className="p-3.5 rounded-xl bg-blue-900 text-white text-xs flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <Send className="w-4 h-4 text-blue-300 shrink-0" />
                    <div>
                      <strong className="text-blue-100 block">Teacher Notified in Real-Time</strong>
                      <span className="text-blue-200 text-[11px]">
                        This drill result was dispatched to your homeroom teacher profile to track your recovery.
                      </span>
                    </div>
                  </div>
                  {savingRecord ? (
                    <span className="text-[10px] font-mono text-amber-300 animate-pulse">Syncing...</span>
                  ) : savedSuccess ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                      Logged ✓
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Detailed 10-Question Review Accordion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    Review All 10 Drill Questions
                  </h4>
                  <span className="text-[11px] text-slate-500">Click to expand any question</span>
                </div>

                <div className="space-y-2">
                  {questions.map((q, qIdx) => {
                    const isCorrect =
                      q.type === 'mcq'
                        ? selectedAnswers[qIdx] === q.correctOptionIndex
                        : q.type === 'structure'
                        ? structureCorrectness[qIdx]
                        : matchingCorrectness[qIdx];
                    const isExpanded = expandedReviewIdx === qIdx;

                    let userAnswerDisplay = 'None';
                    let correctAnswerDisplay = q.explanation || 'See explanation';

                    if (q.type === 'mcq') {
                      const sel = selectedAnswers[qIdx];
                      userAnswerDisplay = sel !== undefined && q.options && q.options[sel] ? q.options[sel] : 'None';
                      correctAnswerDisplay = q.options && q.correctOptionIndex !== undefined ? q.options[q.correctOptionIndex] : 'See explanation';
                    } else if (q.type === 'structure') {
                      userAnswerDisplay = typedAnswers[qIdx] || 'No response submitted';
                      correctAnswerDisplay = q.correctAnswerText || q.acceptableAnswers?.join(' / ') || 'Consult model answer';
                    } else if (q.type === 'matching') {
                      const matches = matchingAnswers[qIdx] || {};
                      userAnswerDisplay = Object.entries(matches).map(([k, v]) => `${k} ➔ ${v}`).join(', ') || 'No pairings formed';
                      correctAnswerDisplay = (q.matchingPairs || []).map((p) => `${p.left} ➔ ${p.right}`).join(', ');
                    }

                    return (
                      <div
                        key={q.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedReviewIdx(isExpanded ? null : qIdx)}
                          className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isCorrect ? '✓' : '✗'}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate">
                              Q{qIdx + 1}: {q.question}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                isCorrect
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs">
                            <div className="p-3 rounded-lg bg-white border border-slate-200">
                              <strong className="text-slate-900 block mb-1">Full Question:</strong>
                              <MathText text={q.question} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div
                                className={`p-2.5 rounded-lg border ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-rose-50 border-rose-200 text-rose-900'
                                }`}
                              >
                                <span className="text-[10px] font-bold uppercase block text-slate-500">
                                  Your Answer
                                </span>
                                <span className="font-semibold">{userAnswerDisplay}</span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                                <span className="text-[10px] font-bold uppercase block text-slate-500">
                                  Correct Answer
                                </span>
                                <span className="font-semibold">{correctAnswerDisplay}</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                              <strong className="text-slate-900">Explanation: </strong>
                              <MathText text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex((prev) => prev - 1);
                  }
                }}
                disabled={currentIndex === 0}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasAnsweredCurrent}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                    hasAnsweredCurrent
                      ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  id="practice-next-btn"
                >
                  <span>{currentIndex === questions.length - 1 ? 'Finish Drill 🎉' : 'Next Question'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  // Reset drill
                  setSelectedAnswers({});
                  setIsSubmitted({});
                  setCurrentIndex(0);
                  setIsCompleted(false);
                  setStreak(0);
                  setSecondsElapsed(0);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Practice Again (10 New Drills)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                id="finish-and-close-practice-btn"
              >
                Done & Return to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
