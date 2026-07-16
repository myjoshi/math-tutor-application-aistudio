/**
 * Validates and corrects AI-generated question answers by extracting the
 * correct answer from the explanation steps. Catches AI hallucinations where
 * the correctAnswer field doesn't match the step-by-step solution.
 */

import { Question } from "../types";

interface ValidationResult {
  valid: boolean;
  extractedAnswer?: string;
  issue?: string;
  corrected: boolean;
}

/**
 * Extract the final numeric answer from explanation text.
 * Handles formats like "x = 6", "The answer is 6", "6 mph", etc.
 */
function extractNumericAnswerFromExplanation(explanation: string): string | null {
  if (!explanation || typeof explanation !== 'string') return null;

  // Pattern 1: "x = number" or "x = number units"
  const equalsMatch = explanation.match(/=\s*(\d+\.?\d*)/);
  if (equalsMatch) return equalsMatch[1];

  // Pattern 2: "answer is number" or "answer: number"
  const answerMatch = explanation.match(/(?:answer\s+(?:is|:|\s))\s*(\d+\.?\d*)/i);
  if (answerMatch) return answerMatch[1];

  // Pattern 3: Last standalone number in the text (common in solutions) - without trailing punctuation
  const lastNumberMatch = explanation.match(/(\d+\.?\d*)\s*(?:units|mph|feet|meters|cm|m|ft|°|degrees)?(?=[.!,\s]|$)/i);
  if (lastNumberMatch) return lastNumberMatch[1];

  // Pattern 4: Numbers after division/multiplication operators
  const mathMatch = explanation.match(/(?:÷|\/|×|\*|=)\s*(\d+\.?\d*)/);
  if (mathMatch) return mathMatch[1];

  // Pattern 5: Just find the last numeric value in the explanation
  const allNumbersMatch = explanation.match(/\d+\.?\d*/g);
  if (allNumbersMatch && allNumbersMatch.length > 0) {
    return allNumbersMatch[allNumbersMatch.length - 1];
  }

  return null;
}

/**
 * Normalize both student and correct answers for comparison.
 * Handles decimals, units, fractions, whitespace variations.
 */
export function normalizeAnswer(answer: string): string {
  if (!answer) return "";

  // Trim and lowercase
  let normalized = answer.trim().toLowerCase();

  // Remove common units: "mph", "feet", "m", "cm", etc.
  normalized = normalized.replace(/\s*(mph|km\/h|ft|feet|m|cm|mm|km|miles|seconds|hours|minutes|degrees|°|sq|square|cubic|cu)\s*$/, "");

  // Normalize spaces around operators
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Compare two answers with tolerance for numeric variations.
 * Returns true if answers match or are numerically equivalent.
 */
export function answersMatch(studentAnswer: string, correctAnswer: string): boolean {
  const s = normalizeAnswer(studentAnswer);
  const c = normalizeAnswer(correctAnswer);

  // Exact string match after normalization
  if (s === c) return true;

  // Try numeric comparison for decimal/integer variations
  const studentNum = parseFloat(s);
  const correctNum = parseFloat(c);

  if (!isNaN(studentNum) && !isNaN(correctNum)) {
    // Allow small tolerance for floating point (e.g., 3.14 vs 3.14159)
    const epsilon = 0.01;
    return Math.abs(studentNum - correctNum) < epsilon;
  }

  return false;
}

/**
 * Validate a question by checking if the correctAnswer matches the explanation.
 * If mismatch is found, extract the correct answer from explanation.
 */
export function validateQuestionAnswer(question: Question): ValidationResult {
  const { correctAnswer, explanation, type, questionText } = question;

  // For multiple-choice, verify correctAnswer is in options
  if (type === "multiple-choice" && question.options) {
    const answerInOptions = question.options.some(
      (opt) => normalizeAnswer(opt) === normalizeAnswer(correctAnswer)
    );

    if (!answerInOptions) {
      // Try to find the correct answer in explanation (e.g., "The answer is option C")
      const optionMatch = explanation.match(/(?:option\s+|answer\s+is\s+)([A-D])[.:]/i);
      if (optionMatch) {
        const optionLetter = optionMatch[1].toUpperCase();
        const optionIndex = optionLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        if (optionIndex >= 0 && optionIndex < question.options.length) {
          const extractedAnswer = question.options[optionIndex];
          return {
            valid: false,
            extractedAnswer,
            issue: `correctAnswer not in options list; extracted from explanation`,
            corrected: true
          };
        }
      }
      return {
        valid: false,
        issue: `correctAnswer "${correctAnswer}" not found in multiple-choice options`,
        corrected: false
      };
    }

    return { valid: true, corrected: false };
  }

  // For short-answer, extract numeric answer from explanation and validate
  if (type === "short-answer") {
    const extractedAnswer = extractNumericAnswerFromExplanation(explanation);

    if (!extractedAnswer) {
      // Could not extract answer from explanation
      return {
        valid: true, // Give it the benefit of the doubt if we can't extract
        issue: `Could not extract answer from explanation for validation`,
        corrected: false
      };
    }

    // Check if extracted answer matches stated correctAnswer
    if (answersMatch(extractedAnswer, correctAnswer)) {
      return { valid: true, corrected: false };
    }

    // Mismatch found - return extracted answer as correction
    return {
      valid: false,
      extractedAnswer,
      issue: `correctAnswer "${correctAnswer}" doesn't match explanation solution "${extractedAnswer}"`,
      corrected: true
    };
  }

  return { valid: true, corrected: false };
}

/**
 * Validate all questions in a test and auto-correct where needed.
 * Returns the test with corrected answers and a validation report.
 */
export interface QuestionValidationReport {
  totalQuestions: number;
  validQuestions: number;
  correctedQuestions: number;
  issues: Array<{
    questionId: string;
    issue: string;
    correctedFrom?: string;
    correctedTo?: string;
  }>;
}

export function validateAndCorrectQuestions(
  questions: Question[]
): { correctedQuestions: Question[]; report: QuestionValidationReport } {
  const report: QuestionValidationReport = {
    totalQuestions: questions.length,
    validQuestions: 0,
    correctedQuestions: 0,
    issues: []
  };

  const correctedQuestions = questions.map((q) => {
    const validation = validateQuestionAnswer(q);

    if (validation.valid && !validation.corrected) {
      report.validQuestions++;
      return q;
    }

    if (validation.corrected && validation.extractedAnswer) {
      report.correctedQuestions++;
      report.issues.push({
        questionId: q.id,
        issue: validation.issue || "Auto-corrected",
        correctedFrom: q.correctAnswer,
        correctedTo: validation.extractedAnswer
      });
      return {
        ...q,
        correctAnswer: validation.extractedAnswer
      };
    }

    // Issue found but not corrected
    if (validation.issue) {
      report.issues.push({
        questionId: q.id,
        issue: validation.issue || "Validation failed"
      });
    }

    return q;
  });

  return { correctedQuestions, report };
}
