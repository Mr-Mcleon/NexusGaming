import { Cloud, Monitor, Gamepad2, Zap, Globe, Cpu, HardDrive, Wifi, Play, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const cloudGames = [
  { id: "1", title: "Cyber Odyssey 2077", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=500&fit=crop", quality: "4K Ultra" },
  { id: "2", title: "Stellar Wars", image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=500&fit=crop", quality: "1080p High" },
  { id: "3", title: "Neon Racer X", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=500&fit=crop", quality: "4K Ultra" },
  { id: "4", title: "Dark Horizon", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0c?w=400&h=500&fit=crop", quality: "1440p High" },
];

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["720p streaming", "2 hours/day", "Standard servers", "Basic support"],
    color: "from-muted to-muted/50",
  },
  {
    id: "pro",
    name: "Pro",
    price: 9.99,
    features: ["1080p 60fps", "Unlimited play", "Priority servers", "Cloud saves", "No ads"],
    color: "from-primary/30 to-primary/10",
    popular: true,
  },
  {
    id: "ultra",
    name: "Ultra",
    price: 19.99,
    features: ["4K 120fps", "Unlimited play", "Dedicated servers", "Cloud PC access", "RTX support", "Priority support"],
    color: "from-accent/30 to-accent/10",
  },
];

export const CloudSection = () => {
  return (
    <div className="h-full overflow-y-auto scrollbar-gaming">
      {/* Hero */}
      <div className="relative overflow-hidden p-4 md:p-8 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Cloud className="w-5 h-5" />
            <span className="font-medium">Cloud Gaming</span>
          </div>
          
          <h1 className="font-display text-2xl md:text-4xl lg:text-6xl font-bold mb-4">
            Play Anywhere, <span className="gradient-text">Anytime</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Stream your favorite games on any device without downloads. Powered by cutting-edge cloud technology.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Button variant="gaming" size="xl">
              <Play className="w-5 h-5" />
              Start Playing
            </Button>
            <Button variant="glass" size="xl">
              View Plans
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          {[
            { icon: Gamepad2, label: "Games Available", value: "500+" },
            { icon: Globe, label: "Server Regions", value: "12" },
            { icon: Wifi, label: "Avg Latency", value: "20ms" },
            { icon: Monitor, label: "Max Resolution", value: "4K" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 rounded-xl text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="font-display text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-8">
        {/* Cloud Ready Games */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Cloud Ready</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cloudGames.map((game) => (
              <div 
                key={game.id}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img 
                    src={game.image} 
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs backdrop-blur-sm">
                  <Cloud className="w-3 h-3" />
                  {game.quality}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-medium mb-2">{game.title}</h3>
                  <Button variant="gaming" size="sm" className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4" />
                    Stream Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cloud PC */}
        <section className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-r from-accent/10 via-primary/5 to-transparent border border-accent/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-accent mb-3">
                <Cpu className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Cloud PC</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-3">
                Your High-End PC in the Cloud
              </h2>
              <p className="text-muted-foreground mb-6">
                Access a powerful Windows PC with RTX graphics from any device. Perfect for gaming, creative work, or anything else.
              </p>
              <ul className="space-y-3 mb-6">
                {["RTX 4090 GPU", "32GB RAM", "500GB NVMe SSD", "Windows 11 Pro"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="gaming" size="lg">
                <Monitor className="w-5 h-5" />
                Launch Cloud PC
              </Button>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50">
              <img 
                src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=450&fit=crop"
                alt="Cloud PC"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-online animate-pulse" />
                  Ready to connect
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-muted-foreground">Unlock the full power of cloud gaming</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={cn(
                  "relative rounded-2xl p-6 bg-gradient-to-b border",
                  plan.color,
                  plan.popular ? "border-primary" : "border-border/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        plan.popular ? "bg-primary" : "bg-muted-foreground"
                      )} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.popular ? "gaming" : "glass"} 
                  className="w-full"
                >
                  {plan.price === 0 ? "Start Free" : "Subscribe"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
