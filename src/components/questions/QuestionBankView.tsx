import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { QuestionBankItem, QuestionType, Subject, QuestionDifficulty } from '../../types';
import { MarkdownBulkImportModal } from './MarkdownBulkImportModal';
import { SingleQuestionModal } from './SingleQuestionModal';
import { ParsedQuestionDraft } from '../../utils/markdownQuestionParser';
import { MathText } from '../common/MathRenderer';
import { removeDollarDelimiters } from '../../utils/mathParser';
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  ArrowRight,
  BookOpen,
  CheckSquare,
  Square,
  Send,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Eye,
  X,
  Tag,
  Calculator,
  Atom,
  Languages,
  Compass,
  Palette,
  Image as ImageIcon,
  ArrowLeft,
  Filter,
} from 'lucide-react';

interface QuestionBankViewProps {
  onCreateQuizFromQuestions?: (selectedQuestions: QuestionBankItem[]) => void;
}

type PresentationMode = 'decks' | 'accordions' | 'all';
type GroupByOption = 'subject' | 'topic' | 'gradeLevel' | 'type' | 'none';
type ViewDensity = 'detailed' | 'compact';
type SortOption = 'newest' | 'oldest' | 'points' | 'topic';

const QUESTION_TYPES: { id: QuestionType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Types' },
  { id: 'mcq', label: 'MCQ' },
  { id: 'structure', label: 'Structured' },
  { id: 'fill_in_blank', label: 'Fill in Blank' },
  { id: 'matching', label: 'Matching' },
];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ onCreateQuizFromQuestions }) => {
  const { questionBank, saveQuestionBankItem, bulkSaveQuestionBankItems, deleteQuestionBankItem } =
    useApp();

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Presentation Mode: Topic Decks (default) vs Chapter Accordions vs All Questions
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('decks');
  const [activeDeckTopic, setActiveDeckTopic] = useState<{ subject: Subject | string; topic: string } | null>(null);

  // Grouping for Accordions & All Questions
  const [groupBy, setGroupBy] = useState<GroupByOption>('subject');
  const [viewDensity, setViewDensity] = useState<ViewDensity>('detailed');
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
    setActiveDeckTopic(null);
  };

  // Helper theme lookup
  const getSubjectTheme = (subjectName: string) => {
    const s = (subjectName || '').toLowerCase();
    if (s.includes('math') || s.includes('数')) {
      return { icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-600 to-indigo-600' };
    }
    if (s.includes('sci') || s.includes('科')) {
      return { icon: Atom, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-600 to-teal-600' };
    }
    if (s.includes('eng') || s.includes('英')) {
      return { icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', gradient: 'from-indigo-600 to-purple-600' };
    }
    if (s.includes('melayu') || s.includes('bm')) {
      return { icon: Languages, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-600 to-orange-600' };
    }
    if (s.includes('hist') || s.includes('geog') || s.includes('历') || s.includes('地')) {
      return { icon: Compass, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', gradient: 'from-rose-600 to-pink-600' };
    }
    if (s.includes('art') || s.includes('美')) {
      return { icon: Palette, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', gradient: 'from-fuchsia-600 to-pink-600' };
    }
    return { icon: Folder, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', gradient: 'from-slate-600 to-slate-800' };
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
      const matchesTopic =
        activeDeckTopic
          ? item.subject === activeDeckTopic.subject && item.topic === activeDeckTopic.topic
          : selectedTopic === 'All' || item.topic === selectedTopic;
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
    activeDeckTopic,
    selectedType,
    selectedGrade,
    selectedDifficulty,
    sortBy,
  ]);

  // Topic Decks Grouping for Deck Presentation Mode
  const topicDecks = useMemo(() => {
    const map = new Map<string, {
      deckKey: string;
      subject: Subject;
      topic: string;
      gradeLevels: Set<string>;
      items: QuestionBankItem[];
      totalPoints: number;
      typeBreakdown: { mcq: number; structure: number; fill_in_blank: number; matching: number };
      difficultyBreakdown: { easy: number; medium: number; hard: number };
    }>();

    questionBank.forEach((item) => {
      if (selectedSubject !== 'All' && item.subject !== selectedSubject) return;

      const query = searchQuery.trim().toLowerCase();
      if (query && !item.topic.toLowerCase().includes(query) && !item.question.toLowerCase().includes(query) && !item.subject.toLowerCase().includes(query)) {
        return;
      }

      if (selectedGrade !== 'All' && item.gradeLevel !== selectedGrade) return;
      if (selectedType !== 'all' && item.type !== selectedType) return;
      if (selectedDifficulty !== 'all' && (item.difficulty || 'medium') !== selectedDifficulty) return;

      const key = `${item.subject}:::${item.topic || 'General'}`;
      if (!map.has(key)) {
        map.set(key, {
          deckKey: key,
          subject: item.subject,
          topic: item.topic || 'General',
          gradeLevels: new Set(),
          items: [],
          totalPoints: 0,
          typeBreakdown: { mcq: 0, structure: 0, fill_in_blank: 0, matching: 0 },
          difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
        });
      }

      const deck = map.get(key)!;
      deck.items.push(item);
      if (item.gradeLevel) deck.gradeLevels.add(item.gradeLevel);
      deck.totalPoints += item.points || 1;

      if (item.type in deck.typeBreakdown) {
        deck.typeBreakdown[item.type as keyof typeof deck.typeBreakdown]++;
      }
      const diff = item.difficulty || 'medium';
      if (diff in deck.difficultyBreakdown) {
        deck.difficultyBreakdown[diff as keyof typeof deck.difficultyBreakdown]++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [questionBank, selectedSubject, searchQuery, selectedGrade, selectedType, selectedDifficulty]);

  // Grouped questions structure for Accordion View
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

  return (
    <div className="space-y-6 pb-24">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Academic Question Bank</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
                {questionBank.length} Questions
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hidden sm:inline-block">
                {subjectListWithCounts.length} Subjects
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Curated repository organized into neat curriculum topic decks and chapter modules.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 sm:px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
            id="bank-bulk-import-btn"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Bulk Key-In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingQuestion(null);
              setIsSingleModalOpen(true);
            }}
            className="px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs shadow-blue-500/20 cursor-pointer"
            id="bank-new-question-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Question</span>
          </button>
        </div>
      </div>

      {/* 2. PRESENTATION MODE SWITCHER & SUBJECT NAVIGATION */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-3">
        {/* View Mode Switcher: Topic Decks vs Chapter Sections vs All Questions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setPresentationMode('decks');
                setActiveDeckTopic(null);
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                presentationMode === 'decks'
                  ? 'bg-white text-blue-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="presentation-decks-tab"
            >
              <Folder className="w-3.5 h-3.5 text-blue-600" />
              <span>Topic Decks</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700">
                {topicDecks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPresentationMode('accordions');
                setActiveDeckTopic(null);
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                presentationMode === 'accordions'
                  ? 'bg-white text-blue-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="presentation-accordions-tab"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chapter Sections</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPresentationMode('all');
                setActiveDeckTopic(null);
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                presentationMode === 'all'
                  ? 'bg-white text-blue-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="presentation-all-tab"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Questions</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {questionBank.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {presentationMode === 'decks' ? (
              <span>Organized into neat topic folders to prevent clutter.</span>
            ) : presentationMode === 'accordions' ? (
              <span>Collapsible chapter blocks by subject and grade.</span>
            ) : (
              <span>Full searchable repository catalog.</span>
            )}
          </div>
        </div>

        {/* Subject Tabs Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleSelectSubject('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedSubject === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Subjects</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedSubject === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {questionBank.length}
            </span>
          </button>

          <div className="w-[1px] h-5 bg-slate-200 mx-1 shrink-0" />

          {subjectListWithCounts.map(([subj, count]) => {
            const { icon: SubjIcon } = getSubjectTheme(subj);
            const isActive = selectedSubject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => handleSelectSubject(subj as Subject)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
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
      </div>

      {/* 3. TOOLBAR: SEARCH & SECONDARY FILTERS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, topics, or keywords..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              id="bank-search-input"
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

          {/* Question Format Filter */}
          <div className="md:col-span-4 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  selectedType === t.id
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Difficulty Filter */}
          <div className="md:col-span-2 flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">Diff:</span>
            <div className="flex items-center gap-1">
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
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
          </div>

          {/* View density / Expand toggle */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            {presentationMode !== 'decks' && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewDensity('detailed')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewDensity === 'detailed'
                      ? 'bg-white text-blue-600 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Detailed Cards"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewDensity('compact')}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    viewDensity === 'compact'
                      ? 'bg-white text-blue-600 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Compact List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {presentationMode === 'accordions' && (
              <button
                type="button"
                onClick={collapsedGroups.size > 0 ? expandAllGroups : collapseAllGroups}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg whitespace-nowrap cursor-pointer"
              >
                {collapsedGroups.size > 0 ? 'Expand All' : 'Collapse All'}
              </button>
            )}
          </div>
        </div>

        {/* Active Breadcrumb Header when Drilled down into a Topic Deck */}
        {activeDeckTopic && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveDeckTopic(null)}
                className="p-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1 text-xs font-semibold shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Decks</span>
              </button>
              <div className="text-xs">
                <span className="text-slate-500">{activeDeckTopic.subject} &gt;</span>{' '}
                <strong className="text-slate-900 font-bold">{activeDeckTopic.topic}</strong>{' '}
                <span className="text-blue-700 font-medium">({filteredQuestions.length} Questions)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 px-2 py-1 rounded bg-white border border-blue-200"
            >
              {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0
                ? 'Deselect All'
                : `Select All (${filteredQuestions.length})`}
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN PRESENTATION VIEWS */}

      {/* MODE A: CURRICULUM TOPIC DECKS (Categorized High-Level View) */}
      {presentationMode === 'decks' && !activeDeckTopic && (
        <div className="space-y-4">
          {topicDecks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No topic decks found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No questions match the current filter or search criteria. Try switching subjects or clearing search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject('All');
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedDifficulty('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicDecks.map((deck) => {
                const { icon: DeckIcon, color: deckColor, bg: deckBg, border: deckBorder } = getSubjectTheme(deck.subject);
                const allSelected = deck.items.every((i) => selectedIds.has(i.id));

                return (
                  <div
                    key={deck.deckKey}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Deck Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-10 h-10 rounded-xl ${deckBg} ${deckBorder} border flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            <DeckIcon className={`w-5 h-5 ${deckColor}`} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {deck.subject}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {deck.topic}
                            </h3>
                          </div>
                        </div>

                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                          {deck.items.length} {deck.items.length === 1 ? 'Q' : 'Qs'}
                        </span>
                      </div>

                      {/* Question Format Breakdown Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                        {deck.typeBreakdown.mcq > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                            {deck.typeBreakdown.mcq} MCQ
                          </span>
                        )}
                        {deck.typeBreakdown.structure > 0 && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                            {deck.typeBreakdown.structure} Essay
                          </span>
                        )}
                        {deck.typeBreakdown.fill_in_blank > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                            {deck.typeBreakdown.fill_in_blank} Blank
                          </span>
                        )}
                        {deck.typeBreakdown.matching > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                            {deck.typeBreakdown.matching} Match
                          </span>
                        )}
                      </div>

                      {/* Difficulty Pills */}
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 mb-4">
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {deck.difficultyBreakdown.easy} Easy
                        </span>
                        <span>•</span>
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                          {deck.difficultyBreakdown.medium} Med
                        </span>
                        <span>•</span>
                        <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                          {deck.difficultyBreakdown.hard} Hard
                        </span>
                        <span className="ml-auto text-slate-600 font-bold">
                          {deck.totalPoints} pts
                        </span>
                      </div>
                    </div>

                    {/* Deck Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleSelectGroup(deck.items, e)}
                        className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span>Select All</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDeckTopic({ subject: deck.subject, topic: deck.topic })}
                        className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex items-center gap-1.5 shadow-2xs group-hover:bg-blue-600 group-hover:text-white"
                      >
                        <span>Open Topic</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODE B: TOPIC DRILLDOWN OR CHAPTER ACCORDIONS OR ALL QUESTIONS */}
      {(presentationMode !== 'decks' || activeDeckTopic) && (
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No questions match the current criteria.
              </p>
              {activeDeckTopic && (
                <button
                  type="button"
                  onClick={() => setActiveDeckTopic(null)}
                  className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl"
                >
                  Return to All Topic Decks
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedQuestions.map((group) => {
                const isCollapsed = collapsedGroups.has(group.groupKey);
                const allInGroupSelected =
                  group.items.length > 0 && group.items.every((i) => selectedIds.has(i.id));
                const someInGroupSelected =
                  group.items.some((i) => selectedIds.has(i.id)) && !allInGroupSelected;

                const groupTotalPoints = group.items.reduce((acc, q) => acc + (q.points || 1), 0);
                const { icon: GroupIcon, color: groupColor, bg: groupBg, border: groupBorder } =
                  getSubjectTheme(group.groupTitle);

                return (
                  <div
                    key={group.groupKey}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                  >
                    {/* ACCORDION HEADER (If not single topic drilldown or if in accordion mode) */}
                    {(!activeDeckTopic && presentationMode === 'accordions') && (
                      <div
                        onClick={() => toggleGroupCollapse(group.groupKey)}
                        className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
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
                            <span className="hidden sm:inline">Select Section</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleGroupCollapse(group.groupKey)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ITEMS LIST */}
                    {(!isCollapsed || activeDeckTopic || presentationMode === 'all') && (
                      <div className="p-3 sm:p-4">
                        {viewDensity === 'compact' ? (
                          /* COMPACT TABLE VIEW */
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
                                    {q.type.replace(/_/g, ' ')}
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
                                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0 truncate max-w-[130px]">
                                    {q.topic || q.subject}
                                  </span>

                                  {/* Question Preview Text */}
                                  <div className="flex-1 truncate font-medium text-slate-800">
                                    <MathText text={removeDollarDelimiters(q.question)} />
                                  </div>

                                  {/* Has Visual Aid */}
                                  {q.imageUrl && (
                                    <span className="text-blue-600 bg-blue-50 p-1 rounded shrink-0">
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
                          <div className="grid grid-cols-1 gap-3.5">
                            {group.items.map((q) => {
                              const isSelected = selectedIds.has(q.id);
                              return (
                                <div
                                  key={q.id}
                                  onClick={() => handleToggleSelect(q.id)}
                                  className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer select-none ${
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
                                        {/* Badges Row */}
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

                                        {/* Question Text with Math rendering and stripped $ */}
                                        <div className="text-sm font-semibold text-slate-900 leading-snug">
                                          <MathText text={removeDollarDelimiters(q.question)} inline={false} />
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
                                                  <MathText text={removeDollarDelimiters(opt)} />
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
                                                <MathText text={removeDollarDelimiters(q.modelAnswer)} />
                                              </div>
                                            )}
                                            {q.guidelines && (
                                              <p className="text-[11px] text-purple-700">
                                                <strong>Marking Guidelines:</strong> {removeDollarDelimiters(q.guidelines)}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {/* Fill-in-the-blank Preview */}
                                        {q.type === 'fill_in_blank' && (
                                          <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-0.5">
                                            <div>
                                              <strong>Acceptable Answers:</strong>{' '}
                                              {q.acceptableAnswers?.map(removeDollarDelimiters).join(', ') || 'None'}
                                            </div>
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
                                                <span className="font-medium">
                                                  <MathText text={removeDollarDelimiters(pair.left)} />
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 text-amber-600 mx-2 shrink-0" />
                                                <span className="font-semibold text-amber-800">
                                                  <MathText text={removeDollarDelimiters(pair.right)} />
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Footer info */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            {q.tags?.map((tag, tIdx) => (
                                              <span
                                                key={tIdx}
                                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                                              >
                                                #{tag}
                                              </span>
                                            ))}
                                            {q.explanation && (
                                              <span className="italic text-slate-500 flex items-center gap-1">
                                                Note: <MathText text={removeDollarDelimiters(q.explanation)} />
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

                                    {/* Action Buttons */}
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
        </div>
      )}

      {/* 5. FLOATING BATCH ACTION DOCK */}
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
                  id="bank-create-quiz-selected-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Create Quiz ({selectedIds.size})</span>
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
                <span>
                  Topic: <strong className="text-slate-800">{previewQuestion.topic}</strong>
                </span>
                <span className="font-bold text-slate-800">{previewQuestion.points || 1} pts</span>
              </div>

              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <MathText text={removeDollarDelimiters(previewQuestion.question)} inline={false} />
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
                      <span className="flex-1">
                        <MathText text={removeDollarDelimiters(opt)} />
                      </span>
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
                        <MathText text={removeDollarDelimiters(previewQuestion.modelAnswer)} />
                      </div>
                    </div>
                  )}
                  {previewQuestion.guidelines && (
                    <p className="text-[11px] text-purple-700">
                      <strong>Marking Guidelines:</strong> {removeDollarDelimiters(previewQuestion.guidelines)}
                    </p>
                  )}
                </div>
              )}

              {previewQuestion.type === 'fill_in_blank' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                  <strong>Acceptable Answers:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {previewQuestion.acceptableAnswers?.map((ans, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2.5 py-1 bg-white rounded-md font-semibold border border-emerald-200"
                      >
                        {removeDollarDelimiters(ans)}
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
                      <div
                        key={pIdx}
                        className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-center justify-between"
                      >
                        <span className="font-medium text-amber-950">
                          <MathText text={removeDollarDelimiters(p.left)} />
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-bold text-amber-900">
                          <MathText text={removeDollarDelimiters(p.right)} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewQuestion.explanation && (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <strong>Explanation:</strong>{' '}
                  <MathText text={removeDollarDelimiters(previewQuestion.explanation)} />
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
