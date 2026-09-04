import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Subject, CommentCategory, QuizQuestion, StudentDetail } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  BookOpen,
  Users,
  Award,
  MessageSquare,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Send,
  HelpCircle,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const {
    currentUser,
    classes,
    users,
    studentDetails,
    quizzes,
    quizResults,
    teacherComments,
    createQuiz,
    deleteQuiz,
    updateStudentDetail,
    postTeacherComment,
    deleteTeacherComment,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roster' | 'quizzes' | 'behavior' | 'gradebook'>('roster');

  // Find teacher's assigned class
  const teacherClass = classes.find((c) => c.teacherId === currentUser?.id) || classes[0];
  const assignedStudentDetails = studentDetails.filter((d) => d.classId === teacherClass?.id);

  // Editing Student Detail State
  const [editingStudentDetail, setEditingStudentDetail] = useState<StudentDetail | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // New Quiz Builder State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizSubject, setQuizSubject] = useState<Subject>('Mathematics');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [quizDueDate, setQuizDueDate] = useState('2026-03-30');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-new-1',
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
    },
  ]);
  const [quizSuccessMsg, setQuizSuccessMsg] = useState<string | null>(null);

  // Behavioral Comment State
  const [selectedStudentId, setSelectedStudentId] = useState(
    assignedStudentDetails[0]?.studentId || ''
  );
  const [commentCategory, setCommentCategory] = useState<CommentCategory>('positive');
  const [commentText, setCommentText] = useState('');
  const [commentSuccessMsg, setCommentSuccessMsg] = useState<string | null>(null);

  // Handle Edit Student Details
  const handleSaveStudentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentDetail) return;

    updateStudentDetail(editingStudentDetail.studentId, {
      parentName: editingStudentDetail.parentName,
      parentPhone: editingStudentDetail.parentPhone,
      parentEmail: editingStudentDetail.parentEmail,
      address: editingStudentDetail.address,
      emergencyContact: editingStudentDetail.emergencyContact,
      notes: editingStudentDetail.notes,
    });

    setEditSuccessMsg('Student and parent contact information updated successfully.');
    setTimeout(() => {
      setEditingStudentDetail(null);
      setEditSuccessMsg(null);
    }, 1500);
  };

  // Add Question to Quiz
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-new-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: '',
      },
    ]);
  };

  // Update Question Option
  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  // Handle Create Quiz Submit
  const handleCreateQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherClass) return;

    // Filter valid questions
    const validQuestions = questions.filter((q) => q.question.trim().length > 0);
    if (validQuestions.length === 0) {
      alert('Please add at least one valid question.');
      return;
    }

    createQuiz({
      classId: teacherClass.id,
      title: quizTitle,
      subject: quizSubject,
      description: quizDescription,
      timeLimitMinutes: Number(quizTimeLimit),
      dueDate: new Date(quizDueDate).toISOString(),
      questions: validQuestions,
    });

    setQuizSuccessMsg(`Quiz "${quizTitle}" published for ${teacherClass.name}!`);
    setQuizTitle('');
    setQuizDescription('');
    setQuestions([
      {
        id: `q-new-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: '',
      },
    ]);
  };

  // Handle Post Behavior Comment
  const handlePostBehaviorComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !commentText.trim()) return;

    const studentDet = studentDetails.find((d) => d.studentId === selectedStudentId);
    const parentId = studentDet?.parentId || '';

    postTeacherComment({
      studentId: selectedStudentId,
      parentId,
      category: commentCategory,
      comment: commentText.trim(),
    });

    setCommentSuccessMsg('Behavioral comment dispatched to parent portal successfully.');
    setCommentText('');
  };

  // Teacher Quizzes
  const teacherQuizzes = quizzes.filter(
    (q) => q.teacherId === currentUser?.id || q.classId === teacherClass?.id
  );

  // Teacher Comments history
  const teacherCommentsList = teacherComments.filter(
    (c) => c.teacherId === currentUser?.id
  );

  const getCategoryColor = (cat: CommentCategory) => {
    switch (cat) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'improvement':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'achievement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-md border border-blue-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <UserAvatar
              name={currentUser?.fullName}
              role="teacher"
              size="xl"
              className="border-2 border-white/20 shadow-md"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-mono uppercase tracking-wider mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-300" />
              Teacher Classroom Portal
            </div>
            <h1 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Welcome, {currentUser?.fullName}
            </h1>
            <p className="text-xs text-blue-200 mt-0.5 leading-relaxed">
              Homeroom Class: <strong className="text-white">{teacherClass?.name || 'Assigned Class'}</strong> ({teacherClass?.gradeLevel}) • {assignedStudentDetails.length} Enrolled Students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-blue-950/80 px-4 py-2.5 rounded-lg border border-blue-800/80 text-xs text-blue-100">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Curriculum: Math, English, Science, Social Studies, Art</span>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'roster'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="teacher-tab-roster"
        >
          <Users className="w-4 h-4" />
          Class Roster & Student Profiles ({assignedStudentDetails.length})
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'quizzes'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="teacher-tab-quizzes"
        >
          <Award className="w-4 h-4" />
          Subject Quizzes & Creator ({teacherQuizzes.length})
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'behavior'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="teacher-tab-behavior"
        >
          <MessageSquare className="w-4 h-4" />
          Parent Behavioral Notes & Mentions
        </button>

        <button
          onClick={() => setActiveTab('gradebook')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'gradebook'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="teacher-tab-gradebook"
        >
          <Award className="w-4 h-4" />
          Class Submissions & Gradebook
        </button>
      </div>

      {/* TAB 1: CLASS ROSTER & EDIT STUDENT DETAILS */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-base">
                    Class Roster: {teacherClass?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage student profiles, emergency contacts, and linked parent details
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {assignedStudentDetails.map((det) => {
                const studentUser = users.find((u) => u.id === det.studentId);
                const isEditing = editingStudentDetail?.studentId === det.studentId;

                return (
                  <div key={det.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={studentUser?.fullName}
                          avatarUrl={studentUser?.avatarUrl}
                          role="student"
                          size="lg"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {studentUser?.fullName}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">
                            {studentUser?.email}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 flex-1 md:px-6">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Parent / Guardian
                          </span>
                          <span className="font-semibold text-slate-800">{det.parentName}</span>
                          <span className="text-[11px] text-slate-500 block">{det.parentPhone}</span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Address on Record
                          </span>
                          <span className="line-clamp-2">{det.address}</span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Emergency Contact
                          </span>
                          <span>{det.emergencyContact || 'Not specified'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setEditingStudentDetail(isEditing ? null : { ...det })
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isEditing ? 'Close' : 'Edit Details'}</span>
                      </button>
                    </div>

                    {/* Inline Editing Form */}
                    {isEditing && editingStudentDetail && (
                      <form
                        onSubmit={handleSaveStudentDetails}
                        className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3 animate-in fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-950">
                            Editing Information for {studentUser?.fullName}
                          </span>
                          {editSuccessMsg && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {editSuccessMsg}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Parent Name
                            </label>
                            <input
                              type="text"
                              required
                              value={editingStudentDetail.parentName}
                              onChange={(e) =>
                                setEditingStudentDetail({
                                  ...editingStudentDetail,
                                  parentName: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Parent Phone
                            </label>
                            <input
                              type="text"
                              required
                              value={editingStudentDetail.parentPhone}
                              onChange={(e) =>
                                setEditingStudentDetail({
                                  ...editingStudentDetail,
                                  parentPhone: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Parent Email
                            </label>
                            <input
                              type="email"
                              value={editingStudentDetail.parentEmail || ''}
                              onChange={(e) =>
                                setEditingStudentDetail({
                                  ...editingStudentDetail,
                                  parentEmail: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Residential Address
                            </label>
                            <input
                              type="text"
                              required
                              value={editingStudentDetail.address}
                              onChange={(e) =>
                                setEditingStudentDetail({
                                  ...editingStudentDetail,
                                  address: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Emergency Contact & Relation
                            </label>
                            <input
                              type="text"
                              value={editingStudentDetail.emergencyContact || ''}
                              onChange={(e) =>
                                setEditingStudentDetail({
                                  ...editingStudentDetail,
                                  emergencyContact: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStudentDetail(null)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold"
                          >
                            Save Details
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT QUIZZES & CREATOR */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Post New Quiz Form */}
          <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Create Subject Quiz
                </h3>
                <p className="text-xs text-slate-500">
                  Assign a timed quiz to your class ({teacherClass?.name})
                </p>
              </div>
            </div>

            {quizSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{quizSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuizSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Photosynthesis & Cellular Ecosystems"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  id="teacher-quiz-title-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={quizSubject}
                    onChange={(e) => setQuizSubject(e.target.value as Subject)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                    id="teacher-quiz-subject-select"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Science">Science</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Art & Technology">Art & Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={quizDueDate}
                    onChange={(e) => setQuizDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Study Objective
                </label>
                <textarea
                  rows={2}
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Key concepts assessed..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Questions Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Questions ({questions.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    + Add Question
                  </button>
                </div>

                {questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        Question #{qIndex + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setQuestions((prev) => prev.filter((_, i) => i !== qIndex))
                          }
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item, i) =>
                            i === qIndex ? { ...item, question: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Enter question text here..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswerIndex === optIndex}
                            onChange={() =>
                              setQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex
                                    ? { ...item, correctAnswerIndex: optIndex }
                                    : item
                                )
                              )
                            }
                            className="text-blue-600 focus:ring-blue-500"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(qIndex, optIndex, e.target.value)
                            }
                            placeholder={`Option ${optIndex + 1}`}
                            className="w-full px-2 py-1 rounded-md border border-slate-200 text-[11px] bg-white focus:border-blue-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all"
                id="publish-quiz-btn"
              >
                Publish Quiz to Class
              </button>
            </form>
          </div>

          {/* Published Quizzes List */}
          <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Active Quizzes ({teacherQuizzes.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Class: {teacherClass?.name}</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {teacherQuizzes.map((quiz) => {
                const resultsForQuiz = quizResults.filter((r) => r.quizId === quiz.id);
                const avgScore =
                  resultsForQuiz.length > 0
                    ? (
                        resultsForQuiz.reduce((acc, r) => acc + r.percentage, 0) /
                        resultsForQuiz.length
                      ).toFixed(1)
                    : 'N/A';

                return (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {quiz.subject}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{quiz.title}</h4>
                      </div>

                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600">{quiz.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.questions.length} Questions ({quiz.timeLimitMinutes} min)
                      </span>
                      <span className="font-semibold text-blue-700">
                        {resultsForQuiz.length} Submissions • Avg: {avgScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARENT BEHAVIORAL NOTES & MENTIONS */}
      {activeTab === 'behavior' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Post Behavioral Note Form */}
          <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Send Parent Behavioral Note
                </h3>
                <p className="text-xs text-slate-500">
                  Delivered privately to the linked Parent Dashboard
                </p>
              </div>
            </div>

            {commentSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{commentSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePostBehaviorComment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  id="behavior-student-select"
                >
                  {assignedStudentDetails.map((det) => {
                    const studentUser = users.find((u) => u.id === det.studentId);
                    return (
                      <option key={det.studentId} value={det.studentId}>
                        {studentUser?.fullName} (Parent: {det.parentName})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Classification *
                </label>
                <select
                  value={commentCategory}
                  onChange={(e) => setCommentCategory(e.target.value as CommentCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="positive">🌟 Positive Commendation / Teamwork</option>
                  <option value="improvement">⚠️ Growth Area / Gentle Reminder</option>
                  <option value="achievement">🏆 Outstanding Academic Achievement</option>
                  <option value="general">📝 General Classroom Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Comment Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share constructive feedback, classroom participation observations, or homework tips with the parent..."
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  id="behavior-comment-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                id="send-behavior-note-btn"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Note to Parent</span>
              </button>
            </form>
          </div>

          {/* Sent Comments Timeline */}
          <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Sent Behavioral Mentions Timeline ({teacherCommentsList.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Class: {teacherClass?.name}</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {teacherCommentsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No behavioral comments recorded yet.</p>
              ) : (
                teacherCommentsList.map((comm) => {
                  const studentUser = users.find((u) => u.id === comm.studentId);
                  const studentDet = studentDetails.find((d) => d.studentId === comm.studentId);

                  return (
                    <div
                      key={comm.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getCategoryColor(
                              comm.category
                            )}`}
                          >
                            {comm.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Student: {studentUser?.fullName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Parent: {studentDet?.parentName})
                          </span>
                        </div>

                        <button
                          onClick={() => deleteTeacherComment(comm.id)}
                          className="text-slate-400 hover:text-red-500"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                        {comm.comment}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Date: {comm.date}</span>
                        <span
                          className={`font-semibold ${
                            comm.isRead ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {comm.isRead ? '✓ Read by Parent' : '○ Pending Parent Review'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GRADEBOOK & STUDENT SUBMISSIONS */}
      {activeTab === 'gradebook' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-base">
                Subject Mastery & Student Submissions
              </h3>
              <p className="text-xs text-slate-500">
                Real-time grades across all 5 subjects for {teacherClass?.name}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Math</th>
                  <th className="py-3 px-4">Science</th>
                  <th className="py-3 px-4">English</th>
                  <th className="py-3 px-4">Social Studies</th>
                  <th className="py-3 px-4">Overall Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedStudentDetails.map((det) => {
                  const studentUser = users.find((u) => u.id === det.studentId);
                  const studentResults = quizResults.filter((r) => r.studentId === det.studentId);

                  const avg =
                    studentResults.length > 0
                      ? (
                          studentResults.reduce((acc, r) => acc + r.percentage, 0) /
                          studentResults.length
                        ).toFixed(1)
                      : 'N/A';

                  return (
                    <tr key={det.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {studentUser?.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {studentResults.find((r) => r.quizId === 'quiz-math-1')?.percentage ?? '-'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {studentResults.find((r) => r.quizId === 'quiz-sci-1')?.percentage ?? '-'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {studentResults.find((r) => r.quizId === 'quiz-eng-1')?.percentage ?? '-'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {studentResults.find((r) => r.quizId === 'quiz-soc-1')?.percentage ?? '-'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                          {avg !== 'N/A' ? `${avg}%` : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
