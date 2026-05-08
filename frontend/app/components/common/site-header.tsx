"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "./theme-context";
import { Button } from "./button";

const links = [
  { label: "Journey", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Stories", href: "/#testimonials" },
  { label: "Contact", href: "/#contact" },
  { label: "Privacy", href: "/privacy-policy" },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3c.19 0 .37.01.56.03A7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function SiteHeader() {
  const { theme, mounted, toggleTheme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("accessToken"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    window.location.href = "/";
  };

  return (
    <header className="theme-header sticky top-0 z-50 border-b theme-border backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Learn Computers Home">
          <span className="accent-bg grid h-9 w-9 place-items-center rounded-lg text-sm font-black">
            LC
          </span>
          <span>
            <span className="theme-text block text-base font-black leading-none">Learn Computers</span>
            <span className="theme-muted block text-xs">Student Learning Platform</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link text-sm font-semibold">
              {link.label}
            </Link>
          ))}
          {isLoggedIn && (
            <Link href="/dashboard" className="nav-link text-sm font-semibold">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="header-actions">
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="lg"
            className="header-btn-outline gap-1.5"
            aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
          >
            {mounted && theme === "dark" ? <SunIcon /> : <MoonIcon />}
            {mounted ? (theme === "dark" ? "Light" : "Dark") : "Theme"}
          </Button>

          {isLoggedIn ? (
            <Button
              onClick={handleLogout}
              variant="outline"
              size="lg"
              className="header-btn-outline"
            >
              Logout
            </Button>
          ) : (
            <>
              <Button
                href="/login"
                variant="outline"
                size="lg"
                className="header-btn-outline hidden md:inline-flex"
              >
                Login
              </Button>

              <Button
                href="/signup"
                variant="primary"
                size="lg"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

