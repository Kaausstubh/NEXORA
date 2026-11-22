import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA – AI Career Intelligence Platform",
  description: "Find Your Fit. Build Your Future. Next-generation semantic job discovery, candidate vector embedding, and hybrid career intelligence.",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-ivory text-charcoal font-body antialiased selection:bg-lime selection:text-charcoal">
        {children}
      </body>
    </html>
  );
}
