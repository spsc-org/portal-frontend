import type { RouteObject } from "react-router"
import App, { ErrorBoundary } from "./root"
import Home from "./routes/home"

export const routes: RouteObject[] = [
  {
    Component: App,
    ErrorBoundary,
    children: [{ index: true, Component: Home }],
  },
]
