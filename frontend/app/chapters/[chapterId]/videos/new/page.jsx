"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { CardLoader } from "@/components/loaders/AppLoader";
import { useGetBatchByIdQuery } from "@/lib/features/batch/batchApi";
import {
  useCreateVideoMutation,
  useGetChapterByIdQuery,
} from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { ROLES } from "@/lib/utils/roleUtils";

export default function NewVideoPage() {
  const router = useRouter();
  const { chapterId } = useParams();
  const role = useSelector(selectCurrentUserRole);

  const { data: chapterData, isLoading: chapterLoading } = useGetChapterByIdQuery(chapterId, {
    skip: !chapterId,
  });
  const chapter = chapterData?.data;

  const { data: batchData } = useGetBatchByIdQuery(chapter?.batch, {
    skip: !chapter?.batch,
  });
  const batch = batchData?.data;

  const [createVideo, { isLoading: creating }] = useCreateVideoMutation();
  const [title, setTitle] = useState("");
  const [facebookVideoId, setFacebookVideoId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    const id = facebookVideoId.trim();
    if (!id) {
      return "";
    }
    return `https://www.facebook.com/watch/?v=${id}`;
  }, [facebookVideoId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await createVideo({
        chapterId,
        title,
        facebookVideoId,
        description,
      }).unwrap();

      if (chapter?.batch) {
        router.push(`/batches/${chapter.batch}`);
        return;
      }

      router.back();
    } catch (createError) {
      setError(createError?.data?.message || "Failed to add video.");
    }
  };

  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR]}>
      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Content Management
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-900 [font-family:'Trebuchet_MS','Segoe_UI',sans-serif]">
              Add Video
            </h1>
          </div>
          {role ? <RoleBadge role={role} /> : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          {chapterLoading ? (
            <CardLoader label="Loading chapter info..." />
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Chapter: <span className="font-bold text-slate-900">{chapter?.title || "Unknown"}</span>
              </p>

              {batch?.facebookGroupUrl ? (
                <a
                  href={batch.facebookGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-xs font-bold uppercase tracking-wide text-emerald-700 underline"
                >
                  Open Course Private Facebook Group
                </a>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <input
                  required
                  placeholder="Video title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Facebook Video ID"
                  value={facebookVideoId}
                  onChange={(event) => setFacebookVideoId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Video description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />

                {previewUrl ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Facebook video URL will be generated automatically: {previewUrl}
                  </p>
                ) : null}

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    {creating ? "Saving..." : "Add Video"}
                  </button>
                  <Link
                    href={chapter?.batch ? `/batches/${chapter.batch}` : "/batches"}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </RequireAuth>
  );
}
