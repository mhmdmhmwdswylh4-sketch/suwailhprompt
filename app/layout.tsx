import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import Navbar from "@/components/navbar";
import Aurora from "@/components/ui/aurora";
import ScrollProgress from "@/components/ui/scroll-progress";
import { dirOf, isLang, LANG_COOKIE, type Lang } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SUWAILIH PROMPT — Engineer Better Prompts", template: "%s · SUWAILIH PROMPT" },
  description: "Turn simple ideas into powerful, structured prompts with AI-powered prompt engineering. حوّل فكرتك إلى برومبت احترافي.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#06070a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  const lang: Lang = isLang(c) ? c : "en";
  return (
    <html lang={lang} dir={dirOf(lang)} className={`${inter.variable} ${arabic.variable}`}>
      <body className="font-sans">
        <Providers initialLang={lang}>
          <Aurora />
          <ScrollProgress />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
