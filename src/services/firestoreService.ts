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
}

// Helpers to sanitize undefined values before saving to Firestore
const cleanDataForFirestore = <T extends Record<string, any>>(data: T): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
};

export const firestoreService = {
  // --- REAL-TIME SUBSCRIPTION ---
  subscribeAll(onUpdate: (data: FirestoreDataSnapshot) => void): () => void {
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
    };

    let isInitialBatchReady = false;
    const collectionsLoaded = new Set<string>();
    const expectedCollections = [
      'users',
      'classes',
      'student_details',
      'quizzes',
      'quiz_results',
      'teacher_comments',
      'announcements',
      'school_info',
      'question_bank',
    ];

    const notifyIfReady = () => {
      if (!isInitialBatchReady) {
        if (expectedCollections.every((c) => collectionsLoaded.has(c))) {
          isInitialBatchReady = true;
          onUpdate({ ...state });
        }
      } else {
        onUpdate({ ...state });
      }
    };

    // 1. Users
    unsubscribes.push(
      onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          state.users = snapshot.docs.map((d) => d.data() as User);
          collectionsLoaded.add('users');
          notifyIfReady();
        },
        (err) => console.error('Firestore users subscription error:', err)
      )
    );

    // 2. Classes
    unsubscribes.push(
      onSnapshot(
        collection(db, 'classes'),
        (snapshot) => {
          state.classes = snapshot.docs.map((d) => d.data() as SchoolClass);
          collectionsLoaded.add('classes');
          notifyIfReady();
        },
        (err) => console.error('Firestore classes subscription error:', err)
      )
    );

    // 3. Student Details
    unsubscribes.push(
      onSnapshot(
        collection(db, 'student_details'),
        (snapshot) => {
          state.studentDetails = snapshot.docs.map((d) => d.data() as StudentDetail);
          collectionsLoaded.add('student_details');
          notifyIfReady();
        },
        (err) => console.error('Firestore student_details subscription error:', err)
      )
    );

    // 4. Quizzes
    unsubscribes.push(
      onSnapshot(
        collection(db, 'quizzes'),
        (snapshot) => {
          state.quizzes = snapshot.docs.map((d) => d.data() as Quiz);
          collectionsLoaded.add('quizzes');
          notifyIfReady();
        },
        (err) => console.error('Firestore quizzes subscription error:', err)
      )
    );

    // 5. Quiz Results
    unsubscribes.push(
      onSnapshot(
        collection(db, 'quiz_results'),
        (snapshot) => {
          state.quizResults = snapshot.docs.map((d) => d.data() as QuizResult);
          collectionsLoaded.add('quiz_results');
          notifyIfReady();
        },
        (err) => console.error('Firestore quiz_results subscription error:', err)
      )
    );

    // 6. Teacher Comments
    unsubscribes.push(
      onSnapshot(
        collection(db, 'teacher_comments'),
        (snapshot) => {
          state.teacherComments = snapshot.docs.map((d) => d.data() as TeacherComment);
          collectionsLoaded.add('teacher_comments');
          notifyIfReady();
        },
        (err) => console.error('Firestore teacher_comments subscription error:', err)
      )
    );

    // 7. Announcements
    unsubscribes.push(
      onSnapshot(
        collection(db, 'announcements'),
        (snapshot) => {
          state.announcements = snapshot.docs.map((d) => d.data() as Announcement);
          collectionsLoaded.add('announcements');
          notifyIfReady();
        },
        (err) => console.error('Firestore announcements subscription error:', err)
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
          collectionsLoaded.add('school_info');
          notifyIfReady();
        },
        (err) => console.error('Firestore school_info subscription error:', err)
      )
    );

    // 9. Question Bank
    unsubscribes.push(
      onSnapshot(
        collection(db, 'question_bank'),
        (snapshot) => {
          state.questionBank = snapshot.docs.map((d) => d.data() as QuestionBankItem);
          collectionsLoaded.add('question_bank');
          notifyIfReady();
        },
        (err) => console.error('Firestore question_bank subscription error:', err)
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

      // Check Announcements
      if (initialData.announcements && initialData.announcements.length > 0) {
        const annSnap = await getDocs(collection(db, 'announcements'));
        if (annSnap.empty) {
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
    const ref = doc(db, 'announcements', announcement.id);
    await setDoc(ref, cleanDataForFirestore(announcement), { merge: true });
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    await deleteDoc(doc(db, 'announcements', announcementId));
  },

  async saveSchoolInfo(info: SchoolInfo): Promise<void> {
    const ref = doc(db, 'school_info', 'main');
    await setDoc(ref, cleanDataForFirestore(info), { merge: true });
  },
};
