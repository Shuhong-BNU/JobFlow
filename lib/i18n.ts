export type AppLocale = "zh-CN" | "en";

export function resolveAppLocale(input?: string | null): AppLocale {
  if (input?.toLowerCase().startsWith("en")) {
    return "en";
  }

  return "zh-CN";
}

export function getAppLocale(): AppLocale {
  return resolveAppLocale(process.env.NEXT_PUBLIC_APP_LOCALE);
}

export function getHtmlLang(locale: AppLocale = getAppLocale()) {
  return locale === "en" ? "en" : "zh-CN";
}

