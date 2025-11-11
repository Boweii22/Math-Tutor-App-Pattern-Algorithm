import { Topic, Problem, topics, getTopicById, problems, Difficulty, Prerequisite } from './data';

type UserResponse = {
  problemId: string;
  isCorrect: boolean;
  timestamp: number;
  timeSpent: number; // in seconds
};

export type UserPreferences = {
  learningStyle: 'visual' | 'verbal' | 'kinesthetic' | 'mixed';
  preferredPathType: 'fastest' | 'mostThorough' | 'examFocused';
  dailyGoal: number; // in minutes
  availableTime: number; // in minutes for current session
};

export type TopicReadiness = {
  topicId: string;
  readiness: number; // 0-1, how ready the user is for this topic (1 - totalReadinessImpact)
  missingPrerequisites: Array<{
    topicId: string;
    weight: number;
    requiredMastery: number;
    currentMastery: number;
    gap: number; // requiredMastery - currentMastery (positive means missing)
  }>;
  totalReadinessImpact: number; // 0-1, how much missing prerequisites affect readiness
};

// Simplified LearningPath for export consistency
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  strategy: 'fastest' | 'mostThorough' | 'examFocused';
  topics: string[];
  estimatedTime: number; // Total estimated time for all topics in the path
  confidence: number; // Assistant's confidence in this path leading to mastery
}


// Spaced repetition intervals in days
const SPACED_REPETITION_SCHEDULE = [1, 3, 7, 14, 30, 60, 90];

// Mastery thresholds for spaced repetition
const MASTERY_THRESHOLDS = {
  review: 0.6,    // Below this needs review
  easy: 0.8,      // Above this is considered mastered
  hard: 0.4       // Below this needs more frequent review
};

export class MathLearningAssistant {
  private userResponses: UserResponse[] = [];
  private topicMastery: Record<string, number> = {}; // topicId -> mastery (0-1)
  private topicLastPracticed: Record<string, number> = {}; // topicId -> timestamp
  private topicNextReview: Record<string, number> = {}; // topicId -> next review timestamp
  private topicReviewCount: Record<string, number> = {}; // topicId -> number of reviews
  private userPreferences: UserPreferences = {
    learningStyle: 'mixed',
    preferredPathType: 'fastest',
    dailyGoal: 30,
    availableTime: 30
  };
  
  // Track problem history for better recommendations
  private problemHistory: Array<{
    problemId: string;
    topicId: string;
    timestamp: number;
    correct: boolean;
    timeSpent: number;
  }> = [];

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
  
  // Update mastery scores based on the response with spaced repetition
  private updateMasteryScores(problem: Problem, isCorrect: boolean): void {
    const now = Date.now();
    const masteryChange = isCorrect ? 0.1 : -0.05;
    
    problem.requiredTopics.forEach(topicId => {
      const currentMastery = this.topicMastery[topicId] || 0;
      this.topicLastPracticed[topicId] = now;
      
      // Initialize review count if not exists
      if (this.topicReviewCount[topicId] === undefined) {
        this.topicReviewCount[topicId] = 0;
      }
      
      // Apply mastery change with diminishing returns
      let newMastery = currentMastery + masteryChange;
      
      // Cap mastery at 1.0 and floor at 0.0
      newMastery = Math.max(0, Math.min(1, newMastery));
      
      // Update mastery
      this.topicMastery[topicId] = newMastery;
      
      // Update spaced repetition scheduling
      this.updateSpacedRepetitionSchedule(topicId, newMastery, isCorrect);
      
      // Increment review count if this was a review
      if (this.topicNextReview[topicId] && now >= this.topicNextReview[topicId]) {
        this.topicReviewCount[topicId]++;
      }
      
      // Update next review time
      this.calculateNextReview(topicId, newMastery, isCorrect);
    });
  }
  
  // Update spaced repetition schedule based on performance
  private updateSpacedRepetitionSchedule(topicId: string, mastery: number, isCorrect: boolean): void {
    const now = Date.now();
    const reviewCount = this.topicReviewCount[topicId] || 0;
    
    // If the answer was correct and mastery is high, increase interval
    if (isCorrect && mastery >= MASTERY_THRESHOLDS.easy) {
      const intervalIndex = Math.min(reviewCount, SPACED_REPETITION_SCHEDULE.length - 1);
      const days = SPACED_REPETITION_SCHEDULE[intervalIndex];
      this.topicNextReview[topicId] = now + (days * 24 * 60 * 60 * 1000);
    } 
    // If the answer was incorrect or mastery is low, schedule for sooner review
    else if (!isCorrect || mastery < MASTERY_THRESHOLDS.hard) {
      // Review again in 1 day or less
      this.topicNextReview[topicId] = now + (24 * 60 * 60 * 1000);
    }
  }
  
