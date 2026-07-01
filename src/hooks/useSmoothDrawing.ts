import { useCallback, useRef, useState, useEffect } from 'react';
import {
  drawGlowStroke,
  drawParticles,
  drawDoctorStrangeMandala,
  drawCracklingBeam,
  drawPortalVortex,
  drawFusionMandala,
  drawIronManSuit,
  drawRepulsorBlast,
} from '../utils/canvasUtils';
import type { Point, Particle } from '../utils/canvasUtils';
import type { Landmark } from '../utils/gestureDetection';
import type { DetectedHand } from './useHandTracking';

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  glow: number;
  mode: 'draw' | 'eraser';
}

interface SmoothDrawingOptions {
  color: string;
  size: number;
  glowIntensity: number;
  smoothing: number; // between 0 (none) and 0.95 (heavy)
  mode: 'draw' | 'eraser' | 'pointer';
  isTrailFadeEnabled: boolean;
  spawnParticles: boolean;
  landmarksRef: React.RefObject<Landmark[] | null>;
  showLandmarks: boolean;
  detectedHandsRef: React.RefObject<DetectedHand[]>;
  poseLandmarksRef: React.RefObject<any[] | null>;
  experienceMode: 'painter' | 'spellcaster' | 'ironman';
  suitUpProgress: number;
}

export interface SmoothDrawingResult {
  startNewStroke: () => void;
  addDrawingPoint: (landmark: Landmark) => void;
  endCurrentStroke: () => void;
  clearCanvas: () => void;
  undoLastStroke: () => void;
  exportAsPNG: (transparent?: boolean) => void;
  startVideoRecording: () => void;
  stopVideoRecording: () => void;
  isRecording: boolean;
  recordingDuration: number;
  particlesCount: number;
  cursorPos: Point | null;
  clearGestureProgress: number; // 0 to 1
  setClearGestureProgress: React.Dispatch<React.SetStateAction<number>>;
  updateCursor: (landmark: Landmark) => void;
}

