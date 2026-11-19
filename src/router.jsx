import { createBrowserRouter } from 'react-router'
import App from './App.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { AuthorizedLayout } from './layouts/app/index.js'
import DictionaryLayout, {
  DictionaryIndexRedirect,
} from './pages/Dictionary/DictionaryLayout.jsx'
import IdentifyPage from './pages/Dictionary/IdentifyPage.jsx'
import IdentifyV2Page from './pages/Dictionary/IdentifyV2Page.jsx'
import VesselCallSignsPage from './pages/Dictionary/VesselCallSignsPage.jsx'
import AttributesPage from './pages/Dictionary/AttributesPage.jsx'
import RequirePage from './components/RequirePage.jsx'
import MassSearchIndex from './pages/MassSearch/Index.jsx'
import MassSearchJobShow from './pages/MassSearch/JobShow.jsx'
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  ConfirmPassword,
  VerifyEmail,
} from './layouts/auth/index.js'

export const router = createBrowserRouter([
  {
    element: <App />,
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
              { index: true, element: <Dashboard /> },
              {
                path: 'dictionary',
                element: <RequirePage page="dictionary" />,
                children: [
                  {
                    element: <DictionaryLayout />,
                    children: [
                      { index: true, element: <DictionaryIndexRedirect /> },
                      { path: 'identify', element: <IdentifyPage /> },
                      { path: 'identify-v2', element: <IdentifyV2Page /> },
                      { path: 'subgroup', element: <VesselCallSignsPage /> },
                      { path: 'attributes', element: <AttributesPage /> },
                    ],
                  },
                ],
              },
              {
                path: 'mass-search',
                element: <RequirePage page="mass-search" />,
                children: [
                  { index: true, element: <MassSearchIndex /> },
                  { path: ':jobId', element: <MassSearchJobShow /> },
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