import React from "react";
import { StudentProfile, ScannedPaperResult, AssessmentResult } from "../types";
import { ArrowRight, BookOpen, Camera, CheckCircle, Clock, Sparkles, TrendingUp } from "lucide-react";

interface DashboardViewProps {
  profile: StudentProfile;
  scans: ScannedPaperResult[];
  quizResults: AssessmentResult[];
  setActiveTab: (tab: "dashboard" | "scanner" | "quiz" | "profile") => void;
  setSelectedQuizTopic: (topicId: string) => void;
  overallAccuracy: number;
}

export default function DashboardView({
  profile,
  scans,
  quizResults,
  setActiveTab,
  setSelectedQuizTopic,
  overallAccuracy
}: DashboardViewProps) {
  
  // Total questions count
  const totalAttempted = quizResults.reduce((acc, q) => acc + q.totalQuestions, 0) + 
    scans.reduce((acc, s) => acc + s.totalProblems, 0);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 bg-slate-50 flex flex-col gap-6 pb-24 lg:pb-6">
      
      {/* Dynamic Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-md flex flex-col justify-between min-h-[180px]">
        <div className="relative z-10 max-w-[540px]">
          <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9.5px] font-black uppercase rounded-md tracking-wider border border-indigo-400/10 inline-block">
            6th-Grade AI Companion App
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-3">
            Welcome back, {profile.name}! 👋
          </h2>
          <p className="text-slate-300 text-xs leading-relaxed mt-2.5">
            Take a snap of any handwriting math assignments or tests. Tutor Mathy checks the equations, grades the worksheets and targets improvement topics instantly!
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 mt-5 relative z-10">
          <button
            onClick={() => setActiveTab("scanner")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95 duration-100 cursor-pointer"
          >
            <span>Scan Worksheet</span>
            <Camera className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setActiveTab("quiz")}
            className="px-4 py-2 bg-white text-indigo-950 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 duration-100 cursor-pointer shadow-sm"
          >
            <span>Worksheets Generator</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-950" />
          </button>
        </div>

        {/* Math visual watermark */}
        <div className="absolute right-6 bottom-4 text-white/5 font-mono text-[90px] md:text-[140px] select-none pointer-events-none font-bold leading-none">
          ∑+y%
        </div>
      </div>

      {/* Mini Performance Cards for Mobile */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Logged</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalAttempted}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Math exercises checked</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Stars Count</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">⭐️ {profile.points}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Progress points</p>
        </div>
      </div>

      {/* Adaptive Learning suggestion blocks (3 Column Bento Box) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Recommended Lesson Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="p-1 px-2 bg-amber-50 text-amber-700 text-[9px] font-bold uppercase rounded border border-amber-100">
              Personalized Plan
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-3.5 leading-tight">Recommended Practice</h3>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Let's build confidence in core ratios, rates, and unit proportionals:
            </p>
            <div className="mt-3.5 flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                📝
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-700 leading-tight truncate">Ratios & Unit Rates Basics</h4>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5 font-medium">CCSS.Math.6.RP.A</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedQuizTopic("ratios");
              setActiveTab("quiz");
            }}
            className="mt-5 w-full py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-100 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition duration-150 text-center active:scale-95 cursor-pointer"
          >
            Generate Practice Sheet
          </button>
        </div>

        {/* Snapshot scanner summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="p-1 px-2 bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase rounded border border-indigo-100">
              Worksheet Scanner
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-3.5 leading-tight">Assessed Assignments</h3>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Review and read graded evaluations on paper uploads and handwritten math files:
            </p>
            
            {scans.length > 0 ? (
              <div className="mt-4 py-4 bg-slate-50 rounded-2xl text-center border border-slate-200">
                <p className="text-[11px] text-slate-600 font-semibold">
                  {scans.length} scan result{scans.length === 1 ? "" : "s"} saved
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Open Scan Lab to review full history.</p>
              </div>
            ) : (
              <div className="mt-4 py-4 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200">
                <p className="text-[10.5px] text-slate-400 font-medium">No handwritten sheets grading log yet.</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setActiveTab("scanner")}
            className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-[11px] font-semibold text-slate-700 transition active:scale-95 duration-100 cursor-pointer"
          >
            Open Homework Scanner
          </button>
        </div>

        {/* Milestone Rewards challenge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="p-1 px-2 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase rounded border border-emerald-100">
              Diagnostic Rewards
            </span>
            <h3 className="text-sm font-bold text-slate-800 mt-3.5 leading-tight">Topic Challenges</h3>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Attempt challenges to unlock rewards star points and custom math merit stickers:
            </p>
            <div className="mt-3.5 bg-amber-50/70 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2.5xl leading-none">🍰</span>
              <div>
                <h4 className="text-xs font-bold text-amber-900 leading-tight">Fraction Fanatic Badge</h4>
                <p className="text-[10px] text-slate-600 mt-1 leading-none font-medium">
                  Score 100% accuracy on Number Systems
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSelectedQuizTopic("number_system");
              setActiveTab("quiz");
            }}
            className="mt-5 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition active:scale-95 duration-100 text-center shadow-xs"
          >
            Print Challenge Sheet
          </button>
        </div>

      </div>

      {/* Primary Log Center: Evaluations History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span>📋</span>
            Assignment Gradebook Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit reports on virtual quizzes and real scans</p>
        </div>

        {scans.length === 0 && quizResults.length === 0 ? (
          <div className="py-14 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <span className="text-2xl block mb-2">🎈</span>
            <p className="text-slate-700 text-xs font-bold">Your gradebook is empty!</p>
            <p className="text-slate-400 text-[10.5px] mt-1 max-w-xs mx-auto">
              Scan a written school sheet, draft equations, or attempt a quick practice quiz to log grades.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Quizzes list */}
            {quizResults.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Topic Assessments Finished ({quizResults.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quizResults.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex justify-between items-start"
                    >
                      <div className="max-w-[70%] flex flex-col gap-1">
                        <span className="text-[9px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded-lg w-fit">
                          Curriculum Quiz
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">
                          {res.assessmentTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{res.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">
                          "{res.feedback.generalRemark}"
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl shadow-xs ${
                          res.score >= 80 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                            : res.score >= 50 
                              ? "bg-amber-50 text-amber-800 border border-amber-100" 
                              : "bg-rose-50 text-rose-750 border border-rose-100"
                        }`}>
                          {res.score}%
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1.5">{res.correctCount}/{res.totalQuestions} Solved</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
