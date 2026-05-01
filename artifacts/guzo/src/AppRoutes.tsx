import { Suspense, lazy } from "react";
import { Shell } from "@/components/layout/Shell";
import { Switch, Route } from "wouter";
import { SuspenseFallback } from "@/components/loading/PageLoader";
import { AdminGuard } from "@/components/auth/AdminGuard";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const Destinations = lazy(() => import("./pages/Destinations").then(m => ({ default: m.Destinations })));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail").then(m => ({ default: m.DestinationDetail })));
const Map = lazy(() => import("./pages/Map").then(m => ({ default: m.Map })));
const Marketplace = lazy(() => import("./pages/Marketplace").then(m => ({ default: m.Marketplace })));
const MarketplaceDetail = lazy(() => import("./pages/MarketplaceDetail").then(m => ({ default: m.MarketplaceDetail })));
const MarketplaceNew = lazy(() => import("./pages/MarketplaceNew").then(m => ({ default: m.MarketplaceNew })));
const Mezmurs = lazy(() => import("./pages/Mezmurs").then(m => ({ default: m.Mezmurs })));
const MezmurDetail = lazy(() => import("./pages/MezmurDetail").then(m => ({ default: m.MezmurDetail })));
const News = lazy(() => import("./pages/News").then(m => ({ default: m.News })));
const NewsDetail = lazy(() => import("./pages/NewsDetail").then(m => ({ default: m.NewsDetail })));
const ChurchDetail = lazy(() => import("./pages/ChurchDetail").then(m => ({ default: m.ChurchDetail })));
const Prayers = lazy(() => import("./pages/Prayers").then(m => ({ default: m.Prayers })));
const PrayerDetail = lazy(() => import("./pages/PrayerDetail").then(m => ({ default: m.PrayerDetail })));
const Itineraries = lazy(() => import("./pages/Itineraries").then(m => ({ default: m.Itineraries })));
const ItineraryDetail = lazy(() => import("./pages/ItineraryDetail").then(m => ({ default: m.ItineraryDetail })));

const MeProfile = lazy(() => import("./pages/profile/Me").then(m => ({ default: m.MeProfile })));
const PublicProfile = lazy(() => import("./pages/profile/PublicProfile").then(m => ({ default: m.PublicProfile })));
const SellerStore = lazy(() => import("./pages/market/SellerStore").then(m => ({ default: m.SellerStore })));
const SellerDashboard = lazy(() => import("./pages/market/SellerDashboard").then(m => ({ default: m.SellerDashboard })));

const Learn = lazy(() => import("./pages/learn/Learn").then(m => ({ default: m.Learn })));
const QuizDetail = lazy(() => import("./pages/learn/QuizDetail").then(m => ({ default: m.QuizDetail })));
const QuizPlayer = lazy(() => import("./pages/learn/QuizPlayer").then(m => ({ default: m.QuizPlayer })));
const QuizResults = lazy(() => import("./pages/learn/QuizResults").then(m => ({ default: m.QuizResults })));
const Leaderboard = lazy(() => import("./pages/learn/Leaderboard").then(m => ({ default: m.Leaderboard })));
const Challenges = lazy(() => import("./pages/learn/Challenges").then(m => ({ default: m.Challenges })));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminDestinations = lazy(() => import("./pages/admin/AdminDestinations").then(m => ({ default: m.AdminDestinations })));
const AdminChurches = lazy(() => import("./pages/admin/AdminChurches").then(m => ({ default: m.AdminChurches })));
const AdminMarketplace = lazy(() => import("./pages/admin/AdminMarketplace").then(m => ({ default: m.AdminMarketplace })));
const AdminMezmurs = lazy(() => import("./pages/admin/AdminMezmurs").then(m => ({ default: m.AdminMezmurs })));
const AdminNews = lazy(() => import("./pages/admin/AdminNews").then(m => ({ default: m.AdminNews })));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit").then(m => ({ default: m.AdminAudit })));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings").then(m => ({ default: m.AdminSettings })));
const AdminQuizzes = lazy(() => import("./pages/admin/AdminQuizzes").then(m => ({ default: m.AdminQuizzes })));
const AdminQuizEdit = lazy(() => import("./pages/admin/AdminQuizEdit").then(m => ({ default: m.AdminQuizEdit })));

