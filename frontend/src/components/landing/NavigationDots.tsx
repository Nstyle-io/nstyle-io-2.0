
interface NavigationDotsProps {
  currentSection: number;
  totalSections: number;
  onSectionChange: (index: number) => void;
}

const NavigationDots = ({ currentSection, totalSections, onSectionChange }: NavigationDotsProps) => {
  const sectionNames = ['Welcome', 'Gallery', 'Features', 'Community'];

  return (
    <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 space-y-4">
      {Array.from({ length: totalSections }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSectionChange(index)}
          className={`group relative w-4 h-4 rounded-full transition-all duration-300 ${
            index === currentSection 
              ? 'bg-primary scale-125' 
              : 'bg-muted hover:bg-primary/50'
          }`}
          aria-label={`Go to ${sectionNames[index]} section`}
        >
          {/* Tooltip */}
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-background/90 backdrop-blur-sm text-foreground text-sm px-3 py-1 rounded-lg border border-border/20 whitespace-nowrap">
              {sectionNames[index]}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default NavigationDots;
