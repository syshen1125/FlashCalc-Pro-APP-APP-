
import React from 'react';
import { FontSize, FontType } from '../types';
import { CUSTOM_FONT_FAMILY } from '../utils/fontUtils';
import { Play, Pause } from 'lucide-react';

interface Props {
  number: number | null;
  isFinished: boolean;
  questionIndex: number;
  totalQuestions: number;
  fontSize: FontSize;
  fontType: FontType;
  numberIndex: number; // Used as key for re-renders
  isPaused: boolean;
  onTogglePause: () => void;
}

export const FlashScreen: React.FC<Props> = ({ 
  number, 
  isFinished, 
  questionIndex, 
  totalQuestions,
  fontSize,
  fontType,
  numberIndex,
  isPaused,
  onTogglePause
}) => {
  
  const displayValue = number === null ? '' : number.toLocaleString('en-US');
  
  const getFontFamily = (type: FontType) => {
    switch (type) {
      case FontType.SANS: return 'system-ui, -apple-system, sans-serif';
      case FontType.SERIF: return 'Georgia, serif';
      case FontType.CURSIVE: return '"Comic Sans MS", "Chalkboard SE", cursive';
      case FontType.CUSTOM: return `'${CUSTOM_FONT_FAMILY}', sans-serif`;
      case FontType.MONO: default: return '"Roboto Mono", monospace';
    }
  };

  const getFontSize = (size: FontSize) => {
    switch (size) {
      case FontSize.SMALL: return 'clamp(3rem, 10vw, 8rem)';
      case FontSize.MEDIUM: return 'clamp(6rem, 25vw, 15rem)';
      case FontSize.LARGE: return 'clamp(9rem, 35vw, 20rem)';
      case FontSize.HUGE: return 'clamp(12rem, 50vw, 30rem)';
      default: return 'clamp(6rem, 25vw, 15rem)';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] relative w-full group">
      <div className="absolute top-0 left-0 p-4 text-slate-500 font-mono text-xl z-20">
        Question {questionIndex} / {totalQuestions}
      </div>
      
      {/* Pause Button - Visible on hover or when paused */}
      <button 
        onClick={onTogglePause}
        className={`absolute top-0 right-4 p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition z-30 shadow-lg border border-slate-700 ${isPaused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        title="Toggle Pause (Space)"
      >
        {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
      </button>

      {isPaused && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all">
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
             <div className="p-6 bg-slate-800 rounded-full shadow-2xl border-4 border-slate-700 text-cyan-400">
                <Pause size={48} fill="currentColor" />
             </div>
             <h2 className="text-3xl font-bold text-white tracking-widest">PAUSED</h2>
             <p className="text-slate-300 text-sm">Press Space to Resume</p>
          </div>
        </div>
      )}
      
      {isFinished ? (
        <div className={`text-6xl text-yellow-400 font-bold font-mono ${isPaused ? 'opacity-50' : 'animate-pulse'}`}>
           = ?
        </div>
      ) : (
        <div 
          key={`${questionIndex}-${numberIndex}`} // Force re-render on new number to ensure clean transition
          className={`font-bold transition-all duration-75 select-none text-white text-center w-full ${isPaused ? 'blur-sm opacity-50' : ''}`}
          style={{ 
            fontSize: getFontSize(fontSize),
            fontFamily: getFontFamily(fontType),
            lineHeight: 1
          }}
        >
          {displayValue}
        </div>
      )}
    </div>
  );
};
