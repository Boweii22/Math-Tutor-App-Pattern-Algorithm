'use client';

import { useState, useEffect, useCallback } from 'react';
import { Topic, getTopicById, topics } from '@/lib/data';
import { MathLearningAssistant } from '@/lib/gapAnalysis';

// --- Type Definitions ---
export interface LearningResource {
  id: string;
  type: 'video' | 'article' | 'practice' | 'quiz';
  title: string;
  description: string;
  duration: number;
  url: string;
  completed: boolean;
  videoId: string; // Changed from optional to required string
}

export interface LearningPathStep {
  id: string;
  topicId: string;
  name: string;
  description?: string;
  estimatedTime: number;
  resources: LearningResource[];
  prerequisites?: string[];
  completed?: boolean;
  currentMastery?: number;
  reason?: string;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  strategy: 'fastest' | 'mostThorough' | 'examFocused';
  steps: LearningPathStep[];
  estimatedTime: number;
  totalTime: number;
  confidence: number;
  topics: string[];
  currentStep?: number;
  startedAt?: number;
  completedSteps?: number[];
}

interface LearningPathVisualizationProps {
  targetTopicId?: string;
  availableTime: number;
  learningAssistant: MathLearningAssistant;
  onTopicSelect?: (topicId: string) => void;
  className?: string;
}