  // Calculate the next review time for a topic
  private calculateNextReview(topicId: string, mastery: number, isCorrect: boolean): void {
    const now = Date.now();
    const reviewCount = this.topicReviewCount[topicId] || 0;
    
    // If we don't have a next review time or it's in the past, set a new one
    if (!this.topicNextReview[topicId] || this.topicNextReview[topicId] < now) {
      if (mastery >= MASTERY_THRESHOLDS.easy) {
        // If mastered, use the spaced repetition schedule
        const intervalIndex = Math.min(reviewCount, SPACED_REPETITION_SCHEDULE.length - 1);
        const days = SPACED_REPETITION_SCHEDULE[intervalIndex];
        this.topicNextReview[topicId] = now + (days * 24 * 60 * 60 * 1000);
      } else if (mastery >= MASTERY_THRESHOLDS.review) {
        // If approaching mastery, review in 3 days
        this.topicNextReview[topicId] = now + (3 * 24 * 60 * 60 * 1000);
      } else {
        // If struggling, review tomorrow
        this.topicNextReview[topicId] = now + (24 * 60 * 60 * 1000);
      }
    }
  }
  
  // Get time since a topic was last practiced in milliseconds
  private getTimeSinceLastPracticed(topicId: string): number {
    const lastPracticed = this.topicLastPracticed[topicId];
    // Use a large, but finite number for topics never practiced to prevent math issues
    return lastPracticed ? Date.now() - lastPracticed : 365 * 24 * 60 * 60 * 1000;
  }
  
  // Get the current mastery score for a topic (0-1)
  getTopicMastery(topicId: string): number {
    return this.topicMastery[topicId] || 0;
  }
  
  // Get the next review time for a topic
  getNextReviewTime(topicId: string): number | null {
    return this.topicNextReview[topicId] || null;
  }
  
  // Get topics that are due for review
  getTopicsDueForReview(limit: number = 5): Array<{topicId: string, dueIn: number}> {
    const now = Date.now();
    const dueTopics: Array<{topicId: string, dueIn: number}> = [];
    
    for (const topicId in this.topicNextReview) {
      const nextReview = this.topicNextReview[topicId];
      if (nextReview <= now) {
        dueTopics.push({
          topicId,
          dueIn: nextReview - now
        });
      }
    }
    
    // Sort by how overdue they are (most overdue first)
    dueTopics.sort((a, b) => a.dueIn - b.dueIn);
    
    return dueTopics.slice(0, limit);
  }
  
  // Get recommended topics based on current progress and learning goals
  getRecommendedTopics(limit: number = 3, targetTopicId?: string): { topic: Topic; reason: string }[] {
    // First, get topics that are due for review
    const dueTopics = this.getTopicsDueForReview(limit);
    
    // If we have enough due topics, return them
    if (dueTopics.length >= limit) {
      return dueTopics.map(t => ({
        topic: getTopicById(t.topicId)!,
        reason: `Due for review (${Math.round((1 - (t.dueIn / 30)) * 100)}% overdue)`
      }));
    }
    
    // Otherwise, find topics that need more practice
    const topicsNeedingPractice = topics
      .filter(topic => this.getTopicMastery(topic.id) < MASTERY_THRESHOLDS.easy)
      .sort((a, b) => this.getTopicMastery(a.id) - this.getTopicMastery(b.id)) // Sort by mastery (lowest first)
      .slice(0, limit - dueTopics.length);
      
    return [
      ...dueTopics.map(t => ({
        topic: getTopicById(t.topicId)!,
        reason: `Due for review (${Math.round((1 - (t.dueIn / 30)) * 100)}% overdue)`
      })),
      ...topicsNeedingPractice.map(topic => ({
        topic,
        reason: `Needs more practice (${Math.round(this.getTopicMastery(topic.id) * 100)}% mastered)`
      }))
    ].slice(0, limit);
  }
  
