import { QuestionType, Subject, QuestionDifficulty } from '../types';
import { ALL_ACEBEE_SUBJECTS } from './subjectHelper';
import { removeDollarDelimiters } from './mathParser';

export interface ParsedQuestionDraft {
  type: QuestionType;
  difficulty?: QuestionDifficulty;
  question: string;
  points: number;
  subject: Subject;
  gradeLevel: string;
  topic: string;
  imageUrl?: string;
  options?: string[];
  correctAnswerIndex?: number;
  modelAnswer?: string;
  guidelines?: string;
  acceptableAnswers?: string[];
  caseSensitive?: boolean;
  matchingPairs?: Array<{ id: string; left: string; right: string }>;
  explanation?: string;
}

export interface ParseResult {
  questions: ParsedQuestionDraft[];
  errors: string[];
}

const DEFAULT_SUBJECT: Subject = 'Mathematics';
const DEFAULT_GRADE = 'Year 5';

const KNOWN_SUBJECTS: string[] = [
  ...ALL_ACEBEE_SUBJECTS,
  'Social Studies',
  'Art & Technology',
  'History',
  'Geography',
];

export function parseMarkdownQuestions(
  markdownText: string,
  fallbackSubject: Subject = DEFAULT_SUBJECT,
  fallbackGrade: string = DEFAULT_GRADE
): ParseResult {
  const result: ParseResult = {
    questions: [],
    errors: [],
  };

  if (!markdownText || !markdownText.trim()) {
    return result;
  }

  // Normalize line endings
  const cleanText = markdownText.replace(/\r\n/g, '\n').trim();

  // Split question blocks flexibly by header markers (###, ##, #), divider lines (---, ===), or question numbering (1., 2), Q1, Question 1)
  const rawBlocks = cleanText
    .split(/\n+(?=(?:#{1,4}\s+|[-=_]{3,}|\b\d+[\.\)]\s+|(?:Q|Question)\s*\d+[\.\:\)]?|(?:MCQ|Structure|Structured|FillInBlank|Fill-in-the-blank|Blank|Matching|Match)\b))/gi)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  rawBlocks.forEach((block, index) => {
    try {
      // If block starts with a divider like --- or ===, strip it
      const processedBlock = block.replace(/^[-=_]{3,}\n?/, '').trim();
      if (!processedBlock) return;

      const lines = processedBlock.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) return;

      let type: QuestionType = 'mcq';
      let subject: Subject = fallbackSubject;
      let gradeLevel = fallbackGrade;
      let topic = 'General';
      let difficulty: QuestionDifficulty = 'medium';
      let points = 1;
      let imageUrl: string | undefined = undefined;
      let explanation = '';
      let modelAnswer = '';
      let guidelines = '';
      let acceptableAnswers: string[] = [];
      let caseSensitive = false;
      const options: string[] = [];
      let correctAnswerIndex = 0;
      const matchingPairs: Array<{ id: string; left: string; right: string }> = [];

      let questionLines: string[] = [];

      // Inspect first line / header
      const firstLine = lines[0];
      const headerMatch = firstLine.match(
        /^(?:#{1,4}|\d+[\.\)]|\*{1,2})?\s*(MCQ|Structure|Structured|FillInBlank|Fill in blank|Fill-in-the-blank|Blank|Matching|Match|Q\d+|Question\d*)\b(.*)$/i
      );

      let startIndex = 0;
      if (headerMatch) {
        startIndex = 1;
        const rawType = headerMatch[1].toLowerCase();
        if (rawType.includes('mcq')) type = 'mcq';
        else if (rawType.includes('struct')) type = 'structure';
        else if (rawType.includes('fill') || rawType.includes('blank')) type = 'fill_in_blank';
        else if (rawType.includes('match')) type = 'matching';

        const metadataPart = headerMatch[2];
        if (metadataPart) {
          const parts = metadataPart.split(/[\s|,:]+/).map((p) => p.trim()).filter(Boolean);
          const pipeParts = metadataPart.includes('|')
            ? metadataPart.split('|').map((p) => p.trim()).filter(Boolean)
            : parts;

          pipeParts.forEach((p) => {
            const numMatch = p.match(/^(\d+)\s*(?:pts?|points?|marks?)/i);
            if (numMatch) {
              points = parseInt(numMatch[1], 10);
            } else if (KNOWN_SUBJECTS.some((s) => s.toLowerCase() === p.toLowerCase())) {
              const matchedSubj = KNOWN_SUBJECTS.find((s) => s.toLowerCase() === p.toLowerCase());
              if (matchedSubj) subject = matchedSubj as Subject;
            } else if (/^(?:Year|Grade|Form|Standard)\s*\d+/i.test(p) || /^(?:Form|Year|Standard)\d+/i.test(p)) {
              gradeLevel = p;
            } else if (['easy', 'medium', 'hard'].includes(p.toLowerCase())) {
              difficulty = p.toLowerCase() as QuestionDifficulty;
            } else if (p.length > 0 && !p.startsWith('#')) {
              topic = p;
            }
          });
        }
      } else {
        // If there is no explicit header, the first line is the question text!
        // Check if it starts with numbering like "1. ", "1) ", "Q1: " and strip it from the prompt
        const numPrefixMatch = firstLine.match(/^(?:\d+[\.\)]|(?:Q|Question)\s*\d+[\.\:\)]?)\s*(.+)$/i);
        if (numPrefixMatch) {
          startIndex = 1;
          questionLines.push(numPrefixMatch[1].trim());
        }
      }

      // Process subsequent lines
      for (let i = startIndex; i < lines.length; i++) {
        let line = lines[i];

        // Direct metadata tags
        if (/^type\s*:/i.test(line)) {
          const t = line.replace(/^type\s*:/i, '').trim().toLowerCase();
          if (t.includes('mcq')) type = 'mcq';
          else if (t.includes('struct')) type = 'structure';
          else if (t.includes('fill') || t.includes('blank')) type = 'fill_in_blank';
          else if (t.includes('match')) type = 'matching';
          continue;
        }

        if (/^(?:difficulty|level)\s*:/i.test(line)) {
          const diffStr = line.replace(/^(?:difficulty|level)\s*:/i, '').trim().toLowerCase();
          if (diffStr === 'easy' || diffStr === 'hard') difficulty = diffStr;
          else difficulty = 'medium';
          continue;
        }

        if (/^(?:subject)\s*:/i.test(line)) {
          const s = line.replace(/^subject\s*:/i, '').trim();
          if (s) subject = s as Subject;
          continue;
        }

        if (/^(?:grade|level|gradelevel)\s*:/i.test(line)) {
          gradeLevel = line.replace(/^(?:grade|level|gradelevel)\s*:/i, '').trim();
          continue;
        }

        if (/^(?:topic)\s*:/i.test(line)) {
          topic = line.replace(/^topic\s*:/i, '').trim();
          continue;
        }

        if (/^(?:points?|marks?)\s*:/i.test(line)) {
          const p = parseInt(line.replace(/^(?:points?|marks?)\s*:/i, '').trim(), 10);
          if (!isNaN(p) && p > 0) points = p;
          continue;
        }

        // Image tag or markdown image syntax
        if (/^(?:image|img|imageurl|photo|picture)\s*:\s*(.+)$/i.test(line)) {
          imageUrl = line.replace(/^(?:image|img|imageurl|photo|picture)\s*:\s*/i, '').trim();
          continue;
        }

        const inlineImgMatch = line.match(/!\[.*?\]\((https?:\/\/[^\s\)]+|\/api[^\s\)]+|data:image[^\s\)]+)\)/i);
        if (inlineImgMatch) {
          imageUrl = inlineImgMatch[1];
          line = line.replace(/!\[.*?\]\((https?:\/\/[^\s\)]+|\/api[^\s\)]+|data:image[^\s\)]+)\)/i, '').trim();
          if (!line) continue;
        }

        // Explanations & rubrics
        if (/^>\s*(?:explanation|explain)\s*:/i.test(line) || /^(?:explanation)\s*:/i.test(line)) {
          explanation = line.replace(/^>\s*(?:explanation|explain)\s*:/i, '').replace(/^(?:explanation)\s*:/i, '').trim();
          continue;
        }

        if (/^>\s*(?:model|model answer|answer)\s*:/i.test(line) || /^(?:model answer|model)\s*:/i.test(line)) {
          modelAnswer = line.replace(/^>\s*(?:model|model answer|answer)\s*:/i, '').replace(/^(?:model answer|model)\s*:/i, '').trim();
          continue;
        }

        if (/^>\s*(?:guidelines?|rubric|rubrics)\s*:/i.test(line) || /^(?:guidelines?|rubric)\s*:/i.test(line)) {
          guidelines = line.replace(/^>\s*(?:guidelines?|rubric|rubrics)\s*:/i, '').replace(/^(?:guidelines?|rubric)\s*:/i, '').trim();
          continue;
        }

        if (/^>\s*(?:acceptable|accepted|answers?)\s*:/i.test(line) || /^(?:acceptable answers?)\s*:/i.test(line)) {
          const rawAnswers = line.replace(/^>\s*(?:acceptable|accepted|answers?)\s*:/i, '').replace(/^(?:acceptable answers?)\s*:/i, '').trim();
          acceptableAnswers = rawAnswers.split(/[,/|]/).map((a) => a.trim()).filter(Boolean);
          continue;
        }

        // MCQ checkboxes: - [x] or - [ ] or * [x] or [x]
        const checkboxMatch = line.match(/^[-*]?\s*\[([ xX])\]\s*(.*)$/);
        if (checkboxMatch) {
          type = 'mcq';
          const isCorrect = checkboxMatch[1].toLowerCase() === 'x';
          const optText = checkboxMatch[2].trim();

          if (isCorrect) {
            correctAnswerIndex = options.length;
          }
          options.push(optText);
          continue;
        }

        // Letter or Number options: e.g. "A) Option", "A. Option", "(A) Option", "1) Option", "- A) Option", "* A. Option"
        const letterOptionMatch = line.match(/^(?:[-*]\s*)?\(?([A-Ea-e1-5])\)?[\).]\s*(.*)$/);
        if (letterOptionMatch && letterOptionMatch[2].trim().length > 0) {
          type = 'mcq';
          let optText = letterOptionMatch[2].trim();

          // Check if option text ends with (Correct) or * or [x]
          const isCorrectMarker = /\s*(?:\(correct(?:\s*answer)?\)|\*|\[x\])$/i.test(optText);
          if (isCorrectMarker) {
            optText = optText.replace(/\s*(?:\(correct(?:\s*answer)?\)|\*|\[x\])$/i, '').trim();
            correctAnswerIndex = options.length;
          }

          options.push(optText);
          continue;
        }

        // Correct Answer line for options: e.g. "Answer: B", "Ans: C", "Correct: A", "Answer: 2"
        const explicitAnswerMatch = line.match(/^(?:Answer|Correct\s*Answer|Correct|Key|Ans)\s*[:=]\s*(.+)$/i);
        if (explicitAnswerMatch) {
          const rawAns = explicitAnswerMatch[1].trim();
          const singleCharMatch = rawAns.match(/^([A-Ea-e1-5])\b/);
          if (singleCharMatch) {
            const char = singleCharMatch[1].toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(char)) {
              correctAnswerIndex = char.charCodeAt(0) - 65;
            } else {
              const num = parseInt(char, 10);
              if (!isNaN(num) && num > 0) {
                correctAnswerIndex = num - 1;
              }
            }
          } else {
            // Check if answer line directly matches one of the options
            const matchedIdx = options.findIndex((opt) => opt.toLowerCase() === rawAns.toLowerCase());
            if (matchedIdx >= 0) {
              correctAnswerIndex = matchedIdx;
            }
          }
          continue;
        }

        // Matching pair: - Term -> Definition or - Term : Definition or Term => Definition
        const matchPairMatch = line.match(/^(?:[-*]|\d+[\.\)])?\s*(.+?)\s*(?:->|=>|::)\s*(.+)$/);
        if (matchPairMatch && type === 'matching') {
          matchingPairs.push({
            id: `pair-${matchingPairs.length + 1}`,
            left: matchPairMatch[1].trim(),
            right: matchPairMatch[2].trim(),
          });
          continue;
        }

        // Otherwise this is question prompt text
        questionLines.push(line);
      }

      let questionText = questionLines.join(' ').trim();

      // If Fill in blank has brackets e.g. "The capital of France is [Paris]."
      if (type === 'fill_in_blank') {
        const bracketMatches = questionText.matchAll(/\[(.*?)\]/g);
        for (const m of bracketMatches) {
          if (m[1]) {
            const word = m[1].trim();
            if (word && !acceptableAnswers.includes(word)) {
              acceptableAnswers.unshift(word);
            }
          }
        }
      }

      // Basic validation
      if (!questionText) {
        result.errors.push(`Item #${index + 1}: Missing question text`);
        return;
      }

      if (type === 'mcq') {
        if (options.length < 2) {
          result.errors.push(`Item #${index + 1} (MCQ): Requires at least 2 options`);
          return;
        }
        if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
          correctAnswerIndex = 0;
        }
      } else if (type === 'matching') {
        if (matchingPairs.length < 2) {
          result.errors.push(`Item #${index + 1} (Matching): Requires at least 2 pairs (use "- Term -> Definition")`);
          return;
        }
      } else if (type === 'fill_in_blank') {
        if (acceptableAnswers.length === 0) {
          const m = questionText.match(/\[(.*?)\]/);
          if (m && m[1]) {
            acceptableAnswers.push(m[1].trim());
          } else {
            acceptableAnswers.push('answer');
          }
        }
      }

      result.questions.push({
        type,
        difficulty,
        question: removeDollarDelimiters(questionText),
        points: points || 1,
        subject,
        gradeLevel,
        topic: topic || 'General',
        imageUrl: imageUrl || undefined,
        options: type === 'mcq' ? options.map(removeDollarDelimiters) : undefined,
        correctAnswerIndex: type === 'mcq' ? correctAnswerIndex : undefined,
        modelAnswer: type === 'structure' && modelAnswer ? removeDollarDelimiters(modelAnswer) : undefined,
        guidelines: type === 'structure' && guidelines ? removeDollarDelimiters(guidelines) : undefined,
        acceptableAnswers: type === 'fill_in_blank' && acceptableAnswers.length > 0 ? acceptableAnswers.map(removeDollarDelimiters) : undefined,
        caseSensitive: type === 'fill_in_blank' ? caseSensitive : undefined,
        matchingPairs: type === 'matching' && matchingPairs.length > 0
          ? matchingPairs.map((p) => ({
              id: p.id,
              left: removeDollarDelimiters(p.left),
              right: removeDollarDelimiters(p.right),
            }))
          : undefined,
        explanation: explanation ? removeDollarDelimiters(explanation) : undefined,
      });
    } catch (err: any) {
      result.errors.push(`Item #${index + 1}: Parsing error - ${err?.message || 'Invalid syntax'}`);
    }
  });

  return result;
}

