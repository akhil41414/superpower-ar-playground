import { PenTool, Eraser, MousePointer } from 'lucide-react';

export type DrawingMode = 'draw' | 'eraser' | 'pointer';

interface ModeSelectorProps {
  mode: DrawingMode;
  onChange: (mode: DrawingMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const modes = [
    {
      id: 'draw' as DrawingMode,
      label: 'Draw',
      icon: PenTool,
      description: 'Index draws glowing lines',
      colorClass: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
    },
    {
      id: 'eraser' as DrawingMode,
      label: 'Eraser',
      icon: Eraser,
      description: 'Index/middle erases strokes',
      colorClass: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
    },
    {
      id: 'pointer' as DrawingMode,
      label: 'Pointer',
      icon: MousePointer,
      description: 'Finger acts as cursor hover',
      colorClass: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Interaction Mode
      </label>
      
      <div className="grid grid-cols-3 gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
        {modes.map((item) => {
          const isActive = mode === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-300 relative border ${
                isActive
                  ? `${item.colorClass} border-opacity-30 shadow-md`
                  : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]'
              }`}
              title={item.description}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
