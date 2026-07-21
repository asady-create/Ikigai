import type { Metadata } from "next";
import { DM_Sans, Syne, Geist_Mono } from "next/font/google";
import { IkigaiProvider } from "@/components/providers/ikigai-provider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ikigai — Know what you want",
    template: "%s · Ikigai",
  },
  description:
    "A personal purpose-discovery and reflection tool. The world is malleable — pursue what you want with maximum energy.",
  keywords: [
    "ikigai",
    "purpose",
    "reflection",
    "marc andreessen",
    "career",
    "journal",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${syne.variable} ${geistMono.variable} antialiased`}
      >
        <IkigaiProvider>
          <AppShell>{children}</AppShell>
        </IkigaiProvider>
      </body>
    </html>
  );
}
