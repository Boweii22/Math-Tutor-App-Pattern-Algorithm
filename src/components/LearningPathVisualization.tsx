'use client';

import { useState, useEffect, useCallback } from 'react';
import { Topic, getTopicById, topics, Problem } from '@/lib/data';
import { MathLearningAssistant, UserPreferences } from '@/lib/gapAnalysis';
import { useRouter } from 'next/navigation';

// --- Type Definitions (Needed to define the component's props and internal state types) ---
export interface LearningResource {
  id: string;
  type: 'video' | 'article' | 'practice' | 'quiz';
  title: string;
  description?: string;
  duration: number;
  url?: string;
  completed?: boolean;
}

export interface LearningPathStep {
  id: string;
  topicId: string;
  name: string;
  description?: string;
  estimatedTime: number;
  resources?: LearningResource[];
  prerequisites?: string[]; // Assuming simple Topic IDs here
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

// ResourceCard component for displaying learning resources
function ResourceCard({ 
  resource,
  onComplete 
}: { 
  resource: LearningResource;
  onComplete: () => void;
}) {
  const getResourceIcon = () => {
    const baseClasses = 'h-8 w-8 rounded-full flex items-center justify-center';
    
    switch (resource.type) {
      case 'video':
        return (
          <div className={`${baseClasses} bg-red-100 text-red-600`}>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            </svg>
          </div>
        );
      case 'article':
        return (
          <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        );
      case 'practice':
        return (
          <div className={`${baseClasses} bg-green-100 text-green-600`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'quiz':
        return (
          <div className={`${baseClasses} bg-purple-100 text-purple-600`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-600`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-start p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        {getResourceIcon()}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <h6 className="text-sm font-medium text-gray-900 truncate">
          {resource.title}
        </h6>
        <p className="text-xs text-gray-500 mt-0.5">
          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} • {resource.duration} min
          {resource.completed && (
            <span className="ml-2 inline-flex items-center text-green-600">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </span>
          )}
        </p>
        {resource.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {resource.description}
          </p>
        )}
      </div>
      <div className="flex items-center ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className={`p-1 ${
            resource.completed 
              ? 'text-green-600 hover:text-green-800' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title={resource.completed ? 'Mark as not completed' : 'Mark as completed'}
        >
          <svg 
            className="h-5 w-5" 
            fill={resource.completed ? 'currentColor' : 'none'} 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={resource.completed 
                ? "M5 13l4 4L19 7" 
                : "M5 12h14"
              } 
            />
          </svg>
        </button>
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-1 p-1 text-blue-600 hover:text-blue-800"
            title="Open resource"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---
export default function LearningPathVisualization({ 
  targetTopicId, 
  availableTime,
  learningAssistant,
  onTopicSelect,
  className = ''
}: LearningPathVisualizationProps) {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<string>('fastest');
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [activeLearningPath, setActiveLearningPath] = useState<string | null>(null);

  // --- Utility Functions ---

  const getPathColor = (strategy: string) => {
    switch (strategy) {
      case 'fastest': return 'from-blue-500 to-blue-600';
      case 'mostThorough': return 'from-purple-500 to-purple-600';
      case 'examFocused': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPathIcon = (strategy: string) => {
    switch (strategy) {
      case 'fastest': return '⚡';
      case 'mostThorough': return '🔍';
      case 'examFocused': return '📝';
      default: return '➡️';
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return 'bg-green-500';
    if (mastery >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Load paths when target topic or available time changes
  const loadPaths = useCallback(async () => {
    if (!targetTopicId) return;
    
    setIsLoading(true);
    try {
      // Generate learning paths using the learning assistant
      const generatedPaths = await learningAssistant.generateLearningPaths(
        targetTopicId, 
        availableTime
      ) as LearningPath[];
      
      // Transform the generated paths to include required fields
      const transformedPaths = generatedPaths.map(path => ({
        ...path,
        // The original logic here assumes 'path.topics' is an array of IDs.
        steps: path.topics.map((topicId, index) => {
          const topic = getTopicById(topicId);
          const mastery = learningAssistant.getTopicMastery(topicId);
          
          return {
            id: `step-${index + 1}-${topicId}`,
            topicId,
            name: topic?.name || `Topic ${index + 1}`,
            description: topic?.description || '',
            // Assuming default time of 30 min if not available
            estimatedTime: topic?.estimatedTime || 30, 
            currentMastery: mastery,
            completed: false,
            resources: [
              {
                id: `resource-${topicId}-video`,
                type: 'video' as const,
                title: `Video: ${topic?.name || 'Topic Overview'}`,
                description: 'Introduction to the topic with visual explanations',
                duration: 15,
                url: `#/learn/${topicId}/video`,
                completed: false
              },
              {
                id: `resource-${topicId}-practice`,
                type: 'practice' as const,
                title: `Practice: ${topic?.name || 'Topic Exercises'}`,
                description: 'Practice problems to reinforce your understanding',
                duration: 20,
                url: `#/learn/${topicId}/practice`,
                completed: false
              },
              {
                id: `resource-${topicId}-quiz`,
                type: 'quiz' as const,
                title: `Quiz: ${topic?.name || 'Topic Quiz'}`,
                description: 'Test your understanding with a short quiz',
                duration: 10,
                url: `#/learn/${topicId}/quiz`,
                completed: false
              }
            ]
          };
        }),
        totalTime: path.estimatedTime,
        currentStep: 0,
        startedAt: undefined,
        completedSteps: []
      }));
      
      setPaths(transformedPaths);
      
      // Set the default selected path based on user preferences
      const prefs = learningAssistant.getPreferences();
      if (prefs?.preferredPathType) {
        setSelectedPath(prefs.preferredPathType);
      } else if (transformedPaths.length > 0) {
        setSelectedPath(transformedPaths[0].strategy);
      }
    } catch (error) {
      console.error('Error generating learning paths:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetTopicId, availableTime, learningAssistant]);
  
  useEffect(() => {
    if (targetTopicId) {
      loadPaths();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTopicId, availableTime]); // loadPaths is a dependency, but it's a useCallback, so this is okay.

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
  
  // Handle completing a step (marking the topic complete)
  const handleCompleteStep = useCallback((pathId: string, stepIndex: number) => {
    setPaths(prevPaths => 
      prevPaths.map(path => {
        if (path.id === pathId) {
          const completedSteps = [...(path.completedSteps || [])];
          if (!completedSteps.includes(stepIndex)) {
            completedSteps.push(stepIndex);
          }
          
          // If this is the current step, move to the next one
          let currentStep = path.currentStep || 0;
          if (currentStep === stepIndex && currentStep < path.steps.length - 1) {
            currentStep++;
            // Auto-expand the next topic
            const nextTopicId = path.steps[currentStep]?.topicId;
            if (nextTopicId) {
              setExpandedTopics(prev => new Set(prev).add(nextTopicId));
            }
          }
          
          return {
            ...path,
            currentStep,
            completedSteps,
            steps: path.steps.map((step, idx) => 
              idx === stepIndex ? { ...step, completed: true } : step
            )
          };
        }
        return path;
      })
    );
  }, []);
  
  // Toggle resource completion
  const toggleResourceComplete = useCallback((pathId: string, stepIndex: number, resourceId: string) => {
    setPaths(prevPaths => 
      prevPaths.map(path => {
        if (path.id === pathId) {
          return {
            ...path,
            steps: path.steps.map((step, idx) => {
              if (idx === stepIndex && step.resources) {
                const updatedResources = step.resources.map(resource => 
                  resource.id === resourceId 
                    ? { ...resource, completed: !resource.completed }
                    : resource
                );
                
                // Check if all resources are completed
                const allResourcesCompleted = updatedResources.every(r => r.completed);
                
                return {
                  ...step,
                  resources: updatedResources,
                  // Auto-mark step complete if all resources are finished
                  completed: allResourcesCompleted
                };
              }
              return step;
            })
          };
        }
        return path;
      })
    );
  }, []);
  
  // Get the currently selected path
  const selectedPathData = paths.find(p => p.strategy === selectedPath);
  
  // Check if a step is completed
  const isStepCompleted = useCallback((path: LearningPath, stepIndex: number) => {
    return (path.completedSteps || []).includes(stepIndex) || 
           (path.steps[stepIndex]?.completed ?? false);
  }, []);
  
  // Calculate progress for a path
  const calculatePathProgress = useCallback((path: LearningPath) => {
    if (!path.steps.length) return 0;
    const completedSteps = path.steps.filter((step, idx) => 
      isStepCompleted(path, idx)
    ).length;
    return Math.round((completedSteps / path.steps.length) * 100);
  }, [isStepCompleted]);

  // --- Render Functions ---

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
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
    // FIX: Compare path.id to activeLearningPath, not path.strategy
    const isActivePath = activeLearningPath === selectedPathData.id; 

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedPathData.name}
            </h2>
            {!isActivePath ? (
              <button
                onClick={() => handleStartPath(selectedPathData)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Learning Path
              </button>
            ) : (
              <div className="text-sm text-gray-500">
                In Progress: **{progress}%**
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-4">{selectedPathData.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {selectedPathData.estimatedTime} minutes
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {Math.round(selectedPathData.confidence * 100)}% confidence
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {selectedPathData.steps.length} steps
            </div>
          </div>
          
          {isActivePath && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Learning path steps */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Learning Path Steps</h3>
          
          {selectedPathData.steps.map((step, stepIndex) => {
            const isExpanded = expandedTopics.has(step.topicId);
            const isCompleted = isStepCompleted(selectedPathData, stepIndex);
            const isCurrentStep = selectedPathData.currentStep === stepIndex;
            const topic = getTopicById(step.topicId);
            
            return (
              <div 
                key={step.id} 
                className={`border rounded-lg overflow-hidden ${
                  isCurrentStep ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div 
                  className={`p-4 cursor-pointer ${isExpanded ? 'border-b border-gray-200' : ''}`}
                  onClick={() => toggleTopic(step.topicId)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div 
                        className={`flex items-center justify-center h-8 w-8 rounded-full ${
                          isCompleted 
                            ? 'bg-green-100 text-green-700' 
                            : isCurrentStep 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          stepIndex + 1
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-base font-medium ${
                          isCurrentStep ? 'text-blue-800' : 'text-gray-900'
                        }`}>
                          {step.name}
                        </h4>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {step.estimatedTime} min
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteStep(selectedPathData.id, stepIndex);
                            }}
                            className={`px-2 py-1 text-xs rounded-md ${
                              isCompleted 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isCompleted ? 'Completed' : 'Mark Complete'}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTopic(step.topicId);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <svg 
                              className={`h-5 w-5 transform transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M19 9l-7 7-7-7" 
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {step.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {step.description}
                        </p>
                      )}
                      
                      {/* Prerequisites */}
                      {topic?.prerequisites?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Prerequisites:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {topic.prerequisites.map((prereqId, i) => {
                              const prereqTopic = getTopicById(prereqId);
                              const prereqMastery = learningAssistant.getTopicMastery(prereqId);
                              // Assuming requiredMastery is 0.8 for the sake of rendering
                              const requiredMastery = 0.8; 
                              const isPrereqMet = prereqMastery >= requiredMastery;
                              
                              return (
                                <span
                                  key={i}
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    isPrereqMet
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                  title={`${prereqTopic?.name || 'Topic'}: ${
                                    isPrereqMet ? 'Mastered' : 'Needs review'
                                  } (${Math.round(prereqMastery * 100)}% / ${
                                    Math.round(requiredMastery * 100)
                                  }% required)`}
                                >
                                  {prereqTopic?.name || `Prerequisite ${i + 1}`}
                                  {isPrereqMet ? ' ✓' : ' !'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Learning Resources
                    </h5>
                    
                    <div className="space-y-3">
                      {step.resources?.map((resource, resIndex) => (
                        <ResourceCard
                          key={resource.id || `resource-${stepIndex}-${resIndex}`}
                          resource={resource}
                          onComplete={() => 
                            toggleResourceComplete(
                              selectedPathData.id, 
                              stepIndex, 
                              resource.id
                            )
                          }
                        />
                      )) || (
                        <p className="text-sm text-gray-500 italic">
                          No resources available for this topic.
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          if (onTopicSelect) {
                            onTopicSelect(step.topicId);
                          }
                          // Note: client-side navigation using router.push
                          router.push(`#/learn/${step.topicId}`);
                        }}
                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                      >
                        <span>Start Learning</span>
                        <svg 
                          className="ml-1 h-4 w-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M14 5l7 7m0 0l-7 7m7-7H3" 
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Initial Render / Fallback Renders ---

  if (!targetTopicId) {
    // This fallback logic is necessary if the component is used without targetTopicId
    // and is placed outside the main render block for cleaner flow.
    const handleTopicSelect = (topicId: string) => {
        if (onTopicSelect) {
          onTopicSelect(topicId);
        }
    };
    const getMasteryColor = (mastery: number) => {
        if (mastery >= 0.8) return 'bg-green-500';
        if (mastery >= 0.5) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Topic Selected</h3>
          <p className="text-gray-600">Select a topic to view personalized learning paths</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topics.slice(0, 4).map(topic => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic.id)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{topic.name}</div>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                    <div 
                      className={`h-1.5 rounded-full ${getMasteryColor(learningAssistant.getTopicMastery(topic.id))}`}
                      style={{ width: `${learningAssistant.getTopicMastery(topic.id) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(learningAssistant.getTopicMastery(topic.id) * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Generating your personalized learning path...</p>
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Paths Available</h3>
          <p className="text-gray-600 mb-4">We couldn't generate a learning path for this topic with the current settings.</p>
          <button
            onClick={loadPaths}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  // --- Main Render Block ---
  return (
    <div className={`${className} space-y-6`}>
      {renderPathTabs()}
      {renderSelectedPath()}
    </div>
  );
}