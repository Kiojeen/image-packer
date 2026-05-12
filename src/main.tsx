import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar.tsx"
import { AppSidebar } from "./components/app-sidebar.tsx"
import { AppProvider } from "./context/app-context.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <AppProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <App />
            </SidebarInset>
          </SidebarProvider>
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
