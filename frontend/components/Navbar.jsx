"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useSelector } from "react-redux";
import { auth } from "@/firebase.config";
import {
  selectIsAuthenticated,
  selectIsAuthInitialized,
} from "@/lib/features/auth/authSlice";
import {
  selectCurrentUser,
  selectCurrentUserDisplayName,
  selectCurrentUserPhotoUrl,
  selectCurrentUserRole,
} from "@/lib/features/user/userSlice";
import RoleBadge from "@/components/RoleBadge";
import NotificationBell from "@/components/NotificationBell";
import Avatar from "@/components/Avatar";
import { useGetPublicSiteSettingsQuery } from "@/lib/features/home/homeApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { getUserDisplayRoleLabel } from "@/lib/utils/roleUtils";

// ─── Nav link definitions ─────────────────────────────────────────────────────
const NAV_LINKS = [
  {
    href: "/",
    labelKey: "navbar.home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    exact: true,
  },
  {
    href: "/courses",
    labelKey: "navbar.courses",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.168.477-4.5 1.253",
  },
  {
    href: "/contact-us",
    labelKey: "navbar.contact",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    href: "/community",
    labelKey: "navbar.community",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    requiresAuth: true,
  },
];

const DASHBOARD_LINK = { 
  href: "/dashboard", 
  labelKey: "navbar.dashboard",
  icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
};


