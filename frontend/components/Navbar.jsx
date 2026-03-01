"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useSelector } from "react-redux";
import { auth } from "@/firebase.config";
import { selectIsAuthenticated } from "@/lib/features/auth/authSlice";
import {
  selectCurrentUserDisplayName,
  selectCurrentUserRole,
} from "@/lib/features/user/userSlice";
import RoleBadge from "@/components/RoleBadge";

const NAV_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/courses", label: "Courses" },
  { href: "/#about-us", label: "About" },
  { href: "/#teacher-panel", label: "Faculty" },
];

function DesktopLink({ href, label, exact = false }) {
  const pathname = usePathname();
  const checkPath = href.startsWith("/#") ? "/" : href;
  const active = exact ? pathname === checkPath : pathname.startsWith(checkPath);

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
        active ? "text-emerald-700" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const displayName = useSelector(selectCurrentUserDisplayName);
  const currentRole = useSelector(selectCurrentUserRole);
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const accountLabel = useMemo(
    () => displayName || (isAuthenticated ? "Student" : ""),
    [displayName, isAuthenticated]
  );

  const handleGoogleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoginError(error?.message || "Google sign-in failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-3 md:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="HSC Academic & Admission Care" className="h-9 w-auto" />
            <span className="hidden text-sm font-black tracking-tight text-slate-900 sm:block">
              HSC Academic Care
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((item) => (
              <DesktopLink
                key={item.href}
                href={item.href}
                label={item.label}
                exact={item.exact}
              />
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loginLoading}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? "Connecting..." : "JOIN FOR FREE"}
              </button>
            ) : (
              <>
                {currentRole ? <RoleBadge role={currentRole} /> : null}
                <span className="max-w-[150px] truncate text-sm font-semibold text-slate-600">
                  {accountLabel}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? "X" : "≡"}
          </button>
        </div>

        {loginError ? (
          <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {loginError}
          </div>
        ) : null}

        {mobileOpen ? (
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)] lg:hidden">
            <div className="grid gap-1">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginLoading ? "Connecting..." : "JOIN FOR FREE"}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {currentRole ? <RoleBadge role={currentRole} /> : null}
                    <span className="truncate text-sm font-semibold text-slate-700">{accountLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
