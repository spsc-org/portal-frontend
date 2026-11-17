import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import './lib/http.js'
import './lib/echo.js'
import './index.css'
import { router } from './router.jsx'
import { queryClient } from './lib/queryClient.js'
import { StoreProvider } from './stores/StoreContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </QueryClientProvider>
  </StrictMode>,
)
