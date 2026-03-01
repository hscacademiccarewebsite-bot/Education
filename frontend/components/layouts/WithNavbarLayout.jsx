import Navbar from "@/components/Navbar";

export default function WithNavbarLayout({ children }) {
  return (
    <main className="min-h-screen bg-[#f8faf9] text-slate-900">
      <Navbar />
      {/* pt-16 md:pt-[72px] compensates for the fixed Navbar height */}
      <div className="pt-16 md:pt-[72px]">{children}</div>
    </main>
  );
}
