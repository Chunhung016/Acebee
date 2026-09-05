import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
  QuestionBankItem,
  QuizAnswerRecord,
  QuizResultStatus,
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
  INITIAL_QUESTION_BANK,
} from '../data/initialData';
import { generateUsername, generatePassword } from '../utils/credentialGenerator';
import { testConnection } from '../lib/firebase';
import { firestoreService, FirestoreDataSnapshot } from '../services/firestoreService';

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
  questionBank: QuestionBankItem[];
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
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Question Bank Operations (shared by Admin & Teachers)
  saveQuestionBankItem: (item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string }) => Promise<QuestionBankItem>;
  bulkSaveQuestionBankItems: (items: Array<Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string }>) => Promise<number>;
  deleteQuestionBankItem: (id: string) => Promise<void>;

  // Admin Operations
  createAccount: (userData: Partial<User> & { fullName: string; role: UserRole }, extraDetails?: Partial<StudentDetail>) => User;
  updateAccount: (userId: string, data: Partial<Omit<User, 'id'>>, extraDetails?: Partial<StudentDetail>) => void;
  deleteAccount: (userId: string) => void;
  bulkDeleteAccounts: (userIds: string[]) => void;
  bulkUpdateAccounts: (userIds: string[], updates: { role?: UserRole; classId?: string; phoneNumber?: string }) => void;
  bulkCreateAccounts: (accounts: Array<{
    fullName: string;
    email?: string;
    username?: string;
    role: UserRole;
    phoneNumber?: string;
    parentName?: string;
    parentPhone?: string;
    address?: string;
  }>) => { createdCount: number; errors: string[]; createdUsers: User[] };
  bindStudentToClass: (studentId: string, classId: string) => void;
  assignTeacherToClass: (classId: string, teacherId: string) => void;
  assignTeacherToClasses: (teacherId: string, classIds: string[]) => void;
  createClass: (name: string, gradeLevel: string, teacherId: string) => SchoolClass;
  updateClass: (classId: string, updates: Partial<SchoolClass>) => void;
  deleteClass: (classId: string) => void;
  createAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'authorId'>) => Announcement;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;

  // Teacher Operations
  createQuiz: (data: Omit<Quiz, 'id' | 'createdAt' | 'teacherId'>) => Quiz;
  deleteQuiz: (id: string) => void;
  updateStudentDetail: (studentId: string, data: Partial<StudentDetail>) => void;
  postTeacherComment: (data: { studentId: string; parentId: string; category: CommentCategory; comment: string }) => TeacherComment;
  deleteTeacherComment: (id: string) => void;
  updateQuizResult: (resultId: string, updates: Partial<QuizResult>) => Promise<void>;
  releaseQuizMarks: (resultId: string, teacherFeedback?: string, questionScores?: { questionId: string; pointsAwarded: number; teacherComment?: string }[]) => Promise<void>;

  // Student Operations
  submitQuizResult: (
    quizId: string,
    answers: QuizAnswerRecord[],
    score: number,
    totalPoints: number,
    options?: { attemptNumber?: number; status?: QuizResultStatus; releasedToStudent?: boolean; classId?: string }
  ) => Promise<QuizResult | void>;

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
  QUESTION_BANK: 'acebee_question_bank_v2',
  CURRENT_USER: 'acebee_current_user_v2',
  SCHOOL_INFO: 'acebee_school_info_v2',
};

