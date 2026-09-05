import { QuestionType, Subject, QuestionBankItem, QuizQuestion } from '../types';

export interface ParsedQuestionDraft {
  type: QuestionType;
  question: string;
  points: number;
  subject: Subject;
  gradeLevel: string;
  topic: string;
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

  // Split questions either by `###` or `---` or double blank line followed by Question marker
  const rawBlocks = markdownText
    .split(/\n(?=###|\n---\n|\n={3,}\n)/g)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  rawBlocks.forEach((block, index) => {
    try {
      const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) return;

      let type: QuestionType = 'mcq';
      let subject: Subject = fallbackSubject;
      let gradeLevel = fallbackGrade;
      let topic = 'General';
      let points = 1;
      let explanation = '';
      let modelAnswer = '';
      let guidelines = '';
      let acceptableAnswers: string[] = [];
      let caseSensitive = false;
      const options: string[] = [];
      let correctAnswerIndex = 0;
      const matchingPairs: Array<{ id: string; left: string; right: string }> = [];

      let questionLines: string[] = [];
      let currentSection: 'header' | 'question' | 'options' | 'matching' | 'other' = 'header';

      // Inspect first line / header
      const firstLine = lines[0];
      const headerMatch = firstLine.match(/^(?:###|##|#)?\s*(MCQ|Structure|Structured|FillInBlank|Fill in blank|Fill-in-the-blank|Blank|Matching|Match)\b(.*)$/i);

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
          const parts = metadataPart.split('|').map((p) => p.trim()).filter(Boolean);
          parts.forEach((p) => {
            const numMatch = p.match(/^(\d+)\s*(?:pts?|points?|marks?)/i);
            if (numMatch) {
              points = parseInt(numMatch[1], 10);
            } else if (['Mathematics', 'English', 'Science', 'Social Studies', 'Art & Technology'].includes(p)) {
              subject = p as Subject;
            } else if (/^(?:Year|Grade|Form|Standard)\s*\d+/i.test(p)) {
              gradeLevel = p;
            } else if (p.length > 0) {
              topic = p;
            }
          });
        }
      }

      // Process subsequent lines
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];

        // Direct metadata tags
        if (/^type\s*:/i.test(line)) {
          const t = line.replace(/^type\s*:/i, '').trim().toLowerCase();
          if (t.includes('mcq')) type = 'mcq';
          else if (t.includes('struct')) type = 'structure';
          else if (t.includes('fill') || t.includes('blank')) type = 'fill_in_blank';
          else if (t.includes('match')) type = 'matching';
          continue;
        }

        if (/^(?:subject)\s*:/i.test(line)) {
          const s = line.replace(/^subject\s*:/i, '').trim();
          if (['Mathematics', 'English', 'Science', 'Social Studies', 'Art & Technology'].includes(s)) {
            subject = s as Subject;
          }
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

        // MCQ checkboxes: - [x] or - [ ] or * [x]
        const checkboxMatch = line.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
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

        // Letter options: A) Option or 1. Option
        const letterOptionMatch = line.match(/^([A-Da-d])[\).]\s*(.*)$/);
        if (letterOptionMatch) {
          type = 'mcq';
          const optText = letterOptionMatch[2].trim();
          options.push(optText);
          continue;
        }

        // Correct Answer line for letter options: e.g. "Answer: B" or "Correct: C"
        const explicitAnswerMatch = line.match(/^(?:Answer|Correct|Key)\s*:\s*([A-Da-d0-9])/i);
        if (explicitAnswerMatch) {
          const char = explicitAnswerMatch[1].toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(char)) {
            correctAnswerIndex = char.charCodeAt(0) - 65;
          } else {
            const num = parseInt(char, 10);
            if (!isNaN(num) && num > 0) correctAnswerIndex = num - 1;
          }
          continue;
        }

