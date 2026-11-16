import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransitionProvider from "@/components/PageTransition";
import CustomCursor from "@/components/CustomCursor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "kobrat",
  description: "A collective of eight friends creating intuitive digital experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-[#0c0c0c] flex flex-col font-sans selection:bg-[#0c0c0c] selection:text-white">
        <PageTransitionProvider>
          <CustomCursor />
          <SmoothScroll>{children}</SmoothScroll>
        </PageTransitionProvider>
      </body>
    </html>
  );
}
