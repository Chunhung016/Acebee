import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  SchoolClass,
  StudentDetail,
  Quiz,
  QuizResult,
  TeacherComment,
  Announcement,
  UserRole,
  Subject,
  CommentCategory,
  SchoolInfo,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_STUDENT_DETAILS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_QUIZZES,
  INITIAL_QUIZ_RESULTS,
  INITIAL_TEACHER_COMMENTS,
  INITIAL_SCHOOL_INFO,
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchAllSupabaseData,
  seedSupabaseTables,
  subscribeToSupabaseChanges,
  persistSchoolInfoToSupabase,
  persistAnnouncementToSupabase,
  deleteAnnouncementFromSupabase,
  persistClassToSupabase,
  persistProfileToSupabase,
  deleteProfileFromSupabase,
  deleteProfilesFromSupabase,
  persistStudentDetailToSupabase,
  persistQuizToSupabase,
  persistQuizResultToSupabase,
  persistTeacherCommentToSupabase,
} from '../services/supabaseService';

export interface SupabaseSyncInfo {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  syncWithSupabase: () => Promise<void>;
  seedToSupabase: () => Promise<boolean>;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  classes: SchoolClass[];
  studentDetails: StudentDetail[];
  announcements: Announcement[];
  quizzes: Quiz[];
  quizResults: QuizResult[];
  teacherComments: TeacherComment[];
  currentView: 'public' | 'dashboard';
  isLoginModalOpen: boolean;
  selectedQuizForTaking: Quiz | null;
  supabaseSyncInfo: SupabaseSyncInfo;
  schoolInfo: SchoolInfo;
  
  // View Controls
  setCurrentView: (view: 'public' | 'dashboard') => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setSelectedQuizForTaking: (quiz: Quiz | null) => void;

  // School Information Operations
  updateSchoolInfo: (info: Partial<SchoolInfo>) => void;

  // Auth Operations
  login: (email: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;

  // Admin Operations
  createAccount: (userData: Omit<User, 'id' | 'createdAt'>, extraDetails?: Partial<StudentDetail>) => User;
  updateAccount: (userId: string, data: Partial<Omit<User, 'id'>>, extraDetails?: Partial<StudentDetail>) => void;
  deleteAccount: (userId: string) => void;
  bulkDeleteAccounts: (userIds: string[]) => void;
  bulkUpdateAccounts: (userIds: string[], updates: { role?: UserRole; classId?: string; phoneNumber?: string }) => void;
  bulkCreateAccounts: (accounts: Array<{
    fullName: string;
    email: string;
    role: UserRole;
    phoneNumber?: string;
    parentName?: string;
    parentPhone?: string;
    address?: string;
  }>) => { createdCount: number; errors: string[] };
  bindStudentToClass: (studentId: string, classId: string) => void;
  assignTeacherToClass: (classId: string, teacherId: string) => void;
  createClass: (name: string, gradeLevel: string, teacherId: string) => SchoolClass;
  createAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'authorId'>) => Announcement;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;

  // Teacher Operations
  createQuiz: (data: Omit<Quiz, 'id' | 'createdAt' | 'teacherId'>) => Quiz;
  deleteQuiz: (id: string) => void;
  updateStudentDetail: (studentId: string, data: Partial<StudentDetail>) => void;
  postTeacherComment: (data: { studentId: string; parentId: string; category: CommentCategory; comment: string }) => TeacherComment;
  deleteTeacherComment: (id: string) => void;

  // Student Operations
  submitQuizResult: (quizId: string, answers: { questionId: string; selectedOption: number; isCorrect: boolean }[], score: number, totalPoints: number) => void;

  // Parent Operations
  markCommentAsRead: (commentId: string) => void;

