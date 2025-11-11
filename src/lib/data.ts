export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Prerequisite {
  topicId: string;
  weight: number; // 0-1, importance of this prerequisite
  requiredMastery: number; // 0-1, minimum mastery needed
}

export interface Topic {
  id: string;
  name: string;
  prerequisites: Prerequisite[];
  difficulty: Difficulty;
  mastery: number; // 0 to 1
  lastPracticed: number | null; // timestamp
  impactScore?: number; // 0-1, how much this topic impacts future learning
  estimatedTime?: number; // in minutes
  category?: string;
  tags?: string[];
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  strategy: 'fastest' | 'mostThorough' | 'examFocused';
  topics: string[]; // array of topic IDs in order
  estimatedTime: number; // in minutes
  confidence: number; // 0-1, confidence in this path's effectiveness
}

export interface Problem {
  id: string;
  question: string;
  answer: string;
  solution: string;
  requiredTopics: string[]; // Array of topic IDs
  difficulty: Difficulty;
  hints: string[];
  timeEstimate?: number; // in minutes
  commonMistakes?: string[];
  relatedTopics?: string[]; // Topics that would benefit from this problem
}

// Topics data
export const topics: Topic[] = [
  {
    id: 'basic_arithmetic',
    name: 'Basic Arithmetic',
    prerequisites: [],
    difficulty: 'easy',
    mastery: 0,
    lastPracticed: null,
    impactScore: 0.9,
    estimatedTime: 30,
    category: 'Foundations',
    tags: ['arithmetic', 'basics']
  },
  {
    id: 'fractions',
    name: 'Fractions',
    prerequisites: [
      { topicId: 'basic_arithmetic', weight: 0.8, requiredMastery: 0.7 }
    ],
    difficulty: 'easy',
    mastery: 0,
    lastPracticed: null,
    impactScore: 0.85,
    estimatedTime: 45,
    category: 'Number Sense',
    tags: ['fractions', 'basics']
  },
  {
    id: 'basic_algebra',
    name: 'Basic Algebra',
    prerequisites: [
      { topicId: 'basic_arithmetic', weight: 0.9, requiredMastery: 0.8 },
      { topicId: 'fractions', weight: 0.7, requiredMastery: 0.6 }
    ],
    difficulty: 'medium',
    mastery: 0,
    lastPracticed: null,
    impactScore: 0.95,
    estimatedTime: 60,
    category: 'Algebra',
    tags: ['algebra', 'equations']
  },
  {
    id: 'geometry',
    name: 'Geometry',
    prerequisites: [
      { topicId: 'basic_arithmetic', weight: 0.7, requiredMastery: 0.6 },
      { topicId: 'fractions', weight: 0.6, requiredMastery: 0.5 }
    ],
    difficulty: 'medium',
    mastery: 0,
    lastPracticed: null,
    impactScore: 0.75,
    estimatedTime: 90,
    category: 'Geometry',
    tags: ['shapes', 'measurement']
  },
  {
    id: 'intermediate_algebra',
    name: 'Intermediate Algebra',
    prerequisites: [
      { topicId: 'basic_algebra', weight: 0.9, requiredMastery: 0.8 },
      { topicId: 'geometry', weight: 0.5, requiredMastery: 0.4 }
    ],
    difficulty: 'hard',
    mastery: 0,
    lastPracticed: null,
    impactScore: 0.85,
    estimatedTime: 120,
    category: 'Algebra',
    tags: ['algebra', 'functions', 'graphing']
  },
  {
    id: 'word_problems',
    name: 'Word Problems',
    prerequisites: [
      { topicId: 'basic_arithmetic', weight: 0.8, requiredMastery: 0.7 },
      { topicId: 'basic_algebra', weight: 0.7, requiredMastery: 0.6 }
    ],
    difficulty: 'hard',
    mastery: 0,
    lastPracticed: null,
    impactScore: 0.8,
    estimatedTime: 90,
    category: 'Problem Solving',
    tags: ['word problems', 'applications']
  }
];

