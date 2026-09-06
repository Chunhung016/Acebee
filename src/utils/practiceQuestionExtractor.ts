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
 * Extracts and curates exactly 10 questions for a topic.
 * Prioritizes matching questions from the school Question Bank and Quizzes,
 * then fills seamlessly with topic-aligned curriculum questions to ensure
 * a complete, rigorous 10-question drill every time.
 */
export function extractPracticeQuestions(
  topicName: string,
  subjectName: string,
  questionBank: QuestionBankItem[],
  quizzes: Quiz[]
): InteractivePracticeQuestion[] {
  const normalizedTopic = topicName.toLowerCase();
  const collectedQuestions: InteractivePracticeQuestion[] = [];

  // 1. Gather exact or partial topic matches from Question Bank
  questionBank.forEach((q) => {
    if (
      q.topic.toLowerCase().includes(normalizedTopic) ||
      normalizedTopic.includes(q.topic.toLowerCase()) ||
      (q.subject && q.subject.toLowerCase() === subjectName.toLowerCase())
    ) {
      if (q.type === 'mcq' && q.options && q.options.length >= 2) {
        collectedQuestions.push({
          id: `qb-${q.id}`,
          type: q.type,
          question: q.question,
          topic: q.topic || topicName,
          subject: q.subject || subjectName,
          difficulty: q.difficulty || 'medium',
          points: q.points || 1,
          options: q.options,
          correctOptionIndex: q.correctAnswerIndex ?? 0,
          explanation: q.explanation || 'Review fundamental definitions and step-by-step logic.',
          learningTip: `Reinforce concepts from ${q.topic}`,
        });
      }
    }
  });

  // 2. Gather matching questions from quizzes
  quizzes.forEach((quiz) => {
    if (quiz.subject.toLowerCase() === subjectName.toLowerCase() || quiz.title.toLowerCase().includes(normalizedTopic)) {
      quiz.questions.forEach((q) => {
        if (q.type === 'mcq' && q.options && q.options.length >= 2) {
          // Avoid duplicate question text
          if (!collectedQuestions.some((item) => item.question.trim() === q.question.trim())) {
            collectedQuestions.push({
              id: `quiz-q-${q.id}`,
              type: q.type,
              question: q.question,
              topic: q.topic || quiz.title || topicName,
              subject: quiz.subject || subjectName,
              difficulty: q.difficulty || 'medium',
              points: q.points || 1,
              options: q.options,
              correctOptionIndex: q.correctAnswerIndex ?? 0,
              explanation: q.explanation || 'Verified curriculum item from class assessment.',
              learningTip: `From ${quiz.title}`,
            });
          }
        }
      });
    }
  });

  // 3. Find built-in curated preset matching theme
  let presetList: InteractivePracticeQuestion[] = [];
  if (normalizedTopic.includes('fraction') || normalizedTopic.includes('ratio') || normalizedTopic.includes('operation')) {
    presetList = TOPIC_PRESETS.fractions;
  } else if (normalizedTopic.includes('photo') || normalizedTopic.includes('plant') || normalizedTopic.includes('bio') || normalizedTopic.includes('cell')) {
    presetList = TOPIC_PRESETS.photosynthesis;
  } else if (normalizedTopic.includes('verb') || normalizedTopic.includes('grammar') || normalizedTopic.includes('tense') || normalizedTopic.includes('english')) {
    presetList = TOPIC_PRESETS.grammar;
  } else if (normalizedTopic.includes('capital') || normalizedTopic.includes('geography') || normalizedTopic.includes('continent') || normalizedTopic.includes('world') || normalizedTopic.includes('social')) {
    presetList = TOPIC_PRESETS.geography;
  }

  // Combine collected items with preset items
  const combined: InteractivePracticeQuestion[] = [];

  // Add matching collected questions
  for (const q of collectedQuestions) {
    if (!combined.some((item) => item.question.trim().toLowerCase() === q.question.trim().toLowerCase())) {
      combined.push(q);
      if (combined.length === 10) break;
    }
  }

  // If still under 10, fill from preset
  if (combined.length < 10 && presetList.length > 0) {
    for (const q of presetList) {
      if (!combined.some((item) => item.question.trim().toLowerCase() === q.question.trim().toLowerCase())) {
        combined.push({
          ...q,
          topic: topicName,
          subject: subjectName,
        });
        if (combined.length === 10) break;
      }
    }
  }

  // If still under 10 (or no preset matched), generate structured topical drill questions to reach exactly 10
  let counter = combined.length + 1;
  while (combined.length < 10) {
    const isMath = subjectName.toLowerCase().includes('math') || normalizedTopic.includes('math');
    const isScience = subjectName.toLowerCase().includes('scien') || normalizedTopic.includes('scien');
    
    let generated: InteractivePracticeQuestion;
    if (isMath) {
      const numA = 2 + counter * 3;
      const numB = 12 + counter * 2;
      generated = {
        id: `gen-math-${counter}-${Date.now()}`,
        type: 'mcq',
        question: `Practice Exercise ${counter}: Simplify and evaluate the expression (${numA} × 4) ÷ 2 within ${topicName}.`,
        topic: topicName,
        subject: subjectName,
        difficulty: counter % 2 === 0 ? 'medium' : 'hard',
        points: 1,
        options: [
          `${numA * 2}`,
          `${numA * 4}`,
          `${numA + 8}`,
          `${Math.floor(numA / 2)}`,
        ],
        correctOptionIndex: 0,
        explanation: `Using order of operations: (${numA} × 4) = ${numA * 4}, then dividing by 2 gives ${numA * 2}.`,
        learningTip: `Mastering foundational operations in ${topicName} ensures rapid problem-solving.`,
      };
    } else if (isScience) {
      generated = {
        id: `gen-sci-${counter}-${Date.now()}`,
        type: 'mcq',
        question: `Practice Concept ${counter}: In the study of ${topicName}, what is the primary hypothesis test used by researchers?`,
        topic: topicName,
        subject: subjectName,
        difficulty: counter % 2 === 0 ? 'medium' : 'easy',
        points: 1,
        options: [
          'Controlled experimentation with independent and dependent variables',
          'Speculative observation without recording data',
          'Measuring only subjective impressions',
          'Disregarding anomalous measurements',
        ],
        correctOptionIndex: 0,
        explanation: 'Scientific rigor requires isolating independent variables and measuring dependent changes against a control group.',
        learningTip: 'Always identify controls and variables in scientific investigations.',
      };
    } else {
      generated = {
        id: `gen-gen-${counter}-${Date.now()}`,
        type: 'mcq',
        question: `Review Challenge ${counter}: Which strategy is most effective when reinforcing understanding in ${topicName}?`,
        topic: topicName,
        subject: subjectName,
        difficulty: 'medium',
        points: 1,
        options: [
          'Active recall and practicing similar problem types repeatedly',
          'Skimming text once without testing yourself',
          'Memorizing answers without understanding underlying concepts',
          'Avoiding difficult questions',
        ],
        correctOptionIndex: 0,
        explanation: 'Cognitive science demonstrates that active retrieval and targeted drills build strong neural pathways for long-term mastery.',
        learningTip: `Consistently practice targeted questions to eliminate weak gaps in ${topicName}.`,
      };
    }

    combined.push(generated);
    counter++;
  }

  // Exactly 10 questions returned
  return combined.slice(0, 10);
}
