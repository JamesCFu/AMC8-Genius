
export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  COMPETITION = 'Any Difficulty'
}

export enum Topic {
  MIXED = 'Mixed Practice',
  ALGEBRA = 'Algebra',
  GEOMETRY = 'Geometry',
  NUMBER_THEORY = 'Number Theory',
  COUNTING_PROBABILITY = 'Counting & Probability',
  LOGIC = 'Logic & Word Problems'
}

export interface Question {
  id: string;
  year: number;
  questionNumber: number;
  problemText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  hint: string;
  topic: Topic;
  difficulty: Difficulty;
}

export interface Attempt {
  id: string;
  timestamp: number;
  topic: Topic;
  difficulty: Difficulty;
  correct: boolean;
}

export interface UserStats {
  correct: number;
  total: number;
  streak: number;
  xp: number;
  level: number;
  masteryByTopic: Record<Topic, number>; // 0-100 score
  history: Attempt[];
  mistakes: Question[];
  diagnosticCompleted: boolean;
  studyAdvice?: StudyRecommendation;
}

export interface StudyRecommendation {
  focusAreas: Topic[];
  strengthAreas: Topic[];
  advice: string;
  nextMilestone: string;
}

export type GameState = 'DASHBOARD' | 'QUIZ' | 'DIAGNOSTIC' | 'REVIEW' | 'PROFILE' | 'MISTAKES';
