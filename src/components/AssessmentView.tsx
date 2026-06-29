import React, { useState } from "react";
import { StudentProfile, Assessment, AssessmentResult, Question } from "../types";
import WorksheetHistory from "./WorksheetHistory";
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  Printer,
  FileText,
  ChevronRight,
  HelpCircle,
  GraduationCap
} from "lucide-react";

interface AssessmentViewProps {
  profile: StudentProfile;
  activeQuizIndex: number;
  setActiveQuizIndex: (idx: number) => void;
  userQuizAnswers: { [qId: string]: string };
  quizSubmitted: boolean;
  isGeneratingTest: boolean;
  quizGenError: string | null;
  currentQuiz: Assessment | null;
  setCurrentQuiz: (quiz: Assessment | null) => void;
  quizScoreCard: AssessmentResult | null;
  setQuizScoreCard: (card: AssessmentResult | null) => void;
  selectedQuizTopic: string;
  setSelectedQuizTopic: (topicId: string) => void;
  quizResults: AssessmentResult[];
  startTopicQuiz: (topicId: string, topicName: string, numQuestions?: number) => Promise<void>;
  selectQuizOption: (qId: string, option: string) => void;
  setShortAnswer: (qId: string, answer: string) => void;
  submitQuiz: () => void;
  setQuizSubmitted: (submitted: boolean) => void;
}

