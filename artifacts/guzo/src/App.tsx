import { AppRoutes } from "./AppRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router as WouterRouter } from "wouter";
import { PlayerProvider } from "./components/audio/PlayerContext";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlayerProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </PlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
