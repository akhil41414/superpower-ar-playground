import { VideoOff, ShieldAlert, RotateCcw } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  showVideoPreview: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CameraView({
  videoRef,
  isCameraActive,
  showVideoPreview,
  error,
  onRetry,
}: CameraViewProps) {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#020205]">
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isCameraActive && showVideoPreview ? 'opacity-35 scale-x-[-1]' : 'opacity-0 scale-x-[-1] pointer-events-none'
        }`}
        style={{
          // Mirroring is done by scale-x-[-1] (Tailwind class or inline style)
        }}
      />

      {/* Standby/Off State Background Grid */}
      {!isCameraActive && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-radial-grid">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-gray-500 mb-4 animate-pulse-slow">
            <VideoOff className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-300">Camera is Offline</h3>
          <p className="text-sm text-gray-500 max-w-xs mt-1.5 leading-relaxed">
            Click "Initialize Camera" to allow webcam permission and start drawing in the air.
          </p>
        </div>
      )}

      {/* Error Fallback Screen */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm z-10">
          <div className="max-w-md w-full glass-panel-heavy rounded-3xl p-6 border border-red-500/20 shadow-lg shadow-red-500/5 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Camera Access Error</h3>
            <p className="text-sm text-gray-400 mt-2 mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-red-500/15"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
