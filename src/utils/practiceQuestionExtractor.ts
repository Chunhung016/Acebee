import { QuestionBankItem, Quiz, QuestionType, MatchingPair } from '../types';

export interface InteractivePracticeQuestion {
  id: string;
  type: QuestionType;
  question: string;
  topic: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  options?: string[];
  correctOptionIndex?: number;
  correctAnswerText?: string;
  acceptableAnswers?: string[];
  matchingPairs?: MatchingPair[];
  explanation: string;
  learningTip?: string;
}

// Built-in themed question sets for core academic topics to guarantee 10 high-quality questions
const TOPIC_PRESETS: Record<string, InteractivePracticeQuestion[]> = {
  fractions: [
    {
      id: 'frac-1',
      type: 'mcq',
      question: 'Evaluate the expression 3/8 + 2/5 and express as a single simplified fraction.',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'medium',
      points: 1,
      options: ['31/40', '5/13', '23/40', '1/2'],
      correctOptionIndex: 0,
      explanation: 'Find common denominator 40: 3/8 = 15/40, and 2/5 = 16/40. 15/40 + 16/40 = 31/40.',
      learningTip: 'Always find the Least Common Multiple (LCM) of denominators first.',
    },
    {
      id: 'frac-2',
      type: 'mcq',
      question: 'Simplify the fraction 24/36 to its lowest terms.',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'easy',
      points: 1,
      options: ['2/3', '4/6', '3/4', '6/9'],
      correctOptionIndex: 0,
      explanation: 'Divide both 24 and 36 by their greatest common factor (12): 24 ÷ 12 = 2, 36 ÷ 12 = 3.',
      learningTip: 'Check if both numerator and denominator share prime factors.',
    },
    {
      id: 'frac-3',
      type: 'mcq',
      question: 'Calculate 5/6 - 1/4 in simplest form.',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'medium',
      points: 1,
      options: ['7/12', '4/2', '2/3', '1/2'],
      correctOptionIndex: 0,
      explanation: 'Common denominator of 6 and 4 is 12. 5/6 = 10/12, 1/4 = 3/12. 10/12 - 3/12 = 7/12.',
      learningTip: 'Multiply top and bottom by whatever scales the denominator to the LCM.',
    },
    {
      id: 'frac-4',
      type: 'mcq',
      question: 'What is (3/4) × (2/9)?',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'easy',
      points: 1,
      options: ['1/6', '5/13', '6/36', '1/4'],
      correctOptionIndex: 0,
      explanation: '(3 × 2) / (4 × 9) = 6/36 = 1/6 after dividing by 6.',
      learningTip: 'Cross-simplify before multiplying to keep numbers manageable.',
    },
    {
      id: 'frac-5',
      type: 'mcq',
      question: 'Divide: (2/3) ÷ (4/5).',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'medium',
      points: 1,
      options: ['5/6', '8/15', '6/5', '1/2'],
      correctOptionIndex: 0,
      explanation: 'Multiply by the reciprocal of the second fraction: (2/3) × (5/4) = 10/12 = 5/6.',
      learningTip: 'Remember "Keep, Change, Flip" for fraction division.',
    },
    {
      id: 'frac-6',
      type: 'mcq',
      question: 'Convert the mixed number 3 2/5 into an improper fraction.',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'easy',
      points: 1,
      options: ['17/5', '15/5', '11/5', '13/5'],
      correctOptionIndex: 0,
      explanation: '(Whole number × denominator) + numerator = (3 × 5) + 2 = 17. So the improper fraction is 17/5.',
      learningTip: 'The denominator always stays the same.',
    },
    {
      id: 'frac-7',
      type: 'mcq',
      question: 'Which fraction is greater: 5/8 or 7/12?',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'hard',
      points: 1,
      options: ['5/8 is greater', '7/12 is greater', 'They are equal', 'Cannot be determined'],
      correctOptionIndex: 0,
      explanation: 'Convert to denominator 24: 5/8 = 15/24, while 7/12 = 14/24. 15/24 > 14/24, so 5/8 is greater.',
      learningTip: 'Cross-multiplying also works: 5 × 12 = 60 vs 8 × 7 = 56. Since 60 > 56, 5/8 is larger.',
    },
    {
      id: 'frac-8',
      type: 'mcq',
      question: 'A pizza is sliced into 12 equal slices. Sarah eats 3 slices and Leo eats 4 slices. What fraction of the pizza remains?',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'medium',
      points: 1,
      options: ['5/12', '7/12', '1/2', '1/3'],
      correctOptionIndex: 0,
      explanation: 'Total eaten: 3/12 + 4/12 = 7/12. Remaining: 1 - 7/12 = 5/12.',
      learningTip: 'The whole object equals 12/12.',
    },
    {
      id: 'frac-9',
      type: 'mcq',
      question: 'Solve for x: (2/7) + x = 1.',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'easy',
      points: 1,
      options: ['5/7', '2/7', '1/7', '7/7'],
      correctOptionIndex: 0,
      explanation: 'Subtract 2/7 from 1: 7/7 - 2/7 = 5/7.',
      learningTip: 'Express 1 as a fraction with the same denominator.',
    },
    {
      id: 'frac-10',
      type: 'mcq',
      question: 'Calculate: 1 1/2 + 2 1/3.',
      topic: 'Fractions & Operations',
      subject: 'Mathematics',
      difficulty: 'hard',
      points: 1,
      options: ['3 5/6', '3 2/5', '4 1/6', '3 1/3'],
      correctOptionIndex: 0,
      explanation: 'Whole numbers: 1 + 2 = 3. Fractions: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Total: 3 5/6.',
      learningTip: 'Add whole numbers together, then add fraction parts with common denominators.',
    },
  ],

  photosynthesis: [
    {
      id: 'photo-1',
      type: 'mcq',
      question: 'What is the primary green pigment in plant chloroplasts responsible for absorbing solar photons?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'easy',
      points: 1,
      options: ['Chlorophyll', 'Carotenoid', 'Hemoglobin', 'Anthocyanin'],
      correctOptionIndex: 0,
      explanation: 'Chlorophyll traps photon energy from sunlight, enabling the light-dependent reactions of photosynthesis.',
      learningTip: 'Chlorophyll gives plants their characteristic green hue by reflecting green wavelengths.',
    },
    {
      id: 'photo-2',
      type: 'mcq',
      question: 'Which gas is taken in by plant leaves through the stomata during photosynthesis?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'easy',
      points: 1,
      options: ['Carbon Dioxide (CO2)', 'Oxygen (O2)', 'Nitrogen (N2)', 'Argon'],
      correctOptionIndex: 0,
      explanation: 'Plants absorb carbon dioxide from the atmosphere through microscopic pores called stomata.',
      learningTip: 'Carbon dioxide is fixed into glucose sugar molecules.',
    },
    {
      id: 'photo-3',
      type: 'mcq',
      question: 'What are the two main products resulting from the photosynthesis process?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'medium',
      points: 1,
      options: ['Glucose and Oxygen', 'Carbon Dioxide and Water', 'Nitrogen and Glucose', 'Methane and Water'],
      correctOptionIndex: 0,
      explanation: '6CO2 + 6H2O + Light energy → C6H12O6 (Glucose) + 6O2 (Oxygen).',
      learningTip: 'Plants store glucose as starch and release oxygen for aerobic respiration.',
    },
    {
      id: 'photo-4',
      type: 'mcq',
      question: 'In which specific plant cell organelle does photosynthesis take place?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'easy',
      points: 1,
      options: ['Chloroplast', 'Mitochondria', 'Nucleus', 'Vacuole'],
      correctOptionIndex: 0,
      explanation: 'Chloroplasts contain the thylakoid membranes where light reactions occur and the stroma where the Calvin cycle takes place.',
      learningTip: 'Animal cells do not have chloroplasts.',
    },
    {
      id: 'photo-5',
      type: 'mcq',
      question: 'What vascular tissue transports water and dissolved minerals from roots upward to the leaves?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'medium',
      points: 1,
      options: ['Xylem', 'Phloem', 'Cambium', 'Epidermis'],
      correctOptionIndex: 0,
      explanation: 'Xylem transports water and minerals up from the roots; Phloem transports synthesized sugars down and throughout the plant.',
      learningTip: 'Xylem = X-water, Phloem = Food/sugar.',
    },
    {
      id: 'photo-6',
      type: 'mcq',
      question: 'Which of the following factors does NOT directly limit the rate of photosynthesis?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'hard',
      points: 1,
      options: ['Oxygen concentration in soil', 'Light intensity', 'Carbon dioxide concentration', 'Ambient temperature'],
      correctOptionIndex: 0,
      explanation: 'Photosynthesis depends on light, CO2, and temperature-controlled enzymes, not on soil oxygen levels.',
      learningTip: 'The three classic limiting factors are light intensity, CO2 level, and temperature.',
    },
    {
      id: 'photo-7',
      type: 'mcq',
      question: 'What happens to the rate of photosynthesis if ambient temperature rises far above 45°C (113°F)?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'hard',
      points: 1,
      options: ['It drops drastically because photosynthetic enzymes denature', 'It increases indefinitely', 'It stays constant', 'It converts immediately into respiration'],
      correctOptionIndex: 0,
      explanation: 'Enzymes like Rubisco lose their functional 3D conformation (denature) at extreme temperatures, stopping biochemical catalysis.',
      learningTip: 'Enzymes have an optimal temperature range beyond which their active sites warp.',
    },
    {
      id: 'photo-8',
      type: 'mcq',
      question: 'What is the primary form of energy chemical storage used by plants to store excess glucose?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'medium',
      points: 1,
      options: ['Starch', 'Glycogen', 'Cellulose only', 'Lipid oil'],
      correctOptionIndex: 0,
      explanation: 'Plants polymerize glucose into insoluble starch granules for long-term energetic storage.',
      learningTip: 'Iodine turns blue-black in the presence of stored starch.',
    },
    {
      id: 'photo-9',
      type: 'mcq',
      question: 'During which phase of photosynthesis is water split to release oxygen (photolysis)?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'hard',
      points: 1,
      options: ['Light-dependent reactions', 'Calvin cycle (Light-independent)', 'Glycolysis', 'Krebs cycle'],
      correctOptionIndex: 0,
      explanation: 'In the thylakoid membranes, light energy splits H2O molecules (photolysis) releasing oxygen gas.',
      learningTip: 'Light is required directly to excite electrons and split water.',
    },
    {
      id: 'photo-10',
      type: 'mcq',
      question: 'What microscopic guard cells regulate the opening and closing of leaf stomata?',
      topic: 'Photosynthesis & Plant Biology',
      subject: 'Science',
      difficulty: 'medium',
      points: 1,
      options: ['Guard cells', 'Mesophyll cells', 'Parenchyma cells', 'Sclerenchyma cells'],
      correctOptionIndex: 0,
      explanation: 'Swelling and shrinking of paired guard cells controls stomatal pores to balance gas exchange with transpiration water loss.',
      learningTip: 'Turgid guard cells curve open; flaccid guard cells close.',
    },
  ],

  grammar: [
    {
      id: 'gram-1',
      type: 'mcq',
      question: 'Choose the correct past tense form: "Yesterday, Maria _____ her bicycle to the library."',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'easy',
      points: 1,
      options: ['rode', 'ride', 'rided', 'had ride'],
      correctOptionIndex: 0,
      explanation: '"Rode" is the standard irregular past tense form of the verb "ride".',
      learningTip: 'Do not add -ed to irregular verbs like ride, drive, or write.',
    },
    {
      id: 'gram-2',
      type: 'mcq',
      question: 'Select the sentence with correct verb agreement:',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'medium',
      points: 1,
      options: ['The children swam across the cool stream.', 'The children swimmed across the cool stream.', 'The children have swam across.', 'The children swum yesterday.'],
      correctOptionIndex: 0,
      explanation: '"Swam" is the simple past form of "swim". "Swum" is the past participle used with helper verbs.',
      learningTip: 'Swim (present) → Swam (simple past) → Swum (past participle).',
    },
    {
      id: 'gram-3',
      type: 'mcq',
      question: 'What is the past tense of the verb "catch"?',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'easy',
      points: 1,
      options: ['caught', 'catched', 'cought', 'cotched'],
      correctOptionIndex: 0,
      explanation: '"Caught" is the irregular past tense form of "catch".',
      learningTip: 'Notice the spelling pattern: catch → caught, teach → taught.',
    },
    {
      id: 'gram-4',
      type: 'mcq',
      question: '"The bell has already _____," announced the headmaster.',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'hard',
      points: 1,
      options: ['rung', 'rang', 'ringed', 'ring'],
      correctOptionIndex: 0,
      explanation: 'With auxiliary verb "has", use the past participle "rung". "Rang" is simple past without helper.',
      learningTip: 'Ring (present) → Rang (past) → Has Rung (participle).',
    },
    {
      id: 'gram-5',
      type: 'mcq',
      question: 'Which word correctly completes the sentence: "He _____ his jacket on the hook."',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'medium',
      points: 1,
      options: ['hung', 'hanged', 'hang', 'hangged'],
      correctOptionIndex: 0,
      explanation: 'Objects are "hung" (past tense of hang). "Hanged" is reserved for execution.',
      learningTip: 'Jackets and paintings are hung.',
    },
    {
      id: 'gram-6',
      type: 'mcq',
      question: 'Identify the irregular past participle of "freeze":',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'medium',
      points: 1,
      options: ['frozen', 'froze', 'freezed', 'frozed'],
      correctOptionIndex: 0,
      explanation: 'Freeze → Froze (past) → Frozen (past participle).',
      learningTip: 'Similar to speak → spoke → spoken.',
    },
    {
      id: 'gram-7',
      type: 'mcq',
      question: 'Choose the correct word: "The balloon _____ into the sky."',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'easy',
      points: 1,
      options: ['flew', 'flowed', 'flyed', 'flown'],
      correctOptionIndex: 0,
      explanation: '"Flew" is the simple past tense of "fly".',
      learningTip: 'Fly → Flew → Flown.',
    },
    {
      id: 'gram-8',
      type: 'mcq',
      question: 'Which of the following is an irregular verb in English?',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'easy',
      points: 1,
      options: ['Bite (bit, bitten)', 'Walk (walked)', 'Jump (jumped)', 'Play (played)'],
      correctOptionIndex: 0,
      explanation: '"Bite" changes vowel structure (bit, bitten), making it irregular.',
      learningTip: 'Regular verbs simply append -ed or -d.',
    },
    {
      id: 'gram-9',
      type: 'mcq',
      question: 'Complete the sentence: "She had never _____ such an extraordinary sight."',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'medium',
      points: 1,
      options: ['seen', 'saw', 'seed', 'see'],
      correctOptionIndex: 0,
      explanation: 'After "had", the past participle "seen" must be used.',
      learningTip: 'I saw (simple past) vs. I had seen (past perfect).',
    },
    {
      id: 'gram-10',
      type: 'mcq',
      question: 'What is the past tense of "lead" (to guide)?',
      topic: 'Irregular Past Tense Verbs',
      subject: 'English',
      difficulty: 'hard',
      points: 1,
      options: ['led', 'lead', 'leaded', 'leed'],
      correctOptionIndex: 0,
      explanation: 'The past tense of "lead" is spelled "led". ("Lead" sounding like "led" is the heavy metal element).',
      learningTip: 'Pronounced the same as the metal lead, but spelled L-E-D.',
    },
  ],

  geography: [
    {
      id: 'geo-1',
      type: 'mcq',
      question: 'What is the constitutional national capital of Australia?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'medium',
      points: 1,
      options: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane'],
      correctOptionIndex: 0,
      explanation: 'Canberra was chosen in 1908 as a compromise between the two largest cities, Sydney and Melbourne.',
      learningTip: 'Many people mistake Sydney or Melbourne for the capital.',
    },
    {
      id: 'geo-2',
      type: 'mcq',
      question: 'Which continent has the largest landmass and highest population?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'easy',
      points: 1,
      options: ['Asia', 'Africa', 'North America', 'Europe'],
      correctOptionIndex: 0,
      explanation: 'Asia encompasses roughly 30% of Earth\'s total land area and over 60% of the world population.',
      learningTip: 'Asia stretches from the Mediterranean Sea to the Pacific Ocean.',
    },
    {
      id: 'geo-3',
      type: 'mcq',
      question: 'What is the capital city of Japan?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'easy',
      points: 1,
      options: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo'],
      correctOptionIndex: 0,
      explanation: 'Tokyo (formerly Edo) has served as Japan\'s capital since 1868.',
      learningTip: 'Kyoto was the ancient imperial capital.',
    },
    {
      id: 'geo-4',
      type: 'mcq',
      question: 'Which is the longest river in the world by continuous length?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'medium',
      points: 1,
      options: ['The Nile River', 'The Amazon River', 'The Yangtze River', 'The Mississippi River'],
      correctOptionIndex: 0,
      explanation: 'The Nile in Africa measures approximately 6,650 km (4,132 miles), making it the longest river.',
      learningTip: 'The Amazon carries the greatest water discharge, but the Nile is traditionally measured as longest.',
    },
    {
      id: 'geo-5',
      type: 'mcq',
      question: 'What is the capital city of Canada?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'medium',
      points: 1,
      options: ['Ottawa', 'Toronto', 'Montreal', 'Vancouver'],
      correctOptionIndex: 0,
      explanation: 'Queen Victoria designated Ottawa as Canada\'s capital in 1857.',
      learningTip: 'Toronto is the largest city, but Ottawa is the capital.',
    },
    {
      id: 'geo-6',
      type: 'mcq',
      question: 'How many recognized oceans are there on Earth?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'easy',
      points: 1,
      options: ['5 (Pacific, Atlantic, Indian, Southern, Arctic)', '4', '7', '6'],
      correctOptionIndex: 0,
      explanation: 'The 5 oceans are the Pacific, Atlantic, Indian, Arctic, and the Southern (Antarctic) Ocean.',
      learningTip: 'The Southern Ocean was officially demarcated surrounding Antarctica.',
    },
    {
      id: 'geo-7',
      type: 'mcq',
      question: 'What is the capital city of Brazil?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'hard',
      points: 1,
      options: ['Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'],
      correctOptionIndex: 0,
      explanation: 'Brasília is a planned capital city founded in 1960 to move the capital inland from Rio de Janeiro.',
      learningTip: 'Notice the root "Brasil" in the city name Brasília.',
    },
    {
      id: 'geo-8',
      type: 'mcq',
      question: 'Which mountain range separates Europe from Asia?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'hard',
      points: 1,
      options: ['The Ural Mountains', 'The Alps', 'The Andes', 'The Himalayas'],
      correctOptionIndex: 0,
      explanation: 'The Ural Mountains run north-to-south through western Russia and form the traditional boundary between Europe and Asia.',
      learningTip: 'Ural starts with U, separating Eurasia.',
    },
    {
      id: 'geo-9',
      type: 'mcq',
      question: 'What is the capital city of Kenya?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'medium',
      points: 1,
      options: ['Nairobi', 'Mombasa', 'Addis Ababa', 'Cairo'],
      correctOptionIndex: 0,
      explanation: 'Nairobi is the capital and largest financial hub of Kenya.',
      learningTip: 'Nairobi is known as the "Green City in the Sun".',
    },
    {
      id: 'geo-10',
      type: 'mcq',
      question: 'Which country is situated entirely within another single country (enclave)?',
      topic: 'World Capitals & Continents',
      subject: 'Social Studies',
      difficulty: 'hard',
      points: 1,
      options: ['Lesotho (inside South Africa)', 'Monaco', 'Luxembourg', 'Belgium'],
      correctOptionIndex: 0,
      explanation: 'The Kingdom of Lesotho is completely landlocked and enclaved within the Republic of South Africa.',
      learningTip: 'Vatican City and San Marino inside Italy are other famous enclaves.',
    },
  ],
};

