import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DialogProvider } from "@/components/DialogProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SupabaseBootstrap } from "@/components/SupabaseBootstrap";
import { ThemeFavicon } from "@/components/ThemeFavicon";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  title: "RAM Informatica — Tecnologia al mejor precio",
  description:
    "MacBooks, iPhone, Xiaomi, Motorola, drones, TVs y más. Precios claros y buena atención.",
  icons: {
    icon: [
      { url: "/favicon/favicon-light.png", type: "image/png" },
      {
        url: "/favicon/favicon-light.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/favicon-dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <ThemeFavicon />
          <DialogProvider>
            <SupabaseBootstrap />
            <ScrollToTop />
            {children}
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
