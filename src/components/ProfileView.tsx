import React from "react";
import { StudentProfile, TopicMastery } from "../types";
import { BADGE_LIST, AVATAR_OPTIONS } from "../data";
import { Award, RefreshCw, Star, BarChart3, GraduationCap, ChevronRight, Settings } from "lucide-react";

interface ProfileViewProps {
  profile: StudentProfile;
  updateProfileName: (name: string) => void;
  selectAvatar: (url: string) => void;
  overallAccuracy: number;
  totalAttemptedQuestions: number;
  handleResetData: () => void;
  setActiveTab: (tab: "dashboard" | "scanner" | "quiz" | "profile") => void;
}

export default function ProfileView({
  profile,
  updateProfileName,
  selectAvatar,
  overallAccuracy,
  totalAttemptedQuestions,
  handleResetData,
  setActiveTab
}: ProfileViewProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 bg-slate-50 flex flex-col gap-6 max-w-md mx-auto w-full lg:max-w-none pb-24 lg:pb-6">
      
      {/* Header Profile Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4 items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 text-slate-400 hover:text-slate-600 cursor-pointer">
          <Settings className="w-4.5 h-4.5" />
        </div>
        
        {/* Avatar Select Container */}
        <div className="relative group">
          <img
            src={profile.avatarUrl}
            alt="Student Avatar"
            className="w-20 h-20 rounded-full object-cover border-4 border-indigo-50 shadow-md hover:scale-105 transition duration-200"
          />
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-white shadow-xs">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 justify-center">
            <input
              type="text"
              id="profile-name-input"
              value={profile.name}
              onChange={(e) => updateProfileName(e.target.value)}
              className="text-lg font-bold text-slate-800 bg-transparent text-center border-b border-dashed border-slate-300 hover:border-indigo-400 focus:border-indigo-600 focus:outline-none px-2 max-w-[160px] truncate"
              title="Click to edit name"
            />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest leading-none">
            {profile.grade} Grade Scholar
          </p>
        </div>

        {/* Change Avatar Options */}
        <div className="w-full pt-1.5 border-t border-slate-100 flex flex-col gap-1.5">
          <p className="text-[10px] text-slate-400 font-bold tracking-wide">Pick your Avatar</p>
          <div className="flex justify-center gap-2.5">
            {AVATAR_OPTIONS.map((av, idx) => (
              <button
                key={idx}
                onClick={() => selectAvatar(av)}
                className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${
                  profile.avatarUrl === av ? "border-indigo-600 shadow-sm" : "border-slate-200"
                }`}
              >
                <img src={av} alt="Option" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-amber-500 mb-1.5">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Star Points</span>
            </div>
            <p className="text-2xl font-black text-slate-800 leading-none">{profile.points}</p>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-2">Earned through practice</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-500 mb-1.5">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</span>
            </div>
            <p className="text-2xl font-black text-slate-800 leading-none">{overallAccuracy}%</p>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${overallAccuracy >= 80 ? "bg-emerald-500" : "bg-indigo-600"}`}
              style={{ width: `${overallAccuracy}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Course Progress Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
          <span>🎯</span>
          Skill Mastery Level
        </h3>
        <div className="space-y-3.5">
          {Object.values(profile.skills).map((skill: TopicMastery) => {
            const hasTested = skill.scoreCount > 0;
            return (
              <div key={skill.topicId} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">{skill.name}</span>
                  <span
                    className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      hasTested
                        ? skill.masteryLevel >= 75
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : skill.masteryLevel >= 50
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {hasTested ? `${skill.masteryLevel}% Mastery` : "Untested"}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      skill.masteryLevel >= 75
                        ? "bg-emerald-500"
                        : skill.masteryLevel >= 50
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${hasTested ? skill.masteryLevel : 8}%` }}
                  ></div>
                </div>

                {hasTested && (
                  <div className="flex justify-between items-center text-[10px] text-slate-400 leading-none mt-0.5">
                    <span>Tested {skill.scoreCount} times</span>
                    {skill.weaknesses.length > 0 ? (
                      <span className="text-amber-600 font-semibold truncate max-w-[200px]">
                        ⚠️ Review: {skill.weaknesses[0]}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">✅ Rock Solid foundations</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-4.5 h-4.5 text-indigo-500" />
            Unlocked Badges
          </h3>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
            {profile.badges.length}/{BADGE_LIST.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {BADGE_LIST.map((badge) => {
            const unlocked = profile.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                title={`${badge.name}: ${badge.desc}`}
                className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                  unlocked
                    ? "bg-white border-indigo-200 shadow-sm cursor-help scale-100"
                    : "bg-slate-50/50 border-slate-200/40 opacity-40 select-none"
                }`}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-[9px] font-extrabold text-slate-800 leading-tight block truncate w-full">
                  {badge.name}
                </span>
                {unlocked && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-xs"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dangerous Reset Action */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mt-2">
        <h3 className="text-xs font-bold text-slate-700 mb-1 leading-tight">Danger Zone</h3>
        <p className="text-[10px] text-slate-400 mb-4 leading-normal">
          Running out of space or want to restart your homework grading course? This wipes out your locally cached evaluations, points, and diagnostics history.
        </p>

        <button
          onClick={handleResetData}
          className="w-full py-2.5 border border-slate-200 hover:border-rose-400 hover:text-rose-600 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 duration-100 bg-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All Student Data
        </button>
      </div>

    </div>
  );
}
