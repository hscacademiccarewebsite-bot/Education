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

const NAV_LINKS = [
  { href: "/", label: "Home", exact: true, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/courses", label: "Courses", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { href: "/about-us", label: "About", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/faculty", label: "Faculty", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/contact-us", label: "Contact", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
];

function initialsFromName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const profileMenuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onMouseDown = (e) => {
      if (!profileMenuRef.current?.contains(e.target)) setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [profileMenuOpen]);

  const accountLabel = useMemo(
    () => displayName || (isAuthenticated ? "Student" : ""),
    [displayName, isAuthenticated]
  );
  const siteName = siteSettingsData?.data?.general?.siteName || "HSC Academic & Admission Care";
  const siteTagline = siteSettingsData?.data?.general?.siteTagline || "Academic Platform";
  const siteLogoUrl = siteSettingsData?.data?.general?.logoUrl || "/logo.png";

  const handleGoogleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error) {
      setLoginError(error?.message || "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header 
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "border-b border-slate-200/50 bg-white/70 py-1 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]" 
          : "border-b border-transparent bg-white/40 py-2 backdrop-blur-xl"
      }`}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-6 md:h-[64px]">
          {/* Logo Section */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 opacity-0 blur transition duration-500 group-hover:opacity-40" />
              <img
                src={siteLogoUrl}
                alt={siteName}
                className="relative h-10 w-auto transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="max-w-[220px] truncate text-sm font-black tracking-tight text-slate-900">
                {siteName}
              </span>
              <span className="max-w-[220px] truncate text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                {siteTagline}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/60 bg-white/70 p-1.5 shadow-sm backdrop-blur-md lg:flex">
            {NAV_LINKS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-all duration-300 ${
                    active 
                      ? "border border-slate-200/80 bg-white text-emerald-600 shadow-sm" 
                      : "border border-transparent text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-700"
                  }`}
                >
                  <svg className={`h-4 w-4 ${active ? "text-emerald-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth/Profile Section */}
          <div className="hidden items-center gap-4 lg:flex">
            {!isInitialized ? (
              <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100" />
            ) : !isAuthenticated ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loginLoading}
                className="flex items-center gap-2.5 rounded-full bg-emerald-600 px-6 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {loginLoading ? "..." : "Join Free"}
              </button>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 p-1.5 pr-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-sm active:scale-95"
                >
                  <div className="relative">
                    {photoUrl ? (
                      <img src={photoUrl} alt={accountLabel} className="h-9 w-9 rounded-[14px] object-cover ring-2 ring-transparent transition-all group-hover:ring-emerald-500/20" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-gradient-to-br from-cyan-500 to-emerald-500 text-xs font-black text-white">
                        {initialsFromName(accountLabel) || "U"}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                  </div>
                  <div className="hidden flex-col items-start xl:flex">
                    <span className="max-w-[120px] truncate text-[13px] font-black text-slate-800">{accountLabel}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{currentRole || "student"}</span>
                  </div>
                  <svg className={`ml-1 h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${profileMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 origin-top-right overflow-hidden rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] outline-none animate-in fade-in zoom-in duration-200">
                    <div className="mb-2 rounded-[18px] bg-slate-50 p-4">
                      <p className="truncate text-sm font-black text-slate-900">{accountLabel}</p>
                      <div className="mt-2.5">
                        {currentRole ? <RoleBadge role={currentRole} /> : <span className="rounded-lg bg-slate-200/50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Student</span>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {[
                        { href: "/profile", label: "My Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { href: "/dashboard", label: "Dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" }
                      ].map((link) => (
                        <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-bold text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                          </svg>
                          {link.label}
                        </Link>
                      ))}
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] font-bold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 transition-all hover:bg-white active:scale-90 lg:hidden"
          >
            <div className="flex flex-col gap-1.5 transition-all">
              <span className={`h-0.5 w-5 rounded-full bg-slate-900 transition-all duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-5 rounded-full bg-slate-900 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-5 rounded-full bg-slate-900 transition-all duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        {loginError && (
          <div className="mx-auto mt-2 max-w-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 shadow-sm">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {loginError}
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="absolute inset-x-0 top-full mt-2 origin-top overflow-hidden bg-transparent p-4 lg:hidden animate-in slide-in-from-top-4 duration-300">
            <div className="rounded-[32px] border border-slate-200/50 bg-white/95 p-6 shadow-2xl backdrop-blur-3xl">
              <div className="grid gap-2">
                {NAV_LINKS.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex h-12 items-center gap-3 rounded-2xl px-5 text-sm font-black uppercase tracking-widest transition ${
                        active ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700"
                      }`}
                    >
                      <svg className={`h-5 w-5 ${active ? "text-emerald-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {!isInitialized ? null : !isAuthenticated ? (
                <button
                  onClick={handleGoogleLogin}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-[13px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-600/20 transition active:scale-95"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Join the academy
                </button>
              ) : (
                <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-4 px-2">
                    {photoUrl ? (
                      <img src={photoUrl} className="h-12 w-12 rounded-[18px] object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-sm font-bold text-white">
                        {initialsFromName(accountLabel)}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-slate-900">{accountLabel}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{currentRole || "student"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/profile" className="flex h-12 items-center justify-center rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">Profile</Link>
                    <Link href="/dashboard" className="flex h-12 items-center justify-center rounded-2xl bg-emerald-600 text-xs font-black uppercase tracking-wider text-white">Dashboard</Link>
                  </div>
                  <button onClick={handleLogout} className="flex h-12 w-full items-center justify-center rounded-2xl bg-rose-50 text-xs font-black uppercase tracking-wider text-rose-600">Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
