import React from "react";
import { AssessmentResult } from "../types";
import { Clock, Printer } from "lucide-react";

interface WorksheetHistoryProps {
  quizResults: AssessmentResult[];
  onReviewWorksheet: (result: AssessmentResult) => void;
}

export default function WorksheetHistory({ quizResults, onReviewWorksheet }: WorksheetHistoryProps) {
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

      {quizResults.map((result) => (
        <div
          key={result.id}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
        >
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0">
                🖨️
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 truncate text-sm">{result.assessmentTitle}</p>
                <p className="text-xs text-slate-400">
                  {result.totalQuestions} questions • {result.date} • <span className="font-mono text-[10px]">{result.id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => onReviewWorksheet(result)}
              className="shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              View &amp; Print
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
