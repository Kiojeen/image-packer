import { ThemeToggle } from "./theme-toggle";
import { SidebarTrigger } from "./ui/sidebar";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b bg-card px-4">
      <SidebarTrigger />
      <ThemeToggle />
    </header>
  );
}
