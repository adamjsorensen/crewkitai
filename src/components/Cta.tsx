
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import AnimatedButton from "./ui-components/AnimatedButton";
import { ArrowRight, Check } from "lucide-react";

const Cta = () => {
  const ctaRef = useRef<HTMLDivElement>(null);
  
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
    
    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }
    
    return () => {
      if (ctaRef.current) {
        observer.unobserve(ctaRef.current);
      }
    };
  }, []);

  return (
    <section id="pricing" className="section bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div 
          ref={ctaRef}
          className="relative overflow-hidden transition-all duration-700 opacity-0 translate-y-4 max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl"
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-400/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-400/20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
          </div>
          
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-6">
              Ready to Transform Your Painting Business?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of painting professionals using CrewkitAI to streamline operations, increase profits, and deliver exceptional results.
            </p>
            
            <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-white/20 mr-3">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <p className="text-white/90 text-left">Free 14-day trial with full access to all features</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-white/20 mr-3">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <p className="text-white/90 text-left">No credit card required to get started</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-white/20 mr-3">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <p className="text-white/90 text-left">Dedicated onboarding and support</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-white/20 mr-3">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <p className="text-white/90 text-left">Cancel anytime, no questions asked</p>
              </div>
            </div>
            
            <AnimatedButton
              size="lg"
              className="rounded-full px-8 bg-white text-primary hover:bg-white/90"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </AnimatedButton>
            <p className="mt-4 text-sm text-white/70">
              Plans starting at just $49/month after trial
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
