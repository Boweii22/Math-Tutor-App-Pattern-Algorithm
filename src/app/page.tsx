'use client';

import { useState, useEffect, useCallback } from 'react';
// Assuming '@/lib/gapAnalysis' and '@/lib/data' exist and export the correct types/functions
import { learningAssistant } from '@/lib/gapAnalysis'; 
import { Problem, getTopicById, topics, Topic } from '@/lib/data';
import { getRandomProblem } from '@/lib/data';

// --- Type Definitions (kept as is) ---
type Progress = {
  mastered: number;
  inProgress: number;
  notStarted: number;
};

// --- MathTutor Component ---
export default function MathTutor() {
  // --- State Variables (kept as is) ---
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [knowledgeGaps, setKnowledgeGaps] = useState<{ topic: Topic; reason: string; }[]>([]);
  const [recommendedProblems, setRecommendedProblems] = useState<{ problem: Problem; reason: string; }[]>([]);
  const [showGaps, setShowGaps] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(0);
  const [showHints, setShowHints] = useState<boolean>(false);
  const [timeStarted, setTimeStarted] = useState<number>(0);

  // Load a new random problem - Use useCallback for stability if passed to other components
  const loadNewProblem = useCallback((): void => {
    // Note: getRandomProblem should return 'Problem' or 'null' based on its implementation
    const problem = getRandomProblem(currentProblem ? [currentProblem.id] : []);
    setCurrentProblem(problem);
    setUserAnswer('');
    setShowSolution(false);
    setIsCorrect(null);
    setKnowledgeGaps([]);
    setRecommendedProblems([]); // Clear recommendations on new problem
    setShowGaps(false);
    setShowRecommendations(false);
    setShowHints(false);
    setCurrentHintIndex(0);
    setTimeStarted(Date.now());
  }, [currentProblem]); // Dependency on currentProblem is fine here for excluding the current problem ID

  // Initial load & Progress loading
  useEffect(() => {
    loadNewProblem();
    
    // Load saved progress from localStorage
    const savedProgress = localStorage.getItem('mathTutorProgress');
    if (savedProgress) {
      try {
        const { score: savedScore, attempts: savedAttempts } = JSON.parse(savedProgress);
        // Ensure values are numbers before setting
        setScore(Number(savedScore) || 0);
        setAttempts(Number(savedAttempts) || 0);
      } catch (e) {
        console.error('Failed to load progress', e);
        // Fallback to initial state if load fails
        localStorage.removeItem('mathTutorProgress'); 
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- Core Logic Functions ---

  const checkAnswer = (): void => {
    if (!currentProblem) return;
    
    const timeSpent = (Date.now() - timeStarted) / 1000; // in seconds
    // Trim user answer for comparison, assuming currentProblem.answer is also trimmed or exact
    const correct = userAnswer.trim() === currentProblem.answer.trim(); 
    
    // Process with learning assistant
    learningAssistant.processResponse(currentProblem, correct, timeSpent);
    
    // Calculate new score/attempts before updating state to use for localStorage
    let newScore = score;
    let newAttempts = attempts + 1;

    // Update state (using functional updates is safest)
    setAttempts(prev => {
        newAttempts = prev + 1;
        return newAttempts;
    });

    if (correct) {
      setScore(prev => {
        newScore = prev + 1;
        return newScore;
      });
    } else {
      // Identify knowledge gaps on incorrect answer
      const gaps = learningAssistant.identifyKnowledgeGaps(currentProblem);
      setKnowledgeGaps(gaps);
      
      // Get recommended problems (assuming this function exists and works)
      const recs = learningAssistant.getRecommendedProblems(3);
      setRecommendedProblems(recs);
    }
    
    // Update UI state
    setIsCorrect(correct);
    setShowSolution(true);

    // FIX: Save progress to localStorage using the *calculated* newScore and newAttempts
    // The previous code was using the stale `score` and `attempts` closures.
    // We wait for the state updates to complete within the component but use the calculated
    // values for immediate save.
    localStorage.setItem('mathTutorProgress', JSON.stringify({
      // IMPORTANT FIX: Use correct calculation logic
      score: correct ? score + 1 : score, 
      attempts: attempts + 1
    }));
  };

  const showNextHint = (): void => {
    // Safe check for currentProblem and hints array
    if (!currentProblem?.hints || currentProblem.hints.length === 0) return;

    if (currentHintIndex < currentProblem.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    } else {
      // Optional: hide hints after the last one is shown
      setShowHints(false);
    }
  };

  const getMasteryColor = (mastery: number): string => {
    if (mastery >= 0.8) return 'bg-green-500';
    if (mastery >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleNextProblem = (): void => {
    loadNewProblem();
  };

  const toggleGaps = (): void => {
    setShowGaps(prev => !prev);
    // If we're showing the gaps and they haven't been calculated (e.g., if a previous successful answer cleared them)
    if (!showGaps && knowledgeGaps.length === 0 && currentProblem) {
      const gaps = learningAssistant.identifyKnowledgeGaps(currentProblem);
      setKnowledgeGaps(gaps);
    }
  };
  
  const toggleRecommendations = (): void => {
    setShowRecommendations(prev => !prev);
  }

  const toggleHints = (): void => {
    setShowHints(prev => !prev);
    setCurrentHintIndex(0); // Reset hint index when toggling off
  };

  const getCurrentMastery = (topicId: string): number => {
    // Safely return 0 if learningAssistant or getTopicMastery is somehow unavailable
    return learningAssistant?.getTopicMastery(topicId) || 0;
  };


  // --- Pre-render Check ---
  if (!currentProblem) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  // --- Progress Calculation (always run before render) ---
  const progress: Progress = {
    mastered: 0,
    inProgress: 0,
    notStarted: 0
  };

  topics.forEach((topic: Topic) => {
    const mastery = learningAssistant.getTopicMastery(topic.id);
    if (mastery === 1) {
      progress.mastered++;
    } else if (mastery > 0) {
      progress.inProgress++;
    } else {
      progress.notStarted++;
    }
  });


  // --- Render Logic (JSX) ---
  
  // Safe accessor for the topic name
  const topicName = (currentProblem.requiredTopics.length > 0)
    ? getTopicById(currentProblem.requiredTopics[0])?.name || 'General' 
    : 'General';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Math Learning Assistant 
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master math through personalized practice and intelligent feedback
          </p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* Score and Attempts display... (No changes needed) */}
            <div className="bg-white/80 backdrop-blur-sm border border-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Score: <span className="font-bold text-blue-800">{score}</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Attempts: <span className="font-bold text-emerald-800">{attempts}</span>
            </div>
            {/* currentProblem is guaranteed not null here */}
            <div className={`text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 ${
              currentProblem.difficulty === 'Easy' 
                ? 'bg-green-50 border border-green-100 text-green-700' 
                : currentProblem.difficulty === 'Medium' 
                  ? 'bg-amber-50 border border-amber-100 text-amber-700'
                  : 'bg-rose-50 border border-rose-100 text-rose-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                currentProblem.difficulty === 'Easy' ? 'bg-green-500' : 
                currentProblem.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
              }`}></span>
              {currentProblem.difficulty}
            </div>
            
            {/* Mastery Progress Bar... (No changes needed) */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-700">Mastery:</span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-600" 
                  style={{ width: `${(progress.mastered / topics.length) * 100}%` }}
                ></div>
              </div>
              <span className="text-gray-700">
                {Math.round((progress.mastered / topics.length) * 100)}%
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main problem area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-700">Problem</h2>
                  <span className="text-sm text-gray-500">
                    {/* FIX: Use safe accessor for topic name */}
                    Topic: {topicName}
                  </span>
                </div>
                <p className="text-xl font-semibold">{currentProblem.question}</p>
                
                {/* Hints section - Using optional chaining for safety */}
                {showHints && currentProblem.hints && currentProblem.hints.length > 0 && (
                  <div className="mt-4 p-5 bg-amber-50/80 border-l-4 border-amber-400 rounded-r-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          Hint {currentHintIndex + 1} of {currentProblem.hints.length}
                        </h3>
                        <div className="mt-1 text-sm text-amber-700">
                          <p>{currentProblem.hints[currentHintIndex]}</p>
                        </div>
                        {currentHintIndex < currentProblem.hints.length - 1 && (
                          <div className="mt-3">
                            <button
                              onClick={showNextHint}
                              className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors duration-200"
                            >
                              Next Hint
                              <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Answer Input and Check Button */}
              <div className="mb-6">
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Your Answer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full px-5 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter your answer here..."
                    disabled={showSolution}
                    onKeyPress={(e) => e.key === 'Enter' && !showSolution && checkAnswer()}
                  />
                </div>

                {/* Solution Display */}
                {showSolution && (
                  <div className={`p-4 rounded-md mt-4 ${ // Added mt-4 for spacing
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className={`text-lg font-medium mb-2 ${
                      isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </h3>
                    <div className="text-gray-700">
                      <p className="font-medium">Solution:</p>
                      <p>{currentProblem.solution}</p>
                      {!isCorrect && (
                        <p className="mt-2">
                          <span className="font-medium">Correct answer:</span> {currentProblem.answer}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!showSolution ? (
                  <button
                    onClick={checkAnswer}
                    disabled={!userAnswer.trim()}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium text-white transition-all duration-200 ${
                      userAnswer.trim() 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-100 hover:shadow-blue-200'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextProblem}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-6 rounded-xl font-medium shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    Next Problem
                  </button>
                )}
                
                {!showSolution && (
                  <>
                    <button
                      onClick={toggleHints}
                      // Disable if no hints are available
                      disabled={!currentProblem.hints || currentProblem.hints.length === 0}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium border border-indigo-100 transition-all duration-200 ${
                        (!currentProblem.hints || currentProblem.hints.length === 0) 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      {showHints ? 'Hide Hints' : 'Show Hints'}
                    </button>
                    <button
                      onClick={() => setShowSolution(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium border border-gray-200 transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Show Solution
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Knowledge Gaps Section */}
            {showSolution && !isCorrect && knowledgeGaps.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-md border border-amber-100 overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50/50 transition-colors"
                  onClick={toggleGaps}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-amber-900">Knowledge Gaps Found</h2>
                      <p className="text-sm text-amber-700">We've identified areas to improve your understanding</p>
                    </div>
                  </div>
                  <button className="text-amber-600 hover:text-amber-800 transition-colors">
                    <svg className={`h-5 w-5 transform transition-transform ${showGaps ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {showGaps && (
                  <div className="px-4 pb-4 space-y-3">
                    {knowledgeGaps.map((gap, index) => (
                      <div key={index} className="p-3 bg-white/80 backdrop-blur-sm border border-amber-100 rounded-lg shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-2 h-2 rounded-full ${
                              gap.reason.includes('Low mastery') ? 'bg-red-400' : 
                              gap.reason.includes('forgotten') ? 'bg-amber-400' : 'bg-amber-300'
                            }`}></div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{gap.topic.name}</h4>
                            <p className="text-sm text-gray-600">{gap.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Recommended Problems Section (Add a toggle like the gaps one, using state already defined) */}
            {showSolution && !isCorrect && recommendedProblems.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl shadow-md border border-teal-100 overflow-hidden">
                    <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-teal-50/50 transition-colors"
                        onClick={toggleRecommendations}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.243.588 1.81l-2.8 2.031a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.031a1 1 0 00-1.175 0l-2.8 2.031c-.785.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.031c-.783-.567-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-teal-900">Recommended Problems</h2>
                                <p className="text-sm text-teal-700">Practice problems to address your identified gaps</p>
                            </div>
                        </div>
                        <button className="text-teal-600 hover:text-teal-800 transition-colors">
                            <svg className={`h-5 w-5 transform transition-transform ${showRecommendations ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    
                    {showRecommendations && (
                        <div className="px-4 pb-4 space-y-3">
                            {recommendedProblems.map((rec, index) => (
                                <div key={index} className="p-3 bg-white/80 backdrop-blur-sm border border-teal-100 rounded-lg shadow-sm">
                                    <h4 className="font-medium text-gray-900">{rec.problem.question}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview (No changes needed) */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Your Progress</h2>
              </div>
              
              <div className="space-y-5 mb-6">
                {/* Mastery Bars... (No changes needed) */}
                <div className="relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Mastered Topics</span>
                    <span className="font-semibold text-gray-800">{progress.mastered} of {topics.length}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 ease-out" 
                      style={{ width: `${(progress.mastered / topics.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
                    {Math.round((progress.mastered / topics.length) * 100)}%
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">In Progress</span>
                    <span className="font-semibold text-gray-800">{progress.inProgress}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-1000 ease-out" 
                      style={{ width: `${(progress.inProgress / topics.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
                    {Math.round((progress.inProgress / topics.length) * 100)}%
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Not Started</span>
                    <span className="font-semibold text-gray-800">{progress.notStarted}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-gray-300 to-gray-400 transition-all duration-1000 ease-out" 
                      style={{ width: `${(progress.notStarted / topics.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
                    {Math.round((progress.notStarted / topics.length) * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4 mt-8">
                <h3 className="text-base font-semibold text-gray-800">Topics</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {topics.length} total
                </span>
              </div>
              {/* Topic Mastery List (No changes needed) */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {topics.map((topic: Topic) => {
                  const mastery = getCurrentMastery(topic.id);
                  return (
                    <div key={topic.id} className="group
                    bg-white/50 hover:bg-white transition-colors duration-200
                    border border-gray-100 hover:border-gray-200 rounded-xl p-3
                    shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800 group-hover:text-gray-900">{topic.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Difficulty:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              topic.difficulty.toString() === 'Easy' ? 'bg-green-100 text-green-800' :
                              topic.difficulty.toString() === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {topic.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{topic.name}</p> {/* Topic name repeated here */}
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          mastery >= 0.8 ? 'bg-emerald-100 text-emerald-800' :
                          mastery >= 0.5 ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {Math.round(mastery * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            mastery >= 0.8 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                            mastery >= 0.5 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                            'bg-gradient-to-r from-gray-300 to-gray-400'
                          }`}
                          style={{ width: `${mastery * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Recommended Topics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recommended Topics</h2>
                <button 
                  onClick={toggleRecommendations}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showRecommendations ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showRecommendations && (
                <div className="space-y-3">
                  {/* Using optional chaining for a more robust call if the assistant is not fully initialized */}
                  {learningAssistant.getRecommendedTopics(3)?.map((rec, index) => {
                    const mastery = learningAssistant.getTopicMastery(rec.topic.id);
                    return (
                      <div key={index} className="p-3 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{rec.topic.name}</h3>
                            <p className="text-sm text-gray-600">{rec.reason}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {Math.round(mastery * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full ${getMasteryColor(mastery)}`}
                            style={{ width: `${mastery * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }) || <p className="text-sm text-gray-500">No recommendations available.</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="text-center text-sm text-gray-500 mt-12">
          <p>Math Learning Assistant &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}