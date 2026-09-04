export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export type Subject = 'Mathematics' | 'English' | 'Science' | 'Social Studies' | 'Art & Technology';

export interface User {
  id: string;
  email: string;
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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  subject: Subject;
  description: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  dueDate: string;
  createdAt: string;
}

export interface QuizAnswerRecord {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
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