  // Reset helper
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'acebee_users_v2',
  CLASSES: 'acebee_classes_v2',
  STUDENT_DETAILS: 'acebee_student_details_v2',
  ANNOUNCEMENTS: 'acebee_announcements_v2',
  QUIZZES: 'acebee_quizzes_v2',
  QUIZ_RESULTS: 'acebee_quiz_results_v2',
  TEACHER_COMMENTS: 'acebee_teacher_comments_v2',
  CURRENT_USER: 'acebee_current_user_v2',
  SCHOOL_INFO: 'acebee_school_info_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to initial data
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHOOL_INFO);
    return saved ? JSON.parse(saved) : INITIAL_SCHOOL_INFO;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [studentDetails, setStudentDetails] = useState<StudentDetail[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_DETAILS);
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_DETAILS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    return saved ? JSON.parse(saved) : INITIAL_QUIZZES;
  });

  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
    return saved ? JSON.parse(saved) : INITIAL_QUIZ_RESULTS;
  });

  const [teacherComments, setTeacherComments] = useState<TeacherComment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHER_COMMENTS);
    return saved ? JSON.parse(saved) : INITIAL_TEACHER_COMMENTS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null; // Public Landing page is default (/)
  });

  const [currentView, setCurrentView] = useState<'public' | 'dashboard'>('public');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedQuizForTaking, setSelectedQuizForTaking] = useState<Quiz | null>(null);

  // Supabase Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncWithSupabase = async () => {
    if (!isSupabaseConfigured()) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await fetchAllSupabaseData();
      if (data) {
        if (data.users && data.users.length > 0) setUsers(data.users);
        if (data.classes && data.classes.length > 0) setClasses(data.classes);
        if (data.studentDetails && data.studentDetails.length > 0) setStudentDetails(data.studentDetails);
        if (data.quizzes && data.quizzes.length > 0) setQuizzes(data.quizzes);
        if (data.quizResults && data.quizResults.length > 0) setQuizResults(data.quizResults);
        if (data.teacherComments && data.teacherComments.length > 0) setTeacherComments(data.teacherComments);
        if (data.announcements && data.announcements.length > 0) setAnnouncements(data.announcements);
        if (data.schoolInfo && data.schoolInfo.name) setSchoolInfo(data.schoolInfo);
        setLastSyncedAt(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error('Supabase sync error:', err);
      setSyncError(err?.message || 'Failed to sync with Supabase');
    } finally {
      setIsSyncing(false);
    }
  };

  const seedToSupabase = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const success = await seedSupabaseTables({
        users,
        classes,
        studentDetails,
        quizzes,
        quizResults,
        teacherComments,
        announcements,
      });
      if (success) {
        setLastSyncedAt(new Date().toLocaleTimeString());
      }
      return success;
    } catch (err: any) {
      setSyncError(err?.message || 'Error seeding database');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial load and real-time subscription
  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncWithSupabase();
      const unsubscribe = subscribeToSupabaseChanges(() => {
        syncWithSupabase();
      });
      return () => unsubscribe();
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT_DETAILS, JSON.stringify(studentDetails));
  }, [studentDetails]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(quizResults));
  }, [quizResults]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHER_COMMENTS, JSON.stringify(teacherComments));
  }, [teacherComments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_INFO, JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  // Auth Functions
  const login = (email: string, pass: string): { success: boolean; message?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check pre-seeded admin hardcoded requirement: admin@lb.com | 212832Lb
    if (normalizedEmail === 'admin@lb.com') {
      if (pass !== '212832Lb') {
        return { success: false, message: 'Invalid admin password. Default is: 212832Lb' };
      }
      const adminUser = users.find((u) => u.email.toLowerCase() === 'admin@lb.com') || INITIAL_USERS[0];
      setCurrentUser(adminUser);
      setCurrentView('dashboard');
      setIsLoginModalOpen(false);
      return { success: true };
    }

    // For other accounts, check user list
    const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!foundUser) {
      return {
        success: false,
        message: 'Account not found. There is no public registration; all accounts must be created by the Administrator.',
      };
    }

    // In demo mode, accept any password or matching preset
    setCurrentUser(foundUser);
    setCurrentView('dashboard');
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('public');
    setSelectedQuizForTaking(null);
  };

  const switchUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      setCurrentView('dashboard');
      setSelectedQuizForTaking(null);
    }
  };

  // Admin Functions
  const createAccount = (
    userData: Omit<User, 'id' | 'createdAt'>,
    extraDetails?: Partial<StudentDetail>
  ): User => {
    const newId = `user-${userData.role}-${Date.now().toString(36)}`;
    const newUser: User = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    persistProfileToSupabase(newUser);

    // If it's a student, automatically initialize a student_detail record
    if (userData.role === 'student') {
      const newDetail: StudentDetail = {
        id: `detail-${newId}`,
        studentId: newId,
        classId: extraDetails?.classId || (classes[0]?.id ?? 'class-5a'),
        parentId: extraDetails?.parentId || '',
        parentName: extraDetails?.parentName || 'Parent / Guardian',
        parentPhone: extraDetails?.parentPhone || '+1 (555) 000-0000',
        parentEmail: extraDetails?.parentEmail || '',
        address: extraDetails?.address || '123 Academic Way, Springfield, OR',
        emergencyContact: extraDetails?.emergencyContact || '',
        notes: extraDetails?.notes || 'New enrolled student',
        createdAt: new Date().toISOString(),
      };
      setStudentDetails((prev) => [newDetail, ...prev]);
      persistStudentDetailToSupabase(newDetail);
    }

    return newUser;
  };

  const updateAccount = (
    userId: string,
    data: Partial<Omit<User, 'id'>>,
    extraDetails?: Partial<StudentDetail>
  ) => {
    let updatedUserRecord: User | null = null;
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const updated = { ...user, ...data };
          updatedUserRecord = updated;
          persistProfileToSupabase(updated);
          return updated;
        }
        return user;
      })
    );

    if (currentUser?.id === userId && updatedUserRecord) {
      setCurrentUser(updatedUserRecord);
    }

    // Handle student detail update or creation if applicable
    if (extraDetails || data.role === 'student') {
      setStudentDetails((prev) => {
        const existingIdx = prev.findIndex((d) => d.studentId === userId);
        if (existingIdx >= 0) {
          const updatedDetail = { ...prev[existingIdx], ...(extraDetails || {}) };
          persistStudentDetailToSupabase(updatedDetail);
          const updatedList = [...prev];
          updatedList[existingIdx] = updatedDetail;
          return updatedList;
        } else if (data.role === 'student') {
          const newDetail: StudentDetail = {
            id: `detail-${userId}`,
            studentId: userId,
            classId: extraDetails?.classId || classes[0]?.id || 'class-5a',
            parentId: extraDetails?.parentId || `parent-${userId}`,
            parentName: extraDetails?.parentName || 'Parent / Guardian',
            parentPhone: extraDetails?.parentPhone || '+1 (555) 000-0000',
            parentEmail: extraDetails?.parentEmail || '',
            address: extraDetails?.address || '123 Academic Way',
            createdAt: new Date().toISOString(),
          };
          persistStudentDetailToSupabase(newDetail);
          return [newDetail, ...prev];
        }
        return prev;
      });
    }
  };

  const deleteAccount = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setStudentDetails((prev) => prev.filter((d) => d.studentId !== userId));
    setQuizResults((prev) => prev.filter((r) => r.studentId !== userId));
    setTeacherComments((prev) =>
      prev.filter((c) => c.teacherId !== userId && c.studentId !== userId && c.parentId !== userId)
    );

    if (currentUser?.id === userId) {
      logout();
    }

    deleteProfileFromSupabase(userId);
  };

  const bulkDeleteAccounts = (userIds: string[]) => {
    if (!userIds || userIds.length === 0) return;
    const idSet = new Set(userIds);
    setUsers((prev) => prev.filter((u) => !idSet.has(u.id)));
    setStudentDetails((prev) => prev.filter((d) => !idSet.has(d.studentId)));
    setQuizResults((prev) => prev.filter((r) => !idSet.has(r.studentId)));
    setTeacherComments((prev) =>
      prev.filter((c) => !idSet.has(c.teacherId) && !idSet.has(c.studentId) && !idSet.has(c.parentId))
    );

    if (currentUser && idSet.has(currentUser.id)) {
      logout();
    }

    deleteProfilesFromSupabase(userIds);
  };

  const bulkUpdateAccounts = (
    userIds: string[],
    updates: { role?: UserRole; classId?: string; phoneNumber?: string }
  ) => {
    if (!userIds || userIds.length === 0) return;
    const idSet = new Set(userIds);

    if (updates.role || updates.phoneNumber) {
      setUsers((prev) =>
        prev.map((user) => {
          if (idSet.has(user.id)) {
            const updated = {
              ...user,
              ...(updates.role ? { role: updates.role } : {}),
              ...(updates.phoneNumber ? { phoneNumber: updates.phoneNumber } : {}),
            };
            persistProfileToSupabase(updated);
            return updated;
          }
          return user;
        })
      );
    }

    if (updates.classId) {
      setStudentDetails((prev) =>
        prev.map((detail) => {
          if (idSet.has(detail.studentId)) {
            const updated = { ...detail, classId: updates.classId! };
            persistStudentDetailToSupabase(updated);
            return updated;
          }
          return detail;
        })
      );
    }
  };

  const bulkCreateAccounts = (
    accounts: Array<{
      fullName: string;
      email: string;
      role: UserRole;
      phoneNumber?: string;
      parentName?: string;
      parentPhone?: string;
      address?: string;
    }>
  ) => {
    const newUsersList: User[] = [];
    const newStudentDetailsList: StudentDetail[] = [];
    const errors: string[] = [];

    const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));

    accounts.forEach((acc, idx) => {
      const emailLower = acc.email.trim().toLowerCase();
      if (!acc.fullName || !acc.email) {
        errors.push(`Row ${idx + 1}: Name and email are required.`);
        return;
      }
      if (existingEmails.has(emailLower)) {
        errors.push(`Row ${idx + 1}: Email ${acc.email} already exists.`);
        return;
      }
      existingEmails.add(emailLower);

      const userId = `user-${acc.role}-${Date.now().toString(36)}-${idx}`;
      const newUser: User = {
        id: userId,
        email: acc.email.trim(),
        fullName: acc.fullName.trim(),
        role: acc.role,
        phoneNumber: acc.phoneNumber || '+1 (555) 000-0000',
        createdAt: new Date().toISOString(),
      };
      newUsersList.push(newUser);
      persistProfileToSupabase(newUser);

      if (acc.role === 'student') {
        const newDetail: StudentDetail = {
          id: `detail-${userId}`,
          studentId: userId,
          classId: classes[0]?.id ?? 'class-5a',
          parentId: '',
          parentName: acc.parentName || 'Parent / Guardian',
          parentPhone: acc.parentPhone || '+1 (555) 000-0000',
          address: acc.address || 'Address pending verification',
          createdAt: new Date().toISOString(),
        };
        newStudentDetailsList.push(newDetail);
        persistStudentDetailToSupabase(newDetail);
      }
    });

    if (newUsersList.length > 0) {
      setUsers((prev) => [...newUsersList, ...prev]);
      if (newStudentDetailsList.length > 0) {
        setStudentDetails((prev) => [...newStudentDetailsList, ...prev]);
      }
    }

    return { createdCount: newUsersList.length, errors };
  };

  const bindStudentToClass = (studentId: string, classId: string) => {
    setStudentDetails((prev) =>
      prev.map((det) => {
        if (det.studentId === studentId) {
          const updated = { ...det, classId };
          persistStudentDetailToSupabase(updated);
          return updated;
        }
        return det;
      })
    );
  };

  const assignTeacherToClass = (classId: string, teacherId: string) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id === classId) {
          const updated = { ...cls, teacherId };
          persistClassToSupabase(updated);
          return updated;
        }
        return cls;
      })
    );
  };

  const createClass = (name: string, gradeLevel: string, teacherId: string): SchoolClass => {
    const newClass: SchoolClass = {
      id: `class-${Date.now().toString(36)}`,
      name,
      gradeLevel,
      academicYear: '2025-2026',
      teacherId,
      createdAt: new Date().toISOString(),
    };
    setClasses((prev) => [...prev, newClass]);
    persistClassToSupabase(newClass);
    return newClass;
  };

  const createAnnouncement = (
    data: Omit<Announcement, 'id' | 'createdAt' | 'authorId'>
  ): Announcement => {
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now().toString(36)}`,
      authorId: currentUser?.id || 'user-admin-1',
      createdAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    persistAnnouncementToSupabase(newAnn);
    return newAnn;
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    deleteAnnouncementFromSupabase(id);
  };

  const togglePinAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, pinned: !a.pinned };
          persistAnnouncementToSupabase(updated);
          return updated;
        }
        return a;
      })
    );
  };

  // Teacher Functions
  const createQuiz = (data: Omit<Quiz, 'id' | 'createdAt' | 'teacherId'>): Quiz => {
    const newQuiz: Quiz = {
      ...data,
      id: `quiz-${Date.now().toString(36)}`,
      teacherId: currentUser?.id || 'user-teacher-1',
      createdAt: new Date().toISOString(),
    };
    setQuizzes((prev) => [newQuiz, ...prev]);
    persistQuizToSupabase(newQuiz);
    return newQuiz;
  };

  const deleteQuiz = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    setQuizResults((prev) => prev.filter((r) => r.quizId !== id));
  };

  const updateStudentDetail = (studentId: string, data: Partial<StudentDetail>) => {
    setStudentDetails((prev) =>
      prev.map((det) => {
        if (det.studentId === studentId) {
          const updated = { ...det, ...data };
          persistStudentDetailToSupabase(updated);
          return updated;
        }
        return det;
      })
    );
  };

  const postTeacherComment = (data: {
    studentId: string;
    parentId: string;
    category: CommentCategory;
    comment: string;
  }): TeacherComment => {
    const newComment: TeacherComment = {
      id: `comment-${Date.now().toString(36)}`,
      teacherId: currentUser?.id || 'user-teacher-1',
      studentId: data.studentId,
      parentId: data.parentId,
      category: data.category,
      comment: data.comment,
      date: new Date().toISOString().split('T')[0],
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setTeacherComments((prev) => [newComment, ...prev]);
    persistTeacherCommentToSupabase(newComment);
    return newComment;
  };

  const deleteTeacherComment = (id: string) => {
    setTeacherComments((prev) => prev.filter((c) => c.id !== id));
  };

  // Student Functions
  const submitQuizResult = (
    quizId: string,
    answers: { questionId: string; selectedOption: number; isCorrect: boolean }[],
    score: number,
    totalPoints: number
  ) => {
    if (!currentUser) return;
    const percentage = totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(1)) : 0;
    const newResult: QuizResult = {
      id: `res-${Date.now().toString(36)}`,
      quizId,
      studentId: currentUser.id,
      score,
      totalPoints,
      percentage,
      answers,
      completedAt: new Date().toISOString(),
    };
    // Replace if existed, otherwise append
    setQuizResults((prev) => {
      const filtered = prev.filter((r) => !(r.quizId === quizId && r.studentId === currentUser.id));
      return [newResult, ...filtered];
    });
    persistQuizResultToSupabase(newResult);
  };

  // Parent Functions
  const markCommentAsRead = (commentId: string) => {
    setTeacherComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const updated = { ...c, isRead: true };
          persistTeacherCommentToSupabase(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // School Info Functions
  const updateSchoolInfo = (info: Partial<SchoolInfo>) => {
    setSchoolInfo((prev) => {
      const updated = { ...prev, ...info };
      persistSchoolInfoToSupabase(updated);
      return updated;
    });
  };

  const resetToDemoData = () => {
    setSchoolInfo(INITIAL_SCHOOL_INFO);
    setUsers(INITIAL_USERS);
    setClasses(INITIAL_CLASSES);
    setStudentDetails(INITIAL_STUDENT_DETAILS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setQuizzes(INITIAL_QUIZZES);
    setQuizResults(INITIAL_QUIZ_RESULTS);
    setTeacherComments(INITIAL_TEACHER_COMMENTS);
    setCurrentUser(null);
    setCurrentView('public');
    localStorage.clear();
  };

  const supabaseSyncInfo: SupabaseSyncInfo = useMemo(
    () => ({
      isConnected: isSupabaseConfigured(),
      isSyncing,
      lastSyncedAt,
      error: syncError,
      syncWithSupabase,
      seedToSupabase,
    }),
    [isSyncing, lastSyncedAt, syncError]
  );

  const contextValue = useMemo(
    () => ({
      currentUser,
      users,
      classes,
      studentDetails,
      announcements,
      quizzes,
      quizResults,
      teacherComments,
      currentView,
      isLoginModalOpen,
      selectedQuizForTaking,
      supabaseSyncInfo,
      schoolInfo,
      setCurrentView,
      setIsLoginModalOpen,
      setSelectedQuizForTaking,
      updateSchoolInfo,
      login,
      logout,
      switchUser,
      createAccount,
      updateAccount,
      deleteAccount,
      bulkDeleteAccounts,
      bulkUpdateAccounts,
      bulkCreateAccounts,
      bindStudentToClass,
      assignTeacherToClass,
      createClass,
      createAnnouncement,
      deleteAnnouncement,
      togglePinAnnouncement,
      createQuiz,
      deleteQuiz,
      updateStudentDetail,
      postTeacherComment,
      deleteTeacherComment,
      submitQuizResult,
      markCommentAsRead,
      resetToDemoData,
    }),
    [
      currentUser,
      users,
      classes,
      studentDetails,
      announcements,
      quizzes,
      quizResults,
      teacherComments,
      currentView,
      isLoginModalOpen,
      selectedQuizForTaking,
      supabaseSyncInfo,
      schoolInfo,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
