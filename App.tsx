
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppStatus, CalculationMode, Settings, FlashState, FontSize, FontType, SoundType } from './types';
import { generateQuestionSet } from './utils/mathUtils';
import { playBeep, initAudio, speakText, stopSpeech } from './utils/sound';
import { loadCustomFontFromStorage } from './utils/fontUtils';
import { SettingsForm } from './components/SettingsForm';
import { FlashScreen } from './components/FlashScreen';
import { HistoryTable } from './components/HistoryTable';
import { Timer, XCircle } from 'lucide-react';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  minDigits: 1,
  maxDigits: 2,
  numberCount: 5,
  intervalSeconds: 1.0,
  blankGapSeconds: 0.0,
  mode: CalculationMode.ALTERNATING,
  answerDelaySeconds: 5,
  totalQuestions: 5,
  fontSize: FontSize.MEDIUM,
  fontType: FontType.MONO,
  volume: 0.5,
  soundType: SoundType.CLASSIC,
  countdownSoundType: SoundType.SOFT,
  enableAnswerAnnouncements: false
};

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.SETUP);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  
  // Logic State
  const [flashState, setFlashState] = useState<FlashState>({
    currentQuestionIndex: 0,
    currentNumberIndex: -1,
    currentDisplayValue: null,
    questions: [],
  });

  const [countdown, setCountdown] = useState(3);
  const [answerTimer, setAnswerTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Refs for timers to clear them effectively
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize things on mount
  useEffect(() => {
    // Attempt to load custom font if it exists in storage
    loadCustomFontFromStorage();
  }, []);

  // Start the session
  const handleStart = () => {
    initAudio(); // Initialize audio context on user interaction
    const questions = generateQuestionSet(settings);
    setFlashState({
      currentQuestionIndex: 0,
      currentNumberIndex: -1,
      currentDisplayValue: null,
      questions,
    });
    setCountdown(3);
    setStatus(AppStatus.COUNTDOWN);
    setIsPaused(false);
  };

  // Stop/Reset
  const handleReset = () => {
    stopSpeech(); // Stop any ongoing speech
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    if (answerIntervalRef.current) clearTimeout(answerIntervalRef.current);
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    setStatus(AppStatus.SETUP);
    setIsPaused(false);
  };

  // Flash Logic Control
  const showNextNumber = useCallback((qIndex: number, nIndex: number) => {
    // CRITICAL FIX: Clear any existing timer to prevent double-invocation loops
    if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
    }

    const currentQ = flashState.questions[qIndex];
    
    if (!currentQ) {
       setStatus(AppStatus.FINISHED);
       return;
    }

    if (nIndex >= currentQ.numbers.length) {
      // Finished showing numbers for this question
      setFlashState(prev => ({ ...prev, currentDisplayValue: null }));
      
      // Go to Answer Time
      setAnswerTimer(settings.answerDelaySeconds);
      setStatus(AppStatus.ANSWER_TIME);
      return;
    }

    // Show the number
    const num = currentQ.numbers[nIndex];
    setFlashState(prev => ({
      ...prev,
      currentQuestionIndex: qIndex,
      currentNumberIndex: nIndex,
      currentDisplayValue: num,
    }));
    
    // Play sound effect for number flash (Higher pitch, sharp) using Flash settings
    playBeep(1200, 0.08, settings.volume, settings.soundType);

    // Schedule next logic
    const duration = Math.max(0.05, settings.intervalSeconds) * 1000;
    
    flashTimerRef.current = setTimeout(() => {
        // If there is a blank gap configured
        if (settings.blankGapSeconds > 0) {
            // Show blank
            setFlashState(prev => ({ ...prev, currentDisplayValue: null }));
            
            // Wait for gap then show next
            flashTimerRef.current = setTimeout(() => {
                showNextNumber(qIndex, nIndex + 1);
            }, settings.blankGapSeconds * 1000);
        } else {
            // Immediate transition
            showNextNumber(qIndex, nIndex + 1);
        }
    }, duration);

  }, [flashState.questions, settings.intervalSeconds, settings.blankGapSeconds, settings.answerDelaySeconds, settings.volume, settings.soundType]);

  // Pause Handler
  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => {
      const nextIsPaused = !prev;
      
      if (nextIsPaused) {
        // --- PAUSING ---
        stopSpeech();
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        if (answerIntervalRef.current) clearTimeout(answerIntervalRef.current);
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      } else {
        // --- RESUMING ---
        // If we were in the middle of flashing numbers, we need to restart the loop manually
        if (status === AppStatus.FLASHING) {
           const { currentQuestionIndex, currentNumberIndex, currentDisplayValue } = flashState;
           
           if (currentDisplayValue !== null) {
              // We were displaying a number. Re-show it (this restarts the display duration).
              showNextNumber(currentQuestionIndex, currentNumberIndex);
           } else {
              // We were in a blank gap (currentDisplayValue is null).
              // Schedule the next number after the gap time.
              flashTimerRef.current = setTimeout(() => {
                  showNextNumber(currentQuestionIndex, currentNumberIndex + 1);
              }, settings.blankGapSeconds * 1000);
           }
        }
        // Note: For COUNTDOWN and ANSWER_TIME, the useEffects depend on `isPaused` and will restart automatically.
      }
      return nextIsPaused;
    });
  }, [status, flashState, showNextNumber, settings.blankGapSeconds]);

  // Global Keyboard Listener for Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (status === AppStatus.FLASHING || status === AppStatus.ANSWER_TIME || status === AppStatus.COUNTDOWN) {
           e.preventDefault(); // Prevent scrolling
           handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleTogglePause]);


  // Helper to handle the "Question X" announcement -> Delay -> Flash Sequence
  const startQuestionSequence = useCallback((qIndex: number) => {
      // Speak "Question X"
      speakText(`Question ${qIndex + 1}`, settings.volume);

      // Give it time to speak (approx 1.5s) before starting the flashes
      sequenceTimerRef.current = setTimeout(() => {
          setFlashState(prev => ({
             ...prev,
             currentQuestionIndex: qIndex,
             currentNumberIndex: -1,
             currentDisplayValue: null
           }));
           setStatus(AppStatus.FLASHING);
           showNextNumber(qIndex, 0);
      }, 1500);
  }, [settings.volume, showNextNumber]);

  // Countdown Effect
  useEffect(() => {
    if (status === AppStatus.COUNTDOWN && !isPaused) {
      if (countdown > 0) {
        // Racing game style logic: 3 (Low), 2 (Low), 1 (High/Tension)
        const frequency = countdown === 1 ? 1000 : 500;
        
        playBeep(frequency, 0.15, settings.volume, settings.countdownSoundType); 
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else if (countdown === 0) {
        // "START" phase
        playBeep(1500, 0.25, settings.volume, settings.countdownSoundType);
        
        // Wait 1 second on "START" before announcing question
        const timer = setTimeout(() => {
           // Transition to announcement phase (which leads to FLASHING)
           startQuestionSequence(0);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [status, countdown, isPaused, settings.volume, settings.countdownSoundType, startQuestionSequence]);


  // Answer Delay Timer
  useEffect(() => {
    if (status === AppStatus.ANSWER_TIME && !isPaused) {
      // Voice Announcement Logic
      if (settings.enableAnswerAnnouncements && answerTimer > 0) {
        if (answerTimer <= 5) {
          // Final countdown: 5, 4, 3, 2, 1
          speakText(answerTimer.toString(), settings.volume);
        } else if (answerTimer % 5 === 0) {
          // Periodic update for longer waits
          speakText(`Time remaining: ${answerTimer} seconds`, settings.volume);
        }
      }

      if (answerTimer > 0) {
        answerIntervalRef.current = setTimeout(() => {
          setAnswerTimer(t => t - 1);
        }, 1000);
        return () => {
          if (answerIntervalRef.current) clearTimeout(answerIntervalRef.current);
        };
      } else {
        // Timer finished, move to next question or finish
        const nextQIdx = flashState.currentQuestionIndex + 1;
        if (nextQIdx < flashState.questions.length) {
           // Start the announcement sequence for the next question
           startQuestionSequence(nextQIdx);
        } else {
          setStatus(AppStatus.FINISHED);
        }
      }
    }
  }, [status, answerTimer, isPaused, flashState.currentQuestionIndex, flashState.questions.length, startQuestionSequence, settings.enableAnswerAnnouncements, settings.volume]);


  // --- Render ---

  if (status === AppStatus.SETUP) {
    return <SettingsForm settings={settings} onUpdate={setSettings} onStart={handleStart} />;
  }

  if (status === AppStatus.FINISHED) {
    return <HistoryTable questions={flashState.questions} onReset={handleReset} volume={settings.volume} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden relative">
      {/* Top Bar */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10">
        <div className="text-slate-500 font-mono text-sm">
          Mode: {settings.mode} | Speed: {settings.intervalSeconds}s {settings.blankGapSeconds > 0 ? `+ ${settings.blankGapSeconds}s` : ''}
        </div>
        <button onClick={handleReset} className="text-slate-400 hover:text-red-400 transition">
          <XCircle size={32} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        
        {status === AppStatus.COUNTDOWN && (
          <div className={`font-bold text-cyan-500 animate-ping opacity-75 ${countdown === 0 ? 'text-7xl' : 'text-9xl'} ${isPaused ? 'opacity-20 animate-none' : ''}`}>
            {countdown === 0 ? "START" : countdown}
          </div>
        )}

        {status === AppStatus.FLASHING && (
          <FlashScreen 
            number={flashState.currentDisplayValue} 
            isFinished={false}
            questionIndex={flashState.currentQuestionIndex + 1}
            totalQuestions={settings.totalQuestions}
            fontSize={settings.fontSize}
            fontType={settings.fontType}
            numberIndex={flashState.currentNumberIndex}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
          />
        )}

        {status === AppStatus.ANSWER_TIME && (
           <div className="flex flex-col items-center w-full relative">
              <FlashScreen 
                number={null} 
                isFinished={true} 
                questionIndex={flashState.currentQuestionIndex + 1}
                totalQuestions={settings.totalQuestions}
                fontSize={settings.fontSize}
                fontType={settings.fontType}
                numberIndex={-1}
                isPaused={isPaused}
                onTogglePause={handleTogglePause}
              />
              {!isPaused && (
                <div className="mt-12 flex items-center gap-4 text-orange-400 bg-slate-800 px-8 py-4 rounded-full border border-orange-500/30 shadow-lg shadow-orange-500/10">
                  <Timer className="animate-spin-slow" />
                  <span className="text-2xl font-mono font-bold">Write Answer: {answerTimer}s</span>
                </div>
              )}
           </div>
        )}
        
        {/* Pause Overlay for Countdown/Generic */}
        {isPaused && status === AppStatus.COUNTDOWN && (
           <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
              <div className="text-4xl text-white font-bold flex flex-col items-center gap-4">
                  <span>PAUSED</span>
                  <button onClick={handleTogglePause} className="text-sm bg-cyan-600 px-6 py-2 rounded-full hover:bg-cyan-500">Resume</button>
              </div>
           </div>
        )}

      </div>
      
      {/* Footer Info */}
      <div className="absolute bottom-0 w-full p-4 text-center text-slate-700">
         FlashCalc Pro System | Press Space to Pause
      </div>
    </div>
  );
};

export default App;
