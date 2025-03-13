
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "CrewkitAI has completely transformed how we operate. Our estimates are more accurate, scheduling is seamless, and we're seeing a 30% increase in profit margins.",
    name: "Michael Turner",
    title: "Owner, Elite Painting Services",
    stars: 5,
    delay: "0"
  },
  {
    quote: "The AI-powered project estimation alone paid for this software within the first month. Now we can price jobs confidently and never leave money on the table.",
    name: "Sarah Rodriguez",
    title: "Operations Manager, Rodriguez Painting Co.",
    stars: 5,
    delay: "150"
  },
  {
    quote: "As a solo painter growing my business, CrewkitAI has been like having a business partner. It helps me with everything from quotes to client follow-ups.",
    name: "David Chen",
    title: "Founder, Precise Painting",
    stars: 5,
    delay: "300"
  }
];

const Testimonials = () => {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    );
    
    if (testimonialsRef.current) {
      const testimonialElements = testimonialsRef.current.querySelectorAll(".testimonial-card");
      testimonialElements.forEach(el => observer.observe(el));
    }
    
    return () => {
      if (testimonialsRef.current) {
        const testimonialElements = testimonialsRef.current.querySelectorAll(".testimonial-card");
        testimonialElements.forEach(el => observer.unobserve(el));
      }
    };
  }, []);

  return (
    <section id="testimonials" className="section bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-6 text-sm">
            <span className="font-medium">Customer Success</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">
            Trusted by Painting Professionals
          </h2>
          <p className="text-lg text-muted-foreground">
            Hear from painting business owners who've transformed their operations with CrewkitAI.
          </p>
        </div>

        <div 
          ref={testimonialsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                "testimonial-card p-8 rounded-xl bg-white border border-gray-100 shadow-sm transition-all duration-700 transform opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${testimonial.delay}ms` }}
            >
              <div className="flex mb-4">
                {[...Array(testimonial.stars)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <blockquote className="mb-6 text-lg font-medium italic">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="ml-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