// Problems data
export const problems: Problem[] = [
  // ===== Basic Arithmetic (Easy) =====
  {
    id: 'add1',
    question: 'What is 2 + 2?',
    answer: '4',
    solution: 'Step 1: Start with 2\nStep 2: Add 2 more\nStep 3: 2 + 2 = 4',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Start with 2 and add 2 more.', 'Count on your fingers if needed.']
  },
  {
    id: 'add2',
    question: 'Calculate 15 + 27',
    answer: '42',
    solution: 'Step 1: Add the ones place: 5 + 7 = 12\nStep 2: Write down 2, carry over 1\nStep 3: Add the tens place: 1 + 2 + 1 (carry) = 4\nStep 4: Final answer is 42',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Add the ones place first, then the tens.', 'Remember to carry over if the sum is 10 or more.']
  },
  {
    id: 'sub1',
    question: 'What is 10 - 7?',
    answer: '3',
    solution: 'Step 1: Start with 10\nStep 2: Take away 7\nStep 3: 10 - 7 = 3',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Start with 10 and take away 7.', 'Count backwards if needed.']
  },
  {
    id: 'mult1',
    question: 'What is 6 × 7?',
    answer: '42',
    solution: 'Step 1: Recall multiplication table for 6\nStep 2: 6 × 7 = 42',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Remember your multiplication tables.', '6 × 7 is the same as 6 + 6 + 6 + 6 + 6 + 6 + 6']
  },
  {
    id: 'div1',
    question: 'What is 24 ÷ 6?',
    answer: '4',
    solution: 'Step 1: Think how many times 6 goes into 24\nStep 2: 6 × 4 = 24\nStep 3: So, 24 ÷ 6 = 4',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['How many times does 6 go into 24?', 'Think of the multiplication fact that gives 24 with 6 as one of the numbers.']
  },
  
  // ===== Basic Arithmetic (Medium) =====
  {
    id: 'arith1',
    question: 'Calculate: 15 - (7 + 3) × 2',
    answer: '-5',
    solution: 'Step 1: Solve inside parentheses first: 7 + 3 = 10\nStep 2: Perform multiplication: 10 × 2 = 20\nStep 3: Finally subtract: 15 - 20 = -5',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'medium',
    hints: ['Remember PEMDAS/BODMAS order of operations.', 'Parentheses first, then multiplication, then subtraction.']
  },
  {
    id: 'arith2',
    question: 'What is 3.5 × 4.2?',
    answer: '14.7',
    solution: 'Step 1: Multiply as whole numbers: 35 × 42 = 1470\nStep 2: Count decimal places: 1 + 1 = 2\nStep 3: Place decimal point two places from right: 14.70',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'medium',
    hints: ['Multiply as whole numbers first, then place the decimal.']
  },
  
  // ===== Fractions (Easy) =====
  {
    id: 'frac1',
    question: 'What is 1/2 + 1/2?',
    answer: '1',
    solution: 'Step 1: The denominators are the same (2)\nStep 2: Add the numerators: 1 + 1 = 2\nStep 3: 2/2 = 1',
    requiredTopics: ['fractions'],
    difficulty: 'easy',
    hints: ['Add the numerators, keep the denominator the same.', '2/2 is the same as 1 whole.']
  },
  {
    id: 'frac2',
    question: 'Simplify 4/8',
    answer: '1/2',
    solution: 'Step 1: Find GCD of 4 and 8, which is 4\nStep 2: Divide numerator and denominator by 4\nStep 3: 4÷4 = 1, 8÷4 = 2\nStep 4: Simplified form is 1/2',
    requiredTopics: ['fractions'],
    difficulty: 'easy',
    hints: ['Find the greatest common divisor of 4 and 8.', 'What is the largest number that divides both 4 and 8?']
  },
  {
    id: 'frac2a',
    question: 'Convert 0.75 to a fraction in simplest form',
    answer: '3/4',
    solution: 'Step 1: Write as 75/100\nStep 2: Simplify by dividing numerator and denominator by 25\nStep 3: 75÷25 = 3, 100÷25 = 4\nStep 4: Simplified form is 3/4',
    requiredTopics: ['fractions'],
    difficulty: 'easy',
    hints: ['0.75 is the same as 75/100', 'Simplify by dividing numerator and denominator by 25']
  },
  
  // ===== Fractions (Medium) =====
  {
    id: 'frac3',
    question: 'What is 1/2 + 1/3?',
    answer: '5/6',
    solution: 'Step 1: Find LCD of 2 and 3, which is 6\nStep 2: Convert fractions: 1/2 = 3/6, 1/3 = 2/6\nStep 3: Add numerators: 3 + 2 = 5\nStep 4: 5/6 is already in simplest form',
    requiredTopics: ['fractions'],
    difficulty: 'medium',
    hints: ['Find the least common denominator of 2 and 3.', 'Convert both fractions to have denominator 6.']
  },
  {
    id: 'frac4',
    question: 'Multiply: 2/3 × 3/4',
    answer: '1/2',
    solution: 'Step 1: Multiply numerators: 2 × 3 = 6\nStep 2: Multiply denominators: 3 × 4 = 12\nStep 3: 6/12 simplifies to 1/2\nStep 4: Final answer is 1/2',
    requiredTopics: ['fractions'],
    difficulty: 'medium',
    hints: ['Multiply numerators together and denominators together.', 'Simplify the resulting fraction.']
  },
  {
    id: 'frac5',
    question: 'Divide: 2/3 ÷ 4/5',
    answer: '5/6',
    solution: 'Step 1: Keep first fraction: 2/3\nStep 2: Change ÷ to × and flip second fraction: 5/4\nStep 3: Multiply: (2×5)/(3×4) = 10/12\nStep 4: Simplify: 5/6',
    requiredTopics: ['fractions'],
    difficulty: 'medium',
    hints: ['Keep, change, flip!', 'Multiply by the reciprocal of the second fraction.']
  },
  
  // ===== Basic Algebra (Easy) =====
  {
    id: 'alg1',
    question: 'Solve for x: x + 3 = 7',
    answer: '4',
    solution: 'Step 1: We have x + 3 = 7\nStep 2: Subtract 3 from both sides: x = 7 - 3\nStep 3: x = 4',
    requiredTopics: ['basic_algebra'],
    difficulty: 'easy',
    hints: ['What number added to 3 gives 7?', 'Do the opposite operation to both sides.']
  },
  {
    id: 'alg2',
    question: 'Simplify: 2x + 3x',
    answer: '5x',
    solution: 'Step 1: Identify like terms (both have x)\nStep 2: Add coefficients: 2 + 3 = 5\nStep 3: Keep the variable: 5x',
    requiredTopics: ['basic_algebra'],
    difficulty: 'easy',
    hints: ['Add the coefficients of like terms.', '2x means 2 times x']
  },
  
  // ===== Basic Algebra (Medium) =====
  {
    id: 'alg3',
    question: 'Solve: 2(x + 3) = 10',
    answer: '2',
    solution: 'Step 1: Divide both sides by 2: x + 3 = 5\nStep 2: Subtract 3 from both sides: x = 5 - 3\nStep 3: x = 2',
    requiredTopics: ['basic_algebra'],
    difficulty: 'medium',
    hints: ['First divide both sides by 2 to simplify.', 'Then solve for x.']
  },
  {
    id: 'alg4',
    question: 'Solve the system: x + y = 5, x - y = 1',
    answer: 'x=3,y=2',
    solution: 'Step 1: Add the equations: 2x = 6\nStep 2: Solve for x: x = 3\nStep 3: Substitute x=3 into first equation: 3 + y = 5\nStep 4: Solve for y: y = 2',
    requiredTopics: ['basic_algebra'],
    difficulty: 'medium',
    hints: ['Add the two equations to eliminate y.', 'Then solve for x and substitute back.']
  },
  
  // ===== Geometry (Easy) =====
  {
    id: 'geo1',
    question: 'Find the area of a rectangle with length 5 and width 3',
    answer: '15',
    solution: 'Step 1: Area formula for rectangle: length × width\nStep 2: Substitute values: 5 × 3 = 15\nStep 3: Include units: 15 square units',
    requiredTopics: ['geometry'],
    difficulty: 'easy',
    hints: ['Multiply length by width.', 'Area is always in square units.']
  },
  {
    id: 'geo2',
    question: 'Find the perimeter of a square with side length 4',
    answer: '16',
    solution: 'Step 1: Perimeter formula for square: 4 × side\nStep 2: Substitute value: 4 × 4 = 16\nStep 3: Include units: 16 units',
    requiredTopics: ['geometry'],
    difficulty: 'easy',
    hints: ['Add all four sides or multiply one side by 4.', 'All sides of a square are equal.']
  },
  
  // ===== Geometry (Medium) =====
  {
    id: 'geo3',
    question: 'Find the area of a triangle with base 6 and height 4',
    answer: '12',
    solution: 'Step 1: Area formula for triangle: (base × height)/2\nStep 2: Substitute values: (6 × 4)/2 = 24/2 = 12\nStep 3: Include units: 12 square units',
    requiredTopics: ['geometry'],
    difficulty: 'medium',
    hints: ['Use the formula: area = 1/2 × base × height', 'Remember to divide by 2 at the end.']
  },
  {
    id: 'geo4',
    question: 'Find the circumference of a circle with radius 7 (use π = 22/7)',
    answer: '44',
    solution: 'Step 1: Circumference formula: 2πr\nStep 2: Substitute values: 2 × (22/7) × 7 = 2 × 22 = 44\nStep 3: Include units: 44 units',
    requiredTopics: ['geometry'],
    difficulty: 'medium',
    hints: ['Use the formula C = 2πr', 'The radius is half the diameter.']
  },
  
  // ===== Word Problems (Medium) =====
  {
    id: 'word1',
    question: 'If a train travels 60 miles in 1 hour, how far will it travel in 3 hours?',
    answer: '180',
    solution: 'Step 1: Identify speed = 60 mph, time = 3 hours\nStep 2: Use formula: distance = speed × time\nStep 3: Calculate: 60 × 3 = 180\nStep 4: Include units: 180 miles',
    requiredTopics: ['word_problems'],
    difficulty: 'medium',
    hints: ['This is a distance = rate × time problem.', 'Multiply speed by time.']
  },
  {
    id: 'word2',
    question: 'A number increased by 7 is 12. What is the number?',
    answer: '5',
    solution: 'Step 1: Let the number be x\nStep 2: Form equation: x + 7 = 12\nStep 3: Solve for x: x = 12 - 7\nStep 4: x = 5',
    requiredTopics: ['word_problems'],
    difficulty: 'medium',
    hints: ['Translate words to equation.', 'What number plus 7 equals 12?']
  },
  
  // ===== Intermediate Algebra (Hard) =====
  {
    id: 'ialg1',
    question: 'Factor: x² - 5x + 6',
    answer: '(x-2)(x-3)',
    solution: 'Step 1: Look for two numbers that multiply to 6 and add to -5\nStep 2: -2 × -3 = 6 and -2 + (-3) = -5\nStep 3: Write factors: (x - 2)(x - 3)',
    requiredTopics: ['intermediate_algebra'],
    difficulty: 'hard',
    hints: ['Find two numbers that multiply to 6 and add to -5.', 'Both numbers must be negative.']
  },
  {
    id: 'ialg2',
    question: 'Solve the system: 2x + y = 5, x - y = 1',
    answer: 'x=2,y=1',
    solution: 'Step 1: Add the equations: 3x = 6\nStep 2: Solve for x: x = 2\nStep 3: Substitute x=2 into second equation: 2 - y = 1\nStep 4: Solve for y: y = 1',
    requiredTopics: ['intermediate_algebra'],
    difficulty: 'hard',
    hints: ['Add the equations to eliminate y.', 'Then solve for x and substitute back.']
  },
  {
    id: 'ialg3',
    question: 'Solve for x: 2x² - 8 = 0',
    answer: 'x=2,x=-2',
    solution: 'Step 1: Add 8 to both sides: 2x² = 8\nStep 2: Divide by 2: x² = 4\nStep 3: Take square root: x = ±2\nStep 4: Two solutions: x = 2 and x = -2',
    requiredTopics: ['intermediate_algebra'],
    difficulty: 'hard',
    hints: ['Isolate x² first, then take square root.', 'Remember there are two solutions.']
  },
  
  // ===== Word Problems (Hard) =====
  {
    id: 'word3',
    question: 'The sum of two numbers is 15 and their difference is 3. Find the numbers.',
    answer: '9,6',
    solution: 'Step 1: Let numbers be x and y\nStep 2: x + y = 15\nStep 3: x - y = 3\nStep 4: Add equations: 2x = 18 → x = 9\nStep 5: 9 + y = 15 → y = 6\nStep 6: Numbers are 9 and 6',
    requiredTopics: ['word_problems', 'intermediate_algebra'],
    difficulty: 'hard',
    hints: ['Set up two equations.', 'Add the equations to eliminate y.']
  },
  {
    id: 'word4',
    question: 'A rectangle has a length that is 3 more than twice its width. If the perimeter is 30, what are the dimensions?',
    answer: 'width=4,length=11',
    solution: 'Step 1: Let width be w\nStep 2: Length = 2w + 3\nStep 3: Perimeter = 2(w + l) = 30\nStep 4: Substitute length: 2(w + (2w + 3)) = 30\nStep 5: Solve for w: 6w + 6 = 30 → 6w = 24 → w = 4\nStep 6: Length = 2(4) + 3 = 11',
    requiredTopics: ['word_problems', 'intermediate_algebra', 'basic_algebra'],
    difficulty: 'hard',
    hints: ['Let w = width, then length = 2w + 3. Use perimeter formula.']
  },
  {
    id: 'word5',
    question: 'A train leaves station A at 60 mph. Two hours later, another train leaves station A at 80 mph going the same direction. How long until the second train catches up?',
    answer: '6',
    solution: 'Let t = time after second train leaves. Distance = speed × time. 60(t+2) = 80t → 60t + 120 = 80t → 120 = 20t → t = 6 hours',
    requiredTopics: ['word_problems', 'basic_algebra'],
    difficulty: 'hard',
    hints: ['The distance both trains travel will be equal when the second train catches up.']
  },
  {
    id: 'frac3',
    question: 'What is 3/4 × 2/3?',
    answer: '1/2',
    solution: 'Multiply numerators and denominators: (3×2)/(4×3) = 6/12 = 1/2',
    requiredTopics: ['fractions'],
    difficulty: 'medium',
    hints: ['Multiply numerators and denominators, then simplify.']
  },
  {
    id: 'frac4',
    question: 'Divide 5 by 1/2',
    answer: '10',
    solution: 'Dividing by a fraction is the same as multiplying by its reciprocal: 5 ÷ (1/2) = 5 × 2 = 10',
    requiredTopics: ['fractions'],
    difficulty: 'medium',
    hints: ['Dividing by 1/2 is the same as multiplying by 2.']
  },
  {
    id: 'geo3',
    question: 'Find the area of a triangle with base 6 and height 4',
    answer: '12',
    solution: 'Area = (base × height) / 2 = (6 × 4) / 2 = 12',
    requiredTopics: ['geometry'],
    difficulty: 'easy',
    hints: ['Use the formula: Area = (base × height) / 2']
  },
  {
    id: 'geo4',
    question: 'Find the volume of a cube with side length 3',
    answer: '27',
    solution: 'Volume = side³ = 3³ = 27',
    requiredTopics: ['geometry'],
    difficulty: 'easy',
    hints: ['Volume of a cube is side length cubed.']
  }
];

// Helper functions
export function getTopicById(id: string): Topic | undefined {
  return topics.find(topic => topic.id === id);
}

export function getProblemsByTopic(topicId: string): Problem[] {
  return problems.filter(problem => problem.requiredTopics.includes(topicId));
}

export function getRandomProblem(excludeIds: string[] = []): Problem {
  const availableProblems = problems.filter(p => !excludeIds.includes(p.id));
  const randomIndex = Math.floor(Math.random() * availableProblems.length);
  return availableProblems[randomIndex];
}
