export default function RoleBadge({ role }) {
  const isVerified = ["admin", "teacher", "moderator"].includes(role?.toLowerCase());

  if (!isVerified) return null;

  return (
    <span className="inline-flex items-center ml-1" title={role}>
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0866FF] shadow-sm">
        <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </span>
  );
}



