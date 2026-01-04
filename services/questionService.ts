import { Difficulty, Topic, Question, UserStats, StudyRecommendation } from '../types';
import { QUESTIONS_DB } from '../data/questions';

export const generateMathQuestion = async (topic: Topic, difficulty: Difficulty): Promise<Question> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 600));

  // Filter questions
  let candidates: Question[] = [];

  const isMixedDifficulty = difficulty === Difficulty.COMPETITION;

  if (topic === Topic.MIXED) {
     if (isMixedDifficulty) {
        // Topic: Mixed, Difficulty: Mixed -> All questions
        candidates = QUESTIONS_DB;
     } else {
        // Topic: Mixed, Difficulty: Specific
        candidates = QUESTIONS_DB.filter(q => q.difficulty === difficulty);
     }
  } else {
     if (isMixedDifficulty) {
        // Topic: Specific, Difficulty: Mixed -> All questions for this topic
        candidates = QUESTIONS_DB.filter(q => q.topic === topic);
     } else {
        // Topic: Specific, Difficulty: Specific
        candidates = QUESTIONS_DB.filter(q => q.topic === topic && q.difficulty === difficulty);
     }
  }
  
  // Strict Fallback Logic
  if (candidates.length === 0) {
    // If specific topic candidates are missing (e.g. DB incomplete for that topic)
    if (topic !== Topic.MIXED) {
         // Try to find ANY question of that topic
         candidates = QUESTIONS_DB.filter(q => q.topic === topic);
    }
  }

  // If still no match, return random from entire DB
  if (candidates.length === 0) {
    candidates = QUESTIONS_DB;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  const selected = candidates[randomIndex];

  // Return a shallow copy to prevent mutation of the DB object
  return {
    ...selected
  };
};

export const generateStudyAnalysis = async (stats: UserStats): Promise<StudyRecommendation> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Filter out MIXED from topic analysis
  const topics = Object.values(Topic).filter(t => t !== Topic.MIXED);
  
  // Sort topics by mastery score
  const sortedTopics = topics.sort((a, b) => {
    return (stats.masteryByTopic[a] || 0) - (stats.masteryByTopic[b] || 0);
  });

  // Weakest 2
  const focusAreas = sortedTopics.slice(0, 2);
  
  // Strongest 2 (only if mastery > 40)
  const strengthAreas = sortedTopics
    .filter(t => (stats.masteryByTopic[t] || 0) > 40)
    .slice(-2)
    .reverse();

  // Generate rule-based advice
  let advice = "";
  const totalSolved = stats.total;
  const accuracy = totalSolved > 0 ? (stats.correct / totalSolved) : 0;

  if (totalSolved < 5) {
    advice = "You're just getting started! Try 'Mixed Practice' to explore all types of problems.";
  } else if (accuracy < 0.4) {
    advice = "Don't worry about errors. Focus on understanding the 'Why' in the solution for every mistake you make.";
  } else if (accuracy > 0.8) {
    advice = "Your accuracy is fantastic! It's time to challenge yourself with Competition Level problems.";
  } else {
    advice = `Consistent practice is key. You are doing well in ${strengthAreas[0] || 'general math'}, so try to boost your ${focusAreas[0]} skills next.`;
  }

  const milestones = [
    { limit: 10, text: "Complete 10 Problems" },
    { limit: 25, text: "Reach Level 5" },
    { limit: 50, text: "Master 1 Topic" },
    { limit: 100, text: "AMC 8 Veteran Status" }
  ];
  
  const nextMilestone = milestones.find(m => stats.total < m.limit)?.text || "Maintain Excellence";

  return {
    focusAreas,
    strengthAreas,
    advice,
    nextMilestone
  };
};
