import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/layouts/SiteFooter";

export default function WithNavbarLayout({ children }) {
  return (
    <main className="site-shell min-h-screen text-slate-900">
      <div className="site-nav-offset">{children}</div>
      <SiteFooter />
    </main>
  );
}
