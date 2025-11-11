import { Topic, Problem, topics, getTopicById, problems, Difficulty, Prerequisite, LearningPath } from './data';

type UserResponse = {
  problemId: string;
  isCorrect: boolean;
  timestamp: number;
  timeSpent: number; // in seconds
};

type UserPreferences = {
  learningStyle: 'visual' | 'verbal' | 'kinesthetic' | 'mixed';
  preferredPathType: 'fastest' | 'mostThorough' | 'examFocused';
  dailyGoal: number; // in minutes
  availableTime: number; // in minutes for current session
};

type TopicReadiness = {
  topicId: string;
  readiness: number; // 0-1, how ready the user is for this topic
  missingPrerequisites: Array<{
    topicId: string;
    weight: number;
    requiredMastery: number;
    currentMastery: number;
    gap: number; // requiredMastery - currentMastery (positive means missing)
  }>;
  totalReadinessImpact: number; // 0-1, how much missing prerequisites affect readiness
};

export class MathLearningAssistant {
  private userResponses: UserResponse[] = [];
  private topicMastery: Record<string, number> = {}; // topicId -> mastery (0-1)
  private topicLastPracticed: Record<string, number> = {}; // topicId -> timestamp
  private userPreferences: UserPreferences = {
    learningStyle: 'mixed',
    preferredPathType: 'fastest',
    dailyGoal: 30,
    availableTime: 30
  };

  constructor() {
    // Initialize mastery scores
    topics.forEach(topic => {
      this.topicMastery[topic.id] = 0; // Start with 0 mastery
    });
  }

  // Process a user's response to a problem
  processResponse(problem: Problem, isCorrect: boolean, timeSpent: number): void {
    const response: UserResponse = {
      problemId: problem.id,
      isCorrect,
      timestamp: Date.now(),
      timeSpent
    };
    
    this.userResponses.push(response);
    
    // Update last practiced time for all required topics
    problem.requiredTopics.forEach((topicId: string) => {
      this.topicLastPracticed[topicId] = Date.now();
    });
    
    // Update mastery for all required topics with weighted impact
    this.updateMasteryScores(problem, isCorrect);
    
    // Update related topics that might benefit from this practice
    this.updateRelatedTopicsMastery(problem, isCorrect);
  }
  
  // Update mastery for topics related to the current problem
  private updateRelatedTopicsMastery(problem: Problem, isCorrect: boolean): void {
    if (!problem.relatedTopics || problem.relatedTopics.length === 0) return;
    
    const masteryChange = isCorrect ? 0.02 : -0.01; // Smaller impact on related topics
    
    problem.relatedTopics.forEach(topicId => {
      if (this.topicMastery[topicId] !== undefined) {
        this.topicMastery[topicId] = Math.max(0, Math.min(1, 
          (this.topicMastery[topicId] || 0) + masteryChange
        ));
      }
    });
  }
  
  // Update mastery scores based on the response
  private updateMasteryScores(problem: Problem, isCorrect: boolean): void {
    const masteryChange = isCorrect ? 0.1 : -0.05; // Adjust these values as needed
    const decayFactor = 0.95; // How much previous mastery affects new mastery
    
    problem.requiredTopics.forEach(topicId => {
      const currentMastery = this.topicMastery[topicId] || 0;
      const timeSinceLastPracticed = this.getTimeSinceLastPracticed(topicId);
      
      // Apply mastery decay based on time since last practiced
      const decayedMastery = currentMastery * Math.pow(decayFactor, timeSinceLastPracticed / (30 * 24 * 60 * 60 * 1000)); // 30 days half-life
      
      // Update mastery with bounds [0, 1]
      this.topicMastery[topicId] = Math.max(0, Math.min(1, decayedMastery + masteryChange));
    });
  }
  
  // Get time since a topic was last practiced in milliseconds
  private getTimeSinceLastPracticed(topicId: string): number {
    const lastPracticed = this.topicLastPracticed[topicId];
    return lastPracticed ? Date.now() - lastPracticed : Infinity;
  }
  
  // Get the current mastery score for a topic (0-1)
  getTopicMastery(topicId: string): number {
    return this.topicMastery[topicId] || 0;
  }
  
