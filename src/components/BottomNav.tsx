import React from "react";
import { TrendingUp, Camera, BookOpen, User } from "lucide-react";

interface BottomNavProps {
  activeTab: "dashboard" | "scanner" | "quiz" | "profile";
  setActiveTab: (tab: "dashboard" | "scanner" | "quiz" | "profile") => void;
  badgeCount?: number;
}

export default function BottomNav({ activeTab, setActiveTab, badgeCount = 0 }: BottomNavProps) {
  const tabs = [
    { id: "dashboard", label: "Home", icon: TrendingUp },
    { id: "scanner", label: "Scan Lab", icon: Camera },
    { id: "quiz", label: "Worksheets", icon: BookOpen },
    { id: "profile", label: "Profile", icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-200 h-[68px] px-2 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 relative focus:outline-none transition-all duration-150 group"
          >
            <div
              className={`w-12 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${
                isActive
                  ? "bg-indigo-100 text-indigo-700 font-bold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 group-active:scale-95"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
            </div>
            <span
              className={`text-[10px] font-semibold tracking-tight transition-all leading-none ${
                isActive ? "text-indigo-700 font-bold" : "text-slate-500"
              }`}
            >
              {tab.label}
            </span>
            {tab.id === "profile" && badgeCount > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-5 w-2 h-2 rounded-full bg-indigo-600 border border-white"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
