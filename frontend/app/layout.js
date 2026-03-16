import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import MotionLayout from "@/components/motion/MotionLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata = {
  title: "HSC Academic and Admission Care",
  description: "Educational platform for batch learning, admissions, and payments",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans text-slate-900 antialiased" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <MotionLayout>
            {children}
          </MotionLayout>
        </Providers>
      </body>
    </html>
  );
}
