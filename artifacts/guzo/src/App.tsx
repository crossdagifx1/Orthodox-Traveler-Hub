import "./i18n";
import { AppRoutes } from "./AppRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router as WouterRouter } from "wouter";
import { PlayerProvider } from "./components/audio/PlayerContext";
import { SettingsProvider } from "./providers/SettingsProvider";
import { EthiopianCalendarProvider } from "./providers/EthiopianCalendarProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { WishlistProvider } from "./providers/WishlistProvider";
import { GlobalLoginDialog } from "./components/auth/GlobalLoginDialog";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <EthiopianCalendarProvider>
          <AuthProvider>
            <WishlistProvider>
              <TooltipProvider>
                <PlayerProvider>
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <AppRoutes />
                  </WouterRouter>
                  <GlobalLoginDialog />
                  <Toaster />
                </PlayerProvider>
              </TooltipProvider>
            </WishlistProvider>
          </AuthProvider>
        </EthiopianCalendarProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
