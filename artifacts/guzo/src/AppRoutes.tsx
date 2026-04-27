import { Shell } from "@/components/layout/Shell";
import { Switch, Route } from "wouter";
import { Home } from "./pages/Home";
import { Destinations } from "./pages/Destinations";
import { DestinationDetail } from "./pages/DestinationDetail";
import { Map } from "./pages/Map";
import { Marketplace } from "./pages/Marketplace";
import { Mezmurs } from "./pages/Mezmurs";
import { News } from "./pages/News";
import { ChurchDetail } from "./pages/ChurchDetail";
import { MarketplaceDetail } from "./pages/MarketplaceDetail";
import { MarketplaceNew } from "./pages/MarketplaceNew";
import { NewsDetail } from "./pages/NewsDetail";
import { MezmurDetail } from "./pages/MezmurDetail";

import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminDestinations } from "./pages/admin/AdminDestinations";
import { AdminChurches } from "./pages/admin/AdminChurches";
import { AdminMarketplace } from "./pages/admin/AdminMarketplace";
import { AdminMezmurs } from "./pages/admin/AdminMezmurs";
import { AdminNews } from "./pages/admin/AdminNews";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminAudit } from "./pages/admin/AdminAudit";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminQuizzes } from "./pages/admin/AdminQuizzes";
import { AdminQuizEdit } from "./pages/admin/AdminQuizEdit";
import { AdminGuard } from "@/components/auth/AdminGuard";

import { Learn } from "./pages/learn/Learn";
import { QuizDetail } from "./pages/learn/QuizDetail";
import { QuizPlayer } from "./pages/learn/QuizPlayer";
import { QuizResults } from "./pages/learn/QuizResults";
import { Leaderboard } from "./pages/learn/Leaderboard";
import { Challenges } from "./pages/learn/Challenges";

export function AppRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/destinations/:id" component={DestinationDetail} />
        <Route path="/map" component={Map} />
        <Route path="/churches/:id" component={ChurchDetail} />

        <Route path="/marketplace/new" component={MarketplaceNew} />
        <Route path="/marketplace/:id" component={MarketplaceDetail} />
        <Route path="/marketplace" component={Marketplace} />

        <Route path="/mezmurs/:id" component={MezmurDetail} />
        <Route path="/mezmurs" component={Mezmurs} />

        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/news" component={News} />

        {/* Q&A / Learn */}
        <Route path="/learn" component={Learn} />
        <Route path="/learn/leaderboard" component={Leaderboard} />
        <Route path="/learn/challenges" component={Challenges} />
        <Route path="/learn/quizzes/:id" component={QuizDetail} />
        <Route path="/learn/play/:id" component={QuizPlayer} />
        <Route path="/learn/results/:id" component={QuizResults} />

        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/destinations">
          <AdminGuard>
            <AdminDestinations />
          </AdminGuard>
        </Route>
        <Route path="/admin/churches">
          <AdminGuard>
            <AdminChurches />
          </AdminGuard>
        </Route>
        <Route path="/admin/marketplace">
          <AdminGuard>
            <AdminMarketplace />
          </AdminGuard>
        </Route>
        <Route path="/admin/mezmurs">
          <AdminGuard>
            <AdminMezmurs />
          </AdminGuard>
        </Route>
        <Route path="/admin/news">
          <AdminGuard>
            <AdminNews />
          </AdminGuard>
        </Route>
        <Route path="/admin/users">
          <AdminGuard>
            <AdminUsers />
          </AdminGuard>
        </Route>
        <Route path="/admin/audit">
          <AdminGuard>
            <AdminAudit />
          </AdminGuard>
        </Route>
        <Route path="/admin/analytics">
          <AdminGuard>
            <AdminAnalytics />
          </AdminGuard>
        </Route>
        <Route path="/admin/settings">
          <AdminGuard minRole="superadmin">
            <AdminSettings />
          </AdminGuard>
        </Route>
        <Route path="/admin/qa">
          <AdminGuard minRole="moderator">
            <AdminQuizzes />
          </AdminGuard>
        </Route>
        <Route path="/admin/qa/:id">
          <AdminGuard minRole="moderator">
            <AdminQuizEdit />
          </AdminGuard>
        </Route>
      </Switch>
    </Shell>
  );
}
