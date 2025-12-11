
export enum AppStatus {
  SETUP = 'SETUP',
  COUNTDOWN = 'COUNTDOWN',
  FLASHING = 'FLASHING',
  ANSWER_TIME = 'ANSWER_TIME', // The gap between questions to write answer
  FINISHED = 'FINISHED',
}

export enum CalculationMode {
  ALL_ADDITION = 'ALL_ADDITION', // Pure addition
  MIXED = 'MIXED', // Addition and Subtraction
  ALTERNATING = 'ALTERNATING', // Odd questions: Add, Even questions: Mixed
}

export enum FontSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  HUGE = 'HUGE'
}

export enum FontType {
  MONO = 'MONO',
  SANS = 'SANS',
  SERIF = 'SERIF',
  CURSIVE = 'CURSIVE',
  CUSTOM = 'CUSTOM'
}

export enum SoundType {
  CLASSIC = 'CLASSIC', // Sine
  DIGITAL = 'DIGITAL', // Square
  SOFT = 'SOFT',       // Triangle
  SHARP = 'SHARP'      // Sawtooth
}

export interface Settings {
  minDigits: number;
  maxDigits: number;
  numberCount: number; // "口数"
  intervalSeconds: number; // Display time per number
  blankGapSeconds: number; // Blank time between numbers
  mode: CalculationMode;
  answerDelaySeconds: number; // Time to write answer before next question
  totalQuestions: number; // How many questions in a set
  fontSize: FontSize;
  fontType: FontType;
  volume: number; // 0.0 to 1.0
  soundType: SoundType; // Used for Flash numbers
  countdownSoundType: SoundType; // Used for Countdown
  enableAnswerAnnouncements: boolean; // Voice announcement for remaining answer time
}

export interface Preset {
  id: string;
  name: string;
  group?: string;
  settings: Settings;
  timestamp: number;
}

export interface QuestionData {
  id: number;
  numbers: number[]; // Positive or negative
  answer: number;
  type: 'ADD' | 'MIXED';
}

export interface FlashState {
  currentQuestionIndex: number;
  currentNumberIndex: number; // Which number in the sequence is being shown
  currentDisplayValue: number | null; // Null implies blank screen interval if we implemented blink, but here we swap numbers
  questions: QuestionData[];
}

// --- AUTH TYPES ---

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  password: string; // Plaintext for this local-only demo
  name: string;
  role: UserRole;
  createdAt: number;
}
