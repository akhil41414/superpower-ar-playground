export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number; // starts at 1, goes down to 0
  decay: number;
  type?: 'spark' | 'portal' | 'fire' | 'pink-fire';
}

/**
 * Draws a glowing line stroke using multi-layer shadow effects
 */
export function drawGlowStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  size: number,
  glowIntensity: number,
  isEraser: boolean = false
) {
  if (points.length < 2) return;

  ctx.save();

  // Setup caps and joins for smooth round lines
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = size * 2.5; // Larger size for easier erasing
    ctx.shadowBlur = 0; // No glow for eraser
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const midX = (points[i - 1].x + points[i].x) / 2;
      const midY = (points[i - 1].y + points[i].y) / 2;
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, midX, midY);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Draw Mode: Layered Glowing Painting
  ctx.globalCompositeOperation = 'source-over';

  // 1. Outer Glow Layer: High shadow blur, thick width, low opacity
  ctx.shadowBlur = size * (2.5 * glowIntensity);
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 1.5;
  ctx.globalAlpha = 0.25;
  drawSmoothPath(ctx, points);

  // 2. Medium Glow Layer: Standard shadow blur, normal width, higher opacity
  ctx.shadowBlur = size * (1.2 * glowIntensity);
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.globalAlpha = 0.6;
  drawSmoothPath(ctx, points);

  // 3. Inner Hot Core Layer: Small/no shadow blur, thin width, solid white core
  ctx.shadowBlur = 2;
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, size * 0.25);
  ctx.globalAlpha = 1.0;
  drawSmoothPath(ctx, points);

  ctx.restore();
}

/**
 * Helper to draw a path of points using quadratic curves (midpoint interpolation)
 */
function drawSmoothPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    return;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  // Draw to the final point
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

/**
 * Creates a spark particle flying from coordinates
 */
export function createSpark(x: number, y: number, color: string): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 4;
  return {
    id: Math.random(),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.5, // Drift slightly upwards
    color,
    size: 2 + Math.random() * 4,
    alpha: 1.0,
    life: 1.0,
    decay: 0.02 + Math.random() * 0.03, // Expires in ~30-50 frames
  };
}

/**
 * Updates positions, alpha, and life of active particles
 */
export function updateParticles(particles: Particle[], gravity = 0.05): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy + gravity,
      alpha: Math.max(0, p.life),
      life: p.life - p.decay,
    }))
    .filter(p => p.life > 0);
}

/**
 * Renders all active spark particles on the canvas
 */
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  particles.forEach(p => {
    if (p.life <= 0) return; // Skip inactive pool particles

    ctx.beginPath();
    
    if (p.type === 'fire') {
      const life = p.life;
      let pColor = p.color;
      
      // Fire particles expand as they cool down
      const pSize = p.size * (1.3 - life * 0.4);
      ctx.globalAlpha = p.alpha;
      
      if (life > 0.82) {
        // Hottest inner flame: White/Yellow core
        pColor = '#ffffff';
        ctx.shadowBlur = pSize * 2.5;
        ctx.shadowColor = '#fef08a';
      } else if (life > 0.45) {
        // Main flame: Golden Orange
        pColor = '#f59e0b';
        ctx.shadowBlur = pSize * 2.0;
        ctx.shadowColor = '#f97316';
      } else if (life > 0.18) {
        // Cool outer flame: Deep Red
        pColor = '#ef4444';
        ctx.shadowBlur = pSize * 1.2;
        ctx.shadowColor = '#ef4444';
      } else {
        // Smoke/Soot cloud: Dark Translucent Grey (no glow)
        pColor = 'rgba(75, 85, 99, 0.4)';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = p.alpha * 0.55;
      }
      
      ctx.fillStyle = pColor;
      ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'pink-fire') {
      const life = p.life;
      let pColor = p.color;
      
      // Pink fire particles expand as they cool
      const pSize = p.size * (1.35 - life * 0.4);
      ctx.globalAlpha = p.alpha;
      
      if (life > 0.82) {
        // Hottest inner flame: White core, glowing pink
        pColor = '#ffffff';
        ctx.shadowBlur = pSize * 2.5;
        ctx.shadowColor = '#f472b6';
      } else if (life > 0.45) {
        // Main flame: Hot Magenta
        pColor = '#ec4899';
        ctx.shadowBlur = pSize * 2.0;
        ctx.shadowColor = '#db2777';
      } else if (life > 0.18) {
        // Cooler outer flame: Fuchsia/Violet
        pColor = '#d946ef';
        ctx.shadowBlur = pSize * 1.5;
        ctx.shadowColor = '#c084fc';
      } else {
        // Smoke cloud: Dark Translucent Grey (no glow)
        pColor = 'rgba(75, 85, 99, 0.4)';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = p.alpha * 0.55;
      }
      
      ctx.fillStyle = pColor;
      ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standard glowing spark or portal particle
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      
      // Add glowing shadow to particles
      ctx.shadowBlur = p.size * 2;
      ctx.shadowColor = p.color;
      
      ctx.fill();
    }
  });

  ctx.restore();
}

