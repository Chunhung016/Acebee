import { User, SchoolClass, StudentDetail, Quiz, QuizResult, TeacherComment, Announcement, SchoolInfo } from '../types';

export const INITIAL_SCHOOL_INFO: SchoolInfo = {
  name: 'ACEBEE Academy',
  schoolNumber: '+1 (555) 902-1000',
  address: '1288 Academic Boulevard, Suite 400, Springfield, IL 62701',
  email: 'contact@acebee.edu',
  principalName: 'Dr. Eleanor Vance',
  website: 'https://acebee.edu',
  description: 'Premier educational institution providing rigorous academics and character development.',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@lb.com',
    fullName: 'Dr. Eleanor Vance',
    role: 'admin',
    phoneNumber: '+1 (555) 901-2832',
    createdAt: new Date().toISOString(),
  },
];

const now = new Date().toISOString();

export const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'class-year-1', name: 'Year 1', gradeLevel: 'Year 1', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-year-2', name: 'Year 2', gradeLevel: 'Year 2', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-year-3', name: 'Year 3', gradeLevel: 'Year 3', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-year-4', name: 'Year 4', gradeLevel: 'Year 4', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-year-5', name: 'Year 5', gradeLevel: 'Year 5', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-year-6', name: 'Year 6', gradeLevel: 'Year 6', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-form-1', name: 'Form 1', gradeLevel: 'Form 1', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-form-2', name: 'Form 2', gradeLevel: 'Form 2', teacherId: '', academicYear: '2025-2026', createdAt: now },
  { id: 'class-form-3', name: 'Form 3', gradeLevel: 'Form 3', teacherId: '', academicYear: '2025-2026', createdAt: now },
];
export const INITIAL_STUDENT_DETAILS: StudentDetail[] = [];
export const INITIAL_QUIZZES: Quiz[] = [];
export const INITIAL_QUIZ_RESULTS: QuizResult[] = [];
export const INITIAL_TEACHER_COMMENTS: TeacherComment[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
