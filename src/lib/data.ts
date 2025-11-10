export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Topic {
  id: string;
  name: string;
  prerequisites: string[];
  difficulty: Difficulty;
  mastery: number; // 0 to 1
  lastPracticed: number | null; // timestamp
}

export interface Problem {
  id: string;
  question: string;
  answer: string;
  solution: string;
  requiredTopics: string[]; // Array of topic IDs
  difficulty: Difficulty;
  hints: string[];
}

// Topics data
export const topics: Topic[] = [
  {
    id: 'basic_arithmetic',
    name: 'Basic Arithmetic',
    prerequisites: [],
    difficulty: 'easy',
    mastery: 0,
    lastPracticed: null
  },
  {
    id: 'fractions',
    name: 'Fractions',
    prerequisites: ['basic_arithmetic'],
    difficulty: 'easy',
    mastery: 0,
    lastPracticed: null
  },
  {
    id: 'basic_algebra',
    name: 'Basic Algebra',
    prerequisites: ['basic_arithmetic', 'fractions'],
    difficulty: 'medium',
    mastery: 0,
    lastPracticed: null
  },
  {
    id: 'geometry',
    name: 'Geometry',
    prerequisites: ['basic_arithmetic', 'fractions'],
    difficulty: 'medium',
    mastery: 0,
    lastPracticed: null
  },
  {
    id: 'intermediate_algebra',
    name: 'Intermediate Algebra',
    prerequisites: ['basic_algebra', 'geometry'],
    difficulty: 'hard',
    mastery: 0,
    lastPracticed: null
  },
  {
    id: 'word_problems',
    name: 'Word Problems',
    prerequisites: ['basic_arithmetic', 'basic_algebra'],
    difficulty: 'hard',
    mastery: 0,
    lastPracticed: null
  }
];

// Problems data
export const problems: Problem[] = [
  // Basic Arithmetic
  {
    id: 'add1',
    question: 'What is 2 + 2?',
    answer: '4',
    solution: 'Add 2 and 2 together to get 4.',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Start with 2 and add 2 more.']
  },
  {
    id: 'add2',
    question: 'Calculate 15 + 27',
    answer: '42',
    solution: 'Add the ones place: 5 + 7 = 12. Write down 2, carry over 1. Add the tens place: 1 + 2 + 1 (carry) = 4. Final answer is 42.',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Add the ones place first, then the tens.']
  },
  {
    id: 'sub1',
    question: 'What is 10 - 7?',
    answer: '3',
    solution: 'Subtract 7 from 10 to get 3.',
    requiredTopics: ['basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Start with 10 and take away 7.']
  },
  
  // Fractions
  {
    id: 'frac1',
    question: 'What is 1/2 + 1/4?',
    answer: '3/4',
    solution: 'Find common denominator (4): 2/4 + 1/4 = 3/4',
    requiredTopics: ['fractions'],
    difficulty: 'easy',
    hints: ['Find a common denominator first.']
  },
  {
    id: 'frac2',
    question: 'Simplify 4/8',
    answer: '1/2',
    solution: 'Divide numerator and denominator by 4: 4/8 = 1/2',
    requiredTopics: ['fractions'],
    difficulty: 'easy',
    hints: ['What is the greatest common divisor of 4 and 8?']
  },
  
  // Basic Algebra
  {
    id: 'alg1',
    question: 'Solve for x: x + 5 = 12',
    answer: '7',
    solution: 'Subtract 5 from both sides: x = 12 - 5 = 7',
    requiredTopics: ['basic_algebra'],
    difficulty: 'easy',
    hints: ['Isolate x by moving 5 to the other side.']
  },
  {
    id: 'alg2',
    question: 'Solve for y: 2y - 4 = 10',
    answer: '7',
    solution: 'Add 4 to both sides: 2y = 14. Then divide by 2: y = 7',
    requiredTopics: ['basic_algebra'],
    difficulty: 'medium',
    hints: ['First add 4 to both sides, then divide by 2.']
  },
  
  // Geometry
  {
    id: 'geo1',
    question: 'What is the area of a rectangle with length 5 and width 3?',
    answer: '15',
    solution: 'Area = length × width = 5 × 3 = 15',
    requiredTopics: ['geometry'],
    difficulty: 'easy',
    hints: ['Multiply length by width.']
  },
  {
    id: 'geo2',
    question: 'What is the circumference of a circle with radius 4? (Use π = 3.14)',
    answer: '25.12',
    solution: 'Circumference = 2πr = 2 × 3.14 × 4 = 25.12',
    requiredTopics: ['geometry'],
    difficulty: 'medium',
    hints: ['Use the formula C = 2πr']
  },
  
  // Intermediate Algebra
  {
    id: 'ialg1',
    question: 'Factor x² - 9',
    answer: '(x+3)(x-3)',
    solution: 'This is a difference of squares: x² - 9 = (x+3)(x-3)',
    requiredTopics: ['intermediate_algebra'],
    difficulty: 'medium',
    hints: ['This is a difference of squares.']
  },
  {
    id: 'ialg2',
    question: 'Solve the system: 2x + y = 5, x - y = 1',
    answer: 'x=2,y=1',
    solution: 'Add the equations: 3x = 6 → x = 2. Substitute: 2 - y = 1 → y = 1',
    requiredTopics: ['intermediate_algebra'],
    difficulty: 'hard',
    hints: ['Try adding both equations together first.']
  },
  
  // Word Problems
  {
    id: 'word1',
    question: 'If a train travels 60 miles in 1 hour, how far will it travel in 3 hours?',
    answer: '180',
    solution: 'Distance = speed × time = 60 mph × 3 hours = 180 miles',
    requiredTopics: ['word_problems', 'basic_arithmetic'],
    difficulty: 'easy',
    hints: ['Multiply speed by time.']
  },
  {
    id: 'word2',
    question: 'A number increased by 7 is 15. What is the number?',
    answer: '8',
    solution: 'Let x be the number. x + 7 = 15 → x = 15 - 7 = 8',
    requiredTopics: ['word_problems', 'basic_algebra'],
    difficulty: 'easy',
    hints: ['Set up an equation where x + 7 = 15']
  },
  {
    id: 'word3',
    question: 'The sum of two consecutive integers is 25. What are the numbers?',
    answer: '12,13',
    solution: 'Let x be the first number, then x + (x+1) = 25 → 2x + 1 = 25 → 2x = 24 → x = 12. Numbers are 12 and 13.',
    requiredTopics: ['word_problems', 'basic_algebra'],
    difficulty: 'medium',
    hints: ['Let x be the first number, then the next number is x+1.']
  },
  {
    id: 'word4',
    question: 'A rectangle has a length that is 3 more than twice its width. If the perimeter is 30, what are the dimensions?',
    answer: 'width=4,length=11',
    solution: 'Let w = width, then length = 2w + 3. Perimeter = 2(w + l) = 30 → w + (2w + 3) = 15 → 3w + 3 = 15 → 3w = 12 → w = 4. Length = 2(4) + 3 = 11.',
    requiredTopics: ['word_problems', 'basic_algebra'],
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
