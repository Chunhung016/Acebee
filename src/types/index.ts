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

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  type?: QuestionType; // defaults to 'mcq'
  question: string;
  points?: number; // defaults to 1
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
  subject: Subject;
  gradeLevel: string;
  topic: string;
  tags?: string[];
  question: string;
  points: number;
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
