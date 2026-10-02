"use client";

import { Menu, Moon, Search, Sun, Waves, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Map" },
  { href: "/sites", label: "Sites" },
  { href: "/compare", label: "Compare" },
  { href: "/observations", label: "Observations" },
  { href: "/insights", label: "Insights" },
  { href: "/ask", label: "Ask AquaInsight" },
  { href: "/reports", label: "Reports" },
  { href: "/methodology", label: "Methodology" },
];

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Waves className="h-4 w-4" aria-hidden />
          </span>
          AquaInsight
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                pathname === item.href && "bg-muted text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form
            className="hidden md:block"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/sites?q=${encodeURIComponent(q)}`);
            }}
          >
            <label className="sr-only" htmlFor="global-search">
              Search sites
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="global-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search cities, streams, sites"
                className="w-56 pl-9"
              />
            </div>
          </form>
          <Badge className="hidden sm:inline-flex border-watch/30 bg-watch/10 text-watch">Demo dataset</Badge>
          <span className="hidden text-xs text-muted-foreground sm:inline">Data status: demo</span>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-background/95 p-4 lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="sm" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X />
            </Button>
          </div>
          <nav className="grid gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl bg-muted px-4 py-3"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>AquaInsight — Track 2 Data-to-Insight prototype. Demo/synthetic dataset.</p>
        <div className="flex gap-4">
          <Link href="/about">About</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/reports">Reports</Link>
        </div>
      </div>
    </footer>
  );
}
