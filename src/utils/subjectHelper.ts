import { AcademicLevel, Subject } from '../types';

/**
 * Returns the exact core subjects based on the academic level.
 * - Year 1 to Year 6 (Primary): 数学, 科学, 华语, Bahasa Melayu, English
 * - Form 1 to Form 3 (Secondary): Mathematics, Science, 华语, Bahasa Melayu, English
 */
export function getSubjectsForLevel(level: AcademicLevel): Subject[] {
  const lvl = String(level).trim();
  
  if (lvl.startsWith('Year')) {
    return ['数学', '科学', '华语', 'Bahasa Melayu', 'English'];
  }
  
  if (lvl.startsWith('Form')) {
    return ['Mathematics', 'Science', '华语', 'Bahasa Melayu', 'English'];
  }
  
  // Default fallback if level doesn't match
  return ['Mathematics', 'Science', '华语', 'Bahasa Melayu', 'English'];
}

/**
 * Returns all unique subjects across both primary and secondary levels.
 */
export const ALL_ACEBEE_SUBJECTS: Subject[] = [
  'Mathematics',
  '数学',
  'Science',
  '科学',
  '华语',
  'Bahasa Melayu',
  'English',
];
