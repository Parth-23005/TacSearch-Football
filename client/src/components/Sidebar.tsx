import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, PlaySquare, Settings, LogOut, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Library, label: "Library", href: "/library" }, // Analysis starts from Library
    { icon: PlaySquare, label: "Collections", href: "/collections" },
  ];

  return (
    <div className="flex flex-col h-screen w-64 border-r border-white/5 bg-card/80 backdrop-blur-xl">
      <div className="p-6">
        <h1 className="text-2xl font-bold font-display tracking-wider text-primary flex items-center gap-2">
          <span className="w-2 h-8 bg-primary rounded-full neon-glow"></span>
          TAC<span className="text-white">SEARCH</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-2 pl-4">AI ANALYTICS ENGINE</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${isActive
                    ? "bg-primary/10 text-primary border border-primary/20 neon-glow"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "group-hover:text-primary transition-colors"}`} />
                <span className="font-medium tracking-wide text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <Link href="/settings">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-muted-foreground hover:text-white hover:bg-white/5 mb-2">
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </div>
        </Link>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
