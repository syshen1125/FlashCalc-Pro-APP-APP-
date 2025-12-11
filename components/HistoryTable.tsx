
import React, { useState, useEffect } from 'react';
import { QuestionData } from '../types';
import { Check, X, RotateCcw, Volume2, Square } from 'lucide-react';

interface Props {
  questions: QuestionData[];
  onReset: () => void;
  volume: number;
}

export const HistoryTable: React.FC<Props> = ({ questions, onReset, volume }) => {
  const [isReading, setIsReading] = useState(false);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleReadToggle = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    } else {
      startReading();
    }
  };

  const startReading = () => {
    window.speechSynthesis.cancel(); // Clear any pending speech
    setIsReading(true);

    // Attempt to find a UK English voice
    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('Great Britain'));

    const intro = new SpeechSynthesisUtterance("Checking answers.");
    intro.lang = 'en-GB';
    intro.volume = volume;
    if (ukVoice) {
      intro.voice = ukVoice;
    }
    window.speechSynthesis.speak(intro);

    questions.forEach((q, index) => {
      // Pause slightly between questions by text punctuation or separate utterances
      const text = `Question ${q.id}, ${q.answer}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.volume = volume;
      if (ukVoice) {
        utterance.voice = ukVoice;
      }
      utterance.rate = 0.9; // Slightly slower for better clarity

      // When the last utterance finishes, update state
      if (index === questions.length - 1) {
        utterance.onend = () => {
          setIsReading(false);
        };
      }
      
      // Error handling to reset state just in case
      utterance.onerror = () => {
        if (index === questions.length - 1) setIsReading(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Results Summary</h2>
        
        <div className="flex gap-3">
          <button
            onClick={handleReadToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded transition font-medium ${
              isReading 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
            }`}
          >
            {isReading ? (
              <>
                <Square size={18} fill="currentColor" />
                Stop
              </>
            ) : (
              <>
                <Volume2 size={18} />
                Read Answers
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition"
          >
            <RotateCcw size={18} />
            New Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((q) => (
          <div key={q.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <span className="text-6xl font-bold">{q.id}</span>
             </div>
            <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
               <span className="text-sm text-slate-400">Question {q.id} <span className="text-xs ml-2 px-1 rounded bg-slate-900 border border-slate-600">{q.type}</span></span>
            </div>
            
            <div className="flex flex-col gap-1 mb-3 font-mono text-lg text-slate-300 h-32 overflow-y-auto custom-scrollbar">
              {q.numbers.map((n, idx) => (
                <div key={idx} className={`text-right ${n < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {n}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-slate-600">
               <span className="text-slate-400">Ans:</span>
               <span className="text-2xl font-bold text-green-400">{q.answer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
