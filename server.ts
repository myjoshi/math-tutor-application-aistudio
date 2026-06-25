import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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
  ? "Since this is a mixed assessment, distribute the questions across all major 6th-grade CCSS standards: ratios and rates, the number system (decimals, fractions, division), equations and expressions, basic geometry, and statistics/plots." 
  : "Make sure to test actual core 6th-grade standards for this specific topic, such as ratios, fractions, volume, multi-digit decimal division, negative numbers, or simple equations depending on the topic."}

Include approximately 50% multiple-choice and 50% short-answer questions.
Conform strictly to the response schema. Keep mathematical notations simple and understandable. Each question id must be like q1, q2, ... q${numQuestions}.

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
