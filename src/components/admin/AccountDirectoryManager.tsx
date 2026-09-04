import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, StudentDetail } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { formatWhatsAppCredentials } from '../../utils/credentialGenerator';
import {
  Search,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  Download,
  AlertTriangle,
  X,
  CheckCircle2,
  UserCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Shield,
  Layers,
  Sparkles,
  Copy,
  Check,
  Share2,
} from 'lucide-react';

interface AccountDirectoryManagerProps {
  title?: string;
  subtitle?: string;
}

export const AccountDirectoryManager: React.FC<AccountDirectoryManagerProps> = ({
  title = 'System User Directory & Account Governance',
  subtitle = 'Manage individual credentials, view auto-generated usernames/passwords, copy for WhatsApp in 1-click, and execute bulk account operations.',
}) => {
  const {
    users,
    classes,
    studentDetails,
    schoolInfo,
    updateAccount,
    deleteAccount,
    bulkDeleteAccounts,
    bulkUpdateAccounts,
    assignTeacherToClasses,
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Bulk Edit state
  const [bulkTargetRole, setBulkTargetRole] = useState<UserRole | ''>('');
  const [bulkTargetClassId, setBulkTargetClassId] = useState<string>('');
  const [bulkActionSuccess, setBulkActionSuccess] = useState<string | null>(null);

  // Modals state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Copy feedback state
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('student');
  const [editPhone, setEditPhone] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editTeacherClassIds, setEditTeacherClassIds] = useState<string[]>([]);
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // 1-Click Copy to WhatsApp
  const handleCopyWhatsApp = (user: User) => {
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
    setCopiedUserId(user.id);
    setTimeout(() => {
      setCopiedUserId(null);
    }, 2000);
  };

  // Direct WhatsApp Share link
  const handleOpenWhatsAppShare = (user: User) => {
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
    const phone = (studentDet?.parentPhone || user.phoneNumber || '').replace(/[^0-9]/g, '');
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    if (!matchesSearch || !matchesRole) return false;

    if (classFilter !== 'all') {
      const studentDet = studentDetails.find((d) => d.studentId === u.id);
      const isTeacherOfClass = classes.some((c) => c.id === classFilter && c.teacherId === u.id);
      const isStudentOfClass = studentDet?.classId === classFilter;
      return isTeacherOfClass || isStudentOfClass;
    }

    return true;
  });

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditEmail(user.email);
    setEditUsername(user.username || '');
    setEditPassword(user.tempPassword || '');
    setEditRole(user.role);
    setEditPhone(user.phoneNumber || '');

    if (user.role === 'teacher') {
      const assigned = classes.filter((c) => c.teacherId === user.id).map((c) => c.id);
      setEditTeacherClassIds(assigned);
    } else {
      setEditTeacherClassIds([]);
    }

    const studentDet = studentDetails.find((d) => d.studentId === user.id);
    if (studentDet) {
      setEditClassId(studentDet.classId || (classes[0]?.id ?? ''));
      setEditParentName(studentDet.parentName || '');
      setEditParentPhone(studentDet.parentPhone || '');
      setEditParentEmail(studentDet.parentEmail || '');
      setEditAddress(studentDet.address || '');
      setEditEmergencyContact(studentDet.emergencyContact || '');
      setEditNotes(studentDet.notes || '');
    } else {
      setEditClassId(classes[0]?.id ?? '');
      setEditParentName('');
      setEditParentPhone('');
      setEditParentEmail('');
      setEditAddress('');
      setEditEmergencyContact('');
      setEditNotes('');
    }
    setEditSuccessMsg(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const extraDetails: Partial<StudentDetail> | undefined =
      editRole === 'student'
        ? {
            classId: editClassId || (classes[0]?.id ?? 'class-5a'),
            parentName: editParentName || 'Parent / Guardian',
            parentPhone: editParentPhone || '+1 (555) 000-0000',
            parentEmail: editParentEmail,
            address: editAddress || 'Address on file',
            emergencyContact: editEmergencyContact,
            notes: editNotes,
          }
        : undefined;

    updateAccount(
      editingUser.id,
      {
        fullName: editFullName.trim(),
        email: editEmail.trim() || `${(editUsername || 'user').toLowerCase()}@acebee.edu`,
        username: editUsername.trim() || undefined,
        tempPassword: editPassword.trim() || undefined,
        role: editRole,
        phoneNumber: editPhone.trim(),
      },
      extraDetails
    );

    if (editRole === 'teacher') {
      assignTeacherToClasses(editingUser.id, editTeacherClassIds);
    }

    setEditSuccessMsg(`Account for ${editFullName} successfully updated!`);
    setTimeout(() => {
      setEditingUser(null);
      setEditSuccessMsg(null);
    }, 1200);
  };

  // Delete Handlers
  const handleConfirmSingleDelete = () => {
    if (!userToDelete) return;
    deleteAccount(userToDelete.id);
    setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
    setUserToDelete(null);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    bulkDeleteAccounts(selectedUserIds);
    setSelectedUserIds([]);
    setShowBulkDeleteModal(false);
    setBulkActionSuccess(`Successfully deleted ${selectedUserIds.length} accounts.`);
    setTimeout(() => setBulkActionSuccess(null), 3500);
  };

  // Bulk Edit Handlers
  const handleBulkChangeRole = () => {
    if (!bulkTargetRole || selectedUserIds.length === 0) return;
    bulkUpdateAccounts(selectedUserIds, { role: bulkTargetRole });
    setBulkActionSuccess(`Updated role to ${bulkTargetRole.toUpperCase()} for ${selectedUserIds.length} users.`);
    setBulkTargetRole('');
    setTimeout(() => setBulkActionSuccess(null), 3500);
  };

  const handleBulkAssignClass = () => {
    if (!bulkTargetClassId || selectedUserIds.length === 0) return;
    const targetClassName = classes.find((c) => c.id === bulkTargetClassId)?.name || bulkTargetClassId;
    bulkUpdateAccounts(selectedUserIds, { classId: bulkTargetClassId });
    setBulkActionSuccess(`Assigned ${selectedUserIds.length} students to class ${targetClassName}.`);
    setBulkTargetClassId('');
    setTimeout(() => setBulkActionSuccess(null), 3500);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const usersToExport =
      selectedUserIds.length > 0
        ? users.filter((u) => selectedUserIds.includes(u.id))
        : filteredUsers;

    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Phone', 'Assigned Class', 'Parent Name', 'Parent Phone', 'Address'];
    const rows = usersToExport.map((u) => {
      const studentDet = studentDetails.find((d) => d.studentId === u.id);
      const assignedClass = classes.find((c) =>
        u.role === 'teacher' ? c.teacherId === u.id : c.id === studentDet?.classId
      );
      return [
        `"${u.id}"`,
        `"${u.fullName.replace(/"/g, '""')}"`,
        `"${u.email}"`,
        `"${u.role}"`,
        `"${u.phoneNumber || ''}"`,
        `"${assignedClass?.name || ''}"`,
        `"${studentDet?.parentName || ''}"`,
        `"${studentDet?.parentPhone || ''}"`,
        `"${studentDet?.address || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acebee_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;
  const isPartiallySelected = selectedUserIds.length > 0 && selectedUserIds.length < filteredUsers.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-slate-900 text-base font-['Plus_Jakarta_Sans',sans-serif]">
              {title}
            </h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Search & Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, phone..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              id="account-search-input"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700"
            id="account-role-filter"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">Admins ({users.filter((u) => u.role === 'admin').length})</option>
            <option value="teacher">Teachers ({users.filter((u) => u.role === 'teacher').length})</option>
            <option value="student">Students ({users.filter((u) => u.role === 'student').length})</option>
            <option value="parent">Parents ({users.filter((u) => u.role === 'parent').length})</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700"
            id="account-class-filter"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
            title="Export to CSV"
            id="export-users-csv-btn"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Notification Banner */}
      {bulkActionSuccess && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bulkActionSuccess}</span>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="p-3 bg-blue-50/90 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-blue-900 text-white font-bold text-xs">
              {selectedUserIds.length} Selected
            </span>
            <span className="text-xs text-blue-900 font-medium hidden sm:inline">
              Bulk actions for selected records:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Role Change */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-blue-200">
              <select
                value={bulkTargetRole}
                onChange={(e) => setBulkTargetRole(e.target.value as UserRole)}
                className="text-xs font-medium px-2 py-1 bg-transparent border-0 focus:ring-0 text-slate-700"
              >
                <option value="">Change Role...</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleBulkChangeRole}
                disabled={!bulkTargetRole}
                className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white rounded text-[11px] font-semibold transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Bulk Class Assignment */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-blue-200">
              <select
                value={bulkTargetClassId}
                onChange={(e) => setBulkTargetClassId(e.target.value)}
                className="text-xs font-medium px-2 py-1 bg-transparent border-0 focus:ring-0 text-slate-700"
              >
                <option value="">Assign Class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssignClass}
                disabled={!bulkTargetClassId}
                className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white rounded text-[11px] font-semibold transition-colors"
              >
                Assign
              </button>
            </div>

            {/* Bulk Delete */}
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              id="bulk-delete-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedUserIds.length})</span>
            </button>

            {/* Deselect All */}
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-600 hover:text-blue-900 transition-colors p-1"
                  title={isAllSelected ? 'Deselect all' : 'Select all'}
                  id="select-all-users-btn"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : isPartiallySelected ? (
                    <MinusSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Login Username & Password</th>
              <th className="py-3 px-4">Class / Details</th>
              <th className="py-3 px-4">WhatsApp Share</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Search className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600 text-sm">No accounts found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search filters or add a new account above.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const studentDet = studentDetails.find((d) => d.studentId === u.id);
                const studentClass = classes.find((c) => c.id === studentDet?.classId);
                const teacherClasses = classes.filter((c) => c.teacherId === u.id);
                const isCopied = copiedUserId === u.id;

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectUser(u.id)}
                        className="p-1 text-slate-500 hover:text-blue-900 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>

                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          name={u.fullName}
                          role={u.role}
                          size="sm"
                          className="w-7 h-7 rounded-lg"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{u.fullName}</span>
                          <span className="block text-[10px] text-slate-500 truncate">{u.phoneNumber || u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border inline-block ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : u.role === 'teacher'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : u.role === 'student'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Login Credentials (Auto-generated) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-blue-900">
                          {u.username || u.email.split('@')[0]}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          {u.tempPassword || 'AutoPass@1'}
                        </span>
                      </div>
                    </td>

                    {/* Class / Details */}
                    <td className="py-3 px-4">
                      {u.role === 'teacher' ? (
                        teacherClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacherClasses.map((tc) => (
                              <span
                                key={tc.id}
                                className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]"
                              >
                                {tc.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No classes assigned</span>
                        )
                      ) : studentClass ? (
                        <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {studentClass.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                      {studentDet?.parentName && (
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Parent: {studentDet.parentName}
                        </span>
                      )}
                    </td>

                    {/* WhatsApp 1-Click Share & Copy */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyWhatsApp(u)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 shadow-2xs ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                          title="Copy login details formatted for WhatsApp message"
                          id={`copy-wa-btn-${u.id}`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy WhatsApp</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppShare(u)}
                          className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                          title="Open in WhatsApp Web"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-900 transition-colors"
                          title="Edit user details"
                          id={`edit-user-btn-${u.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 transition-colors"
                          title="Delete user account"
                          id={`delete-user-btn-${u.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT ACCOUNT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base font-['Plus_Jakarta_Sans',sans-serif]">
                    Edit Account Profile & Credentials
                  </h4>
                  <p className="text-xs text-slate-500">
                    Modifying {editingUser.fullName} ({editingUser.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {/* Quick 1-Click WhatsApp Copy from Edit Modal */}
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-emerald-950 block">
                  Quick WhatsApp Credential Copy
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  Username: <strong className="font-mono">{editUsername || editingUser.username}</strong> | Password: <strong className="font-mono">{editPassword || editingUser.tempPassword}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyWhatsApp(editingUser)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy for WhatsApp</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    id="edit-fullname-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold text-slate-800"
                    id="edit-role-select"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Login Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Login Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="e.g. stu_alexander"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Login Password
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="e.g. Stu@9482"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Optional email address"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    id="edit-email-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    id="edit-phone-input"
                  />
                </div>
              </div>

              {/* Student specific fields */}
              {editRole === 'student' && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
                  <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                    Student Academic & Guardian Information
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Assigned Homeroom Class
                      </label>
                      <select
                        value={editClassId}
                        onChange={(e) => setEditClassId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                      >
                        {classes.length === 0 ? (
                          <option value="">No classes configured</option>
                        ) : (
                          classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.gradeLevel})
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
                        value={editParentName}
                        onChange={(e) => setEditParentName(e.target.value)}
                        placeholder="e.g. Eleanor Vance"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Parent Phone Number
                      </label>
                      <input
                        type="text"
                        value={editParentPhone}
                        onChange={(e) => setEditParentPhone(e.target.value)}
                        placeholder="+1 (555) 999-8888"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Parent Email <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={editParentEmail}
                        onChange={(e) => setEditParentEmail(e.target.value)}
                        placeholder="parent@example.com"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Street, City, State, Postal Code"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Special Notes / Accommodations
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="e.g. Honor roll student, allergies, transportation notes..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Teacher specific fields: multiple class assignments */}
              {editRole === 'teacher' && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                      Assigned Classrooms & Teaching Load
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {editTeacherClassIds.length} {editTeacherClassIds.length === 1 ? 'Class Selected' : 'Classes Selected'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80">
                    Check all classes this teacher carries. A teacher can be assigned to multiple classrooms (e.g. Year 1 and Year 2).
                  </p>

                  {classes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No classes configured yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                      {classes.map((cls) => {
                        const isChecked = editTeacherClassIds.includes(cls.id);
                        const otherTeacher =
                          cls.teacherId && cls.teacherId !== editingUser.id
                            ? users.find((u) => u.id === cls.teacherId)
                            : null;

                        return (
                          <label
                            key={cls.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-100/90 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setEditTeacherClassIds((prev) =>
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
                              {otherTeacher && !isChecked && (
                                <span className="block text-[9px] text-amber-600 truncate mt-0.5 font-normal">
                                  Currently: {otherTeacher.fullName}
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

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1.5"
                  id="save-user-changes-btn"
                >
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base font-['Plus_Jakarta_Sans',sans-serif]">
                Delete User Account?
              </h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete the account for{' '}
                <strong className="text-slate-800">{userToDelete.fullName}</strong> ({userToDelete.email})?
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Permanent Deletion Notice:
              </p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                This action will remove the user's login access, student bindings, comments, and quiz submissions both locally and from Supabase.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors flex-1"
                id="confirm-single-delete-btn"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base font-['Plus_Jakarta_Sans',sans-serif]">
                Delete {selectedUserIds.length} User Accounts?
              </h4>
              <p className="text-xs text-slate-500">
                You are about to permanently delete <strong className="text-slate-800">{selectedUserIds.length}</strong> selected accounts from the system.
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Irreversible Action:
              </p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                All selected credentials, class enrollments, and academic data will be purged immediately.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors flex-1"
                id="confirm-bulk-delete-btn"
              >
                Delete Selected ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
