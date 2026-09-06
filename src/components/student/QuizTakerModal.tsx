import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, QuizQuestion, QuizResult, StudentAnswerRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { MathText } from '../common/MathRenderer';
import { soundEffects } from '../../utils/soundEffects';
import { InteractiveMatchingQuestion } from './InteractiveMatchingQuestion';
import { ShortStructureFeedback } from './ShortStructureFeedback';
import { FillInBlankInteractive } from './FillInBlankInteractive';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Lock,
  RotateCcw,
  Check,
  FileText,
  Layers,
  Image as ImageIcon,
  Upload,
  Trash2,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  CheckCheck,
} from 'lucide-react';

interface QuizTakerModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const QuizTakerModal: React.FC<QuizTakerModalProps> = ({ quiz, onClose }) => {
  const { submitQuizResult, quizResults, currentUser } = useApp();

  // Find previous attempts by this student
  const previousResults = useMemo(() => {
    return quizResults
      .filter((r) => r.quizId === quiz.id && r.studentId === currentUser?.id)
      .sort((a, b) => (b.attemptNumber || 1) - (a.attemptNumber || 1));
  }, [quizResults, quiz.id, currentUser?.id]);

  const maxAttempts = quiz.maxAttempts || 1;
  const attemptsUsed = previousResults.length;
  const hasExceededAttempts = attemptsUsed >= maxAttempts;
  const latestResult = previousResults[0] || null;

  // Review mode if max attempts reached and student just opened the modal
  const [isReviewOnly, setIsReviewOnly] = useState<boolean>(hasExceededAttempts);

  // Active taking states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Per-question student responses
  // - MCQ: number (optionIndex)
  // - Structured: string (text)
  // - Fill in blank: string (text)
  // - Matching: Record<string, string> (left -> right)
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, string>>>({});
  const [studentAttachments, setStudentAttachments] = useState<Record<string, string>>({});

