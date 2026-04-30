import "./i18n";
import "./styles/design-tokens.css";

import { AppRoutes } from "./AppRoutes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { HelmetProvider } from "react-helmet-async";

import { Toaster } from "@/components/ui/toaster";

import { TooltipProvider } from "@/components/ui/tooltip";

import { Router as WouterRouter } from "wouter";

import { PlayerProvider } from "./components/audio/PlayerContext";

import { SettingsProvider } from "./providers/SettingsProvider";

import { EthiopianCalendarProvider } from "./providers/EthiopianCalendarProvider";

import { AuthProvider } from "./providers/AuthProvider";

import { WishlistProvider } from "./providers/WishlistProvider";

import { GlobalLoginDialog } from "./components/auth/GlobalLoginDialog";

import { ErrorBoundary } from "./components/error/ErrorBoundary";

import { CommandPalette } from "./components/command/CommandPalette";

import { PageLoader } from "./components/loading/PageLoader";

import { useServiceWorker } from "./hooks/useServiceWorker";

import { useWebVitals, usePageTracking } from "./hooks/useAnalytics";

import { useLocation } from "wouter";

const queryClient = new QueryClient();

function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Track page views and web vitals (inside providers)
  usePageTracking(location);
  useWebVitals();

  return <>{children}</>;
}

function App() {
  const { isOnline, updateAvailable, updateServiceWorker } = useServiceWorker();

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
          <EthiopianCalendarProvider>
            <AuthProvider>
              <WishlistProvider>
                <TooltipProvider>
                  <PlayerProvider>
                    <AnalyticsWrapper>
                      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                        <AppRoutes />
                      </WouterRouter>
                      
                      <CommandPalette />
                      <PageLoader />
                      <GlobalLoginDialog />
                      <Toaster />
                      
                      {/* Service worker update notification */}
                      {updateAvailable && (
                        <div className="fixed bottom-4 right-4 z-[9999] bg-primary text-primary-foreground px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                          <span className="text-sm font-medium">New version available</span>
                          <button
                            onClick={updateServiceWorker}
                            className="text-xs bg-primary-foreground text-primary px-3 py-1.5 rounded-lg font-semibold hover:bg-primary-foreground/90"
                          >
                            Update
                          </button>
                        </div>
                      )}
                    </AnalyticsWrapper>
                  </PlayerProvider>
                </TooltipProvider>
              </WishlistProvider>
            </AuthProvider>
          </EthiopianCalendarProvider>
        </SettingsProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

