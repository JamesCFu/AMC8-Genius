import { Difficulty, Topic, Question, UserStats, StudyRecommendation } from '../types';
import { QUESTIONS_DB } from '../data/questions';

// Helper to simulate network delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateMathQuestion = async (topic: Topic, difficulty: Difficulty): Promise<Question> => {
  await delay(300);

  // Filter DB for matching criteria
  let candidates = QUESTIONS_DB.filter(q => 
    (topic === Topic.MIXED || q.topic === topic) &&
    (difficulty === Difficulty.COMPETITION || q.difficulty === difficulty)
  );

  // Fallback 1: If no exact match, relax difficulty but keep topic
  if (candidates.length === 0 && topic !== Topic.MIXED) {
     candidates = QUESTIONS_DB.filter(q => q.topic === topic);
  }

  // Fallback 2: If no exact match, relax topic but keep difficulty
  if (candidates.length === 0) {
    candidates = QUESTIONS_DB.filter(q => q.difficulty === difficulty);
  }

  // Ultimate Fallback: Any question
  if (candidates.length === 0) {
    candidates = QUESTIONS_DB;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  // Return a copy to avoid mutating the DB reference
  return { ...candidates[randomIndex] };
};

export const generateMockTest = async (): Promise<Question[]> => {
  await delay(500);
  const shuffle = (arr: Question[]) => [...arr].sort(() => 0.5 - Math.random());
  
  // Create a balanced mix: 10 Easy, 10 Medium, 5 Hard
  const easy = shuffle(QUESTIONS_DB.filter(q => q.difficulty === Difficulty.EASY)).slice(0, 10);
  const medium = shuffle(QUESTIONS_DB.filter(q => q.difficulty === Difficulty.MEDIUM)).slice(0, 10);
  const hard = shuffle(QUESTIONS_DB.filter(q => q.difficulty === Difficulty.HARD)).slice(0, 5);
  
  return [...easy, ...medium, ...hard];
};

export const generateStudyAnalysis = async (stats: UserStats): Promise<StudyRecommendation> => {
  await delay(400);
  
  // 1. Identify Weakest Area (Lowest Mastery Score)
  const entries = Object.entries(stats.masteryByTopic);
  // Sort by score ascending
  entries.sort(([, scoreA], [, scoreB]) => scoreA - scoreB);
  
  const weakestTopic = entries[0][0] as Topic;
  const strongestTopic = entries[entries.length - 1][0] as Topic;

  // 2. Generate Advice based on recent accuracy
  const recentHistory = stats.history.slice(-10);
  const recentCorrect = recentHistory.filter(h => h.correct).length;
  const recentAccuracy = recentHistory.length ? (recentCorrect / recentHistory.length) * 100 : 0;

  let advice = "";
  if (recentHistory.length < 5) {
    advice = "You're just getting started! Try solving at least 10 problems to get a personalized analysis.";
  } else if (recentAccuracy > 80) {
    advice = `You're on fire! Your accuracy is ${recentAccuracy}%. Consider trying Hard difficulty or Competition mode to challenge yourself.`;
  } else if (recentAccuracy < 40) {
    advice = `It looks like you're struggling a bit with ${weakestTopic}. Review your mistakes in the log and try solving some Easy problems to build confidence.`;
  } else {
    advice = `You're making steady progress. Your strongest area is ${strongestTopic}, but keep an eye on ${weakestTopic}. Consistency is key!`;
  }

  return {
    focusAreas: [weakestTopic],
    strengthAreas: [strongestTopic],
    advice: advice,
    nextMilestone: `Reach Level ${stats.level + 1}`
  };
};
