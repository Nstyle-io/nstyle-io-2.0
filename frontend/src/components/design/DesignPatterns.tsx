import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Circle, Minus, Waves, Star, Heart, Flower } from 'lucide-react';

interface DesignPatternsProps {
  selectedPattern: string | null;
  onPatternSelect: (pattern: string | null) => void;
}

const DesignPatterns: React.FC<DesignPatternsProps> = ({ selectedPattern, onPatternSelect }) => {
  const patterns = [
    { id: null, name: 'Solid Color', icon: Circle, description: 'No pattern' },
    { id: 'dots', name: 'Polka Dots', icon: Circle, description: 'Classic dots pattern' },
    { id: 'stripes', name: 'Stripes', icon: Minus, description: 'Diagonal stripes' },
    { id: 'glitter', name: 'Glitter', icon: Sparkles, description: 'Sparkly effect' },
    { id: 'gradient', name: 'Gradient', icon: Waves, description: 'Color fade effect' },
    { id: 'french', name: 'French Tips', icon: Minus, description: 'Classic french manicure' },
    { id: 'marble', name: 'Marble', icon: Waves, description: 'Marble texture' },
    { id: 'stars', name: 'Stars', icon: Star, description: 'Star pattern' },
    { id: 'hearts', name: 'Hearts', icon: Heart, description: 'Heart shapes' },
    { id: 'floral', name: 'Floral', icon: Flower, description: 'Flower designs' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {patterns.map((pattern) => {
          const Icon = pattern.icon;
          return (
            <Button
              key={pattern.id || 'none'}
              variant={selectedPattern === pattern.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPatternSelect(pattern.id)}
              className="h-auto py-3 flex flex-col items-center justify-center"
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{pattern.name}</span>
            </Button>
          );
        })}
      </div>

      {/* Pattern Preview */}
      {selectedPattern && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Pattern Preview</h4>
          <div className="w-full h-20 rounded bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center">
            <PatternPreview pattern={selectedPattern} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {patterns.find(p => p.id === selectedPattern)?.description}
          </p>
        </div>
      )}

      {/* Clear Pattern Button */}
      {selectedPattern && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPatternSelect(null)}
          className="w-full"
        >
          Clear Pattern
        </Button>
      )}
    </div>
  );
};

const PatternPreview: React.FC<{ pattern: string }> = ({ pattern }) => {
  switch (pattern) {
    case 'dots':
      return (
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white rounded-full" />
          <div className="w-3 h-3 bg-white rounded-full" />
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      );
    case 'stripes':
      return (
        <div className="flex space-x-1 transform rotate-45">
          <div className="w-1 h-12 bg-white" />
          <div className="w-1 h-12 bg-white" />
          <div className="w-1 h-12 bg-white" />
        </div>
      );
    case 'glitter':
      return <Sparkles className="w-8 h-8 text-white animate-pulse" />;
    case 'gradient':
      return <div className="w-16 h-8 bg-gradient-to-r from-white/80 to-transparent rounded" />;
    case 'stars':
      return <Star className="w-6 h-6 text-white fill-white" />;
    case 'hearts':
      return <Heart className="w-6 h-6 text-white fill-white" />;
    case 'floral':
      return <Flower className="w-6 h-6 text-white" />;
    default:
      return null;
  }
};

export default DesignPatterns;