
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import AnimatedButton from "./ui-components/AnimatedButton";
import { ArrowRight, PaintBucket, Paintbrush, Check } from "lucide-react";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100");
          entry.target.classList.remove("opacity-0", "translate-y-4");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden pt-20 md:pt-28 pb-16 md:pb-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute w-full h-full bg-gradient-to-b from-blue-50 to-white opacity-50" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-blue-100/40 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-100/40 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div
        ref={heroRef}
        className="container mx-auto px-6 lg:px-8 transition-all duration-700 opacity-0 translate-y-4"
      >
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in text-sm">
            <span className="font-medium">Introducing CrewkitAI for Painters</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-balance mb-6">
            <span className="text-gradient">AI-Powered</span> Business Tools
            <br className="hidden md:block" /> for Painting Professionals
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Streamline operations, increase profits, and deliver exceptional results with intelligent software built specifically for the painting industry.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <AnimatedButton size="lg" className="rounded-full px-8">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              size="lg"
              className="rounded-full px-8"
            >
              Watch Demo
            </AnimatedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              {
                icon: <Paintbrush className="h-5 w-5 text-primary" />,
                title: "Industry-Specific AI",
                description:
                  "Tools designed specifically for painting professionals"
              },
              {
                icon: <PaintBucket className="h-5 w-5 text-primary" />,
                title: "Business Operations",
                description:
                  "Streamline quotes, scheduling, and client management"
              },
              {
                icon: <Check className="h-5 w-5 text-primary" />,
                title: "Professional Growth",
                description:
                  "Strategic insights to scale your painting business"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm card-hover"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
