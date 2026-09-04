import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  User,
  SchoolClass,
  StudentDetail,
  Quiz,
  QuizResult,
  TeacherComment,
  Announcement,
} from '../types';

export interface SupabaseSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

// Convert profiles table row to User
export const mapProfileToUser = (row: any): User => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name || row.fullName || 'User',
  role: row.role || 'student',
  phoneNumber: row.phone_number || row.phoneNumber || '',
  avatarUrl: row.avatar_url || row.avatarUrl,
  createdAt: row.created_at || new Date().toISOString(),
});

// Convert classes table row to SchoolClass
export const mapClassToSchoolClass = (row: any): SchoolClass => ({
  id: row.id,
  name: row.name,
  gradeLevel: row.grade_level || row.gradeLevel,
  academicYear: row.academic_year || row.academicYear || '2025-2026',
  teacherId: row.teacher_id || row.teacherId || '',
  createdAt: row.created_at || new Date().toISOString(),
});

// Convert student_details table row to StudentDetail
export const mapStudentDetail = (row: any): StudentDetail => ({
  id: row.id,
  studentId: row.student_id || row.studentId,
  classId: row.class_id || row.classId,
  parentId: row.parent_id || row.parentId,
  parentName: row.parent_name || row.parentName,
  parentPhone: row.parent_phone || row.parentPhone,
  parentEmail: row.parent_email || row.parentEmail,
  address: row.address,
  emergencyContact: row.emergency_contact || row.emergencyContact,
  notes: row.notes,
  createdAt: row.created_at || new Date().toISOString(),
});

// Convert quizzes table row to Quiz
export const mapQuiz = (row: any): Quiz => ({
  id: row.id,
  classId: row.class_id || row.classId,
  teacherId: row.teacher_id || row.teacherId,
  title: row.title,
  subject: row.subject,
  description: row.description,
  timeLimitMinutes: row.time_limit_minutes || row.timeLimitMinutes || 15,
  questions: Array.isArray(row.questions) ? row.questions : [],
  dueDate: row.due_date || row.dueDate || new Date().toISOString(),
  createdAt: row.created_at || new Date().toISOString(),
});

// Convert quiz_results table row to QuizResult
export const mapQuizResult = (row: any): QuizResult => ({
  id: row.id,
  quizId: row.quiz_id || row.quizId,
  studentId: row.student_id || row.studentId,
  score: Number(row.score) || 0,
  totalPoints: Number(row.total_points || row.totalPoints) || 0,
  percentage: Number(row.percentage) || 0,
  answers: Array.isArray(row.answers) ? row.answers : [],
  completedAt: row.completed_at || row.completedAt || new Date().toISOString(),
});

// Convert teacher_comments table row to TeacherComment
export const mapTeacherComment = (row: any): TeacherComment => ({
  id: row.id,
  teacherId: row.teacher_id || row.teacherId,
  studentId: row.student_id || row.studentId,
  parentId: row.parent_id || row.parentId,
  category: row.category || 'general',
  comment: row.comment,
  date: row.date || new Date().toISOString().split('T')[0],
  isRead: Boolean(row.is_read ?? row.isRead),
  createdAt: row.created_at || new Date().toISOString(),
});

// Convert announcements table row to Announcement
export const mapAnnouncement = (row: any): Announcement => ({
  id: row.id,
  title: row.title,
  category: row.category || 'General',
  content: row.content,
  imageUrl: row.image_url || row.imageUrl,
  badge: row.badge,
  pinned: Boolean(row.pinned),
  authorId: row.author_id || row.authorId,
  createdAt: row.created_at || new Date().toISOString(),
});

// Convert school_info table row to SchoolInfo
export const mapSchoolInfo = (row: any) => ({
  name: row.name || 'ACEBEE School',
  schoolNumber: row.school_number || row.schoolNumber || '',
  address: row.address || '',
  email: row.email || '',
  principalName: row.principal_name || row.principalName || '',
  website: row.website || '',
  description: row.description || '',
});

/**
 * Check if Supabase is connected and accessible
 */
