import { Topic, Problem, topics, getTopicById, problems } from './data';

type UserResponse = {
  problemId: string;
  isCorrect: boolean;
  timestamp: number;
  timeSpent: number; // in seconds
};

export class MathLearningAssistant {
  private userResponses: UserResponse[] = [];
  private topicMastery: Record<string, number> = {}; // topicId -> mastery (0-1)
  private topicLastPracticed: Record<string, number> = {}; // topicId -> timestamp

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
    
    // Update mastery for all required topics
    this.updateMasteryScores(problem, isCorrect);
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
  
  // Identify knowledge gaps based on problem performance
  identifyKnowledgeGaps(problem: Problem): { topic: Topic; reason: string; }[] {
    const gaps: { topic: Topic; reason: string; }[] = [];
    
    problem.requiredTopics.forEach(topicId => {
      const topic = getTopicById(topicId) as Topic;
      if (!topic) return;
      
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
      
      // Check for missing prerequisites
      topic.prerequisites.forEach(prereqId => {
        const prereqMastery = this.getTopicMastery(prereqId);
        if (prereqMastery < 0.5) {
          const prereqTopic = getTopicById(prereqId);
          if (prereqTopic) {
            gaps.push({
              topic: prereqTopic,
              reason: `Weak prerequisite for ${topic.name} (${Math.round(prereqMastery * 100)}% mastery)`
            });
          }
        }
      });
    });
    
    // Sort by most critical gaps first
    return gaps.sort((a, b) => {
      const aMastery = this.getTopicMastery(a.topic.id);
      const bMastery = this.getTopicMastery(b.topic.id);
      return aMastery - bMastery; // Lower mastery first
    });
  }
  
  // Get recommended topics to work on
  getRecommendedTopics(count: number = 3): { topic: Topic; reason: string; }[] {
    // Get all topics with their priority score
    const topicScores = topics.map((topic: Topic) => {
      const mastery = this.getTopicMastery(topic.id);
      const timeSincePracticed = this.getTimeSinceLastPracticed(topic.id);
      
      // Calculate priority score (lower is higher priority)
      let score = 1 - mastery; // Lower mastery = higher priority
      
      // Increase priority for topics not practiced in a while
      if (timeSincePracticed > 30 * 24 * 60 * 60 * 1000) { // 30 days
        score += 0.5;
      }
      
      // Check prerequisites
      const missingPrereqs = topic.prerequisites.filter(
        prereqId => this.getTopicMastery(prereqId) < 0.5
      );
      
      if (missingPrereqs.length > 0) {
        // If missing prerequisites, recommend those first
        return {
          topic,
          score: 2 + (1 - mastery), // Even higher priority for missing prereqs
          reason: `Missing ${missingPrereqs.length} prerequisites`
        };
      }
      
      return {
        topic,
        score,
        reason: mastery < 0.5 ? 'Low mastery' : 'Needs practice'
      };
    });
    
    // Sort by priority score and take top N
    return topicScores
      .sort((a, b) => a.score - b.score)
      .slice(0, count)
      .map(({ topic, reason }: { topic: Topic; reason: string }) => ({
        topic,
        reason
      }));
  }
  
  // Get recommended problems based on knowledge gaps
  getRecommendedProblems(count: number = 3): { problem: Problem; reason: string; }[] {
    // First get recommended topics
    const recommendedTopics = this.getRecommendedTopics(5);
    
    // Find problems that cover these topics
    const problemScores: { [key: string]: { problem: Problem; score: number; reasons: string[] } } = {};
    
    recommendedTopics.forEach(({ topic, reason }: { topic: Topic; reason: string }) => {
      // Find problems that cover this topic
      const relevantProblems = problems.filter((p: Problem) => 
        p.requiredTopics.includes(topic.id)
      );
      
      // Update scores for these problems
      relevantProblems.forEach((problem: Problem) => {
        const existing = problemScores[problem.id] || { 
          problem, 
          score: 0, 
          reasons: [] 
        };
        
        // Increase score based on topic priority
        existing.score += 1 / (1 + this.getTopicMastery(topic.id));
        existing.reasons.push(`${topic.name}: ${reason}`);
        
        problemScores[problem.id] = existing;
      });
    });
    
    // Convert to array, sort by score, and take top N
    const recommendedProblems = Object.values(problemScores);
    recommendedProblems.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    return recommendedProblems.slice(0, count).map(({ problem, reasons }: { problem: Problem; reasons: string[] }) => ({
      problem,
      reason: reasons.join(', ')
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
