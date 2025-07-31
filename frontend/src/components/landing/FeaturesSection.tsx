
import { Camera, Users, Heart, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useCarousel } from '@/hooks/useCarousel';

const FeaturesSection = () => {

  const features = [
    {
      icon: Camera,
      title: "Share Your Art",
      description: "Showcase your nail designs to a passionate community of nail art enthusiasts",
      stat: "2.4M+ posts",
      gradient: "from-pink-500 to-purple-600",
      bgImage: "bg-gradient-to-br from-pink-500/20 to-purple-600/20"
    },
    {
      icon: Users,
      title: "Connect with Artists",
      description: "Follow your favorite nail artists and discover new talent from around the world",
      stat: "500K+ artists",
      gradient: "from-blue-500 to-cyan-600",
      bgImage: "bg-gradient-to-br from-blue-500/20 to-cyan-600/20"
    },
    {
      icon: Heart,
      title: "Get Inspired",
      description: "Browse trending designs, save your favorites, and never run out of creative ideas",
      stat: "10M+ likes",
      gradient: "from-red-500 to-pink-600",
      bgImage: "bg-gradient-to-br from-red-500/20 to-pink-600/20"
    },
    {
      icon: Star,
      title: "Book Appointments",
      description: "Find and book with top-rated salons and nail artists in your area",
      stat: "15K+ salons",
      gradient: "from-yellow-500 to-orange-600",
      bgImage: "bg-gradient-to-br from-yellow-500/20 to-orange-600/20"
    }
  ];

  const { currentIndex: currentFeature, goToSlide } = useCarousel({
    totalItems: features.length,
    itemsPerSlide: 1,
    autoScrollInterval: 4000
  });

  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="container mx-auto text-center">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Create & Connect
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From inspiration to appointment booking, Nstyle has all the tools 
            you need for your nail journey
          </p>
        </div>

        {/* Feature Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden rounded-3xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentFeature * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`w-full flex-shrink-0 p-12 ${feature.bgImage}`}
                >
                  <div className={`w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-xl`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 text-foreground">{feature.title}</h3>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">
                    {feature.description}
                  </p>
                  <div className="text-2xl font-bold text-primary mb-8">
                    {feature.stat}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-2 mt-8">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentFeature === index 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to feature ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12">
          <Link to="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg">
              Join to See More
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
