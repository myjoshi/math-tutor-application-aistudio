import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { validateAndCorrectQuestions } from "./src/utils/answerValidation";

// Load environment variables — .env.local takes priority over .env
dotenv.config({ path: ".env.local" });
dotenv.config();

// Ensure ESM-safe dirname
const __dirname = path.resolve();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Set high limits for handling base64 images from assessment scans
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Lazy initializer for Google GenAI client to prevent startup crash if API key is missing
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the system Secrets. Please add it via the Settings menu in AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Global error handler utility
const handleGlobalError = (error: any, res: express.Response) => {
  console.error("API Error occurred:", error);
  res.status(500).json({
    error: error.message || "An unexpected error occurred in the math tutor backend service.",
    details: error.stack || ""
  });
};

/* ==========================================================================
   API ENDPOINTS
   ========================================================================== */

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

// Grade-6 scope guardrails per topic, calibrated against K5 Learning's sixth-grade worksheet
// categories so the AI can't drift into 7th-grade+ content (algebraic equations, irrational
// numbers, statistics/box-plots, etc.) that K5's actual grade-6 curriculum never covers.
const TOPIC_SCOPE: Record<string, string> = {
  number_system: "Grade-6 number sense: adding/subtracting/multiplying/dividing fractions and mixed numbers (including dividing by a fraction), simplifying fractions, converting between fractions and decimals, all four operations with multi-digit decimals, place value and scientific notation of whole numbers, and operations with positive/negative integers (absolute value, ordering on a number line, and signed addition/subtraction/multiplication/division). Do NOT include algebraic variables, solving equations, square/cube roots of non-perfect squares, or any content beyond 6th-grade CCSS.",
  ratios: "Grade-6 ratio and proportion reasoning: writing and simplifying ratios, equivalent ratios, unit rates, solving proportions (including versions with one decimal place, e.g. 38/2 = 14/x, and versions with decimals throughout, e.g. 17.3/x = 11/15.7), and multi-step ratio/proportion word problems. Do NOT include percent calculations (that is a separate topic) or algebraic equation-solving beyond isolating one proportional unknown.",
  percents: "Grade-6 percent skills: converting between fractions, decimals and percents (including values over 100%, e.g. 154% = 1.54), finding a percent of a number (including percents over 100% and percents of decimal numbers, e.g. 60% of 9.59), finding what percent one number is of another, and solving for a missing base number given a percent (e.g. '70% of ___ = 56'). Keep values realistic for a 6th grader — no compound interest or multi-step percent-change chains.",
  exponents: "Grade-6 exponent skills: evaluating whole-number bases raised to small exponents, evaluating fraction/decimal bases raised to exponents (e.g. (0.2)^3), negative and zero exponents (e.g. 3^-1, (0.8)^-2), writing repeated multiplication using exponential notation, and evaluating numeric expressions that combine exponents with other operations (e.g. 2^4 - 3^3, 0.8^2 x 0.5^2). Do NOT include variables or algebraic exponent rules (e.g. x^2 * x^3) — keep every base and exponent purely numeric.",
  factoring: "Grade-6 factoring and number theory: prime factorization of numbers, finding the greatest common factor (GCF) of two or three numbers, and finding the least common multiple (LCM) of two or three numbers. Numbers can run into the hundreds for an extra challenge, but keep everything grounded in whole-number factoring — no algebraic factoring of expressions.",
  geometry: "Grade-6 geometry and measurement: classifying and measuring angles, classifying triangles (equilateral/isosceles/scalene) and quadrilaterals, area and perimeter of irregular rectangular shapes/right triangles/other polygons, circumference and area of circles, volume and surface area of rectangular prisms (including with fractional or decimal side lengths), and converting between units of length/weight/capacity in both customary (inches/feet/yards, ounces/pounds/tons, cups/pints/quarts/gallons) and metric (mm/cm/m/km, ml/l, g/kg) systems, including decimal conversions."
};

