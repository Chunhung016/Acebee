import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Quiz, QuizQuestion } from '../../types';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';

interface QuizTakerModalProps {
  quiz: Quiz;
  onClose: () => void;
}

export const QuizTakerModal: React.FC<QuizTakerModalProps> = ({ quiz, onClose }) => {
  const { submitQuizResult, currentUser } = useApp();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreSummary, setScoreSummary] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const currentQ = quiz.questions[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    if (isSubmitted) return;

    let correctCount = 0;
    const totalCount = quiz.questions.length;
    const answerRecords = quiz.questions.map((q, idx) => {
      const selected = selectedAnswers[idx] ?? -1;
      const isCorrect = selected === q.correctAnswerIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        selectedOption: selected,
        isCorrect,
      };
    });

    const percentage = Number(((correctCount / totalCount) * 100).toFixed(1));
    submitQuizResult(quiz.id, answerRecords, correctCount, totalCount);

    setScoreSummary({
      score: correctCount,
      total: totalCount,
      percentage,
    });
    setIsSubmitted(true);

    // Trigger celebratory confetti if passed well (>= 75%)
    if (percentage >= 75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        id="quiz-taker-modal"
      >
        {/* Header */}
        <div className="p-5 bg-blue-900 text-white flex items-center justify-between border-b border-blue-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-white/15 text-blue-100 border border-white/20">
                {quiz.subject}
              </span>
              <span className="text-xs text-blue-200">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
            </div>
            <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif] mt-1 tracking-tight">{quiz.title}</h3>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {!isSubmitted && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold ${
                  timeLeft < 60
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-blue-950/80 text-blue-200 border border-blue-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quiz Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!isSubmitted ? (
            <div>
              {/* Question card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
                <p className="text-xs text-blue-700 font-bold uppercase mb-1">
                  Question #{currentQuestionIndex + 1}
                </p>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {currentQ?.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ?.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-blue-900 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto shadow-xs border border-blue-200">
                <Award className="w-8 h-8 text-blue-700" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Quiz Assessment Completed!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your answers have been recorded in the Class Leaderboard & Gradebook.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-2">
                <div className="text-4xl font-black text-blue-700 font-['Plus_Jakarta_Sans',sans-serif]">
                  {scoreSummary?.percentage}%
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {scoreSummary?.score} of {scoreSummary?.total} Questions Correct
                </p>
              </div>

              {/* Answers Review */}
              <div className="text-left space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase">Detailed Review:</h4>
                {quiz.questions.map((q, idx) => {
                  const selected = selectedAnswers[idx] ?? -1;
                  const isCorrect = selected === q.correctAnswerIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        isCorrect ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">
                          {idx + 1}. {q.question}
                        </span>
                        <span className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Your answer: <strong>{q.options[selected] || 'No Answer'}</strong>
                      </p>
                      {!isCorrect && (
                        <p className="text-emerald-800">
                          Correct answer: <strong>{q.options[q.correctAnswerIndex]}</strong>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-slate-500 italic text-[11px] pt-1">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1.5">
                {quiz.questions.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                      currentQuestionIndex === i
                        ? 'bg-blue-600 scale-125'
                        : selectedAnswers[i] !== undefined
                        ? 'bg-blue-900'
                        : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-200" />
                  <span>Submit Quiz</span>
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
