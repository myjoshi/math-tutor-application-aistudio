/**
 * Types representing the 6th-grade math topics, assessment questions, 
 * graded scanner outcomes, progress metrics, and chat structures.
 */

export interface TopicMastery {
  topicId: string;
  name: string;
  scoreCount: number;
  averageScore: number;
  masteryLevel: number; // 0 to 100
  lastTested: string | null;
  strengths: string[];
  weaknesses: string[];
}

export interface Question {
  id: string;
  questionText: string;
  type: "multiple-choice" | "short-answer";
  options?: string[]; // relevant for multiple-choice
  correctAnswer: string;
  explanation: string;
  hint: string;
}

export interface Assessment {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  questions: Question[];
  skillsTested: string[];
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  topicId: string;
  date: string;
  score: number; // percentage (0 - 100)
  totalQuestions: number;
  correctCount: number;
  userAnswers: { [questionId: string]: string };
  questions?: Question[]; // Full questions for review/replay
  feedback: {
    generalRemark: string;
    strengths: string[];
    improvements: string[];
  };
}

export interface ScannedPaperProblem {
  problemNumber: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  tutorEvaluation: string; // analysis of what the student did
  correctSteps: string[]; // step-by-step math solver explanation
  recommendedSkill: string; // e.g. "Long Division", "Least Common Multiple"
}

export interface ScannedPaperResult {
  id: string;
  date: string;
  title: string; // e.g., "Homework Sheet 4" or custom user label
  score: number | null; // estimated score out of 100 or fractional correct if detectable
  totalProblems: number;
  correctCount: number;
  imageUrl?: string; // base64 representation or illustrative
  generalFeedback: string;
  problems: ScannedPaperProblem[];
  keyConceptToImprove: string[];
  suggestedAction: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
  image?: string; // for image attachments in chat
}

export interface StudentProfile {
  name: string;
  grade: string;
  avatarUrl: string;
  points: number; // gamified encouragement points!
  badges: string[];
  skills: { [topicId: string]: TopicMastery };
}
