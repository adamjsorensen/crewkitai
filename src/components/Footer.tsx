
import React from "react";
import { PaintBucket } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 md:py-16">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <PaintBucket className="h-7 w-7 text-primary" />
              <span className="font-display text-xl font-semibold">
                CrewkitAI
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Intelligent software built specifically for painting professionals.
            </p>
            <div className="flex space-x-4">
              {["Facebook", "Twitter", "LinkedIn", "Instagram"].map((social, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  {social.charAt(0)}
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              {["Features", "Pricing", "Use Cases", "Integrations", "Updates"].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              {["Help Center", "Documentation", "Tutorials", "Blog", "Community"].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              {["About", "Careers", "Contact", "Privacy", "Terms"].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} CrewkitAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
