import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface NavigationItem {
  id: string;
  label: string;
  count?: number;
}

interface SlidingNavigationProps {
  items: NavigationItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  className?: string;
}

const SlidingNavigation = ({ items, activeId, onItemClick, className = '' }: SlidingNavigationProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Auto-scroll to active item
  useEffect(() => {
    const activeButton = itemRefs.current[activeId];
    if (activeButton && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      // Update indicator position
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left + container.scrollLeft,
        width: buttonRect.width,
      });

      // Auto-scroll logic
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      const containerScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      // Check if button is outside visible area
      if (buttonLeft < containerScrollLeft) {
        // Button is to the left of visible area
        container.scrollTo({
          left: buttonLeft - 20, // Add some padding
          behavior: 'smooth'
        });
      } else if (buttonLeft + buttonWidth > containerScrollLeft + containerWidth) {
        // Button is to the right of visible area
        container.scrollTo({
          left: buttonLeft + buttonWidth - containerWidth + 20, // Add some padding
          behavior: 'smooth'
        });
      }
    }
  }, [activeId, items]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef}
        className="flex space-x-1 overflow-x-auto custom-scrollbar relative"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
        }}
      >
        {/* Active indicator line */}
        <div
          className="absolute bottom-0 h-1 transition-all duration-300 ease-out rounded-full bg-gradient-primary z-10"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
        
        {items.map((item) => {
          const isActive = item.id === activeId;
          
          return (
            <Button
              key={item.id}
              ref={(el) => (itemRefs.current[item.id] = el)}
              variant="ghost"
              size="sm"
              onClick={() => onItemClick(item.id)}
              className={`
                whitespace-nowrap px-4 py-2 text-sm font-medium transition-all duration-200 relative
                ${isActive 
                  ? 'font-bold' 
                  : 'text-muted-foreground hover:text-foreground'
                }
                hover:bg-transparent
              `}
              style={{
                color: isActive ? '#a855f7' : undefined
              }}
            >
              {item.label}
              {item.count && (
                <span 
                  className={`ml-1 text-xs ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}
                  style={{
                    color: isActive ? '#a855f7' : undefined
                  }}
                >
                  {item.count > 999 ? '999+' : item.count}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default SlidingNavigation;