function LazyRoute({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType<any>> }) {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Component />
    </Suspense>
  );
}

export function AppRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/">{() => <LazyRoute component={Home} />}</Route>
        <Route path="/destinations">{() => <LazyRoute component={Destinations} />}</Route>
        <Route path="/destinations/:id">{() => <LazyRoute component={DestinationDetail} />}</Route>
        <Route path="/map">{() => <LazyRoute component={Map} />}</Route>
        <Route path="/churches/:id">{() => <LazyRoute component={ChurchDetail} />}</Route>

        <Route path="/marketplace/new">{() => <LazyRoute component={MarketplaceNew} />}</Route>
        <Route path="/marketplace/:id">{() => <LazyRoute component={MarketplaceDetail} />}</Route>
        <Route path="/marketplace">{() => <LazyRoute component={Marketplace} />}</Route>
        <Route path="/market/seller/:id">{() => <LazyRoute component={SellerStore} />}</Route>
        <Route path="/market/dashboard">{() => <LazyRoute component={SellerDashboard} />}</Route>

        <Route path="/mezmurs/:id">{() => <LazyRoute component={MezmurDetail} />}</Route>
        <Route path="/mezmurs">{() => <LazyRoute component={Mezmurs} />}</Route>

        <Route path="/news/:id">{() => <LazyRoute component={NewsDetail} />}</Route>
        <Route path="/news">{() => <LazyRoute component={News} />}</Route>

        <Route path="/prayers/:id">{() => <LazyRoute component={PrayerDetail} />}</Route>
        <Route path="/prayers">{() => <LazyRoute component={Prayers} />}</Route>

        <Route path="/itineraries/:id">{() => <LazyRoute component={ItineraryDetail} />}</Route>
        <Route path="/itineraries">{() => <LazyRoute component={Itineraries} />}</Route>

        {/* Profiles */}
        <Route path="/me">{() => <LazyRoute component={MeProfile} />}</Route>
        <Route path="/u/:id">{() => <LazyRoute component={PublicProfile} />}</Route>

        {/* Q&A / Learn */}
        <Route path="/learn">{() => <LazyRoute component={Learn} />}</Route>
        <Route path="/learn/leaderboard">{() => <LazyRoute component={Leaderboard} />}</Route>
        <Route path="/learn/challenges">{() => <LazyRoute component={Challenges} />}</Route>
        <Route path="/learn/quizzes/:id">{() => <LazyRoute component={QuizDetail} />}</Route>
        <Route path="/learn/play/:id">{() => <LazyRoute component={QuizPlayer} />}</Route>
        <Route path="/learn/results/:id">{() => <LazyRoute component={QuizResults} />}</Route>

        <Route path="/admin">{() => <LazyRoute component={AdminDashboard} />}</Route>
        <Route path="/admin/destinations">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminDestinations} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/churches">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminChurches} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/marketplace">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminMarketplace} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/mezmurs">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminMezmurs} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/news">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminNews} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/users">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminUsers} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/audit">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminAudit} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/analytics">
          {() => (
            <AdminGuard>
              <LazyRoute component={AdminAnalytics} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/settings">
          {() => (
            <AdminGuard minRole="superadmin">
              <LazyRoute component={AdminSettings} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/qa">
          {() => (
            <AdminGuard minRole="moderator">
              <LazyRoute component={AdminQuizzes} />
            </AdminGuard>
          )}
        </Route>
        <Route path="/admin/qa/:id">
          {() => (
            <AdminGuard minRole="moderator">
              <LazyRoute component={AdminQuizEdit} />
            </AdminGuard>
          )}
        </Route>
      </Switch>
    </Shell>
  );
}
