import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import AppDashboard from "./pages/AppDashboard";
import AdminPanel from "./pages/AdminPanel";
import Bookings from "./pages/Bookings";
import Contacts from "./pages/Contacts";
import Settings from "./pages/Settings";
import GetStarted from "./pages/GetStarted";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Billing from "./pages/Billing";
import Login from "./pages/Login";
import ForTeams from "./pages/ForTeams";
import PartnerStarter from "./pages/PartnerStarter";
import AgentCommandCenter from "./pages/AgentCommandCenter";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Home} />
      <Route path="/app" component={AppDashboard} />
      <Route path="/app/agents" component={AgentCommandCenter} />
      <Route path="/app/bookings" component={Bookings} />
      <Route path="/app/contacts" component={Contacts} />
      <Route path="/app/settings" component={Settings} />
      <Route path="/app/billing" component={Billing} />
      <Route path="/app/checkout-success" component={CheckoutSuccess} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/for-teams-enterprises" component={ForTeams} />
      <Route path="/partner-starter" component={PartnerStarter} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
