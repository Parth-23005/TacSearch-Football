import { motion } from "framer-motion";
import { ArrowRight, Search, Zap, Shield, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState } from "react";

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-8 bg-primary rounded-full neon-glow" />
          <span className="text-2xl font-bold font-display tracking-widest text-white">
            TAC<span className="text-primary">SEARCH</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-white/70 hover:text-primary transition-colors hidden md:block">Features</a>
          <a href="#pricing" className="text-sm font-medium text-white/70 hover:text-primary transition-colors hidden md:block">Pricing</a>
          <Button variant="neon" className="font-bold" onClick={() => setShowAuth(true)}>
            LOGIN / REGISTER
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="container mx-auto text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary tracking-widest uppercase">AI-Powered Analytics V2.0 Live</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tight text-white mb-8 leading-tight">
              DECODE THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary text-glow">BEAUTIFUL GAME</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Instantly search, analyze, and visualize football tactics using computer vision.
              Find every counter-attack, defensive error, and set-piece in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto neon-glow-hover" onClick={() => setShowAuth(true)}>
                Start Analysis <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto border-white/20 text-white hover:bg-white/5">
                <PlayCircle className="mr-2 w-5 h-5" /> Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative mx-auto max-w-4xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="glass-panel p-2 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              {/* Unsplash abstract tech/sports image */}
              {/* A futuristic dashboard mockup or abstract representation */}
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                alt="Analytics Dashboard Interface"
                className="w-full h-auto rounded-lg opacity-80"
              />

              {/* Floating UI Elements for effect */}
              <div className="absolute top-1/4 left-10 glass-panel p-4 rounded-lg hidden md:block animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Speed</div>
                    <div className="font-mono font-bold text-white">32.4 km/h</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/3 right-10 glass-panel p-4 rounded-lg hidden md:block animate-bounce duration-[4000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Defense Line</div>
                    <div className="font-mono font-bold text-white">High Press</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-black/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-display text-white mb-4">ENGINEERED FOR <span className="text-primary">VICTORY</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our computer vision models process match footage in real-time to give you the competitive edge.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Semantic Search", desc: "Search for 'counter attack right wing' and find every instance instantly." },
              { icon: Zap, title: "Real-time Processing", desc: "Upload match footage and get actionable insights within minutes." },
              { icon: Shield, title: "Tactical Patterns", desc: "Identify opponent formations and defensive weaknesses automatically." }
            ].map((feature, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
