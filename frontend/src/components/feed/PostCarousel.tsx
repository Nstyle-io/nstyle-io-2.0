import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostCarouselProps {
  images: string[];
  className?: string;
}

export const PostCarousel: React.FC<PostCarouselProps> = ({ images, className = "" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 1) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <img 
          src={images[0]} 
          alt="Post content" 
          className="w-full h-auto max-h-80 sm:max-h-96 object-cover transition-smooth hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div className="relative">
        <img 
          src={images[currentIndex]} 
          alt={`Post content ${currentIndex + 1}`}
          className="w-full h-auto max-h-80 sm:max-h-96 object-cover transition-smooth"
          loading="lazy"
        />
        
        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
          onClick={goToPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
          onClick={goToNext}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        {/* Image Counter */}
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Dots Indicator */}
      <div className="flex justify-center mt-2 space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-primary' : 'bg-muted'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};