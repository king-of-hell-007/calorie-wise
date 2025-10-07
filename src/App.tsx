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
import Progress from "./pages/Progress";
import Badges from "./pages/Badges";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
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
          <Route path="/progress" element={<Layout title="Your Progress"><Progress /></Layout>} />
          <Route path="/badges" element={<Layout title="Your Badges"><Badges /></Layout>} />
          <Route path="/profile" element={<Layout title="Your Profile"><Profile /></Layout>} />
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

export default App;
