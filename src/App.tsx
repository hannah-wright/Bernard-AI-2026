/**
 * BernardAI Application Root
 * 
 * This is the main entry point for the application.
 * It sets up providers, routing, and global error boundaries.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BillingProvider } from "@/hooks/useBilling";
import { ProfileProvider } from "@/hooks/useProfile";
import { PageErrorBoundary, ErrorBoundary } from "@/components/error/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Billing from "./pages/Billing";
import VCDeals from "./pages/VCDeals";
import StartupLists from "./pages/StartupLists";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Configure React Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long until data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Retry failed requests with exponential backoff
      retry: 2,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

/**
 * Provider stack for the application
 * Order matters: outer providers are initialized first
 */
const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BillingProvider>
        <ProfileProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ProfileProvider>
      </BillingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

/**
 * Main application component
 */
const App = () => (
  <PageErrorBoundary>
    <AppProviders>
      {/* Toast notifications */}
      <Toaster />
      <Sonner />
      
      {/* Router and routes */}
      <BrowserRouter>
        <Routes>
          {/* Main dashboard */}
          <Route 
            path="/" 
            element={
              <ErrorBoundary>
                <Index />
              </ErrorBoundary>
            } 
          />
          
          {/* Authentication */}
          <Route 
            path="/auth" 
            element={
              <ErrorBoundary>
                <Auth />
              </ErrorBoundary>
            } 
          />
          
          {/* Password Reset */}
          <Route 
            path="/auth/reset-password" 
            element={
              <ErrorBoundary>
                <ResetPassword />
              </ErrorBoundary>
            } 
          />
          
          {/* Billing & subscription management */}
          <Route 
            path="/billing" 
            element={
              <ErrorBoundary>
                <Billing />
              </ErrorBoundary>
            } 
          />
          
          {/* VC Deal Intelligence */}
          <Route 
            path="/vc-deals" 
            element={
              <ErrorBoundary>
                <VCDeals />
              </ErrorBoundary>
            } 
          />
          
          {/* Startup Lists */}
          <Route 
            path="/lists" 
            element={
              <ErrorBoundary>
                <StartupLists />
              </ErrorBoundary>
            } 
          />
          <Route 
            path="/lists/:listId" 
            element={
              <ErrorBoundary>
                <StartupLists />
              </ErrorBoundary>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          
          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  </PageErrorBoundary>
);

export default App;
