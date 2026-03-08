import { useNavigate, useLocation } from "react-router-dom";
import { Dumbbell, BarChart3, MessageCircle, Settings, Home } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { path: "/dashboard", icon: Home, label: "Inicio" },
  { path: "/dashboard#training", icon: Dumbbell, label: "Plan" },
  { path: "/dashboard#chat", icon: MessageCircle, label: "Chat" },
  { path: "/settings", icon: Settings, label: "Ajustes" },
];

interface Props {
  activeSection?: string;
  onNavigateSection?: (section: string) => void;
}

const MobileNav = ({ activeSection = "home", onNavigateSection }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTap = (tab: typeof tabs[0]) => {
    if (tab.path === "/settings") {
      navigate("/settings");
      return;
    }
    const section = tab.path.split("#")[1] || "home";
    onNavigateSection?.(section);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const section = tab.path.split("#")[1] || (tab.path === "/settings" ? "settings" : "home");
            const isActive = tab.path === "/settings" 
              ? location.pathname === "/settings" 
              : activeSection === section;

            return (
              <button
                key={tab.label}
                onClick={() => handleTap(tab)}
                className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-0.5 w-8 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <tab.icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
