"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "@/components/Avatar";
import { useCreatePostMutation, useUpdatePostMutation } from "@/lib/features/community/communityApi";
import { useSelector } from "react-redux";
import {
  selectCurrentUserDisplayName,
  selectCurrentUserPhotoUrl,
} from "@/lib/features/user/userSlice";
import { useGetMyEnrollmentRequestsQuery } from "@/lib/features/enrollment/enrollmentApi";
import ImageUploadField from "@/components/uploads/ImageUploadField";

export default function CreatePost({ 
  post = null, 
  isOpen = false, 
  onClose = () => {}, 
  isTriggerVisible = true 
}) {
  const isEditMode = !!post;
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [privacy, setPrivacy] = useState("public");
  const [enrolledBatches, setEnrolledBatches] = useState([]);
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const privacyDropdownRef = useRef(null);


  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const textareaRef = useRef(null);

  const userDisplayName = useSelector(selectCurrentUserDisplayName);
  const userPhotoUrl = useSelector(selectCurrentUserPhotoUrl);

  const activeIsOpen = post ? isOpen : (isTriggerVisible ? localIsOpen : isOpen);
  
  const { data: myEnrollmentsData } = useGetMyEnrollmentRequestsQuery(undefined, { skip: !activeIsOpen });
  const approvedEnrollments = myEnrollmentsData?.data?.filter(e => e.status === "approved") || [];
  const activeIsLoading = isCreating || isUpdating;

  useEffect(() => {
    if (post) {
      setContent(post.content || "");
      setPrivacy(post.privacy || "public");
      setEnrolledBatches(post.enrolledBatches || []);
      if (post.images && post.images.length > 0) {
        setImage(post.images[0]);
        setShowImageUpload(true);
      }
    }
  }, [post, isOpen]);

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
    if (!content.trim() && !image) return;
    if (privacy === "enrolled_members" && enrolledBatches.length === 0) {
      alert("Please select at least one course to share with.");
      return;
    }

    try {
      if (isEditMode) {
        await updatePost({
          postId: post._id,
          content,
          privacy,
          enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
          images: image ? [image] : [],
        }).unwrap();
      } else {
        await createPost({
          content,
          privacy,
          enrolledBatches: privacy === "enrolled_members" ? enrolledBatches : [],
          images: image ? [image] : [],
        }).unwrap();
      }
      handleClose();
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} post:`, err);
    }
  };

  const handleClose = () => {
    if (post) {
      onClose();
    } else {
      setLocalIsOpen(false);
      setContent("");
      setImage(null);
      setPrivacy("public");
      setEnrolledBatches([]);
      setShowImageUpload(false);
      setShowPrivacyDropdown(false);
    }
  };

  const handleOpen = () => {
    if (!post) setLocalIsOpen(true);
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (activeIsOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeIsOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (activeIsOpen && textareaRef.current) {
      textareaRef.current.style.height = "150px"; 
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.max(150, scrollHeight) + "px";
    }
  }, [content, activeIsOpen, showImageUpload]);


  return (
    <>
      {/* Trigger Bar - Only visible if not in edit mode and specifically requested */}
      {!isEditMode && isTriggerVisible && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={userPhotoUrl} name={userDisplayName} className="h-11 w-11 rounded-full border-2 border-white ring-1 ring-slate-100" />
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <button
              onClick={handleOpen}
              className="flex-1 rounded-full bg-slate-50 px-5 py-3 text-left text-[15px] font-medium text-slate-500 transition-all hover:bg-slate-100/80 active:scale-[0.99]"
            >
              {`What's on your mind, ${userDisplayName?.split(" ")[0]}?`}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-50 pt-3">
            <button
              onClick={() => {
                handleOpen();
                setShowImageUpload(true);
              }}
              className="group flex flex-1 items-center justify-center gap-3 rounded-xl py-2.5 text-[14px] font-bold text-slate-600 transition-all hover:bg-slate-50 active:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Professional Modal */}
      {activeIsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={handleClose}
          />
          
          <div className="relative w-full max-w-[540px] rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-scale-in border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="w-8" />
              <h2 className="font-display text-[20px] font-black tracking-tight text-[#147b79]">
                {isEditMode ? "Edit Post" : "Create Post"}
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
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 mb-5">
                  <Avatar src={userPhotoUrl} name={userDisplayName} className="h-11 w-11 rounded-full ring-2 ring-slate-50 shadow-sm" />
                  <div>
                    <p className="font-display text-[16px] font-bold text-slate-950">{userDisplayName}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" />
                        </svg>
                        Community
                      </div>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <div className="relative" ref={privacyDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                          className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          {privacy === "public" ? (
                            <>
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                              </svg>
                              Public
                            </>
                          ) : (
                            <>
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                              </svg>
                              Enrolled Members
                            </>
                          )}
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {showPrivacyDropdown && (
                          <div className="absolute left-0 mt-1 w-52 rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-200 py-1 z-50">
                            <button
                              type="button"
                              onClick={() => {
                                setPrivacy("public");
                                setShowPrivacyDropdown(false);
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">Public</span>
                                <span className="text-[11px] text-slate-500">Anyone on the platform</span>
                              </div>
                              {privacy === "public" && (
                                <svg className="h-4 w-4 text-[#0866FF] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPrivacy("enrolled_members");
                                setShowPrivacyDropdown(false);
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-slate-800">Enrolled Members</span>
                                <span className="text-[11px] text-slate-500">Peers in your courses</span>
                              </div>
                              {privacy === "enrolled_members" && (
                                <svg className="h-4 w-4 text-[#0866FF] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course Selection block if Enrolled Members is chosen */}
                {privacy === "enrolled_members" && (
                  <div className="mb-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[12px] font-bold text-slate-700 mb-2">Select courses to share with:</p>
                    {approvedEnrollments.length === 0 ? (
                      <p className="text-[12px] text-slate-500">You are not approved in any courses yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {approvedEnrollments.map((enrollment) => (
                          <label key={enrollment.batch?._id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={enrolledBatches.includes(enrollment.batch?._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEnrolledBatches([...enrolledBatches, enrollment.batch?._id]);
                                } else {
                                  setEnrolledBatches(enrolledBatches.filter(id => id !== enrollment.batch?._id));
                                }
                              }}
                              className="w-4 h-4 rounded text-[#147b79] border-slate-300 focus:ring-[#147b79]"
                            />
                            <span className="text-[13px] text-slate-700 group-hover:text-slate-900 line-clamp-1 flex-1">
                              {enrollment.batch?.subject?.subName} - {enrollment.batch?.batchName}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`What's on your mind, ${userDisplayName?.split(" ")[0]}?`}
                  className="w-full resize-none border-none px-4 py-4 text-[17px] font-normal text-slate-950 placeholder:text-slate-400 focus:ring-0 leading-[1.6]"
                  autoFocus
                />
                
                {showImageUpload && (
                  <div className="mt-5 relative rounded-2xl border-2 border-dashed border-slate-200 p-2 group transition-all hover:border-emerald-200">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowImageUpload(false);
                        setImage(null);
                      }}
                      className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-slate-500 hover:text-slate-900"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <ImageUploadField
                      asset={image}
                      onChange={setImage}
                      folder="community-posts"
                    />
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                  <span className="text-[14px] font-bold text-slate-800">Add to your post</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowImageUpload(true)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                        showImageUpload ? "bg-emerald-50 text-emerald-600" : "hover:bg-slate-50 text-emerald-500"
                      }`}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={activeIsLoading || (!content.trim() && !image)}
                  className="site-button-primary mt-5 w-full !py-3.5 !text-[14px] disabled:!opacity-50"
                >
                  {activeIsLoading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      <span>{isEditMode ? "Updating..." : "Posting..."}</span>
                    </div>
                  ) : (
                    isEditMode ? "Save Changes" : "Post"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
