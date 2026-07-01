import { useEffect, useRef, useState, useMemo } from 'react';
import { useHandTracking } from './hooks/useHandTracking';
import type { DetectedHand } from './hooks/useHandTracking';
import { useSmoothDrawing } from './hooks/useSmoothDrawing';
import { CameraView } from './components/CameraView';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { OnboardingModal } from './components/OnboardingModal';
import { DeveloperStats } from './components/DeveloperStats';
import type { DrawingMode } from './components/ModeSelector';
import { Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  // Experience Modes: 'painter' | 'spellcaster' | 'ironman'
  const [experienceMode, setExperienceMode] = useState<'painter' | 'spellcaster' | 'ironman'>('painter');
  
  // Iron Man Suit-up assembly progress (0.0 to 1.0)
  const [suitUpProgress, setSuitUpProgress] = useState(0);

  // UI settings states
  const [color, setColor] = useState('#06b6d4'); // Default cyan neon
  const [size, setSize] = useState(12);
  const [glowIntensity, setGlowIntensity] = useState(1.3);
  const [smoothing, setSmoothing] = useState(0.55);
  const [mode, setMode] = useState<DrawingMode>('draw');
  const [showVideoPreview, setShowVideoPreview] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [isTrailFadeEnabled, setIsTrailFadeEnabled] = useState(false);
  const [spawnParticles, setSpawnParticles] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);

  // Canvas and video elements refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Interaction thresholds refs
  const clearTimerRef = useRef<number | null>(null);
  const wasDrawingRef = useRef(false);

  // Decide active tracking model based on experience mode
  const trackingMode = useMemo(() => {
    return experienceMode === 'ironman' ? 'pose' : 'hands';
  }, [experienceMode]);

  // Initialize MediaPipe tracking engine (dual hands or full body pose)
  const {
    isModelLoading,
    isCameraActive,
    landmarks,
    poseLandmarks,
    gesture,
    detectedHands,
    fps,
    latencyMs,
    error,
    startCamera,
    stopCamera,
  } = useHandTracking(videoRef, trackingMode);

  // Sync state coordinates to refs for 60fps canvas overlays
  const landmarksRef = useRef<any>(null);
  const detectedHandsRef = useRef<DetectedHand[]>([]);
  const poseLandmarksRef = useRef<any[] | null>(null);

  useEffect(() => {
    landmarksRef.current = landmarks;
    detectedHandsRef.current = detectedHands;
    poseLandmarksRef.current = poseLandmarks;
  }, [landmarks, detectedHands, poseLandmarks]);

  // Handle Iron Man Suit Up piece-by-piece assembly animation
  useEffect(() => {
    if (experienceMode === 'ironman') {
      setSuitUpProgress(0);
      let start: number | null = null;
      let animationFrameId: number;

      const animateSuitUp = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(1.0, elapsed / 2800); // 2.8 seconds nanotech assembly
        setSuitUpProgress(progress);

        if (progress < 1.0) {
          animationFrameId = requestAnimationFrame(animateSuitUp);
        }
      };
      animationFrameId = requestAnimationFrame(animateSuitUp);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    } else {
      setSuitUpProgress(0);
    }
  }, [experienceMode]);

  // Adjust UI colors/modes based on selected workspace mode
  useEffect(() => {
    if (experienceMode === 'spellcaster') {
      setColor('#f59e0b'); // Gold
      setMode('draw');
    } else if (experienceMode === 'ironman') {
      setColor('#06b6d4'); // Repulsor Cyan
      setMode('pointer'); // Default to repulsor aim, disabling canvas drawing
    } else {
      setColor('#06b6d4'); // Cyan default
    }
  }, [experienceMode]);

  // Decide if we are drawing or erasing based on hand gestures
  const activeMode = useMemo(() => {
    if (experienceMode === 'spellcaster') return 'draw';
    if (experienceMode === 'ironman') return 'pointer';
    if (gesture === 'eraser' && mode === 'draw') {
      return 'eraser';
    }
    return mode;
  }, [gesture, mode, experienceMode]);

  // Setup drawing hook
  const {
    startNewStroke,
    addDrawingPoint,
    endCurrentStroke,
    clearCanvas,
    undoLastStroke,
    exportAsPNG,
    startVideoRecording,
    stopVideoRecording,
    isRecording,
    recordingDuration,
    particlesCount,
    setClearGestureProgress,
    updateCursor,
  } = useSmoothDrawing(canvasRef, feedbackCanvasRef, {
    color,
    size,
    glowIntensity,
    smoothing,
    mode: activeMode,
    isTrailFadeEnabled,
    spawnParticles,
    landmarksRef,
    showLandmarks,
    detectedHandsRef,
    poseLandmarksRef,
    experienceMode,
    suitUpProgress,
  });

  // Combined gesture/system telemetry output for HUD
  const statsGestureString = useMemo(() => {
    if (experienceMode === 'ironman') {
      if (isModelLoading) return 'BOOTING SYSTEMS...';
      return poseLandmarks ? 'SYSTEM ONLINE' : 'SCANNING BODY...';
    }

    if (detectedHands.length === 0) return '—';
    if (detectedHands.length === 1) {
      const h = detectedHands[0];
      return `${h.handedness === 'Left' ? 'L' : 'R'}: ${h.gesture.toUpperCase()}`;
    }
    
    const leftHand = detectedHands.find(h => h.handedness === 'Left');
    const rightHand = detectedHands.find(h => h.handedness === 'Right');
    
    return `L:${leftHand ? leftHand.gesture.toUpperCase() : '—'} | R:${rightHand ? rightHand.gesture.toUpperCase() : '—'}`;
  }, [detectedHands, experienceMode, poseLandmarks, isModelLoading]);

  // Camera Toggle
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'c':
          clearCanvas();
          break;
        case 's':
          exportAsPNG(true);
          break;
        case 'e':
          if (experienceMode === 'painter') setMode('eraser');
          break;
        case 'd':
          if (experienceMode === 'painter') setMode('draw');
          break;
        case 'p':
          if (experienceMode === 'painter') setMode('pointer');
          break;
        case 'z':
          undoLastStroke();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearCanvas, exportAsPNG, undoLastStroke, experienceMode]);

  // Frame Orchestration Effect
  useEffect(() => {
    if (!isCameraActive || experienceMode === 'ironman') {
      if (wasDrawingRef.current) {
        endCurrentStroke();
        wasDrawingRef.current = false;
      }
      return;
    }

    if (detectedHands.length === 0) {
      if (wasDrawingRef.current) {
        endCurrentStroke();
        wasDrawingRef.current = false;
      }
      
      if (clearTimerRef.current !== null) {
        clearTimerRef.current = null;
        setClearGestureProgress(0);
      }
      return;
    }

    const primaryHand = detectedHands[0];
    const primaryLandmarks = primaryHand.landmarks;
    const primaryGesture = primaryHand.gesture;

    // 1. Process 2-second hold-to-clear gesture
    const isAnyHandClearing = detectedHands.some(h => h.gesture === 'clear-pending');
    if (isAnyHandClearing) {
      if (clearTimerRef.current === null) {
        clearTimerRef.current = performance.now();
      }
      const elapsed = (performance.now() - clearTimerRef.current) / 2000;
      setClearGestureProgress(Math.min(1, elapsed));
      
      if (elapsed >= 1) {
        clearCanvas();
        setClearGestureProgress(0);
        clearTimerRef.current = null;
      }
    } else {
      if (clearTimerRef.current !== null) {
        clearTimerRef.current = null;
        setClearGestureProgress(0);
      }
    }

    // 2. Control active drawings
    const isCurrentlyDrawing =
      (experienceMode === 'painter' || experienceMode === 'spellcaster') && (
        (activeMode === 'draw' && primaryGesture === 'draw') ||
        (activeMode === 'eraser' && (primaryGesture === 'draw' || primaryGesture === 'eraser'))
      );

    if (isCurrentlyDrawing) {
      if (!wasDrawingRef.current) {
        startNewStroke();
        wasDrawingRef.current = true;
      }
      addDrawingPoint(primaryLandmarks[8]);
    } else {
      if (wasDrawingRef.current) {
        endCurrentStroke();
        wasDrawingRef.current = false;
      }
      updateCursor(primaryLandmarks[8]);
    }
  }, [
    isCameraActive,
    detectedHands,
    activeMode,
    experienceMode,
    addDrawingPoint,
    updateCursor,
    startNewStroke,
    endCurrentStroke,
    clearCanvas,
    setClearGestureProgress,
  ]);

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    if (!isCameraActive && !isModelLoading && !error) {
      startCamera();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col font-sans">
      {/* Background Cam and Canvas Viewport */}
      <div className="absolute inset-0 w-full h-full z-0">
        <CameraView
          videoRef={videoRef}
          isCameraActive={isCameraActive}
          showVideoPreview={showVideoPreview}
          error={error}
          onRetry={startCamera}
        />
        
        <DrawingCanvas
          canvasRef={canvasRef}
          feedbackCanvasRef={feedbackCanvasRef}
        />
      </div>

      {/* Futuristic Immersive Header */}
      <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between p-4 glass-panel rounded-2xl md:top-6 md:left-6 md:right-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 border rounded-xl transition-all duration-300 ${
            experienceMode === 'ironman'
              ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              : experienceMode === 'spellcaster'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 glow-glow-cyan'
          }`}>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className={`text-lg md:text-xl font-black bg-clip-text text-transparent flex items-center gap-1.5 leading-none transition-all duration-500 ${
              experienceMode === 'ironman'
                ? 'bg-gradient-to-r from-red-500 to-amber-500 animate-pulse'
                : experienceMode === 'spellcaster'
                ? 'bg-gradient-to-r from-amber-400 to-red-400'
                : 'bg-gradient-to-r from-cyan-400 to-purple-400'
            }`}>
              {experienceMode === 'ironman' ? 'STARK HUD: IRON MAN' : 'Glow Finger Draw'}
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
              {experienceMode === 'ironman'
                ? 'Holographic Armor: Auto suit-up, raised palm repulsor lasers, thrusters'
                : experienceMode === 'spellcaster'
                ? 'Doctor Strange spells: Open palm mandalas, double index lightning, fists portal'
                : 'Draw glowing lines in the air using index finger gestures'}
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2">
          {!isCameraActive && (
            <button
              onClick={startCamera}
              disabled={isModelLoading}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/10 active:scale-95 transition-all"
            >
              {isModelLoading ? 'Loading Wasm...' : 'Connect Video'}
            </button>
          )}

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all hover:scale-105"
            title="Help / Tutorial"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Control Dashboard Overlay */}
      <main className="absolute bottom-4 right-4 z-30 w-full max-w-sm px-4 md:px-0 md:bottom-auto md:top-24 md:right-6">
        <ControlsPanel
          isCameraActive={isCameraActive}
          onToggleCamera={handleToggleCamera}
          showVideoPreview={showVideoPreview}
          onToggleVideoPreview={() => setShowVideoPreview(prev => !prev)}
          showLandmarks={showLandmarks}
          onToggleLandmarks={() => setShowLandmarks(prev => !prev)}
          experienceMode={experienceMode}
          onExperienceModeChange={setExperienceMode}
          mode={mode}
          onModeChange={setMode}
          color={color}
          onColorChange={setColor}
          size={size}
          onSizeChange={setSize}
          glowIntensity={glowIntensity}
          onGlowChange={setGlowIntensity}
          smoothing={smoothing}
          onSmoothingChange={setSmoothing}
          isTrailFadeEnabled={isTrailFadeEnabled}
          onToggleTrailFade={() => setIsTrailFadeEnabled(prev => !prev)}
          spawnParticles={spawnParticles}
          onToggleParticles={() => setSpawnParticles(prev => !prev)}
          onClear={clearCanvas}
          onUndo={undoLastStroke}
          onExportPNG={exportAsPNG}
          onStartRecording={startVideoRecording}
          onStopRecording={stopVideoRecording}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          onShowTutorial={() => setIsOnboardingOpen(true)}
        />
      </main>

      {/* Engine Telemetry HUD */}
      <DeveloperStats
        fps={fps}
        latencyMs={latencyMs}
        particlesCount={particlesCount}
        isModelLoading={isModelLoading}
        isCameraActive={isCameraActive}
        gesture={statsGestureString}
      />

      {/* Onboarding / Tutorial Screen */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
      />
    </div>
  );
}
