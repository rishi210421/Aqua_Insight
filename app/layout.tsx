import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppFooter, AppHeader } from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AquaInsight — From stream data to One Health intelligence",
    template: "%s · AquaInsight",
  },
  description:
    "Transform citizen observations and environmental indicators into maps, trends, comparisons and evidence-based ecosystem insights.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <AppHeader />
          <main className="flex-1">{children}</main>
          <AppFooter />
        </Providers>
      </body>
    </html>
  );
}
