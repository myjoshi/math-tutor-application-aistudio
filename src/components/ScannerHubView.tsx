import React from "react";
import { ScannedPaperResult } from "../types";
import { Camera, Upload, XCircle, CheckCircle, Sparkles, RefreshCw, AlertCircle, FileText, HelpCircle, ArrowLeft, Clock } from "lucide-react";

interface ScannerHubProps {
  scans: ScannedPaperResult[];
  useCamera: boolean;
  setUseCamera: (v: boolean) => void;
  scanImagesBase64: string[];
  setSelectedScanHistory: (scan: ScannedPaperResult | null) => void;
  removeScanImageAt: (index: number) => void;
  clearScanImages: () => void;
  customScanLabel: string;
  setCustomScanLabel: (txt: string) => void;
  isScanning: boolean;
  scanError: string | null;
  currentScanResult: ScannedPaperResult | null;
  selectedScanHistory: ScannedPaperResult | null;
  triggerCheckPaper: () => Promise<void>;
  handleClearCurrentScan: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  capturePhoto: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setActiveTab: (tab: "dashboard" | "scanner" | "quiz" | "profile") => void;
}

export default function ScannerHubView({
  scans,
  useCamera,
  setUseCamera,
  scanImagesBase64,
  setSelectedScanHistory,
  removeScanImageAt,
  clearScanImages,
  customScanLabel,
  setCustomScanLabel,
  isScanning,
  scanError,
  currentScanResult,
  selectedScanHistory,
  triggerCheckPaper,
  handleClearCurrentScan,
  videoRef,
  capturePhoto,
  handleFileUpload,
  setActiveTab
}: ScannerHubProps) {
  const getScanTotals = (scan: ScannedPaperResult) => {
    const totalProblems = scan.problems?.length ?? scan.totalProblems ?? 0;
    const correctCount = scan.problems?.filter((problem) => problem.isCorrect).length ?? scan.correctCount ?? 0;
    return { totalProblems, correctCount };
  };
  
  const activeReport = currentScanResult || selectedScanHistory;
  const activeReportTotals = activeReport ? getScanTotals(activeReport) : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 bg-slate-50 flex flex-col gap-6 pb-24 lg:pb-6">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-md">
            Homework Analyzer Lab
          </span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1.5">
            Check Handwritten Worksheets
          </h2>
          <p className="text-slate-500 text-xs">
            Snap a photo or pick an assignment image to parse, check answers, and review solved steps.
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="w-full md:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 duration-100 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>

          {/* Clear & Upload another paper trigger */}
          {activeReport && (
            <button
              onClick={handleClearCurrentScan}
              className="w-full md:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 duration-100 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              Upload Another Paper
            </button>
          )}
        </div>
      </div>

      {/* Alarm box */}
      {scanError && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl flex gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-bold text-rose-800">Scanner Assistance Notice</p>
            <p className="mt-0.5 leading-relaxed">{scanError}</p>
          </div>
        </div>
      )}

      {/* NO REPORT LOADED - RENDER UPLOAD & CAMERA PREVIEW CONTROLS */}
      {!activeReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Uploader / Camera area (Left) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 md:p-6 flex flex-col justify-between shadow-xs">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>📸</span>
                1. Capture or Select Picture
              </h3>

              {useCamera ? (
                /* Native video streaming container */
                <div id="camera-preview-container" className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 aspect-video relative flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute bottom-4 flex gap-2.5 z-10 w-full px-4 justify-center">
                    <button
                      onClick={capturePhoto}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 duration-100 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                    <button
                      onClick={() => setUseCamera(false)}
                      className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold active:scale-95 duration-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Static Image view (or empty upload dragbox area) */
                <div className="space-y-4">
                  
                  {/* File Upload drag-and-drop container */}
                  <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 transition rounded-3xl p-6 text-center flex flex-col items-center justify-center min-h-[220px] relative group overflow-hidden">
                    {scanImagesBase64.length > 0 ? (
                      <div className="w-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {scanImagesBase64.map((image, index) => (
                            <div key={`${index}-${image.slice(0, 20)}`} className="relative">
                              <img
                                src={image}
                                alt={`Worksheet page ${index + 1}`}
                                className="h-24 w-full rounded-xl object-cover border border-slate-200 shadow-sm bg-white"
                              />
                              <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Page {index + 1}
                              </span>
                              <button
                                onClick={() => removeScanImageAt(index)}
                                className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md active:scale-110 transition duration-150"
                                title="Remove page"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={clearScanImages}
                          className="mt-3 text-[10px] font-bold text-rose-600 hover:text-rose-700"
                        >
                          Clear all pages
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition duration-200">
                          <Upload className="w-5 h-5 animate-pulse" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 leading-tight">
                          <label className="text-indigo-600 hover:underline cursor-pointer">
                            Click to pick homework image
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Supports JPG, PNG, GIF up to 10MB (multi-page allowed)</p>
                      </div>
                    )}
                  </div>

                  {/* Device webcam trigger */}
                  <button
                    onClick={() => setUseCamera(true)}
                    className="w-full py-3 border border-slate-200 hover:border-indigo-300 rounded-2xl text-xs font-bold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/30 transition duration-150 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-slate-500" />
                    Capture Page with Camera
                  </button>

                </div>
              )}

            </div>

            {/* Submission forms (bottom) */}
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Title or Topic Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ratio practice sheet"
                  value={customScanLabel}
                  onChange={(e) => setCustomScanLabel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 font-medium text-slate-800"
                />
              </div>

              <button
                onClick={triggerCheckPaper}
                disabled={scanImagesBase64.length === 0 || isScanning}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wide shadow-md flex items-center justify-center gap-2 transition duration-200 active:scale-98 ${
                  scanImagesBase64.length > 0 && !isScanning
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    <span>Grading & transcribing your paper...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>Grade {scanImagesBase64.length > 1 ? `${scanImagesBase64.length} Pages` : "Worksheet"} Now</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Guide remarks (Right) */}
          <div className="lg:col-span-5 bg-slate-100/50 rounded-3xl border border-slate-200/60 p-5 md:p-6 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <span className="p-1 px-2.5 bg-slate-200 text-slate-600 text-[9px] font-bold uppercase rounded-md tracking-wider">
                Support Panel
              </span>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">Solving Worksheets with AI</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Tutor Mathy provides quick mathematical grading by reviewing handwritten layouts and solutions:
              </p>

              <div className="space-y-4 pt-1.5">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Student OCR Handwriting Transcription</h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      Accurately reads numbers, scratchpads, division outlines, and crossed-out variables.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Detailed Arithmetic Error Audits</h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      Determines exactly which step tripped them up (e.g., incorrect multiplications, decimal places).
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Dynamic Diagnostic Updates</h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      Updates student topic masteries, and provides points and badging metrics on complete logs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-950 text-indigo-100 rounded-xl text-[10px] font-medium flex items-center gap-2.5 shadow-sm">
              <span className="text-lg">💡</span>
              <p>For best results, lay the assignment paper perfectly flat, avoid camera shadows, and capture in bright ambient lighting!</p>
            </div>
          </div>

        </div>
      ) : (
        /* REPORT ACTIVE ANALYSIS COMPARISON VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Snapshot source view card (Left 5 Columns) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="bg-slate-50 flex items-center px-4 py-3 justify-between border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Scanned Source View</span>
              <span className="text-[10px] text-slate-400 font-mono font-bold leading-none">IMAGE PREVIEW</span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-center items-center bg-slate-50/70 min-h-[300px]">
              {activeReport.imageUrl ? (
                <div className="relative max-w-full">
                  <img
                    src={activeReport.imageUrl}
                    alt="Evaluation raw scan source"
                    className="max-h-[320px] rounded-2xl border border-slate-200 object-contain shadow-xs mx-auto bg-white"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded-lg font-bold">
                    Checked Sheet
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white w-full">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs">No preview stored. Scanned items are audited below.</p>
                </div>
              )}

              {/* Assessment Grade Card */}
              <div className="w-full mt-4 bg-white p-4 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Checked Assessment</h4>
                    <p className="text-[9.5px] text-slate-400 leading-none mt-0.5">Logs archived in database</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-indigo-600 block leading-tight">
                    {activeReportTotals?.correctCount ?? 0}/{activeReportTotals?.totalProblems ?? 0}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Correct Score</span>
                </div>
              </div>
            </div>

            {/* Diagnostics suggestions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                Concepts targeting improvement
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeReport.keyConceptToImprove.map((item, id) => (
                  <span key={id} className="bg-amber-50 text-amber-800 text-[10px] font-bold p-1 px-3.5 rounded-lg border border-amber-200/50 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Tutoring panel (Right 7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Tutor message card */}
            <div className="bg-indigo-950 text-white rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col">
              <span className="p-1 px-2.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase rounded-lg border border-indigo-400/20 w-fit">
                Tutor Remarks
              </span>
              <h4 className="text-md font-bold text-slate-100 mt-2.5">Tutor Mathy's Evaluation Summary</h4>
              <p className="text-slate-300 text-xs leading-relaxed mt-1.5">
                {activeReport.generalFeedback}
              </p>

              <div className="mt-4 bg-indigo-900 border border-indigo-800/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-[9px] font-bold block text-indigo-300 uppercase tracking-wide">
                    Action Step Lesson Study
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5 truncate">{activeReport.suggestedAction}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("quiz");
                  }}
                  className="bg-white hover:bg-slate-100 text-indigo-950 px-3.5 py-1.5 rounded-xl text-[10px] font-black transition duration-150 shadow-sm text-center shrink-0 active:scale-95 cursor-pointer"
                >
                  Generate Practice Test ➜
                </button>
              </div>
            </div>

            {/* List of problems detected inside paper */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Problems parsed on page
              </h4>

              <div className="space-y-4">
                {activeReport.problems.map((prob, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition duration-150 ${
                      prob.isCorrect
                        ? "bg-emerald-50/20 border-emerald-100/80"
                        : "bg-rose-50/20 border-rose-100/80"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      
                      <div className="flex items-start gap-2.5 max-w-[78%]">
                        <span className={`w-5.5 h-5.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                          prob.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {prob.problemNumber}
                        </span>
                        
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 leading-snug">"{prob.questionText}"</h5>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200/60 rounded-md p-1 px-2.5 leading-none">
                              Student's Answer: <strong className={prob.isCorrect ? "text-emerald-700" : "text-rose-700 font-black"}>{prob.studentAnswer}</strong>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200/60 rounded-md p-1 px-2.5 leading-none">
                              Correct Fact: <strong className="text-indigo-700">{prob.correctAnswer}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-wider shrink-0 whitespace-nowrap ${
                        prob.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {prob.isCorrect ? "Correct ✓" : "Mistake ⚠️"}
                      </span>

                    </div>

                    {/* Step breakdowns */}
                    <div className="mt-3.5 pl-8 border-l-2 border-slate-200">
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        <strong className="text-slate-800 not-italic block font-bold text-[11px] mb-0.5">Tutor Correction Analysis:</strong>
                        {prob.tutorEvaluation}
                      </p>

                      {prob.correctSteps && prob.correctSteps.length > 0 && (
                        <div className="mt-3.5 bg-white/80 p-3 rounded-xl border border-slate-100">
                          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Step-By-Step Solution Path
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 font-medium">
                            {prob.correctSteps.map((step, sId) => (
                              <li key={sId} className="leading-relaxed pl-1.5">
                                <b className="font-semibold text-slate-700">{step}</b>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      )}

      {scans.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Scan History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Visible on Scan page only.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scans.map((scan) => (
              <button
                key={scan.id}
                onClick={() => setSelectedScanHistory(scan)}
                className="p-3.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition rounded-2xl flex justify-between items-start duration-100"
              >
                <div className="max-w-[74%] flex flex-col gap-1">
                  <span className="text-[9px] text-indigo-700 bg-indigo-50 font-bold px-1.5 py-0.5 rounded-lg w-fit">
                    Worksheet Scan
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">{scan.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{scan.date}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-indigo-700 bg-white border border-indigo-100 px-2 py-1 rounded-xl shadow-xs shrink-0">
                  {getScanTotals(scan).correctCount}/{getScanTotals(scan).totalProblems}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
