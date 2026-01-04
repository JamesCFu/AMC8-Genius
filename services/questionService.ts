import { Difficulty, Topic, Question, UserStats, StudyRecommendation } from '../types';
import { QUESTIONS_DB } from '../data/questions';

/**
 * Generates a question from the local static database.
 * Simulates a small network delay for better UX.
 */
export const generateMathQuestion = async (topic: Topic, difficulty: Difficulty): Promise<Question> => {
  // Simulate "thinking" time
  await new Promise(resolve => setTimeout(resolve, 400));

  let candidates: Question[] = [];

  const isMixedDifficulty = difficulty === Difficulty.COMPETITION;

  // Filter based on Topic
  if (topic === Topic.MIXED) {
     candidates = QUESTIONS_DB;
  } else {
     candidates = QUESTIONS_DB.filter(q => q.topic === topic);
  }
  
  // Filter based on Difficulty (unless Competition mode, which is mixed difficulty)
  if (!isMixedDifficulty) {
     candidates = candidates.filter(q => q.difficulty === difficulty);
  }

  // Fallback: If no specific questions found (e.g., ran out of Hard Geometry), 
  // relax the difficulty constraint but keep the topic
  if (candidates.length === 0 && topic !== Topic.MIXED) {
     candidates = QUESTIONS_DB.filter(q => q.topic === topic);
  }

  // Final Fallback: If still empty, grab any question
  if (candidates.length === 0) {
    candidates = QUESTIONS_DB;
  }

  // Select random question from candidates
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const selected = candidates[randomIndex];

  // Return a copy to ensure immutability
  return { ...selected };
};

/**
 * Generates a fixed 25-question mock test from the database.
 * Structure: 10 Easy, 10 Medium, 5 Hard.
 */
export const generateMockTest = async (): Promise<Question[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const shuffle = (array: Question[]) => [...array].sort(() => 0.5 - Math.random());

  const easyQs = QUESTIONS_DB.filter(q => q.difficulty === Difficulty.EASY);
  const mediumQs = QUESTIONS_DB.filter(q => q.difficulty === Difficulty.MEDIUM);
  const hardQs = QUESTIONS_DB.filter(q => q.difficulty === Difficulty.HARD);

  // Grab randomized subsets
  // Fallbacks provided in case DB is small during testing
  const selectedEasy = shuffle(easyQs).slice(0, 10);
  const selectedMedium = shuffle(mediumQs).slice(0, 10);
  
  // Fill remaining slots if we don't have enough of a specific difficulty
  const remainingSlots = 25 - (selectedEasy.length + selectedMedium.length);
  const selectedHard = shuffle(hardQs).slice(0, remainingSlots);

  return [...selectedEasy, ...selectedMedium, ...selectedHard];
};

/**
 * Generates study advice based on simple rule-based logic analysis of UserStats.
 * No AI required.
 */
export const generateStudyAnalysis = async (stats: UserStats): Promise<StudyRecommendation> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  // 1. Identify Weakest Topics (excluding Mixed)
  const topics = Object.values(Topic).filter(t => t !== Topic.MIXED);
  
  // Sort by mastery score (ascending)
  const sortedByMastery = topics.sort((a, b) => {
    return (stats.masteryByTopic[a] || 0) - (stats.masteryByTopic[b] || 0);
  });

  const focusAreas = sortedByMastery.slice(0, 2); // Bottom 2
  
  // 2. Identify Strongest Topics (only if mastery > 30)
  const strengthAreas = sortedByMastery
    .filter(t => (stats.masteryByTopic[t] || 0) > 30)
    .reverse()
    .slice(0, 2);

  // 3. Generate Rule-Based Advice
  let advice = "";
  const totalSolved = stats.total;
  const accuracy = totalSolved > 0 ? (stats.correct / totalSolved) : 0;
  
  // Trend Analysis: Last 10 attempts
  const history = stats.history || [];
  const last10 = history.slice(-10);
  const last10Count = last10.length;
  const last10Correct = last10.filter(h => h.correct).length;
  const last10Accuracy = last10Count > 0 ? (last10Correct / last10Count) : 0;

  if (totalSolved < 5) {
    advice = "Welcome! Start by exploring 'Mixed Practice' to gauge your baseline skills across all topics.";
  } else if (last10Accuracy > accuracy + 0.15 && totalSolved > 10) {
    advice = `You're improving rapidly! Your recent accuracy (${Math.round(last10Accuracy * 100)}%) is much higher than your average. Consider trying Hard difficulty.`;
  } else if (last10Accuracy < accuracy - 0.15 && totalSolved > 10) {
    advice = `You've hit a bumpy patch recently. It might be helpful to review your Mistake Log before solving new problems.`;
  } else if (accuracy > 0.8) {
    advice = `Your fundamental skills are excellent. It is time to challenge yourself with Competition Mode or Hard difficulty problems.`;
  } else if (focusAreas.length > 0) {
    advice = `Your overall consistency is good. To reach the next level, focus your efforts on ${focusAreas[0]} problems.`;
  } else {
    advice = "Keep practicing! Consistency is the key to mastering AMC 8 concepts.";
  }

  // 4. Determine Next Milestone
  let nextMilestone = "Complete 10 Problems";
  if (stats.total >= 10) nextMilestone = "Reach Level 5";
  if (stats.level >= 5) nextMilestone = "Solve 50 Problems";
  if (stats.total >= 50) nextMilestone = "Master 1 Topic (100%)";
  if (Object.values(stats.masteryByTopic).some(s => s >= 100)) nextMilestone = "AMC 8 Champion";

  return {
    focusAreas,
    strengthAreas,
    advice,
    nextMilestone
  };
};