  // Initialize user preferences from localStorage if available
  loadPreferences(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('mathTutorPreferences');
      if (saved) {
        this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  }
  
  // Update user preferences
  updatePreferences(prefs: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...prefs };
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mathTutorPreferences', JSON.stringify(this.userPreferences));
    }
  }
  
  // Get current preferences
  getPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }
  
  // Enhanced method to analyze topic readiness with weighted prerequisites
  analyzeTopicReadiness(topicId: string): TopicReadiness | null {
    const topic = getTopicById(topicId);
    if (!topic) return null;
    
    const missingPrerequisites: TopicReadiness['missingPrerequisites'] = [];
    let totalWeight = 0;
    let weightedGapSum = 0;
    
    // Analyze each prerequisite
    topic.prerequisites.forEach(prereq => {
      const currentMastery = this.getTopicMastery(prereq.topicId);
      const gap = Math.max(0, prereq.requiredMastery - currentMastery);
      
      if (gap > 0) {
        missingPrerequisites.push({
          topicId: prereq.topicId,
          weight: prereq.weight,
          requiredMastery: prereq.requiredMastery,
          currentMastery,
          gap
        });
        
        // Calculate weighted gap
        weightedGapSum += gap * prereq.weight;
        totalWeight += prereq.weight;
      }
    });
    
    // Calculate total readiness impact (0-1)
    const totalReadinessImpact = totalWeight > 0 
      ? Math.min(1, weightedGapSum / totalWeight) 
      : 0;
    
    // Overall readiness (1 - impact, so higher is better)
    const readiness = 1 - totalReadinessImpact;
    
    return {
      topicId,
      readiness,
      missingPrerequisites,
      totalReadinessImpact
    };
  }
  
  // Get topics that need work (low mastery or missing prerequisites)
  getTopicsNeedingWork(threshold: number = 0.3): string[] {
    return topics
      .filter(topic => {
        const readiness = this.analyzeTopicReadiness(topic.id);
        return readiness && readiness.readiness < threshold;
      })
      .map(topic => topic.id);
  }
  
  // Generate multiple learning paths based on different strategies
  generateLearningPaths(targetTopicId: string, availableTime: number = 60): LearningPath[] {
    const paths: LearningPath[] = [];
    
    // Generate different path types
    const pathTypes: Array<{
      id: 'fastest' | 'mostThorough' | 'examFocused';
      name: string;
      description: string;
    }> = [
      {
        id: 'fastest',
        name: 'Fastest Path',
        description: 'Quickest route to the target topic, focusing on essential prerequisites.'
      },
      {
        id: 'mostThorough',
        name: 'Most Thorough',
        description: 'Comprehensive coverage of all related concepts for deeper understanding.'
      },
      {
        id: 'examFocused',
        name: 'Exam Focused',
        description: 'Focuses on high-yield topics and common exam questions.'
      }
    ];
    
    // Generate a path for each type
    for (const pathType of pathTypes) {
      const path = this.generatePathByStrategy(
        targetTopicId, 
        pathType.id, 
        availableTime
      );
      
      if (path) {
        paths.push({
          id: `${targetTopicId}_${pathType.id}`,
          name: `${pathType.name} to ${getTopicById(targetTopicId)?.name || 'Target'}`,
          description: pathType.description,
          strategy: pathType.id,
          topics: path.topics,
          estimatedTime: path.estimatedTime,
          confidence: path.confidence
        });
      }
    }
    
    return paths;
  }
  
  // Generate a learning path using a specific strategy
  private generatePathByStrategy(
    targetTopicId: string, 
    strategy: 'fastest' | 'mostThorough' | 'examFocused',
    availableTime: number
  ): { topics: string[]; estimatedTime: number; confidence: number } | null {
    const targetTopic = getTopicById(targetTopicId);
    if (!targetTopic) return null;
    
    let path: string[] = [];
    let estimatedTime = 0;
    let confidence = 1.0;
    
    // Collect all prerequisite topics in order
    const allPrereqs = this.collectAllPrerequisites(targetTopicId);
    
    // Filter and sort based on strategy
    if (strategy === 'fastest') {
      // Only include prerequisites with high weight and required mastery
      const importantPrereqs = allPrereqs.filter(prereq => 
        prereq.weight > 0.7 && prereq.requiredMastery > 0.7
      );
      
      // Sort by weight * requiredMastery (descending)
      importantPrereqs.sort((a, b) => 
        (b.weight * b.requiredMastery) - (a.weight * a.requiredMastery)
      );
      
      // Add to path until we run out of time
      for (const prereq of importantPrereqs) {
        const topic = getTopicById(prereq.topicId);
        if (topic && estimatedTime + (topic.estimatedTime || 30) <= availableTime) {
          path.push(prereq.topicId);
          estimatedTime += topic.estimatedTime || 30;
        }
      }
      
      confidence = 0.8 - (0.1 * (allPrereqs.length - importantPrereqs.length) / Math.max(1, allPrereqs.length));
      
    } else if (strategy === 'mostThorough') {
      // Include all prerequisites, sorted by dependency order
      allPrereqs.sort((a, b) => {
        // First by depth in the dependency tree (shallow first)
        const depthDiff = (a.depth || 0) - (b.depth || 0);
        if (depthDiff !== 0) return depthDiff;
        
        // Then by weight * requiredMastery (descending)
        return (b.weight * b.requiredMastery) - (a.weight * a.requiredMastery);
      });
      
      // Add to path until we run out of time
      for (const prereq of allPrereqs) {
        const topic = getTopicById(prereq.topicId);
        if (topic && estimatedTime + (topic.estimatedTime || 30) <= availableTime) {
          path.push(prereq.topicId);
          estimatedTime += topic.estimatedTime || 30;
        }
      }
      
      confidence = 0.9;
      
    } else if (strategy === 'examFocused') {
      // Focus on high-yield topics (high impactScore) and common exam topics
      const examTopics = allPrereqs.filter(prereq => {
        const topic = getTopicById(prereq.topicId);
        return topic && topic.impactScore && topic.impactScore > 0.8;
      });
      
      // Sort by impactScore (descending)
      examTopics.sort((a, b) => {
        const topicA = getTopicById(a.topicId);
        const topicB = getTopicById(b.topicId);
        return (topicB?.impactScore || 0) - (topicA?.impactScore || 0);
      });
      
      // Add to path until we run out of time
      for (const prereq of examTopics) {
        const topic = getTopicById(prereq.topicId);
        if (topic && estimatedTime + (topic.estimatedTime || 30) <= availableTime) {
          path.push(prereq.topicId);
          estimatedTime += topic.estimatedTime || 30;
        }
      }
      
      confidence = 0.85;
    }
    
    // Add the target topic if there's time
    const targetTime = targetTopic.estimatedTime || 30;
    if (estimatedTime + targetTime <= availableTime) {
      path.push(targetTopicId);
      estimatedTime += targetTime;
    }
    
    // Ensure no duplicates and maintain order
    const uniquePath = Array.from(new Set(path));
    
    return {
      topics: uniquePath,
      estimatedTime,
      confidence: Math.max(0.1, Math.min(1, confidence))
    };
  }
  
  // Helper to collect all prerequisites with their weights and required mastery
  private collectAllPrerequisites(
    topicId: string,
    depth: number = 0,
    visited: Set<string> = new Set()
  ): Array<Prerequisite & { topicId: string; depth: number }> {
    if (visited.has(topicId)) return [];
    visited.add(topicId);
    
    const topic = getTopicById(topicId);
    if (!topic) return [];
    
    let result: Array<Prerequisite & { topicId: string; depth: number }> = [];
    
    // Add direct prerequisites
    topic.prerequisites.forEach(prereq => {
      // Add this prerequisite
      result.push({ ...prereq, depth });
      
      // Recursively add its prerequisites
      const nestedPrereqs = this.collectAllPrerequisites(
        prereq.topicId, 
        depth + 1, 
        new Set(visited)
      );
      
      // Add nested prerequisites
      result = [...result, ...nestedPrereqs];
    });
    
    return result;
  }
  
  // Identify knowledge gaps based on problem performance
  identifyKnowledgeGaps(problem: Problem): { topic: Topic; reason: string; }[] {
    const gaps: { topic: Topic; reason: string; }[] = [];
    
    problem.requiredTopics.forEach(topicId => {
      const topic = getTopicById(topicId);
      if (!topic) return;
      
      const readiness = this.analyzeTopicReadiness(topicId);
      if (!readiness) return;
      
      const mastery = this.getTopicMastery(topicId);
      const timeSincePracticed = this.getTimeSinceLastPracticed(topicId);
      
      // Check for low mastery
      if (mastery < 0.3) {
        gaps.push({
          topic,
          reason: `Low mastery (${Math.round(mastery * 100)}%)`
        });
      }
      
      // Check for forgotten knowledge (not practiced in a while)
      if (timeSincePracticed > 30 * 24 * 60 * 60 * 1000) { // 30 days
        gaps.push({
          topic,
          reason: `Not practiced in over a month`
        });
      }
      
      // Check for missing prerequisites with weighted analysis
      if (readiness.missingPrerequisites.length > 0) {
        const mostCritical = readiness.missingPrerequisites
          .sort((a, b) => (b.weight * b.gap) - (a.weight * a.gap))[0];
          
        if (mostCritical) {
          const prereqTopic = getTopicById(mostCritical.topicId);
          if (prereqTopic) {
            gaps.push({
              topic: prereqTopic,
              reason: `Prerequisite for ${topic.name} (weight: ${Math.round(mostCritical.weight * 100)}%, gap: ${Math.round(mostCritical.gap * 100)}%)`
            });
          }
        }
      }
    });
    
    // Sort by most critical gaps first
    return gaps.sort((a, b) => {
      const aMastery = this.getTopicMastery(a.topic.id);
      const bMastery = this.getTopicMastery(b.topic.id);
      return aMastery - bMastery; // Lower mastery first
    });
  }
  
  // Get recommended topics based on current progress and learning goals
  getRecommendedTopics(limit: number = 3, targetTopicId?: string): Topic[] {
    // If we have a target topic, recommend prerequisites that need work
    if (targetTopicId) {
      const readiness = this.analyzeTopicReadiness(targetTopicId);
      if (readiness && readiness.missingPrerequisites.length > 0) {
        // Sort by impact (weight * gap)
        const criticalPrereqs = [...readiness.missingPrerequisites]
          .sort((a, b) => (b.weight * b.gap) - (a.weight * a.gap))
          .slice(0, limit)
          .map(prereq => getTopicById(prereq.topicId))
          .filter((t): t is Topic => t !== undefined);
        
        if (criticalPrereqs.length > 0) {
          return criticalPrereqs;
        }
      }
    }
    
    // Fall back to general recommendations
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    return topics
      .filter(topic => {
        const lastPracticed = this.topicLastPracticed[topic.id] || 0;
        const mastery = this.getTopicMastery(topic.id);
        const readiness = this.analyzeTopicReadiness(topic.id);
        
        // Only recommend topics that:
        // 1. Aren't mastered yet
        // 2. Have high readiness (prerequisites are met)
        // 3. Weren't practiced recently
        return mastery < 0.9 && // Not yet mastered
               (readiness?.readiness || 0) > 0.7 && // Ready to learn
               lastPracticed < thirtyDaysAgo; // Not practiced recently
      })
      .sort((a, b) => {
        // Sort by impact score (descending), then by readiness (descending)
        const aReadiness = this.analyzeTopicReadiness(a.id)?.readiness || 0;
        const bReadiness = this.analyzeTopicReadiness(b.id)?.readiness || 0;
        
        const impactDiff = (b.impactScore || 0) - (a.impactScore || 0);
        if (Math.abs(impactDiff) > 0.1) return impactDiff;
        
        const readinessDiff = bReadiness - aReadiness;
        if (Math.abs(readinessDiff) > 0.1) return readinessDiff;
        
        // Finally, by last practiced (oldest first)
        const aLastPracticed = this.topicLastPracticed[a.id] || 0;
        const bLastPracticed = this.topicLastPracticed[b.id] || 0;
        return aLastPracticed - bLastPracticed;
      })
      .slice(0, limit);
  }
  
  // Get recommended problems based on knowledge gaps
  getRecommendedProblems(limit: number = 5): { problem: Problem; reason: string; }[] {
    // Get all problems that address knowledge gaps
    const gapProblems: { problem: Problem; score: number; reasons: string[] }[] = [];
    
    problems.forEach(problem => {
      const gaps = this.identifyKnowledgeGaps(problem);
      if (gaps.length > 0) {
        // Calculate a score based on number of gaps addressed and problem difficulty
        const gapScore = gaps.length;
        const difficultyScore = problem.difficulty === 'easy' ? 1 : problem.difficulty === 'medium' ? 2 : 3;
        const score = gapScore * difficultyScore;
        
        const reasons = gaps.map(gap => `${gap.topic.name}: ${gap.reason}`);
        
        gapProblems.push({ problem, score, reasons });
      }
    });
    
    // Sort by score (descending) and take top N
    return gapProblems
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        problem: item.problem,
        reason: item.reasons.join(', ')
      }));
  }
  
  // Get user's overall progress
  getProgress(): { mastered: number; inProgress: number; notStarted: number } {
    let mastered = 0;
    let inProgress = 0;
    
    topics.forEach(topic => {
      const mastery = this.getTopicMastery(topic.id);
      if (mastery >= 0.8) mastered++;
      else if (mastery > 0.3) inProgress++;
    });
    
    const notStarted = topics.length - mastered - inProgress;
    
    return { mastered, inProgress, notStarted };
  }
}

// Export a singleton instance
export const learningAssistant = new MathLearningAssistant();