        // Matching pair: - Term -> Definition or - Term : Definition
        const matchPairMatch = line.match(/^[-*]\s*(.+?)\s*(?:->|=>|::|:)\s*(.+)$/);
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
        const bracketMatch = questionText.match(/\[(.*?)\]/);
        if (bracketMatch && bracketMatch[1]) {
          const bracketWord = bracketMatch[1].trim();
          if (!acceptableAnswers.includes(bracketWord)) {
            acceptableAnswers.unshift(bracketWord);
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
          // Attempt to extract from question if [bracket] used
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
        question: questionText,
        points: points || 1,
        subject,
        gradeLevel,
        topic: topic || 'General',
        options: type === 'mcq' ? options : undefined,
        correctAnswerIndex: type === 'mcq' ? correctAnswerIndex : undefined,
        modelAnswer: type === 'structure' ? modelAnswer : undefined,
        guidelines: type === 'structure' ? guidelines : undefined,
        acceptableAnswers: type === 'fill_in_blank' ? acceptableAnswers : undefined,
        caseSensitive: type === 'fill_in_blank' ? caseSensitive : undefined,
        matchingPairs: type === 'matching' ? matchingPairs : undefined,
        explanation: explanation || undefined,
      });
    } catch (err: any) {
      result.errors.push(`Item #${index + 1}: Parsing error - ${err?.message || 'Invalid syntax'}`);
    }
  });

  return result;
}

export const SAMPLE_MARKDOWN_TEMPLATES = {
  ALL_TYPES: `### MCQ | Mathematics | Year 5 | 2 pts | Fractions
What is 3/4 + 2/4?
- [ ] 5/8
- [x] 5/4
- [ ] 1/2
- [ ] 6/4
> Explanation: Add numerators when denominators are equal: 3 + 2 = 5, keeping denominator 4.

### Structure | Science | Year 6 | 5 pts | Photosynthesis
Describe the process of photosynthesis and explain why chlorophyll and sunlight are essential.
> Model: Photosynthesis is the biochemical process by which plants use sunlight, water, and carbon dioxide to produce oxygen and glucose. Chlorophyll captures radiant solar energy to power this reaction.
> Guidelines: Award 2 marks for reactants and products (CO2, H2O, Glucose, O2), 2 marks for chlorophyll solar absorption, 1 mark for structured clarity.

### FillInBlank | English | Year 5 | 2 pts | Grammar
The past tense of the verb "swim" is [swam].
> Acceptable: swam, Swam
> Explanation: "Swam" is the irregular past tense of "swim".

### Matching | Social Studies | Year 5 | 4 pts | Geography
Match each country to its respective capital city:
- Malaysia -> Kuala Lumpur
- Japan -> Tokyo
- Australia -> Canberra
- France -> Paris
> Explanation: National capital cities across Asia, Europe, and Oceania.`,

  MCQ_ONLY: `### MCQ | Mathematics | Year 5 | 1 pt | Arithmetic
What is the product of 12 and 15?
- [ ] 150
- [x] 180
- [ ] 190
- [ ] 160
> Explanation: 12 * 15 = 180.

### MCQ | Science | Year 5 | 1 pt | Solar System
Which planet is known as the Red Planet?
- [ ] Venus
- [x] Mars
- [ ] Jupiter
- [ ] Saturn
> Explanation: Mars appears red due to abundant iron oxide on its surface.`,

  STRUCTURE_ONLY: `### Structure | English | Year 6 | 5 pts | Essay Composition
Write a short paragraph analyzing how the author conveys suspense in a mystery novel.
> Model: The author builds suspense through pacing, sensory descriptions of shadows and footsteps, and cliffhangers at chapter ends.
> Guidelines: 2 marks for citing specific narrative techniques, 2 marks for textual evidence, 1 mark for vocabulary and grammar.`,

  FILL_IN_BLANK: `### FillInBlank | Science | Year 4 | 2 pts | Water Cycle
The process where liquid water turns into water vapor is called [evaporation].
> Acceptable: evaporation, Evaporation

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
