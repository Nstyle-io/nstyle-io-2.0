
import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroSection from '@/components/landing/HeroSection';
import GallerySection from '@/components/landing/GallerySection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CommunitySection from '@/components/landing/CommunitySection';
import NavigationDots from '@/components/landing/NavigationDots';

const Landing = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<HTMLElement[]>([]);

  const sections = [
    { id: 'hero', component: HeroSection },
    { id: 'gallery', component: GallerySection },
    { id: 'features', component: FeaturesSection },
    { id: 'community', component: CommunitySection }
  ];

  const scrollToSection = useCallback((index: number) => {
    if (sectionRefs.current[index]) {
      sectionRefs.current[index].scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  // Intersection Observer to track current section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.findIndex(ref => ref === entry.target);
            if (index !== -1) {
              setCurrentSection(index);
            }
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' && currentSection > 0) {
        event.preventDefault();
        scrollToSection(currentSection - 1);
      } else if (event.key === 'ArrowDown' && currentSection < sections.length - 1) {
        event.preventDefault();
        scrollToSection(currentSection + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, scrollToSection, sections.length]);

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Nstyle
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Scroll Container */}
      <div 
        ref={containerRef}
        className="h-screen overflow-y-auto scroll-smooth pt-16"
        style={{ 
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {sections.map((section, index) => {
          const Component = section.component;
          return (
            <section
              key={section.id}
              ref={(el) => {
                if (el) sectionRefs.current[index] = el;
              }}
              className="min-h-screen w-full flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Component />
            </section>
          );
        })}
      </div>

      {/* Navigation Dots */}
      <NavigationDots 
        currentSection={currentSection}
        totalSections={sections.length}
        onSectionChange={scrollToSection}
      />

      {/* Scroll Hint */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center space-x-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border/20">
          <span className="text-sm text-muted-foreground">
            Scroll or use arrow keys to navigate
          </span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
