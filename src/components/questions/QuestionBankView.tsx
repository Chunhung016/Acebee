import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuestionBankItem, QuestionType, Subject, QuestionDifficulty } from '../../types';
import { MarkdownBulkImportModal } from './MarkdownBulkImportModal';
import { SingleQuestionModal } from './SingleQuestionModal';
import { ParsedQuestionDraft } from '../../utils/markdownQuestionParser';
import { MathText } from '../common/MathRenderer';
import {
  Search,
  Filter,
  Plus,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckSquare,
  Square,
  Send,
  HelpCircle,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Eye,
  X,
  Tag,
  GraduationCap,
  SlidersHorizontal,
  Calculator,
  Atom,
  Languages,
  Compass,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';

interface QuestionBankViewProps {
  onCreateQuizFromQuestions?: (selectedQuestions: QuestionBankItem[]) => void;
}

type GroupByOption = 'subject' | 'topic' | 'gradeLevel' | 'type' | 'none';
type ViewMode = 'detailed' | 'compact';
type SortOption = 'newest' | 'oldest' | 'points' | 'topic';

const QUESTION_TYPES: { id: QuestionType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'mcq', label: 'MCQ' },
  { id: 'structure', label: 'Structured' },
  { id: 'fill_in_blank', label: 'Fill in Blank' },
  { id: 'matching', label: 'Matching' },
];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ onCreateQuizFromQuestions }) => {
  const { questionBank, saveQuestionBankItem, bulkSaveQuestionBankItems, deleteQuestionBankItem, currentUser } =
    useApp();

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Presentation Mode: Categorized Grouping & View Density
  const [groupBy, setGroupBy] = useState<GroupByOption>('subject');
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Modals state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBankItem | null>(null);

  // Selection for Quiz Creation or Batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Distinct Subject List with counts in bank
  const subjectListWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    questionBank.forEach((q) => {
      map.set(q.subject, (map.get(q.subject) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [questionBank]);

  // Distinct Topic List for the currently active subject
  const availableTopics = useMemo(() => {
    const map = new Map<string, number>();
    questionBank.forEach((q) => {
      if (selectedSubject === 'All' || q.subject === selectedSubject) {
        if (q.topic) {
          map.set(q.topic, (map.get(q.topic) || 0) + 1);
        }
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [questionBank, selectedSubject]);

  // Distinct grade levels in bank
  const gradeLevels = useMemo(() => {
    const set = new Set<string>();
    questionBank.forEach((q) => {
      if (q.gradeLevel) set.add(q.gradeLevel);
    });
    return ['All', ...Array.from(set).sort()];
  }, [questionBank]);

  // Reset topic filter when subject changes
  const handleSelectSubject = (subject: Subject | 'All') => {
    setSelectedSubject(subject);
    setSelectedTopic('All');
  };

  // Filtered & Sorted questions
  const filteredQuestions = useMemo(() => {
    const list = questionBank.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.topic.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));

      const matchesSubject = selectedSubject === 'All' || item.subject === selectedSubject;
      const matchesTopic = selectedTopic === 'All' || item.topic === selectedTopic;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesGrade = selectedGrade === 'All' || item.gradeLevel === selectedGrade;
      const matchesDifficulty =
        selectedDifficulty === 'all' || (item.difficulty || 'medium') === selectedDifficulty;

      return matchesSearch && matchesSubject && matchesTopic && matchesType && matchesGrade && matchesDifficulty;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'points') {
        return (b.points || 1) - (a.points || 1);
      }
      if (sortBy === 'topic') {
        return (a.topic || '').localeCompare(b.topic || '');
      }
      return 0;
    });
  }, [
    questionBank,
    searchQuery,
    selectedSubject,
    selectedTopic,
    selectedType,
    selectedGrade,
    selectedDifficulty,
    sortBy,
  ]);

  // Grouped questions structure
  const groupedQuestions = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupKey: 'All Questions', groupTitle: 'All Questions', items: filteredQuestions }];
    }

    const groupsMap = new Map<string, QuestionBankItem[]>();

    filteredQuestions.forEach((item) => {
      let key = '';
      if (groupBy === 'subject') {
        key = item.subject || 'Uncategorized Subject';
      } else if (groupBy === 'topic') {
        key = item.topic ? `${item.subject} • ${item.topic}` : 'General / Uncategorized';
      } else if (groupBy === 'gradeLevel') {
        key = item.gradeLevel || 'Unspecified Grade';
      } else if (groupBy === 'type') {
        key =
          item.type === 'mcq'
            ? 'Multiple Choice (MCQ)'
            : item.type === 'structure'
            ? 'Structured / Essay'
            : item.type === 'fill_in_blank'
            ? 'Fill-in-the-Blank'
            : 'Matching Pairs';
      }

      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(item);
    });

    return Array.from(groupsMap.entries()).map(([key, items]) => ({
      groupKey: key,
      groupTitle: key,
      items,
    }));
  }, [filteredQuestions, groupBy]);

  // Accordion toggle
  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const expandAllGroups = () => setCollapsedGroups(new Set());
  const collapseAllGroups = () => {
    setCollapsedGroups(new Set(groupedQuestions.map((g) => g.groupKey)));
  };

  // Bulk actions
  const handleBulkImport = async (parsedDrafts: ParsedQuestionDraft[]) => {
    await bulkSaveQuestionBankItems(parsedDrafts);
  };

  const handleSaveSingle = async (
    item: Omit<QuestionBankItem, 'id' | 'createdAt' | 'createdBy' | 'createdByName'> & { id?: string }
  ) => {
    await saveQuestionBankItem(item);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this question from the Question Bank?')) {
      await deleteQuestionBankItem(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (previewQuestion?.id === id) {
        setPreviewQuestion(null);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete all ${selectedIds.size} selected questions from the Question Bank?`
      )
    ) {
      for (const id of Array.from(selectedIds)) {
        await deleteQuestionBankItem(id);
      }
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectGroup = (items: QuestionBankItem[], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allSelected = items.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      items.forEach((i) => {
        if (allSelected) {
          next.delete(i.id);
        } else {
          next.add(i.id);
        }
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const handleCreateQuizFromSelected = () => {
    if (onCreateQuizFromQuestions) {
      const selected = questionBank.filter((q) => selectedIds.has(q.id));
      onCreateQuizFromQuestions(selected);
    }
  };

  // Helper theme lookup
  const getSubjectIconAndColor = (subjectName: string) => {
    const s = subjectName.toLowerCase();
    if (s.includes('math') || s.includes('数')) {
      return { icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
    if (s.includes('sci') || s.includes('科')) {
      return { icon: Atom, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
    if (s.includes('eng') || s.includes('英')) {
      return { icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    }
    if (s.includes('melayu') || s.includes('bm')) {
      return { icon: Languages, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    }
    if (s.includes('hist') || s.includes('geog') || s.includes('历') || s.includes('地')) {
      return { icon: Compass, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
    }
    if (s.includes('art') || s.includes('美')) {
      return { icon: Palette, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200' };
    }
    return { icon: Folder, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">Academic Question Bank</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
                {questionBank.length} Questions
              </span>
              <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {subjectListWithCounts.length} Subjects
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Curated repository organized by subject curriculum, topics, and question formats.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Bulk Markdown Key-In
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingQuestion(null);
              setIsSingleModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Question
          </button>
        </div>
      </div>

      {/* 2. CATEGORY NAVIGATION: SUBJECT TABS RIBBON */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => handleSelectSubject('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedSubject === 'All'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Subjects</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedSubject === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {questionBank.length}
            </span>
          </button>

          <div className="w-[1px] h-6 bg-slate-200 mx-1 shrink-0" />

          {subjectListWithCounts.map(([subj, count]) => {
            const { icon: SubjIcon } = getSubjectIconAndColor(subj);
            const isActive = selectedSubject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => handleSelectSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <SubjIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{subj}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* TOPIC FILTER CHIPS (Visible if subject has multiple topics) */}
        {availableTopics.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 mt-2 border-t border-slate-100 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              Topics:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTopic('All')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedTopic === 'All'
                  ? 'bg-blue-100 text-blue-800 font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Topics
            </button>
            {availableTopics.map(([top, count]) => (
              <button
                key={top}
                type="button"
                onClick={() => setSelectedTopic(top)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  selectedTopic === top
                    ? 'bg-blue-100 text-blue-800 font-bold border border-blue-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                <span>{top}</span>
                <span className="text-[10px] text-slate-400">({count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. TOOLBAR: SEARCH, GROUP BY, VIEW DENSITY & ADVANCED FILTERS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, topics, formulas, or tags..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group By Selector */}
          <div className="md:col-span-3 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap shrink-0">Group By:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="subject">Subject Category</option>
              <option value="topic">Topic / Chapter</option>
              <option value="gradeLevel">Grade Level</option>
              <option value="type">Question Type</option>
              <option value="none">None (Flat List)</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="md:col-span-3 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="newest">Newest Added</option>
              <option value="oldest">Oldest First</option>
              <option value="points">Points (High to Low)</option>
              <option value="topic">Topic (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle & Accordion Expand/Collapse */}
          <div className="md:col-span-2 flex items-center justify-end gap-1.5">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'detailed'
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Detailed Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Compact List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {groupBy !== 'none' && (
              <button
                type="button"
                onClick={collapsedGroups.size > 0 ? expandAllGroups : collapseAllGroups}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                {collapsedGroups.size > 0 ? 'Expand All' : 'Collapse All'}
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Types, Grade, Difficulty & Select All */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Question Format pills */}
            <div className="flex flex-wrap items-center gap-1">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Difficulty:</span>
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                    selectedDifficulty === d
                      ? d === 'easy'
                        ? 'bg-emerald-600 text-white'
                        : d === 'hard'
                        ? 'bg-rose-600 text-white'
                        : d === 'medium'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Grade Level Dropdown */}
            {gradeLevels.length > 2 && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-[11px] font-medium text-slate-500">Grade:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="py-1 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {gradeLevels.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Select all toggle */}
          {filteredQuestions.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              Select All ({selectedIds.size}/{filteredQuestions.length})
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA: CATEGORIZED ACCORDION GROUPS */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {questionBank.length === 0
              ? 'The question bank is currently empty. Use Bulk Markdown Key-In or click New Question to start building your academic curriculum.'
              : 'No questions match the current filter or search criteria. Try selecting All Subjects or clearing search filters.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All');
                setSelectedTopic('All');
                setSelectedType('all');
                setSelectedDifficulty('all');
                setSelectedGrade('All');
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl"
            >
              Bulk Markdown Key-In
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedQuestions.map((group) => {
            const isCollapsed = collapsedGroups.has(group.groupKey);
            const allInGroupSelected =
              group.items.length > 0 && group.items.every((i) => selectedIds.has(i.id));
            const someInGroupSelected =
              group.items.some((i) => selectedIds.has(i.id)) && !allInGroupSelected;

            // Total points in group
            const groupTotalPoints = group.items.reduce((acc, q) => acc + (q.points || 1), 0);

            // Subject theme
            const { icon: GroupIcon, color: groupColor, bg: groupBg, border: groupBorder } =
              getSubjectIconAndColor(group.groupTitle);

            return (
              <div
                key={group.groupKey}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* CATEGORY SECTION HEADER */}
                {groupBy !== 'none' && (
                  <div
                    onClick={() => toggleGroupCollapse(group.groupKey)}
                    className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${groupBg} ${groupBorder} border flex items-center justify-center shrink-0`}
                      >
                        <GroupIcon className={`w-4 h-4 ${groupColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-slate-900">{group.groupTitle}</h2>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                            {group.items.length} {group.items.length === 1 ? 'question' : 'questions'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                            • {groupTotalPoints} {groupTotalPoints === 1 ? 'pt' : 'pts'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      {/* Select All in this Group */}
                      <button
                        type="button"
                        onClick={(e) => handleSelectGroup(group.items, e)}
                        className="text-xs font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        {allInGroupSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : someInGroupSelected ? (
                          <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-600/20 flex items-center justify-center">
                            <div className="w-2 h-0.5 bg-blue-600" />
                          </div>
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="hidden sm:inline">Select Category</span>
                      </button>

                      {/* Collapse / Expand chevron */}
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapse(group.groupKey)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* CATEGORY ITEMS BODY */}
                {!isCollapsed && (
                  <div className="p-4">
                    {viewMode === 'compact' ? (
                      /* COMPACT TABLE/ROW VIEW */
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {group.items.map((q) => {
                          const isSelected = selectedIds.has(q.id);
                          return (
                            <div
                              key={q.id}
                              onClick={() => handleToggleSelect(q.id)}
                              className={`p-3 text-xs flex items-center gap-3 transition-colors cursor-pointer select-none ${
                                isSelected ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50/80'
                              }`}
                            >
                              {/* Checkbox */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleSelect(q.id, e)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300" />
                                  )}
                                </button>
                              </div>

                              {/* Format Pill */}
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                                  q.type === 'mcq'
                                    ? 'bg-blue-100 text-blue-800'
                                    : q.type === 'structure'
                                    ? 'bg-purple-100 text-purple-800'
                                    : q.type === 'fill_in_blank'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {q.type === 'mcq'
                                  ? 'MCQ'
                                  : q.type === 'structure'
                                  ? 'Essay'
                                  : q.type === 'fill_in_blank'
                                  ? 'Blank'
                                  : 'Match'}
                              </span>

                              {/* Difficulty */}
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 border ${
                                  q.difficulty === 'easy'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : q.difficulty === 'hard'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {q.difficulty || 'med'}
                              </span>

                              {/* Topic Badge */}
                              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0 truncate max-w-[140px]">
                                {q.topic || q.subject}
                              </span>

                              {/* Question Preview Text */}
                              <div className="flex-1 truncate font-medium text-slate-800">
                                <MathText text={q.question} />
                              </div>

                              {/* Has Visual Aid */}
                              {q.imageUrl && (
                                <span
                                  className="text-blue-600 bg-blue-50 p-1 rounded shrink-0"
                                  title="Has visual aid"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </span>
                              )}

                              {/* Points */}
                              <span className="font-bold text-slate-700 shrink-0 text-right w-12">
                                {q.points || 1} pt
                              </span>

                              {/* Actions */}
                              <div
                                className="flex items-center gap-1 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => setPreviewQuestion(q)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Quick preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuestion(q);
                                    setIsSingleModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit question"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDelete(q.id, e)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete question"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* DETAILED CARDS VIEW */
                      <div className="grid grid-cols-1 gap-4">
                        {group.items.map((q) => {
                          const isSelected = selectedIds.has(q.id);
                          return (
                            <div
                              key={q.id}
                              onClick={() => handleToggleSelect(q.id)}
                              className={`rounded-2xl p-5 border transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20 bg-blue-50/15'
                                  : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  {/* Checkbox */}
                                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleSelect(q.id, e)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                      ) : (
                                        <Square className="w-5 h-5 text-slate-300" />
                                      )}
                                    </button>
                                  </div>

                                  <div className="space-y-2.5 flex-1">
                                    {/* Categorized Badges Row */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                          q.type === 'mcq'
                                            ? 'bg-blue-100 text-blue-800'
                                            : q.type === 'structure'
                                            ? 'bg-purple-100 text-purple-800'
                                            : q.type === 'fill_in_blank'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {q.type.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                        {q.subject}
                                      </span>
                                      <span
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                          q.difficulty === 'easy'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : q.difficulty === 'hard'
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}
                                      >
                                        {q.difficulty || 'medium'}
                                      </span>
                                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                        {q.gradeLevel}
                                      </span>
                                      <span className="text-xs font-medium text-slate-600">
                                        Topic: <strong className="text-slate-800">{q.topic}</strong>
                                      </span>
                                      <span className="ml-auto text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                        {q.points} {q.points === 1 ? 'pt' : 'pts'}
                                      </span>
                                    </div>

                                    {/* Question Text */}
                                    <div className="text-sm font-semibold text-slate-900 leading-snug">
                                      <MathText text={q.question} inline={false} />
                                    </div>

                                    {/* Question Visual aid */}
                                    {q.imageUrl && (
                                      <div className="my-2 max-w-[260px] rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-1.5 shadow-2xs">
                                        <img
                                          src={q.imageUrl}
                                          alt="Visual aid"
                                          className="max-h-[140px] object-contain rounded-lg"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    )}

                                    {/* MCQ Choices Preview */}
                                    {q.type === 'mcq' && q.options && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        {q.options.map((opt, oIdx) => (
                                          <div
                                            key={oIdx}
                                            className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                                              oIdx === q.correctAnswerIndex
                                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                          >
                                            <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                              {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            <span className="truncate leading-relaxed flex-1">
                                              <MathText text={opt} />
                                            </span>
                                            {oIdx === q.correctAnswerIndex && (
                                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Structured Model Answer Preview */}
                                    {q.type === 'structure' && (
                                      <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                                        {q.modelAnswer && (
                                          <div>
                                            <strong>Model Answer / Scheme:</strong>{' '}
                                            <MathText text={q.modelAnswer} />
                                          </div>
                                        )}
                                        {q.guidelines && (
                                          <p className="text-[11px] text-purple-700">
                                            <strong>Marking Guidelines:</strong> {q.guidelines}
                                          </p>
                                        )}
                                        {q.wordLimit && (
                                          <p className="text-[11px] text-purple-600">
                                            <strong>Word limit:</strong> {q.wordLimit} words
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* Fill-in-the-blank Preview */}
                                    {q.type === 'fill_in_blank' && (
                                      <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-0.5">
                                        <div>
                                          <strong>Acceptable Answers:</strong>{' '}
                                          {q.acceptableAnswers?.join(', ') || 'None specified'}
                                        </div>
                                        {q.caseSensitive && (
                                          <div className="text-[11px] text-emerald-700">
                                            (Strict case sensitivity enforced)
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Matching Pairs Preview */}
                                    {q.type === 'matching' && q.matchingPairs && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                        {q.matchingPairs.map((pair, pIdx) => (
                                          <div
                                            key={pIdx}
                                            className="flex items-center justify-between p-2 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-950"
                                          >
                                            <span className="font-medium">{pair.left}</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-amber-600 mx-2 shrink-0" />
                                            <span className="font-semibold text-amber-800">
                                              {pair.right}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Footer: Tags, Notes & Author Info */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {q.tags &&
                                          q.tags.map((tag, tIdx) => (
                                            <span
                                              key={tIdx}
                                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                                            >
                                              #{tag}
                                            </span>
                                          ))}
                                        {q.explanation && (
                                          <span className="italic text-slate-500 flex items-center gap-1">
                                            Note: <MathText text={q.explanation} />
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        Added by {q.createdByName || 'Staff'} •{' '}
                                        {new Date(q.createdAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Card Action Buttons */}
                                <div
                                  className="flex items-center gap-1 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setPreviewQuestion(q)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Quick Preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingQuestion(q);
                                      setIsSingleModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit question"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDelete(q.id, e)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete question"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. FLOATING BATCH ACTION DOCK (Visible when items selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-full px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white rounded-2xl p-3 px-5 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {selectedIds.size}
              </span>
              <span className="text-xs font-medium text-slate-200">
                {selectedIds.size} {selectedIds.size === 1 ? 'question' : 'questions'} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              {onCreateQuizFromQuestions && (
                <button
                  type="button"
                  onClick={handleCreateQuizFromSelected}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Create Quiz ({selectedIds.size})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. QUICK QUESTION PREVIEW MODAL */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {previewQuestion.type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {previewQuestion.subject}
                </span>
                <span className="text-xs text-slate-500">{previewQuestion.gradeLevel}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Topic: <strong className="text-slate-800">{previewQuestion.topic}</strong></span>
                <span className="font-bold text-slate-800">{previewQuestion.points || 1} pts</span>
              </div>

              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <MathText text={previewQuestion.question} inline={false} />
              </div>

              {previewQuestion.imageUrl && (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-center">
                  <img
                    src={previewQuestion.imageUrl}
                    alt="Visual aid"
                    className="max-h-[220px] object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {previewQuestion.type === 'mcq' && previewQuestion.options && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-600">Answer Options:</span>
                  {previewQuestion.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                        idx === previewQuestion.correctAnswerIndex
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-[11px] font-bold flex items-center justify-center">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1"><MathText text={opt} /></span>
                      {idx === previewQuestion.correctAnswerIndex && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {previewQuestion.type === 'structure' && (
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-2">
                  {previewQuestion.modelAnswer && (
                    <div>
                      <strong>Model Answer / Rubric:</strong>
                      <div className="mt-1 p-2 bg-white/80 rounded-lg text-slate-800">
                        <MathText text={previewQuestion.modelAnswer} />
                      </div>
                    </div>
                  )}
                  {previewQuestion.guidelines && (
                    <p className="text-[11px] text-purple-700">
                      <strong>Marking Guidelines:</strong> {previewQuestion.guidelines}
                    </p>
                  )}
                </div>
              )}

              {previewQuestion.type === 'fill_in_blank' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                  <strong>Acceptable Answers:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {previewQuestion.acceptableAnswers?.map((ans, aIdx) => (
                      <span key={aIdx} className="px-2.5 py-1 bg-white rounded-md font-semibold border border-emerald-200">
                        {ans}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {previewQuestion.type === 'matching' && previewQuestion.matchingPairs && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-600">Matching Pairs:</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {previewQuestion.matchingPairs.map((p, pIdx) => (
                      <div key={pIdx} className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                        <span className="font-medium text-amber-950">{p.left}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-bold text-amber-900">{p.right}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewQuestion.explanation && (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <strong>Explanation:</strong> <MathText text={previewQuestion.explanation} />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created by {previewQuestion.createdByName || 'Staff'} •{' '}
                {new Date(previewQuestion.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const q = previewQuestion;
                    setPreviewQuestion(null);
                    setEditingQuestion(q);
                    setIsSingleModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl"
                >
                  Edit Question
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewQuestion(null)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODALS */}
      <MarkdownBulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
        targetContext="bank"
        defaultSubject={selectedSubject === 'All' ? 'Mathematics' : selectedSubject}
        defaultGrade={selectedGrade === 'All' ? 'Year 5' : selectedGrade}
      />

      <SingleQuestionModal
        isOpen={isSingleModalOpen}
        onClose={() => {
          setIsSingleModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveSingle}
        editingItem={editingQuestion}
        defaultSubject={selectedSubject === 'All' ? 'Mathematics' : selectedSubject}
        defaultGrade={selectedGrade === 'All' ? 'Year 5' : selectedGrade}
      />
    </div>
  );
};

