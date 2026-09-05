import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Subject,
  CommentCategory,
  QuizQuestion,
  StudentDetail,
  QuestionType,
  MatchingPair,
} from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { QuestionBankView } from '../questions/QuestionBankView';
import { QuestionBankPickerModal } from '../questions/QuestionBankPickerModal';
import { MarkdownBulkImportModal } from '../questions/MarkdownBulkImportModal';
import { TeacherGradingView } from './TeacherGradingView';
import { ParentAlertsView } from '../alerts/ParentAlertsView';
import {
  BookOpen,
  Users,
  Award,
  MessageSquare,
  MessageCircle,
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
  Layers,
  FileText,
  Database,
  CheckSquare,
  FileCheck,
  Plus,
  SplitSquareVertical,
  Sliders,
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
    questionBank,
    parentAlerts,
    createQuiz,
    deleteQuiz,
    updateStudentDetail,
    postTeacherComment,
    deleteTeacherComment,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'roster' | 'quizzes' | 'questions' | 'grading' | 'behavior' | 'gradebook' | 'alerts'
  >('roster');

  // Find all classes assigned to this teacher
  const teacherClasses = classes.filter((c) => c.teacherId === currentUser?.id);
  const availableClasses = teacherClasses.length > 0 ? teacherClasses : classes;

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return teacherClasses[0]?.id || classes[0]?.id || '';
  });

  // Ensure selectedClassId stays valid if classes list changes
  useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [availableClasses, selectedClassId]);

  const currentClass = classes.find((c) => c.id === selectedClassId) || availableClasses[0] || classes[0];
  const assignedStudentDetails = studentDetails.filter((d) => d.classId === currentClass?.id);

  // Editing Student Detail State
  const [editingStudentDetail, setEditingStudentDetail] = useState<StudentDetail | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // New Quiz Builder State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizSubject, setQuizSubject] = useState<Subject>('Mathematics');
  const [quizClassId, setQuizClassId] = useState<string>(currentClass?.id || '');
  const [quizAssignedClassIds, setQuizAssignedClassIds] = useState<string[]>([]);
  const [quizDescription, setQuizDescription] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [quizMaxAttempts, setQuizMaxAttempts] = useState(1);
  const [quizMarkingMode, setQuizMarkingMode] = useState<'auto' | 'manual'>('auto');
  const [quizDueDate, setQuizDueDate] = useState('2026-03-30');
  const [quizShuffleQuestions, setQuizShuffleQuestions] = useState(false);
  const [quizShuffleOptions, setQuizShuffleOptions] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-new-1',
      type: 'mcq',
      question: '',
      points: 1,
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
    },
  ]);
  const [quizSuccessMsg, setQuizSuccessMsg] = useState<string | null>(null);

  // Modals for question bank and bulk key-in
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Sync quizClassId with currentClass when currentClass changes and quizClassId is not set
  useEffect(() => {
    if (currentClass?.id && !quizClassId) {
      setQuizClassId(currentClass.id);
    }
  }, [currentClass, quizClassId]);

  // Behavioral Comment State
  const [selectedStudentId, setSelectedStudentId] = useState(
    assignedStudentDetails[0]?.studentId || ''
  );

  useEffect(() => {
    if (assignedStudentDetails.length > 0) {
      if (!assignedStudentDetails.some((d) => d.studentId === selectedStudentId)) {
        setSelectedStudentId(assignedStudentDetails[0].studentId);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [assignedStudentDetails, selectedStudentId]);

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

  // Add Question to Quiz with specific type
  const handleAddQuestion = (type: QuestionType = 'mcq') => {
    const newId = `q-new-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    let newQ: QuizQuestion;
    if (type === 'mcq') {
      newQ = {
        id: newId,
        type: 'mcq',
        question: '',
        points: 1,
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: '',
      };
    } else if (type === 'structure') {
      newQ = {
        id: newId,
        type: 'structure',
        question: '',
        points: 5,
        modelAnswer: '',
        guidelines: 'Clear explanation with relevant examples',
        wordLimit: 150,
      };
    } else if (type === 'fill_in_blank') {
      newQ = {
        id: newId,
        type: 'fill_in_blank',
        question: 'Photosynthesis converts sunlight and water into [blank].',
        points: 2,
        acceptableAnswers: ['glucose', 'sugar'],
        caseSensitive: false,
      };
    } else {
      newQ = {
        id: newId,
        type: 'matching',
        question: 'Match each term to its correct definition:',
        points: 4,
        matchingPairs: [
          { id: 'p-1', left: 'Term A', right: 'Definition A' },
          { id: 'p-2', left: 'Term B', right: 'Definition B' },
        ],
      };
    }
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleQuestionTypeChange = (index: number, newType: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        const base = { ...q, type: newType };
        if (newType === 'mcq') {
          return {
            ...base,
            options: base.options && base.options.length >= 2 ? base.options : ['', '', '', ''],
            correctAnswerIndex: base.correctAnswerIndex ?? 0,
            points: base.points || 1,
          };
        } else if (newType === 'structure') {
          return {
            ...base,
            points: base.points || 5,
            modelAnswer: base.modelAnswer || '',
            guidelines: base.guidelines || '',
            wordLimit: base.wordLimit || 150,
          };
        } else if (newType === 'fill_in_blank') {
          return {
            ...base,
            points: base.points || 2,
            acceptableAnswers: base.acceptableAnswers?.length ? base.acceptableAnswers : [''],
            caseSensitive: base.caseSensitive || false,
          };
        } else {
          return {
            ...base,
            points: base.points || 4,
            matchingPairs: base.matchingPairs?.length
              ? base.matchingPairs
              : [
                  { id: 'p1', left: '', right: '' },
                  { id: 'p2', left: '', right: '' },
                ],
          };
        }
      })
    );
  };

  // Update Question Option
  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOpts = [...(q.options || ['', '', '', ''])];
        newOpts[optIndex] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleImportFromBank = (imported: QuizQuestion[]) => {
    setQuestions((prev) => {
      const existing = prev.filter((q) => q.question.trim().length > 0);
      return [...existing, ...imported];
    });
    if (imported.some((q) => q.type === 'structure')) {
      setQuizMarkingMode('manual');
    }
  };

  const handleImportFromMarkdown = (imported: QuizQuestion[]) => {
    setQuestions((prev) => {
      const existing = prev.filter((q) => q.question.trim().length > 0);
      return [...existing, ...imported];
    });
    if (imported.some((q) => q.type === 'structure')) {
      setQuizMarkingMode('manual');
    }
  };

  // Handle Create Quiz Submit
  const handleCreateQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClassId = quizClassId || currentClass?.id;
    if (!targetClassId) return;

    // Filter valid questions
    const validQuestions = questions.filter((q) => q.question.trim().length > 0);
    if (validQuestions.length === 0) {
      alert('Please add at least one valid question.');
      return;
    }

    const calculatedTotalPoints = validQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
    const assignedIds = quizAssignedClassIds.length > 0 ? quizAssignedClassIds : [targetClassId];

    createQuiz({
      classId: targetClassId,
      assignedClassIds: assignedIds,
      title: quizTitle,
      subject: quizSubject,
      description: quizDescription,
      timeLimitMinutes: Number(quizTimeLimit),
      maxAttempts: Number(quizMaxAttempts),
      markingMode: quizMarkingMode,
      totalPoints: calculatedTotalPoints,
      dueDate: new Date(quizDueDate).toISOString(),
      shuffleQuestions: quizShuffleQuestions,
      shuffleOptions: quizShuffleOptions,
      questions: validQuestions,
    });

    setQuizSuccessMsg(`Quiz "${quizTitle}" published and assigned to ${assignedIds.length} class(es)!`);
    setQuizTitle('');
    setQuizDescription('');
    setQuizShuffleQuestions(false);
    setQuizShuffleOptions(false);
    setQuestions([
      {
        id: `q-new-${Date.now()}`,
        type: 'mcq',
        question: '',
        points: 1,
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

  // Teacher Quizzes - matches teacher authored or any of teacher's assigned classes
  const teacherQuizzes = quizzes.filter(
    (q) =>
      q.teacherId === currentUser?.id ||
      teacherClasses.some((c) => c.id === q.classId) ||
      q.classId === currentClass?.id
  );

  // Teacher Comments history
  const teacherCommentsList = teacherComments.filter(
    (c) => c.teacherId === currentUser?.id
  );

  // Pending review submissions for teacher
  const teacherClassIds = availableClasses.map((c) => c.id);
  const pendingReviewCount = useMemo(() => {
    return quizResults.filter((r) => {
      const q = quizzes.find((quiz) => quiz.id === r.quizId);
      const isTeacherQuiz = q?.teacherId === currentUser?.id;
      const isTeacherClass = teacherClassIds.includes(r.classId || q?.classId || '');
      return r.status === 'pending_review' && (isTeacherQuiz || isTeacherClass);
    }).length;
  }, [quizResults, quizzes, currentUser, teacherClassIds]);

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
            <div className="text-xs text-blue-200 mt-1 flex flex-wrap items-center gap-2">
              <span>
                {teacherClasses.length > 1 ? (
                  <>Carrying <strong className="text-white">{teacherClasses.length} Assigned Classes:</strong> {teacherClasses.map(c => c.name).join(', ')}</>
                ) : (
                  <>Homeroom Class: <strong className="text-white">{currentClass?.name || 'Assigned Class'}</strong> ({currentClass?.gradeLevel})</>
                )}
              </span>
              <span>•</span>
              <span><strong>{assignedStudentDetails.length}</strong> Students in active view ({currentClass?.name})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-blue-950/80 px-4 py-2.5 rounded-lg border border-blue-800/80 text-xs text-blue-100">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Curriculum: Math, English, Science, Social Studies, Art</span>
          </div>
        </div>
      </div>

      {/* Classroom Switcher Bar (When teacher carries 2 or more classes or chooses between classes) */}
      {availableClasses.length > 1 && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-slate-900">
              Active Classroom View:
            </span>
            <span className="text-[11px] text-slate-500">
              (Select classroom to inspect roster & gradebook)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableClasses.map((cls) => {
              const count = studentDetails.filter((d) => d.classId === cls.id).length;
              const isSelected = cls.id === currentClass?.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setQuizClassId(cls.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                  id={`teacher-switch-class-${cls.id}`}
                >
                  <span>{cls.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          Class Roster ({currentClass?.name || 'Class'}) ({assignedStudentDetails.length})
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
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'questions'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="teacher-tab-questions"
        >
          <Database className="w-4 h-4 text-blue-600" />
          Question Bank ({questionBank.length})
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'grading'
              ? 'bg-blue-900 text-white shadow-xs'
              : pendingReviewCount > 0
              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="teacher-tab-grading"
        >
          <FileCheck className="w-4 h-4" />
          <span>Manual Grading & Reviews</span>
          {pendingReviewCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-extrabold animate-pulse">
              {pendingReviewCount}
            </span>
          )}
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
          Class Submissions & Gradebook ({currentClass?.name || 'Class'})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'alerts'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="teacher-tab-alerts"
        >
          <MessageCircle className="w-4 h-4 text-emerald-500" />
          <span>Parent Alerts ({parentAlerts.length})</span>
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
                    Class Roster: {currentClass?.name}
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
                  Assign a timed quiz to your students
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Classroom *
                  </label>
                  <select
                    value={quizClassId}
                    onChange={(e) => setQuizClassId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-medium"
                    id="teacher-quiz-class-select"
                  >
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={quizSubject}
                    onChange={(e) => setQuizSubject(e.target.value as Subject)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs font-medium"
                    id="teacher-quiz-subject-select"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Science">Science</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Art & Technology">Art & Technology</option>
                  </select>
                </div>
              </div>

              {/* Multi-Class Assignment if teacher has more than 1 class */}
              {availableClasses.length > 1 && (
                <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200/70 text-xs space-y-1.5">
                  <span className="font-bold text-blue-950 block">
                    Assign to Cohort / Additional Classes:
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {availableClasses.map((cls) => {
                      const isChecked =
                        quizAssignedClassIds.includes(cls.id) ||
                        (quizAssignedClassIds.length === 0 && cls.id === quizClassId);
                      return (
                        <label key={cls.id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuizAssignedClassIds((prev) =>
                                  prev.includes(cls.id) ? prev : [...prev, cls.id]
                                );
                              } else {
                                setQuizAssignedClassIds((prev) =>
                                  prev.filter((id) => id !== cls.id)
                                );
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium">{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Photosynthesis, Cells & Ecosystems Review"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  id="teacher-quiz-title-input"
                />
              </div>

              {/* Time Limit, Attempts, Marking Mode, and Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Time Allocation (min) *</span>
                    <span className="text-[10px] text-blue-700 font-normal">Auto-Locks</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Student cannot access once countdown expires; answers auto-submit.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Allowed Attempts *
                  </label>
                  <select
                    value={quizMaxAttempts}
                    onChange={(e) => setQuizMaxAttempts(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                  >
                    <option value={1}>1 Attempt (Strict Single-Sitting Exam)</option>
                    <option value={2}>2 Attempts</option>
                    <option value={3}>3 Attempts</option>
                    <option value={5}>5 Attempts</option>
                    <option value={999}>Unlimited (Practice Mode)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enforces strict submission quota per student.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Marking Mode *
                  </label>
                  <select
                    value={quizMarkingMode}
                    onChange={(e) => setQuizMarkingMode(e.target.value as 'auto' | 'manual')}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                  >
                    <option value="auto">Auto Marks (Instant for objective items)</option>
                    <option value="manual">Teacher Review & Manual Release (Recommended for Structure)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {quizMarkingMode === 'manual'
                      ? 'Student marks withheld until teacher marks structure answers and clicks release.'
                      : 'Students receive instant percentage and answers upon completion.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={quizDueDate}
                    onChange={(e) => setQuizDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Closes submission window after target date.
                  </p>
                </div>
              </div>

              {/* Anti-Cheating & Randomization Engine */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Anti-Cheating & Question Randomization:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={quizShuffleQuestions}
                      onChange={(e) => setQuizShuffleQuestions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">Shuffle Question Sequence</span>
                      <span className="text-[10px] text-slate-500 block">Randomizes question delivery order per student</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={quizShuffleOptions}
                      onChange={(e) => setQuizShuffleOptions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">Shuffle MCQ Options (A / B / C / D)</span>
                      <span className="text-[10px] text-slate-500 block">Randomizes choice positions per student</span>
                    </div>
                  </label>
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
                  placeholder="Key concepts assessed, instructions, rubric guidelines..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Question Bank & Bulk Key-In Action Bar */}
              <div className="p-3 rounded-xl bg-blue-900 text-white space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-300" />
                    <span className="text-xs font-bold">Question Bank & Bulk Tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBankPickerOpen(true)}
                      className="px-2.5 py-1 rounded-md bg-white text-blue-900 hover:bg-blue-50 text-[11px] font-bold shadow-xs flex items-center gap-1"
                    >
                      <Database className="w-3.5 h-3.5 text-blue-700" />
                      <span>Pick from Bank ({questionBank.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkImportOpen(true)}
                      className="px-2.5 py-1 rounded-md bg-blue-800 hover:bg-blue-700 text-white text-[11px] font-bold border border-blue-600 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-300" />
                      <span>Bulk Markdown Key-In</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-blue-200">
                  Select saved items from school-wide Question Bank or paste markdown formatted questions to quickly populate your quiz.
                </p>
              </div>

              {/* Questions Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Questions ({questions.length})</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-blue-700 font-bold">
                      {questions.reduce((sum, q) => sum + (q.points || 1), 0)} Total Points
                    </span>
                  </span>

                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Add:</span>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('mcq')}
                      className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold border border-blue-200"
                    >
                      + MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddQuestion('structure');
                        setQuizMarkingMode('manual');
                      }}
                      className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-semibold border border-purple-200"
                    >
                      + Structure
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('fill_in_blank')}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200"
                    >
                      + Fill-Blank
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('matching')}
                      className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200"
                    >
                      + Matching
                    </button>
                  </div>
                </div>

                {questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800">
                          #{qIndex + 1}
                        </span>
                        {/* Type Switcher */}
                        <select
                          value={q.type || 'mcq'}
                          onChange={(e) =>
                            handleQuestionTypeChange(qIndex, e.target.value as QuestionType)
                          }
                          className="px-2 py-0.5 rounded-md border border-slate-300 text-[11px] font-bold bg-white text-slate-800"
                        >
                          <option value="mcq">Multiple Choice (MCQ)</option>
                          <option value="structure">Structure / Essay</option>
                          <option value="fill_blank">Fill in the Blank</option>
                          <option value="matching">Matching Pairs</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] font-semibold text-slate-500">Points:</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={q.points || 1}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex ? { ...item, points: Number(e.target.value) } : item
                                )
                              )
                            }
                            className="w-14 px-1.5 py-0.5 rounded-md border border-slate-300 text-[11px] bg-white font-bold text-center"
                          />
                        </div>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setQuestions((prev) => prev.filter((_, i) => i !== qIndex))
                            }
                            className="text-[11px] font-semibold text-red-600 hover:text-red-800 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Question Prompt:
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={q.question}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((item, i) =>
                              i === qIndex ? { ...item, question: e.target.value } : item
                            )
                          )
                        }
                        placeholder={
                          q.type === 'fill_blank'
                            ? 'e.g. Mitochondria is often termed the [blank] of the cell.'
                            : 'Enter question text or prompt here...'
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>

                    {/* MCQ Options */}
                    {(!q.type || q.type === 'mcq') && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Options (Select the correct answer):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || ['', '', '', '']).map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-1.5">
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
                                title="Mark as correct option"
                              />
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) =>
                                  handleOptionChange(qIndex, optIndex, e.target.value)
                                }
                                placeholder={`Option ${optIndex + 1}`}
                                className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:border-blue-600"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Structure / Essay Specific Controls */}
                    {q.type === 'structure' && (
                      <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900">Structure / Essay Grading Details</span>
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] text-purple-800 font-semibold">Word Limit:</label>
                            <input
                              type="number"
                              min={20}
                              max={1000}
                              value={q.wordLimit || 150}
                              onChange={(e) =>
                                setQuestions((prev) =>
                                  prev.map((item, i) =>
                                    i === qIndex ? { ...item, wordLimit: Number(e.target.value) } : item
                                  )
                                )
                              }
                              className="w-16 px-1.5 py-0.5 rounded border border-purple-300 text-[11px] bg-white font-medium text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-purple-900 mb-0.5">
                            Model / Exemplary Answer (Teacher reference for grading):
                          </label>
                          <textarea
                            rows={2}
                            value={q.modelAnswer || ''}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex ? { ...item, modelAnswer: e.target.value } : item
                                )
                              )
                            }
                            placeholder="Ideal points, expected keywords, or complete sample paragraph..."
                            className="w-full px-2.5 py-1.5 rounded-md border border-purple-200 text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-purple-900 mb-0.5">
                            Scoring Rubric / Guidelines:
                          </label>
                          <input
                            type="text"
                            value={q.guidelines || ''}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex ? { ...item, guidelines: e.target.value } : item
                                )
                              )
                            }
                            placeholder="e.g. 2 pts for definition, 2 pts for example, 1 pt for clarity"
                            className="w-full px-2.5 py-1 rounded-md border border-purple-200 text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Fill in the Blank Specific Controls */}
                    {q.type === 'fill_blank' && (
                      <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 space-y-2 text-xs">
                        <span className="font-bold text-emerald-900 block">Fill-in-the-Blank Accepted Answers</span>
                        <div>
                          <label className="block text-[11px] text-emerald-800 font-semibold mb-1">
                            Acceptable Answers (comma separated for synonyms):
                          </label>
                          <input
                            type="text"
                            value={(q.acceptableAnswers || []).join(', ')}
                            onChange={(e) => {
                              const list = e.target.value.split(',').map((s) => s.trim());
                              setQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex ? { ...item, acceptableAnswers: list } : item
                                )
                              );
                            }}
                            placeholder="e.g. mitochondria, mitochondrion, powerhouse"
                            className="w-full px-2.5 py-1.5 rounded-md border border-emerald-300 text-xs bg-white"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-emerald-900">
                          <input
                            type="checkbox"
                            checked={q.caseSensitive || false}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex ? { ...item, caseSensitive: e.target.checked } : item
                                )
                              )
                            }
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Strict Case Sensitivity (require exact capitalization)</span>
                        </label>
                      </div>
                    )}

                    {/* Matching Pairs Specific Controls */}
                    {q.type === 'matching' && (
                      <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">Matching Pairs List</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPair: MatchingPair = {
                                id: `pair-${Date.now()}`,
                                left: '',
                                right: '',
                              };
                              setQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex
                                    ? { ...item, matchingPairs: [...(item.matchingPairs || []), newPair] }
                                    : item
                                )
                              );
                            }}
                            className="text-[11px] font-bold text-amber-800 hover:underline"
                          >
                            + Add Pair
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(q.matchingPairs || []).map((pair, pIndex) => (
                            <div key={pair.id || pIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={pair.left}
                                onChange={(e) => {
                                  const updated = [...(q.matchingPairs || [])];
                                  updated[pIndex] = { ...updated[pIndex], left: e.target.value };
                                  setQuestions((prev) =>
                                    prev.map((item, i) =>
                                      i === qIndex ? { ...item, matchingPairs: updated } : item
                                    )
                                  );
                                }}
                                placeholder={`Item ${pIndex + 1} (Left)`}
                                className="w-1/2 px-2 py-1 rounded-md border border-amber-300 text-xs bg-white"
                              />
                              <span className="text-amber-600 font-bold">⇄</span>
                              <input
                                type="text"
                                value={pair.right}
                                onChange={(e) => {
                                  const updated = [...(q.matchingPairs || [])];
                                  updated[pIndex] = { ...updated[pIndex], right: e.target.value };
                                  setQuestions((prev) =>
                                    prev.map((item, i) =>
                                      i === qIndex ? { ...item, matchingPairs: updated } : item
                                    )
                                  );
                                }}
                                placeholder={`Match ${pIndex + 1} (Right)`}
                                className="w-1/2 px-2 py-1 rounded-md border border-amber-300 text-xs bg-white"
                              />
                              {(q.matchingPairs || []).length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (q.matchingPairs || []).filter((_, i) => i !== pIndex);
                                    setQuestions((prev) =>
                                      prev.map((item, i) =>
                                        i === qIndex ? { ...item, matchingPairs: updated } : item
                                      )
                                    );
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                id="publish-quiz-btn"
              >
                <Award className="w-4 h-4" />
                <span>
                  Publish Quiz ({questions.length} Questions •{' '}
                  {questions.reduce((sum, q) => sum + (q.points || 1), 0)} Total Points)
                </span>
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
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Viewing: {currentClass?.name || 'Class'}
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {teacherQuizzes.map((quiz) => {
                const targetCls = classes.find((c) => c.id === quiz.classId);
                const resultsForQuiz = quizResults.filter((r) => r.quizId === quiz.id);
                const pendingCountForQuiz = resultsForQuiz.filter((r) => r.status === 'pending_review').length;
                const gradedResults = resultsForQuiz.filter((r) => r.status !== 'pending_review');
                const avgScore =
                  gradedResults.length > 0
                    ? (
                        gradedResults.reduce((acc, r) => acc + r.percentage, 0) /
                        gradedResults.length
                      ).toFixed(1)
                    : 'N/A';

                return (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            {quiz.subject}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {targetCls?.name || 'Assigned Class'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              quiz.markingMode === 'manual'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {quiz.markingMode === 'manual' ? 'Teacher Review' : 'Auto Marked'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {quiz.maxAttempts ? `${quiz.maxAttempts} Attempt(s)` : '1 Attempt'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{quiz.title}</h4>
                      </div>

                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{quiz.description}</p>

                    {/* Pending Reviews Alert */}
                    {pendingCountForQuiz > 0 && (
                      <div className="p-2 rounded-lg bg-amber-100/80 border border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                          <span>{pendingCountForQuiz} submission(s) awaiting your grading</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('grading')}
                          className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-800 text-white font-bold text-[10px] shrink-0"
                        >
                          Grade Now →
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.questions.length} Questions ({quiz.timeLimitMinutes} min auto-lock)
                      </span>
                      <span className="font-semibold text-blue-700">
                        {resultsForQuiz.length} Submissions • Avg: {avgScore !== 'N/A' ? `${avgScore}%` : 'Pending'}
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
              <span className="text-xs text-slate-400">Class: {currentClass?.name}</span>
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
                Real-time grades across all 5 subjects for {currentClass?.name}
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

      {/* TAB 5: QUESTION BANK */}
      {activeTab === 'questions' && <QuestionBankView />}

      {/* TAB 6: MANUAL GRADING & REVIEWS */}
      {activeTab === 'grading' && <TeacherGradingView currentClass={currentClass} />}

      {/* TAB 7: PARENT ALERTS & DISPATCHES */}
      {activeTab === 'alerts' && <ParentAlertsView teacherClassId={currentClass?.id} />}

      {/* MODAL: Pick from Question Bank */}
      <QuestionBankPickerModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        onSelectQuestions={handleImportFromBank}
        defaultSubject={quizSubject}
      />

      {/* MODAL: Markdown Bulk Import directly into Quiz */}
      <MarkdownBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportQuestions={handleImportFromMarkdown}
        defaultSubject={quizSubject}
      />
    </div>
  );
};
