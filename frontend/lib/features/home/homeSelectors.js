import { createSelector } from "@reduxjs/toolkit";
import { batchApi } from "@/lib/features/batch/batchApi";
import { HOME_FALLBACK_BATCHES, HOME_FALLBACK_FACULTY } from "@/lib/features/home/homeData";

/*
 * RTK Query cache selector.
 * Reads the cached result of `listBatches(undefined)`.
 * Because the homepage now calls `useListBatchesQuery(undefined)` without
 * `skip: !isAuthenticated`, the cache is populated for ALL users (public).
 */
const selectBatchListQueryResult = batchApi.endpoints.listBatches.select();

const selectFetchedBatchList = createSelector([selectBatchListQueryResult], (queryResult) => {
  return queryResult?.data?.data || [];
});

/* ─── Derived data builders ──────────────────────────────────── */

function buildRunningBatches(batches) {
  return batches
    .filter((b) => b.status === "active" || b.status === "upcoming")
    .slice(0, 8);
}

function buildFacultyFromBatches(batches) {
  const facultyMap = new Map();

  batches.forEach((batch) => {
    const staffMembers = [...(batch.teachers || []), ...(batch.moderators || [])];

    staffMembers.forEach((member) => {
      const memberId = member?._id;
      if (!memberId) return;

      if (!facultyMap.has(memberId)) {
        facultyMap.set(memberId, {
          id: memberId,
          fullName: member.fullName || "Faculty Member",
          role: member.role === "moderator" ? "Moderator" : "Teacher",
          email: member.email || "not-provided",
          expertise:
            member.role === "moderator"
              ? "Student Monitoring and Academic Support"
              : "Subject Instruction and Lecture Guidance",
          batches: new Set(),
        });
      }

      facultyMap.get(memberId).batches.add(batch.name);
    });
  });

  return Array.from(facultyMap.values()).map((item) => ({
    ...item,
    batches: Array.from(item.batches),
  }));
}

/* ─── Memoised selectors ─────────────────────────────────────── */

/**
 * Returns up to 8 active/upcoming batches from the RTK cache.
 * Falls back to static placeholder data when the cache is empty
 * (e.g. first render before the API responds).
 */
export const selectHomeRunningBatches = createSelector(
  [selectFetchedBatchList],
  (fetchedBatches) => {
    const running = buildRunningBatches(fetchedBatches);
    return running.length ? running : HOME_FALLBACK_BATCHES;
  }
);

/**
 * Derives faculty members from populated batch data.
 * Falls back to static placeholders when no staff data is available.
 */
export const selectHomeFacultyMembers = createSelector(
  [selectFetchedBatchList],
  (fetchedBatches) => {
    const faculty = buildFacultyFromBatches(fetchedBatches);
    return faculty.length ? faculty.slice(0, 8) : HOME_FALLBACK_FACULTY;
  }
);
