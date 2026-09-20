import { Navigate, createBrowserRouter, createHashRouter } from 'react-router-dom';
import { TwinWorkspace } from '@/twin/TwinWorkspace';
import { NotFound } from '@/pages/NotFound';

/**
 * Routing.
 *
 * The seven original routes are kept — bookmarks, deep links and the alert
 * `route` fields all still resolve — but each one now opens the same digital
 * twin in a different analytical mode rather than a separate page. The old page
 * components are still mounted, as the dossier drawer inside the workspace.
 */

// Hash routing is used only for the static preview build (no server rewrites there).
const createRouter = import.meta.env.VITE_HASH_ROUTER ? createHashRouter : createBrowserRouter;

export const router = createRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <TwinWorkspace mode="command" /> },
  { path: '/quality', element: <TwinWorkspace mode="quality" /> },
  { path: '/production', element: <TwinWorkspace mode="production" /> },
  { path: '/profitability', element: <TwinWorkspace mode="profitability" /> },
  { path: '/simulator', element: <TwinWorkspace mode="simulation" /> },
  { path: '/decision-shadow', element: <TwinWorkspace mode="decision" /> },
  { path: '/confidence', element: <TwinWorkspace mode="confidence" /> },
  { path: '*', element: <NotFound /> },
]);