/**
 * Creates a spark particle flying tangent from a portal circle to create a swirling spray
 */
export function createPortalSpark(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  color: string
): Particle {
  const x = cx + Math.cos(angle) * radius;
  const y = cy + Math.sin(angle) * radius;
  
  // Tangent angle (perpendicular to radial angle)
  const tangentAngle = angle + Math.PI / 2;
  const speed = 2 + Math.random() * 4;
  
  // Combine tangent velocity (for spinning) with slight radial velocity (for expanding outwards)
  const vx = Math.cos(tangentAngle) * speed + Math.cos(angle) * (0.5 + Math.random() * 1.5);
  const vy = Math.sin(tangentAngle) * speed + Math.sin(angle) * (0.5 + Math.random() * 1.5);

  return {
    id: Math.random(),
    x,
    y,
    vx,
    vy,
    color,
    size: 2.5 + Math.random() * 4,
    alpha: 1.0,
    life: 1.0,
    decay: 0.012 + Math.random() * 0.015, // Spiral sparks live slightly longer
  };
}

/**
 * Draws a rotating, detailed Doctor Strange Mandala (Tao Shield)
 */
export function drawDoctorStrangeMandala(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Setup spell styling
  ctx.shadowBlur = radius * 0.2;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Thick outer ring boundary
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.stroke();

  // 2. Dashed glyph ring
  ctx.save();
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // 3. Hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const hx = Math.cos(angle) * radius * 0.78;
    const hy = Math.sin(angle) * radius * 0.78;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. Inscribed six-pointed star (conjoined triangles)
  // Triangle 1
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const hx = Math.cos(angle) * radius * 0.78;
    const hy = Math.sin(angle) * radius * 0.78;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.lineWidth = 1;
  ctx.stroke();

  // Triangle 2 (inverted)
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 - Math.PI / 6;
    const hx = Math.cos(angle) * radius * 0.78;
    const hy = Math.sin(angle) * radius * 0.78;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.lineWidth = 1;
  ctx.stroke();

  // 5. Inward solid circle
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.stroke();

  // 6. Dotted inner circle
  ctx.save();
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 7. Center ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 8. Rotating inner spokes
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    ctx.moveTo(Math.cos(angle) * radius * 0.25, Math.sin(angle) * radius * 0.25);
    ctx.lineTo(Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5);
  }
  ctx.lineWidth = 0.75;
  ctx.stroke();

  // 9. White-hot center core
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a crackling electric lightning beam between two coordinates
 */
