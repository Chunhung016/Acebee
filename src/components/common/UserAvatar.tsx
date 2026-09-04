import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { UserRole } from '../../types';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  role?: UserRole | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  role,
  size = 'md',
  className = '',
}) => {
  // Extract initials for clean visual typography
  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleColors = (userRole?: string) => {
    switch (userRole?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-900 text-purple-100 border-purple-800';
      case 'teacher':
        return 'bg-emerald-900 text-emerald-100 border-emerald-800';
      case 'student':
        return 'bg-blue-900 text-blue-100 border-blue-800';
      case 'parent':
        return 'bg-slate-800 text-slate-100 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-100 border-slate-700';
    }
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-md',
    sm: 'w-7 h-7 text-xs rounded-md',
    md: 'w-9 h-9 text-xs rounded-lg',
    lg: 'w-12 h-12 text-sm rounded-xl',
    xl: 'w-16 h-16 text-base rounded-2xl',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClasses[size]} ${getRoleColors(
        role
      )} border flex items-center justify-center font-bold font-mono shrink-0 shadow-2xs select-none ${className}`}
      title={name}
    >
      {initials ? <span>{initials}</span> : <UserIcon className={iconSizes[size]} />}
    </div>
  );
};
