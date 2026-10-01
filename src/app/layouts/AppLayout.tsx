import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileTabBar } from "./MobileTabBar";
import { SidebarProvider } from "./sidebarContext";
import { PageLoader } from "@/shared/components/Skeleton";

export function AppLayout() {
  return (
    <SidebarProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="flex h-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          {/* pb-28 below md clears the fixed tab bar and a FAB above it. */}
          <main
            id="main"
            tabIndex={-1}
            className="flex-1 overflow-auto bg-background px-4 pb-28 pt-5 outline-none md:px-8 md:pb-10 md:pt-7"
          >
            <div className="mx-auto w-full max-w-[1280px]">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>
        <MobileTabBar />
      </div>
    </SidebarProvider>
  );
}
