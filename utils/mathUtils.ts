import { CalculationMode, QuestionData, Settings } from '../types';

/**
 * Generates a random integer with d digits.
 * e.g., d=2 -> 10 to 99
 */
const getRandomNumber = (digits: number): number => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random integer having between minDigits and maxDigits.
 */
const getRandomValue = (minDigits: number, maxDigits: number): number => {
  const digits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;
  return getRandomNumber(digits);
};

export const generateQuestionSet = (settings: Settings): QuestionData[] => {
  const questions: QuestionData[] = [];

  for (let qIdx = 1; qIdx <= settings.totalQuestions; qIdx++) {
    let isMixed = false;

    // Determine type based on mode
    if (settings.mode === CalculationMode.ALL_ADDITION) {
      isMixed = false;
    } else if (settings.mode === CalculationMode.MIXED) {
      isMixed = true;
    } else if (settings.mode === CalculationMode.ALTERNATING) {
      // User requirement: "Odd questions All Add, Even questions Mixed"
      // qIdx 1 (odd) -> Add, qIdx 2 (even) -> Mixed
      isMixed = qIdx % 2 === 0;
    }

    const numbers: number[] = [];
    let currentSum = 0;

    for (let i = 0; i < settings.numberCount; i++) {
      let val = getRandomValue(settings.minDigits, settings.maxDigits);

      if (i === 0) {
        // First number is always positive
        numbers.push(val);
        currentSum += val;
      } else {
        if (!isMixed) {
          // Pure addition
          numbers.push(val);
          currentSum += val;
        } else {
          // Mixed: Randomly decide add or sub
          // Constraint: currentSum + nextVal >= 0 (No negative intermediate)
          const isSubtract = Math.random() > 0.5;
          
          if (isSubtract) {
            if (currentSum - val >= 0) {
              numbers.push(-val);
              currentSum -= val;
            } else {
              // Cannot subtract, force addition
              numbers.push(val);
              currentSum += val;
            }
          } else {
            numbers.push(val);
            currentSum += val;
          }
        }
      }
    }

    questions.push({
      id: qIdx,
      numbers,
      answer: currentSum,
      type: isMixed ? 'MIXED' : 'ADD',
    });
  }

  return questions;
};