const DIFFICULTY_ESCALATION = `Calibrate baseline difficulty against the "harder" variant of each skill on standard printable 6th-grade worksheets (e.g. decimal-based proportions rather than whole-number ones, negative-exponent problems rather than only positive whole-number bases, multi-step area/volume problems with fractional dimensions, 3-number GCF/LCM rather than 2-number), then push about 10-15% further in challenge than that — one extra step, larger or more irregular numbers, or an added real-world twist — while staying strictly inside 6th-grade CCSS scope. Never introduce content that would first appear in a 7th-grade or higher curriculum: no linear equations with variables, no irrational numbers, no algebraic expression simplification, no statistics topics like mean/median/box-plots/histograms.`;

// 2. Generate custom 6th grade math assessment
app.post("/api/generate-test", async (req, res) => {
  try {
    const { topicId, topicName, numQuestions: requestedNumQuestions, masteryLevel, seed } = req.body;
    if (!topicId || !topicName) {
      return res.status(400).json({ error: "Missing required parameters: topicId and topicName are required." });
    }

    // Default to 10 questions, clamp between 10 and 20
    let numQuestions = requestedNumQuestions ? parseInt(requestedNumQuestions, 10) : 10;
    if (isNaN(numQuestions) || numQuestions < 10) numQuestions = 10;
    if (numQuestions > 20) numQuestions = 20;

    const ai = getGeminiClient();

    const quizSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Descriptive title of the assessment (e.g. 'Ratios and Rates Challenge')" },
        topicName: { type: Type.STRING, description: "Human-readable topic name" },
        skillsTested: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of key skills tested in this quiz"
        },
        questions: {
          type: Type.ARRAY,
          description: `List of exactly ${numQuestions} unique 6th-grade math assessment questions`,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique question ID like q1, q2, q3 etc" },
              questionText: { type: Type.STRING, description: "The math question statement, clear, detailed, age-appropriate & with real-world context if possible" },
              type: { type: Type.STRING, description: "Must be 'multiple-choice' or 'short-answer'" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Must provide exactly 4 distinct options if type is 'multiple-choice'. Leave empty for 'short-answer'."
              },
              correctAnswer: { type: Type.STRING, description: "For multiple-choice, this must be the exact text of the correct option match. For short-answer, this must be a clean numeric value or brief phrase (e.g. '12' or '2.5')." },
              explanation: { type: Type.STRING, description: "Detailed, super friendly, and encouraging step-by-step mathematical explanation suitable for a 6th grader explaining how to solve this." },
              hint: { type: Type.STRING, description: "Gentle tutoring hint to guide the child without giving away the direct answer." }
            },
            required: ["id", "questionText", "type", "correctAnswer", "explanation", "hint"]
          }
        }
      },
      required: ["title", "topicName", "skillsTested", "questions"]
    };

    let masteryInfo = "";
    if (masteryLevel !== undefined) {
      const level = parseInt(masteryLevel, 10) || 0;
      if (level < 30) {
        masteryInfo = "The student's current proficiency is low (Beginner). Generate foundational, clear, encouraging, and confidence-building problems. Keep math expressions simple, mostly single-step, with friendly visual/contextual cues.";
      } else if (level < 70) {
        masteryInfo = "The student's current proficiency is moderate (Intermediate). Generate standard 6th-grade math problems, including standard multi-step calculations, standard word problems, and real-world scenarios requiring formulas.";
      } else {
        masteryInfo = "The student's current proficiency is high (Advanced). Generate challenging, deep, multi-step, and high Depth-of-Knowledge (DOK) problems. These should include complex real-world word problems, decimals/fraction values, multi-layered calculations, or abstract reasoning to push their limits.";
      }
    } else {
      masteryInfo = "The student's proficiency is moderate. Provide balanced standard 6th-grade questions.";
    }

    const rotationInstructions = `To ensure questions are completely dynamic and NEVER repeated or recycled from previous calls, use this unique random seed token to vary all numerical values, names of characters, real-world scenario themes, and math contexts: '${seed || Math.random()}'. Create a completely fresh set of word problems.`;

    const complexityIncreaseInstructions = `Within the assessment itself, the questions MUST gradually increase in complexity. Arrange the questions so that the first few (Q1 to Q3) are accessible warm-up problems, the middle questions are standard proficiency challenges, and the final questions (from Q7 onwards) are advanced/stretch multi-step problems requiring deep critical thinking.`;

    const promptText = `Generate a standard 6th-grade math assessment with exactly ${numQuestions} unique, clear questions testing the topic: '${topicName}' (Topic ID: ${topicId}).
${topicId === "mixed"
  ? `Since this is a mixed assessment, distribute the questions across all six main 6th-grade topic areas, respecting each one's scope below:\n${Object.entries(TOPIC_SCOPE).map(([id, scope]) => `- ${id}: ${scope}`).join("\n")}`
  : `TOPIC SCOPE (strictly stay within this — it defines exactly what belongs in 6th-grade "${topicName}" and what does not):\n${TOPIC_SCOPE[topicId] || "Test only core 6th-grade CCSS standards appropriate to this specific topic name."}`}