export function useSmoothDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  feedbackCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: SmoothDrawingOptions
): SmoothDrawingResult {
  const {
    color,
    size,
    glowIntensity,
    smoothing,
    mode,
    isTrailFadeEnabled,
    spawnParticles,
    landmarksRef,
    showLandmarks,
    detectedHandsRef,
    poseLandmarksRef,
    experienceMode,
    suitUpProgress,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [clearGestureProgress, setClearGestureProgress] = useState(0);

  // Refs for drawing state
  const completedStrokesRef = useRef<Stroke[]>([]);
  const activePointsRef = useRef<Point[]>([]);
  const lastSmoothedPtRef = useRef<Point | null>(null);
  const lastRawPtRef = useRef<Point | null>(null);
  const activeParticlesCountRef = useRef(0);
  const suitUpProgressRef = useRef(suitUpProgress);

  useEffect(() => {
    suitUpProgressRef.current = suitUpProgress;
  }, [suitUpProgress]);

  // MAX FPS Performance Optimization: Zero-Allocation Particle Pool
  const MAX_POOL_PARTICLES = 400;
  const particlePoolRef = useRef<Particle[]>([]);
  
  // Pre-allocate the particle array once
  if (particlePoolRef.current.length === 0) {
    for (let i = 0; i < MAX_POOL_PARTICLES; i++) {
      particlePoolRef.current.push({
        id: i,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '',
        size: 0,
        alpha: 0,
        life: 0, // 0 means inactive
        decay: 0,
        type: 'spark',
      });
    }
  }

  // Recycles inactive particles from the pre-allocated pool
  const spawnParticle = useCallback((
    x: number,
    y: number,
    vx: number,
    vy: number,
    pColor: string,
    pSize: number,
    decay: number,
    type: 'spark' | 'portal' | 'fire' | 'pink-fire'
  ) => {
    // Find the first inactive particle (life <= 0)
    const p = particlePoolRef.current.find(pt => pt.life <= 0);
    if (p) {
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.color = pColor;
      p.size = pSize;
      p.alpha = 1.0;
      p.life = 1.0;
      p.decay = decay;
      p.type = type;
    }
  }, []);

  // Performance Optimization: Offscreen canvas cache for completed strokes
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Spellcaster rotating angles
  const mandalaRotationRef = useRef<number>(0);
  const portalRotationRef = useRef<number>(0);
  const portalProgressRef = useRef<number>(0); // 0 to 1 charge
  
  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // Animation frame ref for loop
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize and resize canvases
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const feedbackCanvas = feedbackCanvasRef.current;
    if (!canvas || !feedbackCanvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;

    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    feedbackCanvas.style.width = `${width}px`;
    feedbackCanvas.style.height = `${height}px`;

    // Capping device pixel ratio to 1.5 to boost GPU fillrate and FPS on high-res displays
    const scale = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = width * scale;
    canvas.height = height * scale;
    feedbackCanvas.width = width * scale;
    feedbackCanvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    const fCtx = feedbackCanvas.getContext('2d');
    if (ctx) ctx.scale(scale, scale);
    if (fCtx) fCtx.scale(scale, scale);

    // Setup offscreen canvas cache
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    offscreenCanvasRef.current.width = width * scale;
    offscreenCanvasRef.current.height = height * scale;
    const oCtx = offscreenCanvasRef.current.getContext('2d');
    if (oCtx) oCtx.scale(scale, scale);

    // Redraw cache
    redrawOffscreen();
    triggerRedraw();
  }, [canvasRef, feedbackCanvasRef]);

  // Redraws the offscreen cache canvas containing permanent drawings
  const redrawOffscreen = useCallback(() => {
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen) return;

    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    const scale = Math.min(1.5, window.devicePixelRatio || 1);
    const width = offscreen.width / scale;
    const height = offscreen.height / scale;

    oCtx.clearRect(0, 0, width, height);

    // Render all completed strokes
    completedStrokesRef.current.forEach(stroke => {
      drawGlowStroke(
        oCtx,
        stroke.points,
        stroke.color,
        stroke.size,
        stroke.glow,
        stroke.mode === 'eraser'
      );
    });
  }, []);

  // Composites the cached offscreen canvas and draws active trails
  const triggerRedraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.min(1.5, window.devicePixelRatio || 1);
    const width = canvas.width / scale;
    const height = canvas.height / scale;

    ctx.clearRect(0, 0, width, height);

    if (isTrailFadeEnabled) return;

    // 1. Draw cached completed strokes (Instant Blit)
    if (offscreenCanvasRef.current) {
      ctx.drawImage(offscreenCanvasRef.current, 0, 0, width, height);
    }

    // 2. Draw active stroke with shadowBlur
    if (activePointsRef.current.length > 0) {
      drawGlowStroke(
        ctx,
        activePointsRef.current,
        color,
        size,
        glowIntensity,
        mode === 'eraser'
      );
    }
  }, [canvasRef, color, size, glowIntensity, mode, isTrailFadeEnabled]);

  // Start a new stroke path
  const startNewStroke = useCallback(() => {
    activePointsRef.current = [];
    lastSmoothedPtRef.current = null;
    lastRawPtRef.current = null;
  }, []);

  // Process and draw new tracking point
  const addDrawingPoint = useCallback((landmark: Landmark) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = Math.min(1.5, window.devicePixelRatio || 1);
    const width = canvas.width / scale;
    const height = canvas.height / scale;

    const rawX = (1 - landmark.x) * width;
    const rawY = landmark.y * height;
    const rawPoint = { x: rawX, y: rawY };

    if (lastRawPtRef.current) {
      const distance = Math.hypot(rawPoint.x - lastRawPtRef.current.x, rawPoint.y - lastRawPtRef.current.y);
      if (distance > 150) {
        endCurrentStroke();
        startNewStroke();
        return;
      }
    }

    let smoothedPt = rawPoint;
    if (lastSmoothedPtRef.current) {
      smoothedPt = {
        x: lastSmoothedPtRef.current.x * smoothing + rawPoint.x * (1 - smoothing),
        y: lastSmoothedPtRef.current.y * smoothing + rawPoint.y * (1 - smoothing),
      };
    }

    activePointsRef.current.push(smoothedPt);
    lastSmoothedPtRef.current = smoothedPt;
    lastRawPtRef.current = rawPoint;
    setCursorPos(smoothedPt);

    if (mode === 'draw' && spawnParticles) {
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 0.3;
        const decay = 0.02 + Math.random() * 0.025;
        
        spawnParticle(
          smoothedPt.x,
          smoothedPt.y,
          vx,
          vy,
          color,
          2 + Math.random() * 3,
          decay,
          'spark'
        );
      }
    }

    if (isTrailFadeEnabled) {
      const ctx = canvas.getContext('2d');
      if (ctx && activePointsRef.current.length >= 2) {
        const pointsLen = activePointsRef.current.length;
        const segment = [
          activePointsRef.current[pointsLen - 2],
          activePointsRef.current[pointsLen - 1],
        ];
        drawGlowStroke(ctx, segment, color, size, glowIntensity, mode === 'eraser');
      }
    } else {
      triggerRedraw();
    }
  }, [canvasRef, smoothing, mode, color, size, glowIntensity, isTrailFadeEnabled, spawnParticles, spawnParticle, triggerRedraw]);

  // Updates the smoothed cursor coordinates without drawing lines
  const updateCursor = useCallback((landmark: Landmark) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = Math.min(1.5, window.devicePixelRatio || 1);
    const width = canvas.width / scale;
    const height = canvas.height / scale;

    const rawX = (1 - landmark.x) * width;
    const rawY = landmark.y * height;
    const rawPoint = { x: rawX, y: rawY };

    let smoothedPt = rawPoint;
    if (lastSmoothedPtRef.current) {
      smoothedPt = {
        x: lastSmoothedPtRef.current.x * smoothing + rawPoint.x * (1 - smoothing),
        y: lastSmoothedPtRef.current.y * smoothing + rawPoint.y * (1 - smoothing),
      };
    }

    lastSmoothedPtRef.current = smoothedPt;
    lastRawPtRef.current = rawPoint;
    setCursorPos(smoothedPt);
  }, [canvasRef, smoothing]);

  // Finish current stroke path
  const endCurrentStroke = useCallback(() => {
    if (activePointsRef.current.length > 0) {
      if (mode !== 'pointer') {
        completedStrokesRef.current.push({
          points: [...activePointsRef.current],
          color,
          size,
          glow: glowIntensity,
          mode: mode === 'eraser' ? 'eraser' : 'draw',
        });

        // Write directly to offscreen cache for future blits
        const offscreen = offscreenCanvasRef.current;
        if (offscreen) {
          const oCtx = offscreen.getContext('2d');
          if (oCtx) {
            drawGlowStroke(
              oCtx,
              activePointsRef.current,
              color,
              size,
              glowIntensity,
              mode === 'eraser'
            );
          }
        }
      }
      activePointsRef.current = [];
    }
    lastSmoothedPtRef.current = null;
    lastRawPtRef.current = null;
  }, [color, size, glowIntensity, mode]);

  // Clear drawings
  const clearCanvas = useCallback(() => {
    completedStrokesRef.current = [];
    activePointsRef.current = [];
    lastSmoothedPtRef.current = null;
    lastRawPtRef.current = null;
    portalProgressRef.current = 0;
    
    // Clear pool particles
    for (let i = 0; i < MAX_POOL_PARTICLES; i++) {
      particlePoolRef.current[i].life = 0;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const scale = Math.min(1.5, window.devicePixelRatio || 1);
        ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
      }
    }

    const offscreen = offscreenCanvasRef.current;
    if (offscreen) {
      const oCtx = offscreen.getContext('2d');
      if (oCtx) {
        const scale = Math.min(1.5, window.devicePixelRatio || 1);
        oCtx.clearRect(0, 0, offscreen.width / scale, offscreen.height / scale);
      }
    }
  }, [canvasRef]);

  // Undo last stroke
  const undoLastStroke = useCallback(() => {
    completedStrokesRef.current.pop();
    redrawOffscreen();
    triggerRedraw();
  }, [redrawOffscreen, triggerRedraw]);

  // Export as PNG
  const exportAsPNG = useCallback((transparent = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    if (!exportCtx) return;

    if (!transparent) {
      exportCtx.fillStyle = '#030308';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    // Blend offscreen cache
    if (offscreenCanvasRef.current) {
      exportCtx.drawImage(offscreenCanvasRef.current, 0, 0);
    }

    // Blend active stroke
    exportCtx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `glow-finger-drawing-${Date.now()}.png`;
    a.click();
  }, [canvasRef]);

  // Video Recording Logic
  const startVideoRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    recordedChunksRef.current = [];
    const stream = canvas.captureStream(30);

    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glow-finger-spellcast-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to start MediaRecorder:', e);
    }
  }, [canvasRef, isRecording]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  // MediaPipe hand skeleton connections index mapping
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [5, 9], [9, 10], [10, 11], [11, 12], // Middle
    [9, 13], [13, 14], [14, 15], [15, 16], // Ring
    [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
  ];

  // Feedback render loop (animates spells, HUD graphics, particles at 60fps)
  useEffect(() => {
    const feedbackCanvas = feedbackCanvasRef.current;
    const canvas = canvasRef.current;

    const renderFeedbackLoop = () => {
      mandalaRotationRef.current += 0.012;
      portalRotationRef.current += 0.022;

      // 1. In-place Particle Pool Updates (ZERO memory allocations!)
      let activeParticlesCount = 0;
      for (let i = 0; i < MAX_POOL_PARTICLES; i++) {
        const p = particlePoolRef.current[i];
        if (p.life > 0) {
          p.x += p.vx;
          p.y += p.vy;
          
          if (p.type === 'fire') {
            p.vy -= 0.12; // Flames draft upwards
            p.vx *= 0.97; // Spread friction
          } else {
            p.vy += 0.06; // Gravity pulls sparks
          }
          
          p.alpha = Math.max(0, p.life);
          p.life -= p.decay;
          activeParticlesCount++;
        }
      }
      activeParticlesCountRef.current = activeParticlesCount;

      if (feedbackCanvas) {
        const fCtx = feedbackCanvas.getContext('2d');
        if (fCtx) {
          const scale = Math.min(1.5, window.devicePixelRatio || 1);
          const width = feedbackCanvas.width / scale;
          const height = feedbackCanvas.height / scale;

          fCtx.clearRect(0, 0, width, height);

          // 2. Draw pooled particles
          drawParticles(fCtx, particlePoolRef.current);

          const hands = detectedHandsRef.current;

          // 3. Draw hand skeleton overlay
          if (showLandmarks && hands && hands.length > 0) {
            fCtx.save();
            fCtx.shadowBlur = 0;
            fCtx.strokeStyle = 'rgba(6, 182, 212, 0.35)'; // Cyan bones
            fCtx.lineWidth = 2.5;
            fCtx.lineCap = 'round';
            fCtx.lineJoin = 'round';
            
            hands.forEach(hand => {
              const lm = hand.landmarks;
              if (lm.length < 21) return;

              HAND_CONNECTIONS.forEach(([p1, p2]) => {
                const x1 = (1 - lm[p1].x) * width;
                const y1 = lm[p1].y * height;
                const x2 = (1 - lm[p2].x) * width;
                const y2 = lm[p2].y * height;
                
                fCtx.beginPath();
                fCtx.moveTo(x1, y1);
                fCtx.lineTo(x2, y2);
                fCtx.stroke();
              });

              fCtx.fillStyle = '#ffffff';
              fCtx.strokeStyle = hand.handedness === 'Left' ? '#a855f7' : '#ec4899';
              fCtx.lineWidth = 1.5;
              
              lm.forEach((pt, index) => {
                const x = (1 - pt.x) * width;
                const y = pt.y * height;
                
                fCtx.beginPath();
                const isTip = index % 4 === 0 && index > 0;
                fCtx.arc(x, y, isTip ? (index === 8 ? 6 : 5) : 3, 0, Math.PI * 2);
                
                if (index === 8) {
                  fCtx.save();
                  fCtx.shadowBlur = 10;
                  fCtx.shadowColor = '#06b6d4';
                  fCtx.fillStyle = '#22d3ee';
                  fCtx.fill();
                  fCtx.restore();
                } else {
                  fCtx.fill();
                }
                fCtx.stroke();
              });
            });
            fCtx.restore();
          }

          // 4. Spellcaster Mode Spells
          if (experienceMode === 'spellcaster' && hands && hands.length > 0) {
            let isPinkBlastActive = false;

            // A. Ultimate Pink Flame Blaster: Two hands conjoined (dist < 65px)
            if (hands.length === 2) {
              const lm0 = hands[0].landmarks[9]; // Palm center hand 1
              const lm1 = hands[1].landmarks[9]; // Palm center hand 2
              
              const x1 = (1 - lm0.x) * width;
              const y1 = lm0.y * height;
              const x2 = (1 - lm1.x) * width;
              const y2 = lm1.y * height;
              
              const distance = Math.hypot(x2 - x1, y2 - y1);
              
              if (distance < 65) {
                isPinkBlastActive = true;
                
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                
                // Pointing Vector (averaged across both hands)
                const h0 = hands[0].landmarks;
                const h1 = hands[1].landmarks;
                
                const idxDx0 = h0[8].x - h0[5].x;
                const idxDy0 = h0[8].y - h0[5].y;
                const pkyDx0 = h0[20].x - h0[17].x;
                const pkyDy0 = h0[20].y - h0[17].y;
                
                const idxDx1 = h1[8].x - h1[5].x;
                const idxDy1 = h1[8].y - h1[5].y;
                const pkyDx1 = h1[20].x - h1[17].x;
                const pkyDy1 = h1[20].y - h1[17].y;
                
                const dirX = (idxDx0 + pkyDx0 + idxDx1 + pkyDx1) / 2;
                const dirY = (idxDy0 + pkyDy0 + idxDy1 + pkyDy1) / 2;
                const len = Math.hypot(dirX, dirY) || 1;
                
                const vxBase = -(dirX / len);
                const vyBase = (dirY / len);
                
                // Spawn dense stream of pink fire particles (Charmander blast!)
                const flameDensity = 10;
                for (let i = 0; i < flameDensity; i++) {
                  const spread = (Math.random() - 0.5) * 0.45; // ~26 deg spread cone
                  const cos = Math.cos(spread);
                  const sin = Math.sin(spread);
                  
                  const vx = (vxBase * cos - vyBase * sin) * (7 + Math.random() * 8);
                  const vy = (vxBase * sin + vyBase * cos) * (7 + Math.random() * 8);
                  const decay = 0.012 + Math.random() * 0.016;

                  spawnParticle(mx, my, vx, vy, '#ec4899', 4.5 + Math.random() * 6.0, decay, 'pink-fire');
                }
                
                // Draw white-pink hot charging core
                fCtx.save();
                fCtx.beginPath();
                fCtx.arc(mx, my, 22, 0, Math.PI * 2);
                fCtx.fillStyle = 'rgba(236, 72, 153, 0.25)';
                fCtx.strokeStyle = '#f472b6';
                fCtx.lineWidth = 3;
                fCtx.shadowBlur = 25;
                fCtx.shadowColor = '#ec4899';
                fCtx.fill();
                fCtx.stroke();
                fCtx.restore();
              }
            }

            // Standard spells are only processed when the Ultimate Pink Blast is NOT active
            if (!isPinkBlastActive) {
              // B. Dual Hand Shield Fusion & Pinch-to-scale Zoom
              const openPalmHands = hands.filter(h => h.gesture === 'pause' || h.gesture === 'clear-pending');
              let shieldFused = false;

              if (openPalmHands.length === 2) {
                shieldFused = true;
                const lm1 = openPalmHands[0].landmarks[9];
                const lm2 = openPalmHands[1].landmarks[9];
                
                const x1 = (1 - lm1.x) * width;
                const y1 = lm1.y * height;
                const x2 = (1 - lm2.x) * width;
                const y2 = lm2.y * height;
                
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                
                const handDistance = Math.hypot(x2 - x1, y2 - y1);
                const fusionRadius = Math.max(60, handDistance * 0.65);
                
                drawFusionMandala(fCtx, mx, my, fusionRadius, mandalaRotationRef.current * 1.3, '#f59e0b');

                if (Math.random() < 0.4) {
                  const rimAngle = Math.random() * Math.PI * 2;
                  const rx = mx + Math.cos(rimAngle) * fusionRadius;
                  const ry = my + Math.sin(rimAngle) * fusionRadius;
                  spawnParticle(rx, ry, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#fb923c', 2 + Math.random() * 2, 0.03, 'spark');
                }
              }

              // C. Individual Palm Shields (Only rendered if shields are NOT fused)
              if (!shieldFused) {
                hands.forEach(hand => {
                  const lm = hand.landmarks;
                  if (lm.length < 21) return;

                  if (hand.gesture === 'pause' || hand.gesture === 'clear-pending') {
                    const palmCenter = lm[9];
                    const px = (1 - palmCenter.x) * width;
                    const py = palmCenter.y * height;
                    
                    const wrist = lm[0];
                    const baseDist = Math.hypot(wrist.x - palmCenter.x, wrist.y - palmCenter.y);
                    const shieldRadius = Math.max(50, baseDist * width * 1.5);
                    
                    drawDoctorStrangeMandala(
                      fCtx,
                      px,
                      py,
                      shieldRadius,
                      hand.handedness === 'Left' ? -mandalaRotationRef.current : mandalaRotationRef.current,
                      '#f59e0b'
                    );

                    if (Math.random() < 0.25) {
                      spawnParticle(px, py, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#f97316', 2 + Math.random() * 2, 0.03, 'spark');
                    }
                  }
                });
              }

              // D. Finger Flamethrower Attack: Raise hand in Rock-on gesture
              hands.forEach(hand => {
                if (hand.gesture === 'rock') {
                  const lm = hand.landmarks;
                  if (lm.length < 21) return;

                  const idxDx = lm[8].x - lm[5].x;
                  const idxDy = lm[8].y - lm[5].y;
                  const pkyDx = lm[20].x - lm[17].x;
                  const pkyDy = lm[20].y - lm[17].y;

                  const dirX = idxDx + pkyDx;
                  const dirY = idxDy + pkyDy;
                  const len = Math.hypot(dirX, dirY) || 1;

                  const vxBase = -(dirX / len);
                  const vyBase = (dirY / len);

                  const indexX = (1 - lm[8].x) * width;
                  const indexY = lm[8].y * height;
                  const pinkyX = (1 - lm[20].x) * width;
                  const pinkyY = lm[20].y * height;

                  const flameDensity = 5;
                  for (let i = 0; i < flameDensity; i++) {
                    const spread = (Math.random() - 0.5) * 0.42;
                    const cos = Math.cos(spread);
                    const sin = Math.sin(spread);
                    
                    const vx = (vxBase * cos - vyBase * sin) * (5 + Math.random() * 6);
                    const vy = (vxBase * sin + vyBase * cos) * (5 + Math.random() * 6);
                    const decay = 0.015 + Math.random() * 0.018;

                    spawnParticle(indexX, indexY, vx, vy, '#ea580c', 4 + Math.random() * 5, decay, 'fire');
                    spawnParticle(pinkyX, pinkyY, vx, vy, '#ea580c', 4 + Math.random() * 5, decay, 'fire');
                  }
                }
              });

              // E. Dual Hand Lightning Link: Both hands in "draw" gesture
              const drawingHands = hands.filter(h => h.gesture === 'draw');
              if (drawingHands.length === 2) {
                const lm1 = drawingHands[0].landmarks[8];
                const lm2 = drawingHands[1].landmarks[8];
                
                const x1 = (1 - lm1.x) * width;
                const y1 = lm1.y * height;
                const x2 = (1 - lm2.x) * width;
                const y2 = lm2.y * height;
                
                drawCracklingBeam(fCtx, x1, y1, x2, y2, '#a855f7');
                
                if (Math.random() < 0.4) {
                  const ratio = Math.random();
                  const bx = x1 + (x2 - x1) * ratio;
                  const by = y1 + (y2 - y1) * ratio;
                  spawnParticle(bx, by, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, '#c084fc', 2 + Math.random() * 2, 0.03, 'spark');
                }
              }

              // F. Portal Vortex Spawn: Bring two fists close together (between 65px and 120px)
              const fists = hands.filter(h => h.gesture === 'fist');
              if (fists.length === 2) {
                const p1 = fists[0].landmarks[9];
                const p2 = fists[1].landmarks[9];
                
                const x1 = (1 - p1.x) * width;
                const y1 = p1.y * height;
                const x2 = (1 - p2.x) * width;
                const y2 = p2.y * height;
                
                const distance = Math.hypot(x2 - x1, y2 - y1);
                
                if (distance >= 65 && distance < 120) {
                  portalProgressRef.current = Math.min(1.0, portalProgressRef.current + 0.01);
                  
                  const vx = (x1 + x2) / 2;
                  const vy = (y1 + y2) / 2;
                  const portalRadius = portalProgressRef.current * 140;
                  
                  drawPortalVortex(fCtx, vx, vy, portalRadius, portalRotationRef.current, '#ea580c');
                  
                  if (portalProgressRef.current > 0.2) {
                    const sparksCount = Math.floor(portalProgressRef.current * 3);
                    for (let i = 0; i < sparksCount; i++) {
                      const angle = Math.random() * Math.PI * 2;
                      const tangentAngle = angle + Math.PI / 2;
                      const speed = 2 + Math.random() * 4;
                      const pvx = Math.cos(tangentAngle) * speed + Math.cos(angle) * (0.5 + Math.random() * 1.5);
                      const pvy = Math.sin(tangentAngle) * speed + Math.sin(angle) * (0.5 + Math.random() * 1.5);
                      const decay = 0.012 + Math.random() * 0.015;
                      
                      spawnParticle(
                        vx + Math.cos(angle) * portalRadius,
                        vy + Math.sin(angle) * portalRadius,
                        pvx,
                        pvy,
                        '#f97316',
                        2.5 + Math.random() * 3,
                        decay,
                        'portal'
                      );
                    }
                  }
                } else {
                  portalProgressRef.current = Math.max(0, portalProgressRef.current - 0.02);
                }
              } else {
                portalProgressRef.current = Math.max(0, portalProgressRef.current - 0.02);
              }

              // Draw decaying portal vortex
              if (portalProgressRef.current > 0.01 && fists.length < 2) {
                const vx = width / 2;
                const vy = height / 2;
                const portalRadius = portalProgressRef.current * 140;
                drawPortalVortex(fCtx, vx, vy, portalRadius, portalRotationRef.current, '#ea580c');
                portalProgressRef.current = Math.max(0, portalProgressRef.current - 0.02);
              }
            }
          }

          // 4.5. Iron Man HUD Suit Up and Repulsor/Thruster Blast overlays
          if (experienceMode === 'ironman') {
            const poseLms = poseLandmarksRef.current;
            if (poseLms && poseLms.length >= 33) {
              // Draw the suit elements piece-by-piece
              drawIronManSuit(fCtx, poseLms, suitUpProgressRef.current, width, height);

              // A. Boot Thruster Flame Sparks (only when boots are attached: progress > 0.4)
              if (suitUpProgressRef.current > 0.4) {
                const akL = poseLms[27];
                const akR = poseLms[28];
                
                if (Math.random() < 0.4) {
                  if (akL && akL.visibility > 0.5) {
                    const aLX = (1 - akL.x) * width;
                    const aLY = akL.y * height;
                    spawnParticle(
                      aLX,
                      aLY + 12,
                      (Math.random() - 0.5) * 2.5,
                      3 + Math.random() * 4, // shoot down
                      '#ea580c',
                      3.5 + Math.random() * 3,
                      0.025,
                      'fire'
                    );
                  }
                  if (akR && akR.visibility > 0.5) {
                    const aRX = (1 - akR.x) * width;
                    const aRY = akR.y * height;
                    spawnParticle(
                      aRX,
                      aRY + 12,
                      (Math.random() - 0.5) * 2.5,
                      3 + Math.random() * 4, // shoot down
                      '#ea580c',
                      3.5 + Math.random() * 3,
                      0.025,
                      'fire'
                    );
                  }
                }
              }

              // B. Hand Repulsor Blast (only when gauntlets are attached: progress > 0.6)
              if (suitUpProgressRef.current > 0.6) {
                const elL = poseLms[13]; // Left elbow
                const wrL = poseLms[15]; // Left wrist
                const elR = poseLms[14]; // Right elbow
                const wrR = poseLms[16]; // Right wrist

                // Left hand repulsor blast (wrist is raised higher than elbow)
                if (wrL && elL && wrL.visibility > 0.55 && wrL.y < elL.y) {
                  const wLX = (1 - wrL.x) * width;
                  const wLY = wrL.y * height;
                  // target is index tip average: 17/19
                  const tx = (1 - (poseLms[17].x + poseLms[19].x) / 2) * width;
                  const ty = ((poseLms[17].y + poseLms[19].y) / 2) * height;

                  drawRepulsorBlast(fCtx, wLX, wLY, tx, ty, '#06b6d4', width, height);

                  // Repulsor blast sparks
                  for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 4 + Math.random() * 6;
                    spawnParticle(
                      wLX,
                      wLY,
                      Math.cos(angle) * speed,
                      Math.sin(angle) * speed,
                      '#22d3ee',
                      2 + Math.random() * 2,
                      0.03,
                      'spark'
                    );
                  }
                }

                // Right hand repulsor blast (wrist is raised higher than elbow)
                if (wrR && elR && wrR.visibility > 0.55 && wrR.y < elR.y) {
                  const wRX = (1 - wrR.x) * width;
                  const wRY = wrR.y * height;
                  const tx = (1 - (poseLms[18].x + poseLms[20].x) / 2) * width;
                  const ty = ((poseLms[18].y + poseLms[20].y) / 2) * height;

                  drawRepulsorBlast(fCtx, wRX, wRY, tx, ty, '#06b6d4', width, height);

                  // Repulsor blast sparks
                  for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 4 + Math.random() * 6;
                    spawnParticle(
                      wRX,
                      wRY,
                      Math.cos(angle) * speed,
                      Math.sin(angle) * speed,
                      '#22d3ee',
                      2 + Math.random() * 2,
                      0.03,
                      'spark'
                    );
                  }
                }
              }
            } else {
              // Draw "STAND BACK TO SUIT UP" instructions in simple English!
              fCtx.save();
              fCtx.font = 'bold 20px Outfit, Inter, sans-serif';
              fCtx.fillStyle = 'rgba(239, 68, 68, 0.85)'; // Stark Red
              fCtx.textAlign = 'center';
              fCtx.shadowBlur = 10;
              fCtx.shadowColor = '#dc2626';
              fCtx.fillText('STAND BACK FROM CAMERA TO SUIT UP', width / 2, height / 2);
              
              fCtx.font = '13px Outfit, Inter, sans-serif';
              fCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              fCtx.fillText('Camera must see your head, shoulders, and chest.', width / 2, height / 2 + 25);
              fCtx.restore();
            }
          }


          // 5. Standard Pointer Cursor Indicator
          const activeCasters = hands.some(h => h.gesture === 'pause' || h.gesture === 'clear-pending' || h.gesture === 'fist' || h.gesture === 'rock');
          if ((experienceMode !== 'spellcaster' || !activeCasters) && cursorPos) {
            fCtx.save();
            fCtx.beginPath();
            
            if (mode === 'eraser') {
              fCtx.arc(cursorPos.x, cursorPos.y, size * 1.25, 0, Math.PI * 2);
              fCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
              fCtx.lineWidth = 2;
              fCtx.stroke();
              
              fCtx.beginPath();
              fCtx.moveTo(cursorPos.x - 5, cursorPos.y);
              fCtx.lineTo(cursorPos.x + 5, cursorPos.y);
              fCtx.moveTo(cursorPos.x, cursorPos.y - 5);
              fCtx.lineTo(cursorPos.x, cursorPos.y + 5);
              fCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
              fCtx.lineWidth = 1;
              fCtx.stroke();
            } else {
              fCtx.arc(cursorPos.x, cursorPos.y, Math.max(8, size * 0.5), 0, Math.PI * 2);
              fCtx.fillStyle = color;
              fCtx.shadowBlur = 15;
              fCtx.shadowColor = color;
              fCtx.fill();

              fCtx.beginPath();
              fCtx.arc(cursorPos.x, cursorPos.y, Math.max(16, size), 0, Math.PI * 2);
              fCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              fCtx.lineWidth = 1.5;
              fCtx.shadowBlur = 0;
              fCtx.stroke();
            }
            fCtx.restore();
          }

          // 6. Draw visual timer for the Clear Gesture (if progress is growing)
          if (clearGestureProgress > 0 && cursorPos) {
            fCtx.save();
            fCtx.beginPath();
            fCtx.arc(cursorPos.x, cursorPos.y, 35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clearGestureProgress);
            fCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red clearing progress ring
            fCtx.lineWidth = 4;
            fCtx.lineCap = 'round';
            fCtx.stroke();
            
            fCtx.font = '10px Outfit, Inter, sans-serif';
            fCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            fCtx.textAlign = 'center';
            fCtx.fillText('CLEARING...', cursorPos.x, cursorPos.y - 45);
            fCtx.restore();
          }
        }
      }

      // If trail fade is active, fade out the main canvas over time
      if (isTrailFadeEnabled && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.min(1.5, window.devicePixelRatio || 1);
          const w = canvas.width / scale;
          const h = canvas.height / scale;

          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(renderFeedbackLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderFeedbackLoop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [feedbackCanvasRef, canvasRef, cursorPos, color, size, mode, clearGestureProgress, isTrailFadeEnabled, showLandmarks, landmarksRef, detectedHandsRef, experienceMode, spawnParticle]);

  // Window resize observer
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  return {
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
    particlesCount: activeParticlesCountRef.current,
    cursorPos,
    clearGestureProgress,
    setClearGestureProgress,
    updateCursor,
  };
}
