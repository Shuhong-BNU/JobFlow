/**
 * 轻量 i18n 配置：cookie 存 locale，无路由前缀。
 * 默认中文。
 */

export const LOCALES = ['zh', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh';
export const LOCALE_COOKIE = 'jobflow_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  zh: 'zh-CN',
  en: 'en',
};

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};
