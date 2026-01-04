import { Difficulty, Topic, Question, UserStats, StudyRecommendation } from '../types';
import { QUESTIONS_DB } from '../data/questions';

export const generateMathQuestion = async (topic: Topic, difficulty: Difficulty): Promise<Question> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  let candidates = QUESTIONS_DB.filter(q => 
    (topic === Topic.MIXED || q.topic === topic) &&
    (difficulty === Difficulty.COMPETITION || q.difficulty === difficulty)
  );

  if (candidates.length === 0 && topic !== Topic.MIXED) {
     // Fallback: relax difficulty
     candidates = QUESTIONS_DB.filter(q => q.topic === topic);
  }

  if (candidates.length === 0) {
    candidates = QUESTIONS_DB; // Ultimate fallback
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return { ...candidates[randomIndex] };
};

export const generateMockTest = async (): Promise<Question[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const shuffle = (arr: Question[]) => [...arr].sort(() => 0.5 - Math.random());
  
  // Create a balanced mix from the DB
  const easy = shuffle(QUESTIONS_DB.filter(q => q.difficulty === Difficulty.EASY)).slice(0, 10);
  const medium = shuffle(QUESTIONS_DB.filter(q => q.difficulty === Difficulty.MEDIUM)).slice(0, 10);
  const hard = shuffle(QUESTIONS_DB.filter(q => q.difficulty === Difficulty.HARD)).slice(0, 5);
  
  return [...easy, ...medium, ...hard];
};

export const generateStudyAnalysis = async (stats: UserStats): Promise<StudyRecommendation> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Simple logic to find weakest area
  const worstTopic = Object.entries(stats.masteryByTopic)
    .sort(([, a], [, b]) => a - b)[0];

  return {
    focusAreas: [worstTopic[0] as Topic],
    strengthAreas: [],
    advice: `Your accuracy in ${worstTopic[0]} is lower than other areas. Try focusing on those problems next.`,
    nextMilestone: "Complete 5 more problems"
  };
};