export const SAMPLE_MARKDOWN_TEMPLATES = {
  ALL_TYPES: `### MCQ | 数学 | Year 5 | 2 pts | 分数
计算 3/4 + 2/4 的答案。
- [ ] 5/8
- [x] 5/4
- [ ] 1/2
- [ ] 6/4
> Explanation: 同分母分数相加，分母不变，分子相加：3 + 2 = 5，所以是 5/4。

### Structure | Science | Form 2 | 5 pts | Photosynthesis
Describe the process of photosynthesis and explain why chlorophyll and sunlight are essential.
Image: https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600
> Model: Photosynthesis is the biochemical process by which plants convert carbon dioxide and water into glucose and oxygen using light absorbed by chlorophyll.
> Guidelines: 2 marks for stating reactants and products, 2 marks for solar absorption role of chlorophyll, 1 mark for clarity.

### FillInBlank | Bahasa Melayu | Year 5 | 2 pts | Tatabahasa
Kata kerja bagi perbuatan berenang dalam bentuk jamak ialah [berenang].
> Acceptable: berenang, Berenang
> Explanation: Kata kerja tidak berubah mengikut bilangan subjek.

### Matching | 华语 | Form 1 | 4 pts | 成语配对
将下列成语与其正确的意思配对：
- 画蛇添足 -> 多此一举，弄巧成拙
- 守株待兔 -> 不知变通，企图侥幸
- 狐假虎威 -> 倚仗别人的势力欺压他人
- 亡羊补牢 -> 出了问题及时想办法补救`,

  MCQ_ONLY: `### MCQ | Mathematics | Year 5 | 1 pt | Arithmetic
What is the product of 12 and 15?
- [ ] 150
- [x] 180
- [ ] 190
- [ ] 160
> Explanation: 12 * 15 = 180.

### MCQ | 科学 | Year 5 | 1 pt | 太阳系
太阳系中被称为“红行星”的是哪颗行星？
- [ ] 金星 (Venus)
- [x] 火星 (Mars)
- [ ] 木星 (Jupiter)
- [ ] Saturn
> Explanation: 火星表面覆盖大量氧化铁，呈现红褐色。`,

  STRUCTURE_ONLY: `### Structure | English | Year 6 | 5 pts | Essay Composition
Write a short paragraph analyzing how the author conveys suspense in a mystery novel.
> Model: The author builds suspense through pacing, sensory descriptions of shadows and footsteps, and cliffhangers at chapter ends.
> Guidelines: 2 marks for citing specific narrative techniques, 2 marks for textual evidence, 1 mark for vocabulary and grammar.`,

  FILL_IN_BLANK: `### FillInBlank | 科学 | Year 4 | 2 pts | 水的形态变化
水受热变成水蒸气的过程称为 [蒸发]。
> Acceptable: 蒸发, 沸腾

### FillInBlank | Mathematics | Year 5 | 2 pts | Geometry
A triangle with three equal sides is called an [equilateral] triangle.
> Acceptable: equilateral, Equilateral`,

  MATCHING_ONLY: `### Matching | Science | Year 5 | 4 pts | States of Matter
Match each state of matter to its correct molecular characteristic:
- Solid -> Tightly packed particles in a fixed structure
- Liquid -> Closely positioned particles that flow freely
- Gas -> Widely dispersed particles moving rapidly
- Plasma -> High energy ionized gas found in stars`,
};
