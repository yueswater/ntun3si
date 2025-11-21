import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import PageTransition from "./components/PageTransition";
import "./i18n";

// Public layout and pages
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import AuthSuccess from "./pages/AuthSuccess";
import Profile from "./pages/Profile";
import ArticlePage from "./pages/ArticlePage";
import EventPage from "./pages/EventPage";
import ArticlesList from "./pages/ArticlesList";
import EventsList from "./pages/EventsList";
import ISearch from "./pages/ISearch";
import Unsubscribe from "./pages/Unsubscribe";
import Terms from "./pages/policy/terms";

// Admin layout and pages
import AdminLayout from "./layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import ArticleManagement from "./pages/admin/ArticleManagement";
import EventManagement from "./pages/admin/EventManagement";
import MemberManagement from "./pages/admin/MemberManagement";
import FormManagement from "./pages/admin/FormManagement";
import RegistrationManagement from "./pages/admin/RegistrationManagement";

// Error pages
import Error404 from "./pages/Error404";
import Error500 from "./pages/Error500";

/* ----------------------------------------------------------
   Helper component: AdminRoute
   This wrapper ensures that only admin users can access admin routes.
   Non-admin users will be redirected to the "404" page.
----------------------------------------------------------- */
function AdminRoute({ children }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  return isAdmin ? children : <Error404 />;
}

/* ----------------------------------------------------------
   Main Application Component
   Wraps all routes with AuthProvider and BrowserRouter.
----------------------------------------------------------- */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageTransition>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="login" element={<Login />} />
              <Route path="auth/success" element={<AuthSuccess />} />
              <Route path="profile" element={<Profile />} />
              <Route path="articles" element={<ArticlesList />} />
              <Route path="events" element={<EventsList />} />
              <Route path="isearch" element={<ISearch />} />
              <Route path="articles/:slug" element={<ArticlePage />} />
              <Route path="events/:slug" element={<EventPage />} />
              <Route path="unsubscribe" element={<Unsubscribe />} />
              <Route path="/terms" element={<Terms />} />
            </Route>

            {/* Admin Routes (protected by AdminRoute) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<MemberManagement />} />
              <Route path="articles" element={<ArticleManagement />} />
              <Route path="events" element={<EventManagement />} />
              <Route path="forms" element={<FormManagement />} />
              <Route
                path="registrations/:eventUid"
                element={<RegistrationManagement />}
              />
            </Route>

            {/* Error Routes */}
            <Route path="/error/500" element={<Error500 />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </AuthProvider>
  );
}
