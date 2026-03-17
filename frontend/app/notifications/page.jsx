"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/lib/features/notification/notificationApi";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";
import { RevealSection, RevealItem } from "@/components/motion/MotionReveal";

/* ─── Skeleton Loader Component ───────────────────────────── */
function NotificationSkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-4 py-6 md:px-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-1/4 rounded bg-slate-200" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Modern Icon Component ────────────────────────────────── */
const NotificationIcon = ({ type }) => {
  const styles = {
    payment_success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    offline_payment_verified: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    new_video: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    payment_due: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    default: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };
  
  const style = styles[type] || styles.default;

  const getSvg = () => {
    switch (type) {
      case "payment_success":
      case "offline_payment_verified":
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "new_video":
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "payment_due":
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${style}`}>
      {getSvg()}
    </div>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useSiteLanguage();
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const limit = 20;

  const { data, isLoading, isFetching } = useGetNotificationsQuery({ page, limit });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const notifications = data?.data || [];
  const pagination = data?.pagination;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "payments") return notifications.filter(n => n.type.includes("payment"));
    if (activeFilter === "courses") return notifications.filter(n => n.type === "new_video");
    return notifications;
  }, [notifications, activeFilter]);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
    
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const filters = [
    { id: "all", label: t("notificationsPage.filters.all", "All") },
    { id: "payments", label: t("notificationsPage.filters.payments", "Payments") },
    { id: "courses", label: t("notificationsPage.filters.courses", "Courses") },
  ];

  return (
    <div className="site-shell min-h-screen">
      <div className="site-nav-offset container-page pb-12 pt-1 md:pt-4">
        <RevealSection noStagger>
          <RevealItem as="header" className="mb-4 site-panel p-4 shadow-[0_8px_30px_rgba(15,23,42,0.03)] md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h1 className="site-title text-lg md:text-2xl">
                  <span className="text-emerald-600">{t("notificationsPage.header.accent", "Latest")} </span>
                  {t("notificationsPage.header.title", "Notifications")}
                </h1>
                <p className="site-lead mt-1 text-[10px] md:text-[11px] font-medium opacity-70">
                  {t("notificationsPage.header.description", "Keep track of your learning progress and important updates.")}
                </p>
              </div>

              {/* Filter Pills - Responsive sizing */}
              <div className="flex flex-wrap gap-1.5">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`h-7 md:h-7.5 rounded-full px-3.5 md:px-4 text-[8px] md:text-[9px] font-black uppercase tracking-wider transition-all border ${
                      activeFilter === filter.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </RevealItem>
        </RevealSection>

        <main className="relative mx-auto max-w-5xl">
          <div className="site-panel overflow-hidden border-slate-200/50 shadow-[0_10px_40px_rgba(15,23,42,0.02)]">
            {isLoading ? (
              <NotificationSkeleton />
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="relative mb-5">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-100 blur-3xl opacity-30" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-display text-base font-black text-slate-950">{t("notificationsPage.empty.title", "All Clear!")}</h3>
                <p className="mx-auto mt-1 max-w-[200px] text-[11px] font-medium leading-relaxed text-slate-500 opacity-80">
                  {t("notificationsPage.empty.description", "You've read all your notifications. New updates will land here.")}
                </p>
              </div>
            ) : (
              <RevealSection className="divide-y divide-slate-100/60">
                {filteredNotifications.map((notif) => (
                  <RevealItem
                    key={notif._id}
                    as="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`group flex w-full items-start gap-3.5 p-4 text-left transition-all hover:bg-slate-50/40 md:gap-4 md:p-5 ${
                      !notif.isRead ? "bg-emerald-50/5" : ""
                    }`}
                  >
                    <NotificationIcon type={notif.type} />
                    
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className={`text-[13px] md:text-[14px] tracking-tight leading-snug ${!notif.isRead ? "font-black text-slate-950" : "font-bold text-slate-700"}`}>
                          {notif.title}
                        </p>
                        <time className="shrink-0 text-[8px] md:text-[8.5px] font-black uppercase tracking-widest text-slate-400 opacity-80">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                      <p className="mt-1 text-[12px] md:text-[13px] font-medium leading-relaxed text-slate-500/90 line-clamp-2 md:line-clamp-none">
                        {notif.message}
                      </p>
                    </div>

                    {!notif.isRead && (
                      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                    )}
                  </RevealItem>
                ))}
              </RevealSection>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-2">
              <button
                disabled={page === 1 || isFetching}
                onClick={() => setPage(p => p - 1)}
                className="flex h-8.5 w-8.5 md:h-9 md:w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <svg className="h-3 md:h-3.5 w-3 md:w-3.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex h-8.5 md:h-9 items-center rounded-xl bg-slate-950 px-3.5 md:px-4 font-display text-[9px] md:text-[10px] font-black text-white shadow-lg">
                <span className="opacity-40 mr-1.5 md:mr-2 uppercase tracking-widest text-[7px]">Page</span> {page} <span className="mx-1 opacity-20">/</span> {pagination.pages}
              </div>
              <button
                disabled={page === pagination.pages || isFetching}
                onClick={() => setPage(p => p + 1)}
                className="flex h-8.5 w-8.5 md:h-9 md:w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <svg className="h-3 md:h-3.5 w-3 md:w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
