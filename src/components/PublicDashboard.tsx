import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';
import {
  Megaphone,
  Search,
  Filter,
  Calendar,
  Pin,
  Sparkles,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  X,
  BookOpen,
  Award,
  Users,
  Compass,
  MapPin,
  Phone,
} from 'lucide-react';

export const PublicDashboard: React.FC = () => {
  const { announcements, currentUser, setCurrentView, setIsLoginModalOpen, schoolInfo } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  // Dynamic categories extracted from existing announcements created by admin
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    announcements.forEach((ann) => {
      if (ann.category && ann.category.trim().length > 0) {
        categorySet.add(ann.category.trim());
      }
    });
    const uniqueCats = Array.from(categorySet);
    return uniqueCats.length > 0 ? ['All', ...uniqueCats] : [];
  }, [announcements]);

  // Reset selected category to 'All' if the category is deleted or not available
  useEffect(() => {
    if (selectedCategory !== 'All' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [availableCategories, selectedCategory]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || !selectedCategory || ann.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [announcements, searchQuery, selectedCategory]);

  const pinnedAnnouncements = useMemo(
    () => filteredAnnouncements.filter((a) => a.pinned),
    [filteredAnnouncements]
  );
  const regularAnnouncements = useMemo(
    () => filteredAnnouncements.filter((a) => !a.pinned),
    [filteredAnnouncements]
  );

  const getCategoryBadgeClass = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'academic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sports':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'arts':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'notice':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'general':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] pb-16">
      {/* Welcome Banner */}
      <section className="bg-blue-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-blue-950 shadow-md">
        {/* Subtle decorative geometry */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-white/5 rounded-full -mb-32 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                {schoolInfo.name || 'ACEBEE'} Official Bulletin & Campus News
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {schoolInfo.name ? (
                  <>
                    <span>{schoolInfo.name}</span>
                    <span className="block text-2xl sm:text-3xl font-bold text-blue-200 mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                      Academic Rigor & Character
                    </span>
                  </>
                ) : (
                  <>
                    Academic Rigor,{' '}
                    <span className="text-blue-200">Global Character</span>
                  </>
                )}
              </h1>
              {schoolInfo.description && (
                <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                  {schoolInfo.description}
                </p>
              )}

              {(schoolInfo.address || schoolInfo.schoolNumber) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-blue-200 pt-1">
                  {schoolInfo.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-300" />
                      {schoolInfo.address}
                    </span>
                  )}
                  {schoolInfo.schoolNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-300" />
                      {schoolInfo.schoolNumber}
                    </span>
                  )}
                </div>
              )}

              {/* Quick Action Links */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {currentUser ? (
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-6 py-2.5 rounded-lg bg-white hover:bg-blue-50 text-blue-900 font-bold text-sm shadow-md transition-all flex items-center gap-2"
                    id="public-hero-dashboard-btn"
                  >
                    <span>Open {currentUser.role.toUpperCase()} Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-blue-900" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-6 py-2.5 rounded-lg bg-white hover:bg-blue-50 text-blue-900 font-bold text-sm shadow-md transition-all flex items-center gap-2"
                    id="public-hero-login-btn"
                  >
                    <span>Staff & Student Portal Login</span>
                    <ArrowRight className="w-4 h-4 text-blue-900" />
                  </button>
                )}

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-5 py-2.5 rounded-lg bg-blue-800/90 hover:bg-blue-700 text-white font-semibold text-sm border border-blue-700 transition-all flex items-center gap-2"
                    id="admin-quick-post-btn"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-300" />
                    <span>Post New Announcement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stats / Quick Info Card */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-800/60 text-blue-200 flex items-center justify-center mb-2 font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">5 Core</div>
                <div className="text-xs text-blue-200 font-medium">Integrated Subjects</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-800/60 text-blue-200 flex items-center justify-center mb-2 font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">100%</div>
                <div className="text-xs text-blue-200 font-medium">Supervised Quizzing</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-800/60 text-blue-200 flex items-center justify-center mb-2 font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">Direct</div>
                <div className="text-xs text-blue-200 font-medium">Parent-Teacher Link</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-800/80 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-800/60 text-blue-200 flex items-center justify-center mb-2 font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold text-white">Role-Based</div>
                <div className="text-xs text-blue-200 font-medium">Strict Auth Governance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Feed Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements, topics..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 text-slate-900"
                id="search-announcements-input"
              />
            </div>

            {/* Category Pills - only appears when admin has created announcements with categories */}
            {availableCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mr-1 shrink-0 uppercase tracking-wider text-[11px]">
                  <Filter className="w-3.5 h-3.5 text-blue-600" /> Category:
                </span>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                    id={`cat-filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Masonry-Style Feed */}
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Announcements Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search keywords or category filters to view campus updates.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Announcements Section */}
            {pinnedAnnouncements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Pin className="w-4 h-4 text-blue-600 fill-blue-600" />
                    Featured & Pinned Highlights
                  </h2>
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-mono ml-auto">
                    {pinnedAnnouncements.length} High Priority
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pinnedAnnouncements.map((ann) => (
                    <article
                      key={ann.id}
                      onClick={() => setActiveAnnouncement(ann)}
                      className="group bg-white rounded-xl border border-blue-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
                      id={`pinned-announcement-${ann.id}`}
                    >
                      {ann.imageUrl && (
                        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-100">
                          <img
                            src={ann.imageUrl}
                            alt={ann.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-blue-900 text-white text-xs font-bold shadow-xs flex items-center gap-1 border border-blue-700">
                              <Pin className="w-3 h-3 fill-white" />
                              {ann.badge || 'Featured'}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                                ann.category
                              )}`}
                            >
                              {ann.category}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {!ann.imageUrl && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-900 text-white text-xs font-bold flex items-center gap-1">
                                <Pin className="w-3 h-3 fill-white" />
                                {ann.badge || 'Featured'}
                              </span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                                  ann.category
                                )}`}
                              >
                                {ann.category}
                              </span>
                            </div>
                          )}
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-2">
                            {ann.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                            {ann.content}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(ann.createdAt)}
                          </span>
                          <span className="text-blue-700 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Read Notice <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Grid Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0" />
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-600" />
                  Campus News & Announcements
                </h2>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono ml-auto">
                  {regularAnnouncements.length} Articles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularAnnouncements.map((ann) => (
                  <article
                    key={ann.id}
                    onClick={() => setActiveAnnouncement(ann)}
                    className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
                    id={`announcement-card-${ann.id}`}
                  >
                    {ann.imageUrl && (
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        <img
                          src={ann.imageUrl}
                          alt={ann.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md border shadow-xs ${getCategoryBadgeClass(
                              ann.category
                            )}`}
                          >
                            {ann.category}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {!ann.imageUrl && (
                          <div className="mb-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                                ann.category
                              )}`}
                            >
                              {ann.category}
                            </span>
                          </div>
                        )}
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-2">
                          {ann.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                          {ann.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(ann.createdAt)}
                        </span>
                        <span className="text-blue-700 font-semibold group-hover:text-blue-900 flex items-center gap-1">
                          Details <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Announcement Lightbox / Full Detail Modal */}
      {activeAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            id="announcement-detail-modal"
          >
            {/* Modal Header */}
            <div className="relative">
              {activeAnnouncement.imageUrl ? (
                <div className="h-64 w-full relative bg-slate-900">
                  <img
                    src={activeAnnouncement.imageUrl}
                    alt={activeAnnouncement.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <button
                    onClick={() => setActiveAnnouncement(null)}
                    className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getCategoryBadgeClass(
                        activeAnnouncement.category
                      )}`}
                    >
                      {activeAnnouncement.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
                      {activeAnnouncement.title}
                    </h2>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-blue-900 text-white flex items-start justify-between">
                  <div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getCategoryBadgeClass(
                        activeAnnouncement.category
                      )}`}
                    >
                      {activeAnnouncement.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
                      {activeAnnouncement.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveAnnouncement(null)}
                    className="text-blue-200 hover:text-white p-1 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Published: {formatDate(activeAnnouncement.createdAt)}
                </span>
                {activeAnnouncement.pinned && (
                  <span className="flex items-center gap-1 text-blue-700 font-semibold">
                    <Pin className="w-3.5 h-3.5 fill-blue-700" />
                    Pinned Notice
                  </span>
                )}
              </div>

              <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {activeAnnouncement.content}
              </div>

              {activeAnnouncement.imageUrl && (
                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 break-all">
                    Direct Image Source: <span className="font-mono text-slate-600">{activeAnnouncement.imageUrl}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Acebee Official Communication Hub</span>
              <button
                onClick={() => setActiveAnnouncement(null)}
                className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
