"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import Avatar from "@/components/Avatar";
import RoleBadge from "@/components/RoleBadge";
import CreatePost from "@/components/community/CreatePost";
import PostCard from "@/components/community/PostCard";
import { PostSkeleton } from "@/components/community/CommunitySkeletons";
import { useGetPostsQuery } from "@/lib/features/community/communityApi";
import { useGetPublicUserProfileQuery } from "@/lib/features/user/userApi";
import { selectCurrentUserId, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function formatMemberSince(dateValue, language, t) {
  if (!dateValue) return t("publicProfilePage.notAvailable", "N/A");

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return t("publicProfilePage.notAvailable", "N/A");

  return date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

function StatCard({ label, value, accentClass = "text-slate-900" }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/90 px-3.5 py-3">
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1.5 text-[13px] font-extrabold md:text-[14px] ${accentClass}`}>{value}</p>
    </article>
  );
}

export default function PublicUserProfilePage() {
  const { t, language } = useSiteLanguage();
  const params = useParams();
  const userId = typeof params?.userId === "string" ? params.userId : "";
  const currentUserId = useSelector(selectCurrentUserId);
  const currentUserRole = useSelector(selectCurrentUserRole);
  const [editingPost, setEditingPost] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [userId]);

  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    error,
    refetch,
  } = useGetPublicUserProfileQuery(userId, {
    skip: !userId,
  });

  const {
    data: postsData,
    isLoading: postsLoading,
    isFetching: postsFetching,
  } = useGetPostsQuery(
    { page, limit: 10, author: userId },
    { skip: !userId }
  );

  const user = profileData?.data?.user || null;
  const posts = postsData?.data || [];
  const pagination = postsData?.pagination || {};
  const totalPosts = pagination.total ?? profileData?.data?.summary?.postsCount ?? 0;
  const hasMore = pagination.page < pagination.pages;
  const isOwnProfile = String(currentUserId || "") === String(userId || "");
  const canOpenStaffDetails = ["admin", "teacher", "moderator"].includes(currentUserRole);

  const detailErrorMessage = useMemo(() => {
    if (typeof error?.data?.message === "string") return error.data.message;
    if (typeof error?.message === "string") return error.message;
    return t("publicProfilePage.loadError", "Failed to load this profile.");
  }, [error, t]);

  return (
    <RequireAuth>
      <main className="site-shell min-h-screen pb-12">
        <div className="container-page py-5 md:py-8">
          {profileError ? (
            <div className="mx-auto max-w-[960px] rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {detailErrorMessage}
            </div>
          ) : (
            <div className="mx-auto grid max-w-[1140px] gap-4 xl:grid-cols-[320px_minmax(0,720px)] xl:justify-center">
              <aside className="space-y-4 xl:sticky xl:top-[104px] xl:self-start">
                <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                  <div className="h-20 bg-[radial-gradient(circle_at_top_left,_rgba(20,123,121,0.25),_transparent_52%),linear-gradient(135deg,_#eafaf6_0%,_#ffffff_60%,_#eef6ff_100%)] md:h-24" />
                  <div className="px-4 pb-4">
                    <div className="-mt-10 flex items-end gap-3">
                      <Avatar
                        src={user?.profilePhoto?.url}
                        name={user?.fullName || "User"}
                        className="h-20 w-20 rounded-[22px] border-4 border-white shadow-lg"
                        fallbackClassName="rounded-[22px] bg-slate-900 text-lg font-black text-white"
                      />
                      <div className="min-w-0 flex-1 pb-1">
                        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#147b79]">
                          {t("publicProfilePage.kicker", "Community Profile")}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-950 md:text-[22px]">
                            {profileLoading
                              ? t("publicProfilePage.loading", "Loading...")
                              : user?.fullName || t("publicProfilePage.unknownUser", "Unknown User")}
                          </h1>
                          {user?.role ? <RoleBadge role={user.role} /> : null}
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-[12px] font-normal leading-5 text-slate-600">
                      {t("publicProfilePage.description", "A compact view of this member’s academic identity and community posts.")}
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      <StatCard
                        label={t("publicProfilePage.school", "School")}
                        value={profileLoading ? t("publicProfilePage.loading", "Loading...") : user?.school || t("publicProfilePage.notAddedYet", "Not added yet")}
                        accentClass="text-sky-700"
                      />
                      <StatCard
                        label={t("publicProfilePage.college", "College")}
                        value={profileLoading ? t("publicProfilePage.loading", "Loading...") : user?.college || t("publicProfilePage.notAddedYet", "Not added yet")}
                        accentClass="text-indigo-700"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <StatCard
                        label={t("publicProfilePage.joined", "Joined")}
                        value={profileLoading ? t("publicProfilePage.loading", "Loading...") : formatMemberSince(user?.createdAt, language, t)}
                        accentClass="text-slate-900"
                      />
                      <StatCard
                        label={t("publicProfilePage.posts", "Posts")}
                        value={postsLoading && page === 1 ? t("publicProfilePage.loading", "Loading...") : totalPosts}
                        accentClass="text-emerald-700"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {t("publicProfilePage.quickActions", "Quick Actions")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isOwnProfile ? (
                      <Link href="/profile" className="inline-flex items-center rounded-full bg-slate-900 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#147b79]">
                        {t("publicProfilePage.editMyProfile", "Edit My Profile")}
                      </Link>
                    ) : (
                      <Link href="/community" className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100">
                        {t("publicProfilePage.backToCommunity", "Back to Community")}
                      </Link>
                    )}
                    {canOpenStaffDetails ? (
                      <Link href={`/users/${userId}/details`} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100">
                        {t("publicProfilePage.staffDetails", "Staff Details")}
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-100"
                    >
                      {t("publicProfilePage.refresh", "Refresh")}
                    </button>
                  </div>
                </section>
              </aside>

              <section className="min-w-0 space-y-4">
                {editingPost ? (
                  <CreatePost
                    post={editingPost}
                    isOpen={Boolean(editingPost)}
                    onClose={() => setEditingPost(null)}
                    isTriggerVisible={false}
                  />
                ) : null}

                <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm md:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {t("publicProfilePage.activityKicker", "Community Activity")}
                      </p>
                      <h2 className="mt-1.5 text-[15px] font-extrabold tracking-tight text-slate-950 md:text-lg">
                        {t("publicProfilePage.postsBy", "Posts by {name}", {
                          name: user?.fullName || t("publicProfilePage.thisUser", "this user"),
                        })}
                      </h2>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {t("publicProfilePage.activityDescription", "Compact timeline view with smaller cards and tighter spacing.")}
                      </p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
                      {totalPosts} {t("publicProfilePage.visiblePosts", "visible posts")}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {postsLoading && page === 1 ? (
                    Array.from({ length: 3 }).map((_, index) => <PostSkeleton key={index} />)
                  ) : posts.length === 0 ? (
                    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
                      <p className="text-sm font-extrabold text-slate-900">{t("publicProfilePage.noPostsTitle", "No posts available yet.")}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        {t("publicProfilePage.noPostsDescription", "This profile has not shared any posts you can access right now.")}
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onEdit={isOwnProfile ? (selectedPost) => setEditingPost(selectedPost) : undefined}
                      />
                    ))
                  )}
                </div>

                {hasMore ? (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={postsFetching}
                      className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#147b79] disabled:opacity-60"
                    >
                      {postsFetching
                        ? t("publicProfilePage.loading", "Loading...")
                        : t("publicProfilePage.loadMore", "Load More Posts")}
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