const cleanUserRecord = (u: any): User => {
  const rawAvatar = u.avatarUrl || u.avatar_url;
  const isCustomUpload = Boolean(
    rawAvatar && typeof rawAvatar === 'string' && (rawAvatar.startsWith('data:image') || rawAvatar.startsWith('blob:'))
  );

  const fallbackUsername = u.fullName
    ? u.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')
    : `user_${u.id?.slice(-4) || '1'}`;
  const cleanUsername = (
    u.username ||
    (u.email && !u.email.endsWith('@acebee.local') ? u.email.split('@')[0] : fallbackUsername)
  ).toLowerCase();
  const cleanEmail = u.email || `${cleanUsername}@acebee.local`;
  const cleanPassword = u.tempPassword || u.temp_password || u.password || 'Ace@2026';

  return {
    ...u,
    email: cleanEmail,
    username: cleanUsername,
    tempPassword: cleanPassword,
    avatarUrl: isCustomUpload ? rawAvatar : undefined,
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to initial data
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHOOL_INFO);
    return saved ? JSON.parse(saved) : INITIAL_SCHOOL_INFO;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    const raw: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return raw.map(cleanUserRecord);
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Failed to parse cached announcements:', e);
      }
    }
    return INITIAL_ANNOUNCEMENTS;
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

  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
    return saved ? JSON.parse(saved) : INITIAL_QUESTION_BANK;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        return cleanUserRecord(JSON.parse(saved));
      } catch {
        return null;
      }
    }
    return null; // Public Landing page is default (/)
  });

  const [currentView, setCurrentView] = useState<'public' | 'dashboard'>('public');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedQuizForTaking, setSelectedQuizForTaking] = useState<Quiz | null>(null);

  // Firestore Sync State (provided under supabaseSyncInfo interface for full UI compatibility)
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isInitialSyncDone = useRef(false);

  // Manual trigger to pull latest data from Firestore
  const syncWithSupabase = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await firestoreService.fetchAll();
      if (data.users && data.users.length > 0) setUsers(data.users.map(cleanUserRecord));
      if (data.classes && data.classes.length > 0) setClasses(data.classes);
      if (data.studentDetails) setStudentDetails(data.studentDetails);
      if (data.quizzes) setQuizzes(data.quizzes);
      if (data.quizResults) setQuizResults(data.quizResults);
      if (data.teacherComments) setTeacherComments(data.teacherComments);
      if (data.announcements) setAnnouncements(data.announcements);
      if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
      if (data.questionBank && data.questionBank.length > 0) setQuestionBank(data.questionBank);
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Firestore sync error:', err);
      setSyncError(err?.message || 'Failed to sync with Cloud Firestore');
    } finally {
      setIsSyncing(false);
    }
  };

  // Seed or push all current in-memory/local data up to Cloud Firestore
  const seedToSupabase = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const success = await firestoreService.seedIfEmpty({
        users,
        classes,
        studentDetails,
        quizzes,
        quizResults,
        teacherComments,
        announcements,
        schoolInfo,
        questionBank: questionBank.length > 0 ? questionBank : INITIAL_QUESTION_BANK,
      });
      if (success) {
        setLastSyncedAt(new Date().toLocaleTimeString());
      }
      return success;
    } catch (err: any) {
      setSyncError(err?.message || 'Error syncing data to Firestore');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Real-time Firestore synchronization listener
  useEffect(() => {
    testConnection().then((connected) => {
      if (!connected) {
        console.warn('Firestore server connection test failed; running offline mode.');
      }
    });

    const unsubscribe = firestoreService.subscribeAll((data: FirestoreDataSnapshot) => {
      if (data.users && data.users.length > 0) {
        setUsers(data.users.map(cleanUserRecord));
      }
      if (data.classes && data.classes.length > 0) {
        setClasses(data.classes);
      }
      if (data.studentDetails) {
        setStudentDetails(data.studentDetails);
      }
      if (data.quizzes) {
        setQuizzes(data.quizzes);
      }
      if (data.quizResults) {
        setQuizResults(data.quizResults);
      }
      if (data.teacherComments) {
        setTeacherComments(data.teacherComments);
      }
      if (data.announcements && data.announcements.length > 0) {
        setAnnouncements(data.announcements);
      }
      if (data.schoolInfo) {
        setSchoolInfo(data.schoolInfo);
      }
      if (data.questionBank) {
        setQuestionBank(data.questionBank);
      }

      setLastSyncedAt(new Date().toLocaleTimeString());

      // On initial sync, if there are existing accounts or announcements stored locally in the browser
      // that are not yet in Firestore, automatically migrate them up to Firestore!
      if (!isInitialSyncDone.current) {
        isInitialSyncDone.current = true;
        try {
          const savedUsersStr = localStorage.getItem(STORAGE_KEYS.USERS);
          if (savedUsersStr) {
            const localUsers: User[] = JSON.parse(savedUsersStr);
            const firestoreUserIds = new Set(data.users.map((u) => u.id));
            const missingUsers = localUsers.filter((u) => !firestoreUserIds.has(u.id));
            if (missingUsers.length > 0) {
              console.log(`Syncing ${missingUsers.length} local users up to Cloud Firestore...`);
              firestoreService.bulkSaveUsers(missingUsers);
            }
          }

          if (data.announcements.length === 0 && INITIAL_ANNOUNCEMENTS.length > 0) {
            console.log('Seeding initial announcements to Firestore...');
            INITIAL_ANNOUNCEMENTS.forEach((a) => firestoreService.saveAnnouncement(a));
          }
        } catch (e) {
          console.warn('Local-to-cloud migration check note:', e);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cache to localStorage as local fallback with quota error protection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('localStorage quota warning for users', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.warn('localStorage quota warning for classes', e);
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENT_DETAILS, JSON.stringify(studentDetails));
    } catch (e) {
      console.warn('localStorage quota warning for student details', e);
    }
  }, [studentDetails]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) {
      console.warn('localStorage quota warning for announcements', e);
    }
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
    localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(questionBank));
  }, [questionBank]);

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

  // Auth Functions with cross-device Firestore query
  const login = async (
    emailOrUsername: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    const query = emailOrUsername.trim().toLowerCase();
    if (!query) {
      return { success: false, message: 'Please enter your login username or email.' };
    }
    
    // Check pre-seeded admin requirement
    if (query === 'admin@lb.com' || query === 'admin' || query === 'eleanor') {
      if (pass !== '212832Lb' && pass !== 'Password1') {
        return { success: false, message: 'Invalid admin credentials. Please check your password and try again.' };
      }
      const adminUser =
        users.find((u) => u.email.toLowerCase() === 'admin@lb.com' || u.username?.toLowerCase() === 'admin') ||
        INITIAL_USERS[0];
      setCurrentUser(cleanUserRecord(adminUser));
      setCurrentView('dashboard');
      setIsLoginModalOpen(false);
      return { success: true };
    }

    // Check user list by Username OR Email in memory
    let foundUser = users.find(
      (u) =>
        u.username?.toLowerCase() === query ||
        u.email.toLowerCase() === query ||
        u.email.toLowerCase().split('@')[0] === query
    );

    // If not found in current local state, do direct Firestore cloud lookup immediately
    // so new laptops can log in without waiting for initial subscription cycle!
    if (!foundUser) {
      try {
        const cloudUser = await firestoreService.findUserForLogin(query);
        if (cloudUser) {
          foundUser = cleanUserRecord(cloudUser);
          setUsers((prev) => (prev.some((u) => u.id === cloudUser.id) ? prev : [foundUser!, ...prev]));
        }
      } catch (lookupErr) {
        console.warn('Cloud user lookup check:', lookupErr);
      }
    }

    if (!foundUser) {
      return {
        success: false,
        message:
          'Account not found. Please verify your Login Username or Email. All user credentials are provided by the School Administrator.',
      };
    }

    // Accept user's temporary password, demo passwords, or matching credential
    const validPasses = [
      foundUser.tempPassword,
      'Password1',
      'demo123',
      '212832Lb',
      'Ace@2026',
    ].filter(Boolean);

    if (foundUser.tempPassword && !validPasses.includes(pass) && foundUser.tempPassword !== pass) {
      return {
        success: false,
        message: 'Incorrect password. Please verify the login credentials provided by the Administrator.',
      };
    }

    setCurrentUser(cleanUserRecord(foundUser));
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
      setCurrentUser(cleanUserRecord(targetUser));
      setCurrentView('dashboard');
      setSelectedQuizForTaking(null);
    }
  };

  // Admin Functions
  const createAccount = (
    userData: Partial<User> & { fullName: string; role: UserRole },
    extraDetails?: Partial<StudentDetail>
  ): User => {
    const newId = `user-${userData.role}-${Date.now().toString(36)}`;
    const generatedUsername = generateUsername(userData.fullName, userData.role, users);
    const generatedPassword = userData.tempPassword || generatePassword(userData.role);
    const finalUsername = (userData.username?.trim() || generatedUsername).toLowerCase();
    const finalEmail = userData.email?.trim() || `${finalUsername}@acebee.local`;

    const newUser: User = {
      id: newId,
      fullName: userData.fullName.trim(),
      role: userData.role,
      username: finalUsername,
      tempPassword: generatedPassword,
      email: finalEmail,
      phoneNumber: userData.phoneNumber?.trim() || '',
      avatarUrl:
        userData.avatarUrl && userData.avatarUrl.startsWith('data:image') ? userData.avatarUrl : undefined,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    firestoreService.saveUser(newUser);

    // If it's a student, automatically initialize a student_detail record
    if (userData.role === 'student') {
      const newDetail: StudentDetail = {
        id: `detail-${newId}`,
        studentId: newId,
        classId: extraDetails?.classId || (classes[0]?.id ?? 'class-year-1'),
        parentId: extraDetails?.parentId || '',
        parentName: extraDetails?.parentName || 'Parent / Guardian',
        parentPhone: extraDetails?.parentPhone || userData.phoneNumber || '+1 (555) 000-0000',
        parentEmail: extraDetails?.parentEmail || '',
        address: extraDetails?.address || '123 Academic Way, Springfield, OR',
        emergencyContact: extraDetails?.emergencyContact || '',
        notes: extraDetails?.notes || 'New enrolled student',
        createdAt: new Date().toISOString(),
      };
      setStudentDetails((prev) => [newDetail, ...prev]);
      firestoreService.saveStudentDetail(newDetail);
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
          const updated = cleanUserRecord({ ...user, ...data });
          updatedUserRecord = updated;
          firestoreService.saveUser(updated);
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
          firestoreService.saveStudentDetail(updatedDetail);
          const updatedList = [...prev];
          updatedList[existingIdx] = updatedDetail;
          return updatedList;
        } else if (data.role === 'student') {
          const newDetail: StudentDetail = {
            id: `detail-${userId}`,
            studentId: userId,
            classId: extraDetails?.classId || classes[0]?.id || 'class-year-1',
            parentId: extraDetails?.parentId || `parent-${userId}`,
            parentName: extraDetails?.parentName || 'Parent / Guardian',
            parentPhone: extraDetails?.parentPhone || '+1 (555) 000-0000',
            parentEmail: extraDetails?.parentEmail || '',
            address: extraDetails?.address || '123 Academic Way',
            createdAt: new Date().toISOString(),
          };
          firestoreService.saveStudentDetail(newDetail);
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

    firestoreService.deleteUser(userId);
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

    firestoreService.bulkDeleteUsers(userIds);
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
            const updated = cleanUserRecord({
              ...user,
              ...(updates.role ? { role: updates.role } : {}),
              ...(updates.phoneNumber ? { phoneNumber: updates.phoneNumber } : {}),
            });
            firestoreService.saveUser(updated);
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
            firestoreService.saveStudentDetail(updated);
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
      email?: string;
      username?: string;
      role: UserRole;
      phoneNumber?: string;
      parentName?: string;
      parentPhone?: string;
      address?: string;
    }>
  ): { createdCount: number; errors: string[]; createdUsers: User[] } => {
    const newUsersList: User[] = [];
    const newStudentDetailsList: StudentDetail[] = [];
    const errors: string[] = [];

    const allKnownUsers = [...users];

    accounts.forEach((acc, idx) => {
      if (!acc.fullName || !acc.fullName.trim()) {
        errors.push(`Row ${idx + 1}: Name is required.`);
        return;
      }

      const role = acc.role || 'student';
      const generatedUName = generateUsername(acc.fullName, role, [...allKnownUsers, ...newUsersList]);
      const generatedPass = generatePassword(role);
      const finalUsername = (acc.username?.trim() || generatedUName).toLowerCase();
      const finalEmail = acc.email?.trim() || `${finalUsername}@acebee.local`;

      const userId = `user-${role}-${Date.now().toString(36)}-${idx}`;
      const newUser: User = {
        id: userId,
        fullName: acc.fullName.trim(),
        role: role,
        username: finalUsername,
        tempPassword: generatedPass,
        email: finalEmail,
        phoneNumber: acc.phoneNumber || '',
        createdAt: new Date().toISOString(),
      };

      newUsersList.push(newUser);

      if (role === 'student') {
        const newDetail: StudentDetail = {
          id: `detail-${userId}`,
          studentId: userId,
          classId: classes[0]?.id ?? 'class-year-1',
          parentId: '',
          parentName: acc.parentName || 'Parent / Guardian',
          parentPhone: acc.parentPhone || acc.phoneNumber || '+1 (555) 000-0000',
          address: acc.address || 'Address pending verification',
          createdAt: new Date().toISOString(),
        };
        newStudentDetailsList.push(newDetail);
      }
    });

    if (newUsersList.length > 0) {
      setUsers((prev) => [...newUsersList, ...prev]);
      firestoreService.bulkSaveUsers(newUsersList);

      if (newStudentDetailsList.length > 0) {
        setStudentDetails((prev) => [...newStudentDetailsList, ...prev]);
        newStudentDetailsList.forEach((det) => firestoreService.saveStudentDetail(det));
      }
    }

    return { createdCount: newUsersList.length, errors, createdUsers: newUsersList };
  };

  const bindStudentToClass = (studentId: string, classId: string) => {
    setStudentDetails((prev) =>
      prev.map((det) => {
        if (det.studentId === studentId) {
          const updated = { ...det, classId };
          firestoreService.saveStudentDetail(updated);
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
          firestoreService.saveClass(updated);
          return updated;
        }
        return cls;
      })
    );
  };

  const assignTeacherToClasses = (teacherId: string, classIds: string[]) => {
    const targetClassIdSet = new Set(classIds);
    setClasses((prev) =>
      prev.map((cls) => {
        if (targetClassIdSet.has(cls.id)) {
          if (cls.teacherId !== teacherId) {
            const updated = { ...cls, teacherId };
            firestoreService.saveClass(updated);
            return updated;
          }
          return cls;
        } else if (cls.teacherId === teacherId) {
          // Unassign if removed from teacher's list
          const updated = { ...cls, teacherId: '' };
          firestoreService.saveClass(updated);
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
    firestoreService.saveClass(newClass);
    return newClass;
  };

  const updateClass = (classId: string, updates: Partial<SchoolClass>) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id === classId) {
          const updated = { ...cls, ...updates };
          firestoreService.saveClass(updated);
          return updated;
        }
        return cls;
      })
    );
  };

  const deleteClass = (classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    // Clear classId for students assigned to deleted class
    setStudentDetails((prev) =>
      prev.map((det) => {
        if (det.classId === classId) {
          const updated = { ...det, classId: '' };
          firestoreService.saveStudentDetail(updated);
          return updated;
        }
        return det;
      })
    );
    firestoreService.deleteClass(classId);
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
    firestoreService.saveAnnouncement(newAnn);
    return newAnn;
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    firestoreService.deleteAnnouncement(id);
  };

  const togglePinAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, pinned: !a.pinned };
          firestoreService.saveAnnouncement(updated);
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
    firestoreService.saveQuiz(newQuiz);
    return newQuiz;
  };

  const deleteQuiz = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    setQuizResults((prev) => prev.filter((r) => r.quizId !== id));
    firestoreService.deleteQuiz(id);
  };

  const updateStudentDetail = (studentId: string, data: Partial<StudentDetail>) => {
    setStudentDetails((prev) =>
      prev.map((det) => {
        if (det.studentId === studentId) {
          const updated = { ...det, ...data };
          firestoreService.saveStudentDetail(updated);
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
    firestoreService.saveTeacherComment(newComment);
    return newComment;
  };

  const deleteTeacherComment = (id: string) => {
    setTeacherComments((prev) => prev.filter((c) => c.id !== id));
    firestoreService.deleteTeacherComment(id);
  };

  // Question Bank Operations
  const saveQuestionBankItem = async (
    item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string }
  ): Promise<QuestionBankItem> => {
    const id = item.id || `qb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const fullItem: QuestionBankItem = {
      ...item,
      id,
      createdBy: currentUser?.id || 'admin',
      createdByName: currentUser?.fullName || 'Academic Staff',
      createdAt: new Date().toISOString(),
    };
    setQuestionBank((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullItem;
        return next;
      }
      return [fullItem, ...prev];
    });
    await firestoreService.saveQuestionBankItem(fullItem);
    return fullItem;
  };

  const bulkSaveQuestionBankItems = async (
    items: Array<Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string }>
  ): Promise<number> => {
    const fullItems: QuestionBankItem[] = items.map((item, idx) => ({
      ...item,
      id: item.id || `qb-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      createdBy: currentUser?.id || 'admin',
      createdByName: currentUser?.fullName || 'Academic Staff',
      createdAt: new Date().toISOString(),
    }));
    setQuestionBank((prev) => [...fullItems, ...prev]);
    await firestoreService.bulkSaveQuestionBankItems(fullItems);
    return fullItems.length;
  };

  const deleteQuestionBankItem = async (id: string): Promise<void> => {
    setQuestionBank((prev) => prev.filter((item) => item.id !== id));
    await firestoreService.deleteQuestionBankItem(id);
  };

  const updateQuizResult = async (resultId: string, updates: Partial<QuizResult>): Promise<void> => {
    setQuizResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, ...updates } : r))
    );
    await firestoreService.updateQuizResult(resultId, updates);
  };

  const releaseQuizMarks = async (
    resultId: string,
    teacherFeedback?: string,
    questionScores?: { questionId: string; pointsAwarded: number; teacherComment?: string }[]
  ): Promise<void> => {
    const target = quizResults.find((r) => r.id === resultId);
    if (!target) return;

    let updatedAnswers = [...target.answers];
    if (questionScores && questionScores.length > 0) {
      const scoreMap = new Map(questionScores.map((s) => [s.questionId, s]));
      updatedAnswers = updatedAnswers.map((ans) => {
        const override = scoreMap.get(ans.questionId);
        if (override) {
          return {
            ...ans,
            pointsAwarded: override.pointsAwarded,
            teacherComment: override.teacherComment || ans.teacherComment,
            isCorrect: override.pointsAwarded > 0,
          };
        }
        return ans;
      });
    }

    const newScore = updatedAnswers.reduce(
      (sum, a) => sum + (a.pointsAwarded ?? (a.isCorrect ? (a.maxPoints ?? 1) : 0)),
      0
    );
    const newPercentage = target.totalPoints > 0 ? Number(((newScore / target.totalPoints) * 100).toFixed(1)) : 0;

    const updates: Partial<QuizResult> = {
      answers: updatedAnswers,
      score: newScore,
      percentage: newPercentage,
      status: 'graded',
      releasedToStudent: true,
      teacherFeedback: teacherFeedback ?? target.teacherFeedback,
      gradedBy: currentUser?.fullName || 'Teacher',
      gradedAt: new Date().toISOString(),
    };

    setQuizResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, ...updates } : r))
    );
    await firestoreService.updateQuizResult(resultId, updates);
  };

  // Student Functions
  const submitQuizResult = async (
    quizId: string,
    answers: QuizAnswerRecord[],
    score: number,
    totalPoints: number,
    options?: { attemptNumber?: number; status?: QuizResultStatus; releasedToStudent?: boolean; classId?: string }
  ): Promise<QuizResult | void> => {
    if (!currentUser) return;
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    const existingAttempts = quizResults.filter((r) => r.quizId === quizId && r.studentId === currentUser.id);
    const attemptNumber = options?.attemptNumber || existingAttempts.length + 1;

    // Marking mode logic:
    // If quiz is manual marking mode, or has structure questions without preset score, default to pending_review
    const isManualMode = targetQuiz?.markingMode === 'manual';
    const status: QuizResultStatus = options?.status || (isManualMode ? 'pending_review' : 'graded');
    const releasedToStudent = options?.releasedToStudent !== undefined ? options.releasedToStudent : !isManualMode;

    const percentage = totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(1)) : 0;
    const newResult: QuizResult = {
      id: `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      quizId,
      studentId: currentUser.id,
      classId: options?.classId || targetQuiz?.classId,
      attemptNumber,
      status,
      releasedToStudent,
      score,
      totalPoints,
      percentage,
      answers,
      completedAt: new Date().toISOString(),
    };

    setQuizResults((prev) => [newResult, ...prev]);
    await firestoreService.saveQuizResult(newResult);
    return newResult;
  };

  // Parent Functions
  const markCommentAsRead = (commentId: string) => {
    setTeacherComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const updated = { ...c, isRead: true };
          firestoreService.saveTeacherComment(updated);
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
      firestoreService.saveSchoolInfo(updated);
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
      isConnected: true,
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
      questionBank,
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
      saveQuestionBankItem,
      bulkSaveQuestionBankItems,
      deleteQuestionBankItem,
      createAccount,
      updateAccount,
      deleteAccount,
      bulkDeleteAccounts,
      bulkUpdateAccounts,
      bulkCreateAccounts,
      bindStudentToClass,
      assignTeacherToClass,
      assignTeacherToClasses,
      createClass,
      updateClass,
      deleteClass,
      createAnnouncement,
      deleteAnnouncement,
      togglePinAnnouncement,
      createQuiz,
      deleteQuiz,
      updateStudentDetail,
      postTeacherComment,
      deleteTeacherComment,
      updateQuizResult,
      releaseQuizMarks,
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
      questionBank,
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
