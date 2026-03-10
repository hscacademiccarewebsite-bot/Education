"use client";

import Link from "next/link";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function AuthPage() {
  const { t } = useSiteLanguage();

  return (
    <main className="site-shell min-h-screen">
      <section className="container-page py-12 md:py-16">
        <div className="max-w-2xl border-l-4 border-emerald-300 pl-5 md:pl-6">
          <p className="site-kicker">{t("authPage.kicker")}</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
            {t("authPage.title")}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
            {t("authPage.description")}
          </p>
          <div className="mt-6">
            <Link href="/" className="site-button-primary">
              {t("authPage.button")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
