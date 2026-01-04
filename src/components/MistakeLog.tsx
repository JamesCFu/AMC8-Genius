import React, { useState } from 'react';
import { Question, Difficulty } from '../types';
import { ChevronLeft, ChevronDown, ChevronUp, BookX, CheckCircle, XCircle, Calendar, GraduationCap, Eye, RefreshCw, ArrowRight, Play } from 'lucide-react';

interface MistakeLogProps {
  mistakes: Question[];
  onBack: () => void;
  onRemove: (id: string) => void;
  onPractice: (question: Question) => void;
}

const MistakeItem: React.FC<{ question: Question; index: number; total: number; onRemove: (id: string) => void; onPractice: (q: Question) => void }> = ({ question, index, total, onRemove, onPractice }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submissionState, setSubmissionState] = useState<'IDLE' | 'CORRECT' | 'INCORRECT' | 'REVEALED'>('IDLE');

  const letterLabels = ['A', 'B', 'C', 'D', 'E'];

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    if (selectedOption === question.correctOptionIndex) {
      setSubmissionState('CORRECT');
    } else {
      setSubmissionState('INCORRECT');
    }
  };

  const handleShowSolution = () => {
    setSubmissionState('REVEALED');
  };

  const handleRetry = () => {
    setSubmissionState('IDLE');
    setSelectedOption(null);
  };

  const isInteractionDisabled = submissionState === 'CORRECT' || submissionState === 'REVEALED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200">
      {/* Header / Summary */}
      <div 
        onClick={handleExpand}
        className="p-5 cursor-pointer flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 group"
      >
        <div className="flex items-center gap-4 flex-1">
          <span className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-sm">
            {total - index}
          </span>
          <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded text-indigo-700 bg-indigo-50 border border-indigo-100 uppercase tracking-wide`}>
                  {question.topic}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${
                  question.difficulty === Difficulty.EASY ? 'text-green-700 bg-green-50 border-green-100' :
                  question.difficulty === Difficulty.MEDIUM ? 'text-yellow-700 bg-yellow-50 border-yellow-100' :
                  'text-red-700 bg-red-50 border-red-100'
                }`}>
                  {question.difficulty}
                </span>
                {submissionState === 'CORRECT' && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Solved
                  </span>
                )}
              </div>
              <p className="font-medium text-slate-800 line-clamp-1 pr-4">
                {question.problemText.substring(0, 80)}...
              </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPractice(question);
            }}
            className="hidden group-hover:flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm z-10"
          >
            <Play className="w-3 h-3 fill-current" /> Practice
          </button>
          <div className="text-slate-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-6 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-4">
              <Calendar className="w-3 h-3" /> {question.year} • #{question.questionNumber}
            </div>
            
            <p className="text-lg text-slate-800 font-medium mb-6 leading-relaxed font-serif">
              {question.problemText}
            </p>
            
            <div className="space-y-3 mb-6">
              {question.options.map((opt, idx) => {
                let itemClass = "w-full p-3 rounded-lg border text-sm flex items-center gap-3 transition-all ";
                
                // Logic for styling options based on state
                if (submissionState === 'CORRECT' || submissionState === 'REVEALED') {
                   // Final state: Show correct answer green, selected wrong answer red (if applicable)
                   if (idx === question.correctOptionIndex) {
                      itemClass += "bg-green-50 border-green-200 text-green-800 font-medium";
                   } else if (idx === selectedOption && submissionState !== 'REVEALED') {
                      itemClass += "bg-slate-50 border-slate-200 text-slate-400 opacity-75"; 
                   } else {
                      itemClass += "bg-white border-slate-100 text-slate-400 opacity-60";
                   }
                } else if (submissionState === 'INCORRECT' && idx === selectedOption) {
                   // Incorrect state: Show selected as red
                   itemClass += "bg-red-50 border-red-200 text-red-800";
                } else {
                   // Idle/Interactive state
                   if (selectedOption === idx) {
                      itemClass += "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm cursor-pointer";
                   } else {
                      itemClass += "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer text-slate-600";
                   }
                }

                return (
                  <button 
                    key={idx} 
                    onClick={() => !isInteractionDisabled && setSelectedOption(idx)}
                    disabled={isInteractionDisabled}
                    className={itemClass}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-bold ${
                      (submissionState === 'CORRECT' || submissionState === 'REVEALED') && idx === question.correctOptionIndex ? 'bg-green-200 border-green-300 text-green-800' :
                      submissionState === 'INCORRECT' && idx === selectedOption ? 'bg-red-200 border-red-300 text-red-800' :
                      selectedOption === idx ? 'bg-indigo-600 border-indigo-600 text-white' : 
                      'bg-slate-100 border-slate-300 text-slate-500'
                    }`}>
                        {letterLabels[idx]}
                    </span>
                    <span className="text-left flex-1">{opt}</span>
                    
                    {(submissionState === 'CORRECT' || submissionState === 'REVEALED') && idx === question.correctOptionIndex && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {submissionState === 'INCORRECT' && idx === selectedOption && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
               {submissionState === 'IDLE' && (
                  <div className="flex gap-2 w-full md:w-auto ml-auto">
                    <button 
                      onClick={handleShowSolution}
                      className="px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Show Solution
                    </button>
                    <button 
                      onClick={handleSubmit}
                      disabled={selectedOption === null}
                      className={`px-6 py-2 rounded-lg font-bold text-sm text-white transition-all ${
                        selectedOption === null ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                      }`}
                    >
                      Check Answer
                    </button>
                  </div>
               )}

               {submissionState === 'INCORRECT' && (
                  <div className="flex items-center justify-between w-full bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
                    <span className="text-red-700 font-bold text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Incorrect. Try again?
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleShowSolution}
                        className="text-xs font-bold text-red-600 hover:text-red-800 underline px-2"
                      >
                        Give Up
                      </button>
                      <button 
                        onClick={() => setSubmissionState('IDLE')}
                        className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded-md text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        Retry Inline
                      </button>
                    </div>
                  </div>
               )}

               {(submissionState === 'CORRECT' || submissionState === 'REVEALED') && (
                  <div className="w-full animate-fade-in">
                     <div className={`p-4 rounded-xl border mb-4 ${
                       submissionState === 'CORRECT' ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-200'
                     }`}>
                        <div className="flex items-center gap-2 mb-2">
                           {submissionState === 'CORRECT' ? (
                             <span className="text-green-800 font-bold flex items-center gap-2">
                               <CheckCircle className="w-5 h-5" /> Excellent! You got it right.
                             </span>
                           ) : (
                             <span className="text-slate-700 font-bold flex items-center gap-2">
                               <BookX className="w-5 h-5" /> Solution Revealed
                             </span>
                           )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm uppercase mt-4 mb-2">Explanation</h4>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {question.explanation}
                        </p>
                        {question.hint && (
                           <div className="mt-3 pt-3 border-t border-slate-200/50">
                             <span className="text-xs font-bold text-slate-500 uppercase">Hint used: </span>
                             <span className="text-sm text-slate-600 italic">{question.hint}</span>
                           </div>
                        )}
                     </div>
                     
                     <div className="flex justify-end gap-3">
                       {/* Show Remove button only when correctly answered */}
                       {submissionState === 'CORRECT' && (
                           <button 
                            onClick={() => onRemove(question.id)}
                            className="flex items-center gap-2 bg-green-600 text-white font-bold text-sm hover:bg-green-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                           >
                             <CheckCircle className="w-4 h-4" /> Resolve & Remove
                           </button>
                       )}
                       
                       <button 
                        onClick={() => onPractice(question)}
                        className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                       >
                         <Play className="w-4 h-4" /> Practice Again
                       </button>
                     </div>
                  </div>
               )}
            </div>
        </div>
      )}
    </div>
  );
};

export const MistakeLog: React.FC<MistakeLogProps> = ({ mistakes, onBack, onRemove, onPractice }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in pb-24">
       <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <ChevronLeft className="w-5 h-5" /> Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-red-100 p-3 rounded-xl">
           <BookX className="w-8 h-8 text-red-600" />
        </div>
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Mistake Log</h1>
           <p className="text-slate-500">Retry these questions to master your weak spots.</p>
        </div>
      </div>

      {mistakes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
           <GraduationCap className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-slate-800 mb-2">Clean Record!</h3>
           <p className="text-slate-500 max-w-md mx-auto">
             You haven't recorded any mistakes yet. Keep practicing to challenge yourself, or try a higher difficulty!
           </p>
           <button onClick={onBack} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
              Start Practicing
           </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((question, index) => (
             <MistakeItem 
                key={question.id} 
                question={question} 
                index={index} 
                total={mistakes.length} 
                onRemove={onRemove}
                onPractice={onPractice}
             />
          ))}
        </div>
      )}
    </div>
  );
};
