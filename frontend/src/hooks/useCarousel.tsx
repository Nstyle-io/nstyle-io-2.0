import { useState, useEffect, useRef } from 'react';

interface UseCarouselOptions {
  totalItems: number;
  itemsPerSlide?: number;
  autoScrollInterval?: number;
  pauseDuration?: number;
}

export const useCarousel = ({
  totalItems,
  itemsPerSlide = 1,
  autoScrollInterval = 3000,
  pauseDuration = 5000
}: UseCarouselOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  const totalSlides = Math.ceil(totalItems / itemsPerSlide);

  useEffect(() => {
    if (isAutoScrolling && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
      }, autoScrollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoScrolling, totalSlides, autoScrollInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoScrolling(false);
    setTimeout(() => setIsAutoScrolling(true), pauseDuration);
  };

  const nextSlide = () => {
    goToSlide((currentIndex + 1) % totalSlides);
  };

  const prevSlide = () => {
    goToSlide(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1);
  };

  return {
    currentIndex,
    totalSlides,
    isAutoScrolling,
    goToSlide,
    nextSlide,
    prevSlide
  };
};