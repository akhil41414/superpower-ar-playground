import { useState } from 'react';
import { Cpu, Eye, EyeOff } from 'lucide-react';

interface DeveloperStatsProps {
  fps: number;
  latencyMs: number;
  particlesCount: number;
  isModelLoading: boolean;
  isCameraActive: boolean;
  gesture: string;
}

export function DeveloperStats({
  fps,
  latencyMs,
  particlesCount,
  isModelLoading,
  isCameraActive,
  gesture,
}: DeveloperStatsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-40 p-2 bg-black/60 border border-white/10 rounded-xl text-gray-400 hover:text-gray-200 transition-all shadow-md backdrop-blur-md"
        title="Show Stats Panel"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 w-52 p-4 bg-black/70 border border-white/10 rounded-2xl shadow-glass backdrop-blur-md text-xs font-mono flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
        <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          Engine HUD
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-300 transition-all"
          title="Minimize Panel"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-400">Status:</span>
        <span className="flex items-center gap-1">
          {isModelLoading ? (
            <span className="text-yellow-400 font-bold">LOADING Wasm</span>
          ) : isCameraActive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-400 font-bold">ONLINE</span>
            </>
          ) : (
            <span className="text-red-400 font-bold">STANDBY</span>
          )}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-400">Draw Rate:</span>
        <span className={`font-bold ${fps > 45 ? 'text-green-400' : fps > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
          {fps} FPS
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-400">GPU Latency:</span>
        <span className={`font-bold ${latencyMs < 20 ? 'text-green-400' : latencyMs < 45 ? 'text-yellow-400' : 'text-red-400'}`}>
          {latencyMs} ms
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-400">Sparks:</span>
        <span className="text-cyan-400 font-bold">{particlesCount}</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-400">Gesture:</span>
        <span className="text-purple-400 font-bold uppercase tracking-wide">
          {gesture === 'none' ? '—' : gesture === 'clear-pending' ? 'CLEARING' : gesture}
        </span>
      </div>
    </div>
  );
}
