import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, SchoolClass, ACADEMIC_LEVELS } from '../../types';
import { AccountDirectoryManager } from './AccountDirectoryManager';
import { formatWhatsAppCredentials } from '../../utils/credentialGenerator';
import { AnnouncementImage } from '../AnnouncementImage';
import { ImageLightboxModal } from '../ImageLightboxModal';
import { normalizeImageUrl, compressImageFile } from '../../utils/imageUtils';
import {
  Users,
  UserPlus,
  Link2,
  Megaphone,
  Shield,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Pin,
  Image as ImageIcon,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Search,
  ExternalLink,
  Building,
  Phone,
  MapPin,
  Mail,
  Globe,
  Save,
  FileText,
  UserCheck,
  RefreshCw,
  Database,
  UserCog,
  Edit3,
  X,
  Check,
  Copy,
  Share2,
  UploadCloud,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    classes,
    studentDetails,
    announcements,
    schoolInfo,
    updateSchoolInfo,
    createAccount,
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
    setCurrentView,
    supabaseSyncInfo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'school-info' | 'accounts' | 'binding' | 'announcements'>('overview');

  // School Info State
  const [schoolName, setSchoolName] = useState(schoolInfo.name || '');
  const [schoolNumber, setSchoolNumber] = useState(schoolInfo.schoolNumber || '');
  const [schoolAddress, setSchoolAddress] = useState(schoolInfo.address || '');
  const [schoolEmail, setSchoolEmail] = useState(schoolInfo.email || '');
  const [principalName, setPrincipalName] = useState(schoolInfo.principalName || '');
  const [schoolWebsite, setSchoolWebsite] = useState(schoolInfo.website || '');
  const [schoolDescription, setSchoolDescription] = useState(schoolInfo.description || '');
  const [schoolSuccessMsg, setSchoolSuccessMsg] = useState<string | null>(null);

  // Single User Form State
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleRole, setSingleRole] = useState<UserRole>('student');
  const [singlePhone, setSinglePhone] = useState('');
  const [singleParentName, setSingleParentName] = useState('');
  const [singleParentPhone, setSingleParentPhone] = useState('');
  const [singleAddress, setSingleAddress] = useState('');
  const [singleClassId, setSingleClassId] = useState(classes[0]?.id || '');
  const [singleTeacherClassIds, setSingleTeacherClassIds] = useState<string[]>([]);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [lastCreatedUser, setLastCreatedUser] = useState<User | null>(null);
  const [justCopiedCreatedUser, setJustCopiedCreatedUser] = useState(false);

  // Bulk Users Form State
  const [bulkRole, setBulkRole] = useState<UserRole>('student');
  const [bulkText, setBulkText] = useState(
    `John Smith, john.smith@student.acebee.edu, +1 (555) 123-4567, David Smith, +1 (555) 987-6543, 100 Main Street\nEmma Johnson, emma.j@student.acebee.edu, +1 (555) 234-5678, Sarah Johnson, +1 (555) 876-5432, 200 Oak Avenue`
  );
  const [bulkResults, setBulkResults] = useState<{ createdCount: number; errors: string[] } | null>(null);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<string>('Academic');
  const [annContent, setAnnContent] = useState('');
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [annBadge, setAnnBadge] = useState('');
  const [annPinned, setAnnPinned] = useState(false);
  const [adminLightboxImage, setAdminLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [annSuccessMsg, setAnnSuccessMsg] = useState<string | null>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<string>(ACADEMIC_LEVELS[0]);
  const [newClassTeacherId, setNewClassTeacherId] = useState(
    users.find((u) => u.role === 'teacher')?.id || ''
  );

  // Edit Class Modal State
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassGrade, setEditClassGrade] = useState<string>(ACADEMIC_LEVELS[0]);
  const [editClassYear, setEditClassYear] = useState('2025-2026');
  const [editClassTeacherId, setEditClassTeacherId] = useState('');

  // Delete Class Modal State
  const [classToDelete, setClassToDelete] = useState<SchoolClass | null>(null);

  // User search filter
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Counts
  const teachers = users.filter((u) => u.role === 'teacher');
  const students = users.filter((u) => u.role === 'student');
  const parents = users.filter((u) => u.role === 'parent');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle Save School Info
  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolInfo({
      name: schoolName.trim() || 'ACEBEE School',
      schoolNumber: schoolNumber.trim(),
      address: schoolAddress.trim(),
      email: schoolEmail.trim(),
      principalName: principalName.trim(),
      website: schoolWebsite.trim(),
      description: schoolDescription.trim(),
    });
    setSchoolSuccessMsg('School information updated and saved successfully!');
    setTimeout(() => {
      setSchoolSuccessMsg(null);
    }, 4000);
  };

  // Handle Single Account Creation
  const handleCreateSingleUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccessMsg(null);
    setJustCopiedCreatedUser(false);

    const newUser = createAccount(
      {
        fullName: singleName,
        email: singleEmail.trim() || undefined,
        role: singleRole,
        phoneNumber: singlePhone || '+1 (555) 000-0000',
      },
      singleRole === 'student'
        ? {
            classId: singleClassId || classes[0]?.id,
            parentName: singleParentName || 'Parent / Guardian',
            parentPhone: singleParentPhone || '+1 (555) 000-0000',
            address: singleAddress || schoolInfo.address || 'Address on file',
          }
        : undefined
    );

    if (singleRole === 'teacher' && singleTeacherClassIds.length > 0) {
      assignTeacherToClasses(newUser.id, singleTeacherClassIds);
    }

    setLastCreatedUser(newUser);
    setUserSuccessMsg(`Account created for ${newUser.fullName}! Auto-generated Username: ${newUser.username} | Password: ${newUser.tempPassword}`);
    setSingleName('');
    setSingleEmail('');
    setSinglePhone('');
    setSingleParentName('');
    setSingleParentPhone('');
    setSingleAddress('');
    setSingleTeacherClassIds([]);
  };

  const handleCopyCreatedUserWhatsApp = (user: User) => {
    const studentDet = studentDetails.find((d) => d.studentId === user.id);
    const studentClass = classes.find((c) => c.id === studentDet?.classId);
    const teacherClasses = classes.filter((c) => c.teacherId === user.id);
    const msg = formatWhatsAppCredentials({
      fullName: user.fullName,
      role: user.role,
      username: user.username || user.email.split('@')[0],
      password: user.tempPassword,
      email: user.email,
      className: studentClass?.name,
      classNames: user.role === 'teacher' ? teacherClasses.map((c) => c.name) : undefined,
      schoolName: schoolInfo.name || 'ACEBEE Academy',
    });
    navigator.clipboard.writeText(msg);
    setJustCopiedCreatedUser(true);
    setTimeout(() => {
      setJustCopiedCreatedUser(false);
    }, 2500);
  };

  // Handle Bulk Creation
  const handleBulkCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkResults(null);

    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const parsedAccounts = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      // Handle both formats: (Name, Email, Phone...) or (Name, Phone, ParentName...)
      const hasEmail = parts[1] && parts[1].includes('@');
      const emailVal = hasEmail ? parts[1] : undefined;
      const phoneVal = hasEmail ? parts[2] : parts[1];
      const parentNameVal = hasEmail ? parts[3] : parts[2];
      const parentPhoneVal = hasEmail ? parts[4] : parts[3];
      const addressVal = hasEmail ? parts[5] : parts[4];

      return {
        fullName: parts[0] || 'Unknown User',
        email: emailVal,
        phoneNumber: phoneVal || '+1 (555) 000-0000',
        parentName: parentNameVal || 'Parent / Guardian',
        parentPhone: parentPhoneVal || '+1 (555) 000-0000',
        address: addressVal || 'Address on file',
        role: bulkRole,
      };
    });

    const res = bulkCreateAccounts(parsedAccounts);
    setBulkResults(res);
  };

  const handleImageFileUpload = async (file: File) => {
    setImageUploadError(null);
    setIsUploadingImage(true);
    try {
      const dataUrl = await compressImageFile(file);
      setAnnImageUrl(dataUrl);
    } catch (err: any) {
      setImageUploadError(err?.message || 'Failed to process image file');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle Post Announcement
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    setAnnSuccessMsg(null);
    setImageUploadError(null);

    const normalizedUrl = annImageUrl.trim() ? normalizeImageUrl(annImageUrl.trim()) : undefined;

    createAnnouncement({
      title: annTitle,
      category: annCategory,
      content: annContent,
      imageUrl: normalizedUrl,
      badge: annBadge.trim() ? annBadge.trim() : undefined,
      pinned: annPinned,
    });

    setAnnSuccessMsg('Announcement successfully published to the Public Dashboard!');
    setAnnTitle('');
    setAnnContent('');
    setAnnImageUrl('');
    setAnnBadge('');
    setAnnPinned(false);
  };

  // Handle Create Class
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClass(newClassName.trim(), newClassGrade, newClassTeacherId);
    setNewClassName('');
  };

  const openEditClassModal = (cls: SchoolClass) => {
    setEditingClass(cls);
    setEditClassName(cls.name);
    setEditClassGrade(cls.gradeLevel);
    setEditClassYear(cls.academicYear || '2025-2026');
    setEditClassTeacherId(cls.teacherId || '');
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editClassName.trim()) return;
    updateClass(editingClass.id, {
      name: editClassName.trim(),
      gradeLevel: editClassGrade,
      academicYear: editClassYear.trim() || '2025-2026',
      teacherId: editClassTeacherId,
    });
    setEditingClass(null);
  };

  const handleConfirmDeleteClass = () => {
    if (!classToDelete) return;
    deleteClass(classToDelete.id);
    setClassToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-md border border-blue-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-mono uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            Super Administrator Control Center
          </div>
          <h1 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
            {schoolInfo.name || 'ACEBEE'} School Administration
          </h1>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
            Manage school information, user accounts, class rosters, faculty bindings, and public notices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-200 text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloud Database Active</span>
          </div>

          <button
            onClick={() => supabaseSyncInfo.syncWithSupabase()}
            disabled={supabaseSyncInfo.isSyncing}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition-all flex items-center gap-1.5 backdrop-blur-xs disabled:opacity-50"
            title="Refresh records from Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${supabaseSyncInfo.isSyncing ? 'animate-spin' : ''}`} />
            <span>{supabaseSyncInfo.isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            {supabaseSyncInfo.lastSyncedAt && (
              <span className="text-[10px] text-blue-200 ml-1 opacity-80 hidden sm:inline">
                ({supabaseSyncInfo.lastSyncedAt})
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('public')}
            className="px-4 py-2 rounded-lg bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <span>View Public Board</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-900" />
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="admin-tab-overview"
        >
          <Layers className="w-4 h-4" />
          System Overview & Directory
        </button>

        <button
          onClick={() => setActiveTab('school-info')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'school-info'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="admin-tab-school-info"
        >
          <Building className="w-4 h-4" />
          School Information & Address
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'accounts'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="admin-tab-accounts"
        >
          <UserCog className="w-4 h-4" />
          Account Governance & Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('binding')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'binding'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="admin-tab-binding"
        >
          <Link2 className="w-4 h-4" />
          Class & Student Bindings ({classes.length})
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          id="admin-tab-announcements"
        >
          <Megaphone className="w-4 h-4" />
          Public Announcements ({announcements.length})
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW & USER DIRECTORY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* School Info Summary Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {schoolInfo.name || 'ACEBEE Academy'}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {schoolInfo.schoolNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>School No:</strong> {schoolInfo.schoolNumber}
                  </span>
                )}
                {schoolInfo.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <strong>Address:</strong> {schoolInfo.address}
                  </span>
                )}
                {schoolInfo.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <strong>Email:</strong> {schoolInfo.email}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('school-info')}
              className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Edit School Details</span>
            </button>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Teachers</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{teachers.length}</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Faculty staff</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Students</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{students.length}</div>
              <div className="text-[11px] text-blue-700 font-medium mt-0.5">Enrolled students</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Registered Parents</span>
                <HeartHandshake className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{parents.length}</div>
              <div className="text-[11px] text-slate-700 font-medium mt-0.5">Guardians on file</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Active Classes</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">{classes.length}</div>
              <div className="text-[11px] text-blue-700 font-medium mt-0.5">Classrooms</div>
            </div>
          </div>

          {/* System User Directory Table & Quick Actions */}
          <AccountDirectoryManager
            title={`System User Directory (${users.length})`}
            subtitle="Search, filter, edit credentials, assign classes, or perform bulk deletions with RBAC governance."
          />
        </div>
      )}

      {/* TAB 2: SCHOOL INFORMATION & ADDRESS */}
      {activeTab === 'school-info' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-base">
                  School Identification & Contact Information
                </h3>
                <p className="text-xs text-slate-500">
                  Configure school contact numbers, campus address, and official identity displayed across public boards and portals.
                </p>
              </div>
            </div>

            {schoolSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{schoolSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchoolInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official School Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Acebee International School"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                      id="school-name-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    School Phone / Official Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={schoolNumber}
                      onChange={(e) => setSchoolNumber(e.target.value)}
                      placeholder="e.g. +1 (555) 902-1000 or SCH-88392"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                      id="school-number-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Address (Street, City, State, Postal Code) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    placeholder="e.g. 1288 Academic Boulevard, Suite 400, Springfield, IL 62701"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    id="school-address-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official School Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      placeholder="e.g. admin@acebee.edu"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                      id="school-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal / Head Administrator Name
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={principalName}
                      onChange={(e) => setPrincipalName(e.target.value)}
                      placeholder="e.g. Dr. Eleanor Vance"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                      id="principal-name-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School Mission & Overview
                </label>
                <textarea
                  rows={3}
                  value={schoolDescription}
                  onChange={(e) => setSchoolDescription(e.target.value)}
                  placeholder="Describe your school's vision, curriculum, and values..."
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  id="school-description-input"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-98"
                  id="save-school-info-btn"
                >
                  <Save className="w-4 h-4" />
                  <span>Save School Information</span>
                </button>
              </div>
            </form>
          </div>

          {/* Preview Card */}
          <div className="lg:col-span-4 bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Live Identity Preview
            </h4>

            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">{schoolName || 'School Name'}</h5>
                  <p className="text-[10px] text-slate-500">Official Educational Facility</p>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-slate-600">
                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">School Number / Phone</span>
                    <span className="font-semibold text-slate-800">{schoolNumber || 'Not set'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Campus Address</span>
                    <span className="font-semibold text-slate-800">{schoolAddress || 'Not set'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span className="font-semibold text-slate-800">{schoolEmail || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNT PROVISIONING & DIRECTORY MANAGEMENT */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Individual Account Creation */}
            <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Create Individual Account
                </h3>
                <p className="text-xs text-slate-500">Issue credentials for an individual user</p>
              </div>
            </div>

            {userSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{userSuccessMsg}</span>
                </div>
                {lastCreatedUser && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-emerald-800">
                      Copy credentials ready to paste in WhatsApp:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCreatedUserWhatsApp(lastCreatedUser)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                        justCopiedCreatedUser
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      id="copy-created-whatsapp-btn"
                    >
                      {justCopiedCreatedUser ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied for WhatsApp!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>1-Click Copy WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateSingleUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="e.g. Benjamin Hayes"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    id="single-account-name-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role *
                  </label>
                  <select
                    value={singleRole}
                    onChange={(e) => setSingleRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    id="single-account-role-select"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="Optional email address"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    id="single-account-email-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Student specific fields */}
              {singleRole === 'student' && (
                <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-3">
                  <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide">
                    Student & Guardian Profile Linking
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Assign Homeroom Class
                      </label>
                      <select
                        value={singleClassId}
                        onChange={(e) => setSingleClassId(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        {classes.length === 0 ? (
                          <option value="">No classes created yet</option>
                        ) : (
                          classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Parent / Guardian Name
                      </label>
                      <input
                        type="text"
                        value={singleParentName}
                        onChange={(e) => setSingleParentName(e.target.value)}
                        placeholder="e.g. Sarah Hayes"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Parent Phone Number
                      </label>
                      <input
                        type="text"
                        value={singleParentPhone}
                        onChange={(e) => setSingleParentPhone(e.target.value)}
                        placeholder="+1 (555) 999-8888"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        value={singleAddress}
                        onChange={(e) => setSingleAddress(e.target.value)}
                        placeholder="Street, City, State"
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher specific fields: multiple class assignments */}
              {singleRole === 'teacher' && (
                <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                      Assign Classroom(s) & Teaching Load
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {singleTeacherClassIds.length} {singleTeacherClassIds.length === 1 ? 'Class Selected' : 'Classes Selected'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80">
                    Select 1 or more classes for this teacher to carry:
                  </p>

                  {classes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No classes created yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {classes.map((cls) => {
                        const isChecked = singleTeacherClassIds.includes(cls.id);
                        const assignedTeacher = cls.teacherId ? users.find((u) => u.id === cls.teacherId) : null;
                        return (
                          <label
                            key={cls.id}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-100/90 border-emerald-400 text-emerald-950 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSingleTeacherClassIds((prev) =>
                                  prev.includes(cls.id)
                                    ? prev.filter((id) => id !== cls.id)
                                    : [...prev, cls.id]
                                );
                              }}
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-bold text-xs">{cls.name}</span>
                              <span className="block text-[10px] text-slate-500">{cls.gradeLevel}</span>
                              {assignedTeacher && !isChecked && (
                                <span className="block text-[9px] text-amber-600 truncate font-normal">
                                  Current: {assignedTeacher.fullName}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all"
                id="single-account-submit-btn"
              >
                Provision Account
              </button>
            </form>
          </div>

          {/* Bulk Creation Area */}
          <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Bulk Account Generator (CSV / Delimited)
                </h3>
                <p className="text-xs text-slate-500">
                  Quickly provision cohorts of students, teachers, or parents
                </p>
              </div>
            </div>

            {bulkResults && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  bulkResults.createdCount > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <p className="font-bold">
                  Bulk Creation Completed: {bulkResults.createdCount} accounts created.
                </p>
                {bulkResults.errors.length > 0 && (
                  <ul className="list-disc pl-4 mt-1 text-[11px] space-y-0.5 text-red-700">
                    {bulkResults.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form onSubmit={handleBulkCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Bulk Role
                </label>
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden font-medium"
                >
                  <option value="student">Student Cohort</option>
                  <option value="teacher">Teacher Faculty</option>
                  <option value="parent">Parent Cohort</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Input Format (One per line)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Name, Email, Phone, ParentName, ParentPhone, Address
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="John Smith, john.smith@student.acebee.edu, +1 (555) 123-4567, David Smith, +1 (555) 987-6543, 100 Main Street"
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all"
              >
                Process Bulk Creation
              </button>
            </form>
          </div>
        </div>

        {/* User Directory Management & Bulk Actions */}
        <AccountDirectoryManager
          title="Account Governance & Bulk Action Management"
          subtitle="Select accounts to edit credentials, change roles, assign classes, export CSV rosters, or permanently delete users."
        />
      </div>
    )}

      {/* TAB 4: CLASS & STUDENT-TEACHER BINDINGS */}
      {activeTab === 'binding' && (
        <div className="space-y-6">
          {/* Create New Class Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm font-['Plus_Jakarta_Sans',sans-serif]">
                Create New Academic Class
              </h3>
              <p className="text-xs text-slate-500">
                Establish a homeroom section (Year 1 - Year 6, Form 1 - Form 3) and assign a lead teacher
              </p>
            </div>

            <form onSubmit={handleCreateClass} className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <input
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class Name (e.g. Year 1 Alpha / Form 1 STEM)"
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex-1 sm:w-52"
              />

              <select
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700"
              >
                {ACADEMIC_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>

              <select
                value={newClassTeacherId}
                onChange={(e) => setNewClassTeacherId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700"
              >
                <option value="">Select Lead Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Class</span>
              </button>
            </form>
          </div>

          {/* Faculty Teaching Load & Multi-Class Assignment Matrix */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-emerald-600 rounded-full shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-base">
                    Faculty Teaching Load & Multi-Class Assignment Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign teachers to one or multiple classrooms (e.g., carrying 2 or more classes). Click class tags to toggle assignments.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                {teachers.length} Active Faculty
              </span>
            </div>

            {teachers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">
                No teacher accounts registered yet. Create teacher accounts in the Accounts tab.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {teachers.map((teacher) => {
                  const teacherAssignedClasses = classes.filter((c) => c.teacherId === teacher.id);
                  const teacherAssignedClassIds = teacherAssignedClasses.map((c) => c.id);
                  const loadCount = teacherAssignedClasses.length;

                  return (
                    <div
                      key={teacher.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
                            {teacher.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs block truncate">
                              {teacher.fullName}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">
                              {teacher.email}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            loadCount > 1
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : loadCount === 1
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {loadCount === 0
                            ? '0 Classes'
                            : loadCount === 1
                            ? '1 Class'
                            : `${loadCount} Classes`}
                        </span>
                      </div>

                      {/* Class Toggle Buttons */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Assigned Classes (Click to toggle):
                        </span>
                        {classes.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No classes available</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {classes.map((cls) => {
                              const isAssigned = teacherAssignedClassIds.includes(cls.id);
                              return (
                                <button
                                  key={cls.id}
                                  type="button"
                                  onClick={() => {
                                    const newClassIds = isAssigned
                                      ? teacherAssignedClassIds.filter((id) => id !== cls.id)
                                      : [...teacherAssignedClassIds, cls.id];
                                    assignTeacherToClasses(teacher.id, newClassIds);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 shadow-2xs ${
                                    isAssigned
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                  id={`toggle-teacher-${teacher.id}-class-${cls.id}`}
                                >
                                  {isAssigned ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Plus className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span>{cls.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Classes Grid */}
          {classes.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Classes Established Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the form above to establish your school's classrooms (Year 1 to Year 6, Form 1 to Form 3), assign faculty, and enroll students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classes.map((cls) => {
                const assignedTeacher = users.find((u) => u.id === cls.teacherId);
                const classStudents = studentDetails.filter((d) => d.classId === cls.id);

                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {cls.gradeLevel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {cls.academicYear || '2025-2026'}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                          {cls.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                          {classStudents.length} Students
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditClassModal(cls)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-700 hover:bg-blue-50 bg-white transition-colors"
                          title="Edit Class Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setClassToDelete(cls)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 bg-white transition-colors"
                          title="Remove / Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Teacher Assignment */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Homeroom Teacher
                          </span>
                          <p className="text-xs font-bold text-slate-900">
                            {assignedTeacher?.fullName || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      <select
                        value={cls.teacherId || ''}
                        onChange={(e) => assignTeacherToClass(cls.id, e.target.value)}
                        className="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="">Unassigned</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Student Roster in this Class */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold text-slate-700">Assigned Students</h5>
                        <span className="text-[11px] text-slate-400">{classStudents.length} enrolled</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {classStudents.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            No students assigned to this class yet.
                          </p>
                        ) : (
                          classStudents.map((det) => {
                            const studentUser = users.find((u) => u.id === det.studentId);
                            return (
                              <div
                                key={det.id}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                              >
                                <div>
                                  <span className="font-bold text-slate-800">
                                    {studentUser?.fullName || 'Student'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {studentUser?.email}
                                  </span>
                                </div>

                                <select
                                  value={det.classId}
                                  onChange={(e) => bindStudentToClass(det.studentId, e.target.value)}
                                  className="text-[11px] px-2 py-1 rounded border border-slate-200 bg-white"
                                  title="Reassign class"
                                >
                                  {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      Move to {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PUBLIC ANNOUNCEMENT MANAGER */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Post New Announcement Form */}
          <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Post Public Announcement
                </h3>
                <p className="text-xs text-slate-500">
                  Adds directly to the masonry grid on the public dashboard
                </p>
              </div>
            </div>

            {annSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{annSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. 🏆 Annual Science & Robotics Fair 2026"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  id="announcement-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value)}
                    placeholder="e.g. Academic, Sports, Event..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    id="announcement-category-input"
                  />
                  <datalist id="category-suggestions">
                    <option value="Academic" />
                    <option value="Event" />
                    <option value="Notice" />
                    <option value="Sports" />
                    <option value="Arts" />
                    <option value="General" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Badge / Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={annBadge}
                    onChange={(e) => setAnnBadge(e.target.value)}
                    placeholder="e.g. Featured, Championship"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Announcement Flyer / Poster Image
                  </label>
                  {annImageUrl && (
                    <button
                      type="button"
                      onClick={() => setAnnImageUrl('')}
                      className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <X className="w-3 h-3" /> Remove Image
                    </button>
                  )}
                </div>

                {/* Upload or URL options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg cursor-pointer bg-slate-50/60 hover:bg-blue-50/40 transition-colors">
                    <UploadCloud className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xs font-medium text-slate-700">Upload Image File</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP (auto-optimized)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileUpload(file);
                      }}
                    />
                  </label>

                  <div className="flex flex-col justify-center space-y-1">
                    <div className="relative">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={annImageUrl.startsWith('data:') ? '' : annImageUrl}
                        onChange={(e) => setAnnImageUrl(e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value) {
                            setAnnImageUrl(normalizeImageUrl(e.target.value));
                          }
                        }}
                        placeholder="Or paste image URL"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                        id="announcement-image-input"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 px-1">
                      Direct image link (PostImage, Imgur, Drive, etc.)
                    </span>
                  </div>
                </div>

                {isUploadingImage && (
                  <div className="text-xs text-blue-600 flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing and optimizing image...</span>
                  </div>
                )}

                {imageUploadError && (
                  <div className="text-xs text-red-600 p-2 bg-red-50 rounded-lg border border-red-200">
                    {imageUploadError}
                  </div>
                )}

                {/* Live Flyer Preview */}
                {annImageUrl && (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Live Flyer Preview
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {annImageUrl.startsWith('data:') ? 'Uploaded Local File' : 'External Web URL'}
                      </span>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <AnnouncementImage
                        variant="card"
                        src={annImageUrl}
                        alt="Preview"
                        containerClassName="h-40"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Text Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Write announcement details, dates, instructions..."
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  id="announcement-content-input"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ann-pinned-check"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ann-pinned-check" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-blue-600" />
                  Pin this announcement to the top of the Public Board
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all"
                id="post-announcement-btn"
              >
                Publish to Public Dashboard
              </button>
            </form>
          </div>

          {/* Active Announcements List */}
          <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
                <h3 className="font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Published Announcements ({announcements.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Live on Public Portal</span>
            </div>

            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Announcements Published</p>
                <p className="text-[11px] text-slate-500">
                  Use the form on the left to publish academic updates, notices, and events.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="flex gap-3">
                      {ann.imageUrl && (
                        <AnnouncementImage
                          variant="thumbnail"
                          src={ann.imageUrl}
                          alt={ann.title}
                          onEnlarge={() => setAdminLightboxImage({ src: ann.imageUrl!, alt: ann.title })}
                        />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            {ann.category}
                          </span>
                          {ann.pinned && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5 fill-blue-800" /> Pinned
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {ann.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => togglePinAnnouncement(ann.id)}
                        className={`p-1.5 rounded-lg border text-xs ${
                          ann.pinned
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
                        }`}
                        title={ann.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 bg-white"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT CLASS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    Edit Class Details
                  </h3>
                  <p className="text-xs text-slate-500">Update classroom title, level, or lead faculty</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                  placeholder="e.g. Year 1 Alpha"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Level
                  </label>
                  <select
                    value={editClassGrade}
                    onChange={(e) => setEditClassGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                  >
                    {ACADEMIC_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={editClassYear}
                    onChange={(e) => setEditClassYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                    placeholder="2025-2026"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Homeroom Teacher
                </label>
                <select
                  value={editClassTeacherId}
                  onChange={(e) => setEditClassTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                >
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CLASS CONFIRMATION MODAL */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Delete Class "{classToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-500">
                This will permanently remove the classroom section ({classToDelete.gradeLevel}) and unbind any currently enrolled students.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Enrolled Students:</span>
                <span className="font-bold text-slate-800">
                  {studentDetails.filter((d) => d.classId === classToDelete.id).length} students
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Assigned Teacher:</span>
                <span className="font-bold text-slate-800">
                  {users.find((u) => u.id === classToDelete.teacherId)?.fullName || 'None'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="w-1/2 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="w-1/2 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Image Full-Screen Lightbox */}
      {adminLightboxImage && (
        <ImageLightboxModal
          src={adminLightboxImage.src}
          alt={adminLightboxImage.alt}
          onClose={() => setAdminLightboxImage(null)}
        />
      )}
    </div>
  );
};
