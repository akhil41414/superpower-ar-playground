export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType = 'draw' | 'eraser' | 'pointer' | 'pause' | 'clear-pending' | 'fist' | 'rock' | 'none';

/**
 * Detects the current hand gesture based on 3D landmarks
 * @param landmarks MediaPipe hand landmarks (21 points)
 * @returns Detected GestureType
 */
export function detectHandGesture(landmarks: Landmark[]): {
  gesture: GestureType;
  details: {
    thumbUp: boolean;
    indexUp: boolean;
    middleUp: boolean;
    ringUp: boolean;
    pinkyUp: boolean;
  };
} {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'none',
      details: { thumbUp: false, indexUp: false, middleUp: false, ringUp: false, pinkyUp: false },
    };
  }

  // A finger is considered raised if its tip is vertically above its PIP (or IP for thumb)
  // Note: Y coordinates are normalized [0, 1] starting from top-left, so smaller Y means "higher"
  const indexUp = landmarks[8].y < landmarks[6].y;
  const middleUp = landmarks[12].y < landmarks[10].y;
  const ringUp = landmarks[16].y < landmarks[14].y;
  const pinkyUp = landmarks[20].y < landmarks[18].y;

  // For the thumb, compare the tip Y to the IP joint
  const thumbUp = landmarks[4].y < landmarks[3].y;

  const details = { thumbUp, indexUp, middleUp, ringUp, pinkyUp };

  // 1. Fist Gesture: All fingers folded (tips below PIPs/MCPs)
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) {
    return { gesture: 'fist', details };
  }

  // 2. Rock-On (Web-Shoot) Gesture: Index and Pinky raised, Middle and Ring folded
  if (indexUp && !middleUp && !ringUp && pinkyUp) {
    return { gesture: 'rock', details };
  }

  // 3. Clear Gesture: All 5 fingers are raised (open palm + thumb up)
  if (indexUp && middleUp && ringUp && pinkyUp && thumbUp) {
    return { gesture: 'clear-pending', details };
  }

  // 4. Pause Gesture: Open palm (index, middle, ring, pinky raised) but thumb might not be fully up
  if (indexUp && middleUp && ringUp && pinkyUp) {
    return { gesture: 'pause', details };
  }

  // 5. Draw Gesture: Index finger up, middle finger folded.
  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    return { gesture: 'draw', details };
  }

  // 6. Eraser Gesture: Index and Middle up, Ring and Pinky folded.
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return { gesture: 'eraser', details };
  }

  return { gesture: 'none', details };
}
