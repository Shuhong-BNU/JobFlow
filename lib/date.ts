import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import type { Locale as I18nLocale } from './i18n/config';

const DATE_FNS_LOCALES = { zh: zhCN, en: enUS } as const;

const DEFAULT_FMT_BY_LOCALE: Record<I18nLocale, string> = {
  zh: 'yyyy年M月d日',
  en: 'MMM d, yyyy',
};

const DATETIME_FMT_BY_LOCALE: Record<I18nLocale, string> = {
  zh: 'yyyy年M月d日 HH:mm',
  en: 'MMM d, yyyy HH:mm',
};

const SHORT_FMT_BY_LOCALE: Record<I18nLocale, string> = {
  zh: 'M月d日',
  en: 'MMM d',
};

/** 按当前语言格式化日期。 */
export function formatDate(
  d: Date | string | null | undefined,
  fmt?: string,
  locale: I18nLocale = 'en'
) {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, fmt ?? DEFAULT_FMT_BY_LOCALE[locale], {
    locale: DATE_FNS_LOCALES[locale],
  });
}

export function formatDateTime(
  d: Date | string | null | undefined,
  locale: I18nLocale = 'en'
) {
  return formatDate(d, DATETIME_FMT_BY_LOCALE[locale], locale);
}

/** 卡片和表格里使用的短日期格式。 */
export function formatDateShort(
  d: Date | string | null | undefined,
  locale: I18nLocale = 'en'
) {
  return formatDate(d, SHORT_FMT_BY_LOCALE[locale], locale);
}

export function relativeFromNow(
  d: Date | string | null | undefined,
  locale: I18nLocale = 'en'
) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isToday(date)) return locale === 'zh' ? '今天' : 'Today';
  if (isTomorrow(date)) return locale === 'zh' ? '明天' : 'Tomorrow';
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: DATE_FNS_LOCALES[locale],
  });
}

export function isOverdue(d: Date | string | null | undefined) {
  if (!d) return false;
  const date = typeof d === 'string' ? new Date(d) : d;
  return isPast(date) && !isToday(date);
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
