'use client';

import { useState, useEffect } from 'react';
import { Topic, getTopicById } from '@/lib/data';
import { MathLearningAssistant } from '@/lib/gapAnalysis';

interface LearningPathVisualizationProps {
  targetTopicId?: string;
  availableTime: number;
  learningAssistant: MathLearningAssistant;
}

export default function LearningPathVisualization({ 
  targetTopicId, 
  availableTime,
  learningAssistant 
}: LearningPathVisualizationProps) {
  const [selectedPath, setSelectedPath] = useState<string>('fastest');
  const [paths, setPaths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (targetTopicId) {
      loadPaths();
    }
  }, [targetTopicId, availableTime]);

  const loadPaths = async () => {
    setIsLoading(true);
    try {
      const generatedPaths = learningAssistant.generateLearningPaths(targetTopicId || '', availableTime);
      setPaths(generatedPaths);
    } catch (error) {
      console.error('Error generating learning paths:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPathColor = (strategy: string) => {
    switch (strategy) {
      case 'fastest': return 'from-blue-500 to-blue-600';
      case 'mostThorough': return 'from-purple-500 to-purple-600';
      case 'examFocused': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!targetTopicId) {
    return (
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100">
        <p className="text-gray-600 text-center">Select a topic to view learning paths</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100">
        <p className="text-gray-600">No learning paths available for this topic.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 mb-6">
        {paths.map((path) => (
          <button
            key={path.strategy}
            onClick={() => setSelectedPath(path.strategy)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPath === path.strategy
                ? `bg-gradient-to-r ${getPathColor(path.strategy)} text-white shadow-md`
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {path.strategy === 'fastest' && 'Fastest Path'}
            {path.strategy === 'mostThorough' && 'Most Thorough'}
            {path.strategy === 'examFocused' && 'Exam Focused'}
          </button>
        ))}
      </div>

      {paths
        .filter((path) => path.strategy === selectedPath)
        .map((path) => (
          <div key={path.strategy} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {path.strategy === 'fastest' && 'Fastest Path to Mastery'}
                {path.strategy === 'mostThorough' && 'Most Thorough Learning Path'}
                {path.strategy === 'examFocused' && 'Exam-Focused Learning Path'}
              </h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {path.estimatedTime} min
              </span>
            </div>

            <p className="text-gray-600 mb-4">
              {path.strategy === 'fastest' && 'Quickest route to master the topic by focusing on essential prerequisites.'}
              {path.strategy === 'mostThorough' && 'Comprehensive coverage of all related topics for deep understanding.'}
              {path.strategy === 'examFocused' && 'Optimized path focusing on high-yield topics for exam preparation.'}
            </p>

            <div className="space-y-3">
              {path.topics.map((topicId: string, index: number) => {
                const topic = getTopicById(topicId);
                const mastery = learningAssistant.getTopicMastery(topicId);
                const readiness = learningAssistant.analyzeTopicReadiness(topicId);
                
                if (!topic) return null;

                return (
                  <div 
                    key={topicId}
                    className="group relative p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{topic.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                mastery >= 0.8 ? 'bg-emerald-100 text-emerald-800' :
                                mastery >= 0.5 ? 'bg-amber-100 text-amber-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {Math.round(mastery * 100)}% Mastery
                              </span>
                              {readiness?.missingPrerequisites.length > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                  {readiness.missingPrerequisites.length} prerequisites
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {readiness?.missingPrerequisites.length > 0 && (
                          <div className="mt-3 pl-11">
                            <p className="text-xs font-medium text-amber-700 mb-1">Prerequisites to review:</p>
                            <div className="flex flex-wrap gap-2">
                              {readiness.missingPrerequisites.slice(0, 3).map((prereq, i) => {
                                const prereqTopic = getTopicById(prereq.topicId);
                                if (!prereqTopic) return null;
                                return (
                                  <span 
                                    key={i}
                                    className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full"
                                    title={`${prereqTopic.name} (${Math.round(prereq.weight * 100)}% impact)`}
                                  >
                                    {prereqTopic.name}
                                  </span>
                                );
                              })}
                              {readiness.missingPrerequisites.length > 3 && (
                                <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full">
                                  +{readiness.missingPrerequisites.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {topic.estimatedTime} min
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          mastery >= 0.8 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                          mastery >= 0.5 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                          'bg-gradient-to-r from-blue-400 to-indigo-500'
                        }`}
                        style={{ width: `${mastery * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Estimated completion time:</p>
                  <p className="font-medium">{Math.ceil(path.estimatedTime / 60)} hours {path.estimatedTime % 60} minutes</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
