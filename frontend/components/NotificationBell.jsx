"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/lib/features/notification/notificationApi";
import { formatDistanceToNow } from "date-fns";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef(null);
  const { t } = useSiteLanguage();

  // Poll for unread count every 30 seconds
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
  });
  
  // Only fetch the actual notifications list when the dropdown is opened
  const { data: notifData, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 5 },
    { skip: !isOpen }
  );
  
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const unreadCount = countData?.count || 0;
  const notifications = notifData?.data || [];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch (err) {
        console.error("Failed to mark as read ", err);
      }
    }
    
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case "payment_success":
      case "offline_payment_verified":
        return (
          <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "new_video":
        return (
          <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    
    // If opening the menu and there are unread notifications, mark them all as read
    if (nextState && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 transition hover:bg-white active:scale-95"
      >
        <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute inset-x-4 sm:inset-auto sm:right-0 top-16 sm:top-12 z-[150] sm:w-[340px] origin-top-right rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_20px_40px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 focus:outline-none animate-scale-in">

          <div className="flex items-center justify-between px-3 pb-2 pt-2">
            <h3 className="font-display font-extrabold text-slate-800">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                {unreadCount} {t("notifications.new")}
              </span>
            )}
          </div>
          
          <div className="mt-1 flex max-h-[380px] flex-col overflow-y-auto">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-sm font-medium text-slate-400">
                {t("dashboard.loading")}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-3 rounded-full bg-slate-50 p-3 text-slate-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">{t("notifications.empty")}</p>
                <p className="mt-1 text-xs text-slate-400">{t("notifications.emptyDesc")}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-50 ${
                    !notif.isRead ? "bg-slate-50/50" : ""
                  }`}
                >
                  {getIconForType(notif.type)}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!notif.isRead ? "font-extrabold text-slate-900" : "font-medium text-slate-700"}`}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">
                      {notif.message}
                    </p>
                    <p className="mt-1.5 text-[10px] font-bold text-slate-400">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                  )}
                </button>
              ))
            )}
          </div>
          
          <div className="mt-1 border-t border-slate-100 p-1">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="group flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-bold text-[var(--action-start)] transition hover:bg-slate-50"
            >
              {t("notifications.seeAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
