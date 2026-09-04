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

export const INITIAL_CLASSES: SchoolClass[] = [];
export const INITIAL_STUDENT_DETAILS: StudentDetail[] = [];
export const INITIAL_QUIZZES: Quiz[] = [];
export const INITIAL_QUIZ_RESULTS: QuizResult[] = [];
export const INITIAL_TEACHER_COMMENTS: TeacherComment[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
