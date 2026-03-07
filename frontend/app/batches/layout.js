import WithNavbarLayout from "@/components/layouts/WithNavbarLayout";
import RequireAuth from "@/components/RequireAuth";
import { ROLES } from "@/lib/utils/roleUtils";

const COURSE_ALLOWED_ROLES = [ROLES.ADMIN, ROLES.TEACHER, ROLES.MODERATOR, ROLES.STUDENT];

export default function SegmentLayout({ children }) {
  return (
    <WithNavbarLayout>
      <RequireAuth allowedRoles={COURSE_ALLOWED_ROLES}>{children}</RequireAuth>
    </WithNavbarLayout>
  );
}
