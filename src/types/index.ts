export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export const ACADEMIC_LEVELS = [
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Form 1',
  'Form 2',
  'Form 3',
] as const;

export type AcademicLevel = (typeof ACADEMIC_LEVELS)[number] | string;

export type Subject =
  | 'Mathematics'
  | 'English'
  | 'Science'
  | 'Social Studies'
  | 'Art & Technology'
  | 'Bahasa Melayu'
  | 'History'
  | 'Geography'
  | 'Art'
  | 'Physical Education'
  | string;

export interface User {
  id: string;
  email: string;
  username?: string;
  tempPassword?: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  teacherId: string;
  createdAt: string;
}

export type Class = SchoolClass;

export interface StudentDetail {
  id: string;
  studentId: string;
  classId: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
}

export type QuestionType = 'mcq' | 'structure' | 'fill_in_blank' | 'fill_blank' | 'matching';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  type?: QuestionType; // defaults to 'mcq'
  difficulty?: QuestionDifficulty;
  topic?: string;
  question: string;
  points?: number; // defaults to 1
  imageUrl?: string; // image for the question (uploaded or url)
  options?: string[]; // for MCQ
  correctAnswerIndex?: number; // for MCQ
  modelAnswer?: string; // for Structure
  guidelines?: string; // for Structure rubrics
  wordLimit?: number;
  acceptableAnswers?: string[]; // for Fill in Blank
  caseSensitive?: boolean; // for Fill in Blank
  matchingPairs?: MatchingPair[]; // for Matching
  explanation?: string;
}

export interface QuestionBankItem {
  id: string;
  type: QuestionType;
  difficulty?: QuestionDifficulty;
  subject: Subject;
  gradeLevel: string;
  topic: string;
  tags?: string[];
  question: string;
  points: number;
  imageUrl?: string; // image for the question (uploaded or url)
  options?: string[];
  correctAnswerIndex?: number;
  modelAnswer?: string;
  guidelines?: string;
  wordLimit?: number;
  acceptableAnswers?: string[];
  caseSensitive?: boolean;
  matchingPairs?: MatchingPair[];
  explanation?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export type MarkingMode = 'auto' | 'manual';

export interface Quiz {
  id: string;
  classId: string;
  assignedClassIds?: string[];
  teacherId: string;
  title: string;
  subject: Subject;
  description: string;
  timeLimitMinutes: number;
  maxAttempts?: number; // 0 = unlimited, 1 = single attempt (default), 2, 3 etc.
  markingMode?: MarkingMode; // 'auto' = auto-grades objective questions immediately, 'manual' = teacher reviews/releases
  shuffleQuestions?: boolean; // Anti-cheating: randomizes question sequence per student
  shuffleOptions?: boolean; // Anti-cheating: randomizes MCQ choices per student
  totalPoints?: number;
  questions: QuizQuestion[];
  dueDate: string;
  createdAt: string;
}

export interface QuizAnswerRecord {
  questionId: string;
  type?: QuestionType;
  selectedOption?: number; // for MCQ
  textAnswer?: string; // for Structure & Fill in Blank
  studentAttachmentUrl?: string; // submitted image/file for essay or structure questions
  matchingAnswers?: Record<string, string>; // pairId -> selected right item for Matching
  isCorrect?: boolean;
  pointsAwarded?: number;
  maxPoints?: number;
  teacherComment?: string;
}

export type StudentAnswerRecord = QuizAnswerRecord;

export type QuizResultStatus = 'pending_review' | 'graded';

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  classId?: string;
  attemptNumber?: number;
  status?: QuizResultStatus;
  releasedToStudent?: boolean;
  score: number;
  totalPoints: number;
  percentage: number;
  teacherFeedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  answers: QuizAnswerRecord[];
  completedAt: string;
}

export type CommentCategory = 'positive' | 'improvement' | 'general' | 'achievement';

export interface TeacherComment {
  id: string;
  teacherId: string;
  studentId: string;
  parentId: string;
  category: CommentCategory;
  comment: string;
  date: string;
  isRead: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: string;
  content: string;
  imageUrl?: string;
  badge?: string;
  pinned?: boolean;
  authorId: string;
  createdAt: string;
}

export interface SchoolInfo {
  name: string;
  schoolNumber: string;
  address: string;
  email: string;
  principalName?: string;
  website?: string;
  description?: string;
}

export interface GradingRubricPreset {
  id: string;
  title: string;
  points: number;
  criteria: string;
  feedbackTemplate: string;
}

export interface ParentAlert {
  id: string;
  studentId: string;
  studentName: string;
  parentId?: string;
  parentName: string;
  parentPhone?: string;
  parentEmail?: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalPoints: number;
  percentage: number;
  teacherFeedback?: string;
  channel: 'whatsapp' | 'email' | 'both';
  messageText: string;
  status: 'sent' | 'pending';
  sentAt: string;
}

export interface WeaknessPracticeAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface WeaknessPracticeRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  topic: string;
  subject: string;
  totalQuestions: number; // exactly 10 questions
  correctAnswers: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  xpEarned: number;
  answersSummary: WeaknessPracticeAnswer[];
  teacherNoticed?: boolean;
}

