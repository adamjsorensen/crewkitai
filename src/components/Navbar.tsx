
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import AnimatedButton from "./ui-components/AnimatedButton";
import { PaintBucket } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 ease-in-out py-4",
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PaintBucket className="h-8 w-8 text-primary" />
          <span className="font-display text-xl font-semibold">
            CrewkitAI
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="#testimonials"
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Testimonials
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <AnimatedButton
            variant="outline"
            size="sm"
            className="hidden md:flex"
          >
            Sign In
          </AnimatedButton>
          <AnimatedButton size="sm">
            Get Started
          </AnimatedButton>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
