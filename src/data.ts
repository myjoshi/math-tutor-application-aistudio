import { StudentProfile } from "./types";

export const INITIAL_TOPICS = {
  ratios: {
    topicId: "ratios",
    name: "Ratios & Rates",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  },
  number_system: {
    topicId: "number_system",
    name: "The Number System",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  },
  expressions: {
    topicId: "expressions",
    name: "Equations & Expressions",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  },
  geometry: {
    topicId: "geometry",
    name: "Geometry & Space",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  },
  statistics: {
    topicId: "statistics",
    name: "Statistics & Plots",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  }
};

export const INSTANT_TUTOR_QUESTIONS = [
  {
    topicId: "ratios",
    topicName: "Ratios & Rates",
    title: "Ratio and Rates Challenge",
    skillsTested: ["Equivalent Ratios", "Unit Rates", "Percents"],
    questions: [
      {
        id: "q1",
        questionText: "A recipe uses 3 cups of flour for every 2 cups of sugar. If you use 9 cups of flour, how many cups of sugar do you need?",
        type: "multiple-choice",
        options: ["4 cups", "5 cups", "6 cups", "8 cups"],
        correctAnswer: "6 cups",
        explanation: "Since the ratio of flour to sugar is 3:2, you multiplier is 3 (9 / 3 = 3). So, you multiply the sugar by 3: 2 cups * 3 = 6 cups sugar.",
        hint: "Find how many times larger 9 cups of flour is compared to the original 3 cups, then apply that same factor to the sugar!"
      },
      {
        id: "q2",
        questionText: "A cyclist travels 45 miles in 3 hours. What is the cyclist's unit rate in miles per hour (mph)?",
        type: "short-answer",
        correctAnswer: "15",
        explanation: "To find the unit rate, divide the total distance by the total hours: 45 miles / 3 hours = 15 miles per hour.",
        hint: "To get the miles for just 1 hour, divide the total miles (45) by the total hours (3)."
      },
      {
        id: "q3",
        questionText: "What is 25% of 80?",
        type: "multiple-choice",
        options: ["10", "20", "25", "40"],
        correctAnswer: "20",
        explanation: "25% is the same as the fraction 25/100, which simplifies to 1/4. Finding 1/4 of 80 means dividing 80 by 4, which is 20.",
        hint: "Remember that 25% represents the fraction 1/4. What is one-fourth of 80?"
      }
    ]
  },
  {
    topicId: "number_system",
    topicName: "The Number System",
    title: "Understanding Number Systems",
    skillsTested: ["Fractions", "Decimals", "Absolute Value"],
    questions: [
      {
        id: "q4",
        questionText: "What is 3/4 divided by 1/2?",
        type: "multiple-choice",
        options: ["3/8", "1/2", "1 1/2", "2"],
        correctAnswer: "1 1/2",
        explanation: "To divide by a fraction, multiply by its reciprocal: 3/4 * 2/1 = 6/4 = 1 2/4 = 1 1/2.",
        hint: "Use the Keep-Change-Flip strategy! Keep the 3/4, change divide to multiply, and flip 1/2 to 2/1."
      },
      {
        id: "q5",
        questionText: "Solve: 12.5 × 0.4",
        type: "short-answer",
        correctAnswer: "5",
        explanation: "Multiply as if they are whole numbers: 125 * 4 = 500. Then place the decimal point. There are two decimal places in total (one in 12.5 and one in 0.4). So 500 becomes 5.00 or just 5.",
        hint: "Multiply 125 by 4 first, then count how many numbers are behind decimal points in your problem and shift the decimal in your answer!"
      }
    ]
  }
];

export const BADGE_LIST = [
  { id: "ratio_ranger", name: "Ratio Ranger", desc: "Completed a Ratios assessment", icon: "🏹", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { id: "fraction_fanatic", name: "Fraction Fanatic", desc: "Scored 100% on The Number System", icon: "🍰", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "equation_explorer", name: "Equation Explorer", desc: "Created or completed an Algebra practice", icon: "🔑", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { id: "geometry_giant", name: "Geometry Giant", desc: "Analyzed area or volume with Tutor Mathy", icon: "📐", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { id: "data_detective", name: "Data Detective", desc: "Learned stats and histograms", icon: "🔍", color: "bg-rose-100 text-rose-700 border-rose-300" },
  { id: "paper_scanner", name: "Paper Scanner Pro", desc: "Uploaded a worksheet image to check answers", icon: "📸", color: "bg-indigo-100 text-indigo-700 border-indigo-300" }
];

export const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80", // colorful geometric
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80", // cute gaming cat
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80", // happy human face
  "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&q=80", // cute pixel style
];

export const DEFAULT_PROFILE: StudentProfile = {
  name: "Alex",
  grade: "6th Grade",
  avatarUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  points: 120,
  badges: ["ratio_ranger"],
  skills: INITIAL_TOPICS
};
