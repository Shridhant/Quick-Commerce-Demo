import type React from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

const AppLayout: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />

          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-border mx-2" />
                <ModeToggle />
              </div>
            </header>

            <main className="flex-1 overflow-auto bg-background">
              <div className="max-w-7xl mx-auto p-6">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default AppLayout
