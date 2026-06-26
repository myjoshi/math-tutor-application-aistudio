import React, { useState } from "react";
import { AssessmentResult, Question } from "../types";
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, RotateCcw, Eye } from "lucide-react";

interface WorksheetHistoryProps {
  quizResults: AssessmentResult[];
  onReviewWorksheet: (result: AssessmentResult) => void;
}

export default function WorksheetHistory({ quizResults, onReviewWorksheet }: WorksheetHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (quizResults.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-slate-600 font-semibold mb-1">No worksheets yet</p>
        <p className="text-slate-400 text-sm">Generate a practice worksheet to see your history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Generated Worksheets History
      </h3>

      {quizResults.map((result) => {
        const isExpanded = expandedId === result.id;
        const scorePercent = result.score;
        const scoreColor = 
          scorePercent >= 80 ? "emerald" : 
          scorePercent >= 60 ? "amber" : 
          "rose";
        
        return (
          <div
            key={result.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
          >
            {/* Header - clickable to expand */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : result.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Score indicator */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 bg-${scoreColor}-500`}>
                  {scorePercent}%
                </div>

                {/* Title and metadata */}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 truncate text-sm">{result.assessmentTitle}</p>
                  <p className="text-xs text-slate-400">
                    {result.correctCount}/{result.totalQuestions} correct • {result.date}
                  </p>
                </div>
              </div>

              {/* Expand chevron */}
              <div className={`text-slate-400 transition ${isExpanded ? 'rotate-180' : ''}`}>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
                {/* Questions review */}
                {result.questions && result.questions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Questions Review</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.questions.map((q: Question, idx: number) => {
                        const userAnswer = result.userAnswers[q.id] || "";
                        const isCorrect = 
                          userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
                          (q.type === "short-answer" && parseFloat(userAnswer) === parseFloat(q.correctAnswer));
                        
                        return (
                          <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCorrect 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {idx + 1}
                              </span>
                              <p className="text-xs font-semibold text-slate-800 flex-1">{q.questionText}</p>
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                            </div>

                            {/* Answer comparison */}
                            <div className="bg-slate-100/50 rounded-lg p-2 text-xs space-y-1 ml-7">
                              {q.type === "multiple-choice" ? (
                                <>
                                  <p className={`font-mono ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    <span className="font-bold">Your answer:</span> {userAnswer || "(blank)"}
                                  </p>
                                  <p className="text-indigo-700 font-mono">
                                    <span className="font-bold">Correct answer:</span> {q.correctAnswer}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className={`font-mono ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    <span className="font-bold">You answered:</span> {userAnswer || "(blank)"}
                                  </p>
                                  <p className="text-indigo-700 font-mono">
                                    <span className="font-bold">Correct:</span> {q.correctAnswer}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Explanation */}
                            {!isCorrect && (
                              <div className="mt-2 ml-7 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                                <p className="font-semibold mb-1">💡 Solution:</p>
                                <p className="leading-relaxed">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {result.feedback && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <p className="text-xs font-bold text-indigo-900 mb-2">Tutor's Feedback:</p>
                    <p className="text-xs text-indigo-800 leading-relaxed">{result.feedback.generalRemark}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onReviewWorksheet(result)}
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Full Review
                  </button>
                  <button
                    className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retake Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
