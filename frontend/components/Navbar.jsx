"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useSelector } from "react-redux";
import { auth } from "@/firebase.config";
import { selectIsAuthenticated, selectIsAuthInitialized } from "@/lib/features/auth/authSlice";
import {
  selectCurrentUserDisplayName,
  selectCurrentUserPhotoUrl,
  selectCurrentUserRole,
} from "@/lib/features/user/userSlice";
import RoleBadge from "@/components/RoleBadge";
import { useGetPublicSiteSettingsQuery } from "@/lib/features/home/homeApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

const NAV_LINKS = [
  {
    href: "/",
    labelKey: "navbar.home",
    exact: true,
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/courses",
    labelKey: "navbar.courses",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    href: "/#about",
    labelKey: "navbar.about",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    href: "/#faculty",
    labelKey: "navbar.faculty",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    href: "/contact-us",
    labelKey: "navbar.contact",
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  },
];

const DASHBOARD_LINK = {
  href: "/dashboard",
  labelKey: "navbar.dashboard",
  icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
};

function initialsFromName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function isLinkActive(pathname, item) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavIcon({ path, className = "" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function Navbar() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsAuthInitialized);
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

  const profileMenuRef = useRef(null);
  const mobileMenuId = "site-mobile-drawer";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const siteName = siteSettingsData?.data?.general?.siteName || "HSC Academic & Admission Care";
  const siteTagline = siteSettingsData?.data?.general?.siteTagline || "Academic Platform";
  const siteLogoUrl = siteSettingsData?.data?.general?.logoUrl || "/logo.png";
  const accountLabel = displayName || (isAuthenticated ? t("navbar.student", "Student") : "");
  const visibleNavLinks = useMemo(
    () =>
      NAV_LINKS.filter((item) => {
        if (!item.requiresAuth) {
          return true;
        }
        return isInitialized && isAuthenticated;
      }),
    [isAuthenticated, isInitialized]
  );

  const handleGoogleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error) {
      setLoginError(error?.message || t("navbar.loginFailed", "Login failed."));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[110] border-b transition-all duration-500 ${
          scrolled
            ? "border-white/60 bg-[rgba(232,236,236,0.9)] shadow-[0_18px_44px_rgba(15,23,42,0.1)] backdrop-blur-2xl"
            : "border-transparent bg-[rgba(232,236,236,0.74)] backdrop-blur-xl"
        }`}
      >
        <div className="container-page">
          <div className="flex h-16 items-center gap-3 md:h-[74px] md:gap-5">
            <Link href="/" className="group flex min-w-0 items-center gap-3 md:gap-4">
              <div className="relative">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-emerald-200/60 via-cyan-200/50 to-amber-200/50 opacity-0 blur-md transition duration-400 group-hover:opacity-100" />
                <img
                  src={siteLogoUrl}
                  alt={siteName}
                  className="relative h-10 w-10 rounded-2xl object-cover ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-105 md:h-11 md:w-11"
                />
              </div>
              <div className="hidden min-w-0 flex-col md:flex">
                <span className="font-display max-w-[230px] truncate text-[15px] font-black tracking-tight text-slate-900">
                  {siteName}
                </span>
                <span className="max-w-[230px] truncate text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                  {siteTagline}
                </span>
              </div>
            </Link>

            <nav className="hidden flex-1 justify-center lg:flex">
              <div className="site-panel-muted relative flex items-center gap-1 rounded-[22px] border border-white/70 p-1.5 shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
                {visibleNavLinks.map((item) => {
                  const active = isLinkActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-2 rounded-2xl px-4 py-2 text-[13px] font-black transition-all duration-200 ${
                        active
                          ? "bg-[linear-gradient(135deg,var(--action-start),var(--action-end))] text-white shadow-[var(--action-shadow)]"
                          : "text-slate-600 hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-soft-text)]"
                      }`}
                    >
                      <NavIcon
                        path={item.icon}
                        className={`h-4 w-4 ${active ? "text-white" : "text-slate-400"}`}
                      />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="ml-auto hidden shrink-0 items-center gap-3 lg:flex">
              <button
                type="button"
                onClick={toggleLanguage}
                className="site-button-secondary h-10 min-w-[74px] rounded-2xl px-3 text-[11px] font-black uppercase tracking-[0.14em]"
                title={
                  language === "bn"
                    ? t("language.switchToEnglish")
                    : t("language.switchToBangla")
                }
                aria-label={
                  language === "bn"
                    ? t("language.switchToEnglish")
                    : t("language.switchToBangla")
                }
              >
                {language === "bn" ? t("language.english") : t("language.bangla")}
              </button>
              {!isInitialized ? (
                <div className="h-11 w-28 animate-pulse rounded-full bg-white/70" />
              ) : !isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  className="site-button-primary h-10 gap-2 rounded-2xl px-4 text-xs active:scale-95 disabled:opacity-50"
                >
                  <NavIcon
                    path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    className="h-4 w-4"
                  />
                  {loginLoading ? t("navbar.loginBusy") : t("navbar.login")}
                </button>
              ) : (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((value) => !value)}
                    className="site-panel-muted flex items-center gap-3 rounded-[18px] border border-[var(--action-soft-border)] p-1.5 pr-3 transition hover:-translate-y-0.5 hover:bg-[var(--action-soft-bg)] active:scale-95"
                    aria-expanded={profileMenuOpen}
                    aria-label={t("navbar.toggleProfileMenu")}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={accountLabel}
                        className="h-9 w-9 rounded-xl object-cover ring-2 ring-white/70"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-teal-800 to-emerald-600 text-[11px] font-black text-white">
                        {initialsFromName(accountLabel) || "U"}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="max-w-[132px] truncate text-xs font-black text-slate-900">{accountLabel}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-slate-500">
                        {currentRole || t("navbar.student")}
                      </p>
                    </div>
                    <svg
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileMenuOpen && (
                    <div className="site-panel absolute right-0 z-[120] mt-3 w-72 rounded-[24px] p-2">
                      <div className="mb-2 rounded-2xl bg-slate-950 px-4 py-4 text-white">
                        <p className="truncate text-sm font-black">{accountLabel}</p>
                        <div className="mt-2">
                          {currentRole ? (
                            <RoleBadge role={currentRole} />
                          ) : (
                            <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/70">
                              {t("navbar.student")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-slate-700 transition hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-soft-text)]"
                        >
                          <NavIcon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="h-4 w-4 text-slate-500" />
                          {t("navbar.profile")}
                        </Link>
                        <Link
                          href={DASHBOARD_LINK.href}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-slate-700 transition hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-soft-text)]"
                        >
                          <NavIcon path={DASHBOARD_LINK.icon} className="h-4 w-4 text-slate-500" />
                          {t(DASHBOARD_LINK.labelKey)}
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-[var(--action-soft-text)] transition hover:bg-[var(--action-soft-bg)]"
                      >
                        <NavIcon
                          path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          className="h-4 w-4"
                        />
                        {t("navbar.signOut")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] transition hover:bg-white active:scale-90 lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              aria-label={
                mobileOpen
                  ? t("navbar.closeNavigationMenu")
                  : t("navbar.openNavigationMenu")
              }
            >
              <div className="flex flex-col gap-1.5">
                <span
                  className={`h-0.5 w-5 rounded-full bg-[var(--action-soft-text)] transition-all duration-300 ${
                    mobileOpen ? "translate-y-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-5 rounded-full bg-[var(--action-soft-text)] transition-all duration-300 ${
                    mobileOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-5 rounded-full bg-[var(--action-soft-text)] transition-all duration-300 ${
                    mobileOpen ? "-translate-y-2 -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          {loginError ? (
            <div className="pb-3">
              <div className="mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                <NavIcon
                  path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  className="h-4 w-4 shrink-0"
                />
                {loginError}
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[130] lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-slate-950/35 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label={t("navbar.closeMobileNavigation")}
        />

        <aside
          id={mobileMenuId}
          className={`site-panel absolute right-0 top-0 flex h-full w-[min(90vw,360px)] flex-col border-l border-white/60 transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
            <div>
              <p className="font-display text-sm font-black text-slate-900">
                {t("navbar.navigation")}
              </p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {t("navbar.mainMenu")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--action-soft-border)] bg-[var(--action-soft-bg)] text-[var(--action-soft-text)] transition hover:bg-white hover:text-[var(--action-start)]"
              aria-label={t("navbar.closeMobileNavigation")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-2">
              {visibleNavLinks.map((item) => {
                const active = isLinkActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition ${
                      active
                        ? "bg-[linear-gradient(135deg,var(--action-start),var(--action-end))] text-white"
                        : "bg-white text-slate-700 hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-soft-text)]"
                    }`}
                  >
                    <NavIcon path={item.icon} className={`h-5 w-5 ${active ? "text-white" : "text-slate-400"}`} />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 border-t border-slate-200/70 pt-6">
              <button
                type="button"
                onClick={toggleLanguage}
                className="site-button-secondary mb-3 flex h-10 w-full items-center justify-center rounded-2xl text-[11px] font-black uppercase tracking-[0.14em]"
                title={
                  language === "bn"
                    ? t("language.switchToEnglish")
                    : t("language.switchToBangla")
                }
              >
                {language === "bn" ? t("language.english") : t("language.bangla")}
              </button>
              {!isInitialized ? (
                <div className="h-12 animate-pulse rounded-2xl bg-white" />
              ) : !isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  className="site-button-primary flex h-10 w-full items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  <NavIcon
                    path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    className="h-4 w-4"
                  />
                  {loginLoading ? t("navbar.loginPending") : t("navbar.login")}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
                    <div className="flex items-center gap-3">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={accountLabel}
                          className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/60"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xs font-black">
                          {initialsFromName(accountLabel) || "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{accountLabel}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                          {currentRole || t("navbar.student")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">{currentRole ? <RoleBadge role={currentRole} /> : null}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href="/profile"
                      className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-soft-text)]"
                    >
                      <NavIcon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="h-4 w-4 text-slate-500" />
                      {t("navbar.profile")}
                    </Link>
                    <Link
                      href={DASHBOARD_LINK.href}
                      className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-[var(--action-soft-bg)] hover:text-[var(--action-soft-text)]"
                    >
                      <NavIcon path={DASHBOARD_LINK.icon} className="h-4 w-4 text-slate-500" />
                      {t(DASHBOARD_LINK.labelKey)}
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="site-button-secondary flex h-10 w-full items-center justify-center text-xs"
                  >
                    {t("navbar.signOut")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
