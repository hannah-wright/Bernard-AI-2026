import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  onStartScouting: () => void;
}

export const Hero = ({ onStartScouting }: HeroProps) => {
  return (
    <section className="relative overflow-hidden">
      <div className="gradient-hero absolute inset-0" />
      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-foreground" />
            <span className="text-sm font-medium">Intelligence that wins deals</span>
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 animate-slide-up"
            style={{ animationDelay: '100ms' }}
          >
            Scout the next unicorn
            <br />
            <span className="text-muted-foreground">before your competition does</span>
          </h1>

          <p
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 animate-slide-up"
            style={{ animationDelay: '200ms' }}
          >
            Real-time funding intelligence. Instant market signals. Zero noise. Built for
            top-tier VCs who demand the edge.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            <Button variant="hero" size="xl" onClick={onStartScouting}>
              Request Access
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="hero-outline" size="xl">
              See live demo
            </Button>
          </div>

          <div
            className="flex items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
              <span>10,000+ startups tracked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              <span>Real-time updates</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              <span>Built for modern VCs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
