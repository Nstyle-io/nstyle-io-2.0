import { Camera, Palette, Heart, Star, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCarousel } from '@/hooks/useCarousel';
import { Link } from 'react-router-dom';

interface DiscoverItem {
  id: number;
  icon: typeof Camera;
  title: string;
  description: string;
  category: string;
  gradient: string;
  bgGradient: string;
  stats: string;
}

const DiscoverCarousel = () => {
  const discoverItems: DiscoverItem[] = [
    {
      id: 1,
      icon: Palette,
      title: "Nail Art Trends",
      description: "Discover the latest nail art designs and trending styles from top artists worldwide",
      category: "Trending",
      gradient: "from-pink-500 to-purple-600",
      bgGradient: "from-pink-500/10 to-purple-600/10",
      stats: "2.4M+ designs"
    },
    {
      id: 2,
      icon: Users,
      title: "Artist Community",
      description: "Connect with talented nail artists and share your creative journey",
      category: "Community",
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-500/10 to-cyan-600/10",
      stats: "500K+ artists"
    },
    {
      id: 3,
      icon: Heart,
      title: "Inspiration Gallery",
      description: "Browse through thousands of nail art photos to spark your creativity",
      category: "Gallery",
      gradient: "from-red-500 to-pink-600",
      bgGradient: "from-red-500/10 to-pink-600/10",
      stats: "10M+ likes"
    },
    {
      id: 4,
      icon: Star,
      title: "Professional Salons",
      description: "Find and book appointments with top-rated nail salons near you",
      category: "Services",
      gradient: "from-yellow-500 to-orange-600",
      bgGradient: "from-yellow-500/10 to-orange-600/10",
      stats: "15K+ salons"
    },
    {
      id: 5,
      icon: Sparkles,
      title: "Seasonal Collections",
      description: "Explore curated collections for every season and special occasion",
      category: "Collections",
      gradient: "from-green-500 to-teal-600",
      bgGradient: "from-green-500/10 to-teal-600/10",
      stats: "500+ collections"
    },
    {
      id: 6,
      icon: Camera,
      title: "Photo Tutorials",
      description: "Step-by-step tutorials to recreate stunning nail art designs at home",
      category: "Tutorials",
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-500/10 to-purple-600/10",
      stats: "1K+ tutorials"
    }
  ];

  const { currentIndex, totalSlides, goToSlide } = useCarousel({
    totalItems: discoverItems.length,
    itemsPerSlide: 2,
    autoScrollInterval: 4000
  });

  return (
    <div className="w-full max-w-6xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold mb-4">
          Discover Amazing{' '}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Nail Art
          </span>
        </h3>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get a taste of what our community creates every day
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div key={slideIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {discoverItems
                  .slice(slideIndex * 2, (slideIndex + 1) * 2)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`relative p-8 rounded-2xl bg-gradient-to-br ${item.bgGradient} border border-border/20 hover:border-border/40 transition-all duration-300 group cursor-pointer`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className="w-7 h-7 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                              {item.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.stats}
                            </span>
                          </div>
                          
                          <h4 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          
                          <p className="text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-8">
        <Link to="/browse">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg">
            Explore Gallery
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default DiscoverCarousel;