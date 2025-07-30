import React, { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RouteLoader } from "@/components/ui/RouteLoader";

// Lazy load all components for better performance
const Landing = lazy(() => import("@/pages/Landing"));
const GuestBrowse = lazy(() => import("@/pages/GuestBrowse"));
const Index = lazy(() => import("@/pages/Index"));
const Profile = lazy(() => import("@/pages/Profile"));
const Discover = lazy(() => import("@/pages/Discover"));
const CreatePost = lazy(() => import("@/pages/CreatePost"));
const Settings = lazy(() => import("@/pages/Settings"));
const Business = lazy(() => import("@/pages/Business"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const SalonProfile = lazy(() => import("@/pages/SalonProfile"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Messages = lazy(() => import("@/pages/Messages"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const HashtagFeed = lazy(() => import("@/pages/HashtagFeed"));
const FollowList = lazy(() => import("@/pages/FollowList"));
const PrivacySettings = lazy(() => import("@/pages/PrivacySettings"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const SalonDashboard = lazy(() => import("@/pages/SalonDashboard"));
const SalonSetup = lazy(() => import("@/pages/SalonSetup"));
const SalonAuth = lazy(() => import("@/pages/SalonAuth"));
const Camera = lazy(() => import("@/pages/Camera"));
const ProfileSetup = lazy(() => import("@/pages/ProfileSetup"));
const NailDesigner = lazy(() => import("@/pages/NailDesigner"));
const FirebaseDemo = lazy(() => import("@/pages/FirebaseDemo"));

// Route configuration for better maintainability
interface RouteConfig {
  path: string;
  element: React.ComponentType;
  requireAuth: boolean;
  fallback?: React.ReactNode;
}

const publicRoutes: RouteConfig[] = [
  { path: "/", element: Landing, requireAuth: false },
  { path: "/browse", element: GuestBrowse, requireAuth: false },
  { path: "/login", element: Login, requireAuth: false },
  { path: "/signup", element: Signup, requireAuth: false },
  { path: "/forgot-password", element: ForgotPassword, requireAuth: false },
  { path: "/privacy-policy", element: PrivacyPolicy, requireAuth: false },
  { path: "/terms-of-service", element: TermsOfService, requireAuth: false },
  { path: "/help-center", element: HelpCenter, requireAuth: false },
  { path: "/salon-auth", element: SalonAuth, requireAuth: false },
  { path: "/profile-setup", element: ProfileSetup, requireAuth: false },
];

const protectedRoutes: RouteConfig[] = [
  { path: "/feed", element: Index, requireAuth: true },
  { path: "/profile", element: Profile, requireAuth: true },
  { path: "/user/:userId", element: Profile, requireAuth: true },
  { path: "/discover", element: Discover, requireAuth: true },
  { path: "/camera", element: Camera, requireAuth: true },
  { path: "/create", element: CreatePost, requireAuth: true },
  { path: "/settings", element: Settings, requireAuth: true },
  { path: "/business", element: Business, requireAuth: true },
  { path: "/salon/:id", element: SalonProfile, requireAuth: true },
  { path: "/edit-profile", element: EditProfile, requireAuth: true },
  { path: "/notifications", element: Notifications, requireAuth: true },
  { path: "/messages", element: Messages, requireAuth: true },
  { path: "/search", element: SearchResults, requireAuth: true },
  { path: "/hashtag/:hashtag", element: HashtagFeed, requireAuth: true },
  { path: "/user/:userId/follow", element: FollowList, requireAuth: true },
  { path: "/privacy-settings", element: PrivacySettings, requireAuth: true },
  { path: "/favorites", element: Favorites, requireAuth: true },
  { path: "/nail-designer", element: NailDesigner, requireAuth: true },
  { path: "/salon-setup", element: SalonSetup, requireAuth: true },
  { path: "/salon-dashboard", element: SalonDashboard, requireAuth: true },
  { 
    path: "/firebase-demo", 
    element: FirebaseDemo, 
    requireAuth: true,
    fallback: <div className="p-8 text-center">Loading Firebase Demo...</div>
  },
];

const LazyRoute: React.FC<{
  Component: React.ComponentType;
  requireAuth: boolean;
  fallback?: React.ReactNode;
}> = ({ Component, requireAuth, fallback }) => {
  const element = (
    <React.Suspense fallback={fallback || <RouteLoader />}>
      <Component />
    </React.Suspense>
  );

  return requireAuth ? (
    <AuthGuard>{element}</AuthGuard>
  ) : (
    <AuthGuard requireAuth={false}>{element}</AuthGuard>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      {publicRoutes.map(({ path, element: Component, requireAuth, fallback }) => (
        <Route
          key={path}
          path={path}
          element={
            <LazyRoute
              Component={Component}
              requireAuth={requireAuth}
              fallback={fallback}
            />
          }
        />
      ))}

      {/* Protected routes */}
      {protectedRoutes.map(({ path, element: Component, requireAuth, fallback }) => (
        <Route
          key={path}
          path={path}
          element={
            <LazyRoute
              Component={Component}
              requireAuth={requireAuth}
              fallback={fallback}
            />
          }
        />
      ))}

      {/* Catch-all route - must be last */}
      <Route
        path="*"
        element={
          <React.Suspense fallback={<RouteLoader />}>
            <NotFound />
          </React.Suspense>
        }
      />
    </Routes>
  );
};