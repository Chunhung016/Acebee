export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- ACEBEE SCHOOL MANAGEMENT PLATFORM - SUPABASE DATABASE SCHEMA
-- Role-Based Educational Portal: Admin, Teacher, Student, Parent
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Custom ENUM Types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE subject_type AS ENUM ('Mathematics', 'English', 'Science', 'Social Studies', 'Art & Technology');
CREATE TYPE comment_category AS ENUM ('positive', 'improvement', 'general', 'achievement');
CREATE TYPE announcement_category AS ENUM ('General', 'Academic', 'Event', 'Sports', 'Arts', 'Notice');

-- ==============================================================================
-- 3. PROFILES / USERS TABLE (Extends Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 4. CLASSES TABLE (Links 1 Teacher to Class & Students)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 5. STUDENT DETAILS TABLE (Links Student, Class, Parent & Contact Details)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    address TEXT NOT NULL,
    emergency_contact TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 6. QUIZZES TABLE (Created by Teachers for their Class)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject subject_type NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER NOT NULL DEFAULT 15,
    questions JSONB NOT NULL, -- Array of { id, question, options[], correctAnswerIndex, explanation }
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 7. QUIZ RESULTS TABLE (Student Scores & Leaderboard)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    answers JSONB NOT NULL, -- Array of { questionId, selectedOption, isCorrect }
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(quiz_id, student_id)
);

-- ==============================================================================
-- 8. TEACHER COMMENTS TABLE (Behavioral Notes to Parents)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.teacher_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category comment_category NOT NULL DEFAULT 'general',
    comment TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 9. ANNOUNCEMENTS TABLE (Public Dashboard Feed & Image URLs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category announcement_category NOT NULL DEFAULT 'General',
    content TEXT NOT NULL,
    image_url TEXT,
    badge TEXT,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 10. INDEXES FOR HIGH QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_student_details_class ON public.student_details(class_id);
CREATE INDEX IF NOT EXISTS idx_student_details_parent ON public.student_details(parent_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_class ON public.quizzes(class_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON public.quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_quiz_results_student ON public.quiz_results(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_comments_student ON public.teacher_comments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_comments_parent ON public.teacher_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON public.announcements(pinned DESC, created_at DESC);

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Helper function to check current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Everyone can read their own profile; Admins can manage all; Public can read basic teacher profiles
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.get_user_role() = 'admin');

CREATE POLICY "Admin full access to profiles" ON public.profiles
    FOR ALL USING (public.get_user_role() = 'admin');

-- Announcements: Public read access, Admin write access
CREATE POLICY "Public read announcements" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Admin write announcements" ON public.announcements
    FOR ALL USING (public.get_user_role() = 'admin');

-- Classes: Admin all, Teachers can view their class, Students/Parents can view assigned class
CREATE POLICY "Admin full access to classes" ON public.classes
    FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Teacher view their class" ON public.classes
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Student and Parent view assigned class" ON public.classes
    FOR SELECT USING (
        id IN (SELECT class_id FROM public.student_details WHERE student_id = auth.uid() OR parent_id = auth.uid())
    );

-- Student Details: Admin all, Teachers manage their class students, Parents view their child, Students view their own
CREATE POLICY "Admin full access to student details" ON public.student_details
    FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Teacher view & edit class students" ON public.student_details
    FOR ALL USING (
        class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    );

CREATE POLICY "Parent view their child details" ON public.student_details
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Student view own details" ON public.student_details
    FOR SELECT USING (student_id = auth.uid());

-- Quizzes: Teachers manage quizzes for their class, Students view class quizzes
CREATE POLICY "Teacher manage class quizzes" ON public.quizzes
    FOR ALL USING (teacher_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Student view assigned quizzes" ON public.quizzes
    FOR SELECT USING (
        class_id IN (SELECT class_id FROM public.student_details WHERE student_id = auth.uid())
    );

-- Quiz Results: Student can insert/view own, Teacher can view their class results, Parent view child results
CREATE POLICY "Student manage own results" ON public.quiz_results
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teacher view class results" ON public.quiz_results
    FOR SELECT USING (
        quiz_id IN (SELECT id FROM public.quizzes WHERE teacher_id = auth.uid())
        OR public.get_user_role() = 'admin'
    );

CREATE POLICY "Parent view child quiz results" ON public.quiz_results
    FOR SELECT USING (
        student_id IN (SELECT student_id FROM public.student_details WHERE parent_id = auth.uid())
    );

-- Teacher Comments: Teacher write to assigned students, Parent read for their child
CREATE POLICY "Teacher manage comments" ON public.teacher_comments
    FOR ALL USING (teacher_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "Parent view student comments" ON public.teacher_comments
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parent update read status" ON public.teacher_comments
    FOR UPDATE USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());

-- ==============================================================================
-- 12. SEED INITIAL ADMIN ACCOUNT & DEFAULT METADATA
-- Credentials: Email: admin@lb.com | Password: 212832Lb
-- ==============================================================================
-- Note: In Supabase production, create the Auth user via Supabase Dashboard / Admin API,
-- or run the following snippet in SQL Editor:

/*
-- Step 1: Create auth user (Password: 212832Lb)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@lb.com',
    crypt('212832Lb', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Acebee Head Administrator"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert matching profile record
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    phone_number,
    avatar_url
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@lb.com',
    'Acebee Head Administrator',
    'admin',
    '+1 (555) 019-2832',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
) ON CONFLICT (id) DO NOTHING;
*/
`;
