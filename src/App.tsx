import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { PublicDashboard } from './components/PublicDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, currentUser, setCurrentView, schoolInfo } = useApp();

  const renderCurrentView = () => {
    if (currentView === 'dashboard') {
      if (!currentUser) {
        return <PublicDashboard />;
      }
      switch (currentUser.role) {
        case 'admin':
          return (
            <ErrorBoundary fallbackTitle="Admin Portal Error">
              <AdminDashboard />
            </ErrorBoundary>
          );
        case 'teacher':
          return (
            <ErrorBoundary fallbackTitle="Teacher Portal Error">
              <TeacherDashboard />
            </ErrorBoundary>
          );
        case 'student':
          return (
            <ErrorBoundary fallbackTitle="Student Portal Error">
              <StudentDashboard />
            </ErrorBoundary>
          );
        case 'parent':
          return (
            <ErrorBoundary fallbackTitle="Parent Portal Error">
              <ParentDashboard />
            </ErrorBoundary>
          );
        default:
          return <PublicDashboard />;
      }
    }

    return <PublicDashboard />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-['Inter',sans-serif]">
      <Header />
      <main className="flex-1">{renderCurrentView()}</main>

      {/* Global Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="https://i.postimg.cc/8kHrKr0W/image.png"
              alt="Acebee Logo"
              className="h-8 w-auto object-contain brightness-110"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="font-bold text-white tracking-wide text-sm font-['Plus_Jakarta_Sans',sans-serif]">
                {schoolInfo.name || 'ACEBEE Educational Management System'}
              </span>
              <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                {schoolInfo.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    {schoolInfo.address}
                  </span>
                )}
                {schoolInfo.schoolNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    {schoolInfo.schoolNumber}
                  </span>
                )}
                {schoolInfo.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-amber-400" />
                    {schoolInfo.email}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setCurrentView('public')}
              className="hover:text-blue-300 text-slate-300 transition-colors"
            >
              Public Board
            </button>
            {currentUser && (
              <>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="hover:text-blue-300 text-slate-300 transition-colors"
                >
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Portal
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      <LoginModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
