import React, { useState } from 'react';
import { UserStats } from '../types';
import { Trash2, ShieldAlert, Award, Calendar, ChevronLeft, User } from 'lucide-react';

interface ProfileViewProps {
  stats: UserStats;
  onResetData: () => void;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ stats, onResetData, onBack }) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <ChevronLeft className="w-5 h-5" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
              <span className="text-4xl font-bold">{stats.level}</span>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">Student Profile</h1>
              <div className="flex items-center justify-center md:justify-start gap-4 text-indigo-100 text-sm">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> Math Whiz</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> AMC 8 Aspirant</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12 pointer-events-none"></div>
        </div>

        {/* Stats Summary */}
        <div className="p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Award className="text-indigo-600" /> Career Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Total XP</div>
              <div className="text-3xl font-bold text-slate-800">{stats.xp.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Problems Solved</div>
              <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Accuracy</div>
              <div className="text-3xl font-bold text-slate-800">
                {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
              </div>
            </div>
          </div>

          <hr className="border-slate-100 mb-12" />

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-xl border border-red-100 p-6">
            <h3 className="text-red-800 font-bold text-lg mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-red-700 mb-6 max-w-2xl">
              Resetting your data will permanently delete all your progress, history, mastery scores, and XP. 
              This action cannot be undone.
            </p>
            <button
              onClick={() => {
                if (confirmReset) {
                  onResetData();
                } else {
                  setConfirmReset(true);
                  // Reset button state after 3 seconds if not confirmed
                  setTimeout(() => setConfirmReset(false), 3000);
                }
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-sm ${
                confirmReset 
                  ? 'bg-red-600 text-white hover:bg-red-700 border border-red-700 animate-pulse' 
                  : 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300'
              }`}
            >
              <Trash2 className="w-4 h-4" /> 
              {confirmReset ? "Click Again to Confirm Reset" : "Clear All Data & Reset App"}
            </button>
            {confirmReset && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                Click the button again to verify action.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};