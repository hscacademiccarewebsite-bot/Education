"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "@/components/Avatar";
import { useCreateSharedNoteMutation, useUpdateSharedNoteMutation } from "@/lib/features/community/sharedNotesApi";
import { useSelector } from "react-redux";
import { selectCurrentUserDisplayName, selectCurrentUserPhotoUrl, selectCurrentUserRole } from "@/lib/features/user/userSlice";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import { useListBatchesQuery } from "@/lib/features/batch/batchApi";
import { useActionPopup } from "@/components/feedback/useActionPopup";

export default function CreateSharedNote({ 
  isOpen = false, 
  onClose = () => {},
  note = null
}) {
  const [title, setTitle] = useState("");
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [enrolledBatches, setEnrolledBatches] = useState([]);
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const privacyDropdownRef = useRef(null);

  const [createNote, { isLoading: isCreating }] = useCreateSharedNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateSharedNoteMutation();
  const { showSuccess, showError } = useActionPopup();

  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);
  const userRole = useSelector(selectCurrentUserRole);

  const isStaff = ["admin", "teacher", "moderator"].includes(userRole);

  const { data: myEnrollmentsData } = useGetMyEnrollmentRequestsQuery(undefined, { 
    skip: !isOpen || isStaff 
  });
  
  const { data: allBatchesData } = useListBatchesQuery({}, { 
    skip: !isOpen || !isStaff 
  });

  const availableCourses = isStaff 
    ? (allBatchesData?.data || [])
    : (myEnrollmentsData?.data?.filter(e => e.status === "approved").map(e => e.batch) || []);

  const isEditing = !!note;
  const isLoading = isCreating || isUpdating;

  // Initialize fields when editing
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setGoogleDriveLink(note.googleDriveLink || "");
      setDescription(note.description || "");
      setPrivacy(note.privacy || "public");
      setEnrolledBatches(note.enrolledBatches || []);
    } else {
      handleReset();
    }
  }, [note, isOpen]);

  // Close privacy dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(e.target)) {
        setShowPrivacyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !googleDriveLink.trim()) return;
    if (privacy === "enrolled_members" && enrolledBatches.length === 0) {
      showError("Please select at least one course to share with.");
      return;
    }

    try {
      if (isEditing) {
        await updateNote({
          noteId: note._id,
          title,
          googleDriveLink,
          description,
          privacy,
          enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
        }).unwrap();
        showSuccess("Note updated successfully.");
      } else {
        await createNote({
          title,
          googleDriveLink,
          description,
          privacy,
          enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
        }).unwrap();
        showSuccess("Note shared successfully.");
      }
      handleClose();
    } catch (err) {
      console.error("Failed to save note:", err);
      showError(err?.data?.message || `Failed to ${isEditing ? "update" : "share"} note. Please try again.`);
    }
  };

  const handleReset = () => {
    setTitle("");
    setGoogleDriveLink("");
    setDescription("");
    setPrivacy("public");
    setEnrolledBatches([]);
    setShowPrivacyDropdown(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 h-screen w-screen bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-[540px] rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-scale-in border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="w-8" />
          <h2 className="font-display text-[16px] lg:text-[18px] font-bold tracking-tight text-[#147b79]">
            {isEditing ? "Edit Shared Note" : "Share New Note"}
          </h2>
          <button 
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar src={userPhotoUrl} name={userDisplayName} className="h-11 w-11 rounded-full ring-2 ring-slate-50 shadow-sm" />
              <div>
                <p className="font-display text-[15px] font-semibold text-slate-950">{userDisplayName}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 border border-emerald-100/50">
                    Shared Notes
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <div className="relative" ref={privacyDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                      className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {privacy === "public" ? "Public" : "Enrolled Members"}
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showPrivacyDropdown && (
                      <div className="absolute right-0 sm:right-auto sm:left-0 mt-1 w-52 max-w-[calc(100vw-80px)] rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 py-1 z-50">
                        <button
                          type="button"
                          onClick={() => {
                            setPrivacy("public");
                            setShowPrivacyDropdown(false);
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-800">Public</span>
                            <span className="text-[11px] text-slate-500">Anyone on the platform</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPrivacy("enrolled_members");
                            setShowPrivacyDropdown(false);
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-800">Enrolled Members</span>
                            <span className="text-[11px] text-slate-500">Peers in your courses</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {privacy === "enrolled_members" && (
              <div className="mb-2 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-[12px] font-bold text-slate-700 mb-2">Select courses to share with:</p>
                {availableCourses.length === 0 ? (
                  <p className="text-[12px] text-slate-500">No courses available to share with.</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                    {availableCourses.map((course) => (
                      <label key={course?._id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={enrolledBatches.includes(course?._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEnrolledBatches([...enrolledBatches, course?._id]);
                            } else {
                              setEnrolledBatches(enrolledBatches.filter(id => id !== course?._id));
                            }
                          }}
                          className="w-4 h-4 rounded text-[#147b79] border-slate-300 focus:ring-[#147b79]"
                        />
                        <span className="text-[13px] text-slate-700 group-hover:text-slate-900 line-clamp-1 flex-1">
                          {course?.name || "Unknown Course"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700 ml-1">Note Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Biology Chapter 4 Summary"
                  className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-[14px] font-medium text-slate-950 placeholder:text-slate-400 focus:border-[#147b79] focus:ring-[#147b79]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700 ml-1">Google Drive Link</label>
                <input
                  type="url"
                  value={googleDriveLink}
                  onChange={(e) => setGoogleDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-[14px] font-medium text-slate-950 placeholder:text-slate-400 focus:border-[#147b79] focus:ring-[#147b79]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700 ml-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide some context about these notes..."
                  className="w-full min-h-[100px] resize-none rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-[14px] font-medium text-slate-950 placeholder:text-slate-400 focus:border-[#147b79] focus:ring-[#147b79]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !title.trim() || !googleDriveLink.trim()}
              className="site-button-primary mt-4 w-full !py-2.5 !text-[12px] font-bold disabled:!opacity-50 tracking-wide"
            >
              {isLoading ? (isEditing ? "Updating..." : "Sharing...") : (isEditing ? "Update Note" : "Share Note")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
