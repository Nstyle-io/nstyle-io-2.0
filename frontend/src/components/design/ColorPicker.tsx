import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  const presetColors = [
    // Reds & Pinks
    '#FF0000', '#FF69B4', '#FF1493', '#DC143C', '#C71585',
    // Purples
    '#800080', '#9370DB', '#8A2BE2', '#9400D3', '#DDA0DD',
    // Blues
    '#0000FF', '#4169E1', '#1E90FF', '#00BFFF', '#87CEEB',
    // Greens
    '#00FF00', '#32CD32', '#00FA9A', '#98FB98', '#90EE90',
    // Yellows & Oranges
    '#FFFF00', '#FFD700', '#FFA500', '#FF8C00', '#FF6347',
    // Neutrals
    '#FFFFFF', '#F5F5DC', '#D3D3D3', '#A9A9A9', '#000000',
    // Metallics
    '#C0C0C0', '#FFD700', '#B87333', '#E5E4E2', '#CD7F32'
  ];

  const popularNailColors = [
    { name: 'Classic Red', color: '#DC143C' },
    { name: 'Ballet Pink', color: '#FFB6C1' },
    { name: 'Nude', color: '#F5DEB3' },
    { name: 'French White', color: '#FFFAFA' },
    { name: 'Black Onyx', color: '#0C0C0C' },
    { name: 'Royal Blue', color: '#002FA7' },
    { name: 'Emerald', color: '#50C878' },
    { name: 'Gold Chrome', color: '#FFD700' },
    { name: 'Silver', color: '#C0C0C0' },
    { name: 'Holographic', color: '#E6E6FA' }
  ];

  return (
    <div className="space-y-4">
      {/* Current Color Display */}
      <div className="flex items-center space-x-3">
        <div
          className="w-16 h-16 rounded-lg border-2 border-white shadow-md"
          style={{ backgroundColor: selectedColor }}
        />
        <div className="flex-1">
          <Input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-10"
          />
          <Input
            type="text"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            placeholder="#FF69B4"
            className="mt-2"
          />
        </div>
      </div>

      {/* Preset Colors Grid */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Quick Colors</h4>
        <div className="grid grid-cols-8 gap-1">
          {presetColors.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                selectedColor === color ? 'border-primary' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Popular Nail Colors */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Popular Nail Colors</h4>
        <div className="grid grid-cols-2 gap-2">
          {popularNailColors.map((item) => (
            <Button
              key={item.name}
              variant={selectedColor === item.color ? 'default' : 'outline'}
              size="sm"
              onClick={() => onColorChange(item.color)}
              className="justify-start"
            >
              <div
                className="w-4 h-4 rounded mr-2 border border-white/20"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;