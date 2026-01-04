import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, Topic, Question, UserStats, StudyRecommendation } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

// Map internal difficulty to prompt instructions
const difficultyPrompts: Record<Difficulty, string> = {
  [Difficulty.EASY]: "Questions 1-5 level (Basic arithmetic, simple geometry, direct logic).",
  [Difficulty.MEDIUM]: "Questions 6-15 level (Multi-step algebra, area/perimeter puzzles, basic probability).",
  [Difficulty.HARD]: "Questions 16-20 level (Complex number theory, 3D geometry, advanced counting).",
  [Difficulty.COMPETITION]: "RANDOM MIX. Randomly select a difficulty between Easy (Q1), Medium (Q10), or Hard (Q25). Do not stick to one level. Surprise the student."
};

export const generateMathQuestion = async (topic: Topic, difficulty: Difficulty): Promise<Question> => {
  const ai = getClient();
  
  const prompt = `
    You are an expert AMC 8 competition problem creator.
    Generate a UNIQUE mathematics problem based on the style, logic, and difficulty of actual AMC 8 problems from the last 25 years (1999-2024).

    Topic: ${topic}
    Difficulty: ${difficulty} - ${difficultyPrompts[difficulty]}
    
    Requirements:
    1. The problem MUST strictly follow the multiple-choice format (5 options).
    2. The style must emulate the concise, sometimes tricky wording of the MAA (Mathematical Association of America).
    3. Options must include plausible distractors (common calculation errors).
    4. Do not copy an existing problem verbatim, but synthesize a new one using the same mathematical principles found in historical data.
    
    Return JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemText: { type: Type.STRING, description: "The problem statement." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "5 distinct options." 
            },
            correctOptionIndex: { type: Type.INTEGER, description: "Index 0-4." },
            explanation: { type: Type.STRING, description: "Detailed step-by-step solution." },
            hint: { type: Type.STRING, description: "A subtle hint." },
            year: { type: Type.INTEGER, description: "Simulated year (e.g. 2024)." },
            questionNumber: { type: Type.INTEGER, description: "Simulated question number (e.g. 15)." },
            difficulty: { type: Type.STRING, description: "The specific difficulty of this generated question (Easy, Medium, or Hard)." }
          },
          required: ["problemText", "options", "correctOptionIndex", "explanation", "hint", "year", "questionNumber"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No content generated");

    const data = JSON.parse(text);
    
    // If the generated difficulty is returned, use it. Otherwise default to the requested difficulty.
    // We map the string back to the Enum if possible.
    let generatedDifficulty = difficulty;
    if (data.difficulty) {
        if (data.difficulty.toLowerCase().includes('easy')) generatedDifficulty = Difficulty.EASY;
        else if (data.difficulty.toLowerCase().includes('medium')) generatedDifficulty = Difficulty.MEDIUM;
        else if (data.difficulty.toLowerCase().includes('hard')) generatedDifficulty = Difficulty.HARD;
    }

    return {
      id: crypto.randomUUID(),
      topic,
      difficulty: generatedDifficulty, // Use the actual difficulty of the generated question
      year: data.year || 2024,
      questionNumber: data.questionNumber || 1,
      ...data
    };

  } catch (error) {
    console.error("Error generating question:", error);
    // Fallback
    return {
      id: 'fallback-1',
      year: 2024,
      questionNumber: 5,
      problemText: "A rectangular garden has a length that is 3 times its width. If the perimeter is 48 meters, what is the area of the garden in square meters? (API Fallback)",
      options: ["27", "54", "108", "144", "216"],
      correctOptionIndex: 2,
      explanation: "Let w be width. Length = 3w. Perimeter = 2(w + 3w) = 8w. 8w = 48 -> w = 6. Length = 18. Area = 6 * 18 = 108.",
      hint: "Use the formula P = 2(L + W) and substitute L = 3W.",
      topic: Topic.GEOMETRY,
      difficulty: Difficulty.MEDIUM
    };
  }
};

export const generateStudyAnalysis = async (stats: UserStats): Promise<StudyRecommendation> => {
  const ai = getClient();

  // Summarize performance for the prompt
  const performanceSummary = Object.entries(stats.masteryByTopic)
    .map(([t, s]) => `${t}: ${s}/100`)
    .join(', ');

  const recentHistory = stats.history.slice(-10).map(h => 
    `${h.topic} (${h.difficulty}): ${h.correct ? 'Correct' : 'Incorrect'}`
  ).join('; ');

  // Calculate trends
  const history = stats.history;
  const last10 = history.slice(-10);
  const last10Accuracy = last10.length > 0 
      ? Math.round((last10.filter(h => h.correct).length / last10.length) * 100) 
      : 0;
  const overallAccuracy = stats.total > 0 
      ? Math.round((stats.correct / stats.total) * 100) 
      : 0;

  const prompt = `
    Analyze this student's AMC 8 math performance and generate a personalized study path.
    
    Current Mastery: ${performanceSummary}
    Recent Activity: ${recentHistory}
    Total Problems Solved: ${stats.total}
    
    Trend Analysis:
    - Recent Accuracy (Last 10): ${last10Accuracy}%
    - Overall Accuracy: ${overallAccuracy}%
    - Trend: ${last10Accuracy > overallAccuracy + 10 ? "Significantly Improving" : last10Accuracy < overallAccuracy - 10 ? "Declining" : "Stable"}
    
    Identify:
    1. Weak areas (Focus Areas)
    2. Strong areas (Strength Areas)
    3. A specific, encouraging, and tactical piece of advice (max 2 sentences). Explicitly mention the recent trend if significant.
    4. A "Next Milestone" goal (short phrase).

    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash is sufficient for analysis
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengthAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING },
            nextMilestone: { type: Type.STRING }
          },
          required: ["focusAreas", "strengthAreas", "advice", "nextMilestone"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No analysis generated");
    
    // Validate topics match enum
    const data = JSON.parse(text);
    const validTopics = Object.values(Topic);
    
    return {
      focusAreas: data.focusAreas.filter((t: string) => validTopics.includes(t as Topic)) as Topic[],
      strengthAreas: data.strengthAreas.filter((t: string) => validTopics.includes(t as Topic)) as Topic[],
      advice: data.advice,
      nextMilestone: data.nextMilestone
    };

  } catch (e) {
    console.error(e);
    return {
      focusAreas: [Topic.ALGEBRA, Topic.GEOMETRY],
      strengthAreas: [],
      advice: "Keep practicing mixed problem sets to identify your specific strengths.",
      nextMilestone: "Complete 10 more practice problems"
    };
  }
};