export const checkSupabaseConnection = async (): Promise<{ isConnected: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { isConnected: false, message: 'Supabase credentials not configured' };
  }

  try {
    const { error } = await supabase.from('classes').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist or permissions error
      return { isConnected: true, message: `Connected to Supabase (${error.message || 'Ready'})` };
    }
    return { isConnected: true, message: 'Supabase connected successfully' };
  } catch (err: any) {
    return { isConnected: false, message: err?.message || 'Connection failed' };
  }
};

/**
 * Fetch all database collections from Supabase in parallel
 */
export const fetchAllSupabaseData = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const [
      profilesRes,
      classesRes,
      studentDetailsRes,
      quizzesRes,
      quizResultsRes,
      commentsRes,
      announcementsRes,
      schoolInfoRes,
    ] = await Promise.allSettled([
      supabase.from('profiles').select('*'),
      supabase.from('classes').select('*'),
      supabase.from('student_details').select('*'),
      supabase.from('quizzes').select('*'),
      supabase.from('quiz_results').select('*'),
      supabase.from('teacher_comments').select('*'),
      supabase.from('announcements').select('*'),
      supabase.from('school_info').select('*').limit(1),
    ]);

    const result: {
      users?: User[];
      classes?: SchoolClass[];
      studentDetails?: StudentDetail[];
      quizzes?: Quiz[];
      quizResults?: QuizResult[];
      teacherComments?: TeacherComment[];
      announcements?: Announcement[];
      schoolInfo?: any;
    } = {};

    if (profilesRes.status === 'fulfilled' && profilesRes.value.data && profilesRes.value.data.length > 0) {
      result.users = profilesRes.value.data.map(mapProfileToUser);
    }
    if (classesRes.status === 'fulfilled' && classesRes.value.data && classesRes.value.data.length > 0) {
      result.classes = classesRes.value.data.map(mapClassToSchoolClass);
    }
    if (studentDetailsRes.status === 'fulfilled' && studentDetailsRes.value.data && studentDetailsRes.value.data.length > 0) {
      result.studentDetails = studentDetailsRes.value.data.map(mapStudentDetail);
    }
    if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data && quizzesRes.value.data.length > 0) {
      result.quizzes = quizzesRes.value.data.map(mapQuiz);
    }
    if (quizResultsRes.status === 'fulfilled' && quizResultsRes.value.data && quizResultsRes.value.data.length > 0) {
      result.quizResults = quizResultsRes.value.data.map(mapQuizResult);
    }
    if (commentsRes.status === 'fulfilled' && commentsRes.value.data && commentsRes.value.data.length > 0) {
      result.teacherComments = commentsRes.value.data.map(mapTeacherComment);
    }
    if (announcementsRes.status === 'fulfilled' && announcementsRes.value.data && announcementsRes.value.data.length > 0) {
      result.announcements = announcementsRes.value.data.map(mapAnnouncement);
    }
    if (schoolInfoRes.status === 'fulfilled' && schoolInfoRes.value.data && schoolInfoRes.value.data.length > 0) {
      result.schoolInfo = mapSchoolInfo(schoolInfoRes.value.data[0]);
    }

    return result;
  } catch (err) {
    console.error('Error fetching Supabase data:', err);
    return null;
  }
};

/**
 * Async sync helpers for realtime persistence to Supabase
 */
export const persistSchoolInfoToSupabase = async (info: any) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('school_info').upsert({
      id: 'default',
      name: info.name,
      school_number: info.schoolNumber,
      address: info.address,
      email: info.email,
      principal_name: info.principalName,
      website: info.website,
      description: info.description,
    });
  } catch (err) {
    console.warn('Supabase school_info upsert notice:', err);
  }
};

export const persistAnnouncementToSupabase = async (ann: Announcement) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('announcements').upsert({
      id: ann.id,
      title: ann.title,
      category: ann.category,
      content: ann.content,
      image_url: ann.imageUrl,
      badge: ann.badge,
      pinned: ann.pinned,
      author_id: ann.authorId,
    });
  } catch (err) {
    console.warn('Supabase announcement upsert notice:', err);
  }
};

