import React, { useState, useEffect } from 'react';
import { GameState, Question, Topic, Difficulty, UserStats, Attempt } from './types';
import { generateMathQuestion, generateStudyAnalysis, generateMockTest } from './services/questionService';
import { Dashboard } from './components/Dashboard';
import { QuizView } from './components/QuizView';
import { ProfileView } from './components/ProfileView';
import { MistakeLog } from './components/MistakeLog';
import { MockTestView } from './components/MockTestView';
import { Rocket } from 'lucide-react';

const INITIAL_STATS: UserStats = {
  correct: 0,
  total: 0,
  streak: 0,
  xp: 0,
  level: 1,
  masteryByTopic: {
    [Topic.MIXED]: 0,
    [Topic.ALGEBRA]: 0,
    [Topic.GEOMETRY]: 0,
    [Topic.NUMBER_THEORY]: 0,
    [Topic.COUNTING_PROBABILITY]: 0,
    [Topic.LOGIC]: 0,
  },
  history: [],
  mistakes: [],
  diagnosticCompleted: false
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('DASHBOARD');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  
  // Quiz config state
  const [activeTopic, setActiveTopic] = useState<Topic>(Topic.ALGEBRA);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  
  // Diagnostic / Mock Test state
  const [diagnosticQueue, setDiagnosticQueue] = useState<Question[]>([]);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // Seconds

  // Load stats from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('amc8_stats');
    if (saved) {
      // Handle migration for older saved data without mistakes array
      const parsed = JSON.parse(saved);
      if (!parsed.mistakes) parsed.mistakes = [];
      setStats(parsed);
    }
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    localStorage.setItem('amc8_stats', JSON.stringify(stats));
  }, [stats]);

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (gameState === 'DIAGNOSTIC' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time up logic could go here, for now we just stop at 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, timeRemaining]);

  // Update study path every 5 problems or if no path exists
  useEffect(() => {
    const shouldUpdate = stats.diagnosticCompleted && 
      (stats.total % 5 === 0 || !stats.studyAdvice);
    
    if (shouldUpdate && !loading && gameState === 'DASHBOARD') {
      generateStudyAnalysis(stats).then(advice => {
        setStats(prev => ({ ...prev, studyAdvice: advice }));
      });
    }
  }, [stats.total, stats.diagnosticCompleted, gameState]);

  const resetData = () => {
    // Clear local storage
    localStorage.removeItem('amc8_stats');
    // Reset state directly to avoid reloading which causes issues in some environments
    setStats(INITIAL_STATS);
    setGameState('DASHBOARD');
  };

  const startQuiz = async (topic: Topic, difficulty: Difficulty) => {
    setLoading(true);
    setActiveTopic(topic);
    setActiveDifficulty(difficulty);
    setGameState('QUIZ');
    
    try {
      const question = await generateMathQuestion(topic, difficulty);
      setCurrentQuestion(question);
    } catch (error) {
      console.error("Failed to start quiz", error);
      setGameState('DASHBOARD');
    } finally {
      setLoading(false);
    }
  };

  const startDiagnostic = async () => {
    setLoading(true);
    setGameState('DIAGNOSTIC');
    setDiagnosticAnswers({});
    setTimeRemaining(40 * 60); // 40 minutes in seconds

    try {
      // Generate full 25-question mock test
      const queue = await generateMockTest();
      setDiagnosticQueue(queue);
    } catch (error) {
      console.error("Diagnostic start failed", error);
      setGameState('DASHBOARD');
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeMistake = (question: Question) => {
    setCurrentQuestion(question);
    setActiveTopic(question.topic);
    setActiveDifficulty(question.difficulty);
    setGameState('QUIZ');
  };

  const handleNextQuestion = async () => {
    setLoading(true);
    setCurrentQuestion(null);
    
    try {
      // Normal Quiz (random generation based on current active settings)
      // If coming from mistake practice, we continue generating similar questions
      const question = await generateMathQuestion(activeTopic, activeDifficulty);
      setCurrentQuestion(question);
    } catch (error) {
       console.error("Failed to load next question", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!currentQuestion) return;

    setStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      
      // Calculate XP
      let xpGain = isCorrect ? (
          activeDifficulty === Difficulty.EASY ? 10 :
          activeDifficulty === Difficulty.MEDIUM ? 20 :
          activeDifficulty === Difficulty.HARD ? 35 : 50
        ) : 1;

      // Calculate Mastery Change
      const topic = currentQuestion.topic;
      const currentMastery = prev.masteryByTopic[topic] || 0;
      let masteryChange = isCorrect ? 5 : -2;
      
      const newMastery = Math.min(100, Math.max(0, currentMastery + masteryChange));

      const attempt: Attempt = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: currentQuestion.topic,
        difficulty: currentQuestion.difficulty,
        correct: isCorrect
      };

      // Handle Mistake Log
      let newMistakes = prev.mistakes;
      if (!isCorrect) {
        // Only add if not already in mistakes
        const alreadyExists = prev.mistakes.some(m => m.id === currentQuestion.id || m.problemText === currentQuestion.problemText);
        if (!alreadyExists) {
            newMistakes = [currentQuestion, ...prev.mistakes];
        }
      }

      return {
        ...prev,
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: newStreak,
        xp: prev.xp + xpGain,
        level: Math.floor((prev.xp + xpGain) / 100) + 1, 
        masteryByTopic: {
          ...prev.masteryByTopic,
          [topic]: newMastery
        },
        history: [...prev.history, attempt],
        mistakes: newMistakes
      };
    });
  };

  // Mock Test Specific Handlers
  const handleMockAnswer = (questionId: string, optionIndex: number) => {
    setDiagnosticAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleMockSubmit = () => {
    let correctCount = 0;
    let xpGained = 0;
    const newHistory: Attempt[] = [];
    let newMistakes = [...stats.mistakes];
    const newMastery = { ...stats.masteryByTopic };

    diagnosticQueue.forEach(q => {
      const selected = diagnosticAnswers[q.id];
      const isCorrect = selected === q.correctOptionIndex;
      
      if (isCorrect) {
        correctCount++;
        xpGained += 20; // 20 XP per correct mock answer
        // Update mastery slightly
        newMastery[q.topic] = Math.min(100, (newMastery[q.topic] || 0) + 3);
      } else {
         newMastery[q.topic] = Math.max(0, (newMastery[q.topic] || 0) - 1);
         // Add to mistakes if unique
         if (!newMistakes.some(m => m.id === q.id)) {
            newMistakes.push(q);
         }
      }

      newHistory.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: q.topic,
        difficulty: q.difficulty,
        correct: isCorrect
      });
    });

    setStats(prev => ({
      ...prev,
      correct: prev.correct + correctCount,
      total: prev.total + diagnosticQueue.length,
      xp: prev.xp + xpGained + 50, // Bonus for finishing
      level: Math.floor((prev.xp + xpGained + 50) / 100) + 1,
      masteryByTopic: newMastery,
      history: [...prev.history, ...newHistory],
      mistakes: newMistakes,
      diagnosticCompleted: true
    }));

    setGameState('REVIEW');
  };

  const handleRemoveMistake = (id: string) => {
    setStats(prev => ({
      ...prev,
      mistakes: prev.mistakes.filter(m => m.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setGameState('DASHBOARD')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-700 transition-colors">
              8
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700">
              AMC8 Genius
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 text-sm font-medium">
             {gameState !== 'DIAGNOSTIC' && gameState !== 'REVIEW' && (
               <button 
                 onClick={startDiagnostic}
                 className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transition-all text-xs uppercase tracking-wide mr-1"
               >
                 <Rocket className="w-3 h-3 md:w-4 md:h-4" /> 
                 <span className="hidden sm:inline">Mock Test</span>
               </button>
             )}

             <button 
               onClick={() => setGameState('PROFILE')}
               className="hidden md:flex items-center gap-1 text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-200 hover:border-slate-300 transition-all cursor-pointer"
             >
                <span>Level {stats.level}</span>
             </button>
             <div className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                <span>{stats.xp} XP</span>
             </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        {gameState === 'DASHBOARD' && (
          <Dashboard 
            stats={stats} 
            onStartQuiz={startQuiz} 
            onStartDiagnostic={startDiagnostic}
            onOpenMistakes={() => setGameState('MISTAKES')}
          />
        )}

        {gameState === 'PROFILE' && (
          <ProfileView 
            stats={stats}
            onResetData={resetData}
            onBack={() => setGameState('DASHBOARD')}
          />
        )}

        {gameState === 'MISTAKES' && (
          <MistakeLog
            mistakes={stats.mistakes}
            onBack={() => setGameState('DASHBOARD')}
            onRemove={handleRemoveMistake}
            onPractice={handlePracticeMistake}
          />
        )}

        {(gameState === 'DIAGNOSTIC' || gameState === 'REVIEW') && diagnosticQueue.length > 0 && (
           <MockTestView 
             questions={diagnosticQueue}
             timerValue={timeRemaining}
             isReviewMode={gameState === 'REVIEW'}
             userAnswers={diagnosticAnswers}
             onAnswer={handleMockAnswer}
             onSubmit={handleMockSubmit}
             onExit={() => setGameState('DASHBOARD')}
           />
        )}

        {gameState === 'QUIZ' && currentQuestion && (
          <QuizView 
            question={currentQuestion} 
            loading={loading}
            isDiagnostic={false}
            onAnswer={handleAnswer}
            onNext={handleNextQuestion}
            onExit={() => setGameState('DASHBOARD')}
          />
        )}
        
        {/* Loading state for initial transition if needed */}
        {(gameState === 'QUIZ' || gameState === 'DIAGNOSTIC') && !currentQuestion && loading && diagnosticQueue.length === 0 && (
           <div className="flex justify-center items-center h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
           </div>
        )}
      </main>

    </div>
  );
};

export default App;