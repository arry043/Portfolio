import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  BrowserRouter as Router,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/navigation/Navbar';
import HomeFooter from './components/home/HomeFooter';
import Container from './components/layout/Container';
import SectionWrapper from './components/layout/SectionWrapper';
import Button from './components/ui/Button';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicAuthRoute from './components/auth/PublicAuthRoute';
import GlobalChatbot from './components/chatbot/GlobalChatbot';
import Login from './pages/Login';
import Register from './pages/Register';
import SSOCallback from './pages/SSOCallback';
import { usePageTracking } from './hooks/usePageTracking';
import useAuthStore from './store/useAuthStore';
import { useEffect } from 'react';
import useBackendAuthSync from './hooks/useBackendAuthSync';
import './index.css';

const Home = lazy(() => import('./pages/Home'));
const ProjectsPage = lazy(() => import('./pages/Projects'));
const ExperiencePage = lazy(() => import('./pages/Experience'));
const GamesPage = lazy(() => import('./pages/Games'));
const CertificatesPage = lazy(() => import('./pages/Certificates'));
const AboutPage = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/Contact'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminResumePage = lazy(() => import('./pages/admin/AdminResumePage'));
const AdminCertificatesPage = lazy(() => import('./pages/admin/AdminCertificatesPage'));
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage'));
const AdminExperiencesPage = lazy(() => import('./pages/admin/AdminExperiencesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

const PageLoading = () => (
  <SectionWrapper className="min-h-[calc(100vh-4rem)] pt-24">
    <Container>
      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="h-4 w-44 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-full animate-pulse rounded bg-zinc-900" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-zinc-900" />
      </div>
    </Container>
  </SectionWrapper>
);

const AuthSync = () => {
  const { syncSession } = useBackendAuthSync();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const syncToken = async () => {
      try {
        await syncSession();
      } catch {
        // Keep backend JWT session as source of truth when sync fails.
        logout();
      }
    };

    syncToken();
  }, [syncSession, logout]);

  return null;
};

const AppShell = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Activate tracking globally
  usePageTracking();

  return (
    <div className="flex min-h-screen flex-col bg-dark-primary font-sans text-text-primary selection:bg-zinc-700/50">
      {!isAdminRoute ? <Navbar /> : null}
      {!isAdminRoute ? <GlobalChatbot /> : null}
      <AuthSync />
      <main className="flex-grow">
        <Suspense fallback={<PageLoading />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/experience" element={<ExperiencePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/ai" element={<Navigate to="/" replace />} />
              <Route element={<PublicAuthRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>
              <Route path="/sso-callback" element={<SSOCallback />} />

              <Route element={<ProtectedRoute />}>
                {/* Reserved for future protected user pages */}
              </Route>

              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="resume" element={<AdminResumePage />} />
                  <Route path="certificates" element={<AdminCertificatesPage />} />
                  <Route path="projects" element={<AdminProjectsPage />} />
                  <Route path="experiences" element={<AdminExperiencesPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                </Route>
                <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>

              <Route
                path="*"
                element={
                  <SectionWrapper className="flex min-h-[calc(100vh-4rem)] items-center justify-center pt-24">
                    <Container>
                      <div className="mx-auto max-w-md space-y-5 text-center">
                        <h1 className="text-3xl font-bold text-white">404</h1>
                        <p className="text-sm text-zinc-400 md:text-[15px]">
                          The location you requested was not found or has been moved securely.
                        </p>
                        <Link to="/">
                          <Button variant="secondary" className="w-full sm:w-auto">
                            Return to Base
                          </Button>
                        </Link>
                      </div>
                    </Container>
                  </SectionWrapper>
                }
              />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      {!isAdminRoute ? <HomeFooter /> : null}
    </div>
  );
};

const App = () => (
  <Router>
    <AppShell />
  </Router>
);

export default App;