/**
 * Shuffles an array in place using modern Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Randomizes options for an MCQ question and recalculates correctOptionIndex
 * so the correct answer is evenly distributed across A, B, C, D.
 */
export function randomizeQuestionOptions(q: InteractivePracticeQuestion): InteractivePracticeQuestion {
  if (q.type !== 'mcq' || !q.options || q.options.length < 2) {
    return q;
  }
  const originalCorrectIndex = q.correctOptionIndex ?? 0;
  const correctOptionText = q.options[originalCorrectIndex];
  if (!correctOptionText) return q;

  // Track the correct item by reference/index
  const taggedOptions = q.options.map((opt, idx) => ({
    opt,
    isCorrect: idx === originalCorrectIndex,
  }));

  const shuffledTagged = shuffleArray(taggedOptions);
  const newCorrectIndex = shuffledTagged.findIndex((item) => item.isCorrect);

  return {
    ...q,
    options: shuffledTagged.map((item) => item.opt),
    correctOptionIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

/**
 * Procedurally generates a unique, randomized question when needed to round out 10 questions.
 */
function generateProceduralRandomQuestion(
  index: number,
  topicName: string,
  subjectName: string
): InteractivePracticeQuestion {
  const normSubject = subjectName.toLowerCase();
  const isMath = normSubject.includes('math') || topicName.toLowerCase().includes('fraction') || topicName.toLowerCase().includes('algebra') || topicName.toLowerCase().includes('number');
  const isScience = normSubject.includes('scien') || topicName.toLowerCase().includes('bio') || topicName.toLowerCase().includes('photo') || topicName.toLowerCase().includes('force');
  const isEnglish = normSubject.includes('eng') || topicName.toLowerCase().includes('grammar') || topicName.toLowerCase().includes('verb') || topicName.toLowerCase().includes('vocab');

  const randomId = `dynamic-drill-${Date.now()}-${Math.floor(Math.random() * 10000)}-${index}`;

  if (isMath) {
    const variant = Math.floor(Math.random() * 5);
    if (variant === 0) {
      // Linear equation: ax + b = c
      const a = Math.floor(Math.random() * 5) + 2;
      const x = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 15) + 1;
      const c = a * x + b;
      return randomizeQuestionOptions({
        id: randomId,
        type: 'mcq',
        question: `Solve for x: ${a}x + ${b} = ${c}`,
        topic: topicName,
        subject: subjectName,
        difficulty: 'medium',
        points: 1,
        options: [`${x}`, `${x + 1}`, `${Math.max(1, x - 1)}`, `${x + 2}`],
        correctOptionIndex: 0,
        explanation: `Subtract ${b} from both sides: ${a}x = ${c - b}. Divide by ${a}: x = ${x}.`,
        learningTip: 'Isolate the variable term first, then divide by the coefficient.',
      });
    } else if (variant === 1) {
      // Arithmetic order of operations
      const n1 = (Math.floor(Math.random() * 6) + 2) * 2;
      const n2 = Math.floor(Math.random() * 8) + 3;
      const n3 = Math.floor(Math.random() * 12) + 5;
      const answer = n1 * 2 + n2 - n3;
      return randomizeQuestionOptions({
        id: randomId,
        type: 'mcq',
        question: `Evaluate the expression: (${n1} × 2) + ${n2} - ${n3}`,
        topic: topicName,
        subject: subjectName,
        difficulty: 'easy',
        points: 1,
        options: [`${answer}`, `${answer + 4}`, `${answer - 3}`, `${answer + 10}`],
        correctOptionIndex: 0,
        explanation: `Step 1: (${n1} × 2) = ${n1 * 2}. Step 2: ${n1 * 2} + ${n2} = ${n1 * 2 + n2}. Step 3: Subtract ${n3} gives ${answer}.`,
        learningTip: 'Follow PEMDAS / BODMAS: Parentheses first, then multiplication, then addition/subtraction.',
      });
    } else if (variant === 2) {
      // Fractions multiplication
      const num1 = Math.floor(Math.random() * 3) + 1;
      const den1 = num1 + Math.floor(Math.random() * 3) + 2;
      const num2 = Math.floor(Math.random() * 3) + 2;
      const den2 = num2 + Math.floor(Math.random() * 4) + 1;
      const rawNum = num1 * num2;
      const rawDen = den1 * den2;
      return randomizeQuestionOptions({
        id: randomId,
        type: 'mcq',
        question: `Multiply the fractions: (${num1}/${den1}) × (${num2}/${den2})`,
        topic: topicName,
        subject: subjectName,
        difficulty: 'medium',
        points: 1,
        options: [
          `${rawNum}/${rawDen}`,
          `${num1 + num2}/${den1 + den2}`,
          `${rawNum + 2}/${rawDen}`,
          `${num1 * den2}/${num2 * den1}`,
        ],
        correctOptionIndex: 0,
        explanation: `Multiply the numerators (${num1} × ${num2} = ${rawNum}) and multiply denominators (${den1} × ${den2} = ${rawDen}).`,
        learningTip: 'To multiply fractions, multiply straight across top and bottom.',
      });
    } else if (variant === 3) {
      // Percentage calculation
      const p = (Math.floor(Math.random() * 4) + 1) * 10; // 10%, 20%, 30%, 40%
      const base = (Math.floor(Math.random() * 8) + 2) * 50; // 100, 150, 200...
      const ans = (p / 100) * base;
      return randomizeQuestionOptions({
        id: randomId,
        type: 'mcq',
        question: `Calculate ${p}% of ${base}.`,
        topic: topicName,
        subject: subjectName,
        difficulty: 'easy',
        points: 1,
        options: [`${ans}`, `${ans + 15}`, `${ans - 10}`, `${Math.round(ans * 1.5)}`],
        correctOptionIndex: 0,
        explanation: `${p}% = ${p / 100}. Multiplying ${p / 100} × ${base} = ${ans}.`,
        learningTip: 'Divide the percentage by 100, then multiply by the total number.',
      });
    } else {
      // Geometry: Rectangle area
      const length = Math.floor(Math.random() * 9) + 4;
      const width = Math.floor(Math.random() * 5) + 3;
      const area = length * width;
      return randomizeQuestionOptions({
        id: randomId,
        type: 'mcq',
        question: `A rectangular field has length ${length} m and width ${width} m. What is its total area?`,
        topic: topicName,
        subject: subjectName,
        difficulty: 'easy',
        points: 1,
        options: [`${area} m²`, `${2 * (length + width)} m²`, `${area + length} m²`, `${length * 2 + width} m²`],
        correctOptionIndex: 0,
        explanation: `Area = length × width = ${length} × ${width} = ${area} square meters.`,
        learningTip: 'Perimeter is the boundary (2L + 2W); Area is the internal surface (L × W).',
      });
    }
  }

  if (isScience) {
    const sciencePool = [
      {
        question: `Which fundamental law of physics states that for every action force, there is an equal and opposite reaction force?`,
        options: [`Newton's Third Law of Motion`, `Newton's First Law of Inertia`, `Law of Universal Gravitation`, `Ohm's Law`],
        explanation: `Newton's Third Law states that every action produces a simultaneous force of equal magnitude and opposite direction.`,
        tip: 'Think of pushing off a boat: the boat moves backward while you move forward.',
      },
      {
        question: `In animal and plant cell biology, which organelle is commonly referred to as the "powerhouse of the cell"?`,
        options: [`Mitochondria`, `Endoplasmic Reticulum`, `Ribosome`, `Golgi Apparatus`],
        explanation: `Mitochondria synthesize the vast majority of chemical ATP energy through cellular respiration.`,
        tip: 'ATP = Adenosine Triphosphate, the cellular energy currency.',
      },
      {
        question: `What phase change occurs when a substance transitions directly from a solid state to a gas without turning into liquid?`,
        options: [`Sublimation`, `Evaporation`, `Condensation`, `Deposition`],
        explanation: `Sublimation is the direct transition from solid to gaseous state, as seen in dry ice (solid CO2).`,
        tip: 'Dry ice sublimates into gaseous vapor at room temperature.',
      },
      {
        question: `What type of chemical bonding involves the transfer of valence electrons from a metal atom to a non-metal atom?`,
        options: [`Ionic bonding`, `Covalent bonding`, `Metallic bonding`, `Hydrogen bonding`],
        explanation: `Ionic bonds form through electrostatic attraction between oppositely charged ions created by electron transfer.`,
        tip: 'Table salt (NaCl) is a classic example of an ionic lattice.',
      },
      {
        question: `Which ecosystem organism category breaks down dead organic matter and returns nutrients to the soil?`,
        options: [`Decomposers (fungi and bacteria)`, `Apex predators`, `Primary producers`, `Herbivores`],
        explanation: `Decomposers recycle vital nitrogen, phosphorus, and carbon by breaking down decaying organic tissues.`,
        tip: 'Without decomposers, organic matter would accumulate indefinitely.',
      },
    ];
    const picked = sciencePool[Math.floor(Math.random() * sciencePool.length)];
    return randomizeQuestionOptions({
      id: randomId,
      type: 'mcq',
      question: picked.question,
      topic: topicName,
      subject: subjectName,
      difficulty: 'medium',
      points: 1,
      options: picked.options,
      correctOptionIndex: 0,
      explanation: picked.explanation,
      learningTip: picked.tip,
    });
  }

  if (isEnglish) {
    const englishPool = [
      {
        question: `Identify the sentence that uses a semicolon correctly to connect two related independent clauses:`,
        options: [
          `The library was silent; everyone was focused on their exams.`,
          `The library was silent; and everyone was studying.`,
          `Because the library was silent; everyone left early.`,
          `The library was silent; although it was open.`,
        ],
        explanation: `A semicolon joins two independent clauses without needing a coordinating conjunction (like 'and' or 'but').`,
        tip: 'Both halves on either side of the semicolon must be complete sentences on their own.',
      },
      {
        question: `Choose the sentence with correct apostrophe usage for possession:`,
        options: [
          `The students' science projects were displayed in the main hall.`,
          `The student's were excited to present their projects.`,
          `The students projects' were praised by the principal.`,
          `The student's projects was very impressive.`,
        ],
        explanation: `For a plural noun ending in -s (students), place the apostrophe after the s to indicate plural possession.`,
        tip: 'Singular: student\'s book. Plural: students\' books.',
      },
      {
        question: `Which of the following sentences is written in the active voice?`,
        options: [
          `The engineer designed an innovative solar collector.`,
          `An innovative solar collector was designed by the engineer.`,
          `The solar collector has been tested by the team.`,
          `Safety protocols were reviewed by the laboratory manager.`,
        ],
        explanation: `In active voice, the subject (the engineer) performs the action (designed) directly on the object.`,
        tip: 'Active voice is usually more concise and energetic than passive voice.',
      },
      {
        question: `Select the word that correctly functions as an adverb modifying a verb:`,
        options: [
          `The soprano sang beautifully during the final recital.`,
          `The soprano sang beautiful during the final recital.`,
          `The soprano sang beauty during the final recital.`,
          `The soprano sang beauteous during the final recital.`,
        ],
        explanation: `"Beautifully" is the adverb describing the manner in which she sang (the verb).`,
        tip: 'Adverbs often end in -ly and answer "how", "when", or "where".',
      },
    ];
    const picked = englishPool[Math.floor(Math.random() * englishPool.length)];
    return randomizeQuestionOptions({
      id: randomId,
      type: 'mcq',
      question: picked.question,
      topic: topicName,
      subject: subjectName,
      difficulty: 'medium',
      points: 1,
      options: picked.options,
      correctOptionIndex: 0,
      explanation: picked.explanation,
      learningTip: picked.tip,
    });
  }

  // Social Studies & General
  const generalPool = [
    {
      question: `What is the primary function of the legislative branch in a democratic constitutional system?`,
      options: [
        `To draft, debate, and enact statutory laws`,
        `To enforce executive decrees and command defense forces`,
        `To interpret judicial rulings and preside over appeals`,
        `To conduct international trade treaties without oversight`,
      ],
      explanation: `The legislative branch (Parliament / Congress) holds the constitutional power to debate and pass laws.`,
      tip: 'Legislative = Makes laws; Executive = Enforces laws; Judicial = Interprets laws.',
    },
    {
      question: `Which imaginary line of latitude demarcates zero degrees latitude, dividing Earth into Northern and Southern Hemispheres?`,
      options: [`The Equator`, `The Prime Meridian`, `Tropic of Cancer`, `Tropic of Capricorn`],
      explanation: `The Equator is the 0° parallel of latitude encircling the center of the globe.`,
      tip: 'The Prime Meridian is 0° longitude (vertical), whereas the Equator is 0° latitude (horizontal).',
    },
    {
      question: `Which economic principle states that when the supply of a product decreases while consumer demand remains constant, the price tends to rise?`,
      options: [`The Law of Supply and Demand`, `The Law of Diminishing Returns`, `Inflation Indexing`, `Comparative Advantage`],
      explanation: `Scarcity in supply relative to sustained demand drives competitive market pricing upward.`,
      tip: 'High demand + low supply = higher prices.',
    },
  ];
  const picked = generalPool[Math.floor(Math.random() * generalPool.length)];
  return randomizeQuestionOptions({
    id: randomId,
    type: 'mcq',
    question: picked.question,
    topic: topicName,
    subject: subjectName,
    difficulty: 'medium',
    points: 1,
    options: picked.options,
    correctOptionIndex: 0,
    explanation: picked.explanation,
    learningTip: picked.tip,
  });
}

/**
 * Extracts and curates exactly 10 questions for a student practice/drilling session.
 * Always dynamically randomizes from the school database (Question Bank & Quizzes)
 * and guarantees a unique, randomized question set with shuffled answer choices every time.
 */
export function extractPracticeQuestions(
  topicName: string,
  subjectName: string,
  questionBank: QuestionBankItem[],
  quizzes: Quiz[],
  options?: {
    excludeIds?: string[];
    seed?: number | string;
  }
): InteractivePracticeQuestion[] {
  const normalizedTopic = topicName.toLowerCase();
  const topicTokens = normalizedTopic
    .split(/[\s,&/\\-]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3 && !['the', 'and', 'for', 'with', 'from', 'area', 'unit', 'part', 'core'].includes(w));

  const excludeSet = new Set(options?.excludeIds || []);

  const tier1TopicMatches: InteractivePracticeQuestion[] = [];
  const tier2SubjectMatches: InteractivePracticeQuestion[] = [];
  const tier3OtherMatches: InteractivePracticeQuestion[] = [];

  const seenQuestionTexts = new Set<string>();

  const isTopicMatch = (text: string, tags?: string[]): boolean => {
    const lower = text.toLowerCase();
    if (lower.includes(normalizedTopic) || normalizedTopic.includes(lower)) return true;
    if (topicTokens.some((token) => lower.includes(token))) return true;
    if (tags && tags.some((t) => topicTokens.some((token) => t.toLowerCase().includes(token)))) return true;
    return false;
  };

  // 1. Gather all candidates from Question Bank
  questionBank.forEach((q) => {
    const qSubject = (q.subject || '').toLowerCase();
    const targetSubject = subjectName.toLowerCase();
    const isSameSubject = qSubject === targetSubject || qSubject.includes(targetSubject) || targetSubject.includes(qSubject);
    const matchesTopic = isTopicMatch(q.topic + ' ' + q.question, q.tags);

    let practiceItem: InteractivePracticeQuestion | null = null;

    if (q.type === 'mcq' && q.options && q.options.length >= 2) {
      practiceItem = {
        id: `qb-${q.id}`,
        type: 'mcq',
        question: q.question,
        topic: q.topic || topicName,
        subject: q.subject || subjectName,
        difficulty: q.difficulty || 'medium',
        points: q.points || 1,
        options: q.options,
        correctOptionIndex: q.correctAnswerIndex ?? 0,
        explanation: q.explanation || 'Step-by-step verification from the school Question Bank.',
        learningTip: `From Question Bank: ${q.topic}`,
      };
    } else if ((q.type === 'structure' || q.type === 'fill_in_blank') && (q.acceptableAnswers?.length || q.modelAnswer)) {
      practiceItem = {
        id: `qb-${q.id}`,
        type: 'structure',
        question: q.question,
        topic: q.topic || topicName,
        subject: q.subject || subjectName,
        difficulty: q.difficulty || 'medium',
        points: q.points || 1,
        correctAnswerText: q.modelAnswer || q.acceptableAnswers?.[0],
        acceptableAnswers: q.acceptableAnswers,
        explanation: q.explanation || q.guidelines || 'Verify keyword matches against model rubric.',
        learningTip: `From Question Bank: ${q.topic}`,
      };
    } else if (q.type === 'matching' && q.matchingPairs && q.matchingPairs.length >= 2) {
      practiceItem = {
        id: `qb-${q.id}`,
        type: 'matching',
        question: q.question,
        topic: q.topic || topicName,
        subject: q.subject || subjectName,
        difficulty: q.difficulty || 'medium',
        points: q.points || 1,
        matchingPairs: q.matchingPairs,
        explanation: q.explanation || 'Connect corresponding concept pairs accurately.',
        learningTip: `From Question Bank: ${q.topic}`,
      };
    }

    if (practiceItem) {
      if (matchesTopic) {
        tier1TopicMatches.push(practiceItem);
      } else if (isSameSubject) {
        tier2SubjectMatches.push(practiceItem);
      } else {
        tier3OtherMatches.push(practiceItem);
      }
    }
  });

  // 2. Gather all candidates from Quizzes in database
  quizzes.forEach((quiz) => {
    const quizSubj = (quiz.subject || '').toLowerCase();
    const targetSubj = subjectName.toLowerCase();
    const isSameSubject = quizSubj === targetSubj || quizSubj.includes(targetSubj) || targetSubj.includes(quizSubj);
    const quizMatchesTopic = isTopicMatch(quiz.title + ' ' + (quiz.description || ''));

    quiz.questions.forEach((q) => {
      const qMatchesTopic = quizMatchesTopic || isTopicMatch(q.topic || '' + ' ' + q.question);

      let practiceItem: InteractivePracticeQuestion | null = null;

      if (q.type === 'mcq' && q.options && q.options.length >= 2) {
        practiceItem = {
          id: `quiz-q-${q.id}`,
          type: 'mcq',
          question: q.question,
          topic: q.topic || quiz.title || topicName,
          subject: quiz.subject || subjectName,
          difficulty: q.difficulty || 'medium',
          points: q.points || 1,
          options: q.options,
          correctOptionIndex: q.correctAnswerIndex ?? 0,
          explanation: q.explanation || 'Verified assessment item from classroom curriculum.',
          learningTip: `From Assessment: ${quiz.title}`,
        };
      } else if ((q.type === 'structure' || q.type === 'fill_in_blank') && (q.acceptableAnswers?.length || q.modelAnswer)) {
        practiceItem = {
          id: `quiz-q-${q.id}`,
          type: 'structure',
          question: q.question,
          topic: q.topic || quiz.title || topicName,
          subject: quiz.subject || subjectName,
          difficulty: q.difficulty || 'medium',
          points: q.points || 1,
          correctAnswerText: q.modelAnswer || q.acceptableAnswers?.[0],
          acceptableAnswers: q.acceptableAnswers,
          explanation: q.explanation || q.guidelines || 'Consult step-by-step marking rubric.',
          learningTip: `From Assessment: ${quiz.title}`,
        };
      } else if (q.type === 'matching' && q.matchingPairs && q.matchingPairs.length >= 2) {
        practiceItem = {
          id: `quiz-q-${q.id}`,
          type: 'matching',
          question: q.question,
          topic: q.topic || quiz.title || topicName,
          subject: quiz.subject || subjectName,
          difficulty: q.difficulty || 'medium',
          points: q.points || 1,
          matchingPairs: q.matchingPairs,
          explanation: q.explanation || 'Match terms on the left to definitions on the right.',
          learningTip: `From Assessment: ${quiz.title}`,
        };
      }

      if (practiceItem) {
        if (qMatchesTopic) {
          tier1TopicMatches.push(practiceItem);
        } else if (isSameSubject) {
          tier2SubjectMatches.push(practiceItem);
        } else {
          tier3OtherMatches.push(practiceItem);
        }
      }
    });
  });

  // 3. Find curated topic preset items
  let presetList: InteractivePracticeQuestion[] = [];
  if (normalizedTopic.includes('fraction') || normalizedTopic.includes('ratio') || normalizedTopic.includes('operation') || normalizedTopic.includes('arithmetic')) {
    presetList = TOPIC_PRESETS.fractions || [];
  } else if (normalizedTopic.includes('photo') || normalizedTopic.includes('plant') || normalizedTopic.includes('bio') || normalizedTopic.includes('cell') || normalizedTopic.includes('chloroplast')) {
    presetList = TOPIC_PRESETS.photosynthesis || [];
  } else if (normalizedTopic.includes('verb') || normalizedTopic.includes('grammar') || normalizedTopic.includes('tense') || normalizedTopic.includes('english') || normalizedTopic.includes('clause')) {
    presetList = TOPIC_PRESETS.grammar || [];
  } else if (normalizedTopic.includes('capital') || normalizedTopic.includes('geography') || normalizedTopic.includes('continent') || normalizedTopic.includes('world') || normalizedTopic.includes('social') || normalizedTopic.includes('ocean')) {
    presetList = TOPIC_PRESETS.geography || [];
  }

  // 4. RANDOMIZE & SHUFFLE CANDIDATES
  // First, prioritize items not recently excluded, but allow them if total candidates are limited
  const filterExcluded = (list: InteractivePracticeQuestion[]) => {
    const unread = list.filter((item) => !excludeSet.has(item.id));
    return unread.length >= 5 ? unread : list;
  };

  const shuffledTier1 = shuffleArray(filterExcluded(tier1TopicMatches));
  const shuffledTier2 = shuffleArray(filterExcluded(tier2SubjectMatches));
  const shuffledPresets = shuffleArray(filterExcluded(presetList));
  const shuffledTier3 = shuffleArray(filterExcluded(tier3OtherMatches));

  const result: InteractivePracticeQuestion[] = [];

  const addCandidates = (pool: InteractivePracticeQuestion[]) => {
    for (const q of pool) {
      if (result.length >= 10) break;
      const key = q.question.trim().toLowerCase();
      if (!seenQuestionTexts.has(key)) {
        seenQuestionTexts.add(key);
        // Randomize the choices order for MCQ questions so the correct answer is not in a fixed position
        result.push(randomizeQuestionOptions(q));
      }
    }
  };

  // Step 1: Add shuffled tier 1 topic questions from Question Bank & Quizzes
  addCandidates(shuffledTier1);

  // Step 2: Add shuffled curated topic preset questions
  addCandidates(shuffledPresets);

  // Step 3: Add shuffled subject questions from database
  addCandidates(shuffledTier2);

  // Step 4: Add other database questions if needed
  if (result.length < 10) {
    addCandidates(shuffledTier3);
  }

  // Step 5: If still under 10, generate procedurally randomized questions
  let proceduralIndex = 1;
  while (result.length < 10) {
    const generated = generateProceduralRandomQuestion(proceduralIndex, topicName, subjectName);
    const key = generated.question.trim().toLowerCase();
    if (!seenQuestionTexts.has(key)) {
      seenQuestionTexts.add(key);
      result.push(generated);
    }
    proceduralIndex++;
    if (proceduralIndex > 25) break; // safety guard
  }

  // Final shuffle of the 10 selected questions so question types/topics are interleaved
  return shuffleArray(result.slice(0, 10));
}
