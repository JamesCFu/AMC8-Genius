import React, { useState } from 'react';
import { Question } from '../types';
import { Clock, CheckCircle, XCircle, AlertCircle, Check, ArrowRight, BrainCircuit, Timer } from 'lucide-react';

interface MockTestViewProps {
  questions: Question[];
  timerValue: number;
  isReviewMode: boolean;
  userAnswers: Record<string, number>;
  onAnswer: (questionId: string, optionIndex: number) => void;
  onSubmit: () => void;
  onExit: () => void;
}

const TOTAL_TIME = 40 * 60; // 40 minutes in seconds

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const MockQuestionCard: React.FC<{
  question: Question;
  index: number;
  selectedOption: number | undefined;
  isReviewMode: boolean;
  onSelect: (idx: number) => void;
}> = ({ question, index, selectedOption, isReviewMode, onSelect }) => {
  const letterLabels = ['A', 'B', 'C', 'D', 'E'];
  const isCorrect = selectedOption === question.correctOptionIndex;

  return (
    <div id={`question-${question.id}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden scroll-mt-36">
      <div className="p-6 bg-slate-50/50 border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-3">
              <span className="bg-slate-200 text-slate-600 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                {index + 1}
              </span>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                {question.topic}
              </span>
           </div>
           {isReviewMode && (
             <div className={`flex items-center gap-1 text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
               {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
               {isCorrect ? 'Correct' : 'Incorrect'}
             </div>
           )}
        </div>
        
        <p className="text-lg text-slate-800 font-medium font-serif leading-relaxed">
          {question.problemText}
        </p>
      </div>

      <div className="p-6 space-y-3">
        {question.options.map((option, idx) => {
          let itemClass = "w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-all ";
          
          if (isReviewMode) {
             if (idx === question.correctOptionIndex) {
               itemClass += "bg-green-50 border-green-300 text-green-800 font-medium";
             } else if (idx === selectedOption) {
               itemClass += "bg-red-50 border-red-300 text-red-800";
             } else {
               itemClass += "opacity-50 border-slate-100";
             }
          } else {
             if (selectedOption === idx) {
               itemClass += "bg-indigo-600 border-indigo-600 text-white shadow-md";
             } else {
               itemClass += "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700";
             }
          }

          return (
            <button
              key={idx}
              onClick={() => !isReviewMode && onSelect(idx)}
              disabled={isReviewMode}
              className={itemClass}
            >
               <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-bold ${
                  !isReviewMode && selectedOption === idx ? 'bg-white text-indigo-600 border-white' : 
                  'bg-slate-100 border-slate-300 text-slate-500'
               }`}>
                  {letterLabels[idx]}
               </span>
               <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>
      
      {isReviewMode && !isCorrect && (
         <div className="p-4 bg-yellow-50 border-t border-yellow-100 text-yellow-900 text-sm">
            <span className="font-bold block mb-1">Solution:</span>
            {question.explanation}
         </div>
      )}
    </div>
  );
};

export const MockTestView: React.FC<MockTestViewProps> = ({ 
  questions, 
  timerValue, 
  isReviewMode, 
  userAnswers, 
  onAnswer, 
  onSubmit, 
  onExit 
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const answeredCount = Object.keys(userAnswers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const timePercent = Math.max(0, (timerValue / TOTAL_TIME) * 100);
  
  // Calculate score for review mode display
  const correctCount = isReviewMode 
    ? questions.filter(q => userAnswers[q.id] === q.correctOptionIndex).length 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
       {/* Sticky Header */}
       <div className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-md transition-all relative">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                   <BrainCircuit className="w-6 h-6" />
                   <span className="hidden md:inline">Full Mock Test</span>
                </div>
                {!isReviewMode && (
                   <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm border ${
                      timerValue < 300 
                        ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                   }`}>
                     <Timer className="w-4 h-4" />
                     <span>{formatTime(timerValue)}</span>
                   </div>
                )}
             </div>

             <div className="flex items-center gap-4">
                {isReviewMode ? (
                   <div className="text-right">
                      <div className="text-xs text-slate-500 font-bold uppercase">Final Score</div>
                      <div className="text-xl font-bold text-indigo-600">{correctCount} / {questions.length}</div>
                   </div>
                ) : (
                   <div className="flex flex-col items-end min-w-[100px]">
                      <div className="flex justify-between w-full text-xs font-bold text-slate-500 mb-1">
                         <span>Progress</span>
                         <span>{answeredCount}/{questions.length}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                           style={{ width: `${progress}%` }}
                         />
                      </div>
                   </div>
                )}
                
                {isReviewMode && (
                   <button 
                     onClick={onExit}
                     className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                   >
                     Exit Review
                   </button>
                )}
             </div>
          </div>

          {/* Time Remaining Visual Bar */}
          {!isReviewMode && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100/50">
               <div 
                 className={`h-full transition-all duration-1000 ease-linear ${
                    timerValue < 300 ? 'bg-red-500' : 
                    timerValue < 600 ? 'bg-orange-500' :
                    'bg-indigo-600'
                 }`}
                 style={{ width: `${timePercent}%` }}
               />
            </div>
          )}
       </div>

       {/* Question List */}
       <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          {!isReviewMode && (
             <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                   This is a timed mock exam. You can scroll freely to answer questions in any order. 
                   Click <strong>Submit Test</strong> at the bottom when you are finished.
                </p>
             </div>
          )}

          {questions.map((q, i) => (
             <MockQuestionCard 
                key={q.id}
                question={q}
                index={i}
                selectedOption={userAnswers[q.id]}
                isReviewMode={isReviewMode}
                onSelect={(optIdx) => onAnswer(q.id, optIdx)}
             />
          ))}
       </div>

       {/* Footer / Submit Bar */}
       {!isReviewMode && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-[100]">
             <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                <div className="text-sm text-slate-500 font-medium hidden md:block">
                   {questions.length - answeredCount} unanswered questions remaining
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full md:w-auto ml-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> Submit Assessment
                </button>
             </div>
          </div>
       )}

       {/* Confirmation Modal */}
       {showConfirm && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
               <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                     <AlertCircle className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 mb-1">Submit Assessment?</h3>
                     <p className="text-slate-600 leading-relaxed">
                        You have answered <span className="font-bold text-slate-900">{answeredCount}</span> of <span className="font-bold text-slate-900">{questions.length}</span> questions.
                     </p>
                     {answeredCount < questions.length && (
                        <p className="text-red-600 font-medium text-sm mt-2 flex items-center gap-1">
                           <AlertCircle className="w-4 h-4" />
                           {questions.length - answeredCount} questions are still unanswered.
                        </p>
                     )}
                  </div>
               </div>
               
               <div className="flex items-center justify-end gap-3">
                  <button 
                     onClick={() => setShowConfirm(false)}
                     className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                     Keep Working
                  </button>
                  <button 
                     onClick={() => {
                        setShowConfirm(false);
                        onSubmit();
                     }}
                     className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center gap-2"
                  >
                     Yes, Submit Test
                  </button>
               </div>
            </div>
        </div>
       )}
    </div>
  );
};