DIFFICULTY CALIBRATION:
${DIFFICULTY_ESCALATION}

Include approximately 50% multiple-choice and 50% short-answer questions.
Conform strictly to the response schema. Keep mathematical notations simple and understandable. Each question id must be like q1, q2, ... q${numQuestions}.

CRITICAL REQUIREMENT - ANSWER ACCURACY:
Before generating the correctAnswer field for each question, you MUST:
1. Completely solve the problem yourself
2. Verify that your correctAnswer actually solves or satisfies the question
3. Make sure your explanation steps lead to the same correctAnswer
4. If you find a discrepancy between your solution and the correctAnswer field, fix it so they match

PROFICIENCY LEVEL GUIDELINE:
${masteryInfo}

QUESTION ROTATION GUIDELINE:
${rotationInstructions}

QUESTION SEQUENCE COMPLEXITY GUIDELINE:
${complexityIncreaseInstructions}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        systemInstruction: "You are an expert 6th-grade math specialist, teacher and curriculum developer. Create engaging, accurate and highly friendly assessments."
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from the Gemini model.");
    }

    const testObject = JSON.parse(text.trim());

    // Validate and auto-correct any questions with incorrect answers
    const { correctedQuestions, report } = validateAndCorrectQuestions(testObject.questions);
    testObject.questions = correctedQuestions;
    testObject.validationReport = report;

    // Log validation issues for monitoring
    if (report.correctedQuestions > 0) {
      console.warn(`[VALIDATION] Test: Corrected ${report.correctedQuestions}/${report.totalQuestions} questions`);
      report.issues.forEach(issue => {
        console.warn(`  - Q${issue.questionId}: ${issue.issue}`);
        if (issue.correctedFrom && issue.correctedTo) {
          console.warn(`    Changed answer from "${issue.correctedFrom}" to "${issue.correctedTo}"`);
        }
      });
    }

    // Attach an ID for frontend convenience
    testObject.id = `test_${Date.now()}`;
    testObject.topicId = topicId;

    res.json(testObject);
  } catch (error) {
    handleGlobalError(error, res);
  }
});

