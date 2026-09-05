import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne, Geist_Mono } from "next/font/google";
import { IkigaiProvider } from "@/components/providers/ikigai-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
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

export const viewport: Viewport = {
  themeColor: "#0d5c63",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  applicationName: "Ikigai",
  title: {
    default: "Ikigai 2.0",
    template: "%s · Ikigai 2.0",
  },
  description:
    "A private purpose map: what you want, skills you have and lack, how you want to be rewarded, and what you’ll deliver.",
  appleWebApp: {
    capable: true,
    title: "Ikigai",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${syne.variable} ${geistMono.variable} antialiased`}
      >
        <IkigaiProvider>
          <AppShell>{children}</AppShell>
        </IkigaiProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
