import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ReactNode } from 'react';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'rotate';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  threshold?: number;
}

export function ScrollReveal({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 0.8,
  distance = 50,
  once = true,
  threshold = 0.2,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const getFromVars = () => {
      const base = { opacity: 0, duration, delay, ease: 'power3.out' };
      switch (animation) {
        case 'fade-up':
          return { ...base, y: distance };
        case 'fade-down':
          return { ...base, y: -distance };
        case 'fade-left':
          return { ...base, x: distance };
        case 'fade-right':
          return { ...base, x: -distance };
        case 'scale':
          return { ...base, scale: 0.8 };
        case 'rotate':
          return { ...base, rotation: -10, scale: 0.9 };
        default:
          return base;
      }
    };

    const ctx = gsap.context(() => {
      gsap.from(element, {
        scrollTrigger: {
          trigger: element,
          start: `top ${100 - threshold * 100}%`,
          toggleActions: once ? 'play none none none' : 'play reverse play reverse',
        },
        ...getFromVars(),
      });
    }, element);

    return () => ctx.revert();
  }, [animation, delay, duration, distance, once, threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Stagger children animations
interface StaggerContainerProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  childAnimation?: 'fade-up' | 'fade-left' | 'scale';
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
  childAnimation = 'fade-up',
}: StaggerContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const childElements = container.children;

    const ctx = gsap.context(() => {
      gsap.from(childElements, {
        scrollTrigger: {
          trigger: container,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: childAnimation === 'fade-up' ? 40 : 0,
        x: childAnimation === 'fade-left' ? 40 : 0,
        scale: childAnimation === 'scale' ? 0.9 : 1,
        duration: 0.6,
        stagger: staggerDelay,
        ease: 'power2.out',
      });
    }, container);

    return () => ctx.revert();
  }, [childAnimation, staggerDelay]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Parallax scroll effect
interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export function Parallax({ children, className = '', speed = 0.5 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      gsap.to(element, {
        y: () => -100 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, element);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