export function drawCracklingBeam(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'miter';

  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return;
  
  // Divide beam into segments based on length
  const segmentsCount = Math.max(8, Math.floor(distance / 18));
  const points: Point[] = [{ x: x1, y: y1 }];
  
  // Perpendicular normalized vector for offsets
  const nx = -dy / distance;
  const ny = dx / distance;
  
  for (let i = 1; i < segmentsCount; i++) {
    const t = i / segmentsCount;
    // Straight interpolation position
    const lx = x1 + dx * t;
    const ly = y1 + dy * t;
    
    // Jagged displacement perpendicular to line direction
    const maxOffset = Math.min(20, distance * 0.06);
    const offset = (Math.random() - 0.5) * maxOffset;
    
    points.push({
      x: lx + nx * offset,
      y: ly + ny * offset,
    });
  }
  
  points.push({ x: x2, y: y2 });

  // Pass 1: Draw thick blurred neon background beam
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4.5 + Math.random() * 2.5;
  ctx.globalAlpha = 0.65;
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Pass 2: Draw thin white electric core
  ctx.shadowBlur = 3;
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 1.0;
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a swirling portal vortex ring
 */
export function drawPortalVortex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  
  ctx.shadowBlur = radius * 0.18;
  ctx.shadowColor = color;
  ctx.lineCap = 'round';
  
  // Layer 1: Outer glowing sparks ring
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.65;
  ctx.save();
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.setLineDash([15, 30, 45, 12]);
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Layer 2: Medium inner ring spinning opposite direction
  ctx.strokeStyle = '#f97316'; // Golden orange
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.75;
  ctx.save();
  ctx.rotate(-rotation * 1.4);
  ctx.beginPath();
  ctx.setLineDash([25, 20, 8, 30]);
  ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Layer 3: Hot white center core
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.globalAlpha = 0.95;
  ctx.save();
  ctx.rotate(rotation * 2.2);
  ctx.beginPath();
  ctx.setLineDash([50, 70]);
  ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Layer 4: Faint red internal swirl
  ctx.strokeStyle = '#ef4444'; // Red hot center dust
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.25;
  ctx.save();
  ctx.rotate(-rotation * 0.6);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Draws a massive, highly detailed combined Doctor Strange Shield (Fusion Mandala)
 */
export function drawFusionMandala(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Setup heavy magic styling
  ctx.shadowBlur = radius * 0.18;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Double outer heavy rings
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.94, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Radial tick marks between outer rings (looks like runes/engravings)
  ctx.beginPath();
  for (let i = 0; i < 36; i++) {
    const angle = (i * Math.PI) / 18;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.moveTo(cos * radius * 0.94, sin * radius * 0.94);
    ctx.lineTo(cos * radius, sin * radius);
  }
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. Inscribed Octagon (8-sided star boundary)
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const hx = Math.cos(angle) * radius * 0.82;
    const hy = Math.sin(angle) * radius * 0.82;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 4. Inscribed squares rotating opposite
  ctx.save();
  ctx.rotate(-rotation * 1.6);
  ctx.beginPath();
  // Square 1
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const hx = Math.cos(angle) * radius * 0.82;
    const hy = Math.sin(angle) * radius * 0.82;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  // Square 2 (45 deg offset)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const hx = Math.cos(angle) * radius * 0.82;
    const hy = Math.sin(angle) * radius * 0.82;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // 5. Middle dashed glyph ring
  ctx.save();
  ctx.setLineDash([12, 18]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // 6. Inscribed Star (Hexagram)
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const hx = Math.cos(angle) * radius * 0.54;
    const hy = Math.sin(angle) * radius * 0.54;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + Math.PI;
    const hx = Math.cos(angle) * radius * 0.54;
    const hy = Math.sin(angle) * radius * 0.54;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 7. Center ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.stroke();

  // 8. Tiny white center core
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a highly stylized glowing holographic Iron Man Suit piece-by-piece
 */
export function drawIronManSuit(
  ctx: CanvasRenderingContext2D,
  lm: any[], // 33 landmarks
  progress: number, // 0 to 1
  width: number,
  height: number
) {
  if (!lm || lm.length < 33) return;

  const pulse = 1 + 0.12 * Math.sin(Date.now() / 140);

  // 1. CHEST Arc Reactor (triggers at progress > 0.0)
  const shL = lm[11]; // Left shoulder
  const shR = lm[12]; // Right shoulder
  if (shL && shR && shL.visibility > 0.5 && shR.visibility > 0.5) {
    const cx = (1 - (shL.x + shR.x) / 2) * width;
    const cy = ((shL.y + shR.y) / 2) * height;
    const sWidth = Math.hypot(shL.x - shR.x, shL.y - shR.y) * width;

    // Draw Arc Reactor core
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, sWidth * 0.15 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#06b6d4';
    ctx.fill();
    ctx.stroke();

    // Inner glowing triangle
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const tx = cx + Math.cos(angle) * sWidth * 0.09 * pulse;
      const ty = cy + Math.sin(angle) * sWidth * 0.09 * pulse;
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    // 2. CHESTPLATE & SHOULDERS (triggers at progress > 0.2)
    if (progress > 0.2) {
      const chestProgress = Math.min(1, (progress - 0.2) / 0.25);
      ctx.save();
      ctx.strokeStyle = '#dc2626'; // Iron Man Red outline
      ctx.fillStyle = 'rgba(220, 38, 38, 0.18)'; // Translucent armor fill
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12 * chestProgress;
      ctx.shadowColor = '#ef4444';

      const sLX = (1 - shL.x) * width;
      const sLY = shL.y * height;
      const sRX = (1 - shR.x) * width;
      const sRY = shR.y * height;

      // Left shoulder pad
      ctx.beginPath();
      ctx.arc(sLX, sLY, sWidth * 0.16 * chestProgress, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right shoulder pad
      ctx.beginPath();
      ctx.arc(sRX, sRY, sWidth * 0.16 * chestProgress, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Collarbone/Chest plates meeting at reactor
      ctx.beginPath();
      ctx.moveTo(sLX, sLY);
      ctx.lineTo(cx, cy);
      ctx.lineTo(sRX, sRY);
      ctx.stroke();

      // Rib/Waist panels (meeting at hips)
      const hpL = lm[23];
      const hpR = lm[24];
      if (hpL && hpR && hpL.visibility > 0.5 && hpR.visibility > 0.5) {
        const hLX = (1 - hpL.x) * width;
        const hLY = hpL.y * height;
        const hRX = (1 - hpR.x) * width;
        const hRY = hpR.y * height;

        ctx.beginPath();
        ctx.moveTo(sLX, sLY);
        ctx.lineTo(hLX, hLY);
        ctx.lineTo(hRX, hRY);
        ctx.lineTo(sRX, sRY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. BOOTS & LEGS (triggers at progress > 0.4)
  if (progress > 0.4) {
    const legsProgress = Math.min(1, (progress - 0.4) / 0.2);
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
    ctx.lineWidth = 3.0;
    ctx.shadowBlur = 10 * legsProgress;
    ctx.shadowColor = '#ef4444';

    // Draw left leg: ankle (27)
    const akL = lm[27];
    if (akL && akL.visibility > 0.5) {
      const aLX = (1 - akL.x) * width;
      const aLY = akL.y * height;
      
      ctx.beginPath();
      ctx.arc(aLX, aLY, 18 * legsProgress, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Boots thruster ring
      ctx.beginPath();
      ctx.arc(aLX, aLY + 12, 12 * legsProgress, 0, Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // Draw right leg: ankle (28)
    const akR = lm[28];
    if (akR && akR.visibility > 0.5) {
      const aRX = (1 - akR.x) * width;
      const aRY = akR.y * height;
      
      ctx.beginPath();
      ctx.arc(aRX, aRY, 18 * legsProgress, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Boots thruster ring
      ctx.beginPath();
      ctx.arc(aRX, aRY + 12, 12 * legsProgress, 0, Math.PI);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. GAUNTLETS & ARMS (triggers at progress > 0.6)
  if (progress > 0.6) {
    const armsProgress = Math.min(1, (progress - 0.6) / 0.2);
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10 * armsProgress;
    ctx.shadowColor = '#ef4444';

    // Left Arm elbow (13) -> wrist (15)
    const wrL = lm[15];
    if (wrL && wrL.visibility > 0.5) {
      const wLX = (1 - wrL.x) * width;
      const wLY = wrL.y * height;

      ctx.beginPath();
      ctx.arc(wLX, wLY, 14 * armsProgress, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Palm repulsor dot
      ctx.beginPath();
      ctx.arc(wLX, wLY, 6 * armsProgress, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#22d3ee';
      ctx.fill();
    }

    // Right Arm elbow (14) -> wrist (16)
    const wrR = lm[16];
    if (wrR && wrR.visibility > 0.5) {
      const wRX = (1 - wrR.x) * width;
      const wRY = wrR.y * height;

      ctx.beginPath();
      ctx.arc(wRX, wRY, 14 * armsProgress, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Palm repulsor dot
      ctx.beginPath();
      ctx.arc(wRX, wRY, 6 * armsProgress, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#22d3ee';
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. HELMET (triggers at progress > 0.8)
  if (progress > 0.8) {
    const helmProgress = Math.min(1, (progress - 0.8) / 0.15);
    const nose = lm[0];
    const earL = lm[7];
    const earR = lm[8];

    if (nose && nose.visibility > 0.5 && earL && earR && earL.visibility > 0.5 && earR.visibility > 0.5) {
      const earLX = (1 - earL.x) * width;
      const earLY = earL.y * height;
      const earRX = (1 - earR.x) * width;
      const earRY = earR.y * height;

      // Center of head
      const hx = (earLX + earRX) / 2;
      const hy = ((earLY + earRY) / 2) - Math.abs(earLX - earRX) * 0.12;
      
      const headSize = Math.max(35, Math.hypot(earLX - earRX, earLY - earRY) * 0.55);
      const tiltAngle = Math.atan2(earRY - earLY, earRX - earLX);

      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(tiltAngle);

      ctx.shadowBlur = 15 * helmProgress;
      ctx.shadowColor = '#ef4444';
      ctx.strokeStyle = '#dc2626';
      ctx.fillStyle = 'rgba(220, 38, 38, 0.9)'; // More solid red helm
      ctx.lineWidth = 2.5;

      // A. Outer Red Mask Shell
      ctx.beginPath();
      ctx.arc(0, 0, headSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // B. Golden Faceplate (inscribed inside)
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
      ctx.beginPath();
      // Forehead plate down to cheeks
      ctx.moveTo(-headSize * 0.5, -headSize * 0.3);
      ctx.bezierCurveTo(-headSize * 0.6, headSize * 0.2, -headSize * 0.4, headSize * 0.7, 0, headSize * 0.85);
      ctx.bezierCurveTo(headSize * 0.4, headSize * 0.7, headSize * 0.6, headSize * 0.2, headSize * 0.5, -headSize * 0.3);
      ctx.quadraticCurveTo(0, -headSize * 0.45, -headSize * 0.5, -headSize * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // C. Glowing Cyan Slit Eyes
      if (helmProgress > 0.85) {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#22d3ee';
        ctx.lineWidth = 1.5;

        // Left Eye Slit
        ctx.beginPath();
        ctx.moveTo(-headSize * 0.35, -headSize * 0.05);
        ctx.lineTo(-headSize * 0.12, -headSize * 0.02);
        ctx.lineTo(-headSize * 0.14, -headSize * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Eye Slit
        ctx.beginPath();
        ctx.moveTo(headSize * 0.35, -headSize * 0.05);
        ctx.lineTo(headSize * 0.12, -headSize * 0.02);
        ctx.lineTo(headSize * 0.14, -headSize * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }
}

/**
 * Draws a thick repulsor laser beam shooting from raised hands
 */
export function drawRepulsorBlast(
  ctx: CanvasRenderingContext2D,
  wx: number, // Wrist X
  wy: number, // Wrist Y
  tx: number, // Target X
  ty: number, // Target Y
  color: string,
  width: number,
  height: number
) {
  // Compute firing direction vector from wrist to tip
  const dx = tx - wx;
  const dy = ty - wy;
  const len = Math.hypot(dx, dy) || 1;
  
  // Extend beam to edge of screen
  const beamLength = Math.max(width, height) * 1.5;
  const ex = wx + (dx / len) * beamLength;
  const ey = wy + (dy / len) * beamLength;

  ctx.save();
  ctx.lineCap = 'round';

  // Layer 1: Heavy colored glowing outer beam
  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = color;
  ctx.lineWidth = 22;
  ctx.shadowBlur = 30;
  ctx.shadowColor = color;
  ctx.globalAlpha = 0.55;
  ctx.stroke();

  // Layer 2: White hot center core
  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#ffffff';
  ctx.globalAlpha = 1.0;
  ctx.stroke();

  // Layer 3: Firing core flare ring
  ctx.beginPath();
  ctx.arc(wx, wy, 24, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.fill();

  ctx.restore();
}

