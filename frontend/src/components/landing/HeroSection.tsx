
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TrendingSection from './TrendingSection';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Express Your Style with{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Beautiful Nails
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Join the world's largest nail art community. Share your designs, 
            discover trends, and connect with artists worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg">
                Join Nstyle
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/browse">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-border/20 hover:bg-background/10 px-8 h-14 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Browse as Guest
              </Button>
            </Link>
          </div>

          {/* Trending Section */}
          <TrendingSection />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
