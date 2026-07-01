import { Check } from 'lucide-react';

interface ColorPreset {
  name: string;
  value: string;
  shadowClass: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Cyan', value: '#06b6d4', shadowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' },
  { name: 'Purple', value: '#a855f7', shadowClass: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' },
  { name: 'Pink', value: '#ec4899', shadowClass: 'shadow-[0_0_15px_rgba(236,72,153,0.5)]' },
  { name: 'Green', value: '#22c55e', shadowClass: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' },
  { name: 'Orange', value: '#f97316', shadowClass: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' },
  { name: 'White', value: '#ffffff', shadowClass: 'shadow-[0_0_15px_rgba(255,255,255,0.5)]' },
];

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Neon Brush Color
      </label>
      
      <div className="flex flex-wrap items-center gap-3">
        {COLOR_PRESETS.map((preset) => {
          const isSelected = selectedColor.toLowerCase() === preset.value.toLowerCase();
          return (
            <button
              key={preset.name}
              onClick={() => onChange(preset.value)}
              className={`relative w-8 h-8 rounded-full transition-all duration-300 ${preset.shadowClass} border border-white/20 active:scale-95 hover:scale-110 flex items-center justify-center`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            >
              {isSelected && (
                <Check
                  className={`w-4 h-4 ${
                    preset.name === 'White' ? 'text-black' : 'text-white'
                  } drop-shadow-md`}
                />
              )}
            </button>
          );
        })}

        {/* Custom Color Input */}
        <div className="relative w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 cursor-pointer">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            title="Custom Neon Color"
          />
          <div
            className="w-5 h-5 rounded-full border border-white/10 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
      </div>
    </div>
  );
}
