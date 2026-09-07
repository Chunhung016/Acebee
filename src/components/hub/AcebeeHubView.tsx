import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolClass, UserRole } from '../../types';
import { AcebeeMathGamePlayer } from './AcebeeMathGamePlayer';
import {
  Gamepad2,
  Play,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';

interface AcebeeHubViewProps {
  userRole: UserRole;
  selectedClassId?: string;
  onSelectClassId?: (classId: string) => void;
}

export const AcebeeHubView: React.FC<AcebeeHubViewProps> = ({
  userRole,
  selectedClassId,
  onSelectClassId,
}) => {
  const { classes, studentDetails, currentUser, updateClass } = useApp();
  const [isPlayingGame, setIsPlayingGame] = useState(false);

  const safeClasses = classes || [];
  const teacherClasses = safeClasses.filter((c) => c && c.teacherId === currentUser?.id);
  const relevantClasses = teacherClasses.length > 0 ? teacherClasses : safeClasses;

  const currentClass =
    relevantClasses.find((c) => c.id === selectedClassId) ||
    relevantClasses[0] ||
    safeClasses[0];

  const studentDetail = studentDetails.find((d) => d.studentId === currentUser?.id);
  const studentClass = safeClasses.find((c) => c.id === studentDetail?.classId);

  const handleToggleClassMath = (targetClass: SchoolClass) => {
    const nextState = !targetClass.acebeeMathEnabled;
    updateClass(targetClass.id, { acebeeMathEnabled: nextState });
  };

  // If game is active, render full-screen in system with prominent Back button
  if (isPlayingGame) {
    return (
      <AcebeeMathGamePlayer
        onBack={() => setIsPlayingGame(false)}
        userRole={userRole}
        studentClassName={studentClass?.name || currentClass?.name}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-amber-500" />
            <span>Acebee Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            探索互动学习与益智数学游戏
          </p>
        </div>

        {/* Teacher Class Student Access Toggle */}
        {userRole === 'teacher' && currentClass && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
            {relevantClasses.length > 1 && (
              <select
                value={currentClass.id}
                onChange={(e) => onSelectClassId && onSelectClassId(e.target.value)}
                className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1 font-medium focus:outline-hidden"
              >
                {relevantClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            )}
            <div className="text-xs text-slate-600 font-medium">
              学生端访问:
            </div>
            <button
              type="button"
              onClick={() => handleToggleClassMath(currentClass)}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                currentClass.acebeeMathEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {currentClass.acebeeMathEnabled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>已向本班开启</span>
                </>
              ) : (
                <span>已关闭 (点击开启)</span>
              )}
            </button>
          </div>
        )}

        {/* Admin Quick Class Switcher */}
        {userRole === 'admin' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">全校班级:</span>
            <button
              type="button"
              onClick={() => {
                const allEnabled = safeClasses.every((c) => c.acebeeMathEnabled);
                safeClasses.forEach((cls) => {
                  updateClass(cls.id, { acebeeMathEnabled: !allEnabled });
                });
              }}
              className="text-xs px-2.5 py-1 rounded-lg font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            >
              {safeClasses.every((c) => c.acebeeMathEnabled) ? '关闭全校学生端' : '一键开启全校学生端'}
            </button>
          </div>
        )}
      </div>

      {/* Clean & Flat Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            {/* Flat Labels */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                数学冒险
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                全屏即玩
              </span>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Acebee 数学冒险
              </h2>
            </div>
          </div>

          {/* Action Button: Enter Fullscreen Game */}
          <div className="shrink-0 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={() => setIsPlayingGame(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm transition-colors shadow-xs active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>全屏开始游戏</span>
              <Maximize2 className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
