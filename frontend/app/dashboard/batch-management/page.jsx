"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GraduationCap, RefreshCw, ArrowLeft } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { ListSkeleton } from "@/components/loaders/AppLoader";
import { useActionPopup } from "@/components/feedback/useActionPopup";
import {
  useGetAcademicBatchesQuery,
  useUpdateBatchGraduationStatusMutation,
} from "@/lib/features/user/userApi";
import { ROLES } from "@/lib/utils/roleUtils";
import { normalizeApiError } from "@/src/shared/lib/errors/normalizeApiError";
import { useSiteLanguage } from "@/src/app/providers/LanguageProvider";

function BatchCard({ batch, onToggleGraduation, isProcessing }) {
  const { t } = useSiteLanguage();
  const hasActiveStudents = batch.studentCount > 0;

  const handleBatchToggle = async () => {
    const nextState = hasActiveStudents;
    await onToggleGraduation(batch.batchYear, nextState, batch.batchLabel);
  };

  return (
    <div className="rounded-xl border border-[#cbd5e1] bg-white p-5 shadow-[0_6px_14px_rgba(15,23,42,0.11)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#0f172a]">{batch.batchLabel}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {batch.totalMembers} {t("batchManagement.students", "students")}
          </p>
        </div>
        <button
          type="button"
          disabled={isProcessing || batch.totalMembers === 0}
          onClick={handleBatchToggle}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            hasActiveStudents
              ? "bg-[#147b79] text-white hover:bg-[#126b69]"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing
            ? t("batchManagement.processing", "Processing...")
            : hasActiveStudents
            ? t("batchManagement.graduate", "Graduate")
            : t("batchManagement.restore", "Restore")}
        </button>
      </div>
    </div>
  );
}

export default function BatchManagementPage() {
  const { t } = useSiteLanguage();
  const { showSuccess, showError, requestConfirmation, popupNode } = useActionPopup();
  const [processingBatch, setProcessingBatch] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetAcademicBatchesQuery();
  const [updateBatchGraduationStatus] = useUpdateBatchGraduationStatusMutation();

  // Filter out unassigned batches (those without a valid batchYear)
  const batches = useMemo(() => {
    const allBatches = data?.data || [];
    return allBatches.filter((batch) => batch.batchYear && batch.batchYear !== "unassigned");
  }, [data]);

  const handleToggleBatchGraduation = async (batchYear, isExStudent, batchLabel) => {
    const confirmText = isExStudent
      ? t("batchManagement.confirmGraduate", "Graduate all students in {batchLabel}?", { batchLabel })
      : t("batchManagement.confirmRestore", "Restore all ex-students in {batchLabel} to active?", { batchLabel });
    const confirmTitle = isExStudent
      ? t("batchManagement.confirmGraduateTitle", "Graduate Batch")
      : t("batchManagement.confirmRestoreTitle", "Restore Batch");
    const confirmBtnText = isExStudent
      ? t("batchManagement.confirmGraduateBtn", "Yes, Graduate")
      : t("batchManagement.confirmRestoreBtn", "Yes, Restore");

    const confirmed = await requestConfirmation(
      confirmText,
      confirmTitle,
      confirmBtnText,
      t("batchManagement.cancel", "Cancel")
    );

    if (!confirmed) return;

    setProcessingBatch(batchYear);

    try {
      const result = await updateBatchGraduationStatus({
        batchYear,
        isExStudent,
      }).unwrap();

      showSuccess(
        isExStudent
          ? t("batchManagement.batchGraduated", "{count} students graduated from {batchLabel}", {
              count: result.data?.updatedCount || 0,
              batchLabel,
            })
          : t("batchManagement.batchRestored", "{count} ex-students restored in {batchLabel}", {
              count: result.data?.updatedCount || 0,
              batchLabel,
            })
      );
    } catch (error) {
      showError(
        normalizeApiError(
          error,
          t("batchManagement.updateFailed", "Failed to update batch graduation status")
        )
      );
    } finally {
      setProcessingBatch(null);
    }
  };

  return (
    <RequireAuth allowedRoles={[ROLES.ADMIN]}>
      <section className="container-page py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#147b79] mb-1">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">
                {t("batchManagement.kicker", "Batch Management")}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#0f172a]">
              {t("batchManagement.title", "Academic Batches")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("batchManagement.back", "Back")}
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {t("batchManagement.refresh", "Refresh")}
            </button>
          </div>
        </div>

        {/* Batch Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-[#cbd5e1] bg-white p-5">
                <ListSkeleton rows={2} />
              </div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              {t("batchManagement.empty", "No academic batches found")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <BatchCard
                key={batch.key}
                batch={batch}
                onToggleGraduation={handleToggleBatchGraduation}
                isProcessing={processingBatch === batch.batchYear}
              />
            ))}
          </div>
        )}
      </section>
      {popupNode}
    </RequireAuth>
  );
}
