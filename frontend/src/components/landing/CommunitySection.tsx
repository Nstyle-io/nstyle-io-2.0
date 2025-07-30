
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CommunitySection = () => {
  const testimonials = [
    {
      quote: "Nstyle helped me connect with amazing nail artists and grow my business!",
      author: "Sarah M.",
      role: "Professional Nail Artist"
    },
    {
      quote: "I've discovered so many new techniques and trends here. It's my go-to inspiration source.",
      author: "Jessica L.",
      role: "Nail Art Enthusiast"
    },
    {
      quote: "The booking feature made it so easy to find the perfect salon for my wedding nails.",
      author: "Emily R.",
      role: "Happy Customer"
    }
  ];

  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="container mx-auto">
        <div className="glass-card rounded-3xl p-12 text-center max-w-4xl mx-auto">
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-primary rounded-2xl flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Join the{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Community?
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start sharing your nail art, discovering new trends, and connecting 
            with artists from around the world. It's free to join!
          </p>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card p-6 rounded-xl">
                <p className="text-sm text-muted-foreground mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div className="text-sm">
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-lg">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-border/20 hover:bg-background/10 px-8 h-14 text-lg"
              >
                I Already Have an Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/20">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Nstyle
              </span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/help-center" className="hover:text-primary transition-colors">
                Help Center
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border/20 text-center text-sm text-muted-foreground">
            © 2025 Nstyle. All rights reserved. Made with ❤️ for nail art lovers.
          </div>
        </footer>
      </div>
    </section>
  );
};

export default CommunitySection;
