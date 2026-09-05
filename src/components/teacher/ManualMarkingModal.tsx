import React, { useState, useEffect } from 'react';
import { Quiz, QuizResult, QuizQuestion, User } from '../../types';
import { useApp } from '../../context/AppContext';
import { MathText } from '../common/MathRenderer';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ManualMarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: QuizResult;
  quiz: Quiz;
  student?: User | null;
}

export const ManualMarkingModal: React.FC<ManualMarkingModalProps> = ({
  isOpen,
  onClose,
  result,
  quiz,
  student,
}) => {
  const { releaseQuizMarks, currentUser } = useApp();

  // Local state for question scores and comments
  const [questionScores, setQuestionScores] = useState<
    Record<string, { pointsAwarded: number; teacherComment: string }>
  >({});
  const [overallFeedback, setOverallFeedback] = useState<string>(result.teacherFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (result) {
      const initial: Record<string, { pointsAwarded: number; teacherComment: string }> = {};
      result.answers.forEach((ans) => {
        initial[ans.questionId] = {
          pointsAwarded: ans.pointsAwarded ?? (ans.isCorrect ? (ans.maxPoints ?? 1) : 0),
          teacherComment: ans.teacherComment || '',
        };
      });
      setQuestionScores(initial);
      setOverallFeedback(result.teacherFeedback || '');
    }
  }, [result]);

  if (!isOpen) return null;

  const handleScoreChange = (qId: string, val: number, maxPoints: number) => {
    const clamped = Math.max(0, Math.min(val, maxPoints));
    setQuestionScores((prev) => ({
      ...prev,
      [qId]: {
        pointsAwarded: clamped,
        teacherComment: prev[qId]?.teacherComment || '',
      },
    }));
  };

  const handleCommentChange = (qId: string, text: string) => {
    setQuestionScores((prev) => ({
      ...prev,
      [qId]: {
        pointsAwarded: prev[qId]?.pointsAwarded ?? 0,
        teacherComment: text,
      },
    }));
  };

  // Calculate live total points
  const totalAwarded = (
    Object.values(questionScores) as { pointsAwarded: number; teacherComment: string }[]
  ).reduce((sum: number, val) => sum + (Number(val.pointsAwarded) || 0), 0);
  const livePercentage =
    result.totalPoints > 0 ? Number(((totalAwarded / result.totalPoints) * 100).toFixed(1)) : 0;

  const handleRelease = async () => {
    setIsSubmitting(true);
    try {
      const scoresPayload = (
        Object.entries(questionScores) as [
          string,
          { pointsAwarded: number; teacherComment: string }
        ][]
      ).map(([questionId, data]) => ({
        questionId,
        pointsAwarded: data.pointsAwarded,
        teacherComment: data.teacherComment,
      }));

      await releaseQuizMarks(result.id, overallFeedback, scoresPayload);
      setSuccessMessage('Marks and teacher feedback released successfully to student!');
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {quiz.subject}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Grade & Release Marks: {quiz.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Student: <strong className="text-slate-700">{student?.fullName || 'Student'}</strong> •{' '}
              Attempt #{result.attemptNumber || 1} • Submitted on{' '}
              {new Date(result.completedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Score Bar */}
        <div className="px-6 py-3 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500">Status: </span>
              <span
                className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  result.status === 'graded'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {result.status === 'graded' ? 'Graded & Released' : 'Pending Review'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Marking Mode: </span>
              <strong className="text-slate-800 capitalize">{quiz.markingMode || 'auto'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500">Total Score:</span>
              <div className="text-sm font-black text-blue-900">
                {totalAwarded} / {result.totalPoints} pts ({livePercentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* Questions and Answers Grading List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {quiz.questions.map((q, idx) => {
            const answerRecord = result.answers.find((a) => a.questionId === q.id);
            const currentScore = questionScores[q.id]?.pointsAwarded ?? 0;
            const currentComment = questionScores[q.id]?.teacherComment ?? '';
            const maxPoints = q.points || 1;

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
              >
                {/* Question title & points input */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          q.type === 'structure'
                            ? 'bg-purple-100 text-purple-800'
                            : q.type === 'fill_in_blank'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.type === 'matching'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {q.type?.replace(/_/g, ' ') || 'MCQ'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Max: {maxPoints} {maxPoints === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      <MathText text={q.question} inline={false} />
                    </h4>
                  </div>

                  {/* Award points control */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <label className="text-[11px] font-bold text-slate-600">Points:</label>
                    <input
                      type="number"
                      min="0"
                      max={maxPoints}
                      step="1"
                      value={currentScore}
                      onChange={(e) => handleScoreChange(q.id, Number(e.target.value), maxPoints)}
                      className="w-14 px-1.5 py-1 text-xs font-bold text-center rounded border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-400">/ {maxPoints}</span>
                  </div>
                </div>

                {/* Question Details by Type */}

                {/* 1. MCQ */}
                {(!q.type || q.type === 'mcq') && q.options && (
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs">
                    <div className="text-[11px] text-slate-500 font-medium">Student Selection:</div>
                    <div
                      className={`p-2 rounded font-semibold border ${
                        answerRecord?.isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      {answerRecord?.selectedOption !== undefined &&
                      answerRecord.selectedOption >= 0 &&
                      q.options[answerRecord.selectedOption] ? (
                        <div className="flex items-center gap-1">
                          <span>{String.fromCharCode(65 + answerRecord.selectedOption)}.</span>
                          <MathText text={q.options[answerRecord.selectedOption]} />
                        </div>
                      ) : (
                        'No answer chosen'
                      )}
                    </div>
                    {!answerRecord?.isCorrect && q.correctAnswerIndex !== undefined && (
                      <div className="text-[11px] text-emerald-800 flex items-center gap-1">
                        <span>Correct Option:</span>
                        <strong>
                          {String.fromCharCode(65 + q.correctAnswerIndex)}. <MathText text={q.options[q.correctAnswerIndex]} />
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Structured Essay */}
                {q.type === 'structure' && (
                  <div className="space-y-2">
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">
                        Student's Submitted Written Response:
                      </span>
                      <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                        {answerRecord?.textAnswer ? (
                          <MathText text={answerRecord.textAnswer} inline={false} />
                        ) : (
                          <span className="italic text-slate-400">No response provided</span>
                        )}
                      </div>
                    </div>

                    {(q.modelAnswer || q.guidelines) && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
                        {q.modelAnswer && (
                          <div className="flex items-start gap-1">
                            <strong className="text-slate-900 shrink-0">Marking Scheme / Model: </strong>
                            <span><MathText text={q.modelAnswer} /></span>
                          </div>
                        )}
                        {q.guidelines && (
                          <div className="text-[11px] text-purple-700">
                            <strong>Rubrics: </strong> {q.guidelines}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Fill in Blank */}
                {q.type === 'fill_in_blank' && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500">Student typed: </span>
                      <strong className="text-slate-900 text-sm">
                        "{answerRecord?.textAnswer || 'None'}"
                      </strong>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Accepted Answers: {q.acceptableAnswers?.join(', ') || 'None specified'}
                    </div>
                  </div>
                )}

                {/* 4. Matching */}
                {q.type === 'matching' && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-amber-900">Student Matched Pairs:</span>
                    {q.matchingPairs?.map((pair, pIdx) => {
                      const studentPair = answerRecord?.matchedPairs?.find((mp) => mp.left === pair.left);
                      const isPairMatch = studentPair && studentPair.right === pair.right;
                      return (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between p-1.5 rounded bg-white border border-amber-200"
                        >
                          <span className="font-medium text-slate-800"><MathText text={pair.left} /></span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isPairMatch ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {studentPair?.right ? <MathText text={studentPair.right} /> : 'Unmatched'}
                          </span>
                          {!isPairMatch && (
                            <span className="text-[10px] text-emerald-800">
                              (Expected: <MathText text={pair.right} />)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Teacher Question-Specific Comment */}
                <div>
                  <input
                    type="text"
                    value={currentComment}
                    onChange={(e) => handleCommentChange(q.id, e.target.value)}
                    placeholder="Add teacher comment or rubric remark for this question (optional)..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}

          {/* Overall Feedback to Student */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-bold text-slate-800">
                Overall Teacher Feedback to Student & Parent
              </label>
            </div>
            <textarea
              rows={3}
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="e.g. Great structured answers in the essay section! Remember to explain the chemical formula steps clearly..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Clicking Release will finalize the grade and make marks & comments visible on student & parent portals.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRelease}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{result.status === 'graded' ? 'Update & Re-release Marks' : 'Release Marks to Student'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
