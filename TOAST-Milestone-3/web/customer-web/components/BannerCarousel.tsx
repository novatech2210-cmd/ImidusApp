"use client";

import { useState, useEffect, useCallback, useRef, TouchEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { BannerSlide } from "@/lib/banner-config";

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoPlayInterval?: number; // ms, defaults to 5000 (5 seconds)
  customerId?: string; // For targeting context
}

// Minimum swipe distance to trigger slide change (in pixels)
const SWIPE_THRESHOLD = 50;

export function BannerCarousel({
  slides,
  autoPlayInterval = 5000, // 5-second auto-rotate as per requirement
  customerId
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Touch handling state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

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

  // Touch event handlers for mobile swipe gestures
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsPaused(true);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        // Swiped left - go to next slide
        nextSlide();
      } else {
        // Swiped right - go to previous slide
        prevSlide();
      }
    }

    // Resume auto-play after a short delay
    setTimeout(() => setIsPaused(false), 3000);
  }, [nextSlide, prevSlide]);

  // Auto-play with 5-second interval
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, autoPlayInterval, nextSlide]);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-xl"
      style={{
        boxShadow: "0 8px 32px rgba(30, 90, 168, 0.2)",
        minHeight: "400px"
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Banner carousel"
      aria-roledescription="carousel"
    >
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        aria-live="polite"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="w-full flex-shrink-0 relative"
            style={{ minHeight: "400px" }}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${slides.length}: ${slide.title}`}
            aria-hidden={index !== currentIndex}
          >
            {/* Background - with optional image */}
            <div
              className="absolute inset-0"
              style={{ background: slide.bgGradient }}
            >
              {/* Lazy-loaded background image if provided */}
              {slide.imageUrl && (
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  className="object-cover opacity-30"
                  loading="lazy"
                  sizes="100vw"
                  priority={index === 0} // Priority load first slide
                />
              )}
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-12 text-center min-h-[400px] md:min-h-[400px]">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                IMIDUSAPP Exclusive
              </div>

              {/* Title */}
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-none mb-3"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
              >
                {slide.title}
              </h2>

              {/* Subtitle */}
              <p
                className="text-lg sm:text-xl lg:text-2xl text-white/90 font-semibold mb-4"
                style={{ textShadow: "0 1px 10px rgba(0,0,0,0.3)" }}
              >
                {slide.subtitle}
              </p>

              {/* Description */}
              {slide.description && (
                <p className="text-white/80 text-sm sm:text-base max-w-xl mb-8 leading-relaxed hidden sm:block">
                  {slide.description}
                </p>
              )}

              {/* CTA Button */}
              <Link href={slide.ctaLink} tabIndex={index === currentIndex ? 0 : -1}>
                <button
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-[#D4AF37] text-[#1A1A2E] font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg text-sm sm:text-base"
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

      {/* Navigation Arrows - hidden on mobile, visible on larger screens */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all z-20 opacity-0 sm:opacity-100 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all z-20 opacity-0 sm:opacity-100 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 sm:h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-[#D4AF37] w-6 sm:w-8"
                    : "bg-white/50 hover:bg-white/70 w-2 sm:w-2.5"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex ? "true" : "false"}
              />
            ))}
          </div>

          {/* Slide Counter - hidden on mobile */}
          <div className="hidden sm:block absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-white/80 text-sm font-mono z-20">
            {currentIndex + 1} / {slides.length}
          </div>

          {/* Swipe hint on mobile */}
          <div className="sm:hidden absolute bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-xs z-20">
            Swipe to navigate
          </div>
        </>
      )}
    </div>
  );
}