  const [timeLeft, setTimeLeft] = useState<number>((quiz.timeLimitMinutes || 15) * 60);
  const [timeExpired, setTimeExpired] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [justSubmittedResult, setJustSubmittedResult] = useState<QuizResult | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.isMuted);
  // Recent feedback trigger indicator
  const [recentlyAnsweredId, setRecentlyAnsweredId] = useState<string | null>(null);

  const toggleSound = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsMuted(nextMuted);
  };

  // Active Questions with Option & Question Randomization Support
  const activeQuestions = useMemo(() => {
    let list = [...quiz.questions];
    if (quiz.shuffleQuestions && !isReviewOnly && !hasExceededAttempts) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }

    return list.map((q) => {
      if ((!q.type || q.type === 'mcq') && q.options && quiz.shuffleOptions && !isReviewOnly && !hasExceededAttempts) {
        const correctText = q.options[q.correctAnswerIndex ?? 0];
        const shuffled = [...q.options];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const newCorrectIdx = shuffled.indexOf(correctText);
        return {
          ...q,
          displayOptions: shuffled,
          displayCorrectAnswerIndex: newCorrectIdx >= 0 ? newCorrectIdx : (q.correctAnswerIndex ?? 0),
        };
      }
      return {
        ...q,
        displayOptions: q.options,
        displayCorrectAnswerIndex: q.correctAnswerIndex,
      };
    });
  }, [quiz.id, quiz.questions, quiz.shuffleQuestions, quiz.shuffleOptions, isReviewOnly, hasExceededAttempts]);

  // Gamification stats
  const answeredQuestionsCount = useMemo(() => {
    return activeQuestions.filter((q) => {
      if (!q.type || q.type === 'mcq') return mcqAnswers[q.id] !== undefined;
      if (q.type === 'structure') return Boolean(textAnswers[q.id]?.trim() || studentAttachments[q.id]?.trim());
      if (q.type === 'fill_in_blank') return Boolean(textAnswers[q.id]?.trim());
      if (q.type === 'matching') {
        const matches = matchingAnswers[q.id] || {};
        return Object.keys(matches).length > 0;
      }
      return false;
    }).length;
  }, [activeQuestions, mcqAnswers, textAnswers, studentAttachments, matchingAnswers]);

  const progressPercent = Math.round((answeredQuestionsCount / (activeQuestions.length || 1)) * 100);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || isReviewOnly || hasExceededAttempts) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeExpired(true);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, isReviewOnly, hasExceededAttempts]);

  const currentQ = activeQuestions[currentQuestionIndex];

  // Keyboard shortcut listener for swift, gamified answering
  useEffect(() => {
    if (isSubmitted || isReviewOnly || hasExceededAttempts || !currentQ) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (!currentQ.type || currentQ.type === 'mcq') {
        const key = e.key.toUpperCase();
        const options = currentQ.displayOptions || currentQ.options || [];
        const letterIdx = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(key);
        const numberIdx = ['1', '2', '3', '4', '5', '6'].indexOf(e.key);
        const selectedIdx = letterIdx >= 0 ? letterIdx : numberIdx;

        if (selectedIdx >= 0 && selectedIdx < options.length) {
          e.preventDefault();
          handleSelectMcq(selectedIdx);
        }
      }

      if (e.key === 'ArrowRight' && currentQuestionIndex < activeQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        soundEffects.playPop(480);
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
        soundEffects.playPop(420);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, currentQuestionIndex, activeQuestions.length, isSubmitted, isReviewOnly, hasExceededAttempts]);

  const handleSelectMcq = (idx: number) => {
    if (!currentQ) return;
    setMcqAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
    soundEffects.playOptionSelect(idx);
    setRecentlyAnsweredId(currentQ.id);
    setTimeout(() => {
      setRecentlyAnsweredId(null);
    }, 1200);
  };

  // Helper for counting words in essay
  const countWords = (str: string) => {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  };

  // Submission handler
  const handleAutoSubmitOnTimeout = () => {
    handleSubmitQuiz(true);
  };

  const handleSubmitQuiz = async (wasTimedOut = false) => {
    if (isSubmitted) return;

    let calculatedScore = 0;
    let totalPoints = 0;

    const answerRecords: StudentAnswerRecord[] = activeQuestions.map((q) => {
      const qPoints = q.points || 1;
      totalPoints += qPoints;

      if (!q.type || q.type === 'mcq') {
        const selected = mcqAnswers[q.id] ?? -1;
        const targetCorrect = q.displayCorrectAnswerIndex ?? q.correctAnswerIndex ?? 0;
        const isCorrect = selected === targetCorrect;
        if (isCorrect) calculatedScore += qPoints;
        return {
          questionId: q.id,
          selectedOption: selected,
          isCorrect,
          pointsAwarded: isCorrect ? qPoints : 0,
          maxPoints: qPoints,
        };
      }

      if (q.type === 'structure') {
        const txt = textAnswers[q.id] || '';
        const attachmentUrl = studentAttachments[q.id] || '';
        // For structure, if manual marking mode, awarded points are 0 until reviewed
        return {
          questionId: q.id,
          textAnswer: txt,
          studentAttachmentUrl: attachmentUrl,
          isCorrect: false,
          pointsAwarded: 0,
          maxPoints: qPoints,
        };
      }

      if (q.type === 'fill_in_blank') {
        const txt = (textAnswers[q.id] || '').trim();
        const acceptable = (q.acceptableAnswers || []).map((a) =>
          q.caseSensitive ? a.trim() : a.trim().toLowerCase()
        );
        const compTxt = q.caseSensitive ? txt : txt.toLowerCase();
        const isCorrect = acceptable.includes(compTxt);
        if (isCorrect) calculatedScore += qPoints;

        return {
          questionId: q.id,
          textAnswer: txt,
          isCorrect,
          pointsAwarded: isCorrect ? qPoints : 0,
          maxPoints: qPoints,
        };
      }

      if (q.type === 'matching') {
        const userMatches = matchingAnswers[q.id] || {};
        const pairs = q.matchingPairs || [];
        let correctPairs = 0;

        const matchedList = pairs.map((pair) => {
          const userRight = userMatches[pair.left] || '';
          const isRight = userRight === pair.right;
          if (isRight) correctPairs++;
          return { left: pair.left, right: userRight };
        });

        const isAllCorrect = pairs.length > 0 && correctPairs === pairs.length;
        const partialPoints =
          pairs.length > 0 ? Math.round((correctPairs / pairs.length) * qPoints) : 0;
        calculatedScore += partialPoints;

        return {
          questionId: q.id,
          matchedPairs: matchedList,
          isCorrect: isAllCorrect,
          pointsAwarded: partialPoints,
          maxPoints: qPoints,
        };
      }

      return {
        questionId: q.id,
        isCorrect: false,
        pointsAwarded: 0,
        maxPoints: qPoints,
      };
    });

    const isManual = quiz.markingMode === 'manual';
    const status = isManual ? 'pending_review' : 'graded';
    const percentage = totalPoints > 0 ? Number(((calculatedScore / totalPoints) * 100).toFixed(1)) : 0;

    const newResult: QuizResult = {
      id: `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      quizId: quiz.id,
      studentId: currentUser?.id || 'guest',
      score: calculatedScore,
      totalPoints,
      percentage,
      completedAt: new Date().toISOString(),
      answers: answerRecords,
      attemptNumber: attemptsUsed + 1,
      status,
      releasedToStudent: !isManual,
    };

    await submitQuizResult(quiz.id, answerRecords, calculatedScore, totalPoints);
    setJustSubmittedResult(newResult);
    setIsSubmitted(true);
    soundEffects.playCelebrationFanfare();

    confetti({
      particleCount: !isManual && percentage >= 75 ? 120 : 60,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto"
        id="quiz-taker-modal"
      >
        {/* Top Header */}
        <div className="p-5 bg-blue-900 text-white flex items-center justify-between border-b border-blue-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-white/15 text-blue-100 border border-white/20">
                {quiz.subject}
              </span>
              <span className="text-xs text-blue-200">
                Attempt #{isReviewOnly ? latestResult?.attemptNumber || 1 : attemptsUsed + 1} of{' '}
                {quiz.maxAttempts || 1}
              </span>
              <span className="text-xs text-blue-200">•</span>
              <span className="text-xs text-blue-200">
                Mode: <strong className="capitalize">{quiz.markingMode || 'auto'}</strong>
              </span>
              {(quiz.shuffleQuestions || quiz.shuffleOptions) && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded font-mono">
                  Randomized
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] mt-1 tracking-tight">
              {quiz.title}
            </h3>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            {/* Audio Feedback Mute / Unmute Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={isMuted ? 'Enable Sound Effects' : 'Mute Sound Effects'}
              className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-white/15"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-300" />
                  <span className="text-[10px] hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span className="text-[10px] text-amber-200 hidden sm:inline">Sound ON</span>
                </>
              )}
            </button>

            {!isSubmitted && !isReviewOnly && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold ${
                  timeLeft < 60
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-blue-950/80 text-blue-200 border border-blue-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gamified Live Progress, XP, & Streak Banner */}
        {!hasExceededAttempts && !isSubmitted && (
          <div className="bg-slate-50/95 px-5 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CheckCheck className="w-4 h-4 text-blue-600" />
                <span>
                  {answeredQuestionsCount} of {activeQuestions.length} answered
                </span>
              </span>

              <span className="text-slate-300">•</span>

              <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
                <span>+{answeredQuestionsCount * 10} XP</span>
              </span>

              {answeredQuestionsCount >= 2 && (
                <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 shadow-2xs animate-in zoom-in-75">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{answeredQuestionsCount}x Streak!</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-1 max-w-[220px]">
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-600 w-9 text-right shrink-0">
                {progressPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* CASE 1: Attempt Limit Reached and Not Taking */}
          {hasExceededAttempts && isReviewOnly && latestResult && !isSubmitted && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
                <Lock className="w-7 h-7 text-amber-700" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Attempt Allocation Completed
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  You have completed all {maxAttempts} allowed attempt(s) for this quiz. Access to retake is locked.
                </p>
              </div>

              {/* Status card */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 max-w-md mx-auto space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-semibold text-slate-600">Latest Submission:</span>
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      latestResult.status === 'graded'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {latestResult.status === 'graded' ? 'Graded & Released' : 'Pending Review'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Score Achieved:</span>
                  <span className="text-sm font-black text-blue-900">
                    {latestResult.score} / {latestResult.totalPoints} pts ({latestResult.percentage}%)
                  </span>
                </div>

                {latestResult.teacherFeedback && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Teacher Feedback:
                    </span>
                    <p className="text-slate-700 italic">{latestResult.teacherFeedback}</p>
                  </div>
                )}
              </div>

              {/* Past Attempts history list */}
              {previousResults.length > 1 && (
                <div className="max-w-md mx-auto text-left space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Attempt History:</h4>
                  {previousResults.map((pr, idx) => (
                    <div
                      key={pr.id}
                      className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs bg-white"
                    >
                      <span className="font-medium text-slate-700">
                        Attempt #{pr.attemptNumber || previousResults.length - idx}
                      </span>
                      <span className="font-bold text-slate-900">
                        {pr.score} / {pr.totalPoints} pts ({pr.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CASE 2: Active Taking State */}
          {!hasExceededAttempts && !isSubmitted && currentQ && (
            <div className="space-y-5">
              {/* Question Navigation indicator */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                  {currentQ.points || 1} {currentQ.points === 1 ? 'Point' : 'Points'}
                </span>
              </div>

              {/* Question card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      currentQ.type === 'structure'
                        ? 'bg-purple-100 text-purple-800'
                        : currentQ.type === 'fill_in_blank'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentQ.type === 'matching'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {currentQ.type?.replace(/_/g, ' ') || 'MCQ'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  <MathText text={currentQ.question} inline={false} />
                </h4>
              </div>

              {currentQ.imageUrl && (
                <div className="my-4 rounded-xl border border-slate-200 overflow-hidden max-h-[300px] flex items-center justify-center bg-slate-50 p-2 shadow-xs">
                  <img
                    src={currentQ.imageUrl}
                    alt="Question Aid"
                    className="max-h-[280px] object-contain rounded-lg animate-in fade-in duration-200"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* QUESTION INPUTS ACCORDING TO TYPE */}

              {/* 1. MCQ OPTIONS */}
              {(!currentQ.type || currentQ.type === 'mcq') && (
                <div className="space-y-3" id="mcq-options-container">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Select the best option (or press keys A, B, C, D on keyboard):
                    </span>
                    {mcqAnswers[currentQ.id] !== undefined && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in zoom-in-75">
                        <Check className="w-3 h-3 stroke-[3]" /> Answer Locked
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {(currentQ.displayOptions || currentQ.options)?.map((option, idx) => {
                      const isSelected = mcqAnswers[currentQ.id] === idx;
                      const optionLetter = String.fromCharCode(65 + idx);

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectMcq(idx)}
                          className={`group w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all transform active:scale-[0.98] flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 text-blue-950 shadow-sm ring-2 ring-blue-500/20 scale-[1.01]'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 text-slate-700 hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-1 pr-2">
                            <span
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="leading-relaxed font-semibold text-xs sm:text-sm">
                              <MathText text={option} />
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/90 px-2.5 py-1 rounded-full animate-in zoom-in-75">
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected ✨
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-300 font-mono hidden sm:inline group-hover:text-slate-400">
                                [{optionLetter}]
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. STRUCTURED QUESTION (ESSAY / EXPLANATION) */}
              {currentQ.type === 'structure' && (
                <ShortStructureFeedback
                  questionId={currentQ.id}
                  value={textAnswers[currentQ.id] || ''}
                  wordLimit={currentQ.wordLimit || 120}
                  attachmentUrl={studentAttachments[currentQ.id] || ''}
                  onChangeText={(txt) =>
                    setTextAnswers((prev) => ({ ...prev, [currentQ.id]: txt }))
                  }
                  onChangeAttachment={(url) =>
                    setStudentAttachments((prev) => ({ ...prev, [currentQ.id]: url }))
                  }
                />
              )}

              {/* 3. FILL IN THE BLANK */}
              {currentQ.type === 'fill_in_blank' && (
                <FillInBlankInteractive
                  questionId={currentQ.id}
                  questionText={currentQ.question}
                  value={textAnswers[currentQ.id] || ''}
                  caseSensitive={currentQ.caseSensitive || false}
                  onChange={(val) =>
                    setTextAnswers((prev) => ({ ...prev, [currentQ.id]: val }))
                  }
                />
              )}

              {/* 4. MATCHING QUESTION (DRAG AND DROP / TAP TO PAIR) */}
              {currentQ.type === 'matching' && (
                <InteractiveMatchingQuestion
                  questionId={currentQ.id}
                  pairs={currentQ.matchingPairs || []}
                  currentMatches={matchingAnswers[currentQ.id] || {}}
                  onChange={(updatedMatches) =>
                    setMatchingAnswers((prev) => ({
                      ...prev,
                      [currentQ.id]: updatedMatches,
                    }))
                  }
                />
              )}
            </div>
          )}

          {/* CASE 3: Post-Submission Screen */}
          {isSubmitted && justSubmittedResult && (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto shadow-xs border border-blue-200">
                <Award className="w-8 h-8 text-blue-700" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  {quiz.markingMode === 'manual'
                    ? 'Assessment Submitted for Review!'
                    : 'Quiz Assessment Completed!'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {quiz.markingMode === 'manual'
                    ? 'Your answers have been submitted to your teacher. Marks and written feedback will be released once your teacher completes manual grading.'
                    : 'Your answers have been recorded in the Class Leaderboard & Gradebook.'}
                </p>
              </div>

              {/* Mode Outcome Banner */}
              {quiz.markingMode === 'manual' ? (
                <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 max-w-md mx-auto space-y-2 text-left">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Status: Pending Teacher Review</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    This quiz contains structured or teacher-evaluated questions. Your teacher will evaluate your work and release final marks and personalized feedback.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-2">
                  <div className="text-4xl font-black text-blue-700 font-['Plus_Jakarta_Sans',sans-serif]">
                    {justSubmittedResult.percentage}%
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {justSubmittedResult.score} of {justSubmittedResult.totalPoints} Points Earned
                  </p>
                </div>
              )}

              {/* Objective Answers Review if Auto Mode */}
              {quiz.markingMode !== 'manual' && (
                <div className="text-left space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Detailed Review:</h4>
                  {quiz.questions.map((q, idx) => {
                    const ans = justSubmittedResult.answers.find((a) => a.questionId === q.id);
                    const isCorrect = ans?.isCorrect;
                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          isCorrect ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 leading-snug">
                            {idx + 1}. <MathText text={q.question} />
                          </span>
                          <span className={isCorrect ? 'text-emerald-700 shrink-0 ml-2' : 'text-rose-600 shrink-0 ml-2'}>
                            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>

                        {(!q.type || q.type === 'mcq') && q.options && (
                          <div className="text-slate-600 space-y-1">
                            <div>
                              Your answer:{' '}
                              <strong>
                                {ans?.selectedOption !== undefined && ans.selectedOption >= 0 ? (
                                  <MathText text={q.options[ans.selectedOption]} />
                                ) : (
                                  'No answer'
                                )}
                              </strong>
                            </div>
                            {!isCorrect && q.correctAnswerIndex !== undefined && (
                              <div className="text-emerald-800">
                                Correct answer:{' '}
                                <strong>
                                  <MathText text={q.options[q.correctAnswerIndex]} />
                                </strong>
                              </div>
                            )}
                          </div>
                        )}

                        {q.type === 'fill_in_blank' && (
                          <div className="text-slate-600 space-y-1">
                            <div>
                              Your answer: <strong>"{ans?.textAnswer || ''}"</strong>
                            </div>
                            {!isCorrect && (
                              <div className="text-emerald-800">
                                Accepted:{' '}
                                <strong>{q.acceptableAnswers?.join(', ')}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {q.type === 'structure' && (
                          <div className="text-slate-600 space-y-1.5">
                            <div>
                              Your written response:{' '}
                              <strong>{ans?.textAnswer ? <MathText text={ans.textAnswer} /> : <span className="italic text-slate-400">None</span>}</strong>
                            </div>
                            {ans?.studentAttachmentUrl && (
                              <div className="pt-1">
                                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                                  Your submitted photo/calculation:
                                </span>
                                <div className="max-w-[200px] rounded border border-slate-200 p-1 bg-white">
                                  <img
                                    src={ans.studentAttachmentUrl}
                                    alt="Submitted work"
                                    className="max-h-[120px] object-contain rounded"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              </div>
                            )}
                            {q.modelAnswer && (
                              <div className="text-purple-800 text-[11px] bg-purple-50 p-2 rounded-lg border border-purple-100">
                                <strong>Marking Scheme:</strong> <MathText text={q.modelAnswer} />
                              </div>
                            )}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="text-slate-600 text-[11px] pt-1.5 border-t border-slate-200/50 flex items-start gap-1">
                            <span className="shrink-0">💡</span>
                            <div>
                              <MathText text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!hasExceededAttempts && !isSubmitted ? (
            <>
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => {
                  setCurrentQuestionIndex((prev) => prev - 1);
                  soundEffects.playPop(420);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {/* Numbered Question Badges with Answered/Active State */}
              <div className="flex items-center gap-1.5 overflow-x-auto px-2 max-w-[50%]">
                {activeQuestions.map((q, i) => {
                  const hasAnswer =
                    (!q.type || q.type === 'mcq')
                      ? mcqAnswers[q.id] !== undefined
                      : q.type === 'structure'
                      ? Boolean(textAnswers[q.id]?.trim() || studentAttachments[q.id]?.trim())
                      : q.type === 'fill_in_blank'
                      ? Boolean(textAnswers[q.id]?.trim())
                      : Object.keys(matchingAnswers[q.id] || {}).length > 0;

                  const isCurrent = currentQuestionIndex === i;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCurrentQuestionIndex(i);
                        soundEffects.playPop(520);
                      }}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[10px] sm:text-xs font-bold shrink-0 transition-all flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300 scale-110 shadow-xs'
                          : hasAnswer
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={`Question ${i + 1}${hasAnswer ? ' (Answered)' : ''}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {currentQuestionIndex < activeQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => prev + 1);
                    soundEffects.playPop(480);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmitQuiz(false)}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 ${
                    answeredQuestionsCount === activeQuestions.length
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 ring-2 ring-emerald-300 animate-pulse'
                      : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Submit Assessment</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs"
            >
              Return to Student Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
