import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "HSC Academic & Admission Care",
  description: "Educational platform for batch learning, admissions, and payments",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-slate-900 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
