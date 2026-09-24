"use client";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Building2, ExternalLink } from "lucide-react";

export function Header({ lastUpdated }: { lastUpdated?: string }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-saffron shadow-md group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-navy-900 dark:text-white">Delhi Tender Insights</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">Public Procurement Intelligence</span>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {lastUpdated && (
            <span className="hidden md:inline text-xs text-muted-foreground">
              Updated {new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <a href="https://govtprocurement.delhi.gov.in/nicgep/app" target="_blank" rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Official Portal <ExternalLink className="h-3 w-3" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
