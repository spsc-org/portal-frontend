import { createBrowserRouter } from 'react-router'
import App from './App.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { AuthorizedLayout } from './layouts/app/index.js'
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
            children: [{ index: true, element: <Dashboard /> }],
          },
          { path: 'confirm-password', element: <ConfirmPassword /> },
          { path: 'verify-email', element: <VerifyEmail /> },
        ],
      },
    ],
  },
])