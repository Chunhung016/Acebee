import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { AccountDirectoryManager } from './AccountDirectoryManager';
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
    createClass,
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
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);

  // Bulk Users Form State
  const [bulkRole, setBulkRole] = useState<UserRole>('student');
  const [bulkText, setBulkText] = useState(
    `John Smith, john.smith@student.acebee.edu, +1 (555) 123-4567, David Smith, +1 (555) 987-6543, 100 Main Street\nEmma Johnson, emma.j@student.acebee.edu, +1 (555) 234-5678, Sarah Johnson, +1 (555) 876-5432, 200 Oak Avenue`
  );
  const [bulkResults, setBulkResults] = useState<{ createdCount: number; errors: string[] } | null>(null);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<'General' | 'Academic' | 'Event' | 'Sports' | 'Arts' | 'Notice'>('Academic');
  const [annContent, setAnnContent] = useState('');
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [annBadge, setAnnBadge] = useState('');
  const [annPinned, setAnnPinned] = useState(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState<string | null>(null);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('Grade 5');
  const [newClassTeacherId, setNewClassTeacherId] = useState(
    users.find((u) => u.role === 'teacher')?.id || ''
  );

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

    const newUser = createAccount(
      {
        fullName: singleName,
        email: singleEmail,
        role: singleRole,
        phoneNumber: singlePhone || '+1 (555) 000-0000',
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
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

    setUserSuccessMsg(`Successfully created ${newUser.role.toUpperCase()} account for ${newUser.fullName} (${newUser.email})`);
    setSingleName('');
    setSingleEmail('');
    setSinglePhone('');
    setSingleParentName('');
    setSingleParentPhone('');
    setSingleAddress('');
  };

  // Handle Bulk Creation
  const handleBulkCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkResults(null);

    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const parsedAccounts = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        fullName: parts[0] || 'Unknown User',
        email: parts[1] || `user.${Date.now()}@acebee.edu`,
        phoneNumber: parts[2] || '+1 (555) 000-0000',
        parentName: parts[3] || 'Parent / Guardian',
        parentPhone: parts[4] || '+1 (555) 000-0000',
        address: parts[5] || 'Address on file',
        role: bulkRole,
      };
    });

    const res = bulkCreateAccounts(parsedAccounts);
    setBulkResults(res);
  };

  // Handle Post Announcement
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    setAnnSuccessMsg(null);

    createAnnouncement({
      title: annTitle,
      category: annCategory,
      content: annContent,
      imageUrl: annImageUrl.trim() ? annImageUrl.trim() : undefined,
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
    createClass(newClassName, newClassGrade, newClassTeacherId);
    setNewClassName('');
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
          {supabaseSyncInfo.isConnected && (
            <button
              onClick={() => supabaseSyncInfo.syncWithSupabase()}
              disabled={supabaseSyncInfo.isSyncing}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs transition-all flex items-center gap-1.5 backdrop-blur-xs disabled:opacity-50"
              title="Sync latest records from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${supabaseSyncInfo.isSyncing ? 'animate-spin' : ''}`} />
              <span>{supabaseSyncInfo.isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
              {supabaseSyncInfo.lastSyncedAt && (
                <span className="text-[10px] text-blue-200 ml-1 opacity-80 hidden sm:inline">
                  ({supabaseSyncInfo.lastSyncedAt})
                </span>
              )}
            </button>
          )}

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
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{userSuccessMsg}</span>
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
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="e.g. ben.h@student.acebee.edu"
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
                Establish a homeroom section and assign a lead teacher
              </p>
            </div>

            <form onSubmit={handleCreateClass} className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <input
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Class Name (e.g. 5-A STEM)"
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex-1 sm:w-44"
              />

              <select
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700"
              >
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
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

          {/* Classes Grid */}
          {classes.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Classes Established Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the form above to establish your school's classrooms, assign faculty, and enroll students.
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
                    className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {cls.gradeLevel} • {cls.academicYear}
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                          {cls.name}
                        </h4>
                      </div>

                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                        {classStudents.length} Students
                      </span>
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
                        value={cls.teacherId}
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
                      <h5 className="text-xs font-bold text-slate-700 mb-2">Assigned Students</h5>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {classStudents.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No students assigned to this class yet.</p>
                        ) : (
                          classStudents.map((det) => {
                            const studentUser = users.find((u) => u.id === det.studentId);
                            return (
                              <div
                                key={det.id}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
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
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium"
                    id="announcement-category-select"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Event">Event</option>
                    <option value="Sports">Sports</option>
                    <option value="Arts">Arts</option>
                    <option value="Notice">Notice</option>
                    <option value="General">General</option>
                  </select>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Image URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={annImageUrl}
                    onChange={(e) => setAnnImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or direct link"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                    id="announcement-image-input"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Paste any direct HTTPS image URL. The public grid formats it automatically.
                </p>
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
                        <img
                          src={ann.imageUrl}
                          alt={ann.title}
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
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
    </div>
  );
};
