export default function RoleBadge({ role }) {
  const roleLabel = role?.toUpperCase() || "UNKNOWN";

  const roleColorMap = {
    admin: "bg-rose-100 text-rose-700 border-rose-200",
    teacher: "bg-sky-100 text-sky-700 border-sky-200",
    moderator: "bg-indigo-100 text-indigo-700 border-indigo-200",
    student: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const classes = roleColorMap[role] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}>
      {roleLabel}
    </span>
  );
}
