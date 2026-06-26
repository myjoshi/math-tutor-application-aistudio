import React, { useState, useRef, useEffect } from "react";
import { Camera, Check, RotateCcw, X, AlertCircle } from "lucide-react";

interface MobileCameraProps {
  onCapturePhoto: (photoBase64: string) => void;
  onClose: () => void;
}

export default function MobileCamera({ onCapturePhoto, onClose }: MobileCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    startCamera().then((id) => {
      timeoutId = id;
    });
    
    const handleOrientationChange = () => {
      setOrientation(window.innerWidth > window.innerHeight ? "landscape" : "portrait");
    };
    
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log("Requesting camera access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      console.log("Camera stream obtained:", stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Stream assigned to video element");
        
        // Try to play immediately
        try {
          await videoRef.current.play();
          console.log("Video playing successfully");
          setIsLoading(false);
        } catch (playError) {
          console.warn("Play error (will retry):", playError);
          
          // Fallback: wait for canplay event
          const handleCanPlay = () => {
            console.log("Video ready (canplay event)");
            setIsLoading(false);
            videoRef.current?.removeEventListener('canplay', handleCanPlay);
          };
          videoRef.current.addEventListener('canplay', handleCanPlay);
        }
        
        // Timeout fallback - if nothing happens after 4 seconds, dismiss loading
        const timeoutId = setTimeout(() => {
          console.warn("Camera initialization timeout - dismissing loading");
          setIsLoading(false);
        }, 4000);
        
        return timeoutId;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      
      let errorMessage = "Could not access camera. Please check camera permissions.";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "📱 Camera permission denied. Please enable camera in browser settings and try again.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "❌ No camera found on this device.";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "⚠️ Your browser doesn't support camera access. Try Chrome, Firefox, or Safari on iOS.";
      } else if (err.name === "SecurityError") {
        errorMessage = "🔒 Camera access requires HTTPS. Please use a secure connection.";
      } else if (err.message?.includes("Permission denied")) {
        errorMessage = "📱 Camera permission denied. Check your browser settings and try again.";
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setCapturedImage(dataUrl);
        
        // Haptic feedback on capture (if available)
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      }
    }
  };

  const acceptPhoto = () => {
    if (capturedImage) {
      onCapturePhoto(capturedImage);
      setCapturedImage(null);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Show captured image preview
  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-0">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <img
            src={capturedImage}
            alt="Captured preview"
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Confirmation overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-8 pb-6 px-4">
          <p className="text-white text-sm font-semibold text-center mb-4">
            ✓ Photo captured! Keep it or take another?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={acceptPhoto}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold flex items-center gap-2 active:scale-95 transition shadow-lg"
            >
              <Check className="w-5 h-5" />
              Keep Photo
            </button>
            <button
              onClick={retakePhoto}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold flex items-center gap-2 active:scale-95 transition shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-4">
        <div className="bg-rose-900/30 border border-rose-500/50 rounded-3xl p-6 max-w-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-rose-400" />
            <h3 className="text-white font-bold">Camera Error</h3>
          </div>
          <p className="text-rose-100 text-sm mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold active:scale-95 transition"
          >
            Close Camera
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-semibold mb-2">Initializing camera...</p>
          <p className="text-slate-400 text-xs">Make sure you've granted camera permission to this app</p>
          
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Main camera view
  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Video stream - full screen */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        webkit-playsinline="true"
        style={{
          transform: 'scaleX(-1)',
          WebkitTransform: 'scaleX(-1)',
        }}
      />

      {/* Camera controls overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent">
        <h3 className="text-white font-bold text-sm">📸 Position worksheet and tap capture</h3>
        <button
          onClick={onClose}
          className="p-2 bg-slate-800/60 hover:bg-slate-700 text-white rounded-full active:scale-90 transition"
          aria-label="Close camera"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Capture button at bottom - large touch target for mobile */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-6 px-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-8">
        <button
          onClick={capturePhoto}
          className="w-20 h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition duration-150 border-4 border-indigo-500"
          aria-label="Capture photo"
        >
          <Camera className="w-10 h-10" />
        </button>
      </div>

      {/* Focus guide - subtle crosshair */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-32 h-32 border-2 border-dashed border-white/20 rounded-lg"></div>
      </div>
    </div>
  );
}
