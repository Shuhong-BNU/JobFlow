import 'server-only';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

/**
 * 在 RSC / Server Action / Route Handler 中读取当前 locale。
 * 优先 cookie，否则回退默认 locale。
 */
export function getLocale(): Locale {
  const cookie = cookies().get(LOCALE_COOKIE)?.value;
  return normalizeLocale(cookie);
}

export function getServerDictionary(): Dictionary {
  return getDictionary(getLocale());
}
