import React, { useState } from 'react';
import { Problem } from '@/lib/data';

interface ProblemCardProps {
  problem: Problem;
  onCheckAnswer: (answer: string) => void;
  showSolution: boolean;
  isCorrect: boolean | null;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  showHints: boolean;
  currentHintIndex: number;
  onShowHint: () => void;
  onNextHint: () => void;
  onShowSolution: () => void;
  onNextProblem: () => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  onCheckAnswer,
  showSolution,
  isCorrect,
  userAnswer,
  setUserAnswer,
  showHints,
  currentHintIndex,
  onShowHint,
  onNextHint,
  onShowSolution,
  onNextProblem,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onCheckAnswer(userAnswer);
    setTimeout(() => setIsSubmitting(false), 500);
  };

  const getDifficultyColor = () => {
    switch (problem.difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Problem Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Problem</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
          {problem.difficulty}
        </span>
      </div>

      {/* Problem Content */}
      <div className="prose max-w-none text-lg" dangerouslySetInnerHTML={{ __html: problem.question }} />

      {/* Hints Section */}
      {showHints && problem.hints && problem.hints.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-blue-800">
              Hint {currentHintIndex + 1} of {problem.hints.length}
            </h3>
            <button
              onClick={() => onNextHint()}
              disabled={currentHintIndex >= problem.hints.length - 1}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Next Hint →
            </button>
          </div>
          <p className="text-blue-700">{problem.hints[currentHintIndex]}</p>
        </div>
      )}

      {/* Answer Form */}
      {!showSolution ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
              Your Answer
            </label>
            <input
              type="text"
              id="answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your answer here..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!userAnswer.trim() || isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {isSubmitting ? 'Checking...' : 'Check Answer'}
            </button>
            
            <button
              type="button"
              onClick={onShowHint}
              className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
            >
              Show Hint
            </button>
            
            <button
              type="button"
              onClick={onShowSolution}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Show Solution
            </button>
          </div>
        </form>
      ) : (
        /* Solution Section */
        <div className={`p-6 rounded-xl ${
          isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
              isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {isCorrect ? '✓' : '✗'}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium mb-2">
                {isCorrect ? 'Correct! Well done!' : 'Incorrect. Here\'s the solution:'}
              </h3>
              <div 
                className="prose max-w-none" 
                dangerouslySetInnerHTML={{ __html: problem.solution }} 
              />
              <button
                onClick={onNextProblem}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Next Problem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
