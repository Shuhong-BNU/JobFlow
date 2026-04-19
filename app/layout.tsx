import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { getAppLocale, getHtmlLang } from "@/lib/i18n";

const locale = getAppLocale();

export const metadata: Metadata = {
  title: {
    default: "JobFlow",
    template: "%s | JobFlow",
  },
  description:
    locale === "en"
      ? "A job application management board for recruiting season, helping you track roles, deadlines, progress, and risks in one place."
      : "面向求职季的申请流程管理看板，帮助你统一管理岗位、截止日期、进度与风险。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={getHtmlLang(locale)} suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
