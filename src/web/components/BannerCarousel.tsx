"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { BannerSlide } from "@/lib/banner-config";

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoPlayInterval?: number; // ms
}

export function BannerCarousel({ 
  slides, 
  autoPlayInterval = 6000 
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating]);

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentIndex - 1 + slides.length) % slides.length);
  }, [currentIndex, slides.length, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, autoPlayInterval, nextSlide]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl shadow-xl"
      style={{ 
        boxShadow: "0 8px 32px rgba(30, 90, 168, 0.2)",
        minHeight: "400px"
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="w-full flex-shrink-0 relative"
            style={{ minHeight: "400px" }}
          >
            {/* Background */}
            <div 
              className="absolute inset-0"
              style={{ background: slide.bgGradient }}
            />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-12 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                IMIDUSAPP Exclusive
              </div>

              {/* Title */}
              <h2 
                className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-none mb-3"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
              >
                {slide.title}
              </h2>

              {/* Subtitle */}
              <p 
                className="text-xl lg:text-2xl text-white/90 font-semibold mb-4"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.3)" }}
              >
                {slide.subtitle}
              </p>

              {/* Description */}
              {slide.description && (
                <p className="text-white/80 text-base max-w-xl mb-8 leading-relaxed">
                  {slide.description}
                </p>
              )}

              {/* CTA Button */}
              <Link href={slide.ctaLink}>
                <button 
                  className="px-8 py-4 bg-[#D4AF37] text-[#1A1A2E] font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg"
                  style={{ 
                    boxShadow: "0 4px 14px rgba(212, 175, 55, 0.4)",
                    fontFamily: "var(--font-primary)"
                  }}
                >
                  {slide.ctaText}
                </button>
              </Link>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-white/5 blur-xl" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all z-20"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all z-20"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex 
                    ? "bg-[#D4AF37] w-8" 
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-sm font-mono z-20">
            {currentIndex + 1} / {slides.length}
          </div>
        </>
      )}
    </div>
  );
}
