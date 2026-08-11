import { Outlet } from 'react-router'
import './assets/app.css'
import { AuthProvider } from './context/AuthContext.jsx'

function App() {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    )
}

export default App