export const deleteAnnouncementFromSupabase = async (id: string) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('announcements').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase announcement delete notice:', err);
  }
};

export const persistClassToSupabase = async (cls: SchoolClass) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('classes').upsert({
      id: cls.id,
      name: cls.name,
      grade_level: cls.gradeLevel,
      academic_year: cls.academicYear,
      teacher_id: cls.teacherId,
    });
  } catch (err) {
    console.warn('Supabase class upsert notice:', err);
  }
};

export const persistProfileToSupabase = async (user: User) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      phone_number: user.phoneNumber,
      avatar_url: user.avatarUrl,
    });
  } catch (err) {
    console.warn('Supabase profile upsert notice:', err);
  }
};

export const persistStudentDetailToSupabase = async (detail: StudentDetail) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('student_details').upsert({
      id: detail.id,
      student_id: detail.studentId,
      class_id: detail.classId,
      parent_name: detail.parentName,
      parent_phone: detail.parentPhone,
      parent_email: detail.parentEmail,
      address: detail.address,
      emergency_contact: detail.emergencyContact,
      notes: detail.notes,
    });
  } catch (err) {
    console.warn('Supabase student detail upsert notice:', err);
  }
};

export const persistQuizToSupabase = async (quiz: Quiz) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('quizzes').upsert({
      id: quiz.id,
      class_id: quiz.classId,
      teacher_id: quiz.teacherId,
      title: quiz.title,
      subject: quiz.subject,
      description: quiz.description,
      time_limit_minutes: quiz.timeLimitMinutes,
      questions: quiz.questions,
      due_date: quiz.dueDate,
    });
  } catch (err) {
    console.warn('Supabase quiz upsert notice:', err);
  }
};

export const persistQuizResultToSupabase = async (result: QuizResult) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('quiz_results').upsert({
      id: result.id,
      quiz_id: result.quizId,
      student_id: result.studentId,
      score: result.score,
      total_points: result.totalPoints,
      percentage: result.percentage,
      answers: result.answers,
      completed_at: result.completedAt,
    });
  } catch (err) {
    console.warn('Supabase quiz result upsert notice:', err);
  }
};

export const persistTeacherCommentToSupabase = async (comment: TeacherComment) => {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('teacher_comments').upsert({
      id: comment.id,
      teacher_id: comment.teacherId,
      student_id: comment.studentId,
      parent_id: comment.parentId,
      category: comment.category,
      comment: comment.comment,
      date: comment.date,
      is_read: comment.isRead,
    });
  } catch (err) {
    console.warn('Supabase comment upsert notice:', err);
  }
};

/**
 * Seed initial sample dataset to Supabase if database tables are currently empty
 */
export const seedSupabaseTables = async (data: {
  users: User[];
  classes: SchoolClass[];
  studentDetails: StudentDetail[];
  quizzes: Quiz[];
  quizResults: QuizResult[];
  teacherComments: TeacherComment[];
  announcements: Announcement[];
}) => {
  if (!isSupabaseConfigured()) return false;

  try {
    // 1. Classes
    if (data.classes.length > 0) {
      const formattedClasses = data.classes.map((c) => ({
        name: c.name,
        grade_level: c.gradeLevel,
        academic_year: c.academicYear,
      }));
      await supabase.from('classes').upsert(formattedClasses, { onConflict: 'name' });
    }

    // 2. Announcements
    if (data.announcements.length > 0) {
      const formattedAnn = data.announcements.map((a) => ({
        title: a.title,
        category: a.category,
        content: a.content,
        image_url: a.imageUrl,
        badge: a.badge,
        pinned: a.pinned,
      }));
      await supabase.from('announcements').upsert(formattedAnn, { onConflict: 'title' });
    }

    return true;
  } catch (err) {
    console.error('Error seeding Supabase:', err);
    return false;
  }
};

/**
 * Real-time listeners helper
 */
export const subscribeToSupabaseChanges = (onUpdate: () => void) => {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
