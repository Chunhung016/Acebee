import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  User,
  SchoolClass,
  StudentDetail,
  Quiz,
  QuizResult,
  TeacherComment,
  Announcement,
  SchoolInfo,
  QuestionBankItem,
  WeaknessPracticeRecord,
} from '../types';

export interface FirestoreDataSnapshot {
  users: User[];
  classes: SchoolClass[];
  studentDetails: StudentDetail[];
  quizzes: Quiz[];
  quizResults: QuizResult[];
  teacherComments: TeacherComment[];
  announcements: Announcement[];
  schoolInfo: SchoolInfo | null;
  questionBank: QuestionBankItem[];
  weaknessPractices: WeaknessPracticeRecord[];
}

// Deep recursive sanitizer to remove undefined values at all levels before saving to Firestore
export const cleanDataForFirestore = <T>(data: T): T => {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanDataForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
};

export const firestoreService = {
  // --- REAL-TIME SUBSCRIPTION ---
  subscribeAll(onUpdate: (data: FirestoreDataSnapshot, collectionName?: string) => void): () => void {
    const unsubscribes: Unsubscribe[] = [];
    const state: FirestoreDataSnapshot = {
      users: [],
      classes: [],
      studentDetails: [],
      quizzes: [],
      quizResults: [],
      teacherComments: [],
      announcements: [],
      schoolInfo: null,
      questionBank: [],
      weaknessPractices: [],
    };

    // Emit updates immediately for real-time reactivity
    const emit = (collectionName?: string) => {
      try {
        onUpdate({ ...state }, collectionName);
      } catch (err) {
        console.warn(`Error in onUpdate for collection ${collectionName}:`, err);
      }
    };

    // 1. Users
    unsubscribes.push(
      onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          state.users = snapshot.docs.map((d) => d.data() as User);
          emit('users');
        },
        (err) => console.warn('Firestore users subscription notice:', err)
      )
    );

    // 2. Classes
    unsubscribes.push(
      onSnapshot(
        collection(db, 'classes'),
        (snapshot) => {
          state.classes = snapshot.docs.map((d) => d.data() as SchoolClass);
          emit('classes');
        },
        (err) => console.warn('Firestore classes subscription notice:', err)
      )
    );

    // 3. Student Details
    unsubscribes.push(
      onSnapshot(
        collection(db, 'student_details'),
        (snapshot) => {
          state.studentDetails = snapshot.docs.map((d) => d.data() as StudentDetail);
          emit('student_details');
        },
        (err) => console.warn('Firestore student_details subscription notice:', err)
      )
    );

    // 4. Quizzes (Immediate push when teacher creates or modifies quizzes)
    unsubscribes.push(
      onSnapshot(
        collection(db, 'quizzes'),
        (snapshot) => {
          state.quizzes = snapshot.docs.map((d) => d.data() as Quiz);
          emit('quizzes');
        },
        (err) => console.warn('Firestore quizzes subscription notice:', err)
      )
    );

    // 5. Quiz Results
    unsubscribes.push(
      onSnapshot(
        collection(db, 'quiz_results'),
        (snapshot) => {
          state.quizResults = snapshot.docs.map((d) => d.data() as QuizResult);
          emit('quiz_results');
        },
        (err) => console.warn('Firestore quiz_results subscription notice:', err)
      )
    );

    // 6. Teacher Comments
    unsubscribes.push(
      onSnapshot(
        collection(db, 'teacher_comments'),
        (snapshot) => {
          state.teacherComments = snapshot.docs.map((d) => d.data() as TeacherComment);
          emit('teacher_comments');
        },
        (err) => console.warn('Firestore teacher_comments subscription notice:', err)
      )
    );

    // 7. Announcements
    unsubscribes.push(
      onSnapshot(
        collection(db, 'announcements'),
        (snapshot) => {
          state.announcements = snapshot.docs.map((d) => d.data() as Announcement);
          emit('announcements');
        },
        (err) => console.warn('Firestore announcements subscription notice:', err)
      )
    );

    // 8. School Info
    unsubscribes.push(
      onSnapshot(
        doc(db, 'school_info', 'main'),
        (snapshot) => {
          if (snapshot.exists()) {
            state.schoolInfo = snapshot.data() as SchoolInfo;
          }
          emit('school_info');
        },
        (err) => console.warn('Firestore school_info subscription notice:', err)
      )
    );

    // 9. Question Bank
    unsubscribes.push(
      onSnapshot(
        collection(db, 'question_bank'),
        (snapshot) => {
          state.questionBank = snapshot.docs.map((d) => d.data() as QuestionBankItem);
          emit('question_bank');
        },
        (err) => console.warn('Firestore question_bank subscription notice:', err)
      )
    );

    // 10. Weakness Practice Drills
    unsubscribes.push(
      onSnapshot(
        collection(db, 'weakness_practices'),
        (snapshot) => {
          state.weaknessPractices = snapshot.docs.map((d) => d.data() as WeaknessPracticeRecord);
          emit('weakness_practices');
        },
        (err) => console.warn('Firestore weakness_practices subscription notice:', err)
      )
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  },

  // --- MANUAL FETCH ALL DATA ---
  async fetchAll(): Promise<FirestoreDataSnapshot> {
    const [
      usersSnap,
      classesSnap,
      detailsSnap,
      quizzesSnap,
      resultsSnap,
      commentsSnap,
      announcementsSnap,
      schoolInfoSnap,
      questionBankSnap,
      weaknessPracticesSnap,
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'student_details')),
      getDocs(collection(db, 'quizzes')),
      getDocs(collection(db, 'quiz_results')),
      getDocs(collection(db, 'teacher_comments')),
      getDocs(collection(db, 'announcements')),
      getDoc(doc(db, 'school_info', 'main')),
      getDocs(collection(db, 'question_bank')),
      getDocs(collection(db, 'weakness_practices')),
    ]);

    return {
      users: usersSnap.docs.map((d) => d.data() as User),
      classes: classesSnap.docs.map((d) => d.data() as SchoolClass),
      studentDetails: detailsSnap.docs.map((d) => d.data() as StudentDetail),
      quizzes: quizzesSnap.docs.map((d) => d.data() as Quiz),
      quizResults: resultsSnap.docs.map((d) => d.data() as QuizResult),
      teacherComments: commentsSnap.docs.map((d) => d.data() as TeacherComment),
      announcements: announcementsSnap.docs.map((d) => d.data() as Announcement),
      schoolInfo: schoolInfoSnap.exists() ? (schoolInfoSnap.data() as SchoolInfo) : null,
      questionBank: questionBankSnap.docs.map((d) => d.data() as QuestionBankItem),
      weaknessPractices: weaknessPracticesSnap.docs.map((d) => d.data() as WeaknessPracticeRecord),
    };
  },

  // --- DIRECT USER QUERY FOR CROSS-DEVICE IMMEDIATE LOGIN ---
  async findUserForLogin(identifier: string): Promise<User | null> {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;

    try {
      // 1. Try direct match by email
      const emailQuery = query(collection(db, 'users'), where('email', '==', clean));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        return emailSnap.docs[0].data() as User;
      }

      // 2. Try match by username
      const usernameQuery = query(collection(db, 'users'), where('username', '==', clean));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        return usernameSnap.docs[0].data() as User;
      }

      // 3. Try case-insensitive scan of users collection
      const allUsers = await getDocs(collection(db, 'users'));
      for (const d of allUsers.docs) {
        const u = d.data() as User;
        if (
          u.email?.toLowerCase() === clean ||
          u.username?.toLowerCase() === clean ||
          u.fullName?.toLowerCase() === clean
        ) {
          return u;
        }
      }
    } catch (e) {
      console.warn('Error querying user in Firestore:', e);
    }
    return null;
  },

  // --- SEED OR MIGRATE LOCAL DATA TO FIRESTORE ---
  async seedIfEmpty(initialData: {
    users: User[];
    classes: SchoolClass[];
    studentDetails: StudentDetail[];
    quizzes: Quiz[];
    quizResults: QuizResult[];
    teacherComments: TeacherComment[];
    announcements: Announcement[];
    schoolInfo: SchoolInfo;
    questionBank?: QuestionBankItem[];
  }): Promise<boolean> {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const classesSnap = await getDocs(collection(db, 'classes'));

      const batch = writeBatch(db);
      let writesCount = 0;

      // If users are empty in Firestore, seed from initialData
      if (usersSnap.empty && initialData.users.length > 0) {
        for (const u of initialData.users) {
          const ref = doc(db, 'users', u.id);
          batch.set(ref, cleanDataForFirestore(u), { merge: true });
          writesCount++;
        }
      }

      // If classes are empty in Firestore, seed from initialData
      if (classesSnap.empty && initialData.classes.length > 0) {
        for (const c of initialData.classes) {
          const ref = doc(db, 'classes', c.id);
          batch.set(ref, cleanDataForFirestore(c), { merge: true });
          writesCount++;
        }
      }

      // Check school info
      const schoolSnap = await getDoc(doc(db, 'school_info', 'main'));
      if (!schoolSnap.exists() && initialData.schoolInfo) {
        const ref = doc(db, 'school_info', 'main');
        batch.set(ref, cleanDataForFirestore(initialData.schoolInfo), { merge: true });
        writesCount++;
      }

      // If student details are provided and DB is empty, sync them
      const detailsSnap = await getDocs(collection(db, 'student_details'));
      if (detailsSnap.empty && initialData.studentDetails.length > 0) {
        for (const d of initialData.studentDetails) {
          const ref = doc(db, 'student_details', d.id);
          batch.set(ref, cleanDataForFirestore(d), { merge: true });
          writesCount++;
        }
      }

      // Check Announcements - only seed if both announcements and users are completely empty (fresh database)
      if (initialData.announcements && initialData.announcements.length > 0) {
        const annSnap = await getDocs(collection(db, 'announcements'));
        const usersSnap = await getDocs(collection(db, 'users'));
        if (annSnap.empty && usersSnap.empty) {
          for (const a of initialData.announcements) {
            const ref = doc(db, 'announcements', a.id);
            batch.set(ref, cleanDataForFirestore(a), { merge: true });
            writesCount++;
          }
        }
      }

      // Check Question Bank
      if (initialData.questionBank && initialData.questionBank.length > 0) {
        const qbSnap = await getDocs(collection(db, 'question_bank'));
        if (qbSnap.empty) {
          for (const item of initialData.questionBank) {
            const ref = doc(db, 'question_bank', item.id);
            batch.set(ref, cleanDataForFirestore(item), { merge: true });
            writesCount++;
          }
        }
      }

      // Check Quizzes
      if (initialData.quizzes && initialData.quizzes.length > 0) {
        const quizzesSnap = await getDocs(collection(db, 'quizzes'));
        if (quizzesSnap.empty) {
          for (const q of initialData.quizzes) {
            const ref = doc(db, 'quizzes', q.id);
            batch.set(ref, cleanDataForFirestore(q), { merge: true });
            writesCount++;
          }
        }
      }

      // Check Quiz Results
      if (initialData.quizResults && initialData.quizResults.length > 0) {
        const resultsSnap = await getDocs(collection(db, 'quiz_results'));
        if (resultsSnap.empty) {
          for (const r of initialData.quizResults) {
            const ref = doc(db, 'quiz_results', r.id);
            batch.set(ref, cleanDataForFirestore(r), { merge: true });
            writesCount++;
          }
        }
      }

      if (writesCount > 0) {
        await batch.commit();
        console.log(`Successfully seeded ${writesCount} documents into Firestore`);
      }
      return true;
    } catch (err) {
      console.error('Failed to seed Firestore:', err);
      return false;
    }
  },

  // --- CRUD OPERATIONS ---
  async saveUser(user: User): Promise<void> {
    const ref = doc(db, 'users', user.id);
    await setDoc(ref, cleanDataForFirestore(user), { merge: true });
  },

  async bulkSaveUsers(users: User[]): Promise<void> {
    const batch = writeBatch(db);
    for (const u of users) {
      const ref = doc(db, 'users', u.id);
      batch.set(ref, cleanDataForFirestore(u), { merge: true });
    }
    await batch.commit();
  },

  async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId));
    // Also delete any associated student details
    const q = query(collection(db, 'student_details'), where('studentId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  },

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    const batch = writeBatch(db);
    for (const id of userIds) {
      batch.delete(doc(db, 'users', id));
    }
    await batch.commit();
  },

  async saveClass(cls: SchoolClass): Promise<void> {
    const ref = doc(db, 'classes', cls.id);
    await setDoc(ref, cleanDataForFirestore(cls), { merge: true });
  },

  async deleteClass(classId: string): Promise<void> {
    await deleteDoc(doc(db, 'classes', classId));
  },

  async saveStudentDetail(detail: StudentDetail): Promise<void> {
    const ref = doc(db, 'student_details', detail.id);
    await setDoc(ref, cleanDataForFirestore(detail), { merge: true });
  },

  async deleteStudentDetail(detailId: string): Promise<void> {
    await deleteDoc(doc(db, 'student_details', detailId));
  },

  async saveQuiz(quiz: Quiz): Promise<void> {
    const ref = doc(db, 'quizzes', quiz.id);
    await setDoc(ref, cleanDataForFirestore(quiz), { merge: true });
  },

  async deleteQuiz(quizId: string): Promise<void> {
    await deleteDoc(doc(db, 'quizzes', quizId));
    // Also delete any quiz results for this quiz
    const q = query(collection(db, 'quiz_results'), where('quizId', '==', quizId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  },

  async saveQuizResult(result: QuizResult): Promise<void> {
    const ref = doc(db, 'quiz_results', result.id);
    await setDoc(ref, cleanDataForFirestore(result), { merge: true });
  },

  async updateQuizResult(resultId: string, updates: Partial<QuizResult>): Promise<void> {
    const ref = doc(db, 'quiz_results', resultId);
    await setDoc(ref, cleanDataForFirestore(updates), { merge: true });
  },

  async saveQuestionBankItem(item: QuestionBankItem): Promise<void> {
    const ref = doc(db, 'question_bank', item.id);
    await setDoc(ref, cleanDataForFirestore(item), { merge: true });
  },

  async bulkSaveQuestionBankItems(items: QuestionBankItem[]): Promise<void> {
    const batch = writeBatch(db);
    for (const item of items) {
      const ref = doc(db, 'question_bank', item.id);
      batch.set(ref, cleanDataForFirestore(item), { merge: true });
    }
    await batch.commit();
  },

  async deleteQuestionBankItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'question_bank', itemId));
  },

  async saveTeacherComment(comment: TeacherComment): Promise<void> {
    const ref = doc(db, 'teacher_comments', comment.id);
    await setDoc(ref, cleanDataForFirestore(comment), { merge: true });
  },

  async deleteTeacherComment(commentId: string): Promise<void> {
    await deleteDoc(doc(db, 'teacher_comments', commentId));
  },

  async saveAnnouncement(announcement: Announcement): Promise<void> {
    try {
      const ref = doc(db, 'announcements', announcement.id);
      await setDoc(ref, cleanDataForFirestore(announcement), { merge: true });
    } catch (error) {
      console.error(`Firestore error saving announcement ${announcement.id}:`, error);
      throw error;
    }
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (error) {
      console.error(`Firestore error deleting announcement ${announcementId}:`, error);
      throw error;
    }
  },

  async saveSchoolInfo(info: SchoolInfo): Promise<void> {
    const ref = doc(db, 'school_info', 'main');
    await setDoc(ref, cleanDataForFirestore(info), { merge: true });
  },

  async saveWeaknessPractice(record: WeaknessPracticeRecord): Promise<void> {
    try {
      const ref = doc(db, 'weakness_practices', record.id);
      await setDoc(ref, cleanDataForFirestore(record), { merge: true });
    } catch (error) {
      console.error(`Firestore error saving weakness practice ${record.id}:`, error);
      throw error;
    }
  },

  async deleteWeaknessPractice(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'weakness_practices', id));
    } catch (error) {
      console.error(`Firestore error deleting weakness practice ${id}:`, error);
      throw error;
    }
  },
};
