import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import { ThemeProvider } from "@/components/theme-provider.tsx";

import App from "./App.tsx";
import { AppSidebar } from "./components/app-sidebar.tsx";
import { SiteHeader } from "./components/site-header.tsx";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar.tsx";
import { AppProvider } from "./context/app-context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar side="left" variant="sidebar" collapsible="offcanvas" />
          <SidebarInset className="h-dvh overflow-hidden">
            <SiteHeader />
            <App />
          </SidebarInset>
        </SidebarProvider>
      </AppProvider>
    </ThemeProvider>
  </StrictMode>
);
