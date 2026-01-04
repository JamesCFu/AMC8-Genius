import React, { useState } from 'react';
import { Question, Difficulty } from '../types';
import { ArrowRight, Lightbulb, CheckCircle, XCircle, Home, BrainCircuit } from 'lucide-react';

interface QuizViewProps {
  question: Question;
  loading: boolean;
  isDiagnostic?: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  onExit: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ question, loading, isDiagnostic, onAnswer, onNext, onExit }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // If loading new question while component is mounted
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-medium text-slate-700 animate-pulse">
          {isDiagnostic ? 'Selecting Diagnostic Problem...' : 'Retrieving from Archives...'}
        </h2>
        <p className="text-slate-500 mt-2">Opening the {question?.topic || 'math'} vault...</p>
      </div>
    );
  }

  const handleOptionClick = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    onAnswer(selectedOption === question.correctOptionIndex);
  };

  const isCorrect = selectedOption === question.correctOptionIndex;
  const letterLabels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in pb-24">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        {!isDiagnostic ? (
          <button 
            onClick={onExit}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" /> Dashboard
          </button>
        ) : (
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <BrainCircuit className="w-5 h-5" /> Diagnostic Mode
          </div>
        )}
        
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
          ${question.difficulty === Difficulty.EASY ? 'bg-green-100 text-green-700' : 
            question.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' : 
            question.difficulty === Difficulty.HARD ? 'bg-orange-100 text-orange-700' :
            'bg-purple-100 text-purple-700'
          }`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{question.topic}</h2>
             <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {question.id}</span>
          </div>
          
          <p className="text-xl md:text-2xl text-slate-800 leading-relaxed font-medium font-serif">
            {question.problemText}
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3 bg-white">
          {question.options.map((option, idx) => {
            let itemClass = "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center group ";
            
            if (isSubmitted) {
              if (idx === question.correctOptionIndex) {
                itemClass += "border-green-500 bg-green-50 text-green-800";
              } else if (idx === selectedOption) {
                itemClass += "border-red-500 bg-red-50 text-red-800";
              } else {
                itemClass += "border-slate-100 opacity-50";
              }
            } else {
              if (selectedOption === idx) {
                itemClass += "border-indigo-600 bg-indigo-50 shadow-sm";
              } else {
                itemClass += "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={isSubmitted}
                className={itemClass}
              >
                <span className={`
                  w-8 h-8 rounded-full flex items-center justify-center mr-4 text-sm font-bold
                  ${isSubmitted && idx === question.correctOptionIndex ? 'bg-green-200 text-green-700' : 
                    isSubmitted && idx === selectedOption ? 'bg-red-200 text-red-700' :
                    selectedOption === idx ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'}
                `}>
                  {letterLabels[idx]}
                </span>
                <span className="text-lg">{option}</span>
                
                {isSubmitted && idx === question.correctOptionIndex && (
                  <CheckCircle className="ml-auto w-6 h-6 text-green-500" />
                )}
                {isSubmitted && idx === selectedOption && idx !== question.correctOptionIndex && (
                  <XCircle className="ml-auto w-6 h-6 text-red-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Area */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center">
          
          {!isSubmitted ? (
            <>
              {/* Hide hints in Diagnostic mode */}
              {!isDiagnostic ? (
                <button 
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <Lightbulb className="w-5 h-5" /> {showHint ? 'Hide Hint' : 'Need a Hint?'}
                </button>
              ) : <div />} 
              
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className={`
                  px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                  ${selectedOption === null ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'}
                `}
              >
                Submit Answer
              </button>
            </>
          ) : (
            <div className="w-full">
               <div className={`mb-6 p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <h3 className={`font-bold text-lg mb-2 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Excellent Work!' : 'Not quite right yet.'}
                  </h3>
                  <div className="text-slate-700 leading-relaxed">
                    <span className="font-semibold block mb-1">Solution:</span>
                    {question.explanation}
                  </div>
               </div>
               
               <button
                onClick={() => {
                  setSelectedOption(null);
                  setIsSubmitted(false);
                  setShowHint(false);
                  onNext();
                }}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isDiagnostic ? 'Next Diagnostic Question' : 'Next Problem'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        
        {/* Hint Display */}
        {showHint && !isSubmitted && !isDiagnostic && (
          <div className="bg-amber-50 p-4 border-t border-amber-100 text-amber-900 animate-fade-in">
            <span className="font-bold mr-2">Hint:</span> {question.hint}
          </div>
        )}
      </div>
    </div>
  );
};

