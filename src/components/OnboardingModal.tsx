import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, PenTool, Eraser, Hand, Trash2, ArrowRight, Shield, Zap, Flame, User } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'painter' | 'spellcaster' | 'ironman';

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview', label: '🚀 Overview' },
    { id: 'painter', label: '🖌️ Light Painter' },
    { id: 'spellcaster', label: '🧙‍♂️ Spellcaster HUD' },
    { id: 'ironman', label: '🦾 Stark HUD' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-transparent"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-3xl overflow-hidden glass-panel-heavy rounded-3xl shadow-glass border border-white/10"
          >
            {/* Header Glowing Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-neon-cyan" />

            <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto flex flex-col gap-6">
              {/* Logo / Icon */}
              <div className="flex justify-center mt-2">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl glow-glow-cyan text-cyan-400">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent leading-none">
                  Superpower AR Playground
                </h1>
                <p className="text-gray-400 mt-2 text-xs md:text-sm">
                  Interactive web browser Augmented Reality. Control spells, lights, and suits with your body!
                </p>
              </div>

              {/* Tab Selector bar */}
              <div className="flex justify-center p-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-x-auto scrollbar-none gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 flex-shrink-0 border ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                        : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 py-2">
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-cyan-500/10 text-cyan-400 rounded-xl">
                        <Camera className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-100">1. Setup & Camera Access</h3>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                          Click **"Connect Video"** in the top bar to initialize your camera. Ensure your room is well-lit for accurate tracking.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-purple-500/10 text-purple-400 rounded-xl">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-100">2. Select Your Experience</h3>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                          Use the **Workspace Mode** toggle at the top of the controls card to swap between **Light Painter**, **Spellcaster HUD**, and **Stark HUD (Iron Man)**!
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-center text-xs text-gray-400">
                      💡 Stay about 2 to 4 feet away for drawing, and 6 feet away to suit up!
                    </div>
                  </motion.div>
                )}

                {activeTab === 'painter' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <PenTool className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Draw Trail</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Extend only your **index finger** (other fingers folded) to paint glowing lines.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <Eraser className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Eraser Tool</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Extend both **index and middle fingers** together to wipe away parts of your drawing.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <Hand className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Pause Hover</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Show an **open palm** (fingers spread) to move your cursor without drawing or erasing.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Hold to Clear</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Hold your **palm open flat** for **2 seconds** to clear the drawing canvas.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'spellcaster' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Palm Mandalas (1 Hand)</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Hold your **palm open** to project a rotating golden magic shield (Tao Shield).
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Shield Fusion (2 Hands)</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Raise **both palms**. They fuse into a single shield. Move hands together/apart to scale it!
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <Flame className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Fingertip Flamethrower</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Make the **"Rock-on" gesture**. Fire shoots from your fingertips in the direction you point!
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3">
                      <Flame className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Pink Flame Blast (Ultimate)</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          **Slam/close your hands together** (distance &lt; 65px). A massive pink jet stream fires from the middle!
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3 md:col-span-2">
                      <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-gray-100 text-xs">Lightning Link & Portal Vortex</h4>
                        <p className="text-gray-400 text-[11px] mt-1">
                          Point index fingers together to span **electric lightning**. Clench fists together (65-120px) to open a **sling portal vortex**!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ironman' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-red-500/10 text-red-400 rounded-xl">
                        <User className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-100">1. Select Iron Man & Stand Back</h3>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                          Stand **5 to 6 feet back** from your camera so it can see your shoulders, arms, and chest. If you are too close, the suit cannot attach!
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex gap-4">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-cyan-500/10 text-cyan-400 rounded-xl">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-100">2. Suit-Up & Fire Repulsors</h3>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                          Watch the nanotech armor assemble in real time (Reactor ➔ Shoulders ➔ Boots ➔ Arms ➔ Helmet). Once suited, **raise your palm** (wrist higher than elbow) to fire repulsor lasers!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Keyboard Shortcuts Tip */}
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex gap-3 text-xs text-gray-400">
                <div className="leading-relaxed">
                  ⌨️ **Keyboard Shortcuts:** <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300">D</code> Draw Mode, <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300">E</code> Eraser Mode, <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300">P</code> Hover Pointer, <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300">C</code> Clear Screen, <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300">Z</code> Undo Stroke.
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Enter Experience
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default OnboardingModal;
