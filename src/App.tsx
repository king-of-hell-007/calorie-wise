import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import Analytics from "./pages/Analytics";
import MealTemplates from "./pages/MealTemplates";
import Recipes from "./pages/Recipes";
import Friends from "./pages/Friends";
import Leaderboard from "./pages/Leaderboard";
import Challenges from "./pages/Challenges";
import WaterTracker from "./pages/WaterTracker";
import BarcodeScanner from "./pages/BarcodeScanner";
import SmartInsights from "./pages/SmartInsights";
import Progress from "./pages/Progress";
import Badges from "./pages/Badges";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

import { Layout } from "./components/Layout";
import { applyTheme, getStoredTheme } from "@/lib/themes";

const queryClient = new QueryClient();

function App() {
  // Initialize theme on app startup
  useEffect(() => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/analyze" element={<Layout><Analyze /></Layout>} />
            <Route path="/analytics" element={<Layout title="Analytics"><Analytics /></Layout>} />
            <Route path="/templates" element={<Layout title="Meal Templates"><MealTemplates /></Layout>} />
            <Route path="/recipes" element={<Layout title="My Recipes"><Recipes /></Layout>} />
            <Route path="/friends" element={<Layout title="Friends"><Friends /></Layout>} />
            <Route path="/leaderboard" element={<Layout title="Leaderboard"><Leaderboard /></Layout>} />
            <Route path="/challenges" element={<Layout title="Challenges"><Challenges /></Layout>} />
            <Route path="/water" element={<Layout title="Water Tracker"><WaterTracker /></Layout>} />
            <Route path="/barcode" element={<Layout title="Barcode Scanner"><BarcodeScanner /></Layout>} />
            <Route path="/insights" element={<Layout title="Smart Insights"><SmartInsights /></Layout>} />
            <Route path="/progress" element={<Layout title="Your Progress"><Progress /></Layout>} />
            <Route path="/badges" element={<Layout title="Your Badges"><Badges /></Layout>} />
            <Route path="/profile" element={<Layout title="Your Profile"><Profile /></Layout>} />
            <Route path="/settings" element={<Layout title="Settings"><Settings /></Layout>} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

