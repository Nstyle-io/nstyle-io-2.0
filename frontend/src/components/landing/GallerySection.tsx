
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiscoverCarousel from './DiscoverCarousel';

const GallerySection = () => {

  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="container mx-auto">
        <DiscoverCarousel />
      </div>
    </section>
  );
};

export default GallerySection;