// --- Helper Components ---
const ResourceCard = ({ 
  resource,
  onComplete,
  onClick
}: { 
  resource: LearningResource;
  onComplete: () => void;
  onClick: () => void;
}) => {
  const getResourceTypeInfo = () => {
    const baseClasses = 'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0';
    
    switch (resource.type) {
      case 'video':
        return {
          icon: (
            <div className={`${baseClasses} bg-red-100 text-red-600`}>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
            </div>
          ),
          buttonText: 'Watch',
          buttonClass: 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400'
        };
      case 'practice':
        return {
          icon: (
            <div className={`${baseClasses} bg-green-100 text-green-600`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          buttonText: 'Practice',
          buttonClass: 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-400'
        };
      case 'quiz':
        return {
          icon: (
            <div className={`${baseClasses} bg-purple-100 text-purple-600`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          ),
          buttonText: 'Start Quiz',
          buttonClass: 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 dark:text-purple-400'
        };
      case 'article':
        return {
          icon: (
            <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          ),
          buttonText: 'Read',
          buttonClass: 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400'
        };
      default:
        return {
          icon: (
            <div className={`${baseClasses} bg-gray-100 text-gray-600`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          buttonText: 'View',
          buttonClass: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
        };
    }
  };

  const { icon, buttonText, buttonClass } = getResourceTypeInfo();

  return (
    <div 
      className={`flex items-start p-4 rounded-xl border transition-all ${
        resource.completed 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50' 
          : 'bg-white border-gray-200 hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-500/50'
      }`}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <h6 className="text-sm font-semibold text-gray-900 dark:text-white">
          {resource.title}
        </h6>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} • {resource.duration} min
        </p>
        {resource.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-2">
            {resource.description}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end ml-2 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${buttonClass}`}
        >
          {buttonText}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className={`text-xs flex items-center ${
            resource.completed 
              ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300' 
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
          title={resource.completed ? 'Mark as not completed' : 'Mark as completed'}
        >
          <svg 
            className="h-3.5 w-3.5 mr-1" 
            fill={resource.completed ? 'currentColor' : 'none'} 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d={resource.completed ? "M5 13l4 4L19 7" : "M5 12h14"} 
            />
          </svg>
          {resource.completed ? 'Completed' : 'Mark done'}
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function LearningPathVisualization({ 
  targetTopicId, 
  availableTime,
  learningAssistant,
  onTopicSelect,
  className = ''
}: LearningPathVisualizationProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<'fastest' | 'mostThorough' | 'examFocused'>('fastest');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [activeLearningPath, setActiveLearningPath] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    isVideo?: boolean;
    searchUrl?: string;
  }>({ title: '', isVideo: false });

  // Get the currently selected path data
  const selectedPathData = paths.find(p => p.strategy === selectedPath);

  // Get YouTube video ID based on topic
  const getVideoId = (topicId: string): { id?: string; searchUrl: string } => {
    const topic = getTopicById(topicId);
    const topicName = topic?.name || 'math';
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topicName + ' tutorial')}`;
    
    const videoMap: Record<string, string> = {
      'basic_arithmetic': 'kqXpAcZBy2w',
      'fractions': '5UGuBM9QU0Y',
      'basic_algebra': 'NybHckSEQBI',
      'geometry': 'A6wQk8fSBYQ',
      'intermediate_algebra': 'LwCRRUa8yTU',
      'word_problems': 'M_PJWQQGrPg'
    };
    
    const videoId = videoMap[topicId];
    
    return {
      id: videoId,
      searchUrl
    };
  };

  // Load learning paths
  const loadPaths = useCallback(async () => {
    if (!targetTopicId) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate paths with different strategies
      const generatedPaths = learningAssistant.generateLearningPaths(
        targetTopicId, 
        availableTime
      );

      // Transform the generated paths to include resources
      const transformedPaths = generatedPaths.map(path => {
        const topicIds = path.topics as string[];
        const steps = topicIds.map((topicId, index) => {
          const topic = getTopicById(topicId);
          const videoId = getVideoId(topicId);
          
          return {
            id: `step-${index + 1}-${topicId}`,
            topicId,
            name: topic?.name || `Topic ${index + 1}`,
            description: '', // Removed description as it's not in the Topic type
            estimatedTime: topic?.estimatedTime || 30,
            resources: [
              {
                id: `resource-${topicId}-video`,
                type: 'video' as const,
                title: `Video: ${topic?.name || 'Topic Overview'}`,
                description: `Learn about ${topic?.name || 'this topic'} through an engaging video.`,
                duration: 10, // minutes
                url: `#${topicId}-video`,
                completed: false,
                videoId: (topic as any)?.videoId?.id || 'default'
              },
              {
                id: `resource-${topicId}-practice`,
                type: 'practice' as const,
                title: `Practice: ${topic?.name || 'Topic Exercises'}`,
                description: `Practice what you've learned with interactive exercises.`,
                duration: 20,
                url: `#${topicId}-practice`,
                completed: false,
                videoId: '' // Empty string for non-video resources
              },
              {
                id: `resource-${topicId}-quiz`,
                type: 'quiz' as const,
                title: `Quiz: ${topic?.name || 'Topic Quiz'}`,
                description: `Test your understanding with a short quiz.`,
                duration: 15,
                url: `#${topicId}-quiz`,
                completed: false,
                videoId: '' // Empty string for non-video resources
              }
            ],
            currentMastery: learningAssistant.getTopicMastery(topicId),
            completed: false
          };
        });

        return {
          ...path,
          steps,
          totalTime: path.estimatedTime,
          currentStep: 0,
          startedAt: undefined,
          completedSteps: []
        };
      });

      setPaths(transformedPaths);
      
      // Set default selected path
      if (transformedPaths.length > 0) {
        const prefs = learningAssistant.getPreferences();
        if (prefs?.preferredPathType && transformedPaths.some(p => p.strategy === prefs.preferredPathType)) {
          setSelectedPath(prefs.preferredPathType);
        } else {
          setSelectedPath(transformedPaths[0].strategy);
        }
      }
    } catch (error) {
      console.error('Error loading learning paths:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetTopicId, availableTime, learningAssistant]);

  // Load paths when target topic or available time changes
  useEffect(() => {
    if (targetTopicId) {
      loadPaths();
    }
  }, [targetTopicId, availableTime, loadPaths]);

  // Toggle topic expansion
  const toggleTopic = useCallback((topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  }, []);

  // Handle starting a learning path
  const handleStartPath = useCallback((path: LearningPath) => {
    const now = Date.now();
    const updatedPath = {
      ...path,
      startedAt: now,
      currentStep: 0,
      completedSteps: []
    };
    
    // Save to localStorage
    localStorage.setItem('activeLearningPath', JSON.stringify(updatedPath));
    setActiveLearningPath(path.id);
    
    // Expand the first topic
    if (path.steps.length > 0) {
      setExpandedTopics(new Set([path.steps[0].topicId]));
    }
  }, []);

  // Toggle resource completion
  const toggleResourceComplete = useCallback((pathId: string, stepIndex: number, resourceId: string) => {
    setPaths(prevPaths => 
      prevPaths.map(path => {
        if (path.id === pathId) {
          const updatedSteps = path.steps.map((step, idx) => {
            if (idx === stepIndex && step.resources) {
              const updatedResources = step.resources.map(resource =>
                resource.id === resourceId 
                  ? { ...resource, completed: !resource.completed } 
                  : resource
              );
              return { ...step, resources: updatedResources };
            }
            return step;
          });
          return { ...path, steps: updatedSteps };
        }
        return path;
      })
    );
  }, []);

  // Handle resource click
  const handleResourceClick = useCallback((resource: LearningResource, topicId: string) => {
    if (resource.type === 'video') {
      const topic = getTopicById(topicId);
      const topicName = topic?.name || 'this topic';
      
      // Show a modal with a link to search for videos
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topicName + ' tutorial')}`;
      
      setModalContent({
        title: `Video for ${topicName}`,
        isVideo: true,
        searchUrl
      });
      setShowComingSoon(true);
    } else if (resource.type === 'practice' || resource.type === 'quiz') {
      // For practice and quiz, show coming soon modal
      const topic = getTopicById(topicId);
      const title = `${resource.type === 'practice' ? 'Practice' : 'Quiz'} for ${topic?.name || 'this topic'}`;
      
      setModalContent({
        title,
        isVideo: false
      });
      setShowComingSoon(true);
    }
  }, []);

  // Calculate path progress
  const calculatePathProgress = useCallback((path: LearningPath): number => {
    if (!path.steps.length) return 0;
    const completedSteps = path.completedSteps?.length || 0;
    return Math.round((completedSteps / path.steps.length) * 100);
  }, []);

  // Get path color based on strategy
  const getPathColor = (strategy: string): string => {
    switch (strategy) {
      case 'fastest': return 'from-blue-500 to-blue-600';
      case 'mostThorough': return 'from-purple-500 to-purple-600';
      case 'examFocused': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // Get path icon based on strategy
  const getPathIcon = (strategy: string) => {
    switch (strategy) {
      case 'fastest': return '⚡';
      case 'mostThorough': return '📚';
      case 'examFocused': return '📝';
      default: return '📊';
    }
  };

  // Get mastery color class
  const getMasteryColor = (mastery: number): string => {
    if (mastery >= 0.8) return 'text-green-600 dark:text-green-400';
    if (mastery >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Render the path selection tabs
  const renderPathTabs = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!paths.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          No learning paths available. Please check back later.
        </div>
      );
    }

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-1">
        <nav className="flex space-x-1" aria-label="Learning path types">
          {paths.map((path) => (
            <button
              key={path.strategy}
              onClick={() => setSelectedPath(path.strategy)}
              className={`flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                selectedPath === path.strategy
                  ? `bg-gradient-to-r ${getPathColor(path.strategy)} text-white shadow-md`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{getPathIcon(path.strategy)}</span>
              {path.strategy === 'fastest' && 'Fastest'}
              {path.strategy === 'mostThorough' && 'Thorough'}
              {path.strategy === 'examFocused' && 'Exam Focused'}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {path.estimatedTime} min
              </span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  // Render the selected path details
  const renderSelectedPath = () => {
    if (!selectedPathData) return null;

    const progress = calculatePathProgress(selectedPathData);
    const isPathStarted = selectedPathData.startedAt !== undefined;
    
    return (
      <div className="mt-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPathData.name}</h2>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{selectedPathData.description}</p>
            </div>
            <div className="mt-4 md:mt-0">
              {!isPathStarted ? (
                <button
                  onClick={() => handleStartPath(selectedPathData)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Start Learning Path
                </button>
              ) : (
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-3">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {selectedPathData.estimatedTime} minutes
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {selectedPathData.steps.length} topics
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {selectedPathData.strategy === 'fastest' ? 'Fast Track' : 
               selectedPathData.strategy === 'mostThorough' ? 'Comprehensive' : 'Exam Focused'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Path</h3>
          
          <div className="space-y-3">
            {selectedPathData.steps.map((step, stepIndex) => {
              const isExpanded = expandedTopics.has(step.topicId);
              const isCompleted = selectedPathData.completedSteps?.includes(stepIndex) || false;
              
              return (
                <div 
                  key={step.id} 
                  className={`border rounded-lg overflow-hidden transition-all ${
                    isExpanded ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <button
                    className={`w-full flex items-center justify-between p-4 text-left ${
                      isExpanded ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => toggleTopic(step.topicId)}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-xs font-medium">{stepIndex + 1}</span>
                        )}
                      </div>
                      <div>
                        <h4 className={`text-sm font-medium ${
                          isCompleted 
                            ? 'text-green-700 dark:text-green-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {step.name}
                        </h4>
                        <div className="flex items-center mt-1">
                          <span className={`text-xs ${
                            isCompleted 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {step.estimatedTime} min • 
                            <span className={getMasteryColor(step.currentMastery || 0)}>
                              {' '}{Math.round((step.currentMastery || 0) * 100)}% Mastery
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg 
                      className={`h-5 w-5 text-gray-400 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isExpanded && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700">
                      {step.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          {step.description}
                        </p>
                      )}
                      
                      <div className="space-y-3 mt-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200">Resources</h5>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {step.resources?.map((resource) => (
                            <ResourceCard
                              key={resource.id}
                              resource={resource}
                              onComplete={() => toggleResourceComplete(selectedPathData.id, stepIndex, resource.id)}
                              onClick={() => handleResourceClick(resource, step.topicId)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Coming Soon Modal
  const ComingSoonModal = () => {
    const { title, isVideo, searchUrl } = modalContent;

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl p-8 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Close button - positioned at top right */}
          <button
            onClick={() => setShowComingSoon(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
              isVideo 
                ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' 
                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
            }`}>
              {isVideo ? (
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                </svg>
              ) : (
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {isVideo ? 'Video Tutorial' : 'Coming Soon!'}
            </h3>
            
            <div className="mt-4">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {isVideo ? (
                  <>
                    Find a tutorial for <span className="font-medium">{title.replace('Video for ', '')}</span> on YouTube.
                  </>
                ) : (
                  <>
                    <span className="font-medium">{title}</span> is currently under development.
                  </>
                )}
              </p>
              
              {isVideo && searchUrl && (
                <div className="mt-6">
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                    Watch on YouTube
                  </a>
                </div>
              )}
              {!isVideo && (
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  We're working hard to bring you this feature as soon as possible. Please check back later!
                </p>
              )}
            </div>
            
            <div className="mt-8">
              <button
                type="button"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                onClick={() => setShowComingSoon(false)}
              >
                {isVideo ? 'Close' : 'Got it, thanks!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Initial Render / Fallback Renders ---
  if (!targetTopicId) {
    const handleTopicSelect = (topicId: string) => {
      if (onTopicSelect) {
        onTopicSelect(topicId);
      }
    };

    return (
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Topic</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Choose a topic to view personalized learning paths and resources.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic.id)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <h4 className="font-medium text-gray-900 dark:text-white">{topic.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {topic.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showComingSoon && <ComingSoonModal />}
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Path</h2>
        {activeLearningPath && (
          <button
            onClick={() => {
              localStorage.removeItem('activeLearningPath');
              setActiveLearningPath(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Start Over
          </button>
        )}
      </div>
      
      {renderPathTabs()}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        renderSelectedPath()
      )}
    </div>
  );
}
