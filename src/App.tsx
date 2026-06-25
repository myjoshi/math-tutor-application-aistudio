import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  BookOpen,
  TrendingUp,
  MessageCircle,
  User,
  Sparkles,
  RefreshCw,
  Monitor,
  Smartphone,
  Battery,
  Wifi,
  Menu,
  GraduationCap
} from "lucide-react";
import {
  StudentProfile,
  TopicMastery,
  Assessment,
  AssessmentResult,
  ScannedPaperResult,
  ChatMessage,
  Question
} from "./types";
import {
  INITIAL_TOPICS,
  INSTANT_TUTOR_QUESTIONS,
  BADGE_LIST,
  AVATAR_OPTIONS,
  DEFAULT_PROFILE
} from "./data";

import BottomNav from "./components/BottomNav";
import ProfileView from "./components/ProfileView";
import DashboardView from "./components/DashboardView";
import ScannerHubView from "./components/ScannerHubView";
import AssessmentView from "./components/AssessmentView";
import {
  saveStudentProfile,
  loadStudentProfile,
  saveQuizResult,
  loadQuizResults,
  saveScanResult,
  loadScanResults,
  clearAllFirebaseData
} from "./lib/firebase";

export default function App() {
  // Navigation tabs: "dashboard" | "scanner" | "quiz" | "profile"
  const [activeTab, setActiveTab] = useState<"dashboard" | "scanner" | "quiz" | "profile">("dashboard");

  const [isLoading, setIsLoading] = useState(true);

  // State initialization with localStorage persistence
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem("math_tutor_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [scans, setScans] = useState<ScannedPaperResult[]>(() => {
    const saved = localStorage.getItem("math_tutor_scans");
    return saved ? JSON.parse(saved) : [];
  });

  const [quizResults, setQuizResults] = useState<AssessmentResult[]>(() => {
    const saved = localStorage.getItem("math_tutor_quizzes");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state with Firebase on mount
  useEffect(() => {
    async function initData() {
      try {
        const remoteProfile = await loadStudentProfile();
        const remoteScans = await loadScanResults();
        const remoteQuizzes = await loadQuizResults();

        if (remoteProfile) {
          setProfile(remoteProfile);
        } else {
          await saveStudentProfile(profile);
        }

        if (remoteScans && remoteScans.length > 0) {
          setScans(remoteScans);
        } else if (scans.length > 0) {
          for (const scan of scans) {
            await saveScanResult(scan);
          }
        }

        if (remoteQuizzes && remoteQuizzes.length > 0) {
          setQuizResults(remoteQuizzes);
        } else if (quizResults.length > 0) {
          for (const quiz of quizResults) {
            await saveQuizResult(quiz);
          }
        }
      } catch (e) {
        console.error("Failed to sync with Firebase on mount: ", e);
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, []);

  // Save states to localstorage and Firebase whenever they change
  useEffect(() => {
    localStorage.setItem("math_tutor_profile", JSON.stringify(profile));
    if (!isLoading) {
      saveStudentProfile(profile);
    }
  }, [profile, isLoading]);

  useEffect(() => {
    localStorage.setItem("math_tutor_scans", JSON.stringify(scans));
  }, [scans]);

  useEffect(() => {
    localStorage.setItem("math_tutor_quizzes", JSON.stringify(quizResults));
  }, [quizResults]);

  /* ==========================================
     PROFILES & TOPIC HELPERS
     ========================================== */
  const handleResetData = async () => {
    if (confirm("Are you sure you want to reset all progress, scans, and quizzes? This cannot be undone.")) {
      setIsLoading(true);
      try {
        await clearAllFirebaseData();
        localStorage.clear();
        setProfile(DEFAULT_PROFILE);
        setScans([]);
        setQuizResults([]);
        setActiveTab("dashboard");
      } catch (e) {
        console.error("Failed to clear cloud data: ", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateProfileName = (newName: string) => {
    if (!newName.trim()) return;
    setProfile(prev => ({
      ...prev,
      name: newName
    }));
  };

  const selectAvatar = (url: string) => {
    setProfile(prev => ({
      ...prev,
      avatarUrl: url
    }));
  };

  /* ==========================================
     INTEGRATIVE STATS CALCULATION
     ========================================== */
  const totalAttemptedQuestions = quizResults.reduce((acc, q) => acc + q.totalQuestions, 0) + 
    scans.reduce((acc, s) => acc + s.totalProblems, 0);

  const totalCorrectQuestions = quizResults.reduce((acc, q) => acc + q.correctCount, 0) + 
    scans.reduce((acc, s) => acc + s.correctCount, 0);

  const overallAccuracy = totalAttemptedQuestions > 0 
    ? Math.round((totalCorrectQuestions / totalAttemptedQuestions) * 100) 
    : 80;

  /* ==========================================
     SCANNER & HOMEWORK CHECKER STATE & LOGIC
     ========================================== */
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanImageBase64, setScanImageBase64] = useState<string | null>(null);
  const [customScanLabel, setCustomScanLabel] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [currentScanResult, setCurrentScanResult] = useState<ScannedPaperResult | null>(null);
  const [selectedScanHistory, setSelectedScanHistory] = useState<ScannedPaperResult | null>(null);

  // Audio/video stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start back-end scanner API call
  const startCamera = async () => {
    try {
      setScanError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error(err);
      setScanError("Could not access camera. Please check camera permissions in your browser system settings, or pick an image file directly.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (useCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [useCamera]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setScanImageBase64(dataUrl);
        setUseCamera(false);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setScanImageBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCheckPaper = async () => {
    if (!scanImageBase64) return;
    setIsScanning(true);
    setScanError(null);

    const base64Data = scanImageBase64.split(",")[1];
    const mimeType = scanImageBase64.split(";")[0].split(":")[1] || "image/jpeg";

    try {
      const response = await fetch("/api/check-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          mimeType: mimeType,
          customLabel: customScanLabel || "6th Grade Homework Page"
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to analyze homework.");
      }

      const verifiedResult: ScannedPaperResult = await response.json();
      verifiedResult.id = `scan_${Date.now()}`;
      verifiedResult.date = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      verifiedResult.imageUrl = scanImageBase64;

      setCurrentScanResult(verifiedResult);
      setScans(prev => [verifiedResult, ...prev]);
      saveScanResult(verifiedResult);

      // Star point calculations (15pt per correct problem + 20pt baseline activity points)
      const pointsEarned = verifiedResult.correctCount * 15 + 20;
      const awardBadges: string[] = [...profile.badges];
      if (!awardBadges.includes("paper_scanner")) {
        awardBadges.push("paper_scanner");
      }

      const updatedSkills = { ...profile.skills };
      
      verifiedResult.problems.forEach((prob) => {
        let matchedTopicId = "number_system";
        const skillLower = (prob.recommendedSkill || "").toLowerCase();
        
        if (skillLower.includes("ratio") || skillLower.includes("rate") || skillLower.includes("percent")) {
          matchedTopicId = "ratios";
        } else if (skillLower.includes("equation") || skillLower.includes("expression") || skillLower.includes("solve")) {
          matchedTopicId = "expressions";
        } else if (skillLower.includes("volume") || skillLower.includes("area") || skillLower.includes("geometry")) {
          matchedTopicId = "geometry";
        } else if (skillLower.includes("mean") || skillLower.includes("plot") || skillLower.includes("statistic")) {
          matchedTopicId = "statistics";
        }

        const skill = updatedSkills[matchedTopicId];
        if (skill) {
          const totalAttempts = (skill.scoreCount || 0) + 1;
          const currentTopicScore = prob.isCorrect ? 100 : 0;
          const newAvg = Math.round(((skill.averageScore * (totalAttempts - 1)) + currentTopicScore) / totalAttempts);
          
          let updatedLevel = skill.masteryLevel;
          if (prob.isCorrect) {
            updatedLevel = Math.min(100, updatedLevel + 10);
            if (!skill.strengths.includes(prob.recommendedSkill)) {
              skill.strengths = [...skill.strengths.slice(-2), prob.recommendedSkill];
            }
          } else {
            updatedLevel = Math.max(0, updatedLevel - 5);
            if (!skill.weaknesses.includes(prob.recommendedSkill)) {
              skill.weaknesses = [...skill.weaknesses.slice(-2), prob.recommendedSkill];
            }
          }

          updatedSkills[matchedTopicId] = {
            ...skill,
            scoreCount: totalAttempts,
            averageScore: newAvg,
            masteryLevel: updatedLevel,
            lastTested: new Date().toLocaleDateString()
          };
        }
      });

      setProfile(prev => ({
        ...prev,
        points: prev.points + pointsEarned,
        badges: awardBadges,
        skills: updatedSkills
      }));

    } catch (e: any) {
      console.error(e);
      setScanError(e.message || "An error occurred during homework scans. Make sure GEMINI_API_KEY is configured.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearCurrentScan = () => {
    setScanImageBase64(null);
    setCurrentScanResult(null);
    setSelectedScanHistory(null);
    setCustomScanLabel("");
    setScanError(null);
  };

  /* ==========================================
     QUIZ GENERATION AREA
     ========================================== */
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [quizGenError, setQuizGenError] = useState<string | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Assessment | null>(null);
  const [selectedQuizTopic, setSelectedQuizTopic] = useState<string>("ratios");
  const [userQuizAnswers, setUserQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [quizScoreCard, setQuizScoreCard] = useState<AssessmentResult | null>(null);

  const startTopicQuiz = async (topicId: string, topicName: string, numQuestions: number = 10) => {
    setIsGeneratingTest(true);
    setQuizGenError(null);
    setQuizSubmitted(false);
    setUserQuizAnswers({});
    setCurrentQuiz(null);
    setQuizScoreCard(null);
    setActiveQuizIndex(0);

    try {
      // Calculate mastery level of selected topic for difficulty adaptation
      let masteryLevel = 50;
      if (topicId === "mixed") {
        const skillsArray = Object.values(profile.skills) as TopicMastery[];
        const sum = skillsArray.reduce((acc: number, curr) => acc + curr.masteryLevel, 0);
        masteryLevel = skillsArray.length > 0 ? Math.round(sum / skillsArray.length) : 50;
      } else {
        const skillObj = profile.skills[topicId] as TopicMastery | undefined;
        if (skillObj) {
          masteryLevel = skillObj.masteryLevel;
        }
      }

      // Generate a unique seed to prevent question repetition
      const seed = `seed_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, topicName, numQuestions, masteryLevel, seed })
      });

      if (!response.ok) {
        throw new Error("Unable to create virtual test.");
      }

      const generatedTest = await response.json();
      setCurrentQuiz(generatedTest);
    } catch (e: any) {
      console.error("Quiz gen error:", e);
      const msg = e?.message || "Failed to generate quiz.";
      setQuizGenError(
        msg.includes("GEMINI_API_KEY")
          ? "GEMINI_API_KEY is not configured. Please add it to your .env.local file and restart the server."
          : `Could not generate quiz: ${msg}`
      );
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const selectQuizOption = (qId: string, option: string) => {
    if (quizSubmitted) return;
    setUserQuizAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const setShortAnswer = (qId: string, txt: string) => {
    if (quizSubmitted) return;
    setUserQuizAnswers(prev => ({ ...prev, [qId]: txt }));
  };

  const submitQuiz = () => {
    if (!currentQuiz) return;
    setQuizSubmitted(true);

    let correct = 0;
    currentQuiz.questions.forEach((q) => {
      const answerVal = (userQuizAnswers[q.id] || "").trim().toLowerCase();
      const correctAnswerVal = q.correctAnswer.trim().toLowerCase();

      if (answerVal === correctAnswerVal) {
        correct++;
      } else if (q.type === "short-answer" && parseFloat(answerVal) === parseFloat(correctAnswerVal)) {
        correct++;
      }
    });

    const percent = Math.round((correct / currentQuiz.questions.length) * 100);

    const quizReport: AssessmentResult = {
      id: `res_${Date.now()}`,
      assessmentId: currentQuiz.id,
      assessmentTitle: currentQuiz.title,
      topicId: currentQuiz.topicId,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      score: percent,
      totalQuestions: currentQuiz.questions.length,
      correctCount: correct,
      userAnswers: userQuizAnswers,
      feedback: {
        generalRemark: percent === 100 
          ? "Outstanding! Absolutely perfect math answers." 
          : percent >= 75 
            ? "Excellent understanding! Review solutions to see any arithmetic slippage." 
            : "Nice attempt! Review the steps and try another practice quiz.",
        strengths: percent >= 75 ? currentQuiz.skillsTested : [currentQuiz.skillsTested[0]],
        improvements: percent < 100 ? ["Slow down formulas calculations", "Double-check division remainders"] : []
      }
    };

    setQuizResults(prev => [quizReport, ...prev]);
    saveQuizResult(quizReport);
    setQuizScoreCard(quizReport);

    const pointsAwarded = Math.round(correct * 20 + (percent === 100 ? 50 : 10));
    const awardBadges: string[] = [...profile.badges];

    if (currentQuiz.topicId === "number_system" && percent === 100 && !awardBadges.includes("fraction_fanatic")) {
      awardBadges.push("fraction_fanatic");
    }
    if (currentQuiz.topicId === "ratios" && !awardBadges.includes("ratio_ranger")) {
      awardBadges.push("ratio_ranger");
    }

    const parentTopic = profile.skills[currentQuiz.topicId];
    if (parentTopic) {
      const totalQuizzes = (parentTopic.scoreCount || 0) + 1;
      const updatedAvg = Math.round(((parentTopic.averageScore * (totalQuizzes - 1)) + percent) / totalQuizzes);
      const isUp = percent >= 70;
      
      let newLevel = Math.max(0, Math.min(100, parentTopic.masteryLevel + (percent >= 80 ? 15 : percent >= 50 ? 5 : -10)));

      const updatedTopic: TopicMastery = {
        ...parentTopic,
        scoreCount: totalQuizzes,
        averageScore: updatedAvg,
        masteryLevel: newLevel,
        lastTested: new Date().toLocaleDateString(),
        strengths: isUp ? Array.from(new Set([...parentTopic.strengths, ...currentQuiz.skillsTested])) : parentTopic.strengths,
        weaknesses: !isUp ? Array.from(new Set([...parentTopic.weaknesses, ...currentQuiz.skillsTested])) : parentTopic.weaknesses
      };

      setProfile(prev => ({
        ...prev,
        points: prev.points + pointsAwarded,
        badges: awardBadges,
        skills: {
          ...prev.skills,
          [currentQuiz.topicId]: updatedTopic
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        points: prev.points + pointsAwarded,
        badges: awardBadges
      }));
    }
  };

  /* ==========================================
     TAB ROUTING HELPER
     ========================================== */
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            profile={profile}
            scans={scans}
            quizResults={quizResults}
            setActiveTab={setActiveTab}
            setSelectedScanHistory={(scan) => {
              setSelectedScanHistory(scan);
              setCurrentScanResult(null);
            }}
            setSelectedQuizTopic={setSelectedQuizTopic}
            overallAccuracy={overallAccuracy}
          />
        );
      case "scanner":
        return (
          <ScannerHubView
            useCamera={useCamera}
            setUseCamera={setUseCamera}
            scanImageBase64={scanImageBase64}
            setScanImageBase64={setScanImageBase64}
            customScanLabel={customScanLabel}
            setCustomScanLabel={setCustomScanLabel}
            isScanning={isScanning}
            scanError={scanError}
            currentScanResult={currentScanResult}
            selectedScanHistory={selectedScanHistory}
            triggerCheckPaper={triggerCheckPaper}
            handleClearCurrentScan={handleClearCurrentScan}
            videoRef={videoRef}
            capturePhoto={capturePhoto}
            handleFileUpload={handleFileUpload}
            setActiveTab={setActiveTab}
          />
        );
      case "quiz":
        return (
          <AssessmentView
            profile={profile}
            activeQuizIndex={activeQuizIndex}
            setActiveQuizIndex={setActiveQuizIndex}
            userQuizAnswers={userQuizAnswers}
            quizSubmitted={quizSubmitted}
            isGeneratingTest={isGeneratingTest}
            quizGenError={quizGenError}
            currentQuiz={currentQuiz}
            setCurrentQuiz={setCurrentQuiz}
            quizScoreCard={quizScoreCard}
            setQuizScoreCard={setQuizScoreCard}
            selectedQuizTopic={selectedQuizTopic}
            setSelectedQuizTopic={setSelectedQuizTopic}
            startTopicQuiz={startTopicQuiz}
            selectQuizOption={selectQuizOption}
            setShortAnswer={setShortAnswer}
            submitQuiz={submitQuiz}
            setQuizSubmitted={setQuizSubmitted}
          />
        );
      case "profile":
        return (
          <ProfileView
            profile={profile}
            updateProfileName={updateProfileName}
            selectAvatar={selectAvatar}
            overallAccuracy={overallAccuracy}
            totalAttemptedQuestions={totalAttemptedQuestions}
            handleResetData={handleResetData}
            setActiveTab={setActiveTab}
          />
        );
      default:
        return null;
    }
  };

  /* ==========================================================
     CORE HTML LAYOUTS (SIMULATOR FORCE vs RESPONSIVE FLUID)
     ========================================================== */
  return (
    <div className="w-full min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      
      {/* Visual Workspace Controller Top bar */}
      <div className="h-14 bg-indigo-950 border-b border-indigo-900 px-6 flex items-center justify-between shrink-0 text-white shadow-md select-none no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-md shadow-inner">
            ∑
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight">Math Assessment Center</h1>
            <p className="text-[9px] text-indigo-300 font-semibold uppercase leading-none tracking-widest sm:block hidden">
              Offline & Printable Practice Module
            </p>
          </div>
        </div>

        {/* Badges/points metrics indicator */}
        <div className="flex items-center gap-1.5 bg-indigo-900/50 border border-indigo-800/60 px-3 py-1 rounded-full text-amber-300 font-bold text-xs shadow-xs">
          <span>⭐️</span>
          <span>{profile.points} pts</span>
        </div>
      </div>

      {/* RESPONSIVE FLUID LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Responsive Left Sidebar Diagnostics */}
        <aside className="hidden lg:flex w-76 bg-white border-r border-slate-200 p-5 flex-col gap-6 shrink-0 overflow-y-auto no-print">
          
          {/* Profiles card */}
          <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center text-center gap-3 border border-slate-200/40 shadow-xs relative overflow-hidden">
            <img
              src={profile.avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
            />
            <div>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfileName(e.target.value)}
                className="text-sm font-bold text-slate-800 text-center bg-transparent border-b border-dashed border-slate-300 hover:border-indigo-500 focus:outline-none w-28 text-center truncate"
              />
              <span className="text-[9px] font-bold block text-slate-400 uppercase tracking-widest mt-1">
                6th Grade Scholar
              </span>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full text-amber-700 font-bold text-[10px]">
              <span>⭐️</span>
              <span>{profile.points} points</span>
            </div>
          </div>

          {/* Performance diagnostics */}
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">
              Diagnostics Insights
            </span>
            <div className="space-y-2.5">
              {(Object.values(profile.skills) as TopicMastery[]).map((skill) => {
                const hasTested = skill.scoreCount > 0;
                return (
                  <div key={skill.topicId} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/40">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 truncate max-w-[140px]">{skill.name}</span>
                      <span className="font-mono font-bold text-[9px]">{hasTested ? `${skill.masteryLevel}%` : "Untested"}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${skill.masteryLevel >= 75 ? "bg-emerald-500" : "bg-indigo-600"}`}
                        style={{ width: `${hasTested ? skill.masteryLevel : 10}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements stickers list */}
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">
              Stickers Archive
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {BADGE_LIST.map((badge) => {
                const unlocked = profile.badges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    title={`${badge.name}: ${badge.desc}`}
                    className={`aspect-square rounded-xl border flex items-center justify-center text-md relative ${
                      unlocked ? "bg-white border-indigo-200 shadow-xs" : "bg-slate-50 opacity-30 select-none"
                    }`}
                  >
                    {badge.icon}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick resets */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={handleResetData}
              draggable={false}
              className="w-full py-2 bg-slate-900 border border-transparent text-white hover:bg-slate-800 transition rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 duration-100"
            >
              <RefreshCw className="w-3 h-3" />
              Wipe Local Progress
            </button>
          </div>
        </aside>

        {/* Active content viewport */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
          {activeTab === "profile" ? (
            /* If in responsive desktop mode, the profile view acts as the diagnostics report view as well */
            <ProfileView
              profile={profile}
              updateProfileName={updateProfileName}
              selectAvatar={selectAvatar}
              overallAccuracy={overallAccuracy}
              totalAttemptedQuestions={totalAttemptedQuestions}
              handleResetData={handleResetData}
              setActiveTab={setActiveTab}
            />
          ) : (
            renderTabContent()
          )}
        </div>

        {/* Responsive Bottom Navigation Bar */}
        <div className="no-print">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} badgeCount={profile.badges.length} />
        </div>
      </div>

    </div>
  );
}