export default function AssessmentView({
  profile,
  activeQuizIndex,
  setActiveQuizIndex,
  userQuizAnswers,
  quizSubmitted,
  isGeneratingTest,
  quizGenError,
  currentQuiz,
  setCurrentQuiz,
  quizScoreCard,
  setQuizScoreCard,
  selectedQuizTopic,
  setSelectedQuizTopic,
  quizResults,
  startTopicQuiz,
  selectQuizOption,
  setShortAnswer,
  submitQuiz,
  setQuizSubmitted
}: AssessmentViewProps) {
  
  // Local states for configuring worksheet options
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [deliveryMode] = useState<"print">("print");
  const [showAnswerKeyInPrint, setShowAnswerKeyInPrint] = useState<boolean>(true);
  const [viewingWorksheet, setViewingWorksheet] = useState<AssessmentResult | null>(null);

  // Topics list including standard curriculum + mixed topics
  const standardTopics = Object.values(profile.skills);
  const topicsList = [
    ...standardTopics,
    {
      topicId: "mixed",
      name: "Mixed Topics (Comprehensive 6th-Grade)",
      scoreCount: 0,
      averageScore: 0,
      masteryLevel: 75,
      lastTested: null,
      strengths: [],
      weaknesses: []
    }
  ];

  const activeTopicObj = topicsList.find(t => t.topicId === selectedQuizTopic) || topicsList[0];

  const handleGenerate = () => {
    const matchedName = selectedQuizTopic === "mixed" 
      ? "Comprehensive 6th-Grade" 
      : activeTopicObj.name;
    startTopicQuiz(selectedQuizTopic, matchedName, numQuestions);
  };

  // FULL WORKSHEET REVIEW VIEW (printable)
  if (viewingWorksheet) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 bg-slate-50 flex flex-col gap-5 pb-24 lg:pb-6">
        {/* Back button and print - hidden during print */}
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => setViewingWorksheet(null)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
          >
            ← Back to Worksheets
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Worksheet
          </button>
        </div>

        {/* Printable Worksheet */}
        <div className="max-w-3xl mx-auto w-full bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm print:shadow-none print:border-none print:rounded-none">
          {/* Worksheet Header */}
          <div className="border-b border-slate-200 pb-4 mb-6 print:border-black">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900">{viewingWorksheet.assessmentTitle}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Worksheet ID: <span className="font-mono font-bold">{viewingWorksheet.id}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Generated: <span className="font-semibold">{viewingWorksheet.date}</span>
                </p>
              </div>
              <div className="text-right">
                {viewingWorksheet.score === -1 ? (
                  <>
                    <div className="text-xl font-black text-slate-500">🖨️</div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      Printed • {viewingWorksheet.totalQuestions} questions
                    </p>
                  </>
                ) : (
                  <>
                    <div className={`text-2xl font-black ${
                      viewingWorksheet.score >= 80 ? 'text-emerald-600' : 
                      viewingWorksheet.score >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {viewingWorksheet.score}%
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {viewingWorksheet.correctCount}/{viewingWorksheet.totalQuestions} correct
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Questions */}
          {viewingWorksheet.questions && viewingWorksheet.questions.length > 0 ? (
            <div className="space-y-5">
              {viewingWorksheet.questions.map((q: Question, idx: number) => {
                const userAnswer = viewingWorksheet.userAnswers[q.id] || "";
                const isCorrect = 
                  userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                  (q.type === "short-answer" && parseFloat(userAnswer) === parseFloat(q.correctAnswer));

                return (
                  <div key={q.id} className={`p-4 rounded-xl border ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800 mb-2">{q.questionText}</p>

                        {/* Options for multiple choice */}
                        {q.type === "multiple-choice" && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                            {q.options.map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isUserPick = userAnswer.trim().toLowerCase() === opt.trim().toLowerCase();
                              const isCorrectOpt = q.correctAnswer.trim().toLowerCase() === opt.trim().toLowerCase();
                              return (
                                <div key={optIdx} className={`px-3 py-1.5 rounded-lg text-xs border ${
                                  isCorrectOpt ? 'bg-emerald-100 border-emerald-300 font-bold text-emerald-800' :
                                  isUserPick && !isCorrect ? 'bg-rose-100 border-rose-300 text-rose-800 line-through' :
                                  'bg-slate-50 border-slate-200 text-slate-600'
                                }`}>
                                  <span className="font-bold mr-1">{letter}.</span> {opt}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Answer summary */}
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className={`px-2 py-1 rounded font-mono ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            Your answer: {userAnswer || "(blank)"}
                          </span>
                          {!isCorrect && (
                            <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 font-mono">
                              Correct: {q.correctAnswer}
                            </span>
                          )}
                        </div>

                        {/* Explanation for wrong answers */}
                        {!isCorrect && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                            <p className="font-bold mb-1">💡 Explanation:</p>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400">
              <p className="text-sm font-semibold">Question details not available for this worksheet.</p>
              <p className="text-xs mt-1">Only worksheets generated after the history feature was enabled will have full question data.</p>
            </div>
          )}

          {/* Answer Key Summary (bottom) */}
          {viewingWorksheet.questions && viewingWorksheet.questions.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">📋 Answer Key</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {viewingWorksheet.questions.map((q: Question, idx: number) => (
                  <div key={q.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <span className="font-bold text-slate-500">Q{idx + 1}:</span>
                    <span className="font-mono text-indigo-700 font-bold truncate">{q.correctAnswer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tutor Feedback */}
          {viewingWorksheet.feedback && (
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-xs font-bold text-indigo-900 mb-2">🎓 Tutor's Feedback</p>
              <p className="text-xs text-indigo-800 leading-relaxed italic">"{viewingWorksheet.feedback.generalRemark}"</p>
              {viewingWorksheet.feedback.strengths.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-bold text-indigo-700 uppercase">Strengths:</p>
                  <p className="text-xs text-indigo-700">{viewingWorksheet.feedback.strengths.join(", ")}</p>
                </div>
              )}
              {viewingWorksheet.feedback.improvements.length > 0 && (
                <div className="mt-1">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">Areas to Improve:</p>
                  <p className="text-xs text-amber-700">{viewingWorksheet.feedback.improvements.join(", ")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 bg-slate-50 flex flex-col gap-5 pb-24 lg:pb-6">
      
      {/* Title block - Hidden when printing */}
      <div className="shrink-0 no-print">
        <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-md">
          Curriculum Exercises
        </span>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1.5">
          Adaptive Assessment Center
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Configure custom diagnostics or generate physical, high-fidelity printable worksheets with professional parent keys.
        </p>
      </div>

      {/* QUIZ CONFIGURATION SCREEN */}
      {!currentQuiz && !isGeneratingTest && !quizScoreCard && (
        <div className="flex-1 max-w-2xl mx-auto w-full border border-slate-200 bg-white rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-6 no-print">
          
          {/* Error banner */}
          {quizGenError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>{quizGenError}</span>
            </div>
          )}
          {/* Select topic */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <span className="text-indigo-600">🎯</span>
              1. Select Mathematical Focus Area
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {topicsList.map((topic) => {
                const isSelected = selectedQuizTopic === topic.topicId;
                const isMixed = topic.topicId === "mixed";
                return (
                  <div
                    key={topic.topicId}
                    onClick={() => setSelectedQuizTopic(topic.topicId)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between duration-100 ${
                      isSelected
                        ? "bg-indigo-50/50 border-indigo-400 text-indigo-950 font-bold shadow-xs"
                        : "bg-slate-50/40 border-slate-200/80 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{isMixed ? "⭐" : "📖"}</span>
                      <div className="text-left">
                        <h4 className="text-xs font-bold leading-tight">{topic.name}</h4>
                        <p className="text-[9px] text-slate-400 leading-none mt-1 font-medium">
                          {isMixed ? "Mixed Core Topics" : "Standard 6th Grade"}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Select length */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <span className="text-indigo-600">📊</span>
              2. Choose Worksheet Size
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[10, 15, 20].map((num) => {
                const isSelected = numQuestions === num;
                return (
                  <button
                    key={num}
                    onClick={() => setNumQuestions(num)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    {num} Questions
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-100/80 text-center active:scale-98 transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Generate Printable Worksheet</span>
          </button>
        </div>
      )}

      {/* WORKSHEET HISTORY SECTION */}
      {!currentQuiz && !isGeneratingTest && !quizScoreCard && quizResults.length > 0 && (
        <div className="max-w-4xl mx-auto w-full no-print">
          <WorksheetHistory 
            quizResults={quizResults}
            onReviewWorksheet={(result) => {
              setViewingWorksheet(result);
            }}
          />
        </div>
      )}

      {/* VIRTUAL QUIZ WRITER (LOADING STATE) */}
      {isGeneratingTest && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-3xl max-w-xl mx-auto w-full min-h-[300px] no-print">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4"></div>
          <h4 className="text-sm font-bold text-slate-800">Tutor Mathy is writing a custom quiz...</h4>
          <p className="text-slate-400 text-[10px] mt-1 max-w-xs font-medium">
            Formulating {numQuestions} adaptive problems, visual keys, explanations, and coaching reminders for {selectedQuizTopic === "mixed" ? "mixed curriculum skills" : activeTopicObj.name}...
          </p>
        </div>
      )}

      {/* DELIVERY MODE A REMOVED */}

      {/* DELIVERY MODE B: PRINTABLE PDF WORKSHEET VIEW */}
      {currentQuiz && deliveryMode === "print" && !isGeneratingTest && (
        <div className="flex-1 flex flex-col gap-5">
          
          {/* Floating control bar - ALWAYS hidden on actual printer printout */}
          <div className="no-print bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 border border-slate-800 shadow-xl max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
                🖨️
              </div>
              <div>
                <h4 className="text-xs font-bold">Printable Worksheet Canvas</h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {currentQuiz.questions.length} questions on {selectedQuizTopic === "mixed" ? "mixed core topics" : activeTopicObj.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* Toggle answer key switch */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={showAnswerKeyInPrint}
                  onChange={(e) => setShowAnswerKeyInPrint(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-800"
                />
                <span>Include Solution Key (at back)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Worksheet</span>
                </button>

                <button
                  onClick={() => setCurrentQuiz(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Exit Preview
                </button>
              </div>
            </div>
          </div>

          {/* Interactive virtual paper page */}
          <div id="worksheet-print-area" className="bg-white border border-slate-200 rounded-2xl max-w-3xl mx-auto w-full p-4 md:p-6 shadow-sm text-slate-900 font-serif relative overflow-visible">
            
            {/* School Title Header bar */}
            <div className="text-center pb-6 border-b-2 border-slate-900">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-950 font-sans">
                Mathematics Assessment Center Worksheet
              </h2>
              <div className="flex justify-center items-center gap-4 mt-2 text-xs font-sans text-slate-500 font-bold uppercase tracking-wider">
                <span>Topic: {currentQuiz.topicName}</span>
                <span>•</span>
                <span>Worksheet ID: {currentQuiz.id}</span>
              </div>
            </div>

            {/* Student metadata fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 font-sans text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 uppercase shrink-0">Student Name:</span>
                <div className="flex-1 border-b border-dashed border-slate-400 h-5"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 uppercase shrink-0">Date:</span>
                <div className="flex-1 border-b border-dashed border-slate-400 h-5"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 uppercase shrink-0">Score:</span>
                <span className="font-black text-slate-500 ml-1">__________ / {currentQuiz.questions.length}</span>
              </div>
            </div>

            {/* Instruction block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans text-[11px] leading-relaxed text-slate-600 mb-4">
              <p className="font-bold text-slate-800">General Directions for Student:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Read each question carefully before attempting to solve.</li>
                <li>For Multiple Choice exercises, bubble/check the box corresponding to the correct letter option.</li>
                <li>For Numerical Write-in exercises, write your final exact calculation inside the designated answer box.</li>
                <li>Use the scratchpad boxes provided to write down step-by-step arithmetic steps or sketch models.</li>
              </ul>
            </div>

            {/* Questions block */}
            <div className="space-y-2 @media-print:space-y-1">
              {currentQuiz.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2 pb-4 border-b border-slate-100 last:border-0 last:pb-0 break-inside-avoid">
                  
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-sans font-black text-slate-900 text-sm bg-slate-100 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-bold text-slate-950 leading-relaxed font-sans">
                        {q.questionText}
                      </p>
                    </div>
                  </div>

                  {/* Rendering answer slots based on type */}
                  {q.type === "multiple-choice" && q.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans pl-10 pt-1">
                      {q.options.map((opt, optId) => (
                        <div key={optId} className="flex items-center gap-3 text-xs text-slate-800">
                          <div className="w-5 h-5 rounded border border-slate-400 flex items-center justify-center font-bold text-[9.5px] text-slate-400 select-none shrink-0">
                            [  ]
                          </div>
                          <span className="font-bold text-slate-600">{String.fromCharCode(65 + optId)}.</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="font-sans pl-10 pt-1 space-y-4">
                      {/* Blank input slot */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-700 uppercase">Write Your Final Answer Here:</span>
                        <div className="w-48 border border-slate-300 rounded-lg p-2.5 h-9 bg-slate-50/30"></div>
                      </div>
                    </div>
                  )}

                  {/* Calculation scratchpad space */}
                  <div className="pl-10 pt-2 font-sans">
                    <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/20 text-[9px] text-slate-400 tracking-wider uppercase font-black">
                      <span>✂️ scratchpad area (show calculation work)</span>
                      <div className="h-10"></div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* BACK-PAGE TEACHER ANSWER KEY PAGE (Printed on a separate sheet) */}
            {showAnswerKeyInPrint && (
              <div className="mt-16 pt-12 border-t-4 border-double border-slate-900 font-sans" style={{ pageBreakBefore: "always" }}>
                
                <div className="text-center pb-6 mb-8 border-b-2 border-slate-900">
                  <h3 className="text-lg md:text-xl font-black uppercase text-indigo-950">
                    OFFICIAL ASSESSMENT ANSWER KEY
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    FOR TEACHER / PARENT REFERENCE ONLY • SOLUTIONS & BREAKDOWNS
                  </p>
                </div>

                <div className="space-y-6">
                  {currentQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 break-inside-avoid text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 mb-2">
                        <span className="font-black text-slate-800 uppercase text-[10px]">
                          Exercise {idx + 1} Answer Key
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-[9px] text-slate-500 uppercase">
                          {q.type === "multiple-choice" ? "Multiple Choice" : "Numerical Input"}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 mb-2 leading-relaxed">
                        Q: {q.questionText}
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10.5px] font-black text-emerald-800 uppercase bg-emerald-100 p-1 px-2.5 rounded">
                          CORRECT ANSWER: {q.correctAnswer}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-100">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                          Step-by-Step Mathematical Explanation:
                        </span>
                        <p className="text-slate-600 leading-relaxed text-[11px] font-medium">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* QUIZ SCORE CARD REPORT DETAILS */}
      {quizScoreCard && (
        <div className="max-w-xl bg-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-xl mx-auto w-full text-center space-y-4 no-print">
          <span className="text-[10px] font-bold tracking-widest bg-emerald-500/25 text-emerald-300 p-1 px-3.5 rounded-lg border border-emerald-400/20 inline-block uppercase col-span-2">
            QUIZ REPORT CARD
          </span>
          <h3 className="text-md sm:text-lg font-bold text-slate-100 font-sans">Congratulations on Completing your Test!</h3>

          <div className="flex justify-center items-center gap-8 py-4 bg-white/5 border border-white/10 rounded-2xl max-w-sm mx-auto my-6">
            <div>
              <span className="text-3xl font-black text-emerald-400 block leading-tight">{quizScoreCard.score}%</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                Accuracy score
              </p>
            </div>
            <div className="border-l border-white/10 h-8"></div>
            <div>
              <span className="text-3xl font-black text-indigo-300 block leading-tight">
                {quizScoreCard.correctCount}/{quizScoreCard.totalQuestions}
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                Correct answers
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic max-w-sm mx-auto leading-relaxed">
            " {quizScoreCard.feedback.generalRemark} "
          </p>

          <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2.5 justify-center font-sans">
            <button
              onClick={() => {
                setQuizScoreCard(null);
                setCurrentQuiz(null);
                setQuizSubmitted(false);
              }}
              className="px-4.5 py-2.5 bg-white text-slate-905 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-900 shadow-md transition duration-150 active:scale-95 cursor-pointer"
            >
              Back to Assessment Center
            </button>
            <button
              onClick={() => {
                setQuizScoreCard(null);
                const matchedTopicName = selectedQuizTopic === "mixed" 
                  ? "Comprehensive 6th-Grade" 
                  : activeTopicObj.name;
                startTopicQuiz(selectedQuizTopic, matchedTopicName, numQuestions);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold active:scale-95 duration-150 cursor-pointer"
            >
              Practice Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
