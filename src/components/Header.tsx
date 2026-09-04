import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './common/UserAvatar';
import {
  LogIn,
  LogOut,
  LayoutDashboard,
  Megaphone,
  ChevronDown,
  Key,
  BookOpen,
  Award,
  Users,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    currentView,
    setCurrentView,
    setIsLoginModalOpen,
    schoolInfo,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'teacher':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'student':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'parent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('public')}
              className="flex items-center gap-3 text-left group focus:outline-hidden"
              id="header-brand-logo-btn"
            >
              <img
                src="https://i.postimg.cc/8kHrKr0W/image.png"
                alt="Acebee School Logo"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <span className="text-lg font-bold tracking-tight text-blue-900 flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                  {schoolInfo.name || 'ACEBEE School'}
                </span>
                <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
                  Educational Management Platform
                </p>
              </div>
            </button>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6 pl-4 border-l border-slate-200">
              <button
                onClick={() => setCurrentView('public')}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 py-1 ${
                  currentView === 'public'
                    ? 'text-blue-900 font-bold border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
                id="nav-announcements-btn"
              >
                <Megaphone className="w-4 h-4 text-blue-600" />
                Public Board
              </button>

              {currentUser && (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 py-1 ${
                    currentView === 'dashboard'
                      ? 'text-blue-900 font-bold border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                  id="nav-my-dashboard-btn"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Portal
                </button>
              )}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                    id="user-profile-menu-btn"
                  >
                    <UserAvatar
                      name={currentUser.fullName}
                      avatarUrl={currentUser.avatarUrl}
                      role={currentUser.role}
                      size="sm"
                    />
                    <div className="text-left hidden lg:block pr-1">
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        {currentUser.fullName}
                      </p>
                      <span
                        className={`inline-flex items-center gap-0.5 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(
                          currentUser.role
                        )}`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-1"
                      onMouseLeave={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2.5">
                        <UserAvatar
                          name={currentUser.fullName}
                          avatarUrl={currentUser.avatarUrl}
                          role={currentUser.role}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.2 rounded border ${getRoleBadge(
                              currentUser.role
                            )}`}
                          >
                            {currentUser.role} Account
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setCurrentView('dashboard');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                          Open Dashboard
                        </button>
                        <button
                          onClick={() => {
                            setCurrentView('public');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                        >
                          <Megaphone className="w-3.5 h-3.5 text-blue-600" />
                          View Public Board
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                          id="dropdown-logout-btn"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                  id="header-signout-btn"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded-lg shadow-sm font-semibold text-sm flex items-center gap-2 transition-all active:scale-98"
                id="header-login-btn"
              >
                <LogIn className="w-4 h-4 text-blue-300" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
