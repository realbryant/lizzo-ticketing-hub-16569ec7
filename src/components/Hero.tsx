import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-headphones.jpg";

const Hero = () => {
  const scrollToEvents = () => {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Concert experience"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[hsl(var(--hero-overlay))]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-accent-foreground animate-fade-in">
            Welcome to{" "}
            <span className="text-primary inline-flex items-center gap-2">
              LIZzo
            </span>{" "}
            Ticketing App
          </h1>
          
          <p className="text-lg md:text-xl text-accent-foreground/80 max-w-2xl mx-auto animate-fade-in animation-delay-200">
            Your gateway to unforgettable experiences. Get instant access to the hottest events.
          </p>

          <div className="animate-fade-in animation-delay-300">
            <Button
              variant="hero"
              onClick={scrollToEvents}
              className="group"
            >
              Get Tickets
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-accent-foreground/50 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-accent-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
