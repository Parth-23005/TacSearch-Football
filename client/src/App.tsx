import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import Library from "@/pages/Library";
import Collections from "@/pages/Collections";
import VideoAnalysis from "@/pages/VideoAnalysis";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a192f]">
        <Loader2 className="h-8 w-8 animate-spin text-[#64ffda]" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/landing" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a192f]">
        <Loader2 className="h-8 w-8 animate-spin text-[#64ffda]" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/landing" component={Landing} />

      {/* If logged in, / goes to Dashboard, else Landing */}
      <Route path="/">
        {user ? <Dashboard /> : <Landing />}
      </Route>

      <Route path="/library">
        <ProtectedRoute component={Library} />
      </Route>
      <Route path="/analysis/:id">
        <ProtectedRoute component={VideoAnalysis} />
      </Route>
      <Route path="/collections">
        <ProtectedRoute component={Collections} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
