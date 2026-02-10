import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 glass-panel rounded-2xl max-w-md w-full border border-destructive/20">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-white">404</h1>
        <div className="text-xl text-muted-foreground font-light">
           Video segment not found
        </div>

        <Link href="/">
          <Button variant="outline" className="w-full mt-4 border-white/10 hover:bg-white/5">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
