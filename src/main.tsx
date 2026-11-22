import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router'
import { Layout } from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Contacts from '@/pages/Contacts'
import Pipeline from '@/pages/Pipeline'
import './index.css'

// hash router: works on any static host without rewrite rules
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/contacts', element: <Contacts /> },
      { path: '/pipeline', element: <Pipeline /> },
      { path: '*', element: <Dashboard /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>,
)
