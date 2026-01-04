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

export const generateMockTest = async (): Promise<Question[]> => {
  // Simulate setup time
  await new Promise(resolve => setTimeout(resolve, 1000));

  const shuffle = (array: Question[]) => array.sort(() => 0.5 - Math.random());

  const easyQs = QUESTIONS_DB.filter(q => q.difficulty === Difficulty.EASY);
  const mediumQs = QUESTIONS_DB.filter(q => q.difficulty === Difficulty.MEDIUM);
  const hardQs = QUESTIONS_DB.filter(q => q.difficulty === Difficulty.HARD);

  // Requirement: 10 Easy, 10 Medium, 5 Hard (Total 25)
  const selectedEasy = shuffle(easyQs).slice(0, 10);
  const selectedMedium = shuffle(mediumQs).slice(0, 10);
  const selectedHard = shuffle(hardQs).slice(0, 5);

  // Combine and return. AMC 8 usually gets progressively harder.
  return [...selectedEasy, ...selectedMedium, ...selectedHard];
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

  // Generate rule-based advice with trend analysis
  let advice = "";
  const totalSolved = stats.total;
  const accuracy = totalSolved > 0 ? (stats.correct / totalSolved) : 0;
  
  // Trend Analysis: Compare last 10 vs overall
  const history = stats.history;
  const last10 = history.slice(-10);
  const last10Count = last10.length;
  const last10Correct = last10.filter(h => h.correct).length;
  const last10Accuracy = last10Count > 0 ? (last10Correct / last10Count) : 0;

  if (totalSolved < 5) {
    advice = "You're just getting started! Try 'Mixed Practice' to explore all types of problems.";
  } else if (totalSolved >= 10) {
      // Analyze Trend
      if (last10Accuracy > accuracy + 0.15) {
          advice = `You're on a roll! Your recent accuracy (${Math.round(last10Accuracy * 100)}%) is significantly higher than your average. You're ready for harder problems.`;
      } else if (last10Accuracy < accuracy - 0.15) {
          advice = `You've hit a rough patch recently (${Math.round(last10Accuracy * 100)}% accuracy). Consider reviewing your Mistake Log before moving on.`;
      } else if (accuracy < 0.4) {
          advice = "Don't worry about errors. Focus on understanding the 'Why' in the solution for every mistake you make.";
      } else if (accuracy > 0.8) {
          advice = "Your consistency is fantastic! It's time to challenge yourself with Competition Level problems.";
      } else {
          advice = `Consistent practice is key. You are doing well in ${strengthAreas[0] || 'general math'}, so try to boost your ${focusAreas[0]} skills next.`;
      }
  } else {
     // Between 5 and 10 problems
     advice = `Keep going! Try to focus on ${focusAreas[0]} problems to build a strong foundation.`;
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