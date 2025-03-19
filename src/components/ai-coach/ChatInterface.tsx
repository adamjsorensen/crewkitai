import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  RefreshCw, 
  HistoryIcon, 
  Sparkles, 
  LightbulbIcon 
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import { Card } from '@/components/ui/card';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const EXAMPLE_QUESTIONS = [
  "How do I price a 2,000 sq ft exterior job?",
  "What's the best way to handle a difficult client?",
  "How can I improve my crew's efficiency?",
  "What marketing strategies work during slow seasons?",
];

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your AI Coach for the painting industry. How can I help you today? Ask me about pricing jobs, managing clients, leading crews, or marketing strategies.",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      setTimeout(() => {
        const aiResponse: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: getMockResponse(input),
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message} 
            />
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 p-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>AI Coach is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground mb-3">Try asking about:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EXAMPLE_QUESTIONS.map((question, index) => (
              <Button 
                key={index} 
                variant="outline" 
                className="justify-start text-left h-auto py-2 px-3 text-sm"
                onClick={() => handleExampleClick(question)}
              >
                <LightbulbIcon className="h-4 w-4 mr-2 text-primary" />
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="border-t p-4 bg-background">
        <div className="flex space-x-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Coach anything about your painting business..."
            className="resize-none min-h-[60px]"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          AI-powered advice tailored for painting professionals
        </p>
      </div>
    </div>
  );
};

const getMockResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('price') || lowerInput.includes('quote') || lowerInput.includes('estimate')) {
    return "For pricing a 2,000 sq ft exterior job, I recommend using the industry standard of $1.50-$3.50 per square foot, depending on several factors:\n\n1. Surface condition: Add 15-20% for heavy prep work\n2. Paint quality: Premium paints cost more but last longer\n3. Accessibility: Add 10-15% for difficult access\n4. Your local market rates\n\nFor this job, a baseline estimate would be $3,000-7,000. Always add a 10% buffer for unexpected issues. Would you like me to break down these costs in more detail?";
  }
  
  if (lowerInput.includes('client') || lowerInput.includes('customer')) {
    return "Handling difficult clients requires a combination of clear communication and professional boundaries. Here's my advice:\n\n1. Listen actively to their concerns without interrupting\n2. Document everything in writing - especially change requests\n3. Set clear expectations from the beginning with a detailed contract\n4. Offer solutions rather than focusing on problems\n5. Know when to walk away - some clients aren't worth the stress\n\nRemember, difficult clients often simply want to feel heard and respected. Would you like specific phrases you can use when dealing with common client complaints?";
  }
  
  if (lowerInput.includes('crew') || lowerInput.includes('team') || lowerInput.includes('staff')) {
    return "To improve crew efficiency, focus on these five areas:\n\n1. Morning planning: Start each day with a 10-minute huddle to set clear goals\n2. Proper sequencing: Ensure prep, painting, and cleanup crews are properly staggered\n3. Material staging: Have all supplies organized and accessible before work begins\n4. Skills matching: Assign tasks based on individual strengths\n5. Recognition: Acknowledge good work and offer performance-based incentives\n\nMany painting contractors have increased productivity by 20-30% by implementing these practices. What specific efficiency challenges is your crew facing?";
  }
  
  if (lowerInput.includes('marketing') || lowerInput.includes('advertis') || lowerInput.includes('lead')) {
    return "For marketing during slow seasons (typically winter in most regions), try these targeted approaches:\n\n1. Interior painting promotions with seasonal discounts (10-15% off)\n2. Maintenance packages for previous clients\n3. Partner with complementary businesses (realtors, interior designers)\n4. Content marketing showing 'before/after' transformations on social media\n5. Early-bird specials for spring/summer projects booked during winter\n\nLocal SEO is also crucial - ensure your Google Business Profile is optimized with winter-specific services highlighted. Would you like me to suggest a specific 3-month winter marketing plan?";
  }
  
  return "Thanks for your question about " + input + ". That's an important aspect of running a successful painting business. While I'm currently in demo mode with limited responses, in the full version I'll provide detailed, customized advice specific to your situation, drawing from industry best practices and data. Is there a particular aspect of this topic you'd like to focus on?";
};

export default ChatInterface;
