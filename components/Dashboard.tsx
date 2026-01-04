import React from 'react';
import { Topic, Difficulty, UserStats } from '../types';
import { QUESTIONS_DB } from '../data/questions';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { BookOpen, Trophy, Target, Zap, Activity, Brain, TrendingUp, AlertCircle, Shuffle, BookX, Sparkles, BarChart2, Database } from 'lucide-react';

interface DashboardProps {
  stats: UserStats;
  onStartQuiz: (topic: Topic, difficulty: Difficulty) => void;
  onStartDiagnostic: () => void;
  onOpenMistakes: () => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#a0a0a0'];

// Helper to abbreviate topic names for charts
const getShortTopic = (topic: string) => {
  if (topic === Topic.ALGEBRA) return 'Alg';
  if (topic === Topic.GEOMETRY) return 'Geo';
  if (topic === Topic.NUMBER_THEORY) return 'NT';
  if (topic === Topic.COUNTING_PROBABILITY) return 'C&P';
  if (topic === Topic.LOGIC) return 'Logic';
  return 'Mix';
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, onStartQuiz, onStartDiagnostic, onOpenMistakes }) => {
  const [selectedTopic, setSelectedTopic] = React.useState<Topic>(Topic.MIXED);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>(Difficulty.MEDIUM);

  // 1. Prepare Radar Chart Data (Mastery Profile)
  const radarData = Object.entries(stats.masteryByTopic)
    .filter(([topic]) => topic !== Topic.MIXED)
    .map(([topic, score]) => ({
      subject: getShortTopic(topic),
      fullTopic: topic,
      A: score,
      fullMark: 100,
    }));

  // 2. Prepare Scatter Chart Data (Effort vs Accuracy)
  const scatterData = React.useMemo(() => {
    const topicAggregates: Record<string, { attempts: number; correct: number }> = {};
    
    stats.history.forEach(attempt => {
      if (attempt.topic === Topic.MIXED) return;
      if (!topicAggregates[attempt.topic]) {
        topicAggregates[attempt.topic] = { attempts: 0, correct: 0 };
      }
      topicAggregates[attempt.topic].attempts += 1;
      if (attempt.correct) topicAggregates[attempt.topic].correct += 1;
    });

    return Object.entries(topicAggregates).map(([topic, data], index) => ({
      name: getShortTopic(topic),
      fullTopic: topic,
      x: data.attempts, // Volume/Effort
      y: Math.round((data.correct / data.attempts) * 100), // Accuracy
      z: 100, // Bubble size
      fill: COLORS[index % COLORS.length]
    }));
  }, [stats.history]);

  // 3. Prepare Trend Data (Running Average)
  const historyData = React.useMemo(() => {
    if (stats.history.length === 0) return [];
    
    let cumulativeCorrect = 0;
    return stats.history.slice(-20).map((attempt, idx) => {
      if (attempt.correct) cumulativeCorrect++;
      return {
        index: idx + 1,
        average: Math.round((cumulativeCorrect / (idx + 1)) * 100),
        correct: attempt.correct ? 100 : 0
      };
    });
  }, [stats.history]);

  const recommendedTopics = stats.studyAdvice?.focusAreas || [];
  const strengthTopics = stats.studyAdvice?.strengthAreas || [];

  // Custom Tooltip for Scatter Chart
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
          <p className="font-bold text-slate-800 text-sm mb-1">{data.fullTopic}</p>
          <p className="text-xs text-slate-600">Attempts: {data.x}</p>
          <p className="text-xs text-indigo-600 font-bold">Accuracy: {data.y}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in">
      
      {/* Welcome / Diagnostic Prompt */}
      {!stats.diagnosticCompleted && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Brain className="w-8 h-8" /> Welcome to AMC8 Genius
            </h2>
            <p className="text-indigo-100 text-lg mb-6 max-w-2xl">
              To build your personalized study path, let's start with a quick diagnostic test covering key AMC 8 topics.
            </p>
            <button 
              onClick={onStartDiagnostic}
              className="px-8 py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
            >
              Start Diagnostic Test
            </button>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
          <Trophy className="text-yellow-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.xp}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Total XP</span>
        </div>
        <div className="stat-card bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
          <Zap className="text-orange-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.streak}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Day Streak</span>
        </div>
        <div className="stat-card bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
          <Target className="text-blue-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-slate-800">
            {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
          </span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Global Accuracy</span>
        </div>
        <div className="stat-card bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
          <Activity className="text-green-500 w-8 h-8 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.level}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Level</span>
        </div>
      </div>

      {/* AI Study Path Section */}
      {stats.diagnosticCompleted && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Brain className="text-indigo-600" /> Your Personalized Study Path
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Focus Areas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" /> Focus Areas
              </h3>
              {recommendedTopics.length > 0 ? (
                <div className="space-y-3">
                  {recommendedTopics.map(topic => (
                    <div key={topic} className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center group cursor-pointer hover:bg-orange-100 transition-colors"
                         onClick={() => { setSelectedTopic(topic); }}>
                      <span className="text-orange-800 font-medium text-sm">{topic}</span>
                      <button className="text-xs bg-white px-2 py-1 rounded text-orange-600 border border-orange-200">Practice</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Complete more problems to detect weak areas.</p>
              )}
            </div>

            {/* AI Advice */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">AI Coach Insight</h3>
              <p className="text-slate-700 italic leading-relaxed">"{stats.studyAdvice?.advice || "Keep practicing to generate insights."}"</p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                 <span className="text-xs text-slate-500 font-bold uppercase">Next Milestone</span>
                 <p className="text-indigo-600 font-medium">{stats.studyAdvice?.nextMilestone || "Finish Diagnostic"}</p>
              </div>
            </div>

             {/* Strengths */}
             <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" /> Strengths
              </h3>
              {strengthTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {strengthTopics.map(topic => (
                    <span key={topic} className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-100">
                      {topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Keep going to establish strengths!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Controls & Visual Analytics */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Practice Config */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-indigo-50 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <BookOpen className="mr-2 text-indigo-600" /> Practice Lab
            </h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200 flex items-center gap-1">
               <Database className="w-3 h-3" /> {QUESTIONS_DB.length} Questions
            </span>
          </div>
          
          <div className="space-y-5">
             <button 
              onClick={onOpenMistakes}
              className="w-full py-3 bg-red-50 text-red-700 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2 mb-2 shadow-sm"
             >
               <BookX className="w-4 h-4" /> Review Mistake Log ({stats.mistakes.length})
             </button>

            <div className="border-t border-slate-100"></div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic Selection</label>
              <select 
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value as Topic)}
                className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-slate-700"
              >
                {Object.values(Topic).map(t => (
                  <option key={t} value={t} className={t === Topic.MIXED ? "font-bold text-indigo-600" : ""}>
                    {t === Topic.MIXED ? "✨ Mixed Practice (All)" : t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Difficulty</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(Difficulty).map((diff) => {
                  const isAny = diff === Difficulty.COMPETITION;
                  const isActive = selectedDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        isActive 
                          ? isAny ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isAny && <Shuffle className="w-3 h-3" />}
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => onStartQuiz(selectedTopic, selectedDifficulty)}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {selectedDifficulty === Difficulty.COMPETITION ? 'Surprise Me!' : (selectedTopic === Topic.MIXED ? 'Start Mixed Set' : 'Generate Problem')} 
              {selectedDifficulty === Difficulty.COMPETITION ? <Sparkles className="w-4 h-4" /> : (selectedTopic === Topic.MIXED ? <Shuffle className="w-4 h-4" /> : <Zap className="w-4 h-4" />)}
            </button>
          </div>
        </div>

        {/* Analytics Charts Column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          
          {/* Radar Chart (Mastery Profile) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" /> Skill Profile
            </h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Mastery"
                    dataKey="A"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="#6366f1"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                     contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                     formatter={(value: number) => [`${value}/100`, 'Mastery']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scatter Chart (Volume vs Accuracy) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Effort vs. Accuracy
            </h3>
            {scatterData.length > 0 ? (
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Attempts" 
                      tick={{fontSize: 10}} 
                      label={{ value: 'Problems Solved', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#94a3b8' }} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Accuracy" 
                      unit="%" 
                      domain={[0, 100]} 
                      tick={{fontSize: 10}}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 200]} />
                    <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Topics" data={scatterData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-sm p-8">
                Solve more problems across different topics to see correlation data.
              </div>
            )}
          </div>

          {/* Trend Chart (Running Average) - Full Width below splits */}
          {historyData.length > 2 && (
            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Recent Performance Trend (Last 20)
              </h3>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="index" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      labelFormatter={(v) => `Attempt ${v}`} 
                      formatter={(v) => [`${v}%`, 'Avg Accuracy']}
                      contentStyle={{borderRadius: '8px'}}
                    />
                    <Line type="monotone" dataKey="average" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};