  // Get current preferences
  getPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }
  
  // Update user preferences (omitting persistence boilerplate)
  updatePreferences(prefs: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...prefs };
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
      
      totalWeight += prereq.weight;

      if (gap > 0.05) { // Only count significant gaps
        missingPrerequisites.push({
          topicId: prereq.topicId,
          weight: prereq.weight,
          requiredMastery: prereq.requiredMastery,
          currentMastery,
          gap
        });
        
        // Calculate weighted gap
        weightedGapSum += gap * prereq.weight;
      }
    });
    
    // Calculate total readiness impact (0-1). Divide by total weight to normalize
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
  
  // Helper to collect all prerequisite Topic IDs in dependency order (breadth-first)
  private collectAllPrerequisiteIds(targetTopicId: string): string[] {
    const queue = [targetTopicId];
    const visited = new Set<string>([targetTopicId]);
    const orderedPrereqs: string[] = [];

    let head = 0;
    while (head < queue.length) {
      const topicId = queue[head++];
      const topic = getTopicById(topicId);
      if (!topic) continue;

      // Add prerequisites to the queue in reverse order to explore dependencies breadth-first/top-down
      for (const prereq of topic.prerequisites) {
        if (!visited.has(prereq.topicId)) {
          visited.add(prereq.topicId);
          queue.push(prereq.topicId);
        }
      }
    }
    
    // The queue contains topics in rough topological order (target first, then dependencies).
    // Reverse it, remove the target, and then remove duplicates to get required topics in dependency order.
    const allUniquePrereqs = Array.from(new Set(queue.reverse()));
    
    return allUniquePrereqs.filter(id => id !== targetTopicId);
  }

  // ENHANCED CORE FEATURE: Generate multiple learning paths based on different strategies
  generateLearningPaths(targetTopicId: string, availableTime: number = 60): LearningPath[] {
    const paths: LearningPath[] = [];
    
    const pathTypes: Array<{
      id: 'fastest' | 'mostThorough' | 'examFocused';
      name: string;
      description: string;
    }> = [
      { id: 'fastest', name: 'Fastest Path', description: 'Focuses strictly on the core concepts where your current mastery gap is highest, avoiding deep dives into low-impact prerequisites.' },
      { id: 'mostThorough', name: 'Most Thorough', description: 'Comprehensive coverage of all related concepts and unmastered prerequisites to solidify foundational knowledge.' },
      { id: 'examFocused', name: 'Exam Focused', description: 'Optimized for high-yield topics (high impact score) and common exam question types where your mastery is weak.' }
    ];
    
    for (const pathType of pathTypes) {
      const result = this.generatePathByStrategy(
        targetTopicId, 
        pathType.id, 
        availableTime
      );
      
      if (result) {
        paths.push({
          id: `${targetTopicId}_${pathType.id}`,
          name: `${pathType.name} to ${getTopicById(targetTopicId)?.name || 'Target'}`,
          description: pathType.description,
          strategy: pathType.id,
          topics: result.topics,
          estimatedTime: result.estimatedTime,
          confidence: result.confidence
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
    
    const requiredPrereqIds = this.collectAllPrerequisiteIds(targetTopicId);
    let path: string[] = [];
    let currentTime = 0;
    
    // Create a pool of unmastered topics relevant to the path, starting with prerequisites
    const topicPool = requiredPrereqIds.filter(id => this.getTopicMastery(id) < 0.9);
    
    // 1. Determine a core fitness score for each unmastered topic
    const scoredTopics = topicPool.map(topicId => {
      const topic = getTopicById(topicId)!;
      const mastery = this.getTopicMastery(topicId);
      const readiness = this.analyzeTopicReadiness(topicId);
      
      // Mastery Gap: 1 - current mastery
      const masteryGap = 1 - mastery;
      
      let score = 0;

      // Base score: Prioritize by how ready the user is (readiness) and how much they need it (gap)
      // Readiness is key: topics that are technically possible *now* (readiness near 1.0)
      score = masteryGap * (readiness?.readiness || 0.5);

      // Apply strategy-specific weighting
      if (strategy === 'fastest') {
        // FASTEST: Focus on highest impact topics where prerequisites are met (high readiness).
        // Weight heavily by readiness to avoid prerequisite detours.
        score *= (readiness?.readiness || 0.5) * 2;
        // Penalize low-impact topics (assuming impactScore is 0-1)
        score *= (topic.impactScore || 0.5); 

      } else if (strategy === 'mostThorough') {
        // THOROUGH: Prioritize low-readiness topics (to ensure foundations are built)
        // Weight heavily by complexity (more complex topics first for deep dive)
        const difficultyMultiplier = topic.difficulty === 'hard' ? 1.5 : topic.difficulty === 'medium' ? 1.2 : 1.0;
        
        // Flip readiness: focus on low readiness topics to include their prerequisites
        score = masteryGap * (1 + (readiness?.totalReadinessImpact || 0)); 
        score *= difficultyMultiplier;

      } else if (strategy === 'examFocused') {
        // EXAM: Heavily weight by impact score and the need for practice (low mastery)
        score = masteryGap * (topic.impactScore || 0.5) * 2;
        // Prefer topics with a mastery less than 0.7 to ensure practice on weak exam spots
        if (mastery > 0.7) score *= 0.5;
      }
      
      return { topicId, topic, score };
    });

    // 2. Greedy selection process
    scoredTopics.sort((a, b) => b.score - a.score); // Sort descending by score

    const allAddedTopics = new Set<string>();

    for (const { topicId, topic } of scoredTopics) {
        const estTime = topic.estimatedTime || 30;
        
        // Prerequisite check: Ensure all of this topic's prerequisites are either mastered (>=0.9)
        // or *already added* to the path. This handles dependency chaining.
        const prereqsMet = topic.prerequisites.every(prereq => 
          this.getTopicMastery(prereq.topicId) >= 0.9 || allAddedTopics.has(prereq.topicId)
        );

        if (currentTime + estTime <= availableTime && prereqsMet) {
            path.push(topicId);
            allAddedTopics.add(topicId);
            currentTime += estTime;
        }
    }

    // 3. Add the target topic if there's time and its prerequisites are met
    const targetTime = targetTopic.estimatedTime || 30;
    const targetPrereqsMet = targetTopic.prerequisites.every(prereq => 
        this.getTopicMastery(prereq.topicId) >= 0.9 || allAddedTopics.has(prereq.topicId)
    );

    if (currentTime + targetTime <= availableTime && targetPrereqsMet) {
      path.push(targetTopicId);
      currentTime += targetTime;
    } else if (targetPrereqsMet) {
      // If there's time but not enough for the full target topic, still include it if its prerequisites are met
      path.push(targetTopicId);
    }
    
    // 4. Calculate final confidence
    let confidence = 0.8;
    if (strategy === 'mostThorough') confidence = 0.95;
    if (strategy === 'fastest') confidence = 0.85;

    // Penalty for missing important unmastered prerequisites NOT included in the path
    const missedPrereqs = requiredPrereqIds.filter(id => !allAddedTopics.has(id));
    confidence -= (missedPrereqs.length / requiredPrereqIds.length) * 0.2; 
    
    return {
      topics: path,
      estimatedTime: currentTime,
      confidence: Math.max(0.1, Math.min(1, confidence))
    };
  }
  
  // Helper to collect ALL prerequisites (simplified for path generation logic)
  private collectAllPrerequisites(
    topicId: string,
    visited: Set<string> = new Set()
  ): string[] {
      const topic = getTopicById(topicId);
      if (!topic || visited.has(topicId)) {
          return [];
      }
      visited.add(topicId);

      let prerequisites: string[] = [];

      // Explore dependencies first (deep first to maintain rough order)
      topic.prerequisites.forEach(prereq => {
          prerequisites = prerequisites.concat(
              this.collectAllPrerequisites(prereq.topicId, visited)
          );
          // Add the dependency itself
          prerequisites.push(prereq.topicId);
      });

      // Ensure topics are unique and roughly ordered
      return Array.from(new Set(prerequisites));
  }
  
  // Identify knowledge gaps based on problem performance (kept mostly the same)
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
  
  // Get recommended problems based on knowledge gaps (kept the same)
  getRecommendedProblems(limit: number = 5): { problem: Problem; reason: string; }[] {
    const gapProblems: { problem: Problem; score: number; reasons: string[] }[] = [];
    
    problems.forEach(problem => {
      const gaps = this.identifyKnowledgeGaps(problem);
      if (gaps.length > 0) {
        const gapScore = gaps.length;
        const difficultyScore = problem.difficulty === 'easy' ? 1 : problem.difficulty === 'medium' ? 2 : 3;
        const score = gapScore * difficultyScore;
        
        const reasons = gaps.map(gap => `${gap.topic.name}: ${gap.reason}`);
        
        gapProblems.push({ problem, score, reasons });
      }
    });
    
    return gapProblems
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        problem: item.problem,
        reason: item.reasons.join(', ')
      }));
  }
  
  // Get user's overall progress (kept the same)
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