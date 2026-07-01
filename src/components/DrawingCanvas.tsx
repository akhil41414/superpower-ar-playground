interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  feedbackCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function DrawingCanvas({ canvasRef, feedbackCanvasRef }: DrawingCanvasProps) {
  return (
    <>
      {/* Primary Drawing Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ touchAction: 'none' }}
      />
      
      {/* Auxiliary Feedback HUD & Particle Overlay */}
      <canvas
        ref={feedbackCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        style={{ touchAction: 'none' }}
      />
    </>
  );
}
