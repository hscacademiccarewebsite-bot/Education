"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import RequireAuth from "@/components/RequireAuth";
import RoleBadge from "@/components/RoleBadge";
import { CardLoader } from "@/components/loaders/AppLoader";
import { useGetBatchByIdQuery } from "@/lib/features/batch/batchApi";
import { useCreateSubjectMutation } from "@/lib/features/content/contentApi";
import { selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { ROLES } from "@/lib/utils/roleUtils";

export default function NewSubjectPage() {
  const router = useRouter();
  const { batchId } = useParams();
  const role = useSelector(selectCurrentUserRole);

  const { data: batchData, isLoading: batchLoading } = useGetBatchByIdQuery(batchId, {
    skip: !batchId,
  });
  const [createSubject, { isLoading: creating }] = useCreateSubjectMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const batch = batchData?.data;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await createSubject({
        batchId,
        title,
        description,
      }).unwrap();

      router.push(`/batches/${batchId}`);
    } catch (createError) {
      setError(createError?.data?.message || "Failed to create subject.");
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
              Create Subject
            </h1>
          </div>
          {role ? <RoleBadge role={role} /> : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          {batchLoading ? (
            <CardLoader label="Loading batch info..." />
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Course: <span className="font-bold text-slate-900">{batch?.name || "Unknown"}</span>
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <input
                  required
                  placeholder="Subject title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Subject description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />

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
                    {creating ? "Creating..." : "Create Subject"}
                  </button>
                  <Link
                    href={`/batches/${batchId}`}
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
