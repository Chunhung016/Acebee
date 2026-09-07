import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolClass, UserRole } from '../../types';
import { AcebeeMathGamePlayer } from './AcebeeMathGamePlayer';
import {
  Gamepad2,
  Sparkles,
  Github,
  Play,
  CheckCircle2,
  Lock,
  Layers,
  Shield,
  BookOpen,
  ArrowRight,
  Star,
  Trophy,
  Check,
  ExternalLink,
  Users,
  Compass,
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
  const { classes, users, studentDetails, currentUser, updateClass } = useApp();
  const [isPlayingGame, setIsPlayingGame] = useState(false);

  // Determine classes accessible based on role
  const safeClasses = classes || [];
  const teacherClasses = safeClasses.filter((c) => c && c.teacherId === currentUser?.id);
  const relevantClasses = teacherClasses.length > 0 ? teacherClasses : safeClasses;

  // Active classroom for teacher view
  const currentClass =
    relevantClasses.find((c) => c.id === selectedClassId) ||
    relevantClasses[0] ||
    safeClasses[0];

  // Student specific resolution
  const studentDetail = studentDetails.find((d) => d.studentId === currentUser?.id);
  const studentClass = safeClasses.find((c) => c.id === studentDetail?.classId);
  const studentTeacher = users.find((u) => u.id === studentClass?.teacherId);

  // Toggle handler for class teacher or admin
  const handleToggleClassMath = (targetClass: SchoolClass) => {
    const nextState = !targetClass.acebeeMathEnabled;
    updateClass(targetClass.id, { acebeeMathEnabled: nextState });
  };

  // If in-game player is active, render game directly in-page!
  if (isPlayingGame) {
    return (
      <div className="space-y-4">
        <AcebeeMathGamePlayer
          onBack={() => setIsPlayingGame(false)}
          userRole={userRole}
          studentClassName={studentClass?.name || currentClass?.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Acebee Hub Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-2xl p-6 text-white shadow-md border border-amber-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-24 pointer-events-none blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-amber-50 text-xs font-mono uppercase tracking-wider font-semibold">
              <Compass className="w-3.5 h-3.5 text-yellow-200" />
              <span>ACEBEE Learning Ecosystem</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight text-white flex items-center gap-2.5">
              <span>Acebee Hub</span>
              <Sparkles className="w-6 h-6 text-yellow-200 fill-yellow-300" />
            </h1>
            <p className="text-xs sm:text-sm text-amber-50 leading-relaxed">
              互动趣味学习中心与启蒙探险游戏平台。包含离线可玩、动手探究数学、触控友好的互动教学模块。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-amber-950/30 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 shadow-inner">
              <Gamepad2 className="w-4 h-4 text-yellow-300" />
              <span>游戏同页运行 • 无需跳转</span>
            </div>
          </div>
        </div>
      </div>

      {/* TEACHER ACCESS CONTROLLER: Class Teacher "Enable" to Student Page */}
      {userRole === 'teacher' && currentClass && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">班级学生访问授权控制 (Class Student Access)</h3>
                <p className="text-xs text-slate-500">
                  作为班主任老师，您可以决定是否对本班学生开放 Acebee Hub 游戏与探险模块。
                </p>
              </div>
            </div>

            {/* Class switcher if teacher has multiple classes */}
            {relevantClasses.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">切换班级:</span>
                <select
                  value={currentClass.id}
                  onChange={(e) => onSelectClassId && onSelectClassId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {relevantClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">{currentClass.name}</span>
                <span className="text-xs text-slate-500">({currentClass.gradeLevel})</span>
                {currentClass.acebeeMathEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    已向本班学生开放
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    学生端已锁定 (仅教师可见)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {currentClass.acebeeMathEnabled
                  ? `本班学生登录后可在左侧导航栏看到 "Acebee Hub" 并畅玩 Acebee 数学冒险。`
                  : `当前该班学生无法在学生主页看到或进入游戏。开启开关即可立即向学生解锁。`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleClassMath(currentClass)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                currentClass.acebeeMathEnabled
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              {currentClass.acebeeMathEnabled ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>锁定 / 关闭学生访问</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>开放给学生端 (Enable to Students)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ADMIN SCHOOL-WIDE CLASSROOM CONTROLLER */}
      {userRole === 'admin' && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">全校班级游戏开放状态管理 (Administrator Hub Control)</h3>
                <p className="text-xs text-slate-500">
                  管理员可随时监督各班级开放状态，或直接为特定班级切换 Acebee Hub 学生端可见性。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  safeClasses.forEach((cls) => {
                    if (!cls.acebeeMathEnabled) updateClass(cls.id, { acebeeMathEnabled: true });
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors"
              >
                一键向全校所有班级开放
              </button>
              <button
                type="button"
                onClick={() => {
                  safeClasses.forEach((cls) => {
                    if (cls.acebeeMathEnabled) updateClass(cls.id, { acebeeMathEnabled: false });
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors"
              >
                全校班级关闭
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {safeClasses.map((cls) => {
              const enrolledCount = studentDetails.filter((d) => d.classId === cls.id).length;
              const teacher = users.find((u) => u.id === cls.teacherId);
              const isEnabled = Boolean(cls.acebeeMathEnabled);
              return (
                <div
                  key={cls.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isEnabled
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{cls.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({cls.gradeLevel})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      班主任: {teacher?.fullName || '未分配'} • {enrolledCount} 名学生
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleClassMath(cls)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                      isEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {isEnabled ? '已开放 ✓' : '已锁定'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDENT NOTICE BANNER */}
      {userRole === 'student' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1 text-xs text-emerald-950">
            <span className="font-bold text-sm block text-emerald-900">
              欢迎来到 Acebee Hub！已获得班主任授权进入
            </span>
            <p className="text-emerald-800 mt-0.5">
              班级: <strong>{studentClass?.name || '本班'}</strong> • 班主任老师: <strong>{studentTeacher?.fullName || '班主任'}</strong>。
              点击下方卡片即可直接在网页内开启数学冒险，收集星星与勋章！
            </p>
          </div>
        </div>
      )}

      {/* 1st CARD: Acebee 数学冒险 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-amber-300 shadow-lg overflow-hidden flex flex-col justify-between relative group hover:border-amber-400 transition-all">
          <div className="p-6 sm:p-7 space-y-5">
            {/* Card Header Tag & Repo Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Card 01 • 精选数学互动游戏</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  即点即玩 • 同页运行
                </span>
              </div>

              {/* GitHub Link reference */}
              <a
                href="https://github.com/Chunhung016/acebeemath"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors border border-slate-200"
                title="查看 GitHub 仓库 (https://github.com/Chunhung016/acebeemath)"
              >
                <Github className="w-3.5 h-3.5 text-slate-900" />
                <span>Chunhung016/acebeemath</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
                  🐝
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                    Acebee 数学冒险
                  </h2>
                  <p className="text-xs font-medium text-amber-800">
                    ACEBEE Math Adventure — 互动儿童算术思维与动手闯关游戏
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                专为儿童设计的沉浸式算术启蒙与数学应用游戏。无需额外登录，全程在当前系统页面内极速流畅运行。通过直观的实物拖拽分组、看图列式、答题训练与混合大闯关，帮助学生真正理解加法、减法、乘法与除法概念。
              </p>
            </div>

            {/* Game Features List */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="text-[11px] font-bold text-amber-900">01. 动手操作</div>
                <div className="text-[10px] text-amber-700 mt-0.5">拖一拖 · 分一分理解算理</div>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
                <div className="text-[11px] font-bold text-sky-900">02. 看图列式</div>
                <div className="text-[10px] text-sky-700 mt-0.5">数一数 · 关联数学算式</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="text-[11px] font-bold text-emerald-900">03. 答题训练场</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">连一连 · 快速思维反馈</div>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80">
                <div className="text-[11px] font-bold text-orange-900">04. 混合大挑战</div>
                <div className="text-[10px] text-orange-700 mt-0.5">闯关卡 · 集星星与升级</div>
              </div>
            </div>
          </div>

          {/* Action Footer Bar */}
          <div className="p-5 sm:p-6 bg-slate-50 border-t border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>本游戏完全内置在学校系统中，无需跳转第三方页面，保持在同页体验。</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPlayingGame(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 shrink-0 group-hover:scale-102"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>进入游戏 (同页运行)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Side Info & Future Modules Teaser */}
        <div className="space-y-4">
          {/* Quick Guide Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">游戏亮点与成就系统</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>触控与拖拽友好：</strong>适合平板、触摸屏或电脑鼠标操作。</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>趣味成就等级：</strong>从数学小探险家升级至数学大师。</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>星星与进度自动保存：</strong>退出后重新进入不丢失星星。</span>
              </li>
            </ul>
          </div>

          {/* Coming Soon Teaser */}
          <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 space-y-2 opacity-80">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
              未来扩展 · 筹备中
            </div>
            <h4 className="text-sm font-bold text-slate-800">Acebee 词汇寻宝与科学工坊</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Acebee Hub 将持续加入更多富有启发性的科学常识与双语互动小游戏，助力学生全方位素养提升。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
