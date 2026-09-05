import { GradingRubricPreset } from '../types';

export const DEFAULT_RUBRIC_PRESETS: GradingRubricPreset[] = [
  {
    id: 'rubric-mastery',
    title: 'Full Mastery & Clear Evidence (5 Pts)',
    points: 5,
    criteria: 'Comprehensive understanding, well-supported arguments, and flawless calculation/reasoning.',
    feedbackTemplate: 'Exceptional response! Demonstrates thorough conceptual grasp and coherent supporting details.',
  },
  {
    id: 'rubric-competent',
    title: 'Good Understanding with Minor Flaws (4 Pts)',
    points: 4,
    criteria: 'Solid grasp of core ideas with minor oversights in reasoning or elaboration.',
    feedbackTemplate: 'Good work. The main premise is solid, though one minor calculation/detail needs refining.',
  },
  {
    id: 'rubric-partial',
    title: 'Partial Understanding (2.5 - 3 Pts)',
    points: 3,
    criteria: 'Identifies basic ideas but misses key linkages, units, or critical explanations.',
    feedbackTemplate: 'Partial credit awarded. Make sure to define key terminology and include all working steps.',
  },
  {
    id: 'rubric-emerging',
    title: 'Emerging Understanding (1 - 2 Pts)',
    points: 1.5,
    criteria: 'Attempted answer but shows significant misconceptions or insufficient depth.',
    feedbackTemplate: 'Needs further revision. Review the recommended chapter notes and attempt practice problems.',
  },
  {
    id: 'rubric-language',
    title: 'Grammar, Structure & Presentation (3 Pts)',
    points: 3,
    criteria: 'Clear syntax, proper paragraphing, and accurate terminology.',
    feedbackTemplate: 'Well-structured prose and clear terminology used throughout.',
  },
];

export const QUICK_FEEDBACK_TAGS: string[] = [
  '🌟 Outstanding reasoning and clarity!',
  '✅ Accurate steps and well-supported answer.',
  '💡 Good attempt! Double check the formula/units.',
  '⚠️ Needs more elaboration on the key concepts.',
  '✍️ Well organized with clear scientific terminology.',
  '📌 Please review class notes on this topic.',
  '👏 Great progress shown in this attempt!',
  '🔍 Watch out for subtle calculation details.',
];
