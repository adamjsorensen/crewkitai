
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { PaintBucket, Paintbrush, Star, Image, ArrowRight, Info, Search } from "lucide-react";

const featuresList = [
  {
    icon: <Paintbrush className="h-6 w-6 text-primary" />,
    title: "AI Project Estimation",
    description: "Get accurate project quotes in minutes with AI that learns from your past jobs and industry standards.",
    delay: "0"
  },
  {
    icon: <PaintBucket className="h-6 w-6 text-primary" />,
    title: "Business Operations",
    description: "Streamline scheduling, inventory management, and crew coordination with smart workflows.",
    delay: "100"
  },
  {
    icon: <Star className="h-6 w-6 text-primary" />,
    title: "Client Management",
    description: "Build stronger relationships with automated follow-ups, reviews collection, and personalized communication.",
    delay: "200"
  },
  {
    icon: <Image className="h-6 w-6 text-primary" />,
    title: "Project Gallery",
    description: "Automatically organize and showcase your best work with AI-enhanced project galleries.",
    delay: "300"
  },
  {
    icon: <Search className="h-6 w-6 text-primary" />,
    title: "Industry Knowledge",
    description: "Access the latest painting techniques, materials information, and business strategies from our vast database.",
    delay: "400"
  },
  {
    icon: <Info className="h-6 w-6 text-primary" />,
    title: "Financial Insights",
    description: "Track profitability, identify trends, and optimize pricing with detailed financial analytics.",
    delay: "500"
  }
];

const Features = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  
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
    
    if (featuresRef.current) {
      const featureElements = featuresRef.current.querySelectorAll(".feature-card");
      featureElements.forEach(el => observer.observe(el));
    }
    
    return () => {
      if (featuresRef.current) {
        const featureElements = featuresRef.current.querySelectorAll(".feature-card");
        featureElements.forEach(el => observer.unobserve(el));
      }
    };
  }, []);

  return (
    <section id="features" className="section bg-gray-50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-6 text-sm">
            <span className="font-medium">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">
            Everything You Need to Run Your Painting Business
          </h2>
          <p className="text-lg text-muted-foreground">
            CrewkitAI combines powerful AI capabilities with industry-specific tools to help painting professionals succeed.
          </p>
        </div>

        <div 
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {featuresList.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "feature-card p-8 rounded-xl bg-white border border-gray-100 shadow-sm card-hover transition-all duration-700 transform opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${feature.delay}ms` }}
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-primary/10 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-4">{feature.description}</p>
              <a
                href="#"
                className="inline-flex items-center text-primary font-medium text-sm group"
              >
                Learn more{" "}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
