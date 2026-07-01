import {
  Camera,
  CameraOff,
  Trash2,
  Undo2,
  Download,
  Video,
  HelpCircle,
  Eye,
  EyeOff,
  Sliders,
  Settings,
} from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import type { DrawingMode } from './ModeSelector';
import { ColorPicker } from './ColorPicker';

interface ControlsPanelProps {
  // Tracking & Camera
  isCameraActive: boolean;
  onToggleCamera: () => void;
  showVideoPreview: boolean;
  onToggleVideoPreview: () => void;
  showLandmarks: boolean;
  onToggleLandmarks: () => void;
  experienceMode: 'painter' | 'spellcaster' | 'ironman';
  onExperienceModeChange: (mode: 'painter' | 'spellcaster' | 'ironman') => void;
  
  // Customizations
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  glowIntensity: number;
  onGlowChange: (glow: number) => void;
  smoothing: number;
  onSmoothingChange: (smooth: number) => void;
  
  // Custom toggles
  isTrailFadeEnabled: boolean;
  onToggleTrailFade: () => void;
  spawnParticles: boolean;
  onToggleParticles: () => void;

  // Actions
  onClear: () => void;
  onUndo: () => void;
  onExportPNG: (transparent?: boolean) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  recordingDuration: number;
  onShowTutorial: () => void;
}

export function ControlsPanel({
  isCameraActive,
  onToggleCamera,
  showVideoPreview,
  onToggleVideoPreview,
  showLandmarks,
  onToggleLandmarks,
  mode,
  onModeChange,
  color,
  onColorChange,
  size,
  onSizeChange,
  glowIntensity,
  onGlowChange,
  smoothing,
  onSmoothingChange,
  isTrailFadeEnabled,
  onToggleTrailFade,
  spawnParticles,
  onToggleParticles,
  onClear,
  onUndo,
  onExportPNG,
  onStartRecording,
  onStopRecording,
  isRecording,
  recordingDuration,
  onShowTutorial,
  experienceMode,
  onExperienceModeChange,
}: ControlsPanelProps) {
  // Formats seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden shadow-glass border border-white/10 flex flex-col max-h-[85vh] md:max-h-[90vh]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400 animate-spin-slow" />
          <span className="font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Control Dashboard
          </span>
        </div>
        <button
          onClick={onShowTutorial}
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-cyan-400 transition-all hover:scale-105"
          title="Open Onboarding Tutorial"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable controls */}
      <div className="p-5 overflow-y-auto flex flex-col gap-6 scrollbar-thin">
        {/* Experience Mode Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Workspace Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
            <button
              onClick={() => onExperienceModeChange('painter')}
              className={`py-2 px-1.5 rounded-xl font-bold text-[10px] transition-all duration-300 border ${
                experienceMode === 'painter'
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Painter
            </button>
            <button
              onClick={() => onExperienceModeChange('spellcaster')}
              className={`py-2 px-1.5 rounded-xl font-bold text-[10px] transition-all duration-300 border ${
                experienceMode === 'spellcaster'
                  ? 'bg-amber-500/15 border-amber-500/25 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Spellcaster
            </button>
            <button
              onClick={() => onExperienceModeChange('ironman')}
              className={`py-2 px-1.5 rounded-xl font-bold text-[10px] transition-all duration-300 border ${
                experienceMode === 'ironman'
                  ? 'bg-red-500/15 border-red-500/25 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                  : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Iron Man
            </button>
          </div>

        </div>

        {/* Camera Toggle and Setup */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onToggleCamera}
            className={`w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              isCameraActive
                ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/10'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-5 h-5" />
                Disconnect Camera
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 animate-pulse" />
                Initialize Camera
              </>
            )}
          </button>

          {isCameraActive && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={onToggleVideoPreview}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  showVideoPreview
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {showVideoPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                Video Feed
              </button>
              <button
                onClick={onToggleLandmarks}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  showLandmarks
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Landmarks
              </button>
            </div>
          )}
        </div>

        {/* Interaction Mode */}
        <ModeSelector mode={mode} onChange={onModeChange} />

        {/* Color Palette (Disabled in Eraser/Pointer modes) */}
        {mode === 'draw' && (
          <ColorPicker selectedColor={color} onChange={onColorChange} />
        )}

        {/* Brush adjustments */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 border-b border-white/5 pb-1">
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Brush Parameters
            </span>
          </div>

          {/* Size Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-300">
              <span>Brush Diameter</span>
              <span className="font-mono text-cyan-400">{size}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="w-full accent-cyan-500 h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Glow Intensity (Hidden in Eraser/Pointer modes) */}
          {mode === 'draw' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-gray-300">
                <span>Glow Intensity</span>
                <span className="font-mono text-purple-400">{glowIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={glowIntensity}
                onChange={(e) => onGlowChange(Number(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Stabilization Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-300">
              <span>Stabilizer Smoothness</span>
              <span className="font-mono text-yellow-400">{Math.round(smoothing * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.05"
              value={smoothing}
              onChange={(e) => onSmoothingChange(Number(e.target.value))}
              className="w-full accent-yellow-500 h-1 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Trail Settings */}
        <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
          {/* Fade-out Trail */}
          <label className="flex items-center justify-between text-xs font-bold text-gray-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              Fade-out Trail
              <span className="text-[10px] text-gray-500 font-normal">(Auto-erase trails)</span>
            </span>
            <input
              type="checkbox"
              checked={isTrailFadeEnabled}
              onChange={onToggleTrailFade}
              className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-white/10"
            />
          </label>

          {/* Particles Toggles */}
          {mode === 'draw' && (
            <label className="flex items-center justify-between text-xs font-bold text-gray-300 cursor-pointer mt-1">
              <span className="flex items-center gap-1.5">
                Particle Sparks
                <span className="text-[10px] text-gray-500 font-normal">(Fingertip sparks)</span>
              </span>
              <input
                type="checkbox"
                checked={spawnParticles}
                onChange={onToggleParticles}
                className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-white/10"
              />
            </label>
          )}
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
          <button
            onClick={onUndo}
            className="py-2.5 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95"
            title="Undo Last Action (Z)"
          >
            <Undo2 className="w-4 h-4" />
            Undo Stroke
          </button>
          
          <button
            onClick={onClear}
            className="py-2.5 px-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95"
            title="Clear All Canvas Drawings (C)"
          >
            <Trash2 className="w-4 h-4" />
            Clear Board
          </button>
        </div>
      </div>

      {/* Export / Recording footer */}
      <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02] flex flex-col gap-2 mt-auto">
        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onExportPNG(true)}
            className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-cyan-500/15"
            title="Export drawing as transparent PNG (S)"
          >
            <Download className="w-4 h-4" />
            Transparent PNG
          </button>
          <button
            onClick={() => onExportPNG(false)}
            className="py-2 px-3 rounded-xl bg-gray-700 hover:bg-gray-600 border border-white/10 text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Export drawing with solid dark background"
          >
            <Download className="w-4 h-4" />
            Dark BG PNG
          </button>
        </div>

        {/* Video Recorder */}
        {isRecording ? (
          <button
            onClick={onStopRecording}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 animate-pulse transition-all shadow-md shadow-red-500/20"
          >
            <div className="h-2 w-2 rounded-full bg-white" />
            Stop Recording ({formatTime(recordingDuration)})
          </button>
        ) : (
          <button
            onClick={onStartRecording}
            className="w-full py-2 px-4 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Record drawing canvas as a WebM video clip"
          >
            <Video className="w-4 h-4" />
            Record drawing session
          </button>
        )}
      </div>
    </div>
  );
}