function isActive(pathname, { href, exact }) {
  return exact ? pathname === href : pathname.startsWith(href);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function NavIcon({ path, className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

/** Animated hamburger / close icon */
function Hamburger({ open }) {
  return (
    <div className="flex flex-col gap-[5px] items-center justify-center w-5">
      <span
        className={`block h-[2px] w-5 rounded-full bg-slate-700 transition-all duration-300 ${
          open ? "translate-y-[7px] rotate-45" : ""
        }`}
      />
      <span
        className={`block h-[2px] w-5 rounded-full bg-slate-700 transition-all duration-300 ${
          open ? "opacity-0 scale-x-0" : ""
        }`}
      />
      <span
        className={`block h-[2px] w-5 rounded-full bg-slate-700 transition-all duration-300 ${
          open ? "-translate-y-[7px] -rotate-45" : ""
        }`}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Navbar() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsAuthInitialized);
  const currentUser = useSelector(selectCurrentUser);
  const displayName = useSelector(selectCurrentUserDisplayName);
  const photoUrl = useSelector(selectCurrentUserPhotoUrl);
  const currentRole = useSelector(selectCurrentUserRole);

  const pathname = usePathname();
  const router = useRouter();
  const { data: siteSettingsData } = useGetPublicSiteSettingsQuery();
  const { language, toggleLanguage, t } = useSiteLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileRef = useRef(null);

  // Derived values
  const siteName = "HSC Academic & Admission Care";
  const siteLogoUrl = mounted ? (siteSettingsData?.data?.general?.logoUrl || "/logo.png") : "/logo.png";
  const accountLabel = mounted
    ? (displayName || (isAuthenticated ? t("navbar.student", "Student") : ""))
    : "";
  const accountRoleLabel = getUserDisplayRoleLabel(currentUser, t);
  const visibleNavLinks = NAV_LINKS.filter((item) => {
    if (!item.requiresAuth) return true;
    return isInitialized && isAuthenticated;
  });

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  // Close profile menu on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileMenuOpen]);

  // Escape key closes everything
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err) {
      setLoginError(err?.message || t("navbar.loginFailed", "Login failed."));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ═══════════════════════════  HEADER  ═══════════════════════════════ */}
      <header
        className={`fixed inset-x-0 top-0 z-[110] w-full transition-all duration-500 ease-in-out ${
          scrolled
            ? "bg-white/75 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl border-b border-white/20"
            : "bg-white border-b border-slate-100"
        }`}
      >
        <div className="container-page">
          <div className="flex h-16 items-center gap-4 transition-all duration-300 md:h-[76px] md:gap-10">
            {/* ── Logo / Brand ─────────────────────────────────────────── */}
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-3 transition-all hover:opacity-100 active:scale-95"
              aria-label={siteName}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--action-soft-bg)]/20 blur-xl transition-opacity opacity-0 group-hover:opacity-100" />
                <img
                  src={siteLogoUrl}
                  alt={siteName}
                  className="relative h-9 w-9 rounded-xl object-contain shadow-sm md:h-11 md:w-11"
                />
              </div>
              <div className="flex flex-col leading-[1.1]">
                <div className="flex items-center gap-0.5 sm:gap-1 font-display text-[14px] sm:text-[16px] font-black uppercase tracking-tight text-slate-900 md:text-[20px]">
                  <span>HSC</span>
                  <span className="text-[var(--page-teal)] transition-colors group-hover:text-[var(--action-hover-start)]">Academic</span>
                </div>

                <div className="font-display text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 md:text-[10px]">
                  & Admission Care
                </div>
              </div>
            </Link>

            {/* ── Desktop Nav Links ─────────────────────────────────────── */}
            <nav className="hidden flex-1 justify-center lg:flex" aria-label="Main navigation">
              <ul className="flex items-center gap-10">
                {visibleNavLinks.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        className={`font-display relative flex items-center gap-2.5 px-2 py-2 text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                          active
                            ? "text-[var(--page-teal)]"
                            : "text-slate-500 hover:text-[var(--page-teal)] hover:scale-105"
                        }`}
                      >
                        <NavIcon path={item.icon} className="h-4 w-4" />
                        {t(item.labelKey)}
                        {/* Underline for active state */}
                        {active && (
                          <div className="absolute -bottom-1 left-2 right-2 h-1 rounded-full bg-[var(--page-teal)] shadow-[0_0_8px_rgba(5,150,105,0.4)] transition-all animate-fade-in" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* ── Right-side Actions (Desktop) ──────────────────────────── */}
            <div className="ml-auto hidden shrink-0 items-center gap-5 lg:flex">
              {/* Language toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="group relative flex h-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white px-3.5 transition-all hover:border-[var(--action-soft-border)] hover:bg-[var(--action-soft-bg)]/30 active:scale-95"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-[var(--page-teal)]">
                  <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {language === "bn" ? "English" : "বাংলা"}
                </div>
              </button>

              {/* Notification bell */}
              {isAuthenticated && isInitialized && <NotificationBell />}

              {/* Auth / Profile */}
              {!isInitialized ? (
                <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100/80" />
              ) : !isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className="group relative flex h-10 items-center justify-center gap-3 overflow-hidden rounded-xl px-6 font-display text-[11px] font-bold uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--action-start) 0%, var(--action-end) 100%)',
                    boxShadow: 'var(--action-shadow)'
                  }}
                >
                  {loginLoading ? t("navbar.loginBusy", "…") : (
                    <>
                      <svg className="h-4 w-4 opacity-70 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t("navbar.login", "Login")}
                    </>
                  )}
                </button>
              ) : (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    className={`flex items-center gap-2.5 rounded-2xl border bg-white p-1 pr-3.5 transition-all duration-300 active:scale-95 ${
                      profileMenuOpen 
                        ? "border-[var(--action-soft-border)] shadow-md ring-4 ring-[var(--action-soft-bg)]" 
                        : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                    }`}
                    aria-expanded={profileMenuOpen}
                  >
                    <Avatar
                      src={photoUrl}
                      name={accountLabel}
                      className="h-8 w-8 rounded-xl shadow-inner"
                      fallbackClassName="bg-[var(--action-soft-bg)] text-[var(--page-teal)] text-[10px] font-bold"
                    />
                    <div className="hidden flex-col items-start leading-[1.1] sm:flex">
                      <div className="flex items-center gap-1 font-display text-[12px] font-bold tracking-tight text-slate-800">
                        <span className="max-w-[100px] truncate">{accountLabel}</span>
                        <RoleBadge role={currentRole} />
                      </div>
                      <div className="font-display text-[9px] font-bold uppercase tracking-wider text-[var(--page-teal)]">
                        {accountRoleLabel}
                      </div>
                    </div>
                    <svg
                      className={`h-3 w-3 text-slate-400 transition-transform duration-300 ${profileMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu - Glassmorphism */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-[120] w-64 origin-top-right overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-2 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] backdrop-blur-xl animate-scale-in">
                      <div className="space-y-0.5">
                        <Link
                          href="/profile"
                          className="font-display flex items-center gap-3.5 rounded-xl px-4 py-3 text-[12px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-[var(--page-teal)]"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-[var(--action-soft-bg)] group-hover:text-[var(--page-teal)]">
                            <NavIcon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="h-4 w-4" />
                          </div>
                          {t("navbar.profile", "My Profile")}
                        </Link>
                        <Link
                          href={DASHBOARD_LINK.href}
                          className="font-display flex items-center gap-3.5 rounded-xl px-4 py-3 text-[12px] font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-[var(--page-teal)]"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-[var(--action-soft-bg)] group-hover:text-[var(--page-teal)]">
                             <NavIcon path={DASHBOARD_LINK.icon} className="h-4 w-4" />
                          </div>
                          {t(DASHBOARD_LINK.labelKey, "Dashboard")}
                        </Link>
                      </div>

                      <div className="mt-1 border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="group font-display flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-[12px] font-bold text-rose-600 transition-all hover:bg-rose-50"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                            <NavIcon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className="h-4 w-4" />
                          </div>
                          {t("navbar.signOut", "Sign Out")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Mobile Actions ─────────────────────────────────────────── */}
            <div className="ml-auto flex items-center gap-3 sm:gap-4 lg:hidden">



              {/* Notification bell (Mobile) */}
              {isAuthenticated && isInitialized && <NotificationBell />}


              {/* Mobile burger */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white transition-all active:scale-95 ${
                  mobileOpen 
                    ? "border-[var(--action-soft-border)] shadow-[var(--action-soft-bg)] shadow-lg" 
                    : "border border-slate-200 shadow-sm"
                }`}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <Hamburger open={mobileOpen} />
              </button>
            </div>
          </div>

          {/* Login error banner */}
          {loginError && (
            <div className="pb-3 px-4 md:px-6">
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-700 shadow-sm animate-shake">
                <NavIcon
                  path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  className="h-4 w-4 shrink-0"
                />
                {loginError}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ═════════════════════════  MOBILE DRAWER  ══════════════════════════ */}
      <div
        className={`fixed inset-0 z-[1000] lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />

        {/* Drawer panel */}
        <div
          className={`absolute inset-y-0 right-0 flex h-full w-[75vw] max-w-[300px] flex-col bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileOpen ? "translate-x-0 shadow-[-20px_0_60px_rgba(15,23,42,0.1)]" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-6">
            <Link href="/" className="flex items-center gap-3 active:scale-95 transition">
              <img
                src={siteLogoUrl}
                alt={siteName}
                className="h-9 w-9 rounded-xl object-contain shadow-sm"
              />
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5 font-display text-[16px] font-black uppercase tracking-tight text-slate-800">
                  <span>HSC</span>
                  <span className="text-[var(--page-teal)]">Academic</span>
                </div>
                <div className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  & Admission Care
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-[var(--action-soft-bg)] hover:text-[var(--page-teal)] active:scale-90"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto px-5 py-8 space-y-1.5 custom-scrollbar">


            <p className="px-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">{t("navbar.navigation", "Explore")}</p>

            {/* Nav links */}
            {visibleNavLinks.map((item, idx) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`font-display relative flex items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-500 ${
                    mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                  } transition-delay-${idx * 100} ${
                    active
                      ? "bg-[var(--action-soft-bg)] text-[var(--page-teal)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[var(--page-teal)]"
                  }`}
                >
                  <NavIcon path={item.icon} className={`h-4 w-4 ${active ? 'text-[var(--page-teal)]' : 'text-slate-400'}`} />
                  {t(item.labelKey)}
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--page-teal)]" />
                  )}
                </Link>
              );
            })}

            {isAuthenticated && isInitialized && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={`font-display relative flex items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-500 ${
                    mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                  } transition-delay-300 ${
                    pathname === "/profile"
                      ? "bg-[var(--action-soft-bg)] text-[var(--page-teal)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[var(--page-teal)]"
                  }`}
                >
                  <NavIcon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className={`h-4 w-4 ${pathname === "/profile" ? 'text-[var(--page-teal)]' : 'text-slate-400'}`} />
                  {t("navbar.profile", "Profile")}
                  {pathname === "/profile" && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--page-teal)]" />
                  )}
                </Link>

                <Link
                  href={DASHBOARD_LINK.href}
                  onClick={() => setMobileOpen(false)}
                  className={`font-display group flex items-center gap-4 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-500 ${
                    mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                  } transition-delay-400 ${
                    isActive(pathname, DASHBOARD_LINK)
                      ? "bg-[var(--action-soft-bg)] text-[var(--page-teal)]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[var(--page-teal)]"
                  }`}
                >
                  <NavIcon path={DASHBOARD_LINK.icon} className={`h-4 w-4 ${isActive(pathname, DASHBOARD_LINK) ? 'text-[var(--page-teal)]' : 'text-slate-400'}`} />
                  {t(DASHBOARD_LINK.labelKey)}
                </Link>
              </>
            )}
          </div>

          {/* Drawer footer */}
          <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
            {isAuthenticated && isInitialized && (
              <div className="flex items-center gap-3 px-1">
                <Avatar
                  src={photoUrl}
                  name={accountLabel}
                  className="h-10 w-10 rounded-xl"
                  fallbackClassName="bg-[var(--action-soft-bg)] text-[var(--action-soft-text)] font-bold text-[10px]"
                />
                <div className="min-w-0">
                  <div className="font-display flex items-center gap-1 truncate text-[13px] font-black text-slate-800">
                    <span className="truncate">{accountLabel}</span>
                    <RoleBadge role={currentRole} />
                  </div>
                  <p className="font-display text-[9px] font-bold uppercase tracking-wider text-[var(--page-teal)]">
                    {accountRoleLabel}
                  </p>
                </div>
              </div>
            )}

            {!isInitialized ? (
               <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
            ) : !isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogin}
                disabled={loginLoading}
                className="font-display group flex h-11 w-full items-center justify-center gap-4 rounded-2xl text-[13px] font-bold uppercase tracking-widest text-white transition-all active:scale-95"
                style={{ 
                  background: 'linear-gradient(135deg, var(--action-start) 0%, var(--action-end) 100%)',
                  boxShadow: 'var(--action-shadow)'
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 group-hover:bg-white/20">
                   <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                   </svg>
                </div>
                {t("navbar.login", "Login")}
              </button>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              {isAuthenticated && isInitialized && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 font-display flex h-9 items-center justify-center gap-2 rounded-lg bg-rose-50 text-[10px] font-bold uppercase tracking-widest text-rose-600 transition active:scale-95 hover:bg-rose-100"
                >
                  <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("navbar.signOut", "Sign Out")}
                </button>
              )}

              <button
                type="button"
                onClick={toggleLanguage}
                className="flex-1 font-display flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-600 transition active:scale-95 hover:bg-slate-200"
              >
                <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {language === "bn" ? "English" : "বাংলা"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
