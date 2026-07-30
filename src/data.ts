import { StudentProfile } from "./types";

export const INITIAL_TOPICS = {
  ratios: {
    topicId: "ratios",
    name: "Ratios & Proportions",
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
  factoring: {
    topicId: "factoring",
    name: "Factors & Multiples",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  },
  geometry: {
    topicId: "geometry",
    name: "Geometry & Measurement",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  },
  exponents: {
    topicId: "exponents",
    name: "Exponents & Powers",
    scoreCount: 0,
    averageScore: 0,
    masteryLevel: 0,
    lastTested: null,
    strengths: [],
    weaknesses: []
  },
  percents: {
    topicId: "percents",
    name: "Percents",
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
    topicName: "Ratios & Proportions",
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
  { id: "first_steps",       name: "First Steps",      desc: "Completed your very first practice quiz",           icon: "🌟", unlockHint: "Complete any quiz",             bg: "bg-yellow-50",   border: "border-yellow-300",  shadow: "shadow-yellow-100"  },
  { id: "ratio_ranger",      name: "Ratio Ranger",     desc: "Completed a Ratios & Proportions worksheet",        icon: "⚡", unlockHint: "Complete a Ratios quiz",        bg: "bg-orange-50",   border: "border-orange-300",  shadow: "shadow-orange-100"  },
  { id: "fraction_fanatic",  name: "Fraction Fanatic", desc: "Scored 100% on The Number System",                 icon: "🍰", unlockHint: "Score 100% on Number System",   bg: "bg-blue-50",     border: "border-blue-300",    shadow: "shadow-blue-100"    },
  { id: "equation_explorer", name: "Factor Finder",    desc: "Completed a Factors & Multiples worksheet",         icon: "🧩", unlockHint: "Complete a Factoring quiz",     bg: "bg-emerald-50",  border: "border-emerald-300", shadow: "shadow-emerald-100" },
  { id: "geometry_giant",    name: "Geometry Giant",   desc: "Mastered shapes, space & measurement with Tutor Mathy", icon: "📐", unlockHint: "Complete a Geometry quiz",  bg: "bg-purple-50",   border: "border-purple-300",  shadow: "shadow-purple-100"  },
  { id: "data_detective",    name: "Power Player",     desc: "Completed an Exponents & Powers worksheet",         icon: "🔋", unlockHint: "Complete an Exponents quiz",    bg: "bg-rose-50",     border: "border-rose-300",    shadow: "shadow-rose-100"    },
  { id: "perfect_score",     name: "Perfect Score!",   desc: "Achieved 100% accuracy on a quiz",                 icon: "💯", unlockHint: "Score 100% on any quiz",        bg: "bg-amber-50",    border: "border-amber-300",   shadow: "shadow-amber-100"   },
  { id: "honor_roll",        name: "Honor Roll",       desc: "Scored 80% or higher on a quiz",                   icon: "🏅", unlockHint: "Score 80%+ on any quiz",        bg: "bg-lime-50",     border: "border-lime-300",    shadow: "shadow-lime-100"    },
  { id: "paper_scanner",     name: "Scanner Pro",      desc: "Uploaded your first homework scan photo",           icon: "📸", unlockHint: "Upload a homework photo",       bg: "bg-indigo-50",   border: "border-indigo-300",  shadow: "shadow-indigo-100"  },
  { id: "scan_hero",         name: "Scan Hero",        desc: "Submitted 3 homework scans for grading",           icon: "🦸", unlockHint: "Upload 3 homework scans",       bg: "bg-cyan-50",     border: "border-cyan-300",    shadow: "shadow-cyan-100"    },
  { id: "worksheet_master",  name: "Sheet Master",     desc: "Generated 3 or more practice worksheets",          icon: "✏️", unlockHint: "Generate 3 worksheets",         bg: "bg-teal-50",     border: "border-teal-300",    shadow: "shadow-teal-100"    },
  { id: "math_champ",        name: "Math Champion",    desc: "Practiced worksheets in all main topic areas",      icon: "🏆", unlockHint: "Practice all 6 math topics",    bg: "bg-yellow-50",   border: "border-yellow-400",  shadow: "shadow-yellow-200"  },
];

export const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80", // colorful geometric
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80", // cute gaming cat
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80", // happy human face
  "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&q=80", // cute pixel style
];

export const DEFAULT_PROFILE: StudentProfile = {
  name: "Nitya",
  grade: "6th Grade",
  avatarUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80",
  points: 120,
  badges: ["ratio_ranger"],
  skills: INITIAL_TOPICS
};
