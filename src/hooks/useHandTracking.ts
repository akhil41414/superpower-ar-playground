import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import { detectHandGesture } from '../utils/gestureDetection';
import type { Landmark, GestureType } from '../utils/gestureDetection';

export interface DetectedHand {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
  gesture: GestureType;
  gestureDetails: {
    thumbUp: boolean;
    indexUp: boolean;
    middleUp: boolean;
    ringUp: boolean;
    pinkyUp: boolean;
  };
}

export interface HandTrackingResult {
  isModelLoading: boolean;
  isCameraActive: boolean;
  landmarks: Landmark[] | null;
  poseLandmarks: any[] | null;
  gesture: GestureType;
  gestureDetails: {
    thumbUp: boolean;
    indexUp: boolean;
    middleUp: boolean;
    ringUp: boolean;
    pinkyUp: boolean;
  };
  detectedHands: DetectedHand[];
  fps: number;
  latencyMs: number;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  trackingMode: 'hands' | 'pose' = 'hands'
): HandTrackingResult {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [poseLandmarks, setPoseLandmarks] = useState<any[] | null>(null);
  const [detectedHands, setDetectedHands] = useState<DetectedHand[]>([]);
  const [gesture, setGesture] = useState<GestureType>('none');
  const [gestureDetails, setGestureDetails] = useState({
    thumbUp: false,
    indexUp: false,
    middleUp: false,
    ringUp: false,
    pinkyUp: false,
  });
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const isPoseLoadingRef = useRef<boolean>(false);
  
  const activeStreamRef = useRef<MediaStream | null>(null);
  const frameRequestIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(0);

  // Initialize MediaPipe Hand Landmarker model
  useEffect(() => {
    let active = true;

    async function initModel() {
      try {
        setIsModelLoading(true);
        // Load WebAssembly files from CDN
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        if (!active) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2, // Enable dual-hand tracking for spells
        });

        if (!active) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsModelLoading(false);
      } catch (err) {
        console.error('Failed to initialize HandLandmarker:', err);
        if (active) {
          setError('Failed to load finger tracking engine. Check your connection.');
          setIsModelLoading(false);
        }
      }
    }

    initModel();

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  // Lazy-load PoseLandmarker model on-demand when switching to Pose tracking mode
  useEffect(() => {
    if (trackingMode === 'pose' && !poseLandmarkerRef.current && !isPoseLoadingRef.current) {
      let active = true;
      isPoseLoadingRef.current = true;
      setIsModelLoading(true);

      async function initPoseModel() {
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
          );

          if (!active) return;

          const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
          });

          if (!active) {
            poseLandmarker.close();
            return;
          }

          poseLandmarkerRef.current = poseLandmarker;
          setIsModelLoading(false);
        } catch (err) {
          console.error('Failed to initialize PoseLandmarker:', err);
          if (active) {
            setError('Failed to load full body tracking engine.');
            setIsModelLoading(false);
          }
        }
      }

      initPoseModel();

      return () => {
        active = false;
      };
    } else if (trackingMode === 'pose' && poseLandmarkerRef.current) {
      setIsModelLoading(false);
    } else if (trackingMode === 'hands' && landmarkerRef.current) {
      setIsModelLoading(false);
    }
  }, [trackingMode]);

  // Frame processing loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isCameraActive) {
      frameRequestIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Toggle active processing model based on mode
    if (trackingMode === 'hands') {
      const landmarker = landmarkerRef.current;
      if (!landmarker) {
        frameRequestIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const startTime = performance.now();
        const results = landmarker.detectForVideo(video, startTime);
        const endTime = performance.now();
        setLatencyMs(Math.round(endTime - startTime));

        // Compute FPS
        fpsFrameCountRef.current++;
        const now = performance.now();
        if (now - fpsLastTimeRef.current >= 1000) {
          setFps(Math.round((fpsFrameCountRef.current * 1000) / (now - fpsLastTimeRef.current)));
          fpsFrameCountRef.current = 0;
          fpsLastTimeRef.current = now;
        }

        // Process hand detection results
        const tempDetectedHands: DetectedHand[] = [];
        if (results && results.landmarks && results.landmarks.length > 0) {
          for (let h = 0; h < results.landmarks.length; h++) {
            const handLandmarks = results.landmarks[h] as Landmark[];
            const rawHandedness = results.handednesses?.[h]?.[0]?.categoryName || 'Right';
            const handedness = rawHandedness === 'Left' ? 'Right' : 'Left';
            
            const { gesture: detectedGesture, details } = detectHandGesture(handLandmarks);
            
            tempDetectedHands.push({
              landmarks: handLandmarks,
              handedness,
              gesture: detectedGesture,
              gestureDetails: details,
            });
          }

          setDetectedHands(tempDetectedHands);
          setLandmarks(tempDetectedHands[0].landmarks);
          setGesture(tempDetectedHands[0].gesture);
          setGestureDetails(tempDetectedHands[0].gestureDetails);
        } else {
          setDetectedHands([]);
          setLandmarks(null);
          setGesture('none');
          setGestureDetails({
            thumbUp: false,
            indexUp: false,
            middleUp: false,
            ringUp: false,
            pinkyUp: false,
          });
        }
      }
    } else if (trackingMode === 'pose') {
      const poseLandmarker = poseLandmarkerRef.current;
      if (!poseLandmarker) {
        frameRequestIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const startTime = performance.now();
        const results = poseLandmarker.detectForVideo(video, startTime);
        const endTime = performance.now();
        setLatencyMs(Math.round(endTime - startTime));

        // Compute FPS
        fpsFrameCountRef.current++;
        const now = performance.now();
        if (now - fpsLastTimeRef.current >= 1000) {
          setFps(Math.round((fpsFrameCountRef.current * 1000) / (now - fpsLastTimeRef.current)));
          fpsFrameCountRef.current = 0;
          fpsLastTimeRef.current = now;
        }

        // Process body pose detection results
        if (results && results.landmarks && results.landmarks.length > 0) {
          setPoseLandmarks(results.landmarks[0] as Landmark[]);
        } else {
          setPoseLandmarks(null);
        }
      }
    }

    frameRequestIdRef.current = requestAnimationFrame(processFrame);
  }, [isCameraActive, videoRef, trackingMode]);

  // Start the processing loop when camera turns active
  useEffect(() => {
    if (isCameraActive) {
      fpsLastTimeRef.current = performance.now();
      fpsFrameCountRef.current = 0;
      frameRequestIdRef.current = requestAnimationFrame(processFrame);
    } else {
      if (frameRequestIdRef.current) {
        cancelAnimationFrame(frameRequestIdRef.current);
        frameRequestIdRef.current = null;
      }
      setLandmarks(null);
      setPoseLandmarks(null);
      setGesture('none');
    }

    return () => {
      if (frameRequestIdRef.current) {
        cancelAnimationFrame(frameRequestIdRef.current);
      }
    };
  }, [isCameraActive, processFrame]);

  // Start Webcam Stream
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (activeStreamRef.current) {
        return;
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', () => {
          setIsCameraActive(true);
        });
      }
      activeStreamRef.current = stream;
    } catch (err) {
      console.error('Webcam access error:', err);
      setError('Camera access denied. Please grant permissions and reload.');
    }
  }, [videoRef]);

  // Stop Webcam Stream
  const stopCamera = useCallback(() => {
    if (frameRequestIdRef.current) {
      cancelAnimationFrame(frameRequestIdRef.current);
      frameRequestIdRef.current = null;
    }

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setLandmarks(null);
    setPoseLandmarks(null);
    setGesture('none');
  }, [videoRef]);

  // Close models on component unmount
  useEffect(() => {
    return () => {
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  return {
    isModelLoading,
    isCameraActive,
    landmarks,
    poseLandmarks,
    gesture,
    gestureDetails,
    detectedHands,
    fps,
    latencyMs,
    error,
    startCamera,
    stopCamera,
  };
}
