'use client';

import { useEffect, useRef, useState } from 'react';
import { Topic, topics } from '@/lib/data';
import { MathLearningAssistant } from '@/lib/gapAnalysis';

interface ProgressVisualizationProps {
  learningAssistant: MathLearningAssistant;
  selectedTopicId?: string;
  onTopicSelect?: (topicId: string) => void;
}

export default function ProgressVisualization({ 
  learningAssistant, 
  selectedTopicId,
  onTopicSelect 
}: ProgressVisualizationProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 300 // Fixed height for the visualization
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate positions for each topic
  const calculatePositions = () => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.4;
    
    return topics.map((topic, index) => {
      const angle = (index / topics.length) * Math.PI * 2 - Math.PI / 2;
      const mastery = learningAssistant.getTopicMastery(topic.id);
      const readiness = learningAssistant.analyzeTopicReadiness(topic.id);
      const readinessScore = readiness?.readiness || 0;
      
      // Position on the circle
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Size based on mastery
      const size = 20 + (mastery * 30);
      
      // Color based on mastery
      let color = '#9CA3AF'; // Default gray
      if (mastery > 0.8) color = '#10B981'; // Green
      else if (mastery > 0.5) color = '#F59E0B'; // Yellow
      else if (mastery > 0) color = '#EF4444'; // Red
      
      // Opacity based on readiness
      const opacity = 0.3 + (readinessScore * 0.7);
      
      return {
        ...topic,
        x,
        y,
        size,
        color,
        opacity,
        mastery,
        readiness: readinessScore,
        isHovered: hoveredTopic === topic.id,
        isSelected: selectedTopicId === topic.id
      };
    });
  };

  const positions = calculatePositions();
  
  // Calculate overall progress
  const totalMastery = positions.reduce((sum, topic) => sum + topic.mastery, 0);
  const overallProgress = (totalMastery / topics.length) * 100;
  
  // Calculate category progress
  const categories = positions.reduce((acc, topic) => {
    const category = topic.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, color: topic.color };
    }
    acc[category].total += topic.mastery;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number; color: string }>);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Learning Progress</h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{Math.round(overallProgress)}%</div>
          <div className="text-sm text-gray-500">Overall Mastery</div>
        </div>
      </div>
      
      {/* Progress Bars by Category */}
      <div className="mb-6 space-y-3">
        {Object.entries(categories).map(([category, data]) => {
          const progress = (data.total / data.count) * 100;
          return (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{category}</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${data.color} 0%, ${data.color}99 100%)`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Interactive Visualization */}
      <div 
        ref={containerRef}
        className="relative w-full h-64 md:h-80 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden"
      >
        {dimensions.width > 0 && positions.map((topic) => {
          const isActive = topic.isSelected || topic.isHovered;
          const scale = isActive ? 1.1 : 1;
          const shadow = isActive ? '0 0 0 4px rgba(99, 102, 241, 0.5)' : 'none';
          
          return (
            <div
              key={topic.id}
              className={`absolute rounded-full flex items-center justify-center text-white font-medium text-xs transition-all duration-300 cursor-pointer ${
                topic.isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
              style={{
                left: `${topic.x - topic.size/2}px`,
                top: `${topic.y - topic.size/2}px`,
                width: `${topic.size}px`,
                height: `${topic.size}px`,
                backgroundColor: topic.color,
                opacity: topic.opacity,
                transform: `scale(${scale})`,
                boxShadow: shadow,
                zIndex: isActive ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredTopic(topic.id)}
              onMouseLeave={() => setHoveredTopic(null)}
              onClick={() => onTopicSelect?.(topic.id)}
              title={`${topic.name}\nMastery: ${Math.round(topic.mastery * 100)}%\nReadiness: ${Math.round(topic.readiness * 100)}%`}
            >
              {topic.size > 30 ? (topic.mastery * 100).toFixed(0) + '%' : ''}
            </div>
          );
        })}
        
        {/* Center circle */}
        <div 
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-md flex flex-col items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(243,244,246,0.9) 100%)'
          }}
        >
          <div className="text-2xl font-bold text-indigo-600">
            {Math.round(overallProgress)}%
          </div>
          <div className="text-xs text-gray-500">Mastered</div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap justify-center gap-2">
          {[
            { color: '#10B981', label: 'Mastered (80-100%)' },
            { color: '#F59E0B', label: 'In Progress (50-79%)' },
            { color: '#EF4444', label: 'Needs Work (1-49%)' },
            { color: '#9CA3AF', label: 'Not Started' },
          ].map((item, index) => (
            <div key={index} className="flex items-center text-xs bg-white/80 px-2 py-1 rounded-full">
              <div 
                className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: item.color }}
              ></div>
              {item.label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Hover/Selected Info Panel */}
      {hoveredTopic || selectedTopicId ? (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {(() => {
            const topicId = hoveredTopic || selectedTopicId;
            const topic = positions.find(t => t.id === topicId);
            if (!topic) return null;
            
            const readiness = learningAssistant.analyzeTopicReadiness(topicId);
            const missingPrerequisites = readiness?.missingPrerequisites || [];
            
            return (
              <>
                <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Mastery</div>
                    <div className="font-medium">{Math.round(topic.mastery * 100)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${topic.mastery * 100}%`,
                          backgroundColor: topic.color
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Readiness</div>
                    <div className="font-medium">{Math.round(topic.readiness * 100)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${topic.readiness * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {missingPrerequisites.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Prerequisites to review:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {missingPrerequisites.slice(0, 3).map((prereq, i) => {
                        const prereqTopic = topics.find(t => t.id === prereq.topicId);
                        if (!prereqTopic) return null;
                        return (
                          <span 
                            key={i}
                            className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full"
                            title={`${prereqTopic.name} (${Math.round(prereq.weight * 100)}% impact)`}
                          >
                            {prereqTopic.name}
                          </span>
                        );
                      })}
                      {missingPrerequisites.length > 3 && (
                        <span className="text-xs text-gray-500 self-center">
                          +{missingPrerequisites.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <div className="mt-4 text-center text-sm text-gray-500">
          Hover over or click on a topic to see details
        </div>
      )}
    </div>
  );
}
