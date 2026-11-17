import { createBrowserRouter, Navigate } from 'react-router'
import App from './App.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequirePage from './components/RequirePage.jsx'
import NotFound from './pages/NotFound.jsx'
import EmptyFallback from './components/EmptyFallback.jsx'
import PageError from './pages/PageError.jsx'
import { AuthorizedLayout } from './layouts/app/index.js'
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  ConfirmPassword,
  VerifyEmail,
} from './layouts/auth/index.js'

/**
 * Лінивий route-модуль: кожен розділ — окремий chunk.
 *   page(() => import('./pages/X/Index.jsx'))
 */
const page = (load) => () => load().then((module) => ({ Component: module.default }))


/*
 * URL-и дзеркалять routes/web.php бекенду (Portal). Доступ:
 *  - сторінки під `auth` у web.php      → лише ProtectedRoute;
 *  - сторінки під `pageAccess`          → <RequirePage /> (PageAccess);
 *  - + Gate::authorize у контролері     → <RequirePage gate={{ page, action }} />.
 * Розділи додаються сюди в міру перенесення на MVVM (див. CLAUDE.md).
 */
export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <NotFound />,
    // Поки вантажиться lazy-chunk першої сторінки — порожньо (як і guard-и під час 'loading').
    HydrateFallback: EmptyFallback,
    children: [
      {
        element: <GuestRoute />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: 'forgot-password', element: <ForgotPassword /> },
          { path: 'reset-password/:token', element: <ResetPassword /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AuthorizedLayout />,
            children: [
              {
                // Падіння сторінки не зносить layout (сайдбар лишається).
                errorElement: <PageError />,
                children: [
                  // web.php: '/' → redirect('/welcome')
                  { index: true, element: <Navigate to="/welcome" replace /> },

                  // --- auth ---
                  { path: 'welcome', lazy: page(() => import('./pages/Welcome/Index.jsx')) },
                  { path: 'notifications', lazy: page(() => import('./pages/Notifications/Index.jsx')) },
                  { path: 'settings', lazy: page(() => import('./pages/Settings/Index.jsx')) },
                  { path: 'admin-users', lazy: page(() => import('./pages/Admin/Index.jsx')) },
                  { path: 'admin-groups', lazy: page(() => import('./pages/UserGroup/Index.jsx')) },
                  { path: 'admin-notifications', lazy: page(() => import('./pages/AdminNotifications/Index.jsx')) },
                  { path: 'announcement', handle: { fullBleed: true }, lazy: page(() => import('./pages/Announcement/Index.jsx')) },
                  { path: 'developer-posts', handle: { fullBleed: true }, lazy: page(() => import('./pages/DeveloperPost/Index.jsx')) },
                  { path: 'documentation', lazy: page(() => import('./pages/Documentation/Index.jsx')) },
                  { path: 'documentation/:category', lazy: page(() => import('./pages/Documentation/Index.jsx')) },
                  { path: 'developer-debug', handle: { fullBleed: true }, lazy: page(() => import('./pages/DeveloperDebug/Index.jsx')) },
                  { path: 'develop/dossier', lazy: page(() => import('./pages/Develop/Dossier.jsx')) },
                  { path: 'develop/notifications', lazy: page(() => import('./pages/Develop/Notifications.jsx')) },
                  { path: 'task', lazy: page(() => import('./pages/Task/TaskPage.jsx')) },
                  { path: 'task/projects', lazy: page(() => import('./pages/Task/TaskProjectPage.jsx')) },
                  // web.php: /project/reasonRules — для всіх автентифікованих
                  { path: 'project/reasonRules', lazy: page(() => import('./pages/Project/ReasonRulesPage.jsx')) },

                  // --- pageAccess ---
                  {
                    element: <RequirePage />,
                    children: [
                      { path: 'staff', lazy: page(() => import('./pages/Staff/AttendancePage.jsx')) },
                      { path: 'staff/contracts', lazy: page(() => import('./pages/Staff/ContractsPage.jsx')) },
                      { path: 'staff/responsible', lazy: page(() => import('./pages/Staff/ResponsiblePage.jsx')) },
                      { path: 'audit', lazy: page(() => import('./pages/Audit/Index.jsx')) },
                      { path: 'subject', lazy: page(() => import('./pages/Subject/Index.jsx')) },
                      { path: 'handbook-phones', lazy: page(() => import('./pages/Handbook/PhonesPage.jsx')) },
                      { path: 'handbook-birthdays', lazy: page(() => import('./pages/Handbook/BirthdaysPage.jsx')) },
                      { path: 'integrations-datasets', lazy: page(() => import('./pages/Integrations/DatasetsPage.jsx')) },
                      { path: 'integrations-vessel-imo', lazy: page(() => import('./pages/Integrations/VesselImoPage.jsx')) },
                      { path: 'integrations-export', lazy: page(() => import('./pages/Integrations/ExportPage.jsx')) },
                      { path: 'document', lazy: page(() => import('./pages/Document/Index.jsx')) },
                      { path: 'decree', lazy: page(() => import('./pages/Decree/Index.jsx')) },
                      { path: 'dictionary', lazy: page(() => import('./pages/Dictionary/Index.jsx')) },
                      { path: 'inventory', lazy: page(() => import('./pages/Inventory/Index.jsx')) },
                      { path: 'inventory/nodes', lazy: page(() => import('./pages/Inventory/Nodes.jsx')) },
                      { path: 'proposal', lazy: page(() => import('./pages/Proposal/Index.jsx')) },
                      { path: 'proposal/:id', lazy: page(() => import('./pages/Proposal/pages/ProposalView.jsx')) },
                      { path: 'proposal/:id/minify', lazy: page(() => import('./pages/Proposal/pages/MinifyView.jsx')) },
                      { path: 'dossier', handle: { fullBleed: true }, lazy: page(() => import('./pages/Dossier/Index.jsx')) },
                      { path: 'dossier/tickets', lazy: page(() => import('./pages/Dossier/Tickets.jsx')) },
                      // /project — нова версія списку (колишній /project/v2)
                      { path: 'project', lazy: page(() => import('./pages/Project/Index.jsx')) },
                      { path: 'project/v2', element: <Navigate to="/project" replace /> },
                      { path: 'project/upload/v2', lazy: page(() => import('./pages/ProjectImport/UploadProjectsV2.jsx')) },
                    ],
                  },

                  // --- pageAccess + Gate search.read ---
                  {
                    element: <RequirePage gate={{ page: 'search', action: 'read' }} />,
                    children: [{ path: 'search', lazy: page(() => import('./pages/AdvancedSearch/Index.jsx')) }],
                  },

                  // --- pageAccess + Gate statistic.read ---
                  {
                    element: <RequirePage gate={{ page: 'statistic', action: 'read' }} />,
                    children: [
                      { path: 'statistic', lazy: page(() => import('./pages/Statistic/Index.jsx')) },
                      { path: 'statistic/unrealized/:year/:type', lazy: page(() => import('./pages/Statistic/Unrealized.jsx')) },
                    ],
                  },

                  // --- pageAccess + Gate report.read ---
                  {
                    element: <RequirePage gate={{ page: 'report', action: 'read' }} />,
                    children: [
                      { path: 'report', lazy: page(() => import('./pages/Report/Index.jsx')) },
                      { path: 'report/duplicates', lazy: page(() => import('./pages/Report/Duplicates.jsx')) },
                      { path: 'report/imo-analysis', lazy: page(() => import('./pages/Report/ImoAnalysis.jsx')) },
                      { path: 'report/validation/:report', lazy: page(() => import('./pages/Report/Validation.jsx')) },
                    ],
                  },

                  { path: '*', element: <NotFound /> },
                ],
              },
            ],
          },
          { path: 'confirm-password', element: <ConfirmPassword /> },
          { path: 'verify-email', element: <VerifyEmail /> },
        ],
      },
    ],
  },
])