// 3. Scan & grade physical paper math assessment via base64 image
app.post("/api/check-paper", async (req, res) => {
  try {
    const { image, mimeType, customLabel } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image payload. Please capture or upload a math assessment picture." });
    }

    const ai = getGeminiClient();

    // Standard schema for paper analysis output
    const scanSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Friendly title for the scanned sheet (e.g., '6th Grade Rates Homework')" },
        totalProblems: { type: Type.INTEGER, description: "Total number of readable math problems identified on the page" },
        correctCount: { type: Type.INTEGER, description: "Count of problems the student answered correctly" },
        generalFeedback: { type: Type.STRING, description: "Comprehensive, warm, and highly encouraging summary remarks tailored for a 6th grader and their parent. Celebrate strengths and frame errors as wonderful learning milestones." },
        keyConceptToImprove: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of 1 to 3 core concepts the child struggles with or needs to work on based on their answers (e.g., 'Dividing decimal fractions', 'Finding the reciprocal')"
        },
        suggestedAction: { type: Type.STRING, description: "A friendly recommended tutoring activity or study advice for the student" },
        problems: {
          type: Type.ARRAY,
          description: "The list of identified problems, what the student wrote, and a constructive evaluation of their work",
          items: {
            type: Type.OBJECT,
            properties: {
              problemNumber: { type: Type.STRING, description: "The problem label found (e.g. '1', '2a', '3')" },
              questionText: { type: Type.STRING, description: "The math problem statement identified on the paper" },
              studentAnswer: { type: Type.STRING, description: "The student's handwritten answer or key solution steps, transcribed as closely as possible" },
              correctAnswer: { type: Type.STRING, description: "The correct final mathematical answer" },
              isCorrect: { type: Type.BOOLEAN, description: "True if the student's final answer is correct, False otherwise" },
              tutorEvaluation: { type: Type.STRING, description: "A gentle, age-appropriate review of their calculation or steps. Point out exactly where an arithmetic slip occurred or how they can improve their strategy. For correct answers, praise their methodology." },
              correctSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Simple step-by-step breakdown of how to solve this exact problem, written clearly for a 6th grader to follow."
              },
              recommendedSkill: { type: Type.STRING, description: "Identified math concept focus (e.g. 'Multiplying Fractions', 'Evaluating Exponents')" }
            },
            required: ["problemNumber", "questionText", "studentAnswer", "correctAnswer", "isCorrect", "tutorEvaluation", "correctSteps", "recommendedSkill"]
          }
        }
      },
      required: ["title", "totalProblems", "correctCount", "generalFeedback", "keyConceptToImprove", "suggestedAction", "problems"]
    };

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: image
      }
    };

    const textPart = {
      text: `You are Tutor Mathy, a highly patient, encouraging, and experienced 6th-grade math teacher.
Analyze this submitted image of a 6th-grade student's math assessment, homework page, or handwritten work page.
Please identify all problems on the page. For each problem:
1. Detect and transcribe the written math question.
2. Transcribe exactly what the student wrote as their final answer or calculation steps.
3. Check and grade the answers.
4. Give a positive, detailed tutor assessment of their work. If there is a calculation mistake, explain where they went off-track (e.g. 'multiplied instead of adding', 'forgot to drop the decimal point down') and show how to fix it gently.
5. List the correct steps clearly.
Store and return all evaluations in the requested JSON structure. Custom user label/desc for reference: "${customLabel || "Uploaded Paper Analysis"}"`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [imagePart, textPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: scanSchema,
        systemInstruction: "You are Tutor Mathy, an elite, loving 6th-grade math tutor. Your goal is to transcribe, check, and solve homework paper worksheets. You write with supportive warmth and step-by-step pediatric clarity."
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No feedback or data returned during image grading analysis.");
    }

    const payload = JSON.parse(text.trim());
    res.json(payload);
  } catch (error) {
    handleGlobalError(error, res);
  }
});

/* ==========================================================================
   DEVELOPMENT & PRODUCTION MIDDLEWARES
   ========================================================================== */

async function initServerAndMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    // Vite dev server integration
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware integrated.");
  } else {
    // Serve production static build assets
    const distPath = path.join(path.resolve(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server paths set up.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MATH TUTOR SERVER] Active and listening exclusively on http://0.0.0.0:${PORT}`);
  });
}

initServerAndMiddleware().catch((err) => {
  console.error("Failed to start the Express math tutoring server:", err);
});
