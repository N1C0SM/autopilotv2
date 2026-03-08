import { Zap, ClipboardList, Dumbbell, Apple, Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <span className="font-display text-xl font-bold text-gradient">FitPlan Pro</span>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log in</Button>
            <Button variant="default" size="sm" onClick={() => navigate("/signup")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Personalized for your goals</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            Your Personalized Training & Nutrition Plan
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Get a custom training and nutrition plan built around your goals, schedule, and preferences. Created by experts, tailored for you.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate("/signup")}>
            Create My Plan
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-14">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Sign Up & Pay", desc: "Create your account and unlock your personalized plan for €29." },
              { step: "02", title: "Tell Us About You", desc: "Complete a quick questionnaire about your goals, body, and preferences." },
              { step: "03", title: "Get Your Plan", desc: "Receive your custom training and nutrition plan crafted by our team." },
            ].map((item) => (
              <div key={item.step} className="bg-card rounded-2xl p-6 card-shadow border border-border">
                <span className="text-4xl font-bold font-display text-gradient">{item.step}</span>
                <h3 className="text-lg font-semibold font-display mt-4 mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-14">What You Get</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-8 card-shadow border border-border">
              <Dumbbell className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold font-display mb-3">Training Plan</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Weekly workout schedule</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Sport-specific sessions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Intensity & duration per day</li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 card-shadow border border-border">
              <Apple className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold font-display mb-3">Nutrition Plan</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Personalized daily macros</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Example meal ideas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Allergy & preference aware</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-14">Why FitPlan Pro?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Expert-Crafted", desc: "Plans made by certified professionals." },
              { icon: TrendingUp, title: "Goal-Oriented", desc: "Built around your specific fitness targets." },
              { icon: ClipboardList, title: "Easy to Follow", desc: "Clear, structured, day-by-day plans." },
            ].map((item) => (
              <div key={item.title} className="bg-card rounded-2xl p-6 border border-border">
                <item.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold font-display mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold font-display mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground mb-10">One payment. Your complete personalized plan.</p>
          <div className="bg-card rounded-3xl p-10 border-2 border-primary card-shadow animate-pulse-glow">
            <div className="text-5xl font-bold font-display text-gradient mb-2">€29</div>
            <p className="text-muted-foreground mb-6">One-time payment</p>
            <ul className="text-left space-y-3 mb-8 text-sm">
              {["Custom training plan", "Custom nutrition plan", "Personalized macros", "Allergy-aware meals", "Weekly workout schedule"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="hero" size="xl" className="w-full" onClick={() => navigate("/signup")}>
              Create My Plan
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <span className="font-display font-bold text-gradient">FitPlan Pro</span> &copy; {new Date().getFullYear()}. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
