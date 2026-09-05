import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CommentCategory } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  Users,
  HeartHandshake,
  BookOpen,
  Award,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Check,
  TrendingUp,
  MapPin,
  Sparkles,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const {
    currentUser,
    studentDetails,
    classes,
    users,
    quizzes,
    quizResults,
    teacherComments,
    markCommentAsRead,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'teacher' | 'grades' | 'behavior'>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Find linked student for this parent
  // If parent is Robert Vance, linked student is Lucas Vance
  const parentDetails = studentDetails.filter(
    (d) =>
      d.parentId === currentUser?.id ||
      d.parentEmail?.toLowerCase() === currentUser?.email?.toLowerCase() ||
      d.studentId === 'user-student-1' // fallback for demo
  );

  const primaryDetail = parentDetails[0] || studentDetails[0];
  const linkedStudentUser = users.find((u) => u.id === primaryDetail?.studentId);
  const childClass = classes.find((c) => c.id === primaryDetail?.classId);
  const teacherUser = users.find((u) => u.id === childClass?.teacherId);

  // Child quiz results
  const childResults = quizResults.filter((r) => r.studentId === primaryDetail?.studentId);
  const childComments = teacherComments.filter((c) => c.studentId === primaryDetail?.studentId);

  const unreadCommentsCount = childComments.filter((c) => !c.isRead).length;

  const getCategoryBadge = (cat: CommentCategory) => {
    switch (cat) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'improvement':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'achievement':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const overallAvg =
    childResults.length > 0
      ? (
          childResults.reduce((acc, r) => acc + r.percentage, 0) / childResults.length
        ).toFixed(1)
      : 'N/A';

  interface ParentNavItem {
    id: 'overview' | 'teacher' | 'grades' | 'behavior';
    label: string;
    icon: React.ElementType;
    count?: number;
    highlight?: boolean;
  }

  const parentNavItems: ParentNavItem[] = [
    { id: 'overview', label: 'Academic Snapshot', icon: TrendingUp },
    { id: 'teacher', label: "Child's Teacher", icon: BookOpen },
    { id: 'grades', label: `Quiz Results & Grades (${childResults.length})`, icon: Award },
    { id: 'behavior', label: 'Teacher Behavioral Notes', icon: MessageSquare, count: unreadCommentsCount > 0 ? unreadCommentsCount : undefined, highlight: unreadCommentsCount > 0 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-100/70">
      {/* Mobile Sidebar Header & Toggle */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-16 z-30">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={currentUser?.fullName} role="parent" size="sm" />
          <div>
            <div className="font-bold text-xs text-white">{currentUser?.fullName}</div>
            <div className="text-[10px] text-slate-400">Child: {linkedStudentUser?.fullName || 'Lucas Vance'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* LMS Vertical Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 z-40 w-64 xl:w-72 bg-slate-900 text-slate-300 flex flex-col justify-between
          h-[calc(100vh-4rem)] border-r border-slate-800/80 transition-transform duration-200 ease-in-out shrink-0
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Parent Profile Card */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={currentUser?.fullName} role="parent" size="md" />
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-blue-400 font-semibold tracking-wider">
                  <HeartHandshake className="w-3 h-3 text-blue-400" />
                  Parent Portal
                </div>
                <h2 className="text-xs font-bold text-white truncate">{currentUser?.fullName}</h2>
              </div>
            </div>

            {/* Student info card */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Enrolled Child:</div>
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{linkedStudentUser?.fullName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900 text-blue-200 font-normal">
                  {childClass?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 py-1">
              Guardian Navigation
            </div>
            {parentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  id={`parent-tab-${item.id}`}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.highlight
                          ? 'bg-amber-500 text-white animate-pulse'
                          : isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.count} New
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Homeroom: {teacherUser?.fullName || 'David Miller'}</span>
          </div>
          <p className="text-[10px] text-slate-500">Acebee Parent-School Dispatch Line</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Banner */}
        <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-md border border-blue-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-mono uppercase tracking-wider mb-2">
              <HeartHandshake className="w-3.5 h-3.5 text-blue-300" />
              Parent & Guardian Portal
            </div>
            <h1 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Welcome, {currentUser?.fullName}
            </h1>
            <p className="text-xs text-blue-200 mt-1 leading-relaxed">
              Student: <strong className="text-white">{linkedStudentUser?.fullName}</strong> • Class: <strong className="text-white">{childClass?.name}</strong>
            </p>
          </div>

          {unreadCommentsCount > 0 && (
            <div className="bg-blue-950/90 border border-blue-800 text-blue-100 px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-2 shadow-xs relative z-10">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>{unreadCommentsCount} New Teacher Note(s)</span>
            </div>
          )}
        </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Child's Overall Grade</span>
              <div className="text-3xl font-black text-blue-700 font-['Plus_Jakarta_Sans',sans-serif] mt-2">
                {overallAvg}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 5 integrated subject modules</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Completed Assessments</span>
              <div className="text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mt-2">
                {childResults.length}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">100% on-time submission rate</p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Teacher Communication</span>
              <div className="text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mt-2">
                {childComments.length} Notes
              </div>
              <p className="text-[11px] text-blue-600 font-medium mt-1">
                {unreadCommentsCount} pending acknowledgment
              </p>
            </div>
          </div>

          {/* Teacher Quick Contact Banner */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={teacherUser?.fullName || 'Teacher'}
                avatarUrl={teacherUser?.avatarUrl}
                role="teacher"
                size="lg"
              />
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Class Homeroom Teacher
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{teacherUser?.fullName}</h4>
                <p className="text-xs text-slate-500">
                  {childClass?.name} • Teaches Math, English, Science, Social Studies, Art
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${teacherUser?.phoneNumber}`}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>Call Teacher: {teacherUser?.phoneNumber}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER INFORMATION */}
      {activeTab === 'teacher' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs max-w-2xl space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Assigned Class Educator
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                Teacher Contact & Profile
              </h3>
              <p className="text-xs text-slate-500">
                Direct communication link for your child's homeroom instructor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <UserAvatar
              name={teacherUser?.fullName || 'Teacher'}
              avatarUrl={teacherUser?.avatarUrl}
              role="teacher"
              size="xl"
            />
            <div>
              <h4 className="text-base font-bold text-slate-900">{teacherUser?.fullName}</h4>
              <p className="text-xs text-slate-600">{childClass?.name} ({childClass?.gradeLevel})</p>
              <span className="inline-block mt-1 text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                Teaches All 5 Subject Modules
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Direct Phone Line
              </span>
              <a
                href={`tel:${teacherUser?.phoneNumber}`}
                className="text-sm font-bold text-blue-700 hover:underline flex items-center gap-1.5"
              >
                <Phone className="w-4 h-4" />
                {teacherUser?.phoneNumber || '+1 (555) 234-8901'}
              </a>
              <span className="text-[10px] text-slate-400 block">Available 8:00 AM - 4:00 PM</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Official Email
              </span>
              <a
                href={`mailto:${teacherUser?.email}`}
                className="text-sm font-bold text-blue-700 hover:underline flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                {teacherUser?.email || 'david.miller@acebee.edu'}
              </a>
              <span className="text-[10px] text-slate-400 block">24-hour response window</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1">
            <strong>Parent-Teacher Academic Compact:</strong>
            <p>
              {teacherUser?.fullName} conducts weekly evaluations across Mathematics, English, Science, Social Studies, and Art & Technology. Notes regarding behavioral milestones, homework feedback, and commendations are sent directly to this dashboard.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: QUIZ RESULTS & GRADES */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-base">
                Verified Quiz Performance: {linkedStudentUser?.fullName}
              </h3>
              <p className="text-xs text-slate-500">
                Detailed scores and completion dates across subject assessments
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Quiz Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Grade %</th>
                  <th className="py-3 px-4">Date Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {childResults.map((res) => {
                  const quiz = quizzes.find((q) => q.id === res.quizId);
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {quiz?.subject || 'Assessment'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{quiz?.title}</td>
                      <td className="py-3 px-4">
                        {res.score} / {res.totalPoints} pts
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            res.percentage >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : res.percentage >= 70
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {res.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(res.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BEHAVIORAL NOTES & TEACHER MENTIONS */}
      {activeTab === 'behavior' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-base">
                Private Behavioral & Academic Mentions ({childComments.length})
              </h3>
              <p className="text-xs text-slate-500">
                Direct observations and constructive feedback sent by {teacherUser?.fullName}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {childComments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
            ) : (
              childComments.map((comm) => (
                <div
                  key={comm.id}
                  className={`p-4 rounded-xl border transition-all ${
                    comm.isRead
                      ? 'bg-slate-50/50 border-slate-200'
                      : 'bg-blue-50/70 border-blue-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getCategoryBadge(
                          comm.category
                        )}`}
                      >
                        {comm.category}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        From: {teacherUser?.fullName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {comm.date}
                      </span>

                      {!comm.isRead ? (
                        <button
                          onClick={() => markCommentAsRead(comm.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
                          id={`mark-read-btn-${comm.id}`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Acknowledged
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                    {comm.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
};
