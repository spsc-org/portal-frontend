import { createBrowserRouter } from 'react-router'
import App from './App.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LoginPage from './pages/auth/index.jsx'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <GuestRoute />,
        children: [{ path: 'login', element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [{ index: true, element: <Dashboard /> }],
      },
    ],
  },
])